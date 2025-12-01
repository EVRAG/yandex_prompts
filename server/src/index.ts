import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameStateManager } from './gameState';
import { validateNickname } from './services/nicknameModeration';
import { scoreAnswer } from './services/answerScoring';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const stateManager = new GameStateManager();

type SocketRole = 'client' | 'admin' | 'display';

const emitState = () => {
  io.to('admin').emit('state:update', stateManager.getAdminSnapshot());
  io.to('client').emit('state:update', stateManager.getPublicSnapshot('clients'));
  io.to('display').emit('state:update', stateManager.getPublicSnapshot('display'));
};

io.on('connection', socket => {
  const rawRole = socket.handshake.auth?.role ?? socket.handshake.query.role ?? 'client';
  const requestedRole = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const role: SocketRole = ['admin', 'display'].includes(requestedRole as SocketRole)
    ? (requestedRole as SocketRole)
    : 'client';

  socket.join(role);

  if (role === 'admin') {
    socket.emit('config:update', stateManager.getConfig());
    socket.emit('state:update', stateManager.getAdminSnapshot());
  } else if (role === 'display') {
    socket.emit('config:update', stateManager.getConfig());
    socket.emit('state:update', stateManager.getPublicSnapshot('display'));
  } else {
    socket.emit('state:update', stateManager.getPublicSnapshot('clients'));
  }

  socket.on('player:register', payload => {
    if (role !== 'client') return;
    const name = (payload?.name ?? '').trim();
    const playerId = payload?.playerId as string | undefined;

    if (!name && !playerId) {
      socket.emit('player:error', { message: 'Имя обязательно для новых игроков.' });
      return;
    }

    const player = stateManager.registerPlayer(name, playerId, socket.id);
    socket.data.playerId = player.id;
    socket.emit('player:registered', player);
    socket.emit('state:update', stateManager.getPublicSnapshot('clients'));
    emitState();
  });

  socket.on('player:submit', async payload => {
    if (role !== 'client') return;
    const playerId = socket.data.playerId as string | undefined;
    if (!playerId) {
      socket.emit('player:error', { message: 'Сначала зарегистрируйтесь.' });
      return;
    }
    const stageId = payload?.stageId as string | undefined;
    const answer = (payload?.answer ?? '').toString();
    if (!stageId || !answer) {
      socket.emit('player:error', { message: 'Ответ не может быть пустым.' });
      return;
    }

    const stage = stateManager.getStageById(stageId);
    if (!stage || stage.kind !== 'question') {
      socket.emit('player:error', { message: 'Этот этап не принимает ответы.' });
      return;
    }
    const activeStageId = stateManager.getPublicSnapshot('clients').stageId;
    if (stageId !== activeStageId) {
      socket.emit('player:error', { message: 'Этот вопрос уже не активен.' });
      return;
    }

    const referenceAnswer = stage.answerKey;
    if (!referenceAnswer) {
      socket.emit('player:error', { message: 'Для этого вопроса не настроен ответ.' });
      return;
    }

    try {
      const scoring = await scoreAnswer({
        question: stage.content.prompt,
        reference: referenceAnswer,
        answer,
      });

      stateManager.incrementPlayerScore(playerId, scoring.score);
      const submission = stateManager.recordSubmission(playerId, stageId, answer, {
        score: scoring.score,
        notes: scoring.feedback,
        mode: 'llm',
      });
      if (!submission) {
        socket.emit('player:error', { message: 'Не удалось сохранить ответ.' });
        return;
      }

      socket.emit('player:submitted', {
        id: submission.id,
        stageId: submission.stageId,
        createdAt: submission.createdAt,
        score: scoring.score,
        notes: scoring.feedback,
      });
      emitState();
    } catch (err) {
      socket.emit('player:error', {
        message:
          err instanceof Error ? err.message : 'Не удалось рассчитать балл. Попробуйте ещё раз.',
      });
    }
  });

  socket.on('admin:set-stage', payload => {
    if (role !== 'admin') return;
    const target = payload?.target as SocketRole | undefined;
    const stageId = payload?.stageId as string | undefined;
    if (!target || !stageId || (target !== 'client' && target !== 'display')) {
      socket.emit('admin:error', { message: 'Некорректные параметры смены стейта.' });
      return;
    }

    try {
      stateManager.setStage(target === 'client' ? 'clients' : 'display', stageId);
      emitState();
    } catch (error) {
      socket.emit('admin:error', { message: (error as Error).message });
    }
  });

  socket.on('admin:update-score', payload => {
    if (role !== 'admin') return;
    const playerId = payload?.playerId as string | undefined;
    const score = payload?.score as number | undefined;
    if (!playerId || typeof score !== 'number') {
      socket.emit('admin:error', { message: 'Неверные данные для обновления очков.' });
      return;
    }
    stateManager.updatePlayerScore(playerId, score);
    emitState();
  });

  socket.on('admin:sync', () => {
    if (role !== 'admin') return;
    socket.emit('state:update', stateManager.getAdminSnapshot());
    socket.emit('config:update', stateManager.getConfig());
  });

  socket.on('disconnect', () => {
    if (role === 'client') {
      stateManager.markPlayerOffline(socket.id);
      emitState();
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', updatedAt: Date.now() });
});

app.get('/config', (_req, res) => {
  res.json(stateManager.getConfig());
});

app.get('/state', (_req, res) => {
  res.json(stateManager.getAdminSnapshot());
});

app.post('/moderate/nickname', async (req, res) => {
  const nickname = (req.body?.nickname ?? '').toString().trim();
  if (!nickname) {
    res.status(400).json({ message: 'Никнейм обязателен.' });
    return;
  }

  try {
    const result = await validateNickname(nickname);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err instanceof Error ? err.message : 'Ошибка модерации никнейма.',
    });
  }
});

app.post('/admin/stage', (req, res) => {
  const { target, stageId } = req.body ?? {};
  if (!stageId || (target !== 'client' && target !== 'display')) {
    res.status(400).json({ message: 'target (client|display) и stageId обязательны.' });
    return;
  }

  try {
    stateManager.setStage(target === 'client' ? 'clients' : 'display', stageId);
    emitState();
    res.json(stateManager.getAdminSnapshot());
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

