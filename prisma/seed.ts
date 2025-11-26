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

  // 1. Create UK universities
  console.log('📚 Creating universities...');
  const universities = await Promise.all([
    prisma.university.create({
      data: {
        name: 'University of Oxford',
        address: 'University Offices, Wellington Square, Oxford OX1 2JD, United Kingdom',
        contactEmail: 'admissions@ox.ac.uk',
        phone: '+44 1865 270000',
        logoUrl: 'https://example.com/logos/oxford.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University of Cambridge',
        address: 'The Old Schools, Trinity Ln, Cambridge CB2 1TN, United Kingdom',
        contactEmail: 'admissions@cam.ac.uk',
        phone: '+44 1223 337733',
        logoUrl: 'https://example.com/logos/cambridge.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Imperial College London',
        address: 'Exhibition Rd, South Kensington, London SW7 2BX, United Kingdom',
        contactEmail: 'contact@imperial.ac.uk',
        phone: '+44 20 7589 5111',
        logoUrl: 'https://example.com/logos/imperial.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University College London',
        address: 'Gower St, Bloomsbury, London WC1E 6BT, United Kingdom',
        contactEmail: 'info@ucl.ac.uk',
        phone: '+44 20 7679 2000',
        logoUrl: 'https://example.com/logos/ucl.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University of Manchester',
        address: 'Oxford Rd, Manchester M13 9PL, United Kingdom',
        contactEmail: 'admissions@manchester.ac.uk',
        phone: '+44 161 306 6000',
        logoUrl: 'https://example.com/logos/manchester.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University of Edinburgh',
        address: 'Old College, South Bridge, Edinburgh EH8 9YL, United Kingdom',
        contactEmail: 'inquiries@ed.ac.uk',
        phone: '+44 131 650 1000',
        logoUrl: 'https://example.com/logos/edinburgh.png',
      },
    }),
    prisma.university.create({
      data: {
        name: "King's College London",
        address: "Strand, London WC2R 2LS, United Kingdom",
        contactEmail: 'info@kcl.ac.uk',
        phone: '+44 20 7848 2000',
        logoUrl: 'https://example.com/logos/kcl.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University of Birmingham',
        address: 'Edgbaston, Birmingham B15 2TT, United Kingdom',
        contactEmail: 'admissions@bham.ac.uk',
        phone: '+44 121 414 3344',
        logoUrl: 'https://example.com/logos/birmingham.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University of Warwick',
        address: 'Coventry CV4 7AL, United Kingdom',
        contactEmail: 'info@warwick.ac.uk',
        phone: '+44 24 7652 3523',
        logoUrl: 'https://example.com/logos/warwick.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University of Glasgow',
        address: 'University Avenue, Glasgow G12 8QQ, United Kingdom',
        contactEmail: 'admissions@glasgow.ac.uk',
        phone: '+44 141 330 2000',
        logoUrl: 'https://example.com/logos/glasgow.png',
      },
    }),
  ]);

  // 2. Create ADMIN user
  console.log('👤 Creating administrator user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@diplomaverif.com',
      password: defaultPassword,
      role: 'ADMIN',
    },
  });

  // 3. Create university users
  console.log('🏫 Creating university users...');
  const universityUsers = await Promise.all(
    universities.map(uni =>
      prisma.user.create({
        data: {
          universityId: uni.id,
          email: uni.contactEmail,
          password: defaultPassword,
          role: 'UNIVERSITY',
        },
      })
    )
  );

  // 4. Create students
  console.log('🎓 Creating students...');
  const students: (Student & { major: string })[] = [];
  const majors = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Economics',
    'Law',
    'Medicine',
    'Engineering',
    'Modern Languages',
  ];

  const firstNames = ['Oliver','George','Harry','Jack','Noah','Charlie','William','Thomas','James','Henry','Olivia','Amelia','Isla','Ava','Emily','Sophia','Mia','Isabella','Lily','Freya'];
  const lastNames = ['Smith','Jones','Taylor','Brown','Williams','Wilson','Davies','Evans','Thomas','Roberts','Johnson','Walker','Wright','Robinson','Thompson','White','Hughes','Edwards','Green','Hall'];

  // Create 10 students per university (100 total)
  for (const university of universities) {
    for (let i = 1; i <= 10; i++) {
      const matricule = `${university.name.substring(0, 3).toUpperCase()}${Date.now()}${Math.random().toString(36).substring(2, 8)}${i}`;

      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${students.length + 1}@${university.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')}.ac.uk`;

      const major = majors[Math.floor(Math.random() * majors.length)];
      const dateOfBirth = new Date(1995 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

      const student = await prisma.student.create({
        data: {
          universityId: university.id,
          matricule,
          firstName,
          lastName,
          email,
          photoUrl: `https://example.com/photos/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${students.length + 1}.jpg`,
          dateOfBirth,
          major,
        },
      });

      students.push({ ...student, major });

      // Create associated student user
      await prisma.user.create({
        data: {
          studentId: student.id,
          email: student.email,
          password: defaultPassword,
          role: 'STUDENT',
        },
      });
    }
  }

  console.log(`✅ ${students.length} students created`);

  // 5. Create student records
  console.log('📁 Creating student records...');
  for (const student of students) {
    const attendance = Math.floor(Math.random() * 40) + 60; // 60-100%
    const disciplineNotes = [
      'Excellent conduct',
      'Good conduct',
      'Some unexcused absences',
      'Exemplary behaviour',
      'Diligent and committed student',
    ];
    const discipline = disciplineNotes[Math.floor(Math.random() * disciplineNotes.length)];

    await prisma.studentRecord.create({
      data: {
        studentId: student.id,
        attendance,
        discipline,
        gradesPdfUrl: `https://example.com/pdfs/grades-${student.id}.pdf`,
        transcriptPdfUrl: `https://example.com/pdfs/transcript-${student.id}.pdf`,
        diplomaPdfUrl: `https://example.com/pdfs/diploma-${student.id}.pdf`,
      },
    });
  }

  // 6. Create certificates
  console.log('📜 Creating certificates...');
  const certificates: Certificate[] = [];
  const degreeTitles = [
    'BSc in Computer Science',
    'MSc in Mathematics',
    'BSc in Physics',
    'MSc in Chemistry',
    'BSc in Biology',
    'MSc in Economics',
    'LLB in Law',
    'PhD in Medicine',
    'MEng in Engineering',
    'BA in Modern Languages',
  ];
  const specializations = [
    'Artificial Intelligence',
    'Data Analysis',
    'Nanotechnology',
    'Biochemistry',
    'Genetics',
    'International Finance',
    'International Law',
    'Surgical Research',
    'Civil Engineering',
    'Translation Studies',
  ];

  for (const student of students) {
    const university = universities.find(u => u.id === student.universityId);
    if (!university) continue;

    const degreeIndex = Math.floor(Math.random() * degreeTitles.length);
    const degreeTitle = degreeTitles[degreeIndex];
    const specialization = specializations[degreeIndex];

    const qrHash = crypto.randomBytes(16).toString('hex');
    const graduationDate = new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

    const certificate = await prisma.certificate.create({
      data: {
        studentId: student.id,
        universityId: university.id,
        degreeTitle,
        specialization,
        graduationDate,
        pdfUrl: `https://example.com/certificates/cert-${student.id}.pdf`,
        qrCodeUrl: `https://example.com/qrcodes/qr-${qrHash}.png`,
        qrHash,
        status: Math.random() > 0.1 ? CertificateStatus.ACTIVE : CertificateStatus.REVOKED,
      },
    });

    certificates.push(certificate);
  }

  console.log(`✅ ${certificates.length} certificates created`);

  // 7. Create verifications
  console.log('🔍 Creating verifications...');
  const companyNames = [
    'BritTech Solutions',
    'Cavendish Consulting',
    'Oxford Data Services',
    'LondonCloud Ltd',
    'CodeWorks UK',
    'Digital Harbour',
    'FutureBridge Ltd',
    'SmartLogic UK',
    'ByteHouse',
    'Apex UK',
  ];

  const reasons = [
    'Degree verification for recruitment',
    'Compliance and audit',
    'Pre-employment verification',
    'Skills validation',
    'Recruitment screening',
  ];

  for (let i = 0; i < 50; i++) {
    const certIndex = Math.floor(Math.random() * certificates.length);
    const certificate = certificates[certIndex];
    const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
    const email = `hr@${companyName.toLowerCase().replace(/\s/g, '-')}.co.uk`;
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const ipAddress = `81.12.34.${Math.floor(Math.random() * 255)}`; // sample UK-like IP octet
    const verificationDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

    await prisma.verification.create({
      data: {
        certificateId: certificate.id,
        companyName,
        email,
        reason,
        ipAddress,
        verificationDate,
      },
    });
  }

  console.log('✅ 50 verifications created');

  // Summary
  console.log('\n📊 Seed summary:');
  console.log(`  ✅ ${universities.length} universities`);
  console.log(`  ✅ 1 administrator (email: admin@diplomaverif.com)`);
  console.log(`  ✅ ${universityUsers.length} university users`);
  console.log(`  ✅ ${students.length} students`);
  console.log(`  ✅ ${students.length} student users`);
  console.log(`  ✅ ${students.length} student records`);
  console.log(`  ✅ ${certificates.length} certificates`);
  console.log(`  ✅ 50 verifications`);
  console.log('\n🔑 Default password for all seeded accounts: Password123!');
  console.log('🎉 Seed completed successfully!\n');
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