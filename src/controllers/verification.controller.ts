import { Request, Response } from 'express';
import prisma from '../config/database';
import emailService from '../services/email.service';

/**
 * Controller for managing verifications
 * Handles CRUD operations on verifications
 */
class VerificationController {
  /**
   * Retrieve all verifications
   * GET /api/verifications
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId } = req.query;
      const user = req.user; // Utilisateur connecté

      const where: any = {};
      if (certificateId) where.certificateId = certificateId as string;

      // Filtrer par université si l'utilisateur est de rôle UNIVERSITY
      if (user?.role === 'UNIVERSITY' && user.universityId) {
        where.certificate = {
          universityId: user.universityId,
        };
      }

      const verifications = await prisma.verification.findMany({
        where,
        orderBy: { verificationDate: 'desc' },
        include: {
          certificate: {
            select: {
              id: true,
              status: true,
              graduationDate: true,
              finalMark: true,
              degreeClassification: true,
              universityId: true,  // Ajouté pour la vérification d'accès
              student: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
              program: {
                select: {
                  id: true,
                  title: true,
                  level: true,
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

      res.status(200).json({
        success: true,
        count: verifications.length,
        data: verifications,
      });
    } catch (error) {
      console.error('Error retrieving verifications:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving verifications',
      });
    }
  }

  /**
   * Retrieve a verification by ID
   * GET /api/verifications/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user; // Utilisateur connecté

      const verification = await prisma.verification.findUnique({
        where: { id },
        include: {
          certificate: {
            select: {
              id: true,
              status: true,
              graduationDate: true,
              finalMark: true,
              degreeClassification: true,
              universityId: true,  // Ajouté pour la vérification d'accès
              student: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                  enrollmentDate: true,
                },
              },
              program: {
                select: {
                  id: true,
                  title: true,
                  level: true,
                  totalCreditsRequired: true,
                },
              },
              university: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  contactEmail: true,
                },
              },
            },
          },
        },
      });

      if (!verification) {
        res.status(404).json({
          success: false,
          message: 'Verification not found',
        });
        return;
      }

      // Vérifier que la vérification appartient à l'université de l'utilisateur si rôle UNIVERSITY
      if (user?.role === 'UNIVERSITY' && user.universityId) {
        if (verification.certificate.universityId !== user.universityId) {
          res.status(403).json({
            success: false,
            message: 'Access denied: verification belongs to another university',
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        data: verification,
      });
    } catch (error) {
      console.error('Error retrieving verification:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving verification',
      });
    }
  }

  /**
   * Create a new verification
   * POST /api/verifications
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId, companyName, email, reason } = req.body;
      const user = req.user; // Utilisateur connecté

      // Validate data
      if (!certificateId || !companyName || !email || !reason) {
        res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
        return;
      }

      // Verify that certificate exists
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
          message: 'Certificate not found',
        });
        return;
      }

      // Vérifier que le certificat appartient à l'université de l'utilisateur si rôle UNIVERSITY
      if (user?.role === 'UNIVERSITY' && user.universityId) {
        if (certificate.universityId !== user.universityId) {
          res.status(403).json({
            success: false,
            message: 'Access denied: certificate belongs to another university',
          });
          return;
        }
      }

      // Create verification
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
              status: true,
            },
          },
        },
      });

      // Send notification to student
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
        message: 'Verification created successfully',
        data: verification,
      });
    } catch (error) {
      console.error('Error creating verification:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating verification',
      });
    }
  }

  /**
   * Delete a verification
   * DELETE /api/verifications/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user; // Utilisateur connecté

      // Check if verification exists
      const existingVerification = await prisma.verification.findUnique({
        where: { id },
        select: {
          certificate: {
            select: {
              universityId: true,
            },
          },
        },
      });

      if (!existingVerification) {
        res.status(404).json({
          success: false,
          message: 'Verification not found',
        });
        return;
      }

      // Vérifier que la vérification appartient à l'université de l'utilisateur si rôle UNIVERSITY
      if (user?.role === 'UNIVERSITY' && user.universityId) {
        if (existingVerification.certificate.universityId !== user.universityId) {
          res.status(403).json({
            success: false,
            message: 'Access denied: verification belongs to another university',
          });
          return;
        }
      }

      // Delete verification
      await prisma.verification.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Verification deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting verification:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting verification',
      });
    }
  }
}

export default new VerificationController();

