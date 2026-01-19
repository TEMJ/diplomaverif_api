import prisma from '../config/database';

/**
 * Degree Classification Enum (UK Standard)
 */
export enum DegreeClassification {
  FIRST_CLASS = '1st',           // 70%+
  UPPER_SECOND = '2:1',          // 60-69%
  LOWER_SECOND = '2:2',          // 50-59%
  THIRD_CLASS = '3rd',           // 40-49%
  FAIL = 'Fail',                 // Below 40%
}

/**
 * Academic Service
 * Handles grade calculations and degree classifications
 */
class AcademicService {
  /**
   * Calculate weighted average mark for a student
   * @param studentId - The student's ID
   * @returns Weighted average mark (0-100) or null if no grades found
   */
  async calculateWeightedAverageMark(studentId: string): Promise<number | null> {
    try {
      // Fetch all grades for the student with module credit information
      const grades = await prisma.grade.findMany({
        where: { studentId },
        include: {
          module: {
            select: {
              credits: true,
              name: true,
            },
          },
        },
      });

      if (grades.length === 0) {
        console.warn(`No grades found for student ${studentId}`);
        return null;
      }

      // Calculate weighted average
      let totalCredits = 0;
      let totalWeightedMarks = 0;

      for (const grade of grades) {
        const mark = Number(grade.mark);
        const credits = grade.module.credits || 1; // Default to 1 credit if not specified
        totalWeightedMarks += mark * credits;
        totalCredits += credits;
      }

      if (totalCredits === 0) {
        console.warn(`Total credits is zero for student ${studentId}`);
        return null;
      }

      const weightedAverage = totalWeightedMarks / totalCredits;
      return Math.round(weightedAverage * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating weighted average mark:', error);
      throw error;
    }
  }

  /**
   * Determine UK degree classification based on final mark
   * @param finalMark - The final weighted average mark (0-100)
   * @returns UK degree classification
   */
  getDegreeClassification(finalMark: number): DegreeClassification {
    if (finalMark >= 70) {
      return DegreeClassification.FIRST_CLASS;
    } else if (finalMark >= 60) {
      return DegreeClassification.UPPER_SECOND;
    } else if (finalMark >= 50) {
      return DegreeClassification.LOWER_SECOND;
    } else if (finalMark >= 40) {
      return DegreeClassification.THIRD_CLASS;
    } else {
      return DegreeClassification.FAIL;
    }
  }

  /**
   * Calculate student's degree classification based on their grades
   * @param studentId - The student's ID
   * @returns Object with final mark and classification, or null if no grades found
   */
  async calculateStudentClassification(
    studentId: string,
  ): Promise<{ finalMark: number; degreeClassification: DegreeClassification } | null> {
    try {
      const finalMark = await this.calculateWeightedAverageMark(studentId);
      
      if (finalMark === null) {
        return null;
      }

      const degreeClassification = this.getDegreeClassification(finalMark);

      return {
        finalMark,
        degreeClassification,
      };
    } catch (error) {
      console.error('Error calculating student classification:', error);
      throw error;
    }
  }

  /**
   * Update certificate with calculated marks and classification
   * @param certificateId - The certificate's ID
   * @returns Updated certificate, or null if no grades found (certificate not updated)
   */
  async updateCertificateWithClassification(certificateId: string) {
    try {
      // Fetch certificate
      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
      });

      if (!certificate) {
        throw new Error('Certificate not found');
      }

      // Calculate classification
      const classificationData =
        await this.calculateStudentClassification(certificate.studentId);

      // If no grades found, return null (certificate remains unchanged)
      if (!classificationData) {
        console.warn(
          `Cannot calculate classification for certificate ${certificateId}: no grades found for student ${certificate.studentId}`,
        );
        return null;
      }

      const { finalMark, degreeClassification } = classificationData;

      // Update certificate
      const updatedCertificate = await prisma.certificate.update({
        where: { id: certificateId },
        data: {
          finalMark: finalMark,
          degreeClassification: degreeClassification,
        },
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
      });

      return updatedCertificate;
    } catch (error) {
      console.error('Error updating certificate with classification:', error);
      throw error;
    }
  }

  /**
   * Recalculate and update all certificates for a student
   * Called automatically when grades are added/updated
   * @param studentId - The student's ID
   * @returns Number of certificates updated
   */
  async recalculateStudentCertificates(studentId: string): Promise<number> {
    try {
      // Find all certificates for this student
      const certificates = await prisma.certificate.findMany({
        where: { studentId },
        select: { id: true },
      });

      if (certificates.length === 0) {
        return 0;
      }

      // Calculate classification once for all certificates
      const classificationData =
        await this.calculateStudentClassification(studentId);

      // If no grades found, certificates remain unchanged
      if (!classificationData) {
        console.info(
          `No grades found for student ${studentId}. Certificates will remain with NULL finalMark/degreeClassification.`,
        );
        return 0;
      }

      const { finalMark, degreeClassification } = classificationData;

      // Update all certificates for this student
      const updateResult = await prisma.certificate.updateMany({
        where: { studentId },
        data: {
          finalMark: finalMark,
          degreeClassification: degreeClassification,
        },
      });

      console.info(
        `Recalculated ${updateResult.count} certificate(s) for student ${studentId}. ` +
        `Final mark: ${finalMark}, Classification: ${degreeClassification}`,
      );

      return updateResult.count;
    } catch (error) {
      console.error(
        `Error recalculating certificates for student ${studentId}:`,
        error,
      );
      // Don't throw - this is a background operation
      return 0;
    }
  }

  /**
   * Get grade statistics for a student
   * @param studentId - The student's ID
   * @returns Statistics object
   */
  async getGradeStatistics(studentId: string) {
    try {
      const grades = await prisma.grade.findMany({
        where: { studentId },
        include: {
          module: {
            select: {
              name: true,
              code: true,
              credits: true,
            },
          },
        },
      });

      if (grades.length === 0) {
        throw new Error('No grades found for student');
      }

      const marks = grades.map((g) => Number(g.mark));
      const highestMark = Math.max(...marks);
      const lowestMark = Math.min(...marks);
      const averageMark = marks.reduce((a, b) => a + b, 0) / marks.length;

      return {
        gradeCount: grades.length,
        highestMark: Math.round(highestMark * 100) / 100,
        lowestMark: Math.round(lowestMark * 100) / 100,
        averageMark: Math.round(averageMark * 100) / 100,
        grades: grades.map((g) => ({
          moduleCode: g.module.code,
          moduleName: g.module.name,
          credits: g.module.credits,
          mark: Number(g.mark),
        })),
      };
    } catch (error) {
      console.error('Error getting grade statistics:', error);
      throw error;
    }
  }

  /**
   * Validate grade mark (0-100)
   * @param mark - Grade mark to validate
   * @returns True if valid
   */
  validateGradeMark(mark: number): boolean {
    return mark >= 0 && mark <= 100;
  }
}

export default new AcademicService();
