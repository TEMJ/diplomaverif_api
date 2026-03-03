import { Router } from 'express';
import programController from '../controllers/program.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import fileUploadService from '../services/file-upload.service';
import { Role } from '@prisma/client';

/**
 * Routes for managing Programs (Degree Structures)
 * Complete CRUD for academic programs
 */
const router = Router();

// CSV upload middleware for bulk import
const csvUpload = fileUploadService.createCsvUpload();

// All routes require authentication
router.use(authenticate);

// GET /api/programs - Retrieve all programs (with optional filters)
router.get('/', programController.getAll.bind(programController));

// GET /api/programs/:id - Retrieve program by ID
router.get('/:id', programController.getById.bind(programController));

// POST /api/programs - Create new program (UNIVERSITY and ADMIN only)
router.post('/', authorize(Role.UNIVERSITY, Role.ADMIN), programController.create.bind(programController));

// POST /api/programs/bulk-upload - Bulk create programs from CSV (UNIVERSITY and ADMIN only)
router.post(
  '/bulk-upload',
  authorize(Role.UNIVERSITY, Role.ADMIN),
  csvUpload.single('file'),
  programController.bulkUpload.bind(programController),
);

// PUT /api/programs/:id - Update program (UNIVERSITY and ADMIN only)
router.put('/:id', authorize(Role.UNIVERSITY, Role.ADMIN), programController.update.bind(programController));

// DELETE /api/programs/:id - Delete program (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), programController.delete.bind(programController));

export default router;
