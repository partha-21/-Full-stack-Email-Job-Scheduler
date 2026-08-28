import { Router } from 'express';
import { SlackController } from '../controllers/slack.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/callback', SlackController.slackCallback);

router.use(authMiddleware);

router.get('/connect', SlackController.connectSlack);
router.get('/status', SlackController.getSlackStatus);
router.post('/disconnect', SlackController.disconnectSlack);

export default router;
