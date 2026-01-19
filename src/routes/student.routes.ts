import { Router } from 'express';
import studentController from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import fileUploadService from '../services/file-upload.service';
import { Role } from '@prisma/client';

/**
 * Routes for managing students (UK-compliant)
 * Complete CRUD for students with auto-generated matricule
 */
const router = Router();

// Create photo upload middleware
const photoUpload = fileUploadService.createPhotoUpload();

// All routes require authentication
router.use(authenticate);

// GET /api/students - Retrieve all students (with filters)
router.get('/', studentController.getAll.bind(studentController));

// GET /api/students/:id/with-grades - Retrieve student with grades and statistics
router.get('/:id/with-grades', studentController.getWithGrades.bind(studentController));

// GET /api/students/:id - Retrieve student by ID
router.get('/:id', studentController.getById.bind(studentController));

// POST /api/students - Create new student (UNIVERSITY and ADMIN only)
// Auto-generates student ID (matricule)
router.post('/', authorize(Role.UNIVERSITY, Role.ADMIN), studentController.create.bind(studentController));

// PUT /api/students/:id - Update student (UNIVERSITY and ADMIN only)
router.put('/:id', authorize(Role.UNIVERSITY, Role.ADMIN), studentController.update.bind(studentController));

// PUT /api/students/:id/photo - Upload student identity photograph
router.put('/:id/photo', photoUpload.single('photo'), studentController.uploadPhoto.bind(studentController));

// DELETE /api/students/:id - Delete student (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), studentController.delete.bind(studentController));

export default router;


