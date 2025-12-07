import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { QuestionStage } from '@prompt-night/shared';
import type { PlayerState, PublicSnapshot } from '../types/realtime';
import { SERVER_URL } from '../lib/constants';

const PLAYER_STORAGE_KEY = 'prompt-night-player';

type StoredPlayer = Pick<PlayerState, 'id' | 'name'>;

interface PlayerRegisteredPayload extends PlayerState {}

interface PlayerSubmissionPayload {
  id: string;
  stageId: string;
  createdAt: number;
  score: number;
  notes?: string;
}

interface ServerEvents {
  'state:update': (snapshot: PublicSnapshot) => void;
  'player:registered': (payload: PlayerRegisteredPayload) => void;
  'player:error': (payload: { message: string }) => void;
  'player:submitted': (payload: PlayerSubmissionPayload) => void;
}

interface ClientEvents {
  'player:register': (payload: { name?: string; playerId?: string }) => void;
  'player:submit': (payload: { stageId: string; answer: string }) => void;
}

type PlayerSocket = Socket<ServerEvents, ClientEvents>;

const readStoredPlayer = (): StoredPlayer | null => {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPlayer;
  } catch {
    return null;
  }
};

const persistPlayer = (player: StoredPlayer) => {
  localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
};

const clearStoredPlayer = () => {
  localStorage.removeItem(PLAYER_STORAGE_KEY);
};

export function usePlayerRealtime() {
  const socketRef = useRef<PlayerSocket | null>(null);
  const storedPlayerRef = useRef<StoredPlayer | null>(readStoredPlayer());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'online' | 'error'>(
    'connecting',
  );
  const [stageSnapshot, setStageSnapshot] = useState<PublicSnapshot | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'sending' | 'scoring' | 'success'>(
    'idle',
  );
  const [registering, setRegistering] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<PlayerSubmissionPayload | null>(null);

  useEffect(() => {
    const socket: PlayerSocket = io(SERVER_URL, {
      transports: ['websocket'],
      auth: { role: 'client' },
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('online');
      setError(null);
      const stored = storedPlayerRef.current;
      if (stored) {
        socket.emit('player:register', { playerId: stored.id, name: stored.name });
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('connecting');
    });

    socket.io.on('reconnect_attempt', () => {
      setConnectionStatus('connecting');
    });

    socket.io.on('reconnect_failed', () => {
      setConnectionStatus('error');
      setError('Не удалось переподключиться.');
    });

    socket.on('connect_error', err => {
      setConnectionStatus('error');
      setError(err.message);
    });

    socket.on('state:update', payload => {
      setStageSnapshot(payload);
      setPlayer(prev => {
        if (!prev) return prev;
        const updated = payload.leaderboard.find(entry => entry.id === prev.id);
        return updated ? { ...prev, score: updated.score } : prev;
      });
    });

    socket.on('player:registered', payload => {
      setPlayer(payload);
      const stored: StoredPlayer = { id: payload.id, name: payload.name };
      storedPlayerRef.current = stored;
      persistPlayer(stored);
      setRegistering(false);
    });

    socket.on('player:error', payload => {
      setError(payload.message);
      setRegistering(false);
      setSubmissionStatus('idle');
    });

    socket.on('player:submitted', payload => {
      setLastSubmission(payload);
      setSubmissionStatus('success');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (submissionStatus !== 'scoring') return;
    const timer = setTimeout(() => {
      setSubmissionStatus('idle');
      setError('Слишком долгое ожидание оценки. Попробуйте ещё раз.');
    }, 12_000);
    return () => clearTimeout(timer);
  }, [submissionStatus]);

  const register = useCallback((name: string) => {
    if (!socketRef.current) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введите имя');
      return;
    }
    setRegistering(true);
    const stored = storedPlayerRef.current;
    socketRef.current.emit('player:register', {
      name: trimmed,
      playerId: stored?.id,
    });
  }, []);

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!socketRef.current || !stageSnapshot) return;
      const trimmed = answer.trim();
      if (!trimmed) {
        setError('Ответ не может быть пустым');
        return;
      }
      setSubmissionStatus('scoring');
      socketRef.current.emit('player:submit', {
        stageId: stageSnapshot.stageId,
        answer: trimmed,
      });
    },
    [stageSnapshot],
  );

  const resetPlayer = useCallback(() => {
    storedPlayerRef.current = null;
    clearStoredPlayer();
    setPlayer(null);
  }, []);

  const stage = stageSnapshot?.stage ?? null;
  const leaderboard = stageSnapshot?.leaderboard ?? [];

  const questionContent = useMemo(() => {
    if (!stage || stage.kind !== 'question') return null;
    return stage as QuestionStage;
  }, [stage]);

  return {
    connectionStatus,
    stage,
    stageId: stageSnapshot?.stageId ?? null,
    leaderboard,
    player,
    defaultName: storedPlayerRef.current?.name ?? '',
    error,
    registering,
    submissionStatus,
    lastSubmission,
    register,
    submitAnswer,
    resetPlayer,
    questionContent,
  };
}

