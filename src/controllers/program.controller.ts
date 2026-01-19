import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Controller for managing Programs (Degree Structures)
 * Handles CRUD operations on academic programs
 */
class ProgramController {
  /**
   * Retrieve all programs for a university
   * GET /api/programs?universityId=...
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { universityId } = req.query;
      const where: any = {};

      if (universityId) {
        where.universityId = universityId as string;
      }

      const programs = await prisma.program.findMany({
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
              students: true,
              modules: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        count: programs.length,
        data: programs,
      });
    } catch (error) {
      console.error('Error retrieving programs:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving programs',
      });
    }
  }

  /**
   * Retrieve a program by ID
   * GET /api/programs/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const program = await prisma.program.findUnique({
        where: { id },
        include: {
          university: true,
          modules: {
            include: {
              _count: {
                select: {
                  grades: true,
                },
              },
            },
          },
          students: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              enrollmentDate: true,
            },
          },
          _count: {
            select: {
              students: true,
              modules: true,
            },
          },
        },
      });

      if (!program) {
        res.status(404).json({
          success: false,
          message: 'Program not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: program,
      });
    } catch (error) {
      console.error('Error retrieving program:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving program',
      });
    }
  }

  /**
   * Create a new program
   * POST /api/programs
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, title, level, totalCreditsRequired } = req.body;
      const user = (req as any).user;

      // Validation
      if (!universityId || !title || !level) {
        res.status(400).json({
          success: false,
          message: 'University ID, title, and level are required',
        });
        return;
      }

      // Validate level
      const validLevels = ['Undergraduate', 'Postgraduate'];
      if (!validLevels.includes(level)) {
        res.status(400).json({
          success: false,
          message: 'Level must be either "Undergraduate" or "Postgraduate"',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only create programs for your own university',
        });
        return;
      }

      // Verify university exists
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

      // Check if program already exists
      const existingProgram = await prisma.program.findFirst({
        where: {
          universityId,
          title,
        },
      });

      if (existingProgram) {
        res.status(409).json({
          success: false,
          message: 'A program with this title already exists for this university',
        });
        return;
      }

      // Create program
      const program = await prisma.program.create({
        data: {
          universityId,
          title,
          level,
          totalCreditsRequired: totalCreditsRequired || 360,
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
        message: 'Program created successfully',
        data: program,
      });
    } catch (error) {
      console.error('Error creating program:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating program',
      });
    }
  }

  /**
   * Update a program
   * PUT /api/programs/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, level, totalCreditsRequired } = req.body;
      const user = (req as any).user;

      // Find the program
      const existingProgram = await prisma.program.findUnique({
        where: { id },
      });

      if (!existingProgram) {
        res.status(404).json({
          success: false,
          message: 'Program not found',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== existingProgram.universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only update programs for your own university',
        });
        return;
      }

      // Validate level if provided
      if (level) {
        const validLevels = ['Undergraduate', 'Postgraduate'];
        if (!validLevels.includes(level)) {
          res.status(400).json({
            success: false,
            message: 'Level must be either "Undergraduate" or "Postgraduate"',
          });
          return;
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (title) updateData.title = title;
      if (level) updateData.level = level;
      if (totalCreditsRequired !== undefined) updateData.totalCreditsRequired = totalCreditsRequired;

      // Update program
      const program = await prisma.program.update({
        where: { id },
        data: updateData,
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
        message: 'Program updated successfully',
        data: program,
      });
    } catch (error) {
      console.error('Error updating program:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating program',
      });
    }
  }

  /**
   * Delete a program
   * DELETE /api/programs/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Find the program
      const program = await prisma.program.findUnique({
        where: { id },
      });

      if (!program) {
        res.status(404).json({
          success: false,
          message: 'Program not found',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== program.universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete programs for your own university',
        });
        return;
      }

      // Delete program
      await prisma.program.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Program deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting program:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting program',
      });
    }
  }
}

export default new ProgramController();
