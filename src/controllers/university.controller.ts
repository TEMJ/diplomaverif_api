import { Request, Response } from 'express';
import prisma from '../config/database';
import authService from '../services/auth.service';
import emailService from '../services/email.service';

/**
 * Controller for managing universities
 * Handles CRUD operations on universities
 */
class UniversityController {
  /**
   * Retrieve all universities
   * GET /api/universities
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const universities = await prisma.university.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              students: true,
              certificates: true,
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
              matricule: true,
              email: true,
              major: true,
            },
            take: 10,
          },
          _count: {
            select: {
              students: true,
              certificates: true,
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
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, address, contactEmail, phone, logoUrl } = req.body;

      // Validate data
      if (!name || !address || !contactEmail || !phone) {
        res.status(400).json({
          success: false,
          message: 'Name, address, email and phone required',
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

      // Create university
      const university = await prisma.university.create({
        data: {
          name,
          address,
          contactEmail,
          phone,
          logoUrl,
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
      const { name, address, contactEmail, phone, logoUrl } = req.body;

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

      // Update university
      const university = await prisma.university.update({
        where: { id },
        data: {
          name,
          address,
          contactEmail,
          phone,
          logoUrl,
        },
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

