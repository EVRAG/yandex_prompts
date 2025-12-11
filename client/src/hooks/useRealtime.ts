import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { SERVER_URL } from '../lib/constants';
import type { GameConfig, GameStage, Player } from '@prompt-night/shared';
import { useRef } from 'react';

export interface RealtimeState {
  currentStage: GameStage;
  playerCount: number;
  players?: Record<string, Player>; // Only for admin/display
  leaderboard?: Player[]; // Sorted leaderboard (for all clients)
  currentPlayer?: { id: string; name: string; score: number }; // Current player info (for player namespace)
  submissions?: any[]; // Only for admin
  version?: number; // State version for polling fallback
}

export function useRealtime(namespace: string, auth?: any) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<RealtimeState | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const versionRef = useRef<number | undefined>(undefined);

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
      versionRef.current = newState.version ?? versionRef.current;
      setState(prev => ({ ...prev, ...newState }));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [namespace, JSON.stringify(auth)]); // simplistic dep check

  // Fallback polling of /state with adaptive interval:
  // - When WS connected: poll редко (20s)
  // - Когда WS отвален/рестартится: чаще (5s) для страховки.
  useEffect(() => {
    let intervalId: number | undefined;
    let stopped = false;

    const poll = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/state`);
        if (!res.ok) return;
        const snapshot = await res.json();
        // Сверяем версию, чтобы не перетереть свежий стейт.
        if (snapshot?.version !== undefined && snapshot.version === versionRef.current) return;
        versionRef.current = snapshot.version ?? versionRef.current;
        setState(prev => ({ ...prev, ...snapshot }));
      } catch (e) {
        console.error(`[${namespace}] /state polling error:`, e);
      }
    };

    // Старт сразу один раз
    poll();
    intervalId = window.setInterval(poll, isConnected ? 20000 : 5000);

    return () => {
      stopped = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isConnected, namespace]);

  return { socket, isConnected, state, config };
}
