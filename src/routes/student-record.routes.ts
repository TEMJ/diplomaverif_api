import { Router } from 'express';
import studentRecordController from '../controllers/student-record.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes for managing student records
 * Complete CRUD for student records (grades, attendance, discipline, etc.)
 */
const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/student-records - Retrieve all student records (with filters)
router.get('/', studentRecordController.getAll.bind(studentRecordController));

// GET /api/student-records/student/:studentId - Retrieve record by studentId
router.get('/student/:studentId', studentRecordController.getByStudentId.bind(studentRecordController));

// GET /api/student-records/:id - Retrieve student record by ID
router.get('/:id', studentRecordController.getById.bind(studentRecordController));

// POST /api/student-records - Create new student record (UNIVERSITY and ADMIN only)
router.post('/', authorize(Role.UNIVERSITY, Role.ADMIN), studentRecordController.create.bind(studentRecordController));

// PUT /api/student-records/:id - Update student record (UNIVERSITY and ADMIN only)
router.put('/:id', authorize(Role.UNIVERSITY, Role.ADMIN), studentRecordController.update.bind(studentRecordController));

// DELETE /api/student-records/:id - Delete student record (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), studentRecordController.delete.bind(studentRecordController));

export default router;

