import { Queue } from 'bullmq';
import redisConnection from '../config/redis';

export const EMAIL_QUEUE_NAME = 'emailQueue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 5000,
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 5000,
    },
  },
});

console.log(`✅ Initialized BullMQ queue: ${EMAIL_QUEUE_NAME}`);
