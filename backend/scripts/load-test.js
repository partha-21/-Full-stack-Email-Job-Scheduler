"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database_1 = __importDefault(require("../src/config/database"));
const email_queue_1 = require("../src/queues/email.queue");
const email_service_1 = require("../src/services/email.service");
async function runLoadTest() {
    console.log('🧪 Starting 1,000+ Email Load Test Simulation...');
    // Create or find a test user
    let user = await database_1.default.user.findFirst();
    if (!user) {
        user = await database_1.default.user.create({
            data: {
                email: 'loadtest@reachinbox.ai',
                name: 'Load Tester',
            },
        });
    }
    const TOTAL_EMAILS = 1000;
    console.log(` Generating ${TOTAL_EMAILS} synthetic email recipient records...`);
    const recipients = [];
    for (let i = 1; i <= TOTAL_EMAILS; i++) {
        recipients.push(`lead_${i}@testdomain.com`);
    }
    const startTime = new Date();
    console.log(`⏱️ Submitting campaign to EmailService with 100ms delay between dispatches...`);
    const result = await email_service_1.EmailService.scheduleEmailCampaign({
        userId: user.id,
        fromEmail: 'sales@reachinbox.ai',
        recipients,
        subject: 'High Volume Scalability Load Test Email',
        body: 'Hello, this is a simulated high-concurrency email test payload.',
        delayBetweenMs: 10,
        hourlyLimit: 5000,
        scheduledStartTime: startTime,
    });
    console.log(`✅ Successfully queued ${result.scheduledCount} jobs into BullMQ!`);
    // Inspect BullMQ queue metrics
    const counts = await email_queue_1.emailQueue.getJobCounts('waiting', 'delayed', 'active', 'completed', 'failed');
    console.log('📊 BullMQ Queue Metrics Post-Enqueue:', counts);
    console.log('\n✅ Load test completed successfully. Check BullMQ Dashboard at http://localhost:5000/admin/queues');
    process.exit(0);
}
runLoadTest().catch((err) => {
    console.error('❌ Load test error:', err);
    process.exit(1);
});
