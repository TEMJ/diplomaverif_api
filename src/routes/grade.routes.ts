import express from 'express';
import gradeController from '../controllers/grade.controller';
import bulkGradeController from '../controllers/bulkGrade.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

/**
 * Grade Routes
 * All routes require authentication
 */

// Get all grades (with optional filters)
router.get('/', authenticate, gradeController.getAll);

// Get grades for a specific student
router.get('/student/:studentId', authenticate, gradeController.getByStudent);

// Get all grades for a university
router.get('/university/:universityId', authenticate, gradeController.getByUniversity);

// Get a specific grade by ID
router.get('/:id', authenticate, gradeController.getById);

// Create or update a grade (ADMIN or UNIVERSITY only)
router.post('/', authenticate, authorize(Role.ADMIN, Role.UNIVERSITY), gradeController.create);

// Bulk grade entry (ADMIN or UNIVERSITY only)
router.post('/bulk-entry', authenticate, authorize(Role.ADMIN, Role.UNIVERSITY), bulkGradeController.bulkEntry);

// Update a grade (ADMIN or UNIVERSITY only)
router.put('/:id', authenticate, authorize(Role.ADMIN, Role.UNIVERSITY), gradeController.update);

// Delete a grade (ADMIN or UNIVERSITY only)
router.delete('/:id', authenticate, authorize(Role.ADMIN, Role.UNIVERSITY), gradeController.delete);

export default router;
