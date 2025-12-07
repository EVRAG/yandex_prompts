import { redis } from '../redisClient';
import { getYandexClient, getYandexConfigSnapshot } from './yandexClient';

export async function checkRedis() {
  try {
    const pong = await redis.ping();
    return { ok: pong === 'PONG' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function checkYandexLLM() {
  try {
    const client = getYandexClient();
    await client.models.list();
    return { ok: true, config: getYandexConfigSnapshot() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
