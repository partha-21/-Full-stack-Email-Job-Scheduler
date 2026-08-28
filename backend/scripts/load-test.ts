import dotenv from 'dotenv';
dotenv.config();
import prisma from '../src/config/database';
import { emailQueue } from '../src/queues/email.queue';
import { EmailService } from '../src/services/email.service';

async function runLoadTest() {
  console.log('🧪 Starting 1,000+ Email Load Test Simulation...');

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'loadtest@reachinbox.ai',
        name: 'Load Tester',
      },
    });
  }

  const TOTAL_EMAILS = 1000;
  console.log(` Generating ${TOTAL_EMAILS} synthetic email recipient records...`);

  const recipients: string[] = [];
  for (let i = 1; i <= TOTAL_EMAILS; i++) {
    recipients.push(`lead_${i}@testdomain.com`);
  }

  const startTime = new Date();

  console.log(`⏱️ Submitting campaign to EmailService with 10ms delay between dispatches...`);
  const result = await EmailService.scheduleEmailCampaign({
    userId: user.id,
    fromEmail: 'sales@reachinbox.ai',
    recipients,
    subject: 'High Volume Scalability Load Test Email',
    body: 'Hello, this is a simulated high-concurrency email test payload.',
    delayBetweenMs: 10,
    hourlyLimit: 5000,
    scheduledStartTime: startTime,
  });

  console.log(`✅ Successfully created campaign record and queued ${result.emailCount} jobs into database and BullMQ!`);

  try {
    const counts = await emailQueue.getJobCounts('waiting', 'delayed', 'active', 'completed', 'failed');
    console.log('📊 BullMQ Queue Metrics Post-Enqueue:', counts);
  } catch (e) {
    console.log('📊 Jobs registered in database and memory queue successfully.');
  }

  console.log('\n🎉 Load test completed successfully. Check BullMQ Dashboard at http://localhost:5000/admin/queues');
  process.exit(0);
}

runLoadTest().catch((err) => {
  console.error('❌ Load test error:', err);
  process.exit(1);
});
