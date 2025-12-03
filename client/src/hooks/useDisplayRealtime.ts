import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { VotingSnapshot, VotingTask } from '@prompt-night/shared';
import type { ConnectionStatus } from '../types/realtime';
import { SERVER_URL } from '../lib/constants';
import { fetchAdminSnapshot, fetchVotingTask } from '../lib/api';

interface DisplayServerEvents {
  'state:update': (snapshot: VotingSnapshot) => void;
  'config:update': (task: VotingTask) => void;
}

type DisplaySocket = Socket<DisplayServerEvents>;

export function useDisplayRealtime() {
  const [task, setTask] = useState<VotingTask | null>(null);
  const [snapshot, setSnapshot] = useState<VotingSnapshot | null>(null);
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
    const socket: DisplaySocket = io(SERVER_URL, {
      transports: ['websocket'],
      auth: { role: 'display' },
    });

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

    return () => {
      socket.disconnect();
    };
  }, []);

  return { task, snapshot, status, error };
}

