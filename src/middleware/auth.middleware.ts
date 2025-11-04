import { Request, Response, NextFunction } from 'express';
import authService, { JWTPayload } from '../services/auth.service';
import { Role } from '@prisma/client';

/**
 * Extension de l'interface Request d'Express
 * Ajoute les propriétés utilisateur au request
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware d'authentification
 * Vérifie la présence et la validité du token JWT
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant ou invalide',
      });
      return;
    }

    // Extraire le token (supprimer "Bearer ")
    const token = authHeader.substring(7);

    // Vérifier et décoder le token
    const payload = authService.verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification invalide ou expiré',
      });
      return;
    }

    // Ajouter les informations utilisateur au request
    req.user = payload;

    // Passer au prochain middleware
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Erreur d\'authentification',
    });
  }
};

/**
 * Middleware d'autorisation basé sur les rôles
 * Vérifie que l'utilisateur a le bon rôle pour accéder à la route
 * @param allowedRoles - Les rôles autorisés à accéder à la route
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
      return;
    }

    // Vérifier que le rôle de l'utilisateur est autorisé
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Accès interdit: permissions insuffisantes',
      });
      return;
    }

    // Passer au prochain middleware
    next();
  };
};

/**
 * Middleware pour vérifier que l'utilisateur appartient à une université spécifique
 * Utile pour les routes où l'université peut seulement accéder à ses propres ressources
 * @param req - La requête Express
 * @param res - La réponse Express
 * @param next - Le prochain middleware
 */
export const authorizeUniversityAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié',
    });
    return;
  }

  // Les admins ont accès à tout
  if (req.user.role === Role.ADMIN) {
    next();
    return;
  }

  // Les universités ne peuvent accéder qu'à leurs propres ressources
  if (req.user.role === Role.UNIVERSITY && req.user.universityId) {
    // Vérifier que l'université ID correspond
    const requestedUniversityId = req.params.universityId || req.body.universityId;
    
    if (requestedUniversityId && requestedUniversityId !== req.user.universityId) {
      res.status(403).json({
        success: false,
        message: 'Accès interdit: vous ne pouvez accéder qu\'à votre propre université',
      });
      return;
    }
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est un étudiant accédant à ses propres données
 * @param req - La requête Express
 * @param res - La réponse Express
 * @param next - Le prochain middleware
 */
export const authorizeStudentAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié',
    });
    return;
  }

  // Les admins et universités ont accès à tout
  if (req.user.role === Role.ADMIN || req.user.role === Role.UNIVERSITY) {
    next();
    return;
  }

  // Les étudiants ne peuvent accéder qu'à leurs propres données
  if (req.user.role === Role.STUDENT && req.user.studentId) {
    const requestedStudentId = req.params.studentId || req.body.studentId;
    
    if (requestedStudentId && requestedStudentId !== req.user.studentId) {
      res.status(403).json({
        success: false,
        message: 'Accès interdit: vous ne pouvez accéder qu\'à vos propres données',
      });
      return;
    }
  }

  next();
};

