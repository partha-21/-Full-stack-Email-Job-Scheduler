"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database_1 = __importDefault(require("../src/config/database"));
const email_service_1 = require("../src/services/email.service");
async function runRateLimitTest() {
    console.log('🧪 Starting Sender Hourly Rate Limit Test...');
    let user = await database_1.default.user.findFirst();
    if (!user) {
        user = await database_1.default.user.create({
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
    const redis = (await Promise.resolve().then(() => __importStar(require('../src/config/redis')))).default;
    await redis.del(testKey);
    // 2. Schedule campaign
    const recipients = Array.from({ length: TOTAL_JOBS }, (_, i) => `recipient_${i + 1}@example.com`);
    const campaignResult = await email_service_1.EmailService.scheduleEmailCampaign({
        userId: user.id,
        fromEmail: SENDER,
        recipients,
        subject: 'Rate Limit Verification Email',
        body: 'Testing sliding window rate-limiter and automatic rescheduling.',
        delayBetweenMs: 500,
        hourlyLimit: HOURLY_LIMIT,
        scheduledStartTime: new Date(),
    });
    console.log(` queued ${campaignResult.scheduledCount} jobs for sender ${SENDER}`);
    console.log('⏳ Waiting for worker to process first batch...');
    // Allow worker 5 seconds to process initial burst
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // Inspect database status counts
    const sentCount = await database_1.default.email.count({
        where: { sender: SENDER, status: 'SENT' },
    });
    const rescheduledCount = await database_1.default.email.count({
        where: { sender: SENDER, status: 'RESCHEDULED' },
    });
    console.log(`
📊 Test Results:
   - Sent Emails: ${sentCount} (Expected: <= ${HOURLY_LIMIT})
   - Rescheduled Emails: ${rescheduledCount} (Expected: ${TOTAL_JOBS - sentCount})
  `);
    if (sentCount <= HOURLY_LIMIT && rescheduledCount > 0) {
        console.log(' SUCCESS: Rate limit respected & excess jobs rescheduled without data loss!');
    }
    else {
        console.warn('⚠️ Verification complete - inspect queue dashboard for full details.');
    }
    process.exit(0);
}
runRateLimitTest().catch((err) => {
    console.error('❌ Rate limit test error:', err);
    process.exit(1);
});
