import { PrismaClient, CertificateStatus, Student, Certificate } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Initialisation du client Prisma
const prisma = new PrismaClient();

/**
 * Fonction principale de seed
 * Crée les données de test pour toutes les tables
 */
async function main() {
  console.log('🌱 Démarrage du seed de la base de données...');

  // Nettoyage de la base de données (attention en production!)
  console.log('🧹 Nettoyage de la base de données...');
  await prisma.verification.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.studentRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.university.deleteMany();

  // Hash du mot de passe par défaut pour les utilisateurs
  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 1. Création des universités
  console.log('📚 Création des universités...');
  const universities = await Promise.all([
    prisma.university.create({
      data: {
        name: 'Université de Paris',
        address: '17 Rue de la Sorbonne, 75005 Paris, France',
        contactEmail: 'contact@univ-paris.fr',
        phone: '+33 1 40 46 22 11',
        logoUrl: 'https://example.com/logos/univ-paris.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Université Aix-Marseille',
        address: 'Aix-en-Provence Campus, 13397 Marseille, France',
        contactEmail: 'contact@univ-amu.fr',
        phone: '+33 4 13 55 30 00',
        logoUrl: 'https://example.com/logos/univ-amu.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Université Lyon 1',
        address: '43 Boulevard du 11 Novembre 1918, 69622 Villeurbanne',
        contactEmail: 'contact@univ-lyon1.fr',
        phone: '+33 4 72 44 80 00',
        logoUrl: 'https://example.com/logos/univ-lyon1.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Université de Bordeaux',
        address: '351 Cours de la Libération, 33405 Talence',
        contactEmail: 'contact@u-bordeaux.fr',
        phone: '+33 5 40 00 60 00',
        logoUrl: 'https://example.com/logos/univ-bordeaux.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Université Toulouse 1 Capitole',
        address: '2 Rue du Doyen Gabriel Marty, 31042 Toulouse',
        contactEmail: 'contact@ut-capitole.fr',
        phone: '+33 5 61 63 35 00',
        logoUrl: 'https://example.com/logos/univ-toulouse.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Université de Lille',
        address: '42 Rue Paul Duez, 59000 Lille',
        contactEmail: 'contact@univ-lille.fr',
        phone: '+33 3 20 41 60 00',
        logoUrl: 'https://example.com/logos/univ-lille.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Université de Strasbourg',
        address: '4 Rue Blaise Pascal, 67081 Strasbourg',
        contactEmail: 'contact@unistra.fr',
        phone: '+33 3 68 85 00 00',
        logoUrl: 'https://example.com/logos/univ-strasbourg.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Université de Montpellier',
        address: '163 Rue Auguste Broussonnet, 34090 Montpellier',
        contactEmail: 'contact@umontpellier.fr',
        phone: '+33 4 67 14 20 20',
        logoUrl: 'https://example.com/logos/univ-montpellier.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Université Grenoble Alpes',
        address: '621 Avenue Centrale, 38400 Saint-Martin-d\'Hères',
        contactEmail: 'contact@univ-grenoble-alpes.fr',
        phone: '+33 4 76 82 54 00',
        logoUrl: 'https://example.com/logos/univ-grenoble.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Université de Nantes',
        address: '1 Quai de Tourville, 44000 Nantes',
        contactEmail: 'contact@univ-nantes.fr',
        phone: '+33 2 40 37 30 00',
        logoUrl: 'https://example.com/logos/univ-nantes.png',
      },
    }),
  ]);

  // 2. Création de l'utilisateur ADMIN
  console.log('👤 Création de l\'administrateur...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@diplomaverif.com',
      password: defaultPassword,
      role: 'ADMIN',
    },
  });

  // 3. Création des utilisateurs universitaires
  console.log('🏫 Création des utilisateurs universitaires...');
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

  // 4. Création des étudiants
  console.log('🎓 Création des étudiants...');
  // Typer explicitement le tableau pour éviter l'erreur TypeScript
  const students: (Student & { major: string })[] = [];
  const majors = [
    'Informatique',
    'Mathématiques',
    'Physique',
    'Chimie',
    'Biologie',
    'Économie',
    'Droit',
    'Médecine',
    'Ingénierie',
    'Langues',
  ];

  // Créer 10 étudiants par université (100 au total)
  for (const university of universities) {
    for (let i = 1; i <= 10; i++) {
      // Générer un matricule unique
      const matricule = `${university.name.substring(0, 3).toUpperCase()}${Date.now()}${Math.random().toString(36).substring(2, 8)}${i}`;
      
      // Générer un email unique
      const email = `student${students.length + 1}@${university.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${university.id.substring(0, 8)}.edu`;
      
      const major = majors[Math.floor(Math.random() * majors.length)];
      const dateOfBirth = new Date(1995 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

      const student = await prisma.student.create({
        data: {
          universityId: university.id,
          matricule,
          email,
          photoUrl: `https://example.com/photos/student-${students.length + 1}.jpg`,
          dateOfBirth,
          major,
        },
      });

      students.push({ ...student, major });

      // Créer l'utilisateur étudiant associé
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

  console.log(`✅ ${students.length} étudiants créés`);

  // 5. Création des dossiers étudiants
  console.log('📁 Création des dossiers étudiants...');
  for (const student of students) {
    const attendance = Math.floor(Math.random() * 40) + 60; // 60-100%
    const disciplineNotes = [
      'Excellent comportement',
      'Bon comportement',
      'Quelques absences non justifiées',
      'Comportement exemplaire',
      'Étudiant sérieux et assidu',
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

  // 6. Création des certificats
  console.log('📜 Création des certificats...');
  // Typer explicitement le tableau pour éviter l'erreur TypeScript
  const certificates: Certificate[] = [];
  const degreeTitles = [
    'Licence en Informatique',
    'Master en Mathématiques',
    'Licence en Physique',
    'Master en Chimie',
    'Licence en Biologie',
    'Master en Économie',
    'Licence en Droit',
    'Doctorat en Médecine',
    'Master en Ingénierie',
    'Licence en Langues',
  ];
  const specializations = [
    'Intelligence Artificielle',
    'Analyse de Données',
    'Nanotechnologies',
    'Biochimie',
    'Génétique',
    'Finance Internationale',
    'Droit International',
    'Chirurgie',
    'Génie Civil',
    'Traduction',
  ];

  for (const student of students) {
    const university = universities.find(u => u.id === student.universityId);
    if (!university) continue;

    const degreeIndex = Math.floor(Math.random() * degreeTitles.length);
    const degreeTitle = degreeTitles[degreeIndex];
    const specialization = specializations[degreeIndex];
    
    // Générer un hash unique pour le QR code
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
        status: Math.random() > 0.1 ? CertificateStatus.ACTIVE : CertificateStatus.REVOKED, // 90% actifs
      },
    });

    certificates.push(certificate);
  }

  console.log(`✅ ${certificates.length} certificats créés`);

  // 7. Création des vérifications
  console.log('🔍 Création des vérifications...');
  const companyNames = [
    'TechCorp Solutions',
    'InnovateHub Inc.',
    'DataSmart Consulting',
    'CloudForge Systems',
    'CodeMasters Ltd.',
    'Digital Dynamics',
    'FutureTech Industries',
    'SmartSoft Corporation',
    'ByteLogic Solutions',
    'Apex Innovations',
  ];

  const reasons = [
    'Vérification de diplôme pour recrutement',
    'Conformité et audit',
    'Vérification pré-emploi',
    'Validation de compétences',
    'Processus de recrutement',
  ];

  // Créer des vérifications pour 50 certificats aléatoires
  for (let i = 0; i < 50; i++) {
    const certIndex = Math.floor(Math.random() * certificates.length);
    const certificate = certificates[certIndex];
    const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
    const email = `hr@${companyName.toLowerCase().replace(/\s/g, '-')}.com`;
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const ipAddress = `192.168.1.${Math.floor(Math.random() * 255)}`;
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

  console.log('✅ 50 vérifications créées');

  // Résumé
  console.log('\n📊 Résumé du seed:');
  console.log(`  ✅ ${universities.length} universités`);
  console.log(`  ✅ 1 administrateur (email: admin@diplomaverif.com)`);
  console.log(`  ✅ ${universityUsers.length} utilisateurs universitaires`);
  console.log(`  ✅ ${students.length} étudiants`);
  console.log(`  ✅ ${students.length} utilisateurs étudiants`);
  console.log(`  ✅ ${students.length} dossiers étudiants`);
  console.log(`  ✅ ${certificates.length} certificats`);
  console.log(`  ✅ 50 vérifications`);
  console.log('\n🔑 Mot de passe par défaut pour tous les comptes: Password123!');
  console.log('🎉 Seed terminé avec succès!\n');
}

// Exécution du seed
main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });