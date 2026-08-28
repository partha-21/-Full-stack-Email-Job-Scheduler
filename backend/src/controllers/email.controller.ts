import { Request, Response } from 'express';
import prisma from '../config/database';
import { EmailService } from '../services/email.service';
import { ElasticsearchService } from '../services/elasticsearch.service';

export class EmailController {
  static async parseCSV(req: Request, res: Response) {
    try {
      const { content } = req.body;
      if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Content must be a string' });
      }

      const result = EmailService.parseRecipients(content);
      return res.json({
        validEmails: result.validEmails,
        detectedCount: result.totalCount,
        invalidCount: result.invalidCount,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async scheduleEmails(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        fromEmail,
        recipients,
        recipientContent,
        subject,
        body,
        delayBetweenMs = 2000,
        hourlyLimit = 100,
        scheduledStartTime,
      } = req.body;

      if (!fromEmail || (!recipients && !recipientContent) || !subject || !body) {
        return res.status(400).json({
          error: 'Missing required fields: fromEmail, recipients (or recipientContent), subject, body',
        });
      }

      let parsedRecipients: string[] = [];
      if (Array.isArray(recipients) && recipients.length > 0) {
        parsedRecipients = recipients.map((r) => r.trim().toLowerCase()).filter((r) => r.includes('@'));
      } else if (typeof recipientContent === 'string') {
        const parsed = EmailService.parseRecipients(recipientContent);
        parsedRecipients = parsed.validEmails;
      }

      if (parsedRecipients.length === 0) {
        return res.status(400).json({ error: 'No valid recipient email addresses detected' });
      }

      const startTime = scheduledStartTime ? new Date(scheduledStartTime) : new Date();

      const result = await EmailService.scheduleEmailCampaign({
        userId,
        fromEmail,
        recipients: parsedRecipients,
        subject,
        body,
        delayBetweenMs: Number(delayBetweenMs) || 2000,
        hourlyLimit: Number(hourlyLimit) || 100,
        scheduledStartTime: startTime,
      });

      return res.status(201).json({
        message: 'Campaign scheduled successfully',
        campaignId: result.campaign.id,
        scheduledCount: result.emailCount,
        scheduledStartTime: startTime,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getScheduledEmails(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const emails = await prisma.email.findMany({
        where: {
          userId,
          status: { in: ['QUEUED', 'RESCHEDULED', 'PROCESSING'] },
        },
        orderBy: { scheduledAt: 'asc' },
      });

      const count = await prisma.email.count({
        where: {
          userId,
          status: { in: ['QUEUED', 'RESCHEDULED', 'PROCESSING'] },
        },
      });

      return res.json({
        emails,
        total: count,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getSentEmails(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const emails = await prisma.email.findMany({
        where: {
          userId,
          status: { in: ['SENT', 'FAILED'] },
        },
        orderBy: { sentAt: 'desc' },
      });

      const count = await prisma.email.count({
        where: {
          userId,
          status: { in: ['SENT', 'FAILED'] },
        },
      });

      return res.json({
        emails,
        total: count,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getEmailById(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const email = await prisma.email.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!email) {
        return res.status(404).json({ error: 'Email not found' });
      }

      return res.json({ email });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async searchEmails(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const query = (req.query.q as string) || '';

      const results = await ElasticsearchService.searchEmails(userId, query);
      return res.json({
        query,
        results,
        count: results.length,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
