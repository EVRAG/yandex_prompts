import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis, redisSubscriber } from './redisClient';
import { loadStateFromRedis, getState, setState, addPlayer, getPlayer, setStage, setStageStatus, getCurrentStage, addSubmission, getSubmissionsForStage, resetState, Player, updateSubmission, getStateVersion } from './gameState';
import { moderateNickname } from './services/nicknameModeration';
import { scoreQueue } from './queue/scoreQueue';
import { Queue } from 'bullmq';
import { gameConfig } from '@prompt-night/shared';

import { rateLimit } from 'express-rate-limit';
import { log } from './logger';
import { join } from 'path';

// Загружаем .env из корня проекта (на уровень выше от server/)
// В скомпилированном коде __dirname будет server/dist, поэтому идем на 2 уровня выше
// В dev режиме с ts-node-dev __dirname будет server/src, поэтому тоже на 2 уровня выше
dotenv.config({ path: join(__dirname, '../../.env') });

// Проверка загрузки переменных (только для отладки)
if (process.env.NODE_ENV !== 'production') {
  console.log('[env] YANDEX_API_KEY:', process.env.YANDEX_API_KEY ? `SET (${process.env.YANDEX_API_KEY.length} chars)` : 'NOT SET');
  console.log('[env] YANDEX_FOLDER_ID:', process.env.YANDEX_FOLDER_ID || 'NOT SET');
}

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

// Subscribe to state changes from workers (for real-time leaderboard updates)
redisSubscriber.subscribe('state:changed', (err) => {
  if (err) {
    console.error('[redis] Failed to subscribe to state:changed', err);
  } else {
    console.log('[redis] Subscribed to state:changed channel');
  }
});

redisSubscriber.on('message', (channel, message) => {
  if (channel === 'state:changed') {
    // Reload state from Redis to get latest scores
    loadStateFromRedis().then(() => {
      // Broadcast updated state to all clients
      broadcastState();
    });
  }
});

// --- HTTP Routes ---

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/config', (req, res) => {
  res.json(gameConfig);
});

