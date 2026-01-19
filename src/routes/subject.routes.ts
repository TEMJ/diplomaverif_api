import express from 'express';
import subjectController from '../controllers/subject.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

/**
 * Subject Routes
 * All routes require authentication
 */

// Get all subjects (with optional filters)
router.get('/', authenticate, subjectController.getAll);

// Get subjects for a specific university
router.get('/university/:universityId', authenticate, subjectController.getByUniversity);

// Get a specific subject by ID
router.get('/:id', authenticate, subjectController.getById);

// Create a new subject (ADMIN or UNIVERSITY only)
router.post('/', authenticate, authorize(Role.ADMIN, Role.UNIVERSITY), subjectController.create);

// Update a subject (ADMIN or UNIVERSITY only)
router.put('/:id', authenticate, authorize(Role.ADMIN, Role.UNIVERSITY), subjectController.update);

// Delete a subject (ADMIN or UNIVERSITY only)
router.delete('/:id', authenticate, authorize(Role.ADMIN, Role.UNIVERSITY), subjectController.delete);

export default router;
