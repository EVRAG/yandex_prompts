import type { PersistedState } from './gameState';
import { redis } from './redisClient';

const STATE_KEY = process.env.STATE_KEY || 'prompt-night:state:v1';
const TTL_SECONDS = Number(process.env.STATE_TTL_SECONDS ?? 86_400);

export async function loadState(): Promise<PersistedState | undefined> {
  try {
    const raw = await redis.get(STATE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedState;
    return parsed;
  } catch (err) {
    console.error('[stateStorage] load failed', err);
    return undefined;
  }
}

export async function persistState(state: PersistedState): Promise<void> {
  try {
    const payload = JSON.stringify(state);
    if (Number.isFinite(TTL_SECONDS) && TTL_SECONDS > 0) {
      await redis.set(STATE_KEY, payload, 'EX', TTL_SECONDS);
    } else {
      await redis.set(STATE_KEY, payload);
    }
  } catch (err) {
    console.error('[stateStorage] persist failed', err);
  }
}
