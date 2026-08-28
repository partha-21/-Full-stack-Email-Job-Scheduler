import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/google', AuthController.initiateGoogleAuth);

router.get('/google/callback', AuthController.googleCallback);

router.post('/dev-login', AuthController.devLogin);

router.get('/me', authMiddleware, AuthController.getMe);

router.post('/logout', authMiddleware, AuthController.logout);

export default router;
