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
  });

  redisInstance = client;
} catch (err) {
  redisInstance = new RedisMock();
}

export function getRedisClient(): any {
  if (!redisInstance || redisInstance.status === 'end') {
    redisInstance = new RedisMock();
  }
  return redisInstance;
}

export const redisConnection = redisInstance;
export default redisConnection;
