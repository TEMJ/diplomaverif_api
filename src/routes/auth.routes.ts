import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Authentication routes
 * Handles login, profile retrieval, password change, and password reset via OTP
 */
const router = Router();

// POST /api/auth/login - User login
router.post('/login', authController.login.bind(authController));

// GET /api/auth/me - Retrieve logged-in user information
router.get('/me', authenticate, authController.getMe.bind(authController));

// POST /api/auth/change-password - Change password (authenticated)
router.post('/change-password', authenticate, authController.changePassword.bind(authController));

// POST /api/auth/request-password-reset - Request OTP to reset password
router.post('/request-password-reset', authController.requestPasswordReset.bind(authController));

// POST /api/auth/reset-password - Reset password using OTP
router.post('/reset-password', authController.resetPasswordWithOtp.bind(authController));

export default router;

