import dotenv from 'dotenv';
dotenv.config();
import prisma from '../src/config/database';
import { emailQueue } from '../src/queues/email.queue';
import { EmailService } from '../src/services/email.service';

async function runRestartTest() {
  console.log('🧪 Starting Server Restart & Job Persistence Test...');

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'restart@reachinbox.ai',
        name: 'Restart Tester',
      },
    });
  }

  // Schedule email for 120 seconds in the future
  const futureDate = new Date(Date.now() + 120000);

  console.log(`📅 Scheduling delayed email job target time: ${futureDate.toLocaleTimeString()} (+120s)`);

  const result = await EmailService.scheduleEmailCampaign({
    userId: user.id,
    fromEmail: 'persistence@reachinbox.ai',
    recipients: ['future_recipient@example.com'],
    subject: 'Persistence Across Backend Restart Test',
    body: 'This email job was queued before server restart.',
    delayBetweenMs: 1000,
    hourlyLimit: 100,
    scheduledStartTime: futureDate,
  });

  const emailRecord = result.scheduledEmails[0];
  console.log(` queued Email ID: ${emailRecord.id}, BullMQ Job ID: ${emailRecord.jobId}`);

  console.log(`
ℹ️ PERSISTENCE TEST PROCEDURE:
 1. Redis holds this delayed job persistently in set 'bull:emailQueue:delayed'.
 2. You may safely stop the backend server process (Ctrl+C).
 3. Wait 120 seconds.
 4. Restart the backend server ('npm run dev').
 5. The BullMQ worker will immediately pick up and send the email at ${futureDate.toLocaleTimeString()}.
 6. Run database query to verify email status transition to 'SENT' without duplicating!
  `);

  process.exit(0);
}

runRestartTest().catch((err) => {
  console.error('❌ Restart test error:', err);
  process.exit(1);
});
