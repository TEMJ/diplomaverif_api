import { Request, Response } from 'express';
import prisma from '../config/database';
import qrCodeService from '../services/qrcode.service';

/**
 * Controller for managing certificates/diplomas
 * Handles CRUD operations on certificates
 */
class CertificateController {
  /**
   * Retrieve all certificates
   * GET /api/certificates
   */

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, universityId, status, sortBy, sortOrder } = req.query;

      const where: any = {};
      
      if (studentId) where.studentId = studentId as string;
      if (universityId) where.universityId = universityId as string;
      if (status) where.status = status as string;

      // Validation des paramètres de tri
      const validSortFields = ['createdAt', 'degreeTitle', 'specialization', 'graduationDate', 'status'];
      const validSortOrders = ['asc', 'desc'];
      
      const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
      const order = validSortOrders.includes(sortOrder as string) ? sortOrder as string : 'desc';

      const certificates = await prisma.certificate.findMany({
        where,
        orderBy: { [sortField]: order },
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
      });

      res.status(200).json({
        success: true,
        count: certificates.length,
        data: certificates,
      });
    } catch (error) {
      console.error('Error retrieving certificates:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving certificates',
      });
    }
  }
  /**
   * Retrieve a certificate by ID
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
          message: 'Certificate not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      console.error('Error retrieving certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving certificate',
      });
    }
  }

  /**
   * Create a new certificate
   * POST /api/certificates
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, universityId, degreeTitle, specialization, graduationDate, pdfUrl } = req.body;

      // Validate data
      if (!studentId || !universityId || !degreeTitle || !specialization || !graduationDate || !pdfUrl) {
        res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
        return;
      }

      // Generate QR code and hash
      const { qrHash, qrCodeUrl } = await qrCodeService.generateQRCodeWithHash();

      // Create certificate
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
        message: 'Certificate created successfully',
        data: certificate,
      });
    } catch (error) {
      console.error('Error creating certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating certificate',
      });
    }
  }

  /**
   * Update a certificate
   * PUT /api/certificates/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { degreeTitle, specialization, graduationDate, pdfUrl, status } = req.body;

      // Check if certificate exists
      const existingCertificate = await prisma.certificate.findUnique({
        where: { id },
      });

      if (!existingCertificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      // Update certificate
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
        message: 'Certificate updated successfully',
        data: certificate,
      });
    } catch (error) {
      console.error('Error updating certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating certificate',
      });
    }
  }

  /**
   * Delete a certificate
   * DELETE /api/certificates/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if certificate exists
      const existingCertificate = await prisma.certificate.findUnique({
        where: { id },
      });

      if (!existingCertificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      // Delete certificate (cascade will delete associated verifications)
      await prisma.certificate.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Certificate deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting certificate',
      });
    }
  }

  /**
   * Verify a certificate by QR hash
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
          message: 'Certificate not found or invalid hash',
        });
        return;
      }

      // Record verification
      const verification = await prisma.verification.create({
        data: {
          certificateId: certificate.id,
          companyName: 'Public verification',
          email: req.body.email || 'anonymous@example.com',
          reason: req.body.reason || 'Diploma verification',
          ipAddress: req.ip || 'unknown',
        },
      });

      res.status(200).json({
        success: true,
        message: certificate.status === 'ACTIVE' ? 'Certificate valid' : 'Certificate revoked',
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
      console.error('Error verifying certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while verifying certificate',
      });
    }
  }

  /**
   * Revoke a certificate
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
          message: 'Certificate not found',
        });
        return;
      }

      const updatedCertificate = await prisma.certificate.update({
        where: { id },
        data: { status: 'REVOKED' },
      });

      res.status(200).json({
        success: true,
        message: 'Certificate revoked successfully',
        data: updatedCertificate,
      });
    } catch (error) {
      console.error('Error revoking certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while revoking certificate',
      });
    }
  }
}

export default new CertificateController();

