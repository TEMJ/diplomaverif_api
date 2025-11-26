import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Controller for managing student records
 * Handles CRUD operations on student records
 */
class StudentRecordController {
  /**
   * Retrieve all student records
   * GET /api/student-records
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.query;

      const where: any = {};
      if (studentId) where.studentId = studentId as string;

      const records = await prisma.studentRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              matricule: true,
              email: true,
              major: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (error) {
      console.error('Error retrieving student records:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving student records',
      });
    }
  }

  /**
   * Retrieve a student record by ID
   * GET /api/student-records/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const record = await prisma.studentRecord.findUnique({
        where: { id },
        include: {
          student: {
            include: {
              university: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Student record not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      console.error('Error retrieving student record:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving student record',
      });
    }
  }

  /**
   * Retrieve a student record by studentId
   * GET /api/student-records/student/:studentId
   */
  async getByStudentId(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;

      const record = await prisma.studentRecord.findUnique({
        where: { studentId },
        include: {
          student: {
            include: {
              university: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Student record not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      console.error('Error retrieving student record:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving student record',
      });
    }
  }

  /**
   * Create a new student record
   * POST /api/student-records
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        studentId,
        attendance,
        discipline,
        gradesPdfUrl,
        transcriptPdfUrl,
        diplomaPdfUrl,
      } = req.body;

      // Validate data
      if (!studentId || !gradesPdfUrl || !transcriptPdfUrl || !diplomaPdfUrl) {
        res.status(400).json({
          success: false,
          message: 'All fields are required',
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

      // Check if record already exists for this student
      const existingRecord = await prisma.studentRecord.findUnique({
        where: { studentId },
      });

      if (existingRecord) {
        res.status(409).json({
          success: false,
          message: 'A record already exists for this student',
        });
        return;
      }

      // Create student record
      const record = await prisma.studentRecord.create({
        data: {
          studentId,
          attendance: attendance || 0,
          discipline: discipline || '',
          gradesPdfUrl,
          transcriptPdfUrl,
          diplomaPdfUrl,
        },
        include: {
          student: {
            select: {
              id: true,
              matricule: true,
              email: true,
              major: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Student record created successfully',
        data: record,
      });
    } catch (error) {
      console.error('Error creating student record:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating student record',
      });
    }
  }

  /**
   * Update a student record
   * PUT /api/student-records/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { attendance, discipline, gradesPdfUrl, transcriptPdfUrl, diplomaPdfUrl } = req.body;

      // Check if record exists
      const existingRecord = await prisma.studentRecord.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        res.status(404).json({
          success: false,
          message: 'Student record not found',
        });
        return;
      }

      // Update record
      const record = await prisma.studentRecord.update({
        where: { id },
        data: {
          attendance,
          discipline,
          gradesPdfUrl,
          transcriptPdfUrl,
          diplomaPdfUrl,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Student record updated successfully',
        data: record,
      });
    } catch (error) {
      console.error('Error updating student record:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating student record',
      });
    }
  }

  /**
   * Delete a student record
   * DELETE /api/student-records/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if record exists
      const existingRecord = await prisma.studentRecord.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        res.status(404).json({
          success: false,
          message: 'Student record not found',
        });
        return;
      }

      // Delete record
      await prisma.studentRecord.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Student record deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting student record:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting student record',
      });
    }
  }
}

export default new StudentRecordController();

