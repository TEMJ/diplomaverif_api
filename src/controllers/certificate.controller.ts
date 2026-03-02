import { Request, Response } from 'express';
import prisma from '../config/database';
import qrCodeService from '../services/qrcode.service';
import certificateService from '../services/certificate.service';
import academicService from '../services/academic.service';
import emailService from '../services/email.service';

/**
 * Controller for managing certificates/diplomas
 * Handles CRUD operations on certificates
 */
class CertificateController {
  /**
   * Retrieve all certificates
   * GET /api/certificates
   */

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, universityId, status, sortBy, sortOrder } = req.query;

      const where: any = {};
      
      // If user is a STUDENT, only show their own certificates
      if (req.user?.role === 'STUDENT' && req.user?.studentId) {
        where.studentId = req.user.studentId;
      } else if (req.user?.role === 'UNIVERSITY' && req.user?.universityId) {
        // UNIVERSITY can only see certificates from their own university
        where.universityId = req.user.universityId;
        if (studentId) where.studentId = studentId as string;
      } else {
        // ADMIN: apply filters if provided
        if (studentId) where.studentId = studentId as string;
        if (universityId) where.universityId = universityId as string;
      }
      
      if (status) where.status = status as string;

      // Validation des paramètres de tri
      const validSortFields = ['createdAt', 'degreeTitle', 'specialization', 'graduationDate', 'status'];
      const validSortOrders = ['asc', 'desc'];
      
      const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
      const order = validSortOrders.includes(sortOrder as string) ? sortOrder as string : 'desc';

      const certificates = await prisma.certificate.findMany({
        where,
        orderBy: { [sortField]: order },
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              email: true,
              photoUrl: true,
              enrollmentDate: true,
            },
          },
          university: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          program: {
            select: {
              id: true,
              title: true,
              level: true,
            },
          },
          _count: {
            select: {
              verifications: true,
            },
          },
        },
      });

      // Fetch grades for each certificate's student
      const certificatesWithGrades = await Promise.all(
        certificates.map(async (certificate) => {
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
        }),
      );

      res.status(200).json({
        success: true,
        count: certificatesWithGrades.length,
        data: certificatesWithGrades,
      });
    } catch (error) {
      console.error('Error retrieving certificates:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving certificates',
      });
    }
  }
  /**
   * Retrieve a certificate by ID
   * GET /api/certificates/:id
   * Now includes student grades and subjects
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Use certificate service to get full data with grades
      const certificate = await certificateService.getCertificateWithGrades(id);

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      console.error('Error retrieving certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving certificate',
      });
    }
  }

  /**
   * Create a new certificate
   * POST /api/certificates
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      let {
        studentId,
        universityId,
        programId,
        graduationDate,
        finalMark,
        degreeClassification,
        marks,
      } = req.body;

      // UNIVERSITY users must use their own university; ADMIN can use any
      if (user.role === 'UNIVERSITY') {
        if (!user.universityId) {
          res.status(403).json({
            success: false,
            message: 'Your account is not linked to a university. Please contact support.',
          });
          return;
        }
        universityId = user.universityId;
      }

      // Validate data (sans qrCodeUrl)
      if (!studentId || !universityId || !programId || !graduationDate) {
        res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
        return;
      }

      // Si le front envoie des notes (marks), on les enregistre d'abord en table Grade
      // NB: le champ `credits` appartient au Module dans ce projet; on l'ignore ici.
      if (Array.isArray(marks) && marks.length > 0) {
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) {
          res.status(404).json({ success: false, message: 'Student not found' });
          return;
        }

        await prisma.$transaction(async (tx) => {
          for (const entry of marks) {
            const moduleId = entry?.moduleId;
            const markValue = entry?.mark;

            if (!moduleId || markValue === undefined || markValue === null) {
              continue;
            }

            const parsedMark = typeof markValue === 'number' ? markValue : parseFloat(markValue);
            if (!academicService.validateGradeMark(parsedMark)) {
              throw new Error('Invalid mark value (must be 0-100)');
            }

            const module = await tx.module.findUnique({ where: { id: moduleId } });
            if (!module) {
              throw new Error('Module not found');
            }

            // Vérifie la cohérence programme (optionnel mais recommandé)
            if (student.programId && module.programId && student.programId !== module.programId) {
              throw new Error("L'élève et la matière doivent appartenir au même programme.");
            }

            await tx.grade.upsert({
              where: {
                studentId_moduleId: {
                  studentId,
                  moduleId,
                },
              },
              update: {
                mark: parsedMark,
                date: new Date(),
              },
              create: {
                studentId,
                moduleId,
                mark: parsedMark,
              },
            });
          }
        });
      }

      // Générer le hash QR (le champ qrCodeUrl n'est plus utilisé)
      const { qrHash } = await qrCodeService.generateQRCodeWithHash();

      // Créer le certificat sans qrCodeUrl
      const certificate = await prisma.certificate.create({
        data: {
          studentId,
          universityId,
          programId,
          graduationDate: new Date(graduationDate),
          qrHash,
          status: 'ACTIVE',
          // Si le front les envoie, on peut les persister (sinon recalcul via grades)
          finalMark: finalMark ?? undefined,
          degreeClassification: degreeClassification ?? undefined,
        },
        include: {
          student: true,
          university: true,
          program: true,
        },
      });

      // Calcul et mise à jour de finalMark et degreeClassification
      let updatedCertificate = certificate;
      try {
        // Si on a des notes en table Grade (via `marks` ou saisie séparée), on recalcule.
        // Le service retourne null si aucune note n'est trouvée.
        const result = await academicService.updateCertificateWithClassification(certificate.id);

        if (result) {
          // Si le calcul a réussi, récupérer le certificat complet avec toutes les relations
          const refreshed = await prisma.certificate.findUnique({
            where: { id: certificate.id },
            include: {
              student: true,
              university: true,
              program: true,
            },
          });

          if (refreshed) updatedCertificate = refreshed;
        } else {
          // Aucune note trouvée pour cet étudiant - c'est normal si le diplôme est créé avant les notes
          console.info(
            `Certificat créé sans classification: aucune note trouvée pour l'étudiant ${certificate.studentId}. ` +
            `Les champs finalMark et degreeClassification resteront NULL jusqu'à ce que des notes soient ajoutées.`,
          );
        }
      } catch (err) {
        // On logue mais on ne bloque pas la création du certificat si le calcul échoue
        console.error('Erreur lors du calcul de la classification:', err);
      }

      // Récupérer les grades pour l'email (si disponibles)
      const grades = await prisma.grade.findMany({
        where: { studentId: certificate.studentId },
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

      // Envoyer l'email de notification à l'étudiant (en arrière-plan, ne bloque pas la réponse)
      const certificateWithGrades = {
        ...updatedCertificate,
        grades,
      };

      (async () => {
        try {
          // Generate PDF and attach it to the issuance email (best-effort)
          const pdfBuffer = await certificateService.generateCertificatePdf(updatedCertificate.id);
          const safeFirstName = (updatedCertificate.student?.firstName || 'STUDENT').replace(/\s+/g, '_');
          const safeLastName = (updatedCertificate.student?.lastName || 'NAME').replace(/\s+/g, '_');
          const filename = `CERTIFICATE_${safeFirstName}_${safeLastName}.pdf`;

          await emailService.sendCertificateIssuanceEmail(certificateWithGrades, {
            pdfBuffer,
            pdfFilename: filename,
          });
        } catch (err) {
          console.error("Erreur lors de l'envoi du PDF par email (fallback sans PDF):", err);
          // Fallback: send email without PDF attachment
          await emailService.sendCertificateIssuanceEmail(certificateWithGrades);
        }
      })().catch((err) => {
        console.error("Erreur lors de l'envoi de l'email de certificat:", err);
        // On ne bloque pas la création même si l'email échoue
      });

      res.status(201).json({
        success: true,
        message: 'Certificate created successfully',
        data: updatedCertificate,
      });
    } catch (error) {
      console.error('Error creating certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating certificate',
      });
    }
  }

  /**
   * Update a certificate
   * PUT /api/certificates/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { degreeTitle, specialization, graduationDate, pdfUrl, status } = req.body;

      // Check if certificate exists
      const existingCertificate = await prisma.certificate.findUnique({
        where: { id },
      });

      if (!existingCertificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      // Update certificate
      const certificate = await prisma.certificate.update({
        where: { id },
        data: {
          graduationDate: graduationDate ? new Date(graduationDate) : undefined,
          status,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Certificate updated successfully',
        data: certificate,
      });
    } catch (error) {
      console.error('Error updating certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating certificate',
      });
    }
  }

  /**
   * Delete a certificate
   * DELETE /api/certificates/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if certificate exists
      const existingCertificate = await prisma.certificate.findUnique({
        where: { id },
      });

      if (!existingCertificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      // Delete certificate (cascade will delete associated verifications)
      await prisma.certificate.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Certificate deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting certificate',
      });
    }
  }

  /**
   * Verify a certificate by QR hash
   * GET /api/certificates/verify/:qrHash
   */
  async verifyByHash(req: Request, res: Response): Promise<void> {
    try {
      const { qrHash } = req.params;

      const certificate = await prisma.certificate.findUnique({
        where: { qrHash },
        include: {
          student: {
            include: {
              university: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
          university: true,
        },
      });

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found or invalid hash',
        });
        return;
      }

      // Record verification
      const verification = await prisma.verification.create({
        data: {
          certificateId: certificate.id,
          companyName: 'Public verification',
          email: req.body.email || 'anonymous@example.com',
          reason: req.body.reason || 'Diploma verification',
          ipAddress: req.ip || 'unknown',
        },
      });

      res.status(200).json({
        success: true,
        message: certificate.status === 'ACTIVE' ? 'Certificate valid' : 'Certificate revoked',
        data: {
          certificate: {
            id: certificate.id,
            graduationDate: certificate.graduationDate,
            status: certificate.status,
            student: certificate.student,
            university: certificate.university,
          },
          verification: {
            id: verification.id,
            verificationDate: verification.verificationDate,
          },
        },
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while verifying certificate',
      });
    }
  }

  /**
   * Revoke a certificate
   * PATCH /api/certificates/:id/revoke
   */
  async revoke(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const certificate = await prisma.certificate.findUnique({
        where: { id },
      });

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      const updatedCertificate = await prisma.certificate.update({
        where: { id },
        data: { status: 'REVOKED' },
      });

      res.status(200).json({
        success: true,
        message: 'Certificate revoked successfully',
        data: updatedCertificate,
      });
    } catch (error) {
      console.error('Error revoking certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while revoking certificate',
      });
    }
  }

  /**
   * Download certificate as PDF
   * GET /api/certificates/:id/pdf
   * Downloads a PDF version of the certificate
   */
  async getPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Generate PDF
      const pdfBuffer = await certificateService.generateCertificatePdf(id);

      // Get certificate info for filename
      const certificate = await prisma.certificate.findUnique({
        where: { id },
        include: {
          student: true,
        },
      });

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      // Students can only download their own certificate
      if (req.user?.role === 'STUDENT' && req.user?.studentId !== certificate.studentId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this certificate',
        });
        return;
      }

      // Set response headers
      const filename = `CERTIFICATE_${certificate.student.firstName}_${certificate.student.lastName}_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while generating PDF',
      });
    }
  }

  /**
   * Download transcript (relevé de notes) as PDF
   * GET /api/certificates/:id/transcript
   * Downloads a PDF with all grades for the certificate's student
   */
  async getTranscriptPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const certificate = await prisma.certificate.findUnique({
        where: { id },
        include: { student: true },
      });

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      // Students can only download their own transcript
      if (req.user?.role === 'STUDENT' && req.user?.studentId !== certificate.studentId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this transcript',
        });
        return;
      }

      const pdfBuffer = await certificateService.generateTranscriptPdf(id);

      const safeFirst = (certificate.student.firstName || 'Student').replace(/\s+/g, '_');
      const safeLast = (certificate.student.lastName || 'Name').replace(/\s+/g, '_');
      const filename = `TRANSCRIPT_${safeFirst}_${safeLast}_${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating transcript PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while generating transcript PDF',
      });
    }
  }
}

export default new CertificateController();