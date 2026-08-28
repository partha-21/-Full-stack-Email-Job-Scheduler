import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../config/database';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '';
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || '';
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export class SlackController {
  static async connectSlack(req: Request, res: Response) {
    if (!SLACK_CLIENT_ID) {
      const userId = req.user!.id;
      await prisma.slackConnection.upsert({
        where: { userId },
        update: {
          teamName: 'ReachInbox Workspace (Dev)',
          accessToken: 'xoxb-dev-mock-slack-token',
        },
        create: {
          userId,
          teamName: 'ReachInbox Workspace (Dev)',
          accessToken: 'xoxb-dev-mock-slack-token',
        },
      });
      return res.redirect(`${FRONTEND_URL}?slack=connected`);
    }

    const scopes = ['chat:write', 'channels:read', 'incoming-webhook'];
    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes.join(
      ','
    )}&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${req.user!.id}`;

    return res.redirect(slackAuthUrl);
  }

  static async slackCallback(req: Request, res: Response) {
    try {
      const { code, state: userId, error } = req.query;

      if (error) {
        return res.redirect(`${FRONTEND_URL}?slack=error&msg=${encodeURIComponent(error as string)}`);
      }

      if (!code) {
        return res.redirect(`${FRONTEND_URL}?slack=error&msg=No_code_provided`);
      }

      const tokenResponse = await axios.post(
        'https://slack.com/api/oauth.v2.access',
        new URLSearchParams({
          client_id: SLACK_CLIENT_ID,
          client_secret: SLACK_CLIENT_SECRET,
          code: code as string,
          redirect_uri: SLACK_REDIRECT_URI,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const data = tokenResponse.data;
      if (!data.ok) {
        return res.redirect(`${FRONTEND_URL}?slack=error&msg=${encodeURIComponent(data.error || 'OAuth_failed')}`);
      }

      const targetUserId = (userId as string) || req.user?.id;
      if (!targetUserId) {
        return res.redirect(`${FRONTEND_URL}?slack=error&msg=No_user_associated`);
      }

      await prisma.slackConnection.upsert({
        where: { userId: targetUserId },
        update: {
          accessToken: data.access_token,
          teamId: data.team?.id,
          teamName: data.team?.name,
          slackUserId: data.authed_user?.id,
          botUserId: data.bot_user_id,
        },
        create: {
          userId: targetUserId,
          accessToken: data.access_token,
          teamId: data.team?.id,
          teamName: data.team?.name,
          slackUserId: data.authed_user?.id,
          botUserId: data.bot_user_id,
        },
      });

      return res.redirect(`${FRONTEND_URL}?slack=connected`);
    } catch (err: any) {
      console.error('Slack OAuth callback error:', err.message);
      return res.redirect(`${FRONTEND_URL}?slack=error&msg=${encodeURIComponent(err.message)}`);
    }
  }

  static async getSlackStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const connection = await prisma.slackConnection.findUnique({
        where: { userId },
        select: {
          id: true,
          teamName: true,
          teamId: true,
          createdAt: true,
        },
      });

      return res.json({
        isConnected: Boolean(connection),
        connection: connection || null,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async disconnectSlack(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      await prisma.slackConnection.deleteMany({
        where: { userId },
      });

      return res.json({ message: 'Slack workspace disconnected successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
