import { Request, Response, NextFunction } from 'express';
import authService, { JWTPayload } from '../services/auth.service';
import { Role } from '@prisma/client';

/**
 * Express Request interface extension
 * Adds user properties to the request
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies presence and validity of JWT token
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Missing or invalid authentication token',
      });
      return;
    }

    // Extract token (remove "Bearer ")
    const token = authHeader.substring(7);

    // Verify and decode token
    const payload = authService.verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
      });
      return;
    }

    // Add user information to request
    req.user = payload;

    // Pass to next middleware
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Role-based authorization middleware
 * Verifies user has correct role to access route
 * @param allowedRoles - Roles allowed to access route
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Verify user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Verify user role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access forbidden: insufficient permissions',
      });
      return;
    }

    // Pass to next middleware
    next();
  };
};

/**
 * Middleware to verify user belongs to specific university
 * Useful for routes where university can only access its own resources
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
export const authorizeUniversityAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  // Admins have access to everything
  if (req.user.role === Role.ADMIN) {
    next();
    return;
  }

  // Universities can only access their own resources
  if (req.user.role === Role.UNIVERSITY && req.user.universityId) {
    // Check that university ID matches
    const requestedUniversityId = req.params.universityId || req.body.universityId;
    
    if (requestedUniversityId && requestedUniversityId !== req.user.universityId) {
      res.status(403).json({
        success: false,
        message: 'Access forbidden: you can only access your own university',
      });
      return;
    }
  }

  next();
};

/**
 * Middleware to verify student accessing their own data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
export const authorizeStudentAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  // Admins and universities have access to everything
  if (req.user.role === Role.ADMIN || req.user.role === Role.UNIVERSITY) {
    next();
    return;
  }

  // Students can only access their own data
  if (req.user.role === Role.STUDENT && req.user.studentId) {
    const requestedStudentId = req.params.studentId || req.body.studentId;
    
    if (requestedStudentId && requestedStudentId !== req.user.studentId) {
      res.status(403).json({
        success: false,
        message: 'Access forbidden: you can only access your own data',
      });
      return;
    }
  }

  next();
};

