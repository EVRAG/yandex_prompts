import type { GameConfig, GameStage } from '@prompt-night/shared';

export type StageTarget = 'client' | 'display';

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
  lastActive: number;
  isOnline: boolean;
}

export interface Submission {
  id: string;
  playerId: string;
  stageId: string;
  answer: string;
  createdAt: number;
}

export interface AdminSnapshot {
  clientStageId: string;
  displayStageId: string;
  clientStage?: GameStage;
  displayStage?: GameStage;
  players: PlayerState[];
  leaderboard: PlayerState[];
  submissions: Submission[];
  updatedAt: number;
}

export interface PublicSnapshot {
  stageId: string;
  stage?: GameStage;
  leaderboard: PlayerState[];
  updatedAt: number;
}

export interface RealtimeState {
  config: GameConfig | null;
  snapshot: AdminSnapshot | null;
  status: 'connecting' | 'online' | 'error';
  lastError?: string;
}

