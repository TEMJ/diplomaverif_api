import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import prisma from '../config/database';
import qrCodeService from './qrcode.service';
import fileUploadService from './file-upload.service';

/**
 * Certificate Service
 * Handles PDF generation for certificates
 */
class CertificateService {
  /**
   * Generate a PDF certificate for a student
   * @param certificateId - The ID of the certificate
   * @returns A stream containing the PDF data
   */
  async generateCertificatePdf(certificateId: string): Promise<Buffer> {
    try {
      // Fetch certificate with all related data including university logo, seal, and signature
      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          student: true,
          university: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              officialSealUrl: true,
              signatureUrl: true,
              registrarName: true,
            },
          },
        },
      });

      if (!certificate) {
        throw new Error('Certificate not found');
      }

      // Récupérer le programme de l'étudiant
      let program = null;
      if (certificate.student && certificate.student.programId) {
        program = await prisma.program.findUnique({
          where: { id: certificate.student.programId },
        });
      }

      // Récupérer les notes du programme de l'étudiant
      let moduleGrades: any[] = [];
      if (certificate.student && program && program.id) {
        moduleGrades = await prisma.grade.findMany({
          where: {
            studentId: certificate.student.id,
            module: {
              programId: program.id,
            },
          },
          include: {
            module: true,
          },
        });
      }

      // Generate QR code as Buffer for PDF embedding
      let qrCodeBuffer: Buffer | null = null;
      if (certificate.qrHash) {
        try {
          qrCodeBuffer = await qrCodeService.generateQRCodeBuffer(certificate.qrHash);
        } catch (error) {
          console.warn('Could not generate QR code buffer:', error);
        }
      }

      // Load university images (logo, seal, signature) as Buffers
      let logoBuffer: Buffer | null = null;
      let sealBuffer: Buffer | null = null;
      let signatureBuffer: Buffer | null = null;

      if (certificate.university?.logoUrl) {
        logoBuffer = await this.loadImageBuffer(certificate.university.logoUrl);
      }
      if (certificate.university?.officialSealUrl) {
        sealBuffer = await this.loadImageBuffer(certificate.university.officialSealUrl);
      }
      if (certificate.university?.signatureUrl) {
        signatureBuffer = await this.loadImageBuffer(certificate.university.signatureUrl);
      }

      // Create PDF document in PORTRAIT mode
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margin: 40,
      });

      // Collect PDF data
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on('error', reject);

        // Start writing content - pass QR code buffer, program, moduleGrades, and university images
        this.buildCertificateContent(
          doc,
          certificate,
          qrCodeBuffer,
          program,
          moduleGrades,
          logoBuffer,
          sealBuffer,
          signatureBuffer,
        );

        // End document
        doc.end();
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Load image from URL or local path as Buffer
   * Handles both local file paths and URLs (including localhost URLs)
   * Uses file-upload.service to get the correct upload directory
   */
  private async loadImageBuffer(imageUrl: string): Promise<Buffer | null> {
    try {
      if (!imageUrl) {
        return null;
      }

      // Extract filename and type from URL or path
      let fileName = '';
      let fileType: 'logos' | 'seals' | 'signatures' | 'photos' | null = null;
      
      // Extract local path from URL if it's a localhost URL
      const apiUrl = process.env.API_URL || 'http://localhost:3000';
      const isLocalUrl = imageUrl.startsWith(apiUrl) || 
                        imageUrl.startsWith('http://localhost') ||
                        imageUrl.startsWith('http://127.0.0.1');

      if (isLocalUrl) {
        try {
          const urlPath = new URL(imageUrl).pathname;
          const pathParts = urlPath.split('/').filter(p => p);
          fileName = pathParts[pathParts.length - 1];
          const typeStr = pathParts[pathParts.length - 2];
          if (['logos', 'seals', 'signatures', 'photos'].includes(typeStr)) {
            fileType = typeStr as 'logos' | 'seals' | 'signatures' | 'photos';
          }
        } catch (urlError) {
          console.warn(`Error parsing URL ${imageUrl}:`, urlError);
        }
      } else if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
        const cleanPath = imageUrl.startsWith('/uploads/') ? imageUrl.substring(1) : imageUrl;
        const pathParts = cleanPath.split('/').filter(p => p);
        fileName = pathParts[pathParts.length - 1];
        const typeStr = pathParts[pathParts.length - 2];
        if (['logos', 'seals', 'signatures', 'photos'].includes(typeStr)) {
          fileType = typeStr as 'logos' | 'seals' | 'signatures' | 'photos';
        }
      }

      // Try to load from the upload directory using the same structure as file-upload.service
      if (fileName && fileType) {
        // Get the upload directory path (same logic as file-upload.service)
        const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
        const localPath = path.join(uploadDir, fileType, fileName);
        
        if (fs.existsSync(localPath)) {
          console.log(`✅ Loading local image: ${localPath}`);
          return fs.readFileSync(localPath);
        }
        
        // Try alternative paths
        const altPaths = [
          path.join(process.cwd(), 'public', 'uploads', fileType, fileName),
          path.join(process.cwd(), 'uploads', fileType, fileName),
        ];
        
        for (const altPath of altPaths) {
          if (fs.existsSync(altPath)) {
            console.log(`✅ Loading local image (alt): ${altPath}`);
            return fs.readFileSync(altPath);
          }
        }
        
        console.warn(`⚠️ Image not found: ${fileName} in ${fileType}. Tried: ${localPath}`);
      }

      // Check if it's an absolute local path
      if (!imageUrl.startsWith('http')) {
        const localPath = path.resolve(imageUrl);
        if (fs.existsSync(localPath)) {
          console.log(`✅ Loading local image: ${localPath}`);
          return fs.readFileSync(localPath);
        }
      }

      // If it's a remote URL, download it (only as last resort)
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        console.log(`🌐 Attempting to download remote image: ${imageUrl}`);
        try {
          return await this.downloadImage(imageUrl);
        } catch (downloadError) {
          console.warn(`❌ Failed to download image: ${downloadError}`);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.warn(`❌ Could not load image from ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Download image from URL as Buffer
   */
  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      client
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download image: ${response.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        })
        .on('error', reject);
    });
  }

/**
   * Build the certificate content - Traditional Academic Style (Cambridge Model)
   */
private buildCertificateContent(
  doc: PDFKit.PDFDocument,
  certificate: any,
  qrCodeBuffer: Buffer | null,
  program?: any,
  moduleGrades?: any[],
  logoBuffer?: Buffer | null,
  sealBuffer?: Buffer | null,
  signatureBuffer?: Buffer | null,
): void {
  const { student, university, degreeTitle, graduationDate, degreeClassification } = certificate;
  
  const pageWidth = doc.page.width;
  const centerX = pageWidth / 2;

  // --- 1. LOGO INSTITUTIONNEL (Haut centré) ---
  if (logoBuffer) {
    const logoWidth = 70;
    doc.image(logoBuffer, centerX - logoWidth / 2, 50, { width: logoWidth });
  }

  // --- 2. NOM DE L'UNIVERSITÉ ---
  doc.moveDown(8);
  doc.fillColor('#1a1a1a')
     .font('Times-Roman') // Police classique Serif
     .fontSize(18)
     .text(university?.name?.toUpperCase() || 'UNIVERSITY NAME', { align: 'center', characterSpacing: 1.5 });

  doc.moveDown(4);

  // --- 3. TEXTE D'INTRODUCTION ---
  doc.fontSize(14)
     .font('Times-Italic')
     .text('I hereby certify that', { align: 'center' });

  doc.moveDown(1.5);

  // --- 4. NOM DE L'ÉTUDIANT (En majuscules, très sobre) ---
  doc.fontSize(22)
     .font('Times-Roman')
     .fillColor('#000')
     .text(`${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`, { align: 'center', characterSpacing: 1 });

  doc.moveDown(1.5);

  // --- TEXTE D'INTRODUCTION ---
  doc.fontSize(14)
     .font('Times-Italic')
      .text(`In the ${university?.name || 'UNIVERSITY NAME'} on the ${new Date(graduationDate).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })}`, { align: 'center' });

  doc.moveDown(1.5);

  // --- 5. DÉTAILS DU CURSUS ---
  doc.fontSize(12)
     .font('Times-Italic')
     .fillColor('#1a1a1a')
     .text('admitted to the degree of', { align: 'center' });

  doc.moveDown(0.8);

  // TITRE DU DIPLÔME
  doc.fontSize(18)
     .font('Times-Bold')
     .text((program?.title || degreeTitle || '').toUpperCase(), { align: 'center' });

  // CLASSIFICATION (Optionnel, intégré sobrement)
  if (degreeClassification) {
      doc.moveDown(0.5);
      doc.fontSize(12).font('Times-Italic').text(`with the classification of ${degreeClassification}`, { align: 'center' });
  }

  doc.moveDown(2);


  // --- 7. SIGNATURES & SCEAU (Bas du document) ---
  const footerY = 680;

  // Seal at the left side of the page
  if (sealBuffer) {
      doc.image(sealBuffer, 100, footerY - 90, { width: 120 });
  }
  // Signature 1 (Administrative Seal)
  const sigWidth = 150;
  doc.moveTo(100, footerY).lineTo(100 + sigWidth, footerY).lineWidth(0.5).stroke();
  doc.fontSize(10).font('Times-Italic').text('Administrative Seal', 100, footerY + 5, { width: sigWidth, align: 'center' });


  // Signature 2 (Registrar / Witness)
  if (signatureBuffer) {
      doc.image(signatureBuffer, pageWidth - 100 - sigWidth + 35, footerY - 70, { width: 80 });
  }
  doc.text(`${university?.registrarName}`, pageWidth - 100 - sigWidth, footerY-10, { width: sigWidth, align: 'center' });
  doc.moveTo(pageWidth - 100 - sigWidth, footerY).lineTo(pageWidth - 100, footerY).stroke();
  doc.fontSize(10).font('Times-Italic').text('Registrary of the University', pageWidth - 100 - sigWidth, footerY + 5, { width: sigWidth, align: 'center' });

  // --- 8. SÉCURITÉ (QR Code discret en bas à gauche) ---
  if (qrCodeBuffer) {
      doc.image(qrCodeBuffer, 40, 740, { width: 45 });
      // doc.fontSize(7).font('Helvetica').fillColor('#999').text('Verify authenticity', 40, 800);
  }
}

  /**
   * Generate a PDF transcript for a certificate's student
   * @param certificateId - The ID of the certificate
   * @returns Buffer containing the transcript PDF
   */
  async generateTranscriptPdf(certificateId: string): Promise<Buffer> {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        student: true,
        university: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
            registrarName: true,
            signatureUrl: true,
          },
        },
        program: { select: { id: true, title: true, level: true, totalCreditsRequired: true } },
      },
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    const grades = await prisma.grade.findMany({
      where: {
        studentId: certificate.studentId,
        module: { programId: certificate.programId },
      },
      include: {
        module: { select: { code: true, name: true, credits: true } },
      },
      orderBy: { module: { code: 'asc' } },
    });

    let logoBuffer: Buffer | null = null;
    let signatureBuffer: Buffer | null = null;
    if (certificate.university?.logoUrl) {
      logoBuffer = await this.loadImageBuffer(certificate.university.logoUrl);
    }
    if (certificate.university?.signatureUrl) {
      signatureBuffer = await this.loadImageBuffer(certificate.university.signatureUrl);
    }

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 40 });
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.buildTranscriptContent(doc, certificate, grades, logoBuffer, signatureBuffer);
      doc.end();
    });
  }

  /**
   * Build transcript PDF content — Cambridge-style layout with official stamp (cachet)
   */
  private buildTranscriptContent(
    doc: PDFKit.PDFDocument,
    certificate: any,
    grades: Array<{ mark: any; date: Date; module: { code: string; name: string; credits: number } }>,
    logoBuffer: Buffer | null,
    signatureBuffer: Buffer | null,
  ): void {
    const { student, university, program, graduationDate, finalMark, degreeClassification } = certificate;
    const pageWidth = doc.page.width - 80;
    const marginLeft = 40;
    const issuedDate = new Date();

    // —— Header: institution name left, logo top right (Cambridge style) ——
    const logoWidth = 56;
    const logoX = doc.page.width - marginLeft - logoWidth;
    if (logoBuffer) {
      doc.image(logoBuffer, logoX, 36, { width: logoWidth });
    }
    doc.font('Times-Roman').fontSize(20).fillColor('#1a1a1a');
    const uniName = (university?.name || 'UNIVERSITY').toUpperCase();
    const firstLine = uniName.includes(',') ? uniName.split(',')[0].trim() : uniName;
    const secondLine = uniName.includes(',') ? uniName.split(',').slice(1).join(',').trim() : '';
    doc.text(firstLine, marginLeft, 42, { width: logoX - marginLeft - 10 });
    if (secondLine) {
      doc.fontSize(11).fillColor('#555').text(secondLine.toUpperCase(), marginLeft, 62, { width: logoX - marginLeft - 10 });
    }
    doc.moveDown(secondLine ? 3 : 4);

    // —— Title: Official Student Transcript ——
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#000')
      .text('Official Student Transcript', marginLeft, doc.y);
    doc.moveDown(1);
    doc.font('Times-Roman').fontSize(10).fillColor('#444')
      .text(
        'This document is an official academic transcript. It lists all modules and grades for the above institution.',
        marginLeft,
        doc.y,
        { width: pageWidth, align: 'left' },
      );
    doc.moveDown(2);

    // —— Student details block (table-like, Cambridge style) ——
    const gradDateStr = new Date(graduationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const issuedStr = issuedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const dobStr = student.dateOfBirth
      ? new Date(student.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';
    const studentRows = [
      { label: 'Surname', value: student.lastName || '—' },
      { label: 'Given Names', value: student.firstName || '—' },
      { label: 'Student Number', value: student.studentId || '—' },
      { label: 'Date of Birth', value: dobStr },
      { label: 'Programme', value: program?.title || '—' },
      { label: 'Graduation Date', value: gradDateStr },
      { label: 'Issued', value: issuedStr },
      // { label: 'Page', value: '1 of 1' },
    ];
    const labelW = 140;
    const valueX = marginLeft + labelW + 8;
    let y = doc.y;
    doc.font('Times-Roman').fontSize(10).fillColor('#333');
    for (const row of studentRows) {
      doc.font('Times-Bold').fillColor('#333').text(row.label + ':', marginLeft, y, { width: labelW });
      doc.font('Times-Roman').text(row.value, valueX, y, { width: pageWidth - labelW - 20 });
      y += 18;
    }
    doc.y = y + 16;

    // —— Section title: Academic Record ——
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1a1a1a');
    doc.text('Academic Record', marginLeft, doc.y);
    doc.moveDown(1);

    // —— Academic record table: with title row and full borders ——
    const colDate = marginLeft;
    const colCode = marginLeft + 68;
    const colSubject = marginLeft + 128;
    const colCredits = marginLeft + 318;
    const colMark = marginLeft + 368;
    const colGrade = marginLeft + 418;
    const colW = { date: colCode - colDate, code: colSubject - colCode, subject: colCredits - colSubject, credits: colMark - colCredits, mark: colGrade - colMark, grade: marginLeft + pageWidth - colGrade };
    const rowH = 24;
    const pad = 6;
    y = doc.y;

    // Header row: light grey background, dark text (guaranteed visible)
    doc.rect(marginLeft, y, pageWidth, rowH).fillAndStroke('#cbd5e1', '#475569');
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
    doc.text('Date', colDate + pad, y + pad, { width: colW.date - pad });
    doc.text('Code', colCode + pad, y + pad, { width: colW.code - pad });
    doc.text('Subject', colSubject + pad, y + pad, { width: colW.subject - pad });
    doc.text('Credits', colCredits + pad, y + pad, { width: colW.credits - pad });
    doc.text('Mark (%)', colMark + pad, y + pad, { width: colW.mark - pad });
    doc.text('Grade', colGrade + pad, y + pad, { width: colW.grade - pad });
    y += rowH;

    doc.font('Times-Roman').fontSize(10).fillColor('#1f2937');
    for (let i = 0; i < grades.length; i++) {
      if (y > 670) {
        doc.addPage();
        y = 40;
        doc.rect(marginLeft, y, pageWidth, rowH).fillAndStroke('#cbd5e1', '#475569');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
        doc.text('Date', colDate + pad, y + pad, { width: colW.date - pad });
        doc.text('Code', colCode + pad, y + pad, { width: colW.code - pad });
        doc.text('Subject', colSubject + pad, y + pad, { width: colW.subject - pad });
        doc.text('Credits', colCredits + pad, y + pad, { width: colW.credits - pad });
        doc.text('Mark (%)', colMark + pad, y + pad, { width: colW.mark - pad });
        doc.text('Grade', colGrade + pad, y + pad, { width: colW.grade - pad });
        y += rowH;
        doc.font('Times-Roman').fontSize(10).fillColor('#1f2937');
      }
      const g = grades[i];
      const markStr = typeof g.mark === 'object' && g.mark !== null ? String((g.mark as any).toString()) : String(g.mark);
      const dateStr = new Date(g.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(marginLeft, y, pageWidth, rowH).fillAndStroke(rowBg, '#e2e8f0');
      doc.rect(colCode, y, 1, rowH).fillAndStroke('#e2e8f0', '#e2e8f0');
      doc.rect(colSubject, y, 1, rowH).fillAndStroke('#e2e8f0', '#e2e8f0');
      doc.rect(colCredits, y, 1, rowH).fillAndStroke('#e2e8f0', '#e2e8f0');
      doc.rect(colMark, y, 1, rowH).fillAndStroke('#e2e8f0', '#e2e8f0');
      doc.rect(colGrade, y, 1, rowH).fillAndStroke('#e2e8f0', '#e2e8f0');
      doc.fillColor('#1f2937');
      doc.text(dateStr, colDate + pad, y + pad, { width: colW.date - pad });
      doc.text(g.module.code || '—', colCode + pad, y + pad, { width: colW.code - pad });
      doc.text(g.module.name || '—', colSubject + pad, y + pad, { width: colW.subject - pad * 2 });
      doc.text(String(g.module.credits ?? '—'), colCredits + pad, y + pad, { width: colW.credits - pad });
      doc.text(markStr, colMark + pad, y + pad, { width: colW.mark - pad });
      doc.text(markStr, colGrade + pad, y + pad, { width: colW.grade - pad });
      y += rowH;
    }
    doc.rect(marginLeft, y, pageWidth, 0).stroke('#1f2937');

    doc.y = y + 16;

    // —— Final mark and classification ——
    if (finalMark != null || degreeClassification) {
      doc.font('Times-Bold').fontSize(11).fillColor('#1a1a1a');
      if (finalMark != null) {
        const fm = typeof finalMark === 'object' && finalMark !== null ? String((finalMark as any).toString()) : String(finalMark);
        doc.text(`Final mark: ${fm}`, marginLeft, doc.y);
        doc.moveDown(0.6);
      }
      if (degreeClassification) {
        doc.text(`Classification: ${degreeClassification}`, marginLeft, doc.y);
        doc.moveDown(1);
      }
    }

    doc.moveDown(1.2);

    // —— Certification statement ——
    doc.font('Times-Roman').fontSize(10).fillColor('#333');
    doc.text(
      'I confirm that this is a certified copy of the academic record for the above named student.',
      marginLeft,
      doc.y,
      { width: pageWidth },
    );
    doc.moveDown(1.8);

    // —— Signature (left) and Cachet / Stamp (right) ——
    const sigY = doc.y;
    const sigLabel = university?.registrarName ? `Signed: ${university.registrarName} (Registrar)` : 'Signed: _________________________ (Registrar)';
    doc.font('Times-Roman').fontSize(10).fillColor('#333').text(sigLabel, marginLeft, sigY);
    if (signatureBuffer) {
      try {
        doc.image(signatureBuffer, marginLeft, sigY + 14, { width: 80, height: 28 });
      } catch {
        doc.text('_________________________', marginLeft, sigY + 16);
      }
    } else {
      doc.text('_________________________', marginLeft, sigY + 16);
    }
    doc.font('Times-Roman').fontSize(10).fillColor('#333');
    doc.text(`Date: ${issuedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, marginLeft, sigY + 50);

    // —— Cachet (red stamp): institution, location, date, CERTIFIED COPY ——
    const stampW = 160;
    const stampH = 72;
    const stampX = doc.page.width - marginLeft - stampW;
    const stampY = sigY - 4;
    doc.rect(stampX, stampY, stampW, stampH).fillAndStroke('#fef2f2', '#b91c1c');
    doc.fillColor('#b91c1c').font('Helvetica-Bold').fontSize(9);
    const stampUni = (university?.name || 'Institution').length > 28 ? (university?.name || 'Institution').slice(0, 26) + '…' : (university?.name || 'Institution');
    doc.text(stampUni.toUpperCase(), stampX + 6, stampY + 8, { width: stampW - 12, align: 'center' });
    const addressLine = (university?.address || '—').split(/[\n,]/)[0].trim();
    doc.font('Helvetica').fontSize(8).text(addressLine.slice(0, 40), stampX + 6, stampY + 24, { width: stampW - 12, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(12).text(
      issuedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
      stampX + 6,
      stampY + 40,
      { width: stampW - 12, align: 'center' },
    );
    doc.fontSize(10).text('CERTIFIED COPY', stampX + 6, stampY + 58, { width: stampW - 12, align: 'center' });
    doc.fillColor('#000');
  }

  /**
   * Get certificate data with grades for display
   */
  async getCertificateWithGrades(certificateId: string) {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          student: true,
          university: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              address: true,
              contactEmail: true,
            },
          },
          program: {
            select: {
              id: true,
              title: true,
              level: true,
              totalCreditsRequired: true,
            },
          },
          verifications: {
            select: {
              id: true,
              companyName: true,
              verificationDate: true,
            },
            orderBy: {
              verificationDate: 'desc',
            },
          },
        },
      });

      if (!certificate) {
        return null;
      }

      // Fetch grades for this student
      const grades = await prisma.grade.findMany({
        where: {
          studentId: certificate.studentId,
        },
        include: {
          module: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
            },
          },
        },
        orderBy: {
          module: {
            code: 'asc',
          },
        },
      });

      return {
        ...certificate,
        grades,
      };
    } catch (error) {
      console.error('Error fetching certificate with grades:', error);
      throw error;
    }
  }
}

export default new CertificateService();
