import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Student ID Generator Utility
 * Format: {UNIV_PREFIX}{YEAR}{ENCODED_TIME}{SEQUENCE}
 * Example: HARV24K9Z80001
 */
export class StudentIdGenerator {
  /**
   * Generate a unique student ID for a university
   * @param universityId - The university's ID
   * @returns Generated unique student ID
   */
  static async generateStudentId(universityId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().substring(2); // "2026" -> "26"

    // 1. Get University Prefix (First 4 letters, Uppercase)
    const university = await prisma.university.findUnique({
      where: { id: universityId },
      select: { name: true }
    });
    
    const prefix = (university?.name || 'STUD')
      .substring(0, 4)
      .toUpperCase()
      .padEnd(4, 'X');

    // 2. Generate a Time-based Hash (Base36 encoding of current timestamp)
    // We take the last 4 characters of the timestamp in base36 for "shuffling"
    const timeHash = now.getTime().toString(36).toUpperCase().slice(-4);

    // 3. Get the sequence for today/this year to avoid collisions
    const count = await prisma.student.count({
      where: {
        universityId,
        createdAt: {
          gte: new Date(now.getFullYear(), 0, 1), // Since start of year
        },
      },
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');

    // Final Format: UNIV + YEAR + TIME_HASH + SEQUENCE
    // example: POLY26B7X20001
    return `${prefix}${year}${timeHash}${sequence}`;
  }

  /**
   * Validate a student ID format
   * Checks if it starts with 4 letters and contains the year/sequence logic
   */
  static validateStudentId(studentId: string): boolean {
    // Regex: 4 letters + 2 digits (year) + 4 chars (hash) + 4 digits (seq)
    const pattern = /^[A-Z]{4}\d{2}[A-Z0-9]{4}\d{4}$/;
    return pattern.test(studentId);
  }

  /**
   * Extract the university prefix from ID
   */
  static getUniversityPrefix(studentId: string): string {
    return studentId.substring(0, 4);
  }
}