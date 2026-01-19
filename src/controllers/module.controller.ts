import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Controller for managing Modules (Courses/Units)
 * Handles CRUD operations on academic modules
 */
class ModuleController {
  /**
   * Retrieve all modules (with optional filters)
   * GET /api/modules?universityId=...&programId=...
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, programId } = req.query;
      const where: any = {};

      if (universityId) {
        where.universityId = universityId as string;
      }

      if (programId) {
        where.programId = programId as string;
      }

      const modules = await prisma.module.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
          program: {
            select: {
              id: true,
              title: true,
              level: true,
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
        count: modules.length,
        data: modules,
      });
    } catch (error) {
      console.error('Error retrieving modules:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving modules',
      });
    }
  }

  /**
   * Retrieve a module by ID
   * GET /api/modules/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const module = await prisma.module.findUnique({
        where: { id },
        include: {
          university: true,
          program: true,
          grades: {
            include: {
              student: {
                select: {
                  id: true,
                  studentId: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              grades: true,
            },
          },
        },
      });

      if (!module) {
        res.status(404).json({
          success: false,
          message: 'Module not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: module,
      });
    } catch (error) {
      console.error('Error retrieving module:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving module',
      });
    }
  }

  /**
   * Create a new module
   * POST /api/modules
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, programId, code, name, credits } = req.body;
      const user = (req as any).user;

      // Validation
      if (!universityId || !programId || !code || !name) {
        res.status(400).json({
          success: false,
          message: 'University ID, program ID, code, and name are required',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only create modules for your own university',
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

      // Verify program exists and belongs to university
      const program = await prisma.program.findUnique({
        where: { id: programId },
      });

      if (!program || program.universityId !== universityId) {
        res.status(404).json({
          success: false,
          message: 'Program not found or does not belong to this university',
        });
        return;
      }

      // Check if module already exists
      const existingModule = await prisma.module.findFirst({
        where: {
          universityId,
          code,
        },
      });

      if (existingModule) {
        res.status(409).json({
          success: false,
          message: 'A module with this code already exists for this university',
        });
        return;
      }

      // Create module
      const module = await prisma.module.create({
        data: {
          universityId,
          programId,
          code,
          name,
          credits: credits || 15, // Default to 15 CATS credits
        },
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
          program: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: module,
      });
    } catch (error) {
      console.error('Error creating module:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating module',
      });
    }
  }

  /**
   * Update a module
   * PUT /api/modules/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { code, name, credits } = req.body;
      const user = (req as any).user;

      // Find the module
      const existingModule = await prisma.module.findUnique({
        where: { id },
      });

      if (!existingModule) {
        res.status(404).json({
          success: false,
          message: 'Module not found',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== existingModule.universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only update modules for your own university',
        });
        return;
      }

      // Prepare update data
      const updateData: any = {};
      if (code) updateData.code = code;
      if (name) updateData.name = name;
      if (credits !== undefined) updateData.credits = credits;

      // Update module
      const module = await prisma.module.update({
        where: { id },
        data: updateData,
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
          program: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        data: module,
      });
    } catch (error) {
      console.error('Error updating module:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating module',
      });
    }
  }

  /**
   * Delete a module
   * DELETE /api/modules/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Find the module
      const module = await prisma.module.findUnique({
        where: { id },
      });

      if (!module) {
        res.status(404).json({
          success: false,
          message: 'Module not found',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== module.universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete modules for your own university',
        });
        return;
      }

      // Delete module
      await prisma.module.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Module deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting module:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting module',
      });
    }
  }

  /**
   * Get modules by program
   * GET /api/modules/program/:programId
   */
  async getByProgram(req: Request, res: Response): Promise<void> {
    try {
      const { programId } = req.params;

      // Verify program exists
      const program = await prisma.program.findUnique({
        where: { id: programId },
      });

      if (!program) {
        res.status(404).json({
          success: false,
          message: 'Program not found',
        });
        return;
      }

      const modules = await prisma.module.findMany({
        where: { programId },
        orderBy: { code: 'asc' },
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
        count: modules.length,
        data: modules,
      });
    } catch (error) {
      console.error('Error retrieving modules by program:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving modules',
      });
    }
  }
}

export default new ModuleController();
