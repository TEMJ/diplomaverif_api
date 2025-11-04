import { Request, Response } from 'express';
import prisma from '../config/database';
import emailService from '../services/email.service';

/**
 * Contrôleur pour la gestion des vérifications
 * Gère les opérations CRUD sur les vérifications
 */
class VerificationController {
  /**
   * Récupérer toutes les vérifications
   * GET /api/verifications
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (certificateId) where.certificateId = certificateId as string;

      const skip = (Number(page) - 1) * Number(limit);

      const [verifications, total] = await Promise.all([
        prisma.verification.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { verificationDate: 'desc' },
          include: {
            certificate: {
              select: {
                id: true,
                degreeTitle: true,
                specialization: true,
                status: true,
              },
            },
          },
        }),
        prisma.verification.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        count: verifications.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: verifications,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des vérifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des vérifications',
      });
    }
  }

  /**
   * Récupérer une vérification par ID
   * GET /api/verifications/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const verification = await prisma.verification.findUnique({
        where: { id },
        include: {
          certificate: {
            include: {
              student: {
                select: {
                  id: true,
                  matricule: true,
                  email: true,
                },
              },
              university: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!verification) {
        res.status(404).json({
          success: false,
          message: 'Vérification introuvable',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: verification,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la vérification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération de la vérification',
      });
    }
  }

  /**
   * Créer une nouvelle vérification
   * POST /api/verifications
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId, companyName, email, reason } = req.body;

      // Validation des données
      if (!certificateId || !companyName || !email || !reason) {
        res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis',
        });
        return;
      }

      // Vérifier que le certificat existe
      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          student: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificat introuvable',
        });
        return;
      }

      // Créer la vérification
      const verification = await prisma.verification.create({
        data: {
          certificateId,
          companyName,
          email,
          reason,
          ipAddress: req.ip || 'unknown',
        },
        include: {
          certificate: {
            select: {
              id: true,
              degreeTitle: true,
              specialization: true,
              status: true,
            },
          },
        },
      });

      // Envoyer une notification à l'étudiant
      if (certificate.student?.email) {
        await emailService.sendVerificationNotification(
          certificate.student.email,
          certificate.student.email.split('@')[0],
          companyName,
          verification.verificationDate
        );
      }

      res.status(201).json({
        success: true,
        message: 'Vérification créée avec succès',
        data: verification,
      });
    } catch (error) {
      console.error('Erreur lors de la création de la vérification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création de la vérification',
      });
    }
  }

  /**
   * Supprimer une vérification
   * DELETE /api/verifications/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Vérifier si la vérification existe
      const existingVerification = await prisma.verification.findUnique({
        where: { id },
      });

      if (!existingVerification) {
        res.status(404).json({
          success: false,
          message: 'Vérification introuvable',
        });
        return;
      }

      // Supprimer la vérification
      await prisma.verification.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Vérification supprimée avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la vérification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la suppression de la vérification',
      });
    }
  }
}

export default new VerificationController();

