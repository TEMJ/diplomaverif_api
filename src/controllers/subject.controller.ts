import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Controller for managing subjects/courses
 * Handles CRUD operations on subjects
 */
class SubjectController {
  /**
   * Retrieve all subjects (with optional filters)
   * GET /api/subjects?universityId=...
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { universityId } = req.query;
      const where: any = {};

      if (universityId) {
        where.universityId = universityId as string;
      }

      const subjects = await prisma.subject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              grades: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        count: subjects.length,
        data: subjects,
      });
    } catch (error) {
      console.error('Error retrieving subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving subjects',
      });
    }
  }

  /**
   * Retrieve a subject by ID
   * GET /api/subjects/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
          university: true,
          grades: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  matricule: true,
                },
              },
            },
          },
        },
      });

      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: subject,
      });
    } catch (error) {
      console.error('Error retrieving subject:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving subject',
      });
    }
  }

  /**
   * Create a new subject
   * POST /api/subjects
   * Only universities can create subjects for their institution
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, name, code, credits } = req.body;
      const user = (req as any).user;

      // Validation
      if (!universityId || !name || !code) {
        res.status(400).json({
          success: false,
          message: 'University ID, name, and code are required',
        });
        return;
      }

      // Check authorization: University can only create subjects for their own institution
      if (user.role === 'UNIVERSITY' && user.universityId !== universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only create subjects for your own university',
        });
        return;
      }

      // Check if university exists
      const university = await prisma.university.findUnique({
        where: { id: universityId },
      });

      if (!university) {
        res.status(404).json({
          success: false,
          message: 'University not found',
        });
        return;
      }

      // Check if subject with same code already exists for this university
      const existingSubject = await prisma.subject.findFirst({
        where: {
          universityId,
          code,
        },
      });

      if (existingSubject) {
        res.status(409).json({
          success: false,
          message: 'A subject with this code already exists for this university',
        });
        return;
      }

      // Create subject
      const subject = await prisma.subject.create({
        data: {
          universityId,
          name,
          code,
          credits: credits || 0,
        },
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject,
      });
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating subject',
      });
    }
  }

  /**
   * Update a subject
   * PUT /api/subjects/:id
   * Only the university that owns the subject can update it
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, code, credits } = req.body;
      const user = (req as any).user;

      // Find the subject
      const subject = await prisma.subject.findUnique({
        where: { id },
        include: { university: true },
      });

      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== subject.universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only update subjects for your own university',
        });
        return;
      }

      // Check if new code already exists (excluding current subject)
      if (code && code !== subject.code) {
        const existingSubject = await prisma.subject.findFirst({
          where: {
            universityId: subject.universityId,
            code,
            NOT: { id },
          },
        });

        if (existingSubject) {
          res.status(409).json({
            success: false,
            message: 'Another subject with this code already exists for this university',
          });
          return;
        }
      }

      // Update subject
      const updatedSubject = await prisma.subject.update({
        where: { id },
        data: {
          name: name || undefined,
          code: code || undefined,
          credits: credits !== undefined ? credits : undefined,
        },
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: updatedSubject,
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating subject',
      });
    }
  }

  /**
   * Delete a subject
   * DELETE /api/subjects/:id
   * Only the university that owns the subject can delete it
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Find the subject
      const subject = await prisma.subject.findUnique({
        where: { id },
      });

      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== subject.universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete subjects from your own university',
        });
        return;
      }

      // Delete subject (this will cascade delete grades due to onDelete: Cascade)
      await prisma.subject.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Subject deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting subject',
      });
    }
  }

  /**
   * Get all subjects for a university
   * GET /api/subjects/university/:universityId
   */
  async getByUniversity(req: Request, res: Response): Promise<void> {
    try {
      const { universityId } = req.params;

      // Check if university exists
      const university = await prisma.university.findUnique({
        where: { id: universityId },
      });

      if (!university) {
        res.status(404).json({
          success: false,
          message: 'University not found',
        });
        return;
      }

      const subjects = await prisma.subject.findMany({
        where: { universityId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              grades: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        count: subjects.length,
        data: subjects,
      });
    } catch (error) {
      console.error('Error retrieving university subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving university subjects',
      });
    }
  }
}

export default new SubjectController();
