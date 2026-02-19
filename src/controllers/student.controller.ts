import { Request, Response } from 'express';
import prisma from '../config/database';
import authService from '../services/auth.service';
import emailService from '../services/email.service';
import fileUploadService from '../services/file-upload.service';
import { StudentIdGenerator } from '../utils/student-id-generator';

/**
 * Controller for managing students (UK-compliant)
 * Handles CRUD operations on students with automatic matricule generation
 */
class StudentController {
  /**
   * Retrieve all students
   * GET /api/students
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, programId, search } = req.query;

      const where: any = {};
      
      // Filter by university if specified
      if (universityId) {
        where.universityId = universityId as string;
      }
      
      // Filter by program if specified
      if (programId) {
        where.programId = programId as string;
      }

      // Text search across common student fields
      if (search && typeof search === 'string' && search.trim() !== '') {
        const term = search.trim();
        // Note: we rely on the database collation for case handling
        where.OR = [
          { firstName: { contains: term } },
          { lastName: { contains: term } },
          { email: { contains: term } },
          { studentId: { contains: term } },
        ];
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
          program: {
            select: {
              id: true,
              title: true,
              level: true,
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
          program: true,
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
          grades: {
            include: {
              module: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  credits: true,
                },
              },
            },
          },
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
   * Auto-generates student ID (matricule)
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, programId, firstName, lastName, email, photoUrl, dateOfBirth, enrollmentDate } = req.body;

      // Validate required data
      if (!universityId || !firstName || !lastName || !email) {
        res.status(400).json({
          success: false,
          message: 'University ID, first name, last name, and email are required',
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

      // Verify program exists (if provided)
      if (programId) {
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
      }

      // Check if student email already exists
      const existingStudent = await prisma.student.findFirst({
        where: {
          email,
        },
      });

      if (existingStudent) {
        res.status(409).json({
          success: false,
          message: 'A student with this email already exists',
        });
        return;
      }

      // Auto-generate student ID
      const studentId = await StudentIdGenerator.generateStudentId(universityId);

      // Create student
      const student = await prisma.student.create({
        data: {
          universityId,
          programId: programId || null,
          studentId, // Auto-generated matricule
          firstName,
          lastName,
          email,
          photoUrl: photoUrl || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
        },
        include: {
          university: true,
          program: true,
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
        message: 'Student created successfully with auto-generated ID',
        data: {
          ...student,
          studentId: student.studentId, // Highlight the auto-generated ID
        },
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
      const { firstName, lastName, email, photoUrl, dateOfBirth, enrollmentDate, programId } = req.body;

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

      // Verify program exists (if provided)
      if (programId) {
        const program = await prisma.program.findUnique({
          where: { id: programId },
        });

        if (!program || program.universityId !== existingStudent.universityId) {
          res.status(404).json({
            success: false,
            message: 'Program not found or does not belong to this university',
          });
          return;
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      if (enrollmentDate !== undefined) updateData.enrollmentDate = enrollmentDate ? new Date(enrollmentDate) : null;
      if (programId !== undefined) updateData.programId = programId;

      // Update student
      const student = await prisma.student.update({
        where: { id },
        data: updateData,
        include: {
          university: true,
          program: true,
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

      // Delete student (cascade will delete associated records)
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

  /**
   * Upload or update student photo
   * PUT /api/students/:id/photo
   * Only the student themselves or an admin can upload their photo
   */
  async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Check authorization
      if (user.role === 'STUDENT' && user.studentId !== id) {
        res.status(403).json({
          success: false,
          message: 'You can only upload your own photo',
        });
        return;
      }

      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
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
      const photoUrl = fileUploadService.getFileUrl(req.file.filename, 'photos');

      // Update student photo URL
      const updatedStudent = await prisma.student.update({
        where: { id },
        data: {
          photoUrl,
        },
        include: {
          university: true,
          program: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Photo uploaded successfully',
        data: {
          id: updatedStudent.id,
          photoUrl: updatedStudent.photoUrl,
        },
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading photo',
      });
    }
  }

  /**
   * Get student with their grades
   * GET /api/students/:id/with-grades
   */
  async getWithGrades(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          university: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          program: {
            select: {
              id: true,
              title: true,
              level: true,
            },
          },
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
        },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      // Fetch grades with module information
      const grades = await prisma.grade.findMany({
        where: { studentId: id },
        include: {
          module: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
            },
          },
        },
        orderBy: {
          module: {
            name: 'asc',
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          ...student,
          grades,
          gradeCount: grades.length,
        },
      });
    } catch (error) {
      console.error('Error retrieving student with grades:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving student',
      });
    }
  }
}

export default new StudentController();

