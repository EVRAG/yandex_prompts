import OpenAI from 'openai';
import { redis } from '../redisClient';

export async function checkRedis() {
  try {
    const pong = await redis.ping();
    return { ok: pong === 'PONG' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function checkOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'OPENAI_API_KEY not set' };
  }

  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
