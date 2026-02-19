import nodemailer from 'nodemailer';
import { env } from '../config/env';

/**
 * Email service
 * Uses Nodemailer to send transactional emails
 */
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Optimized configuration for Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Uses predefined Gmail configuration
      auth: {
        user: env.smtpUser,
        pass: env.smtpPassword,
      },
      // Additional options for stability
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Verifies SMTP server connection
   * @returns True if connection is valid
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Valid SMTP configuration');
      return true;
    } catch (error) {
      console.error('❌ SMTP configuration error:', error);
      return false;
    }
  }

  /**
   * Sends a welcome email with temporary password
   * @param to - Recipient email address
   * @param temporaryPassword - Temporary password
   * @param role - User role (ADMIN, UNIVERSITY, STUDENT)
   */
  async sendWelcomeEmail(
    to: string,
    temporaryPassword: string,
    role: string
  ): Promise<void> {
    const roleNames: { [key: string]: string } = {
      ADMIN: 'Administrator',
      UNIVERSITY: 'University',
      STUDENT: 'Student',
    };

    // Create login URL
    const loginUrl = `${env.baseUrl}/login`;

    const mailOptions = {
      from: env.smtpFrom,
      to,
      subject: 'Welcome to DiplomaVerif - Your credentials',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9fafb; }
              .credentials { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .password { font-size: 24px; font-weight: bold; color: #e11d48; text-align: center; padding: 10px; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .button-container { text-align: center; margin: 30px 0; }
              .button { display: inline-block; padding: 14px 32px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 16px; border: none; }
              .button:hover { background-color: #4338ca; }
              .warning { color: #dc2626; font-weight: bold; }
              .link-fallback { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              .link-text { word-break: break-all; color: #4f46e5; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 DiplomaVerif</h1>
                <p>Diploma Verification Platform</p>
              </div>
              <div class="content">
                <h2>Welcome!</h2>
                <p>Your ${roleNames[role]} account has been successfully created on the DiplomaVerif platform.</p>
                
                <div class="credentials">
                  <p><strong>Email address:</strong> ${to}</p>
                  <p class="warning">⚠️ Temporary password:</p>
                  <div class="password">${temporaryPassword}</div>
                </div>
                
                <p class="warning">🔒 For your security, please change this password on your first login.</p>
                
                <div class="button-container">
                  <a href="${loginUrl}" class="button" style="display: inline-block; padding: 14px 32px; background-color: #6f64e7ff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 16px;">
                    Login to DiplomaVerif
                  </a>
                </div>

                <div class="link-fallback">
                  <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                  <p class="link-text"><a href="${loginUrl}" style="color: #4f46e5; text-decoration: none;">${loginUrl}</a></p>
                </div>
                
                <p>If you have any questions, please don't hesitate to contact us.</p>
              </div>
              <div class="footer">
                <p>DiplomaVerif © ${new Date().getFullYear()}</p>
                <p>This email is automated, please do not reply to it.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await this.sendEmail(mailOptions);
  }

  /**
   * Sends a certificate verification notification email
   * @param to - Recipient email address
   * @param studentName - Student name
   * @param companyName - Company name verifying
   * @param date - Verification date
   */
  async sendVerificationNotification(
    to: string,
    studentName: string,
    companyName: string,
    date: Date
  ): Promise<void> {
    const mailOptions = {
      from: env.smtpFrom,
      to,
      subject: 'Notification - Your diploma has been verified',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9fafb; }
              .info-box { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔍 Diploma Verification</h1>
              </div>
              <div class="content">
                <h2>Verification Notification</h2>
                <p>Dear ${studentName},</p>
                
                <div class="info-box">
                  <p><strong>Verifying company:</strong> ${companyName}</p>
                  <p><strong>Date:</strong> ${date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p><strong>Time:</strong> ${date.toLocaleTimeString('en-US')}</p>
                </div>
                
                <p>Your diploma has been successfully verified. This verification has been recorded in our system for reference.</p>
                
                <p>If you did not authorize this verification, please contact us immediately.</p>
              </div>
              <div class="footer">
                <p>DiplomaVerif © ${new Date().getFullYear()}</p>
                <p>This email is automated, please do not reply to it.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await this.sendEmail(mailOptions);
  }

  /**
   * Sends a certificate issuance notification email to the student
   * @param certificate - Certificate data with all related information
   * @param options - Optional PDF attachment
   */
  async sendCertificateIssuanceEmail(
    certificate: any,
    options?: { pdfBuffer?: Buffer; pdfFilename?: string },
  ): Promise<void> {
    try {
      const student = certificate.student;
      const university = certificate.university;
      const program = certificate.program;
      const grades = certificate.grades || [];

      if (!student?.email) {
        console.warn('⚠️ Certificate issuance email skipped: student email missing');
        return;
      }

      // Format graduation date
      const graduationDate = new Date(certificate.graduationDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      // Format final mark and classification
      const finalMark = certificate.finalMark
        ? Number(certificate.finalMark).toFixed(2)
        : 'Not yet calculated';
      const classification = certificate.degreeClassification || 'Pending';

      // Build grades table HTML
      let gradesTableHtml = '';
      if (grades.length > 0) {
        gradesTableHtml = `
          <h3 style="color: #1e40af; margin-top: 30px;">📚 Module Grades</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #4f46e5; color: white;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #4338ca;">Module Code</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #4338ca;">Module Name</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #4338ca;">Credits</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #4338ca;">Mark</th>
              </tr>
            </thead>
            <tbody>
              ${grades
                .map(
                  (grade: any, index: number) => `
                <tr style="border-bottom: 1px solid #e5e7eb; ${index % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
                  <td style="padding: 12px; font-weight: 600; color: #1e40af;">${grade.module?.code || 'N/A'}</td>
                  <td style="padding: 12px;">${grade.module?.name || 'N/A'}</td>
                  <td style="padding: 12px; text-align: center;">${grade.module?.credits || 0}</td>
                  <td style="padding: 12px; text-align: center; font-weight: bold; color: #059669;">${Number(grade.mark).toFixed(2)}/100</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        `;
      } else {
        gradesTableHtml = `
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #92400e;">📝 Note: Grades are not yet available for this certificate.</p>
          </div>
        `;
      }

      // Build verification URL with QR hash
      const verificationUrl = `${env.baseUrl}/verify/${certificate.qrHash}`;

      const mailOptions = {
        from: env.smtpFrom,
        to: student.email,
        subject: `🎓 Your Certificate Has Been Issued - ${university.name}`,
        attachments:
          options?.pdfBuffer
            ? [
                {
                  filename: options.pdfFilename || 'certificate.pdf',
                  content: options.pdfBuffer,
                  contentType: 'application/pdf',
                },
              ]
            : undefined,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 700px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb; }
                .certificate-box { background-color: white; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
                .info-row:last-child { border-bottom: none; }
                .info-label { font-weight: 600; color: #6b7280; }
                .info-value { color: #1f2937; font-weight: 500; }
                .highlight-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b; }
                .qr-section { background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
                .qr-code { font-family: monospace; background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0; word-break: break-all; color: #1e40af; font-weight: 600; }
                .button-container { text-align: center; margin: 30px 0; }
                .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3); }
                .button:hover { background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%); }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
                .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .badge-success { background-color: #d1fae5; color: #065f46; }
                .badge-pending { background-color: #fef3c7; color: #92400e; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 32px;">🎓 Certificate Issued</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Congratulations on your achievement!</p>
                </div>
                <div class="content">
                  <h2 style="color: #1e40af; margin-top: 0;">Dear ${student.firstName} ${student.lastName},</h2>
                  
                  <p>We are pleased to inform you that your certificate has been successfully issued by <strong>${university.name}</strong>.</p>

                  <div class="certificate-box">
                    <h3 style="color: #4f46e5; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Certificate Details</h3>
                    
                    <div class="info-row">
                      <span class="info-label">Student Name:</span>
                      <span class="info-value">${student.firstName} ${student.lastName}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Student ID:</span>
                      <span class="info-value">${student.studentId || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">University:</span>
                      <span class="info-value">${university.name}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Program:</span>
                      <span class="info-value">${program?.title || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Level:</span>
                      <span class="info-value">${program?.level || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Graduation Date:</span>
                      <span class="info-value">${graduationDate}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Status:</span>
                      <span class="info-value">
                        <span class="badge badge-success">${certificate.status}</span>
                      </span>
                    </div>
                  </div>

                  <div class="highlight-box">
                    <h3 style="margin-top: 0; color: #92400e;">📊 Academic Performance</h3>
                    <div class="info-row">
                      <span class="info-label">Final Weighted Average:</span>
                      <span class="info-value" style="font-size: 18px; color: #059669; font-weight: bold;">${finalMark}%</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Degree Classification:</span>
                      <span class="info-value">
                        <span class="badge ${certificate.degreeClassification ? 'badge-success' : 'badge-pending'}" style="font-size: 14px; padding: 8px 16px;">
                          ${classification}
                        </span>
                      </span>
                    </div>
                  </div>

                  ${gradesTableHtml}

                  <div class="qr-section">
                    <h3 style="color: #1e40af; margin-top: 0;">🔐 Certificate Verification</h3>
                    <p>Your certificate has a unique QR code for verification. Share this verification link with employers or institutions:</p>
                    <div class="qr-code">${verificationUrl}</div>
                    <div class="button-container">
                      <a href="${verificationUrl}" class="button">Verify Certificate Online</a>
                    </div>
                    <p style="font-size: 12px; color: #6b7280; margin-top: 15px;">
                      You can also download your certificate as a PDF from your student dashboard.
                    </p>
                  </div>

                  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 5px;">
                    <p style="margin: 0; color: #1e40af;">
                      <strong>📧 Important:</strong> Please keep this email for your records. 
                      Your certificate is now available in your student account.
                    </p>
                  </div>
                </div>
                <div class="footer">
                  <p><strong>DiplomaVerif</strong> © ${new Date().getFullYear()}</p>
                  <p>This is an automated email. Please do not reply to this message.</p>
                  <p style="margin-top: 10px;">
                    If you have any questions, please contact ${university.name} at 
                    <a href="mailto:${university.contactEmail}" style="color: #4f46e5;">${university.contactEmail}</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      await this.sendEmail(mailOptions);
    } catch (error) {
      console.error('❌ Error sending certificate issuance email:', error);
      // Do not fail the operation if email fails
    }
  }

  /**
   * Generic method to send an email
   * @param mailOptions - Email options
   */
  private async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${mailOptions.to}:`, info.messageId);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      // Do not fail the operation if email fails
    }
  }
}

export default new EmailService();

