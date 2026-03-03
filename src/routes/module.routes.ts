import { Router } from 'express';
import moduleController from '../controllers/module.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import fileUploadService from '../services/file-upload.service';
import { Role } from '@prisma/client';

/**
 * Routes for managing Modules (Courses/Units)
 * Complete CRUD for academic modules
 */
const router = Router();

// CSV upload middleware for bulk import
const csvUpload = fileUploadService.createCsvUpload();

// All routes require authentication
router.use(authenticate);

// GET /api/modules - Retrieve all modules (with optional filters)
router.get('/', moduleController.getAll.bind(moduleController));

// GET /api/modules/:id - Retrieve module by ID
router.get('/:id', moduleController.getById.bind(moduleController));

// GET /api/modules/program/:programId - Retrieve modules by program
router.get('/program/:programId', moduleController.getByProgram.bind(moduleController));

// POST /api/modules - Create new module (UNIVERSITY and ADMIN only)
router.post('/', authorize(Role.UNIVERSITY, Role.ADMIN), moduleController.create.bind(moduleController));

// POST /api/modules/bulk-upload - Bulk create modules from CSV (UNIVERSITY and ADMIN only)
router.post(
  '/bulk-upload',
  authorize(Role.UNIVERSITY, Role.ADMIN),
  csvUpload.single('file'),
  moduleController.bulkUpload.bind(moduleController),
);

// PUT /api/modules/:id - Update module (UNIVERSITY and ADMIN only)
router.put('/:id', authorize(Role.UNIVERSITY, Role.ADMIN), moduleController.update.bind(moduleController));

// DELETE /api/modules/:id - Delete module (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), moduleController.delete.bind(moduleController));

export default router;
