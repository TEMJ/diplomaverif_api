import prisma from '../config/database';

/**
 * Student ID Generator Utility
 * Generates automatic student matricule numbers based on enrollment year and sequence
 * Format: {YEAR}{UNIVERSITY_CODE}{SEQUENCE}
 * Example: 2024UC0001
 */
export class StudentIdGenerator {
  /**
   * Generate a unique student ID for a university
   * @param universityId - The university's ID
   * @param enrollmentYear - The enrollment year (defaults to current year)
   * @returns Generated student ID
   */
  static async generateStudentId(universityId: string, enrollmentYear?: number): Promise<string> {
    // Use current year if not provided
    const year = enrollmentYear || new Date().getFullYear();

    // Get the last student for this university and year
    const lastStudent = await prisma.student.findMany({
      where: {
        universityId,
        studentId: {
          startsWith: year.toString(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    // Parse the last sequence number
    let sequenceNumber = 1;
    if (lastStudent.length > 0) {
      const lastStudentId = lastStudent[0].studentId;
      // Extract the numeric suffix (format: YEAR###)
      const match = lastStudentId?.match(/(\d{4})(\d{4})$/);
      if (match) {
        sequenceNumber = parseInt(match[2], 10) + 1;
      }
    }

    // Format: {YEAR}{SEQUENCE} (e.g., 20240001)
    const studentId = `${year}${String(sequenceNumber).padStart(4, '0')}`;

    return studentId;
  }

  /**
   * Validate a student ID format
   * @param studentId - The student ID to validate
   * @returns True if valid format
   */
  static validateStudentId(studentId: string): boolean {
    // Must be 8 digits: YYYY + 4-digit sequence
    const pattern = /^\d{8}$/;
    return pattern.test(studentId);
  }

  /**
   * Get year from student ID
   * @param studentId - The student ID
   * @returns The enrollment year
   */
  static getYearFromStudentId(studentId: string): number {
    return parseInt(studentId.substring(0, 4), 10);
  }

  /**
   * Get sequence from student ID
   * @param studentId - The student ID
   * @returns The sequence number
   */
  static getSequenceFromStudentId(studentId: string): number {
    return parseInt(studentId.substring(4, 8), 10);
  }
}
