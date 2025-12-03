import type { AdminVotingSnapshot, VoteResult, VotingPhase, VotingSnapshot, VotingTask } from '@prompt-night/shared';
import { votingTask } from '@prompt-night/shared';

export class VotingStateManager {
  private phase: VotingPhase = 'waiting';
  private readonly task: VotingTask = votingTask;
  private votingEndsAt: number | null = null;
  private updatedAt = Date.now();
  private timer: NodeJS.Timeout | null = null;
  private readonly votes = new Map<string, string>();
  private readonly counts = new Map<string, number>();

  onAutoCollect?: () => void;

  constructor() {
    this.resetCounts();
  }

  private touch(): void {
    this.updatedAt = Date.now();
  }

  private resetCounts(): void {
    this.counts.clear();
    for (const option of this.task.options) {
      this.counts.set(option.id, 0);
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleAutoCollect(): void {
    this.clearTimer();
    const duration = this.task.durationSeconds * 1000;
    this.timer = setTimeout(() => {
      this.phase = 'collecting';
      this.votingEndsAt = null;
      this.timer = null;
      this.touch();
      this.onAutoCollect?.();
    }, duration);
  }

  getTask(): VotingTask {
    return this.task;
  }

  getPhase(): VotingPhase {
    return this.phase;
  }

  getTimeLeftSeconds(): number | null {
    if (!this.votingEndsAt) return null;
    return Math.max(0, Math.ceil((this.votingEndsAt - Date.now()) / 1000));
  }

  startVoting(): void {
    this.phase = 'voting';
    this.votes.clear();
    this.resetCounts();
    this.votingEndsAt = Date.now() + this.task.durationSeconds * 1000;
    this.scheduleAutoCollect();
    this.touch();
  }

  setPhase(phase: VotingPhase): void {
    if (phase === 'voting') {
      this.startVoting();
      return;
    }

    this.phase = phase;
    this.votingEndsAt = null;
    this.clearTimer();
    if (phase === 'waiting') {
      this.votes.clear();
      this.resetCounts();
    }
    this.touch();
  }

  castVote(socketId: string, optionId: string): { success: boolean; message?: string } {
    if (this.phase !== 'voting') {
      return { success: false, message: 'Голосование пока недоступно.' };
    }
    if (!this.counts.has(optionId)) {
      return { success: false, message: 'Такого варианта нет.' };
    }
    if (this.votes.has(socketId)) {
      return { success: false, message: 'Вы уже проголосовали.' };
    }

    this.votes.set(socketId, optionId);
    this.counts.set(optionId, (this.counts.get(optionId) ?? 0) + 1);
    this.touch();
    return { success: true };
  }

  private buildSnapshot(): VotingSnapshot {
    return {
      phase: this.phase,
      task: this.task,
      votingEndsAt: this.votingEndsAt,
      timeLeftSeconds: this.getTimeLeftSeconds(),
      updatedAt: this.updatedAt,
    };
  }

  getPublicSnapshot(): VotingSnapshot {
    return this.buildSnapshot();
  }

  getAdminSnapshot(): AdminVotingSnapshot {
    const totalVotes = Array.from(this.counts.values()).reduce((acc, value) => acc + value, 0);
    const results: VoteResult[] = this.task.options.map(option => {
      const count = this.counts.get(option.id) ?? 0;
      const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
      return {
        optionId: option.id,
        title: option.title,
        count,
        percentage,
      };
    });

    return {
      ...this.buildSnapshot(),
      totalVotes,
      results,
    };
  }
}

