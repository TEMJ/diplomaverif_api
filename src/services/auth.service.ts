import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { Role } from '@prisma/client';

/**
 * Interface for JWT token payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  universityId?: string;
  studentId?: string;
}

/**
 * Authentication service
 * Handles JWT token generation and validation
 * Handles password hashing and verification
 */
class AuthService {
  /**
   * Generates a JWT token for a user
   * @param payload - Data to include in the token
   * @returns The signed JWT token
   */
  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.jwtSecret as string, {
      expiresIn: env.jwtExpiresIn,
    } as SignOptions);
  }

  /**
   * Verifies and decodes a JWT token
   * @param token - JWT token to verify
   * @returns Decoded payload or null if invalid
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, env.jwtSecret as string) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Hashes a plain password with bcrypt
   * @param password - Password to hash
   * @returns Bcrypt hash of the password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compares a plain password with a bcrypt hash
   * @param password - Plain password
   * @param hash - Bcrypt hash
   * @returns True if password matches, false otherwise
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generates a random temporary password
   * @returns A secure password
   */
  generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one uppercase, lowercase, digit, and special character
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export default new AuthService();

