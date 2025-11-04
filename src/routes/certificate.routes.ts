import { Router } from 'express';
import certificateController from '../controllers/certificate.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes pour la gestion des certificats/diplômes
 * CRUD complet pour les certificats avec vérification par QR code
 */
const router = Router();

// GET /api/certificates/verify/:qrHash - Vérifier un certificat par QR code (public)
router.get('/verify/:qrHash', certificateController.verifyByHash.bind(certificateController));

// Toutes les autres routes nécessitent une authentification
router.use(authenticate);

// GET /api/certificates - Récupérer tous les certificats (avec filtres)
router.get('/', certificateController.getAll.bind(certificateController));

// GET /api/certificates/:id - Récupérer un certificat par ID
router.get('/:id', certificateController.getById.bind(certificateController));

// POST /api/certificates - Créer un nouveau certificat (UNIVERSITY et ADMIN uniquement)
router.post('/', authorize(Role.UNIVERSITY, Role.ADMIN), certificateController.create.bind(certificateController));

// PUT /api/certificates/:id - Mettre à jour un certificat (UNIVERSITY et ADMIN uniquement)
router.put('/:id', authorize(Role.UNIVERSITY, Role.ADMIN), certificateController.update.bind(certificateController));

// PATCH /api/certificates/:id/revoke - Révoquer un certificat (UNIVERSITY et ADMIN uniquement)
router.patch('/:id/revoke', authorize(Role.UNIVERSITY, Role.ADMIN), certificateController.revoke.bind(certificateController));

// DELETE /api/certificates/:id - Supprimer un certificat (ADMIN uniquement)
router.delete('/:id', authorize(Role.ADMIN), certificateController.delete.bind(certificateController));

export default router;

