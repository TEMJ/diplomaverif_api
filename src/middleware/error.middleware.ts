import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Middleware de gestion des erreurs
 * Capture et formate toutes les erreurs de l'application
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ Erreur:', err);

  // Erreurs Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Erreur de contrainte unique
    if (err.code === 'P2002') {
      const field = err.meta?.target as string[];
      res.status(409).json({
        success: false,
        message: `Une valeur en double existe déjà pour: ${field?.join(', ')}`,
      });
      return;
    }

    // Enregistrement introuvable
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Ressource introuvable',
      });
      return;
    }
  }

  // Erreurs Prisma de validation
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Données de requête invalides',
    });
    return;
  }

  // Erreurs de syntaxe JSON
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Format JSON invalide',
    });
    return;
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
};

/**
 * Middleware pour gérer les routes non trouvées
 * Doit être placé après toutes les routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.path}`,
  });
};

