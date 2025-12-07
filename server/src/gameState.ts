import { randomUUID } from 'node:crypto';
import { gameConfig, type GameConfig, type GameStage } from '@prompt-night/shared';

type TargetScreen = 'clients' | 'display';

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
  lastActive: number;
  isOnline: boolean;
  socketId?: string;
}

export interface Submission {
  id: string;
  playerId: string;
  stageId: string;
  answer: string;
  createdAt: number;
  evaluation?: {
    score: number;
    notes?: string;
    mode: 'manual' | 'llm';
  };
}

export interface PersistedState {
  clientStageId: string;
  displayStageId: string;
  players: PlayerState[];
  submissions: Submission[];
  updatedAt: number;
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

export class GameStateManager {
  private readonly config: GameConfig = gameConfig;
  private clientStageId: string;
  private displayStageId: string;
  private readonly players = new Map<string, PlayerState>();
  private readonly submissions: Submission[] = [];
  private updatedAt = Date.now();
  private readonly persistCallback: ((state: PersistedState) => void) | undefined;

  constructor(initialState?: PersistedState, onChange?: (state: PersistedState) => void) {
    this.clientStageId = initialState?.clientStageId ?? this.getDefaultStageId('clients');
    this.displayStageId = initialState?.displayStageId ?? this.getDefaultStageId('display');
    this.persistCallback = onChange;

    if (initialState) {
      initialState.players.forEach(player => this.players.set(player.id, player));
      this.submissions.push(...initialState.submissions);
      this.updatedAt = initialState.updatedAt ?? Date.now();
    }
  }

  getConfig(): GameConfig {
    return this.config;
  }

  private getDefaultStageId(screen: TargetScreen): string {
    if (this.config.stages.length === 0) {
      throw new Error('Game config must contain at least one stage.');
    }
    const defaultStage = this.config.stages[0]!;
    const candidate = this.config.stages.find(stage => {
      if (!stage.screen || stage.screen === 'both') return true;
      return stage.screen === screen;
    });

    return candidate?.id ?? defaultStage.id;
  }

  private touch(): void {
    this.updatedAt = Date.now();
    this.persist();
  }

  private persist(): void {
    this.persistCallback?.(this.toPersistedState());
  }

  getStageById(stageId: string): GameStage | undefined {
    return this.config.stages.find(stage => stage.id === stageId);
  }

  getCurrentStage(target: TargetScreen): GameStage | undefined {
    return this.getStageById(target === 'clients' ? this.clientStageId : this.displayStageId);
  }

  registerPlayer(name: string, existingId?: string, socketId?: string): PlayerState {
    if (existingId && this.players.has(existingId)) {
      const player = this.players.get(existingId)!;
      player.name = name || player.name;
      player.lastActive = Date.now();
      player.isOnline = true;
      if (socketId) {
        player.socketId = socketId;
      } else {
        delete player.socketId;
      }
      this.touch();
      return player;
    }

    const id = existingId ?? randomUUID();
    const now = Date.now();
    const player: PlayerState = {
      id,
      name,
      score: 0,
      joinedAt: now,
      lastActive: now,
      isOnline: true,
    };

    if (socketId) {
      player.socketId = socketId;
    }

    this.players.set(id, player);
    this.touch();
    return player;
  }

  markPlayerOffline(socketId: string): void {
    const player = Array.from(this.players.values()).find(p => p.socketId === socketId);
    if (!player) return;
    player.isOnline = false;
    delete player.socketId;
    player.lastActive = Date.now();
    this.touch();
  }

  updatePlayerScore(playerId: string, score: number): void {
    const player = this.players.get(playerId);
    if (!player) return;
    player.score = score;
    player.lastActive = Date.now();
    this.touch();
  }

  incrementPlayerScore(playerId: string, delta: number): PlayerState | undefined {
    const player = this.players.get(playerId);
    if (!player) return undefined;
    player.score = Math.max(0, player.score + delta);
    player.lastActive = Date.now();
    this.touch();
    return player;
  }

  recordSubmission(
    playerId: string,
    stageId: string,
    answer: string,
    evaluation?: Submission['evaluation'],
  ): Submission | undefined {
    if (!this.players.has(playerId)) return undefined;
    const stage = this.getStageById(stageId);
    if (!stage || stage.kind !== 'question') return undefined;

    const submission: Submission = {
      id: randomUUID(),
      playerId,
      stageId,
      answer,
      createdAt: Date.now(),
    };
    if (evaluation) {
      submission.evaluation = evaluation;
    }
    this.submissions.push(submission);
    this.touch();
    return submission;
  }

  setStage(target: TargetScreen, stageId: string): GameStage {
    const stage = this.getStageById(stageId);
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`);
    }

    if (target === 'clients') {
      this.clientStageId = stageId;
    } else {
      this.displayStageId = stageId;
    }
    this.touch();
    return stage;
  }

  private sortLeaderboard(limit?: number): PlayerState[] {
    const sorted = Array.from(this.players.values()).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
    if (typeof limit === 'number') {
      return sorted.slice(0, limit);
    }
    return sorted;
  }

  private resolveLeaderboardLimit(stage?: GameStage): number | undefined {
    if (!stage || stage.kind !== 'leaderboard') return undefined;
    return stage.options.topN;
  }

  getAdminSnapshot(): AdminSnapshot {
    const clientStage = this.getStageById(this.clientStageId);
    const displayStage = this.getStageById(this.displayStageId);
    const leaderboardStage = displayStage?.kind === 'leaderboard' ? displayStage : clientStage;
    const limit = this.resolveLeaderboardLimit(leaderboardStage);

    const snapshot: AdminSnapshot = {
      clientStageId: this.clientStageId,
      displayStageId: this.displayStageId,
      players: Array.from(this.players.values()),
      leaderboard: this.sortLeaderboard(limit),
      submissions: this.submissions.slice(-200),
      updatedAt: this.updatedAt,
    };

    if (clientStage) {
      snapshot.clientStage = clientStage;
    }
    if (displayStage) {
      snapshot.displayStage = displayStage;
    }

    return snapshot;
  }

  getPublicSnapshot(target: TargetScreen): PublicSnapshot {
    const stage = this.getCurrentStage(target);
    const limit = this.resolveLeaderboardLimit(stage);

    const snapshot: PublicSnapshot = {
      stageId: target === 'clients' ? this.clientStageId : this.displayStageId,
      leaderboard: this.sortLeaderboard(limit),
      updatedAt: this.updatedAt,
    };

    if (stage) {
      snapshot.stage = stage;
    }

    return snapshot;
  }

  resetAll(): void {
    this.players.clear();
    this.submissions.length = 0;
    this.clientStageId = this.getDefaultStageId('clients');
    this.displayStageId = this.getDefaultStageId('display');
    this.touch();
  }

  toPersistedState(): PersistedState {
    return {
      clientStageId: this.clientStageId,
      displayStageId: this.displayStageId,
      players: Array.from(this.players.values()),
      submissions: this.submissions.slice(-500),
      updatedAt: this.updatedAt,
    };
  }
}

