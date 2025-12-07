import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { SERVER_URL } from '../lib/constants';
import type { GameConfig, GameStage, Player } from '@prompt-night/shared';

export interface RealtimeState {
  currentStage: GameStage;
  playerCount: number;
  players?: Record<string, Player>; // Only for admin/display
  leaderboard?: Player[]; // Sorted leaderboard (for all clients)
  currentPlayer?: { id: string; name: string; score: number }; // Current player info (for player namespace)
  submissions?: any[]; // Only for admin
}

export function useRealtime(namespace: string, auth?: any) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<RealtimeState | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);

  useEffect(() => {
    const s = io(`${SERVER_URL}/${namespace}`, {
      auth,
      transports: ['websocket'],
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log(`[${namespace}] Connected`);
    });

    s.on('connect_error', (error) => {
      console.error(`[${namespace}] Connection error:`, error);
      setIsConnected(false);
    });

    s.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log(`[${namespace}] Disconnected:`, reason);
    });

    s.on('config', (cfg: GameConfig) => {
      console.log(`[${namespace}] Received config`);
      setConfig(cfg);
    });

    s.on('state:update', (newState: RealtimeState) => {
      console.log(`[${namespace}] Received state update:`, newState);
      setState(prev => ({ ...prev, ...newState }));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [namespace, JSON.stringify(auth)]); // simplistic dep check

  return { socket, isConnected, state, config };
}
