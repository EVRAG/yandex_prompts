import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// BullMQ requires maxRetriesPerRequest = null for blocking commands (BRPOP etc)
const baseOptions = {
  maxRetriesPerRequest: null as null,
};

export const redis = new Redis(redisUrl, baseOptions);
export const redisSubscriber = new Redis(redisUrl, baseOptions);

const logError = (label: string) => (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  // Keep console logging minimal to avoid noisy output in prod
  console.error(`[redis:${label}]`, message);
};

redis.on('error', logError('client'));
redisSubscriber.on('error', logError('subscriber'));
