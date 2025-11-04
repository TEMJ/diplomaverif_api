import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Contrôleur pour la gestion des dossiers étudiants
 * Gère les opérations CRUD sur les dossiers étudiants
 */
class StudentRecordController {
  /**
   * Récupérer tous les dossiers étudiants
   * GET /api/student-records
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (studentId) where.studentId = studentId as string;

      const skip = (Number(page) - 1) * Number(limit);

      const [records, total] = await Promise.all([
        prisma.studentRecord.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              select: {
                id: true,
                matricule: true,
                email: true,
                major: true,
              },
            },
          },
        }),
        prisma.studentRecord.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        count: records.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: records,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers étudiants:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des dossiers étudiants',
      });
    }
  }

  /**
   * Récupérer un dossier étudiant par ID
   * GET /api/student-records/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const record = await prisma.studentRecord.findUnique({
        where: { id },
        include: {
          student: {
            include: {
              university: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Dossier étudiant introuvable',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier étudiant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du dossier étudiant',
      });
    }
  }

  /**
   * Récupérer un dossier étudiant par studentId
   * GET /api/student-records/student/:studentId
   */
  async getByStudentId(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;

      const record = await prisma.studentRecord.findUnique({
        where: { studentId },
        include: {
          student: {
            include: {
              university: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Dossier étudiant introuvable',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier étudiant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du dossier étudiant',
      });
    }
  }

  /**
   * Créer un nouveau dossier étudiant
   * POST /api/student-records
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        studentId,
        attendance,
        discipline,
        gradesPdfUrl,
        transcriptPdfUrl,
        diplomaPdfUrl,
      } = req.body;

      // Validation des données
      if (!studentId || !gradesPdfUrl || !transcriptPdfUrl || !diplomaPdfUrl) {
        res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis',
        });
        return;
      }

      // Vérifier si l'étudiant existe
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Étudiant introuvable',
        });
        return;
      }

      // Vérifier si un dossier existe déjà pour cet étudiant
      const existingRecord = await prisma.studentRecord.findUnique({
        where: { studentId },
      });

      if (existingRecord) {
        res.status(409).json({
          success: false,
          message: 'Un dossier existe déjà pour cet étudiant',
        });
        return;
      }

      // Créer le dossier étudiant
      const record = await prisma.studentRecord.create({
        data: {
          studentId,
          attendance: attendance || 0,
          discipline: discipline || '',
          gradesPdfUrl,
          transcriptPdfUrl,
          diplomaPdfUrl,
        },
        include: {
          student: {
            select: {
              id: true,
              matricule: true,
              email: true,
              major: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Dossier étudiant créé avec succès',
        data: record,
      });
    } catch (error) {
      console.error('Erreur lors de la création du dossier étudiant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création du dossier étudiant',
      });
    }
  }

  /**
   * Mettre à jour un dossier étudiant
   * PUT /api/student-records/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { attendance, discipline, gradesPdfUrl, transcriptPdfUrl, diplomaPdfUrl } = req.body;

      // Vérifier si le dossier existe
      const existingRecord = await prisma.studentRecord.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        res.status(404).json({
          success: false,
          message: 'Dossier étudiant introuvable',
        });
        return;
      }

      // Mettre à jour le dossier
      const record = await prisma.studentRecord.update({
        where: { id },
        data: {
          attendance,
          discipline,
          gradesPdfUrl,
          transcriptPdfUrl,
          diplomaPdfUrl,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Dossier étudiant mis à jour avec succès',
        data: record,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dossier étudiant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour du dossier étudiant',
      });
    }
  }

  /**
   * Supprimer un dossier étudiant
   * DELETE /api/student-records/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Vérifier si le dossier existe
      const existingRecord = await prisma.studentRecord.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        res.status(404).json({
          success: false,
          message: 'Dossier étudiant introuvable',
        });
        return;
      }

      // Supprimer le dossier
      await prisma.studentRecord.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Dossier étudiant supprimé avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier étudiant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la suppression du dossier étudiant',
      });
    }
  }
}

export default new StudentRecordController();

