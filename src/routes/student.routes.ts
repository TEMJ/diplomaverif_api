import { Router } from 'express';
import studentController from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes pour la gestion des étudiants
 * CRUD complet pour les étudiants avec filtres par université et major
 */
const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/students - Récupérer tous les étudiants (avec filtres)
router.get('/', studentController.getAll.bind(studentController));

// GET /api/students/:id - Récupérer un étudiant par ID
router.get('/:id', studentController.getById.bind(studentController));

// POST /api/students - Créer un nouvel étudiant (UNIVERSITY et ADMIN uniquement)
router.post('/', authorize(Role.UNIVERSITY, Role.ADMIN), studentController.create.bind(studentController));

// PUT /api/students/:id - Mettre à jour un étudiant (UNIVERSITY et ADMIN uniquement)
router.put('/:id', authorize(Role.UNIVERSITY, Role.ADMIN), studentController.update.bind(studentController));

// DELETE /api/students/:id - Supprimer un étudiant (ADMIN uniquement)
router.delete('/:id', authorize(Role.ADMIN), studentController.delete.bind(studentController));

export default router;

