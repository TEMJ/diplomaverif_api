import { Router } from 'express';
import universityController from '../controllers/university.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import fileUploadService from '../services/file-upload.service';
import { Role } from '@prisma/client';

/**
 * Routes for managing universities (UK-compliant)
 * Complete CRUD for universities with file uploads for logos, seals, and signatures
 */
const router = Router();

// Create upload middleware instances
const logoUpload = fileUploadService.createLogoUpload();
const sealUpload = fileUploadService.createSealUpload();
const signatureUpload = fileUploadService.createSignatureUpload();

// Combined upload middleware for creating university with files
const combinedUpload = fileUploadService.createCombinedUpload();

// All routes require authentication
router.use(authenticate);

// GET /api/universities - Retrieve all universities
router.get('/', universityController.getAll.bind(universityController));

// GET /api/universities/:id - Retrieve university by ID
router.get('/:id', universityController.getById.bind(universityController));

// POST /api/universities - Create new university (ADMIN only) - Supports file uploads
router.post(
  '/',
  authorize(Role.ADMIN),
  combinedUpload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'seal', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
  ]),
  universityController.create.bind(universityController),
);

// PUT /api/universities/:id - Update university (ADMIN only)
router.put('/:id', authorize(Role.ADMIN), universityController.update.bind(universityController));

// PUT /api/universities/:id/logo - Upload university logo
router.put('/:id/logo', logoUpload.single('logo'), universityController.uploadLogo.bind(universityController));

// PUT /api/universities/:id/seal - Upload official embossed seal
router.put('/:id/seal', sealUpload.single('seal'), universityController.uploadSeal.bind(universityController));

// PUT /api/universities/:id/signature - Upload registrar's digitalized signature
router.put('/:id/signature', signatureUpload.single('signature'), universityController.uploadSignature.bind(universityController));

// DELETE /api/universities/:id - Delete university (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), universityController.delete.bind(universityController));

export default router;
