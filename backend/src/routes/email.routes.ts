import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Require auth for all email operations
router.use(authMiddleware);

router.post('/parse-csv', EmailController.parseCSV);
router.post('/schedule', EmailController.scheduleEmails);
router.get('/scheduled', EmailController.getScheduledEmails);
router.get('/sent', EmailController.getSentEmails);
router.get('/search', EmailController.searchEmails);
router.get('/:id', EmailController.getEmailById);

export default router;
