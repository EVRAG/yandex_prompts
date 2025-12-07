import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { SERVER_URL } from '../lib/constants';
import { GameConfig, GameStage, Player } from '@prompt-night/shared';

export interface RealtimeState {
  currentStage: GameStage;
  playerCount: number;
  players?: Record<string, Player>; // Only for admin/display
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
      console.log(`Connected to ${namespace}`);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log(`Disconnected from ${namespace}`);
    });

    s.on('config', (cfg: GameConfig) => {
      setConfig(cfg);
    });

    s.on('state:update', (newState: RealtimeState) => {
      setState(prev => ({ ...prev, ...newState }));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [namespace, JSON.stringify(auth)]); // simplistic dep check

  return { socket, isConnected, state, config };
}
