import prisma from '../config/database';
import { emailQueue } from '../queues/email.queue';
import { ElasticsearchService } from './elasticsearch.service';

export interface ParseRecipientsResult {
  validEmails: string[];
  totalCount: number;
  invalidCount: number;
}

export class EmailService {
  static parseRecipients(rawContent: string): ParseRecipientsResult {
    if (!rawContent || rawContent.trim() === '') {
      return { validEmails: [], totalCount: 0, invalidCount: 0 };
    }

    const tokens = rawContent
      .split(/[\n,\r\t;]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const validEmails: string[] = [];
    let invalidCount = 0;

    for (const token of tokens) {
      const cleanToken = token.replace(/^["'<\s]+|["'>\s]+$/g, '');
      if (emailRegex.test(cleanToken)) {
        if (!validEmails.includes(cleanToken.toLowerCase())) {
          validEmails.push(cleanToken.toLowerCase());
        }
      } else {
        invalidCount++;
      }
    }

    return {
      validEmails,
      totalCount: validEmails.length,
      invalidCount,
    };
  }

  static async scheduleEmailCampaign(payload: {
    userId: string;
    fromEmail: string;
    recipients: string[];
    subject: string;
    body: string;
    delayBetweenMs: number;
    hourlyLimit: number;
    scheduledStartTime: Date;
  }) {
    const {
      userId,
      fromEmail,
      recipients,
      subject,
      body,
      delayBetweenMs,
      hourlyLimit,
      scheduledStartTime,
    } = payload;

    const campaign = await prisma.emailCampaign.create({
      data: {
        userId,
        fromEmail,
        subject,
        body,
        delayBetweenMs,
        hourlyLimit,
        totalRecipients: recipients.length,
        scheduledStartTime,
        status: 'SCHEDULED',
      },
    });

    const now = Date.now();
    const startMs = scheduledStartTime.getTime();
    const baseDelay = Math.max(0, startMs - now);

    const createdEmails = [];

    for (let index = 0; index < recipients.length; index++) {
      const recipient = recipients[index];
      const idempotencyKey = `idemp:${userId}:${campaign.id}:${recipient}:${index}`;
      const jobDelay = baseDelay + index * delayBetweenMs;
      const scheduledAt = new Date(now + jobDelay);

      const emailRecord = await prisma.email.create({
        data: {
          campaignId: campaign.id,
          userId,
          sender: fromEmail,
          recipient,
          subject,
          body,
          status: 'QUEUED',
          scheduledAt,
          idempotencyKey,
        },
      });

      ElasticsearchService.indexEmail(emailRecord).catch(() => {});

      try {
        const job = await emailQueue.add(
          'send-email',
          {
            emailId: emailRecord.id,
            userId,
            sender: fromEmail,
            recipient,
            subject,
            body,
            hourlyLimit,
            idempotencyKey,
          },
          {
            delay: jobDelay,
            jobId: `email_job_${emailRecord.id}`,
            attempts: 3,
          }
        );

        if (job?.id) {
          await prisma.email.update({
            where: { id: emailRecord.id },
            data: { jobId: job.id },
          });
        }
      } catch (err: any) {
        console.warn(`ℹ️ BullMQ job queuing note for ${emailRecord.id}: ${err.message}`);
      }

      createdEmails.push(emailRecord);
    }

    return {
      campaign,
      emailCount: createdEmails.length,
      scheduledEmails: createdEmails,
    };
  }
}
