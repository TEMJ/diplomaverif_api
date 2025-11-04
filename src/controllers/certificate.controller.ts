import { Request, Response } from 'express';
import prisma from '../config/database';
import qrCodeService from '../services/qrcode.service';

/**
 * Contrôleur pour la gestion des certificats/diplômes
 * Gère les opérations CRUD sur les certificats
 */
class CertificateController {
  /**
   * Récupérer tous les certificats
   * GET /api/certificates
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, universityId, status, page = 1, limit = 10 } = req.query;

      const where: any = {};
      
      if (studentId) where.studentId = studentId as string;
      if (universityId) where.universityId = universityId as string;
      if (status) where.status = status as string;

      const skip = (Number(page) - 1) * Number(limit);

      const [certificates, total] = await Promise.all([
        prisma.certificate.findMany({
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
            university: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
            _count: {
              select: {
                verifications: true,
              },
            },
          },
        }),
        prisma.certificate.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        count: certificates.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: certificates,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des certificats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des certificats',
      });
    }
  }

  /**
   * Récupérer un certificat par ID
   * GET /api/certificates/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const certificate = await prisma.certificate.findUnique({
        where: { id },
        include: {
          student: {
            include: {
              university: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
          university: true,
          verifications: {
            take: 10,
            orderBy: { verificationDate: 'desc' },
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

      res.status(200).json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du certificat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du certificat',
      });
    }
  }

  /**
   * Créer un nouveau certificat
   * POST /api/certificates
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, universityId, degreeTitle, specialization, graduationDate, pdfUrl } = req.body;

      // Validation des données
      if (!studentId || !universityId || !degreeTitle || !specialization || !graduationDate || !pdfUrl) {
        res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis',
        });
        return;
      }

      // Générer le QR code et le hash
      const { qrHash, qrCodeUrl } = await qrCodeService.generateQRCodeWithHash();

      // Créer le certificat
      const certificate = await prisma.certificate.create({
        data: {
          studentId,
          universityId,
          degreeTitle,
          specialization,
          graduationDate: new Date(graduationDate),
          pdfUrl,
          qrCodeUrl,
          qrHash,
          status: 'ACTIVE',
        },
        include: {
          student: true,
          university: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Certificat créé avec succès',
        data: certificate,
      });
    } catch (error) {
      console.error('Erreur lors de la création du certificat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création du certificat',
      });
    }
  }

  /**
   * Mettre à jour un certificat
   * PUT /api/certificates/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { degreeTitle, specialization, graduationDate, pdfUrl, status } = req.body;

      // Vérifier si le certificat existe
      const existingCertificate = await prisma.certificate.findUnique({
        where: { id },
      });

      if (!existingCertificate) {
        res.status(404).json({
          success: false,
          message: 'Certificat introuvable',
        });
        return;
      }

      // Mettre à jour le certificat
      const certificate = await prisma.certificate.update({
        where: { id },
        data: {
          degreeTitle,
          specialization,
          graduationDate: graduationDate ? new Date(graduationDate) : undefined,
          pdfUrl,
          status,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Certificat mis à jour avec succès',
        data: certificate,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du certificat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour du certificat',
      });
    }
  }

  /**
   * Supprimer un certificat
   * DELETE /api/certificates/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Vérifier si le certificat existe
      const existingCertificate = await prisma.certificate.findUnique({
        where: { id },
      });

      if (!existingCertificate) {
        res.status(404).json({
          success: false,
          message: 'Certificat introuvable',
        });
        return;
      }

      // Supprimer le certificat (cascade supprimera les vérifications associées)
      await prisma.certificate.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Certificat supprimé avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du certificat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la suppression du certificat',
      });
    }
  }

  /**
   * Vérifier un certificat par hash QR
   * GET /api/certificates/verify/:qrHash
   */
  async verifyByHash(req: Request, res: Response): Promise<void> {
    try {
      const { qrHash } = req.params;

      const certificate = await prisma.certificate.findUnique({
        where: { qrHash },
        include: {
          student: {
            include: {
              university: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
          university: true,
        },
      });

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificat introuvable ou hash invalide',
        });
        return;
      }

      // Enregistrer la vérification
      const verification = await prisma.verification.create({
        data: {
          certificateId: certificate.id,
          companyName: 'Vérification publique',
          email: req.body.email || 'anonymous@example.com',
          reason: req.body.reason || 'Vérification de diplôme',
          ipAddress: req.ip || 'unknown',
        },
      });

      res.status(200).json({
        success: true,
        message: certificate.status === 'ACTIVE' ? 'Certificat valide' : 'Certificat révoqué',
        data: {
          certificate: {
            id: certificate.id,
            degreeTitle: certificate.degreeTitle,
            specialization: certificate.specialization,
            graduationDate: certificate.graduationDate,
            status: certificate.status,
            student: certificate.student,
            university: certificate.university,
          },
          verification: {
            id: verification.id,
            verificationDate: verification.verificationDate,
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du certificat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la vérification du certificat',
      });
    }
  }

  /**
   * Révoquer un certificat
   * PATCH /api/certificates/:id/revoke
   */
  async revoke(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const certificate = await prisma.certificate.findUnique({
        where: { id },
      });

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificat introuvable',
        });
        return;
      }

      const updatedCertificate = await prisma.certificate.update({
        where: { id },
        data: { status: 'REVOKED' },
      });

      res.status(200).json({
        success: true,
        message: 'Certificat révoqué avec succès',
        data: updatedCertificate,
      });
    } catch (error) {
      console.error('Erreur lors de la révocation du certificat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la révocation du certificat',
      });
    }
  }
}

export default new CertificateController();

