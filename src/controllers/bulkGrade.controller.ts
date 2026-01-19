import { Request, Response } from 'express';
import prisma from '../config/database';
import academicService from '../services/academic.service';

/**
 * Controller for bulk grade entry
 * POST /api/grades/bulk-entry
 */
class BulkGradeController {
  async bulkEntry(req: Request, res: Response): Promise<void> {
    try {
      const { moduleId, grades } = req.body;
      if (!moduleId || !Array.isArray(grades)) {
        res.status(400).json({ success: false, message: 'moduleId and grades array are required.' });
        return;
      }
      // Check module existence
      const module = await prisma.module.findUnique({ where: { id: moduleId }, include: { program: true } });
      if (!module) {
        res.status(404).json({ success: false, message: 'Module not found.' });
        return;
      }
      // For each grade, verify student enrollment and upsert
      const results = [];
      const affectedStudentIds = new Set<string>();
      
      for (const entry of grades) {
        const { studentId, mark } = entry;
        if (typeof studentId !== 'string' || typeof mark !== 'number') continue;
        // Check student existence and enrollment
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student || student.programId !== module.programId) {
          results.push({ studentId, status: 'skipped', reason: 'Student not enrolled in module program.' });
          continue;
        }
        // Upsert grade
        const existing = await prisma.grade.findFirst({ where: { studentId, moduleId } });
        if (existing) {
          await prisma.grade.update({ where: { id: existing.id }, data: { mark } });
          results.push({ studentId, status: 'updated' });
        } else {
          await prisma.grade.create({ data: { studentId, moduleId, mark } });
          results.push({ studentId, status: 'created' });
        }
        affectedStudentIds.add(studentId);
      }
      
      // Recalculate certificates for all affected students (background operation)
      for (const studentId of affectedStudentIds) {
        academicService.recalculateStudentCertificates(studentId).catch((err) => {
          console.error(`Error recalculating certificates for student ${studentId} after bulk entry:`, err);
        });
      }
      
      res.status(200).json({ success: true, results });
    } catch (error) {
      console.error('Bulk grade entry error:', error);
      res.status(500).json({ success: false, message: 'Server error during bulk grade entry.' });
    }
  }
}

export default new BulkGradeController();
