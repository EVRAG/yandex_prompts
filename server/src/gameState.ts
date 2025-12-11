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
let stateVersion = 0;

function bumpStateVersion() {
  stateVersion += 1;
}

export function getStateVersion() {
  return stateVersion;
}

export function getState() {
  return state;
}

export function setState(newState: PersistedState) {
  state = newState;
  // In a real app we might debounce this or save on critical changes
  // For now, we'll save on change in the background
  bumpStateVersion();
  saveStateToRedis().catch(console.error);
}

const STATE_KEY = 'prompt-night:gamestate';
const STATE_VERSION_KEY = 'prompt-night:gamestate:version';

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
  const ver = await redis.get(STATE_VERSION_KEY);
  if (ver) {
    const parsed = Number(ver);
    stateVersion = Number.isFinite(parsed) ? parsed : 0;
  }
}

async function saveStateToRedis() {
  await redis.set(STATE_KEY, JSON.stringify(state));
  await redis.set(STATE_VERSION_KEY, String(stateVersion));
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
  bumpStateVersion();
  saveStateToRedis();
  return player;
}

export function updatePlayerScore(id: string, delta: number) {
  if (state.players[id]) {
    state.players[id].score += delta;
    bumpStateVersion();
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
    ...(state.stageStartTime !== undefined && { startTime: state.stageStartTime }),
  };
}

export function setStage(stageId: string) {
  const config = gameConfig.stages.find(s => s.id === stageId);
  if (!config) return false;
  
  state.currentStageId = stageId;
  
  // For question stages, automatically start timer (set to 'active' with startTime)
  // For other stages, set to 'active' without timer
  if (config.type === 'question') {
    state.stageStatus = 'active';
    state.stageStartTime = Date.now(); // Start timer immediately
  } else {
    state.stageStatus = 'active';
    // Don't set stageStartTime for non-question stages (leave it as is or don't set)
    delete state.stageStartTime;
  }
  
  bumpStateVersion();
  saveStateToRedis();
  return true;
}

export function setStageStatus(status: GameStage['status']) {
  state.stageStatus = status;
  if (status === 'active') {
    state.stageStartTime = Date.now();
  }
  bumpStateVersion();
  saveStateToRedis();
}

export function addSubmission(submission: Submission) {
  state.submissions.push(submission);
  bumpStateVersion();
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
    bumpStateVersion();
    saveStateToRedis();
    
    // Notify that state changed (for real-time updates)
    redis.publish('state:changed', JSON.stringify({ type: 'submission_updated', submissionId: id }));
  }
}

export function getSubmissionsForStage(stageId: string) {
  return state.submissions.filter(s => s.stageId === stageId);
}

export function resetState() {
  state = { ...initialState };
  bumpStateVersion();
  saveStateToRedis();
  console.log('[gameState] State reset to initial');
}
