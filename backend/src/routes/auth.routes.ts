import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Official Google OAuth 2.0 initiate endpoint
router.get('/google', AuthController.initiateGoogleAuth);

// Official Google OAuth 2.0 callback endpoint
router.get('/google/callback', AuthController.googleCallback);

// Form Email ID Login
router.post('/dev-login', AuthController.devLogin);

// Current Authenticated User profile
router.get('/me', authMiddleware, AuthController.getMe);

// Logout
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
