import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { VotingSnapshot, VotingTask } from '@prompt-night/shared';
import type { ConnectionStatus } from '../types/realtime';
import { SERVER_URL } from '../lib/constants';
import { fetchAdminSnapshot, fetchVotingTask } from '../lib/api';

interface PlayerServerEvents {
  'state:update': (snapshot: VotingSnapshot) => void;
  'config:update': (task: VotingTask) => void;
  'player:error': (payload: { message: string }) => void;
  'player:voted': (payload: { optionId: string }) => void;
}

interface PlayerClientEvents {
  'player:vote': (payload: { optionId: string }) => void;
}

type PlayerSocket = Socket<PlayerServerEvents, PlayerClientEvents>;

type VoteStatus = 'idle' | 'sending' | 'submitted';

const STORAGE_PREFIX = 'prompt-night-vote-';
const getStorageKey = (taskId: string) => `${STORAGE_PREFIX}${taskId}`;

export function usePlayerRealtime() {
  const socketRef = useRef<PlayerSocket | null>(null);
  const taskRef = useRef<VotingTask | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [task, setTask] = useState<VotingTask | null>(null);
  const [snapshot, setSnapshot] = useState<VotingSnapshot | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVotingTask()
      .then(payload => {
        setTask(payload);
        taskRef.current = payload;
        try {
          const stored = localStorage.getItem(getStorageKey(payload.id));
          if (stored) {
            setSelectedOptionId(stored);
            setVoteStatus('submitted');
          }
        } catch {
          /* ignore */
        }
      })
      .catch(err => setError(err instanceof Error ? err.message : String(err)));

    fetchAdminSnapshot()
      .then(data => setSnapshot(data))
      .catch(err => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  useEffect(() => {
    const socket: PlayerSocket = io(SERVER_URL, {
      transports: ['websocket'],
      auth: { role: 'client' },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('online');
      setError(null);
    });
    socket.on('disconnect', () => {
      setStatus('connecting');
    });
    socket.on('connect_error', err => {
      setStatus('error');
      setError(err.message);
    });
    socket.on('state:update', payload => {
      setSnapshot(payload);
    });
    socket.on('config:update', payload => {
      setTask(payload);
      taskRef.current = payload;
    });
    socket.on('player:error', payload => {
      setError(payload.message);
      setVoteStatus('idle');
    });
    socket.on('player:voted', payload => {
      const currentTask = taskRef.current;
      if (!currentTask) return;
      try {
        localStorage.setItem(getStorageKey(currentTask.id), payload.optionId);
      } catch {
        /* ignore */
      }
      setSelectedOptionId(payload.optionId);
      setVoteStatus('submitted');
      setError(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!task || !snapshot) return;
    if (snapshot.phase === 'voting') return;
    try {
      localStorage.removeItem(getStorageKey(task.id));
    } catch {
      /* ignore */
    }
    setSelectedOptionId(null);
    setVoteStatus('idle');
  }, [snapshot?.phase, task]);

  const vote = useCallback(
    (optionId: string) => {
      if (!socketRef.current) return;
      setVoteStatus('sending');
      socketRef.current.emit('player:vote', { optionId });
    },
    [],
  );

  return {
    status,
    task,
    snapshot,
    selectedOptionId,
    voteStatus,
    error,
    vote,
    clearError: () => setError(null),
  };
}

