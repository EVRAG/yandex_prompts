import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { GameConfig } from '@prompt-night/shared';
import type { AdminSnapshot, StageTarget } from '../types/realtime';
import { ADMIN_SECRET, SERVER_URL } from '../lib/constants';
import { fetchAdminSnapshot, fetchGameConfig } from '../lib/api';

type AdminSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface ServerToClientEvents {
  'state:update': (snapshot: AdminSnapshot) => void;
  'config:update': (config: GameConfig) => void;
  'admin:error': (payload: { message: string }) => void;
}

interface ClientToServerEvents {
  'admin:set-stage': (payload: { target: StageTarget; stageId: string }) => void;
  'admin:update-score': (payload: { playerId: string; score: number }) => void;
  'admin:sync': () => void;
  'admin:reset': () => void;
}

export function useAdminRealtime() {
  const socketRef = useRef<AdminSocket | null>(null);
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [status, setStatus] = useState<'connecting' | 'online' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGameConfig()
      .then(setConfig)
      .catch(err => setError(err instanceof Error ? err.message : String(err)));
    fetchAdminSnapshot()
      .then(setSnapshot)
      .catch(err => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  useEffect(() => {
    const socket: AdminSocket = io(SERVER_URL, {
      transports: ['websocket'],
      auth: { role: 'admin', adminSecret: ADMIN_SECRET || undefined },
      extraHeaders: ADMIN_SECRET ? { 'x-admin-secret': ADMIN_SECRET } : undefined,
    });
    socketRef.current = socket;

    const handleError = (message: string) => {
      setStatus('error');
      setError(message);
    };

    socket.on('connect', () => {
      setStatus('online');
      setError(null);
    });
    socket.on('disconnect', () => {
      setStatus('connecting');
    });
    socket.on('connect_error', err => {
      handleError(err.message);
    });
    socket.on('state:update', payload => {
      setSnapshot(payload);
    });
    socket.on('config:update', payload => {
      setConfig(payload);
    });
    socket.on('admin:error', payload => {
      handleError(payload.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const setStage = useCallback((target: StageTarget, stageId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('admin:set-stage', { target, stageId });
  }, []);

  const refresh = useCallback(() => {
    socketRef.current?.emit('admin:sync');
  }, []);

  const resetGame = useCallback(() => {
    socketRef.current?.emit('admin:reset');
  }, []);

  return {
    snapshot,
    config,
    status,
    error,
    setStage,
    refresh,
    resetGame,
  };
}

