import { Router } from 'express';
import universityController from '../controllers/university.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes pour la gestion des universités
 * CRUD complet pour les universités
 */
const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/universities - Récupérer toutes les universités
router.get('/', universityController.getAll.bind(universityController));

// GET /api/universities/:id - Récupérer une université par ID
router.get('/:id', universityController.getById.bind(universityController));

// POST /api/universities - Créer une nouvelle université (ADMIN uniquement)
router.post('/', authorize(Role.ADMIN), universityController.create.bind(universityController));

// PUT /api/universities/:id - Mettre à jour une université (ADMIN uniquement)
router.put('/:id', authorize(Role.ADMIN), universityController.update.bind(universityController));

// DELETE /api/universities/:id - Supprimer une université (ADMIN uniquement)
router.delete('/:id', authorize(Role.ADMIN), universityController.delete.bind(universityController));

export default router;

