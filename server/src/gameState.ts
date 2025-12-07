import { gameConfig, GameStage, GameStageConfig, Player, Submission } from '@prompt-night/shared';
export { Player, Submission };
import { redis } from './redisClient';

export interface PersistedState {
  currentStageId: string;
  stageStatus: GameStage['status'];
  stageStartTime?: number;
  players: Record<string, Player>; // playerId -> Player
  submissions: Submission[];
}

// Initial state
const initialState: PersistedState = {
  currentStageId: 'registration',
  stageStatus: 'active',
  players: {},
  submissions: [],
};

// In-memory state mirror
let state: PersistedState = { ...initialState };

export function getState() {
  return state;
}

export function setState(newState: PersistedState) {
  state = newState;
  // In a real app we might debounce this or save on critical changes
  // For now, we'll save on change in the background
  saveStateToRedis().catch(console.error);
}

const STATE_KEY = 'prompt-night:gamestate';

export async function loadStateFromRedis() {
  const data = await redis.get(STATE_KEY);
  if (data) {
    try {
      state = JSON.parse(data);
      console.log('State loaded from Redis');
    } catch (e) {
      console.error('Failed to parse state from Redis', e);
    }
  }
}

async function saveStateToRedis() {
  await redis.set(STATE_KEY, JSON.stringify(state));
}

export function getPlayer(id: string) {
  return state.players[id];
}

export function addPlayer(id: string, name: string) {
  if (state.players[id]) return state.players[id];
  const player: Player = {
    id,
    name,
    score: 0,
    joinedAt: Date.now(),
    lastActive: Date.now(),
    isOnline: true,
  };
  state.players[id] = player;
  saveStateToRedis();
  return player;
}

export function updatePlayerScore(id: string, delta: number) {
  if (state.players[id]) {
    state.players[id].score += delta;
    saveStateToRedis();
  }
}

export function getCurrentStage(): GameStage {
  const config = gameConfig.stages.find(s => s.id === state.currentStageId);
  if (!config) {
    // Fallback
    return {
      id: 'error',
      title: 'Error',
      type: 'info',
      status: 'active',
    };
  }
  return {
    ...config,
    status: state.stageStatus,
    startTime: state.stageStartTime,
  };
}

export function setStage(stageId: string) {
  const config = gameConfig.stages.find(s => s.id === stageId);
  if (!config) return false;
  
  state.currentStageId = stageId;
  state.stageStatus = 'active'; // Default to active on switch? Or pending?
  // Let's say we switch to 'pending' or 'active' depending on type.
  // For questions, maybe 'active' immediately starts timer?
  // User said: "admin can switch question 1. Then timer starts."
  // So maybe switch to 'pending' first, then 'start timer' action makes it 'active'.
  // But user also said "automatically starts timer".
  // Let's make it 'active' by default for now and set startTime.
  state.stageStartTime = Date.now();
  
  saveStateToRedis();
  return true;
}

export function setStageStatus(status: GameStage['status']) {
  state.stageStatus = status;
  if (status === 'active') {
    state.stageStartTime = Date.now();
  }
  saveStateToRedis();
}

export function addSubmission(submission: Submission) {
  state.submissions.push(submission);
  saveStateToRedis();
}

export function updateSubmission(id: string, updates: Partial<Submission>) {
  const sub = state.submissions.find(s => s.id === id);
  if (sub) {
    if (updates.score !== undefined && sub.score === undefined) {
      // First time scoring, update player total
      updatePlayerScore(sub.playerId, updates.score);
    } else if (updates.score !== undefined && sub.score !== undefined) {
      // Re-scoring? Adjust difference
      updatePlayerScore(sub.playerId, updates.score - sub.score);
    }
    
    Object.assign(sub, updates);
    saveStateToRedis();
  }
}

export function getSubmissionsForStage(stageId: string) {
  return state.submissions.filter(s => s.stageId === stageId);
}
