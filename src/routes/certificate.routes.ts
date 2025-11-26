import { Router } from 'express';
import certificateController from '../controllers/certificate.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes for managing certificates/diplomas
 * Complete CRUD for certificates with QR code verification
 */
const router = Router();

// GET /api/certificates/verify/:qrHash - Verify certificate by QR code (public)
router.get('/verify/:qrHash', certificateController.verifyByHash.bind(certificateController));

// All other routes require authentication
router.use(authenticate);

// GET /api/certificates - Retrieve all certificates (with filters)
router.get('/', certificateController.getAll.bind(certificateController));

// GET /api/certificates/:id - Retrieve certificate by ID
router.get('/:id', certificateController.getById.bind(certificateController));

// POST /api/certificates - Create new certificate (UNIVERSITY and ADMIN only)
router.post('/', authorize(Role.UNIVERSITY, Role.ADMIN), certificateController.create.bind(certificateController));

// PUT /api/certificates/:id - Update certificate (UNIVERSITY and ADMIN only)
router.put('/:id', authorize(Role.UNIVERSITY, Role.ADMIN), certificateController.update.bind(certificateController));

// PATCH /api/certificates/:id/revoke - Revoke certificate (UNIVERSITY and ADMIN only)
router.patch('/:id/revoke', authorize(Role.UNIVERSITY, Role.ADMIN), certificateController.revoke.bind(certificateController));

// DELETE /api/certificates/:id - Delete certificate (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), certificateController.delete.bind(certificateController));

export default router;

