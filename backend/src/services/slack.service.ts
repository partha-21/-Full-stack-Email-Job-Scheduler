import { WebClient } from '@slack/web-api';
import prisma from '../config/database';

export class SlackService {
  static async sendRateLimitNotification(
    userId: string,
    senderEmail: string,
    limit: number,
    rescheduledTime?: Date
  ): Promise<boolean> {
    try {
      const connection = await prisma.slackConnection.findUnique({
        where: { userId },
      });

      if (!connection || !connection.accessToken) {
        console.log(`ℹ️ Slack not connected for user ${userId}. Skipping rate limit notification.`);
        return false;
      }

      const client = new WebClient(connection.accessToken);

      const nextTimeString = rescheduledTime
        ? rescheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'the next available hourly window';

      const message = {
        text: `⚠️ *Hourly Email Limit Reached*`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '⚠️ Sender Hourly Limit Exceeded',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Sender Account:*\n\`${senderEmail}\``,
              },
              {
                type: 'mrkdwn',
                text: `*Configured Limit:*\n\`${limit} emails/hour\``,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Additional scheduled emails have been safely postponed to *${nextTimeString}*. No emails were lost or dropped.`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `ReachInbox Email Job Scheduler • ${new Date().toISOString()}`,
              },
            ],
          },
        ],
      };

      try {
        await client.chat.postMessage({
          channel: connection.slackUserId || connection.botUserId || '#general',
          ...message,
        });
        console.log(`✅ Sent Slack rate-limit alert to user ${userId}`);
        return true;
      } catch (postErr: any) {
        console.warn(`Slack channel post failed, attempting DM fallback: ${postErr.message}`);
        const userConversations = await client.conversations.list({ types: 'public_channel,private_channel,im' });
        const targetChannel = userConversations.channels?.[0]?.id;
        if (targetChannel) {
          await client.chat.postMessage({
            channel: targetChannel,
            ...message,
          });
          console.log(`✅ Sent Slack rate-limit alert to channel ${targetChannel}`);
          return true;
        }
      }

      return false;
    } catch (error: any) {
      console.error(`❌ Slack notification error for user ${userId}:`, error.message);
      return false; // Graceful skip - do not fail job
    }
  }
}
