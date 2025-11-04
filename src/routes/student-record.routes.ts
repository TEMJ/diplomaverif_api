import { Router } from 'express';
import studentRecordController from '../controllers/student-record.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

/**
 * Routes pour la gestion des dossiers étudiants
 * CRUD complet pour les dossiers étudiants (notes, assiduité, discipline, etc.)
 */
const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/student-records - Récupérer tous les dossiers étudiants (avec filtres)
router.get('/', studentRecordController.getAll.bind(studentRecordController));

// GET /api/student-records/student/:studentId - Récupérer un dossier par studentId
router.get('/student/:studentId', studentRecordController.getByStudentId.bind(studentRecordController));

// GET /api/student-records/:id - Récupérer un dossier étudiant par ID
router.get('/:id', studentRecordController.getById.bind(studentRecordController));

// POST /api/student-records - Créer un nouveau dossier étudiant (UNIVERSITY et ADMIN uniquement)
router.post('/', authorize(Role.UNIVERSITY, Role.ADMIN), studentRecordController.create.bind(studentRecordController));

// PUT /api/student-records/:id - Mettre à jour un dossier étudiant (UNIVERSITY et ADMIN uniquement)
router.put('/:id', authorize(Role.UNIVERSITY, Role.ADMIN), studentRecordController.update.bind(studentRecordController));

// DELETE /api/student-records/:id - Supprimer un dossier étudiant (ADMIN uniquement)
router.delete('/:id', authorize(Role.ADMIN), studentRecordController.delete.bind(studentRecordController));

export default router;

