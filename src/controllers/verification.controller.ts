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

      const where: any = {};
      if (certificateId) where.certificateId = certificateId as string;

      const verifications = await prisma.verification.findMany({
        where,
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
          message: 'Verification not found',
        });
        return;
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
              degreeTitle: true,
              specialization: true,
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

      // Check if verification exists
      const existingVerification = await prisma.verification.findUnique({
        where: { id },
      });

      if (!existingVerification) {
        res.status(404).json({
          success: false,
          message: 'Verification not found',
        });
        return;
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

