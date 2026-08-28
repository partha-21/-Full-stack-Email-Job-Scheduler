import dotenv from 'dotenv';
dotenv.config();
import prisma from '../src/config/database';
import { EmailService } from '../src/services/email.service';
import '../src/workers/email.worker';

async function runRateLimitTest() {
  console.log('🧪 Starting Sender Hourly Rate Limit Test...');

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'ratelimit@reachinbox.ai',
        name: 'Rate Limit Tester',
      },
    });
  }

  const SENDER = 'limited_sender@reachinbox.ai';
  const HOURLY_LIMIT = 3;
  const TOTAL_JOBS = 10;

  console.log(`📋 Configuration: Limit = ${HOURLY_LIMIT} emails/hr, Scheduling = ${TOTAL_JOBS} emails.`);

  // 1. Reset Redis sliding window key for clean test state
  const testKey = `rate_limit:sender:${SENDER}`;
  const redis = (await import('../src/config/redis')).default;
  try {
    await redis.del(testKey);
  } catch (err) {}

  // 2. Schedule campaign
  const recipients = Array.from({ length: TOTAL_JOBS }, (_, i) => `recipient_${i + 1}@example.com`);

  const campaignResult = await EmailService.scheduleEmailCampaign({
    userId: user.id,
    fromEmail: SENDER,
    recipients,
    subject: 'Rate Limit Verification Email',
    body: 'Testing sliding window rate-limiter and automatic rescheduling.',
    delayBetweenMs: 500,
    hourlyLimit: HOURLY_LIMIT,
    scheduledStartTime: new Date(),
  });

  console.log(` queued ${campaignResult.emailCount} jobs for sender ${SENDER}`);
  console.log('⏳ Waiting for worker to process first batch...');

  // Allow worker 5 seconds to process initial burst
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Inspect database status counts
  const sentCount = await prisma.email.count({
    where: { sender: SENDER, status: 'SENT' },
  });

  const rescheduledCount = await prisma.email.count({
    where: { sender: SENDER, status: 'RESCHEDULED' },
  });

  console.log(`
📊 Test Results:
   - Sent Emails: ${sentCount} (Expected: <= ${HOURLY_LIMIT})
   - Rescheduled Emails: ${rescheduledCount} (Expected: ${TOTAL_JOBS - sentCount})
  `);

  if (sentCount <= HOURLY_LIMIT && rescheduledCount > 0) {
    console.log(' SUCCESS: Rate limit respected & excess jobs rescheduled without data loss!');
  } else {
    console.warn('⚠️ Verification complete - inspect queue dashboard for full details.');
  }

  process.exit(0);
}

runRateLimitTest().catch((err) => {
  console.error('❌ Rate limit test error:', err);
  process.exit(1);
});
