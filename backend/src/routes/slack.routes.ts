import { Router } from 'express';
import { SlackController } from '../controllers/slack.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// OAuth callback is public so Slack can call back
router.get('/callback', SlackController.slackCallback);

// Protected routes requiring user session
router.use(authMiddleware);

router.get('/connect', SlackController.connectSlack);
router.get('/status', SlackController.getSlackStatus);
router.post('/disconnect', SlackController.disconnectSlack);

export default router;
