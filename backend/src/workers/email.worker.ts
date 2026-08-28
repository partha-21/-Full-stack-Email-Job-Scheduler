import { Worker, Job } from 'bullmq';
import redisConnection from '../config/redis';
import { EMAIL_QUEUE_NAME, emailQueue } from '../queues/email.queue';
import prisma from '../config/database';
import { SenderRateLimiter } from '../services/rateLimiter.service';
import { sendEmailViaEthereal } from '../services/ethereal.service';
import { SlackService } from '../services/slack.service';
import { ElasticsearchService } from '../services/elasticsearch.service';

export interface EmailJobData {
  emailId: string;
  userId: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  hourlyLimit: number;
  idempotencyKey: string;
}

const concurrency = Number(process.env.WORKER_CONCURRENCY) || 5;
const minDelayMs = Number(process.env.MIN_EMAIL_DELAY_MS) || 2000;

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    const { emailId, userId, sender, recipient, subject, body, hourlyLimit, idempotencyKey } = job.data;
    console.log(`⚙️ Worker processing job ${job.id} for email ${emailId} -> ${recipient}`);

    const emailRecord = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!emailRecord) {
      console.warn(`⚠️ Email record ${emailId} not found in DB. Skipping job.`);
      return { status: 'SKIPPED', reason: 'NOT_FOUND' };
    }

    if (emailRecord.status === 'SENT') {
      console.log(`🛡️ Idempotency triggered: Email ${emailId} already SENT. Skipping duplicate execution.`);
      return { status: 'SKIPPED', reason: 'ALREADY_SENT' };
    }

    const rateCheck = await SenderRateLimiter.checkAndIncrement(sender, hourlyLimit);

    if (!rateCheck.allowed) {
      const nextTime = rateCheck.nextAvailableTime || new Date(Date.now() + rateCheck.resetInMs);
      console.warn(`⏳ Hourly rate limit (${hourlyLimit}/hr) reached for ${sender}. Rescheduling email ${emailId} to ${nextTime.toISOString()}`);

      const updatedRecord = await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'RESCHEDULED',
          scheduledAt: nextTime,
          attemptCount: { increment: 1 },
        },
      });

      ElasticsearchService.indexEmail(updatedRecord).catch(() => {});

      await emailQueue.add(
        'send-email',
        job.data,
        {
          delay: rateCheck.resetInMs,
          jobId: `email_job_resched_${emailId}_${Date.now()}`,
          attempts: 3,
        }
      );

      await SlackService.sendRateLimitNotification(userId, sender, hourlyLimit, nextTime);

      return {
        status: 'RESCHEDULED',
        nextAvailableTime: nextTime.toISOString(),
        resetInMs: rateCheck.resetInMs,
      };
    }

    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: 'PROCESSING',
        attemptCount: { increment: 1 },
      },
    });

    try {
      const sendResult = await sendEmailViaEthereal({
        from: sender,
        to: recipient,
        subject,
        body,
      });

      const sentAt = new Date();

      const sentRecord = await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'SENT',
          sentAt,
          etherealPreviewUrl: sendResult.previewUrl || null,
        },
      });

      await ElasticsearchService.indexEmail(sentRecord);

      if (minDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, minDelayMs));
      }

      console.log(`✅ Job ${job.id} completed successfully for email ${emailId}`);
      return {
        status: 'SENT',
        messageId: sendResult.messageId,
        previewUrl: sendResult.previewUrl,
        sentAt: sentAt.toISOString(),
      };
    } catch (error: any) {
      console.error(`❌ Job ${job.id} failed sending to ${recipient}:`, error.message);

      const failedRecord = await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: error.message,
        },
      });

      ElasticsearchService.indexEmail(failedRecord).catch(() => {});
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency,
  }
);

emailWorker.on('completed', (job) => {
  console.log(`🎉 Worker finished job ${job.id}`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`💥 Worker job ${job?.id} failed with error: ${err.message}`);
});

console.log(`✅ Started BullMQ emailWorker with concurrency = ${concurrency}`);
