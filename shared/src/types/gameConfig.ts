export interface GameStageConfig {
  id: string;
  title: string;
  type: 'registration' | 'info' | 'question' | 'leaderboard';
  questionText?: string;
  referenceAnswer?: string; // Hidden from client until revealed
  timeLimitSeconds?: number;
}

export interface GameConfig {
  stages: GameStageConfig[];
}

export interface GameStage extends GameStageConfig {
  status: 'pending' | 'active' | 'locked' | 'revealed';
  startTime?: number; // timestamp when active started
}

export interface Player {
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
  score?: number;
  feedback?: string;
  createdAt: number;
}
