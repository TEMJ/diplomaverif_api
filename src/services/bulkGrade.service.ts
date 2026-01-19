import prisma from '../config/database';

/**
 * Service for bulk grade entry
 */
class BulkGradeService {
  /**
   * Bulk upsert grades for a module
   */
  async bulkUpsert(moduleId: string, grades: Array<{ studentId: string; mark: number }>) {
    const module = await prisma.module.findUnique({ where: { id: moduleId }, include: { program: true } });
    if (!module) throw new Error('Module not found');
    const results = [];
    for (const entry of grades) {
      const { studentId, mark } = entry;
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student || student.programId !== module.programId) {
        results.push({ studentId, status: 'skipped', reason: 'Student not enrolled in module program.' });
        continue;
      }
      const existing = await prisma.grade.findFirst({ where: { studentId, moduleId } });
      if (existing) {
        await prisma.grade.update({ where: { id: existing.id }, data: { mark } });
        results.push({ studentId, status: 'updated' });
      } else {
        await prisma.grade.create({ data: { studentId, moduleId, mark } });
        results.push({ studentId, status: 'created' });
      }
    }
    return results;
  }
}

export default new BulkGradeService();
