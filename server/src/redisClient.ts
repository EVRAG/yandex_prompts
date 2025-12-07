import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// BullMQ requires maxRetriesPerRequest = null for blocking commands (BRPOP etc)
const baseOptions = {
  maxRetriesPerRequest: null as null,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`[redis] Retrying connection in ${delay}ms (attempt ${times})`);
    return delay;
  },
  enableReadyCheck: true,
  lazyConnect: false,
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
