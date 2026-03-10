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
  // console.log('🧹 Cleaning database...');
  // await prisma.verification.deleteMany();
  // await prisma.certificate.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.studentRecord.deleteMany();
  // await prisma.student.deleteMany();
  // await prisma.university.deleteMany();

  // Default password for seeded users
  // const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 2. Create ADMIN user
  // console.log('👤 Creating administrator user...');
  // const admin = await prisma.user.create({
  //   data: {
  //     email: 'admin@diplomaverif.com',
  //     password: defaultPassword,
  //     role: 'ADMIN',
  //   },
  // });

  const universityId = "67edfa42-cccb-41e6-a3f0-119e9aef1d56"

  const programsData = [
    { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', title: 'BSc (Hons) Computer Science', level: 'Undergraduate', credits: 120 },
    { id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', title: 'BSc (Hons) Business Management', level: 'Undergraduate', credits: 120 },
    { id: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', title: 'BSc (Hons) Cyber Security', level: 'Undergraduate', credits: 120 },
    { id: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', title: 'BEng (Hons) Aeronautical Engineering', level: 'Undergraduate', credits: 120 },
    { id: 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', title: 'BSc (Hons) Environmental Management', level: 'Undergraduate', credits: 120 },
    { id: 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0', title: 'BA (Hons) Digital Media', level: 'Undergraduate', credits: 120 },
    { id: 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', title: 'BA (Hons) Marketing', level: 'Undergraduate', credits: 120 },
    { id: 'a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2', title: 'BSc (Hons) Quantity Surveying', level: 'Undergraduate', credits: 120 },
    { id: 'b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3', title: 'BA (Hons) English and Creative Writing', level: 'Undergraduate', credits: 120 },
    { id: 'c9d0e1f2-a3b4-45c5-d6e7-f8a9b0c1d2e3', title: 'BSc (Hons) Data Science', level: 'Undergraduate', credits: 120 },
    { id: 'd0e1f2a3-b4c5-46d6-e7f8-a9b0c1d2e3f4', title: 'MSc Computer Science', level: 'Postgraduate', credits: 180 },
    { id: 'e1f2a3b4-c5d6-47e7-f8a9-b0c1d2e3f4a5', title: 'MSc Artificial Intelligence', level: 'Postgraduate', credits: 180 },
    { id: 'f2a3b4c5-d6e7-48f8-a9b0-c1d2e3f4a5b6', title: 'MSc Cyber Security', level: 'Postgraduate', credits: 180 },
    { id: 'a3b4c5d6-e7f8-49a9-b0c1-d2e3f4a5b6c7', title: 'MSc Data Science', level: 'Postgraduate', credits: 180 },
    { id: 'b4c5d6e7-f8a9-40b0-c1d2-e3f4a5b6c7d8', title: 'MSc Project Management', level: 'Postgraduate', credits: 180 },
    { id: 'c5d6e7f8-a9b0-41c1-d2e3-f4a5b6c7d8e9', title: 'MBA (Master of Business Administration)', level: 'Postgraduate', credits: 180 },
    { id: 'd6e7f8a9-b0c1-42d2-e3f4-a5b6c7d8e9f0', title: 'MSc Digital Marketing', level: 'Postgraduate', credits: 180 },
    { id: 'e7f8a9b0-c1d2-43e3-f4a5-b6c7d8e9f0a1', title: 'MSc Environmental Management', level: 'Postgraduate', credits: 180 },
    { id: 'f8a9b0c1-d2e3-44f4-a5b6-c7d8e9f0a1b2', title: 'MSc Construction Project Management', level: 'Postgraduate', credits: 180 },
    { id: 'a9b0c1d2-e3f4-45a5-b6c7-d8e9f0a1b2c3', title: 'MA Creative Writing', level: 'Postgraduate', credits: 180 }
  ]

  for (const prog of programsData) {
    await prisma.program.upsert({
      where: { id: prog.id },
      update: {},
      create: {
        id: prog.id,
        universityId: universityId,
        title: prog.title,
        level: prog.level,
        totalCreditsRequired: prog.credits,
      },
    })
  }

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