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
      const user = req.user!;

      const where: any = {};

      // UNIVERSITY can only see students from their own university
      if (user.role === 'UNIVERSITY') {
        if (user.universityId) {
          where.universityId = user.universityId;
        } else {
          res.status(403).json({
            success: false,
            message: 'Your account is not linked to a university. Please contact support.',
          });
          return;
        }
      } else if (universityId) {
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
      const { 
        universityId, 
        programId, 
        firstName, 
        lastName, 
        email, 
        studentId, // Manual ULN input from frontend
        photoUrl, 
        dateOfBirth, 
        enrollmentDate 
      } = req.body;
  
      // 1. Validate required data
      if (!universityId || !firstName || !lastName || !email || !studentId) {
        res.status(400).json({
          success: false,
          message: 'University ID, first name, last name, email, and Student ULN are required',
        });
        return;
      }
  
      // 2. Validate ULN format (UK Standard: exactly 10 digits)
      if (!/^\d{10}$/.test(studentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid ULN format. It must be exactly 10 digits.',
        });
        return;
      }
  
      // 3. Verify university exists
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
  
      // 4. Verify program exists (if provided)
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
  
      // 5. Check if ULN (studentId) already exists to avoid P2002 error
      const duplicateULN = await prisma.student.findUnique({
        where: { studentId: studentId },
      });
  
      if (duplicateULN) {
        res.status(409).json({
          success: false,
          message: 'This ULN is already assigned to another student',
        });
        return;
      }
  
      // 6. Check if student email already exists
      const existingStudent = await prisma.student.findFirst({
        where: { email },
      });
  
      if (existingStudent) {
        res.status(409).json({
          success: false,
          message: 'A student with this email already exists',
        });
        return;
      }
  
      // 7. Create student with manual ULN
      const student = await prisma.student.create({
        data: {
          universityId,
          programId: programId || null,
          studentId, // Manual ULN insertion
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
  
      // 8. Generate temporary password and hash it
      const temporaryPassword = authService.generateTemporaryPassword();
      const hashedPassword = await authService.hashPassword(temporaryPassword);
  
      // 9. Create associated student user
      await prisma.user.create({
        data: {
          studentId: student.id,
          email: student.email,
          password: hashedPassword,
          role: 'STUDENT',
        },
      });
  
      // 10. Send welcome email (Wrapped in try/catch to prevent 500 if SMTP fails)
      try {
        await emailService.sendWelcomeEmail(student.email, temporaryPassword, 'STUDENT');
      } catch (mailError) {
        console.error('Email service failed, but student was created:', mailError);
      }
  
      // 11. Return success response
      res.status(201).json({
        success: true,
        message: 'Student created successfully with provided ULN',
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
   * Bulk create students from CSV
   * POST /api/students/bulk-upload
   * CSV expected columns (no UUID required for UNIVERSITY users):
   * - firstName (required)
   * - lastName (required)
   * - email (required)
   * - programTitle (optional)
   * - programLevel (optional)
   * - dateOfBirth (optional, ISO or yyyy-mm-dd)
   * - enrollmentDate (optional, ISO or yyyy-mm-dd)
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
      const idxStudentId = header.indexOf('studentid');
      const idxFirstName = header.indexOf('firstname');
      const idxLastName = header.indexOf('lastname');
      const idxEmail = header.indexOf('email');
      const idxProgramTitle = header.indexOf('programtitle');
      const idxProgramLevel = header.indexOf('programlevel');
      const idxDob = header.indexOf('dateofbirth');
      const idxEnroll = header.indexOf('enrollmentdate');
      const idxUniversityId = header.indexOf('universityid');

      if (idxStudentId === -1 || idxFirstName === -1 || idxLastName === -1 || idxEmail === -1) {
        res.status(400).json({
          success: false,
          message: 'CSV must contain at least \"firstName\", \"lastName\" and \"email\" columns',
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

        const studentId = cols[idxStudentId] || '';
        const firstName = cols[idxFirstName] || '';
        const lastName = cols[idxLastName] || '';
        const email = cols[idxEmail] || '';
        const programTitle = idxProgramTitle !== -1 ? cols[idxProgramTitle] || '' : '';
        const programLevel = idxProgramLevel !== -1 ? cols[idxProgramLevel] || '' : '';
        const dobRaw = idxDob !== -1 ? cols[idxDob] || '' : '';
        const enrollRaw = idxEnroll !== -1 ? cols[idxEnroll] || '' : '';
        const rowUniversityId =
          universityId ||
          (idxUniversityId !== -1 ? cols[idxUniversityId] || null : null);

        if (!rowUniversityId) {
          errors.push({ row: i + 2, error: 'Missing universityId for this row' });
          continue;
        }
        if (!studentId || !firstName || !lastName || !email) {
          errors.push({ row: i + 2, error: 'Missing studentId, firstName, lastName or email' });
          continue;
        }

        let programId: string | null = null;
        if (programTitle) {
          const levelKey = (programLevel || '').toLowerCase();
          const keyWithLevel = `${rowUniversityId}|${programTitle.toLowerCase()}|${levelKey}`;
          const keyNoLevel = `${rowUniversityId}|${programTitle.toLowerCase()}|`;
          programId = programMap.get(keyWithLevel) || programMap.get(keyNoLevel) || null;
          if (!programId) {
            errors.push({
              row: i + 2,
              error: `Program not found for title \"${programTitle}\"`,
            });
            continue;
          }
        }

        const parseDate = (value: string): Date | null => {
          if (!value) return null;
          const d = new Date(value);
          return Number.isNaN(d.getTime()) ? null : d;
        };

        const dateOfBirth = parseDate(dobRaw);
        const enrollmentDate = parseDate(enrollRaw) || new Date();

        try {
          const existingStudent = await prisma.student.findFirst({
            where: { email },
          });
          if (existingStudent) {
            continue;
          }

          // const studentId = await StudentIdGenerator.generateStudentId(rowUniversityId);

          const student = await prisma.student.create({
            data: {
              universityId: rowUniversityId,
              programId: programId,
              studentId,
              firstName,
              lastName,
              email,
              photoUrl: null,
              dateOfBirth,
              enrollmentDate,
            },
          });

          const temporaryPassword = authService.generateTemporaryPassword();
          const hashedPassword = await authService.hashPassword(temporaryPassword);

          await prisma.user.create({
            data: {
              studentId: student.id,
              email: student.email,
              password: hashedPassword,
              role: 'STUDENT',
            },
          });

          await emailService.sendWelcomeEmail(student.email, temporaryPassword, 'STUDENT');

          created += 1;
        } catch (err: any) {
          console.error('Error creating student from CSV row', i + 2, err);
          errors.push({ row: i + 2, error: 'Database error while creating student' });
        }
      }

      res.status(200).json({
        success: true,
        message: `Bulk student import finished: ${created} created, ${errors.length} with errors`,
        stats: {
          created,
          failed: errors.length,
        },
        errors,
      });
    } catch (error) {
      console.error('Error in bulk student upload:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing bulk student upload',
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
      const { studentId, firstName, lastName, email, photoUrl, dateOfBirth, enrollmentDate, programId } = req.body;

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
      if (studentId) updateData.studentId = studentId;
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
      const user = req.user!;

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

      // UNIVERSITY can only delete students from their own university
      if (user.role === 'UNIVERSITY' && user.universityId !== existingStudent.universityId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete students from your own university',
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

