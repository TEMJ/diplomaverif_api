import { Router } from 'express';
import universityController from '../controllers/university.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes for managing universities
 * Complete CRUD for universities
 */
const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/universities - Retrieve all universities
router.get('/', universityController.getAll.bind(universityController));

// GET /api/universities/:id - Retrieve university by ID
router.get('/:id', universityController.getById.bind(universityController));

// POST /api/universities - Create new university (ADMIN only)
router.post('/', authorize(Role.ADMIN), universityController.create.bind(universityController));

// PUT /api/universities/:id - Update university (ADMIN only)
router.put('/:id', authorize(Role.ADMIN), universityController.update.bind(universityController));

// DELETE /api/universities/:id - Delete university (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), universityController.delete.bind(universityController));

export default router;