app.get('/state', (req, res) => {
  const state = getState();
  const currentStage = getCurrentStage();
  const leaderboard = Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  res.json({
    version: getStateVersion(),
    currentStage,
    playerCount: Object.keys(state.players).length,
    leaderboard,
    players: state.players,
    submissions: state.submissions,
  });
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
  const version = getStateVersion();
  
  // Calculate leaderboard (sorted by score)
  const leaderboard = Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100); // Top 100
  
  // Public state for players (limited info)
  // Note: currentPlayer is sent per-socket in connection handler, not in broadcast
  const publicState = {
    currentStage,
    playerCount: Object.keys(state.players).length,
    version,
    leaderboard, // Include leaderboard for players too
  };

  // Full state for admin and display (includes all players and submissions)
  const fullState = {
    ...state,
    currentStage,
    version,
    leaderboard,
  };

  // For players, send personalized state with their current score and their submission for current stage
  playerIo.sockets.forEach((socket) => {
    const { playerId } = socket.handshake.auth;
    if (playerId) {
      const player = getPlayer(playerId);
      if (player) {
        // Find player's submission for current stage
        const playerSubmission = state.submissions.find(
          s => s.playerId === playerId && s.stageId === currentStage.id
        );
        
        socket.emit('state:update', {
          ...publicState,
          currentPlayer: { id: player.id, name: player.name, score: player.score },
          submissions: playerSubmission ? [playerSubmission] : [], // Send only player's submission for current stage
        });
      } else {
        socket.emit('state:update', publicState);
      }
    } else {
      socket.emit('state:update', publicState);
    }
  });
  
  displayIo.emit('state:update', fullState); // Display gets full state including scores
  adminIo.emit('state:update', fullState);   // Admin gets full state
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
  
  let currentPlayer = null;
  if (playerId && getPlayer(playerId)) {
    socket.join(playerId);
    // Mark online
    currentPlayer = getPlayer(playerId);
    if (currentPlayer) currentPlayer.isOnline = true;
  }

  socket.emit('config', gameConfig);
  
  const state = getState();
  const currentStage = getCurrentStage();
  const leaderboard = Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);
  const version = getStateVersion();
  
  // Find player's submission for current stage if player exists
  const playerSubmission = currentPlayer ? state.submissions.find(
    s => s.playerId === currentPlayer.id && s.stageId === currentStage.id
  ) : undefined;
  
  socket.emit('state:update', { 
    currentStage, 
    playerCount: Object.keys(state.players).length,
    leaderboard,
    version,
    currentPlayer: currentPlayer ? { id: currentPlayer.id, name: currentPlayer.name, score: currentPlayer.score } : undefined,
    submissions: playerSubmission ? [playerSubmission] : [],
  });

  socket.on('register', async ({ name }) => {
    // Double check moderation just in case? Or assume client did it via REST?
    // Client should do REST for better UX (loading state), then connect socket.
    // But we can do it here too.
    const newPlayerId = `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newPlayer = addPlayer(newPlayerId, name);
    socket.emit('registered', { playerId: newPlayerId });
    socket.join(newPlayerId);
    
    // Send updated state with current player info
    const state = getState();
    const currentStage = getCurrentStage();
    const leaderboard = Object.values(state.players)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
    const version = getStateVersion();
    
    // Find player's submission for current stage
    const playerSubmission = state.submissions.find(
      s => s.playerId === newPlayerId && s.stageId === currentStage.id
    );
    
    socket.emit('state:update', {
      currentStage,
      playerCount: Object.keys(state.players).length,
      leaderboard,
      version,
      currentPlayer: { id: newPlayer.id, name: newPlayer.name, score: newPlayer.score },
      submissions: playerSubmission ? [playerSubmission] : [],
    });
    
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
    
    // If question has options, score locally (no LLM): correct => +10, else 0
    if (stage.answerOptions && stage.answerOptions.length > 0) {
      const matched = stage.answerOptions.find(opt => opt.text === answer);
      const isCorrect = matched?.isCorrect === true;
      const score = isCorrect ? 10 : 0;
      const feedback = isCorrect ? 'Верно!' : 'Не верно!';
      updateSubmission(submission.id, { score, feedback });
    } else if (stage.questionText && stage.referenceAnswer) {
      // Trigger scoring via LLM for text questions
      scoreQueue.add('score', {
        submissionId: submission.id,
        questionText: stage.questionText,
        referenceAnswer: stage.referenceAnswer,
        participantAnswer: answer,
        playerId: pid,
      }, {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2s delay, then 4s, 8s...
        },
      });
    }
    
    // Update current player's state for this socket
    const updatedPlayer = getPlayer(pid);
    if (updatedPlayer) {
      const state = getState();
      const currentStage = getCurrentStage();
      const leaderboard = Object.values(state.players)
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);
      const version = getStateVersion();
      
      // Find player's submission for current stage
      const playerSubmission = state.submissions.find(
        s => s.playerId === pid && s.stageId === currentStage.id
      );
      
      socket.emit('state:update', {
        currentStage,
        playerCount: Object.keys(state.players).length,
        leaderboard,
        version,
        currentPlayer: { id: updatedPlayer.id, name: updatedPlayer.name, score: updatedPlayer.score },
        submissions: playerSubmission ? [playerSubmission] : [], // Send only player's submission for current stage
      });
    }
    
    broadcastState();
    socket.emit('submitted', { success: true, stageId: stage.id });
  });
});

// Admin Connection
adminIo.on('connection', (socket) => {
  const { secret } = socket.handshake.auth;
  const expectedSecret = process.env.ADMIN_SECRET;
  console.log('[admin] Connection attempt, secret provided:', !!secret);
  console.log('[admin] Secret length:', secret?.length || 0, 'Expected length:', expectedSecret?.length || 0);
  console.log('[admin] Secrets match:', secret === expectedSecret);
  
  if (secret !== expectedSecret) {
    console.log('[admin] Invalid secret, disconnecting');
    console.log('[admin] Received:', secret);
    console.log('[admin] Expected:', expectedSecret);
    socket.disconnect();
    return;
  }

  console.log('[admin] Authenticated, sending initial state');
  
  // Send config first
  socket.emit('config', gameConfig);
  
  // Then send state
  const currentState = getState();
  const currentStage = getCurrentStage();
  socket.emit('state:update', { 
    ...currentState, 
    currentStage,
    version: getStateVersion(),
    playerCount: Object.keys(currentState.players).length,
  });

  socket.on('stage:set', (stageId) => {
    setStage(stageId);
    broadcastState();
  });

  socket.on('stage:status', (status) => {
    setStageStatus(status);
    broadcastState();
  });

  socket.on('reset', async () => {
    console.log('[admin] Reset requested');
    
    // Clear scoring queue
    try {
      await scoreQueue.obliterate({ force: true });
      console.log('[admin] Scoring queue cleared');
    } catch (err) {
      console.error('[admin] Failed to clear queue:', err);
    }
    
    // Reset game state (this clears all players, submissions, scores)
    resetState();
    
    // Broadcast reset state to all clients
    // Send special reset event to players so they clear localStorage
    playerIo.emit('reset', { message: 'Game reset, please re-register' });
    
    broadcastState();
    
    socket.emit('reset:complete', { success: true });
  });
});

// Display Connection
displayIo.on('connection', (socket) => {
  socket.emit('state:update', { ...getState(), currentStage: getCurrentStage(), version: getStateVersion() });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
