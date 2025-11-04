import { Router } from 'express';
import verificationController from '../controllers/verification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes pour la gestion des vérifications de certificats
 * CRUD complet pour les vérifications
 */
const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/verifications - Récupérer toutes les vérifications (avec filtres)
router.get('/', verificationController.getAll.bind(verificationController));

// GET /api/verifications/:id - Récupérer une vérification par ID
router.get('/:id', verificationController.getById.bind(verificationController));

// POST /api/verifications - Créer une nouvelle vérification (public mais loggé)
router.post('/', verificationController.create.bind(verificationController));

// DELETE /api/verifications/:id - Supprimer une vérification (ADMIN uniquement)
router.delete('/:id', authorize(Role.ADMIN), verificationController.delete.bind(verificationController));

export default router;

