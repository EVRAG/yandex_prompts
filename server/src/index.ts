import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { VotingStateManager } from './gameState';
import type { VotingPhase } from '@prompt-night/shared';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const stateManager = new VotingStateManager();

type SocketRole = 'client' | 'admin' | 'display';

const isVotingPhase = (value: unknown): value is VotingPhase => {
  return value === 'waiting' || value === 'voting' || value === 'collecting';
};

const emitState = () => {
  io.to('admin').emit('state:update', stateManager.getAdminSnapshot());
  const publicSnapshot = stateManager.getPublicSnapshot();
  io.to('client').emit('state:update', publicSnapshot);
  io.to('display').emit('state:update', publicSnapshot);
};

const emitAdminUpdate = () => {
  io.to('admin').emit('state:update', stateManager.getAdminSnapshot());
};

stateManager.onAutoCollect = emitState;

io.on('connection', socket => {
  const rawRole = socket.handshake.auth?.role ?? socket.handshake.query.role ?? 'client';
  const requestedRole = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const role: SocketRole = ['admin', 'display'].includes(requestedRole as SocketRole)
    ? (requestedRole as SocketRole)
    : 'client';

  socket.join(role);

  if (role === 'admin') {
    socket.emit('config:update', stateManager.getTask());
    socket.emit('state:update', stateManager.getAdminSnapshot());
  } else {
    socket.emit('config:update', stateManager.getTask());
    socket.emit('state:update', stateManager.getPublicSnapshot());
  }

  socket.on('player:vote', payload => {
    if (role !== 'client') return;
    const optionId = payload?.optionId as string | undefined;
    if (!optionId) {
      socket.emit('player:error', { message: 'Выберите вариант.' });
      return;
    }
    const result = stateManager.castVote(socket.id, optionId);
    if (!result.success) {
      socket.emit('player:error', { message: result.message ?? 'Не удалось засчитать голос.' });
      return;
    }
    socket.emit('player:voted', { optionId });
    emitAdminUpdate();
  });

  socket.on('admin:set-phase', payload => {
    if (role !== 'admin') return;
    const phase = payload?.phase as VotingPhase | undefined;
    if (!isVotingPhase(phase)) {
      socket.emit('admin:error', { message: 'Некорректный этап.' });
      return;
    }
    stateManager.setPhase(phase);
    emitState();
  });

  socket.on('admin:sync', () => {
    if (role !== 'admin') return;
    socket.emit('state:update', stateManager.getAdminSnapshot());
    socket.emit('config:update', stateManager.getTask());
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', updatedAt: Date.now() });
});

app.get('/config', (_req, res) => {
  res.json(stateManager.getTask());
});

app.get('/state', (_req, res) => {
  res.json(stateManager.getAdminSnapshot());
});

app.post('/admin/phase', (req, res) => {
  const { phase } = req.body ?? {};
  if (!isVotingPhase(phase)) {
    res.status(400).json({ message: 'phase must be waiting|voting|collecting' });
    return;
  }
  stateManager.setPhase(phase);
  emitState();
  res.json(stateManager.getAdminSnapshot());
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

