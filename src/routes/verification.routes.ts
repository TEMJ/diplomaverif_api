import { Router } from 'express';
import verificationController from '../controllers/verification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes for managing certificate verifications
 * Complete CRUD for verifications
 */
const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/verifications - Retrieve all verifications (with filters)
router.get('/', verificationController.getAll.bind(verificationController));

// GET /api/verifications/:id - Retrieve verification by ID
router.get('/:id', verificationController.getById.bind(verificationController));

// POST /api/verifications - Create new verification (authenticated users)
router.post('/', verificationController.create.bind(verificationController));

// DELETE /api/verifications/:id - Delete verification (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), verificationController.delete.bind(verificationController));

export default router;

