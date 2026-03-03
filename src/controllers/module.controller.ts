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
   * Bulk create modules from CSV
   * POST /api/modules/bulk-upload
   * CSV expected columns:
   * - code (required)
   * - name (required)
   * - credits (optional, default 15)
   * - programTitle (required)
   * - programLevel (Undergraduate|Postgraduate, optional but recommended)
   * For UNIVERSITY users, universityId is taken from req.user and must not be in CSV.
   */
  async bulkUpload(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;

      if (!req.file || !req.file.buffer) {
        res.status(400).json({
          success: false,
          message: 'CSV file is required (field name \"file\")',
        });
        return;
      }

      if (user.role === 'UNIVERSITY' && !user.universityId) {
        res.status(403).json({
          success: false,
          message: 'Your account is not linked to a university. Please contact support.',
        });
        return;
      }

      const universityId = user.role === 'UNIVERSITY' ? user.universityId : null;

      const csvText = req.file.buffer.toString('utf-8');
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        res.status(400).json({
          success: false,
          message: 'CSV file must contain a header row and at least one data row',
        });
        return;
      }

      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const idxCode = header.indexOf('code');
      const idxName = header.indexOf('name');
      const idxCredits = header.indexOf('credits');
      const idxProgramTitle = header.indexOf('programtitle');
      const idxProgramLevel = header.indexOf('programlevel');
      const idxUniversityId = header.indexOf('universityid');

      if (idxCode === -1 || idxName === -1 || idxProgramTitle === -1) {
        res.status(400).json({
          success: false,
          message: 'CSV must contain at least "code", "name" and "programTitle" columns',
        });
        return;
      }

      // Preload programs for this university (or all, if ADMIN)
      const programWhere: any = {};
      if (universityId) {
        programWhere.universityId = universityId;
      }
      const allPrograms = await prisma.program.findMany({
        where: programWhere,
      });
      const programMap = new Map<string, string>();
      for (const p of allPrograms) {
        const key = `${p.universityId}|${p.title.toLowerCase()}|${(p.level || '').toLowerCase()}`;
        programMap.set(key, p.id);
      }

      const rows = lines.slice(1);
      let created = 0;
      const errors: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i];
        if (!raw.trim()) continue;
        const cols = raw.split(',').map((c) => c.trim());

        const code = cols[idxCode] || '';
        const name = cols[idxName] || '';
        const creditsRaw = idxCredits !== -1 ? cols[idxCredits] : '';
        const programTitle = cols[idxProgramTitle] || '';
        const programLevel = idxProgramLevel !== -1 ? cols[idxProgramLevel] || '' : '';
        const rowUniversityId =
          universityId ||
          (idxUniversityId !== -1 ? cols[idxUniversityId] || null : null);

        if (!rowUniversityId) {
          errors.push({ row: i + 2, error: 'Missing universityId for this row' });
          continue;
        }
        if (!code || !name || !programTitle) {
          errors.push({ row: i + 2, error: 'Missing code, name or programTitle' });
          continue;
        }

        const levelKey = (programLevel || '').toLowerCase();
        let programId: string | undefined;
        if (programMap.size > 0) {
          const keyWithLevel = `${rowUniversityId}|${programTitle.toLowerCase()}|${levelKey}`;
          const keyNoLevel = `${rowUniversityId}|${programTitle.toLowerCase()}|`;
          programId = programMap.get(keyWithLevel) || programMap.get(keyNoLevel);
        }
        if (!programId) {
          errors.push({
            row: i + 2,
            error: `Program not found for title "${programTitle}"`,
          });
          continue;
        }

        const credits =
          creditsRaw && !Number.isNaN(Number(creditsRaw)) ? Number(creditsRaw) : 15;

        try {
          const existing = await prisma.module.findFirst({
            where: {
              universityId: rowUniversityId,
              code,
            },
          });
          if (existing) {
            continue;
          }

          await prisma.module.create({
            data: {
              universityId: rowUniversityId,
              programId,
              code,
              name,
              credits,
            },
          });
          created += 1;
        } catch (err: any) {
          console.error('Error creating module from CSV row', i + 2, err);
          errors.push({ row: i + 2, error: 'Database error while creating module' });
        }
      }

      res.status(200).json({
        success: true,
        message: `Bulk module import finished: ${created} created, ${errors.length} with errors`,
        stats: {
          created,
          failed: errors.length,
        },
        errors,
      });
    } catch (error) {
      console.error('Error in bulk module upload:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing bulk module upload',
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
