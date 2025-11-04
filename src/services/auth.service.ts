import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { Role } from '@prisma/client';

/**
 * Interface pour le payload du token JWT
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  universityId?: string;
  studentId?: string;
}

/**
 * Service d'authentification
 * Gère la génération et validation des tokens JWT
 * Gère le hashage et la vérification des mots de passe
 */
class AuthService {
  /**
   * Génère un token JWT pour un utilisateur
   * @param payload - Les données à inclure dans le token
   * @returns Le token JWT signé
   */
  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });
  }

  /**
   * Vérifie et décode un token JWT
   * @param token - Le token JWT à vérifier
   * @returns Le payload décodé ou null si invalide
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, env.jwtSecret) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Hash un mot de passe en clair avec bcrypt
   * @param password - Le mot de passe à hasher
   * @returns Le hash bcrypt du mot de passe
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare un mot de passe en clair avec un hash bcrypt
   * @param password - Le mot de passe en clair
   * @param hash - Le hash bcrypt
   * @returns True si le mot de passe correspond, false sinon
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Génère un mot de passe temporaire aléatoire
   * @returns Un mot de passe sécurisé
   */
  generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Assurer au moins une majuscule, une minuscule, un chiffre et un caractère spécial
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Compléter le reste
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mélanger le mot de passe
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export default new AuthService();

