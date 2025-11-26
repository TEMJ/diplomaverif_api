import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Error handling middleware
 * Catches and formats all application errors
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ Error:', err);

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint error
    if (err.code === 'P2002') {
      const field = err.meta?.target as string[];
      res.status(409).json({
        success: false,
        message: `Duplicate value already exists for: ${field?.join(', ')}`,
      });
      return;
    }

    // Record not found error
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
      return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid request data',
    });
    return;
  }

  // JSON syntax errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
    });
    return;
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

/**
 * Middleware to handle not found routes
 * Should be placed after all routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
};

