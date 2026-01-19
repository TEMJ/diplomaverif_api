import { Request, Response } from 'express';
import prisma from '../config/database';
import academicService from '../services/academic.service';

/**
 * Controller for managing grades/marks (UK-compliant)
 * Handles CRUD operations on student grades in modules
 */
class GradeController {
  /**
   * Retrieve all grades (with optional filters)
   * GET /api/grades?studentId=...&moduleId=...&universityId=...
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, universityId, moduleId } = req.query;
      const where: any = {};

      if (studentId) {
        where.studentId = studentId as string;
      }

      if (moduleId) {
        where.moduleId = moduleId as string;
      }

      const grades = await prisma.grade.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
              universityId: true,
            },
          },
          module: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
              universityId: true,
            },
          },
        },
      });

      // Filter by university if specified
      let filteredGrades = grades;
      if (universityId) {
        filteredGrades = grades.filter(
          (g: any) => g.module.universityId === universityId
        );
      }

      res.status(200).json({
        success: true,
        count: filteredGrades.length,
        data: filteredGrades,
      });
    } catch (error) {
      console.error('Error retrieving grades:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving grades',
      });
    }
  }

  /**
   * Retrieve a grade by ID
   * GET /api/grades/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const grade = await prisma.grade.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
          module: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
            },
          },
        },
      });

      if (!grade) {
        res.status(404).json({
          success: false,
          message: 'Grade not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: grade,
      });
    } catch (error) {
      console.error('Error retrieving grade:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving grade',
      });
    }
  }

  /**
   * Create or update a grade (mark) for a student in a module
   * POST /api/grades
   * Marks are 0-100 (UK standard percentage)
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, moduleId, mark } = req.body;
      const user = (req as any).user;

      // Validation
      if (!studentId || !moduleId || mark === undefined || mark === null) {
        res.status(400).json({
          success: false,
          message: 'Student ID, module ID, and mark are required',
        });
        return;
      }

      // Validate mark is a number between 0 and 100
      const markValue = parseFloat(mark);
      if (!academicService.validateGradeMark(markValue)) {
        res.status(400).json({
          success: false,
          message: 'Mark must be a number between 0 and 100',
        });
        return;
      }

      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      // Check if module exists
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        res.status(404).json({
          success: false,
          message: 'Module not found',
        });
        return;
      }

      // Vérifie que l'élève et le module appartiennent au même programme
      if (!student.programId || !module.programId || student.programId !== module.programId) {
        res.status(400).json({
          success: false,
          message: "L'élève et la matière doivent appartenir au même programme.",
        });
        return;
      }

      // Check authorization: University can only create grades for their own students and modules
      if (user.role === 'UNIVERSITY') {
        if (
          user.universityId !== student.universityId ||
          user.universityId !== module.universityId
        ) {
          res.status(403).json({
            success: false,
            message: 'You can only create grades for your own university students and modules',
          });
          return;
        }
      }

      // Check if grade already exists for this student-module combination
      const existingGrade = await prisma.grade.findUnique({
        where: {
          studentId_moduleId: {
            studentId,
            moduleId,
          },
        },
      });

      let result;
      if (existingGrade) {
        // Update existing grade
        result = await prisma.grade.update({
          where: { id: existingGrade.id },
          data: {
            mark: markValue,
            date: new Date(),
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
            module: {
              select: {
                id: true,
                name: true,
                code: true,
                credits: true,
              },
            },
          },
        });

        // Recalculate certificates for this student (background operation)
        academicService.recalculateStudentCertificates(studentId).catch((err) => {
          console.error('Error recalculating certificates after grade update:', err);
        });

        res.status(200).json({
          success: true,
          message: 'Grade updated successfully',
          data: result,
        });
      } else {
        // Create new grade
        result = await prisma.grade.create({
          data: {
            studentId,
            moduleId,
            mark: markValue,
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
            module: {
              select: {
                id: true,
                name: true,
                code: true,
                credits: true,
              },
            },
          },
        });

        // Recalculate certificates for this student (background operation)
        academicService.recalculateStudentCertificates(studentId).catch((err) => {
          console.error('Error recalculating certificates after grade creation:', err);
        });

        res.status(201).json({
          success: true,
          message: 'Grade created successfully',
          data: result,
        });
      }
    } catch (error) {
      console.error('Error creating/updating grade:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating/updating grade',
      });
    }
  }

  /**
   * Update a grade
   * PUT /api/grades/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { mark } = req.body;
      const user = (req as any).user;

      if (mark === undefined || mark === null) {
        res.status(400).json({
          success: false,
          message: 'Mark is required',
        });
        return;
      }

      // Validate mark
      const markValue = parseFloat(mark);
      if (!academicService.validateGradeMark(markValue)) {
        res.status(400).json({
          success: false,
          message: 'Mark must be a number between 0 and 100',
        });
        return;
      }

      // Find the grade
      const existingGrade = await prisma.grade.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
              universityId: true,
            },
          },
          module: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
              universityId: true,
            },
          },
        },
      });

      if (!existingGrade) {
        res.status(404).json({
          success: false,
          message: 'Grade not found',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY') {
        if (
          user.universityId !== existingGrade.student.universityId ||
          user.universityId !== existingGrade.module.universityId
        ) {
          res.status(403).json({
            success: false,
            message: 'You can only update grades for your own university',
          });
          return;
        }
      }

        // Immutability: Prevent update if certificate is ISSUED for this student and module's program
        // Immutability: Prevent update if certificate is ACTIVE for this student and the program matches
        const moduleData = await prisma.module.findUnique({ where: { id: existingGrade.module.id }, select: { programId: true } });
        const studentData = await prisma.student.findUnique({ where: { id: existingGrade.student.id }, select: { programId: true } });
        if (moduleData && studentData && moduleData.programId === studentData.programId) {
          const issuedCertificate = await prisma.certificate.findFirst({
            where: {
              studentId: existingGrade.student.id,
              status: 'ACTIVE',
            },
          });
          if (issuedCertificate) {
            res.status(403).json({
              success: false,
              message: 'Grade cannot be updated: certificate already issued for this program.',
            });
            return;
          }
        }

      // Update grade
      const updatedGrade = await prisma.grade.update({
        where: { id },
        data: {
          mark: markValue,
          date: new Date(),
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
          module: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
            },
          },
        },
      });

      // Recalculate certificates for this student (background operation)
      academicService.recalculateStudentCertificates(existingGrade.student.id).catch((err) => {
        console.error('Error recalculating certificates after grade update:', err);
      });

      res.status(200).json({
        success: true,
        message: 'Grade updated successfully',
        data: updatedGrade,
      });
    } catch (error) {
      console.error('Error updating grade:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating grade',
      });
    }
  }

  /**
   * Delete a grade
   * DELETE /api/grades/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Find the grade
      const grade = await prisma.grade.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
              universityId: true,
            },
          },
          module: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
              universityId: true,
            },
          },
        },
      });

      if (!grade) {
        res.status(404).json({
          success: false,
          message: 'Grade not found',
        });
        return;
      }

      // Check authorization
      if (user.role === 'UNIVERSITY') {
        if (
          user.universityId !== grade.student.universityId ||
          user.universityId !== grade.module.universityId
        ) {
          res.status(403).json({
            success: false,
            message: 'You can only delete grades from your own university',
          });
          return;
        }
      }

        // Immutability: Prevent delete if certificate is ISSUED for this student and module's program
        // Immutability: Prevent delete if certificate is ACTIVE for this student and the program matches
        const moduleData = await prisma.module.findUnique({ where: { id: grade.module.id }, select: { programId: true } });
        const studentData = await prisma.student.findUnique({ where: { id: grade.student.id }, select: { programId: true } });
        if (moduleData && studentData && moduleData.programId === studentData.programId) {
          const issuedCertificate = await prisma.certificate.findFirst({
            where: {
              studentId: grade.student.id,
              status: 'ACTIVE',
            },
          });
          if (issuedCertificate) {
            res.status(403).json({
              success: false,
              message: 'Grade cannot be deleted: certificate already issued for this program.',
            });
            return;
          }
        }

      // Delete grade
      await prisma.grade.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Grade deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting grade:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting grade',
      });
    }
  }

  /**
   * Get grades for a specific student with statistics
   * GET /api/grades/student/:studentId
   */
  async getByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;

      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      // Get grade statistics
      const statistics = await academicService.getGradeStatistics(studentId);
      
      // Calculate student classification
      const classification = await academicService.calculateStudentClassification(studentId);

      res.status(200).json({
        success: true,
        data: {
          student: {
            id: student.id,
            studentId: student.studentId,
            firstName: student.firstName,
            lastName: student.lastName,
          },
          statistics,
          classification,
        },
      });
    } catch (error) {
      console.error('Error retrieving student grades:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving student grades',
      });
    }
  }

  /**
   * Get all grades for a university's students
   * GET /api/grades/university/:universityId
   */
  async getByUniversity(req: Request, res: Response): Promise<void> {
    try {
      const { universityId } = req.params;
      const user = (req as any).user;

      // Check authorization
      if (user.role === 'UNIVERSITY' && user.universityId !== universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only view grades from your own university',
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

      // Get all grades from this university
      const grades = await prisma.grade.findMany({
        where: {
          student: {
            universityId,
          },
        },
        orderBy: [{ student: { firstName: 'asc' } }, { module: { code: 'asc' } }],
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
          module: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        count: grades.length,
        data: grades,
      });
    } catch (error) {
      console.error('Error retrieving university grades:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving university grades',
      });
    }
  }
}

export default new GradeController();
