import { Request, Response } from 'express';
import prisma from '../config/database';
import authService from '../services/auth.service';
import emailService from '../services/email.service';
import fileUploadService from '../services/file-upload.service';

/**
 * Controller for managing universities (UK-compliant)
 * Handles CRUD operations on universities with regulatory compliance fields
 */
class UniversityController {
  /**
   * Retrieve all universities
   * GET /api/universities
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;

      const where: any = {};

      // Text search across common university fields
      if (search && typeof search === 'string' && search.trim() !== '') {
        const term = search.trim();
        // Note: we rely on the database collation for case handling
        where.OR = [
          { name: { contains: term } },
          { ukprn: { contains: term } },
          { address: { contains: term } },
          { contactEmail: { contains: term } },
        ];
      }

      const universities = await prisma.university.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              students: true,
              certificates: true,
              programs: true,
              modules: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        count: universities.length,
        data: universities,
      });
    } catch (error) {
      console.error('Error retrieving universities:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving universities',
      });
    }
  }

  /**
   * Retrieve a university by ID
   * GET /api/universities/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const university = await prisma.university.findUnique({
        where: { id },
        include: {
          students: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              email: true,
              enrollmentDate: true,
            },
            take: 10,
          },
          programs: {
            select: {
              id: true,
              title: true,
              level: true,
            },
            take: 5,
          },
          _count: {
            select: {
              students: true,
              certificates: true,
              programs: true,
              modules: true,
            },
          },
        },
      });

      if (!university) {
        res.status(404).json({
          success: false,
          message: 'University not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: university,
      });
    } catch (error) {
      console.error('Error retrieving university:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving university',
      });
    }
  }

  /**
   * Create a new university
   * POST /api/universities
   * Supports UK regulatory fields (UKPRN, seal, registrar, signature)
   * Can accept file uploads for logo, seal, and signature via multipart/form-data
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        address,
        contactEmail,
        phone,
        logoUrl,
        ukprn,
        officialSealUrl,
        registrarName,
        signatureUrl,
      } = req.body;

      // Validate required data
      if (!name || !address || !contactEmail || !phone) {
        res.status(400).json({
          success: false,
          message: 'Name, address, email and phone are required',
        });
        return;
      }

      // Check if university already exists
      const existingUniversity = await prisma.university.findFirst({
        where: { contactEmail },
      });

      if (existingUniversity) {
        res.status(409).json({
          success: false,
          message: 'A university with this email already exists',
        });
        return;
      }

      // Handle file uploads if provided (multipart/form-data)
      let finalLogoUrl = logoUrl || null;
      let finalSealUrl = officialSealUrl || null;
      let finalSignatureUrl = signatureUrl || null;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      if (files) {
        // Process logo upload
        if (files.logo && files.logo[0]) {
          finalLogoUrl = fileUploadService.getFileUrl(files.logo[0].filename, 'logos');
        }

        // Process seal upload
        if (files.seal && files.seal[0]) {
          finalSealUrl = fileUploadService.getFileUrl(files.seal[0].filename, 'seals');
        }

        // Process signature upload
        if (files.signature && files.signature[0]) {
          finalSignatureUrl = fileUploadService.getFileUrl(files.signature[0].filename, 'signatures');
        }
      }

      // Create university
      const university = await prisma.university.create({
        data: {
          name,
          address,
          contactEmail,
          phone,
          logoUrl: finalLogoUrl,
          ukprn: ukprn || null,
          officialSealUrl: finalSealUrl,
          registrarName: registrarName || null,
          signatureUrl: finalSignatureUrl,
        },
      });

      // Generate temporary password
      const temporaryPassword = authService.generateTemporaryPassword();
      const hashedPassword = await authService.hashPassword(temporaryPassword);

      // Create associated university user
      await prisma.user.create({
        data: {
          universityId: university.id,
          email: university.contactEmail,
          password: hashedPassword,
          role: 'UNIVERSITY',
        },
      });

      // Send welcome email
      await emailService.sendWelcomeEmail(university.contactEmail, temporaryPassword, 'UNIVERSITY');

      res.status(201).json({
        success: true,
        message: 'University created successfully',
        data: university,
      });
    } catch (error) {
      console.error('Error creating university:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating university',
      });
    }
  }

  /**
   * Update a university
   * PUT /api/universities/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        address,
        contactEmail,
        phone,
        logoUrl,
        ukprn,
        officialSealUrl,
        registrarName,
        signatureUrl,
      } = req.body;

      // Check if university exists
      const existingUniversity = await prisma.university.findUnique({
        where: { id },
      });

      if (!existingUniversity) {
        res.status(404).json({
          success: false,
          message: 'University not found',
        });
        return;
      }

      // Prepare update data
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
      if (phone !== undefined) updateData.phone = phone;
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (ukprn !== undefined) updateData.ukprn = ukprn;
      if (officialSealUrl !== undefined) updateData.officialSealUrl = officialSealUrl;
      if (registrarName !== undefined) updateData.registrarName = registrarName;
      if (signatureUrl !== undefined) updateData.signatureUrl = signatureUrl;

      // Update university
      const university = await prisma.university.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        message: 'University updated successfully',
        data: university,
      });
    } catch (error) {
      console.error('Error updating university:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating university',
      });
    }
  }

  /**
   * Upload university logo
   * PUT /api/universities/:id/logo
   */
  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== id) {
        res.status(403).json({
          success: false,
          message: 'You can only upload your own university logo',
        });
        return;
      }

      // Check if university exists
      const university = await prisma.university.findUnique({
        where: { id },
      });

      if (!university) {
        res.status(404).json({
          success: false,
          message: 'University not found',
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      // Get file URL from upload service
      const logoUrl = fileUploadService.getFileUrl(req.file.filename, 'logos');

      // Update university logo URL
      const updatedUniversity = await prisma.university.update({
        where: { id },
        data: {
          logoUrl,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          id: updatedUniversity.id,
          logoUrl: updatedUniversity.logoUrl,
        },
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading logo',
      });
    }
  }

  /**
   * Upload university official seal
   * PUT /api/universities/:id/seal
   */
  async uploadSeal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== id) {
        res.status(403).json({
          success: false,
          message: 'You can only upload your own university seal',
        });
        return;
      }

      // Check if university exists
      const university = await prisma.university.findUnique({
        where: { id },
      });

      if (!university) {
        res.status(404).json({
          success: false,
          message: 'University not found',
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      // Get file URL from upload service
      const officialSealUrl = fileUploadService.getFileUrl(req.file.filename, 'seals');

      // Update university seal URL
      const updatedUniversity = await prisma.university.update({
        where: { id },
        data: {
          officialSealUrl,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Seal uploaded successfully',
        data: {
          id: updatedUniversity.id,
          officialSealUrl: updatedUniversity.officialSealUrl,
        },
      });
    } catch (error) {
      console.error('Error uploading seal:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading seal',
      });
    }
  }

  /**
   * Upload university registrar signature
   * PUT /api/universities/:id/signature
   */
  async uploadSignature(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== id) {
        res.status(403).json({
          success: false,
          message: 'You can only upload your own university signature',
        });
        return;
      }

      // Check if university exists
      const university = await prisma.university.findUnique({
        where: { id },
      });

      if (!university) {
        res.status(404).json({
          success: false,
          message: 'University not found',
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      // Get file URL from upload service
      const signatureUrl = fileUploadService.getFileUrl(req.file.filename, 'signatures');

      // Update university signature URL
      const updatedUniversity = await prisma.university.update({
        where: { id },
        data: {
          signatureUrl,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Signature uploaded successfully',
        data: {
          id: updatedUniversity.id,
          signatureUrl: updatedUniversity.signatureUrl,
        },
      });
    } catch (error) {
      console.error('Error uploading signature:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading signature',
      });
    }
  }

  /**
   * Delete a university
   * DELETE /api/universities/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if university exists
      const existingUniversity = await prisma.university.findUnique({
        where: { id },
      });

      if (!existingUniversity) {
        res.status(404).json({
          success: false,
          message: 'University not found',
        });
        return;
      }

      // Delete university (cascade will delete associated students and certificates)
      await prisma.university.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'University deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting university:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting university',
      });
    }
  }
}

export default new UniversityController();

