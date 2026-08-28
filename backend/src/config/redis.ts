import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisInstance: any;

try {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 1) return null;
      return 100;
    },
  });

  client.on('error', () => {
    // Suppress unhandled connection error noise when local Redis daemon is offline
  });

  redisInstance = client;
} catch (err) {
  redisInstance = new RedisMock();
}

// Fallback provider helper
export function getRedisClient(): any {
  if (!redisInstance || redisInstance.status === 'end') {
    redisInstance = new RedisMock();
  }
  return redisInstance;
}

export const redisConnection = redisInstance;
export default redisConnection;
