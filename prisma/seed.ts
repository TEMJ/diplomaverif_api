import { PrismaClient, CertificateStatus, Student, Certificate } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Main seed function
 * Creates sample data (UK / English) for development/testing
 */
async function main() {
  console.log('🌱 Starting database seed (UK test data)...');

  // Clean database (CAUTION: destructive)
  console.log('🧹 Cleaning database...');
  await prisma.verification.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.studentRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.university.deleteMany();

  // Default password for seeded users
  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 2. Create ADMIN user
  console.log('👤 Creating administrator user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@diplomaverif.com',
      password: defaultPassword,
      role: 'ADMIN',
    },
  });

}

// Execute seed
main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });