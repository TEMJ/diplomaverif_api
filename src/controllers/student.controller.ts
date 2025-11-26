import { Request, Response } from 'express';
import prisma from '../config/database';
import authService from '../services/auth.service';
import emailService from '../services/email.service';

/**
 * Controller for managing students
 * Handles CRUD operations on students
 */
class StudentController {
  /**
   * Retrieve all students
   * GET /api/students
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, major } = req.query;

      const where: any = {};
      
      // Filter by university if specified
      if (universityId) {
        where.universityId = universityId as string;
      }
      
      // Filter by major if specified
      if (major) {
        where.major = major as string;
      }

      const students = await prisma.student.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          university: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        count: students.length,
        data: students,
      });
    } catch (error) {
      console.error('Error retrieving students:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving students',
      });
    }
  }

  /**
   * Retrieve a student by ID
   * GET /api/students/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          university: true,
          certificates: {
            include: {
              university: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
          studentRecord: true,
        },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (error) {
      console.error('Error retrieving student:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving student',
      });
    }
  }

  /**
   * Create a new student
   * POST /api/students
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, matricule, firstName, lastName, email, photoUrl, dateOfBirth, major } = req.body;

      // Validate data
      if (!universityId || !matricule || !firstName || !lastName || !email || !dateOfBirth || !major) {
        res.status(400).json({
          success: false,
          message: 'University, matricule, first name, last name, email, date of birth and major required',
        });
        return;
      }

      // Check if student already exists
      const existingStudent = await prisma.student.findFirst({
        where: {
          OR: [{ matricule }, { email }],
        },
      });

      if (existingStudent) {
        res.status(409).json({
          success: false,
          message: 'A student with this matricule or email already exists',
        });
        return;
      }

      // Create student
      const student = await prisma.student.create({
        data: {
          universityId,
          matricule,
          firstName,
          lastName,
          email,
          photoUrl,
          dateOfBirth: new Date(dateOfBirth),
          major,
        },
      });

      // Generate temporary password
      const temporaryPassword = authService.generateTemporaryPassword();
      const hashedPassword = await authService.hashPassword(temporaryPassword);

      // Create associated student user
      await prisma.user.create({
        data: {
          studentId: student.id,
          email: student.email,
          password: hashedPassword,
          role: 'STUDENT',
        },
      });

      // Send welcome email
      await emailService.sendWelcomeEmail(student.email, temporaryPassword, 'STUDENT');

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student,
      });
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating student',
      });
    }
  }

  /**
   * Update a student
   * PUT /api/students/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { matricule, firstName, lastName, email, photoUrl, dateOfBirth, major } = req.body;

      // Check if student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      // Update student
      const student = await prisma.student.update({
        where: { id },
        data: {
          matricule,
          firstName,
          lastName,
          email,
          photoUrl,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          major,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student,
      });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating student',
      });
    }
  }

  /**
   * Delete a student
   * DELETE /api/students/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      // Delete student (cascade will delete associated certificates and records)
      await prisma.student.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting student',
      });
    }
  }
}

export default new StudentController();

