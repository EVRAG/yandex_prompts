import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { AdminVotingSnapshot, VotingPhase, VotingTask } from '@prompt-night/shared';
import type { ConnectionStatus } from '../types/realtime';
import { SERVER_URL } from '../lib/constants';
import { fetchAdminSnapshot, fetchVotingTask } from '../lib/api';

interface AdminServerEvents {
  'state:update': (snapshot: AdminVotingSnapshot) => void;
  'config:update': (task: VotingTask) => void;
  'admin:error': (payload: { message: string }) => void;
}

interface AdminClientEvents {
  'admin:set-phase': (payload: { phase: VotingPhase }) => void;
  'admin:sync': () => void;
}

type AdminSocket = Socket<AdminServerEvents, AdminClientEvents>;

export function useAdminRealtime() {
  const socketRef = useRef<AdminSocket | null>(null);
  const [snapshot, setSnapshot] = useState<AdminVotingSnapshot | null>(null);
  const [task, setTask] = useState<VotingTask | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVotingTask()
      .then(setTask)
      .catch(err => setError(err instanceof Error ? err.message : String(err)));
    fetchAdminSnapshot()
      .then(setSnapshot)
      .catch(err => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  useEffect(() => {
    const socket: AdminSocket = io(SERVER_URL, {
      transports: ['websocket'],
      auth: { role: 'admin' },
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
    });
    socket.on('admin:error', payload => {
      setStatus('error');
      setError(payload.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const setPhase = useCallback((phase: VotingPhase) => {
    socketRef.current?.emit('admin:set-phase', { phase });
  }, []);

  const refresh = useCallback(() => {
    socketRef.current?.emit('admin:sync');
  }, []);

  return {
    snapshot,
    task,
    status,
    error,
    setPhase,
    refresh,
  };
}

