import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import authService from '../services/auth.service';
import emailService from '../services/email.service';

/**
 * Authentication controller
 * Handles user login and session management
 */
class AuthController {
  /**
   * User login
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate data
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password required',
        });
        return;
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
          student: {
            select: {
              id: true,
            },
          },
        },
      });

      // Verify user exists
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Verify password
      const isPasswordValid = await authService.comparePassword(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Generate JWT token
      const token = authService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        universityId: user.universityId || undefined,
        studentId: user.studentId || undefined,
      });

      // Return token and user information
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            universityId: user.universityId,
            studentId: user.studentId,
            university: user.university,
          },
        },
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login',
      });
    }
  }

  /**
   * Get logged-in user information
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Retrieve complete user information
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          university: true,
          student: {
            include: {
              university: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Return user information (without password)
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      console.error('Error retrieving profile:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving profile',
      });
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Validate data
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password required',
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must contain at least 8 characters',
        });
        return;
      }

      // Retrieve user
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await authService.comparePassword(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
        return;
      }

      // Hash new password
      const hashedNewPassword = await authService.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while changing password',
      });
    }
  }

  /**
   * Request password reset (send OTP)
   * POST /api/auth/request-password-reset
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // To avoid account enumeration, always return success even if user not found
      if (!user) {
        res.status(200).json({
          success: true,
          message: 'If this email exists in our system, an OTP has been sent',
        });
        return;
      }

      // Generate 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Hash OTP before storing
      const otpHash = await bcrypt.hash(otp, 10);

      // Expire old tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Create new token with 5-minute expiry
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt,
        },
      });

      // Send OTP by email
      await emailService.sendPasswordResetEmail(user.email, otp, expiresAt);

      res.status(200).json({
        success: true,
        message: 'If this email exists in our system, an OTP has been sent',
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while requesting password reset',
      });
    }
  }

  /**
   * Reset password with OTP
   * POST /api/auth/reset-password
   */
  async resetPasswordWithOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Email, OTP, and new password are required',
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must contain at least 8 characters',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid email or OTP',
        });
        return;
      }

      const token = await prisma.passwordResetToken.findFirst({
        where: {
          userId: user.id,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
        return;
      }

      const isOtpValid = await bcrypt.compare(otp, token.otpHash);
      if (!isOtpValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
        return;
      }

      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      // Update password
      const hashedNewPassword = await authService.hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Error resetting password with OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while resetting password',
      });
    }
  }
}

export default new AuthController();

