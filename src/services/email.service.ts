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
              .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .warning { color: #dc2626; font-weight: bold; }
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
                
                <div style="text-align: center;">
                  <a href="${env.baseUrl}/login" class="button">Login</a>
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

