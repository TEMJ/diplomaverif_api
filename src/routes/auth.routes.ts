import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Authentication routes
 * Handles login, profile retrieval, and password change
 */
const router = Router();

// POST /api/auth/login - User login
router.post('/login', authController.login.bind(authController));

// GET /api/auth/me - Retrieve logged-in user information
router.get('/me', authenticate, authController.getMe.bind(authController));

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticate, authController.changePassword.bind(authController));

export default router;

