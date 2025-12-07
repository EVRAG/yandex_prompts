import dotenv from 'dotenv';
import path from 'node:path';

// Load shared .env from repo root (works in dev and in dist build).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback to current working directory if root file отсутствует.
dotenv.config();
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createAdapter } from '@socket.io/redis-adapter';
import { GameStateManager, type PersistedState } from './gameState';
import { validateNickname } from './services/nicknameModeration';
import { redis, redisSubscriber } from './redisClient';
import { loadState, persistState } from './stateStorage';
import { scoreQueue, scoreQueueEvents, type ScoreJobResult } from './queue/scoreQueue';
import { log } from './logger';
import { checkRedis, checkYandexLLM } from './services/health';

type SocketRole = 'client' | 'admin' | 'display';

const PORT = process.env.PORT || 4000;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const submitThrottleMs = Number(process.env.SUBMIT_THROTTLE_MS ?? 1000);
const lastSubmitAt = new Map<string, number>();

const requireAdminSecret: express.RequestHandler = (req, res, next) => {
  if (!ADMIN_SECRET) {
    res.status(500).json({ message: 'ADMIN_SECRET не настроен на сервере.' });
    return;
  }
  const provided =
    (req.header('x-admin-secret') ?? req.query.adminSecret ?? '').toString().trim();
  if (provided !== ADMIN_SECRET) {
    res.status(401).json({ message: 'Недостаточно прав.' });
    return;
  }
  next();
};

const nicknameLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

async function start() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.adapter(createAdapter(redis, redisSubscriber));

  const initialState: PersistedState | undefined = await loadState();
  const stateManager = new GameStateManager(initialState, state => {
    void persistState(state);
  });

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

    if (role === 'admin') {
      const adminSecret =
        (socket.handshake.auth?.adminSecret as string | undefined)?.trim() ||
        (socket.handshake.headers['x-admin-secret'] as string | undefined)?.trim();
      if (!ADMIN_SECRET || adminSecret !== ADMIN_SECRET) {
        socket.emit('admin:error', { message: 'Недостаточно прав.' });
        socket.disconnect(true);
        return;
      }
    }

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

    const lastSubmit = lastSubmitAt.get(playerId);
    if (lastSubmit && Date.now() - lastSubmit < submitThrottleMs) {
      socket.emit('player:error', { message: 'Слишком частые отправки. Подождите секунду.' });
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
      lastSubmitAt.set(playerId, Date.now());
      const job = await scoreQueue.add('score', {
        question: stage.content.prompt,
        reference: referenceAnswer,
        answer,
        playerId,
        stageId,
      });
      const scoring = (await job.waitUntilFinished(scoreQueueEvents, 10_000)) as ScoreJobResult;

      stateManager.incrementPlayerScore(playerId, scoring.score);
      const evaluation = {
        score: scoring.score,
        mode: 'llm' as const,
        ...(scoring.feedback ? { notes: scoring.feedback } : {}),
      };
      const submission = stateManager.recordSubmission(playerId, stageId, answer, evaluation);
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

    socket.on('admin:reset', () => {
      if (role !== 'admin') return;
      stateManager.resetAll();
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
    Promise.all([checkRedis(), checkYandexLLM()])
      .then(([redisHealth, yandexHealth]) => {
        const status = redisHealth.ok && yandexHealth.ok ? 'ok' : 'degraded';
        const statusCode = status === 'ok' ? 200 : 503;
        res.status(statusCode).json({
          status,
          redis: redisHealth,
          llm: yandexHealth,
          updatedAt: Date.now(),
        });
      })
      .catch(err => {
        log('error', 'healthcheck failure', { error: err instanceof Error ? err.message : err });
        res.status(503).json({ status: 'error', updatedAt: Date.now() });
      });
  });

  app.get('/config', (_req, res) => {
    res.json(stateManager.getConfig());
  });

  app.get('/state', requireAdminSecret, (_req, res) => {
    res.json(stateManager.getAdminSnapshot());
  });

  app.post('/moderate/nickname', nicknameLimiter, async (req, res) => {
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

  app.post('/admin/stage', requireAdminSecret, (req, res) => {
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

  app.post('/admin/reset', requireAdminSecret, (_req, res) => {
    stateManager.resetAll();
    emitState();
    res.json(stateManager.getAdminSnapshot());
  });

  server.listen(PORT, () => {
    log('info', 'Server listening', { port: PORT });
  });
}

start().catch(err => {
  log('error', 'Fatal server error', { error: err instanceof Error ? err.message : err });
  process.exit(1);
});

