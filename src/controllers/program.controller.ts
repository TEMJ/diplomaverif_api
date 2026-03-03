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
   * Bulk create programs from CSV
   * POST /api/programs/bulk-upload
   * CSV expected columns (no header order required):
   * - title (required)
   * - level (Undergraduate|Postgraduate, required)
   * - totalCreditsRequired (optional, default 360)
   * For UNIVERSITY users, universityId is taken from req.user and must not be in CSV.
   */
  async bulkUpload(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;

      if (!req.file || !req.file.buffer) {
        res.status(400).json({
          success: false,
          message: 'CSV file is required (field name "file")',
        });
        return;
      }

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
      const idxTitle = header.indexOf('title');
      const idxLevel = header.indexOf('level');
      const idxTotalCredits = header.indexOf('totalcreditsrequired');
      const idxUniversityId = header.indexOf('universityid');

      if (idxTitle === -1 || idxLevel === -1) {
        res.status(400).json({
          success: false,
          message: 'CSV must contain at least "title" and "level" columns',
        });
        return;
      }

      let universityId: string | null = null;
      if (user.role === 'UNIVERSITY') {
        if (!user.universityId) {
          res.status(403).json({
            success: false,
            message: 'Your account is not linked to a university. Please contact support.',
          });
          return;
        }
        universityId = user.universityId;
      }

      const rows = lines.slice(1);
      let created = 0;
      const errors: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i];
        if (!raw.trim()) continue;
        const cols = raw.split(',').map((c) => c.trim());

        const title = cols[idxTitle] || '';
        const level = cols[idxLevel] || '';
        const totalCreditsRaw = idxTotalCredits !== -1 ? cols[idxTotalCredits] : '';

        const rowUniversityId =
          universityId ||
          (idxUniversityId !== -1 ? cols[idxUniversityId] || null : null);

        if (!rowUniversityId) {
          errors.push({ row: i + 2, error: 'Missing universityId for this row' });
          continue;
        }
        if (!title || !level) {
          errors.push({ row: i + 2, error: 'Missing title or level' });
          continue;
        }
        const validLevels = ['undergraduate', 'postgraduate'];
        if (!validLevels.includes(level.toLowerCase())) {
          errors.push({
            row: i + 2,
            error: 'Level must be either "Undergraduate" or "Postgraduate"',
          });
          continue;
        }

        const totalCredits =
          totalCreditsRaw && !Number.isNaN(Number(totalCreditsRaw))
            ? Number(totalCreditsRaw)
            : 360;

        try {
          // Upsert-like behaviour: skip if already exists
          const existing = await prisma.program.findFirst({
            where: {
              universityId: rowUniversityId,
              title,
            },
          });
          if (existing) {
            continue;
          }

          await prisma.program.create({
            data: {
              universityId: rowUniversityId,
              title,
              level:
                level.toLowerCase() === 'undergraduate' ? 'Undergraduate' : 'Postgraduate',
              totalCreditsRequired: totalCredits,
            },
          });
          created += 1;
        } catch (err: any) {
          console.error('Error creating program from CSV row', i + 2, err);
          errors.push({ row: i + 2, error: 'Database error while creating program' });
        }
      }

      res.status(200).json({
        success: true,
        message: `Bulk program import finished: ${created} created, ${errors.length} with errors`,
        stats: {
          created,
          failed: errors.length,
        },
        errors,
      });
    } catch (error) {
      console.error('Error in bulk program upload:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing bulk program upload',
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
