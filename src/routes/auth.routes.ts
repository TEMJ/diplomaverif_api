import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Routes d'authentification
 * Gère la connexion, la récupération du profil et le changement de mot de passe
 */
const router = Router();

// POST /api/auth/login - Connexion d'un utilisateur
router.post('/login', authController.login.bind(authController));

// GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
router.get('/me', authenticate, authController.getMe.bind(authController));

// POST /api/auth/change-password - Changer le mot de passe
router.post('/change-password', authenticate, authController.changePassword.bind(authController));

export default router;

