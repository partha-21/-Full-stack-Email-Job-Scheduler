import redisConnection from '../config/redis';

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  resetInMs: number;
  nextAvailableTime?: Date;
}

export class SenderRateLimiter {
  /**
   * Atomic sliding window rate limiter for email senders using Redis Sorted Sets (ZSET).
   */
  static async checkAndIncrement(
    senderEmail: string,
    hourlyLimit: number
  ): Promise<RateLimitCheckResult> {
    const key = `rate_limit:sender:${senderEmail.toLowerCase()}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour in ms
    const windowStart = now - windowMs;

    try {
      // Use Redis MULTI pipeline for atomic execution
      const multi = redisConnection.multi();
      // Remove timestamps older than 1 hour ago
      multi.zremrangebyscore(key, 0, windowStart);
      // Count valid requests in current window
      multi.zcard(key);
      // Get oldest entry score in current window
      multi.zrange(key, 0, 0, 'WITHSCORES');

      const results = await multi.exec();
      if (!results) {
        throw new Error('Redis transaction returned null');
      }

      const currentCount = (results[1][1] as number) || 0;
      const oldestEntries = results[2][1] as string[];

      if (currentCount >= hourlyLimit) {
        let oldestScore = now;
        if (oldestEntries && oldestEntries.length >= 2) {
          oldestScore = parseInt(oldestEntries[1], 10);
        }
        const nextAvailableMs = oldestScore + windowMs + 1000; // +1s buffer
        const resetInMs = Math.max(1000, nextAvailableMs - now);

        return {
          allowed: false,
          currentCount,
          maxLimit: hourlyLimit,
          resetInMs,
          nextAvailableTime: new Date(nextAvailableMs),
        };
      }

      // Record this sending action
      const recordMulti = redisConnection.multi();
      recordMulti.zadd(key, now, `${now}:${Math.random().toString(36).substring(2, 7)}`);
      recordMulti.expire(key, 3600); // 1 hour TTL
      await recordMulti.exec();

      return {
        allowed: true,
        currentCount: currentCount + 1,
        maxLimit: hourlyLimit,
        resetInMs: 0,
      };
    } catch (error: any) {
      console.error(`Rate limiter fallback error for ${senderEmail}:`, error.message);
      // Fallback: allow sending if Redis is temporarily unavailable
      return {
        allowed: true,
        currentCount: 0,
        maxLimit: hourlyLimit,
        resetInMs: 0,
      };
    }
  }
}
