import { Router } from 'express';
import studentController from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes for managing students
 * Complete CRUD for students with filters by university and major
 */
const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/students - Retrieve all students (with filters)
router.get('/', studentController.getAll.bind(studentController));

// GET /api/students/:id - Retrieve student by ID
router.get('/:id', studentController.getById.bind(studentController));

// POST /api/students - Create new student (UNIVERSITY and ADMIN only)
router.post('/', authorize(Role.UNIVERSITY, Role.ADMIN), studentController.create.bind(studentController));

// PUT /api/students/:id - Update student (UNIVERSITY and ADMIN only)
router.put('/:id', authorize(Role.UNIVERSITY, Role.ADMIN), studentController.update.bind(studentController));

// DELETE /api/students/:id - Delete student (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), studentController.delete.bind(studentController));

export default router;

