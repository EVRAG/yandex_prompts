import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis, redisSubscriber } from './redisClient';
import { loadStateFromRedis, getState, setState, addPlayer, getPlayer, setStage, setStageStatus, getCurrentStage, addSubmission, getSubmissionsForStage, Player } from './gameState';
import { moderateNickname } from './services/nicknameModeration';
import { scoreQueue } from './queue/scoreQueue';
import { gameConfig } from '@prompt-night/shared';

import { rateLimit } from 'express-rate-limit';
import { log } from './logger';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 2000, // Increased limit for venue IP sharing (NAT)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all for now, lock down later
  },
  adapter: createAdapter(redis, redisSubscriber),
});

// Load state on boot
loadStateFromRedis();

// --- HTTP Routes ---

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/config', (req, res) => {
  res.json(gameConfig);
});

app.post('/moderate/nickname', async (req, res) => {
  const { nickname } = req.body;
  if (!nickname || typeof nickname !== 'string') {
    res.status(400).json({ error: 'Invalid nickname' });
    return;
  }
  const result = await moderateNickname(nickname);
  res.json(result);
});

// --- Socket.IO ---

// Namespaces
const playerIo = io.of('/player');
const adminIo = io.of('/admin');
const displayIo = io.of('/display');

// Helper to broadcast state
function broadcastState() {
  const state = getState();
  const currentStage = getCurrentStage();
  
  // Public state (sanitized? for now full state is okay for display, maybe filtered for players)
  const publicState = {
    currentStage,
    // players: state.players, // Maybe too heavy to send all? Send count?
    playerCount: Object.keys(state.players).length,
    // submissions: state.submissions.length, 
    // We can send specific data per namespace
  };

  playerIo.emit('state:update', publicState);
  displayIo.emit('state:update', { ...state, currentStage }); // Display gets full state including scores
  adminIo.emit('state:update', { ...state, currentStage });   // Admin gets full state
}

// Timer Loop
setInterval(() => {
  const state = getState();
  const currentStage = getCurrentStage();
  
  if (currentStage.type === 'question' && currentStage.status === 'active' && currentStage.timeLimitSeconds && currentStage.startTime) {
    const elapsed = (Date.now() - currentStage.startTime) / 1000;
    if (elapsed >= currentStage.timeLimitSeconds) {
      setStageStatus('locked');
      broadcastState();
    }
  }
}, 1000);

// Player Connection
playerIo.on('connection', (socket) => {
  const { playerId, token } = socket.handshake.auth;
  // If player reconnects with ID, we check if they exist.
  // Ideally we validate a token. For this simplified version, we trust the ID if it exists in Redis.
  
  if (playerId && getPlayer(playerId)) {
    socket.join(playerId);
    // Mark online
    const player = getPlayer(playerId);
    if (player) player.isOnline = true;
  }

  socket.emit('config', gameConfig);
  socket.emit('state:update', { currentStage: getCurrentStage(), playerCount: Object.keys(getState().players).length });

  socket.on('register', async ({ name }) => {
    // Double check moderation just in case? Or assume client did it via REST?
    // Client should do REST for better UX (loading state), then connect socket.
    // But we can do it here too.
    const newPlayerId = `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    addPlayer(newPlayerId, name);
    socket.emit('registered', { playerId: newPlayerId });
    socket.join(newPlayerId);
    broadcastState();
  });

  socket.on('submit', ({ answer }) => {
    // Check if stage is active question
    const stage = getCurrentStage();
    if (stage.type !== 'question' || stage.status !== 'active') {
      return socket.emit('error', 'Question not active');
    }
    
    // Check if already submitted
    // Need to know which player this is.
    // We can store playerId in socket data after registration/handshake
    // For now assuming we passed it in auth or stored in closure (which is risky if not careful)
    // Let's use the handshake auth id if valid
    const pid = playerId; 
    if (!pid || !getPlayer(pid)) return socket.emit('error', 'Not registered');

    const submissions = getSubmissionsForStage(stage.id);
    if (submissions.find(s => s.playerId === pid)) {
      return socket.emit('error', 'Already submitted');
    }

    const submission = {
      id: `s-${Date.now()}`,
      playerId: pid,
      stageId: stage.id,
      answer,
      createdAt: Date.now(),
    };
    addSubmission(submission);
    
    // Trigger scoring if stage has reference answer/question
    if (stage.questionText && stage.referenceAnswer) {
      scoreQueue.add('score', {
        submissionId: submission.id,
        questionText: stage.questionText,
        referenceAnswer: stage.referenceAnswer,
        participantAnswer: answer,
        playerId: pid, // Pass player ID if needed by worker (though state update handles it via submission lookup if we wanted, but passing is safer)
      });
    }
    
    broadcastState();
    socket.emit('submitted', { success: true });
  });
});

// Admin Connection
adminIo.on('connection', (socket) => {
  const { secret } = socket.handshake.auth;
  if (secret !== process.env.ADMIN_SECRET) {
    socket.disconnect();
    return;
  }

  socket.emit('state:update', { ...getState(), currentStage: getCurrentStage() });

  socket.on('stage:set', (stageId) => {
    setStage(stageId);
    broadcastState();
  });

  socket.on('stage:status', (status) => {
    setStageStatus(status);
    broadcastState();
  });
});

// Display Connection
displayIo.on('connection', (socket) => {
  socket.emit('state:update', { ...getState(), currentStage: getCurrentStage() });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
