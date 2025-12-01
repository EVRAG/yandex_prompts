import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { GameConfig } from '@prompt-night/shared';
import type { AdminSnapshot, PublicSnapshot } from '../types/realtime';
import { SERVER_URL } from '../lib/constants';
import { fetchAdminSnapshot, fetchGameConfig } from '../lib/api';

interface DisplayServerEvents {
  'state:update': (snapshot: PublicSnapshot) => void;
  'config:update': (config: GameConfig) => void;
}

interface DisplayClientEvents {}

type DisplaySocket = Socket<DisplayServerEvents, DisplayClientEvents>;

const adaptSnapshot = (snapshot: AdminSnapshot): PublicSnapshot => ({
  stageId: snapshot.displayStageId,
  stage: snapshot.displayStage,
  leaderboard: snapshot.leaderboard,
  updatedAt: snapshot.updatedAt,
});

export function useDisplayRealtime() {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null);
  const [status, setStatus] = useState<'connecting' | 'online' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGameConfig()
      .then(setConfig)
      .catch(err => setError(err instanceof Error ? err.message : String(err)));
    fetchAdminSnapshot()
      .then(data => setSnapshot(adaptSnapshot(data)))
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
      setConfig(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { config, snapshot, status, error };
}

