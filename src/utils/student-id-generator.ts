import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto'; // Utilisation du module crypto natif de Node.js

const prisma = new PrismaClient();

export class StudentIdGenerator {
  static async generateStudentId(universityId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().substring(2);

    const university = await prisma.university.findUnique({
      where: { id: universityId },
      select: { name: true }
    });
    
    const prefix = (university?.name || 'STUD')
      .substring(0, 4)
      .toUpperCase()
      .replace(/\s/g, 'X') // Remplace les espaces par X
      .padEnd(4, 'X');

    // 1. TimeHash (On garde une trace du temps)
    const timeHash = now.getTime().toString(36).toUpperCase().slice(-4);

    // 2. RANDOM SUFFIX (Au lieu du count)
    // On génère 3 octets aléatoires convertis en hexadécimal (ex: A1B2C3)
    // C'est beaucoup plus sûr qu'un simple nombre aléatoire
    const randomSuffix = randomBytes(3).toString('hex').toUpperCase();

    // Final Format: UNIV + YEAR + TIME_HASH + RANDOM
    // Example: UCAC26B7X2A1B2C3
    return `${prefix}${year}${timeHash}${randomSuffix}`;
  }

  static validateStudentId(studentId: string): boolean {
    // Nouvelle regex adaptée au format avec suffixe aléatoire hexadécimal
    const pattern = /^[A-Z]{4}\d{2}[A-Z0-9]{4}[A-F0-9]{6}$/;
    return pattern.test(studentId);
  }
}