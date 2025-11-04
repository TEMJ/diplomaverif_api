import nodemailer from 'nodemailer';
import { env } from '../config/env';

/**
 * Service d'envoi d'emails
 * Utilise Nodemailer pour envoyer des emails transactionnels
 */
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configuration optimisée pour Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Utilise la configuration prédéfinie Gmail
      auth: {
        user: env.smtpUser,
        pass: env.smtpPassword,
      },
      // Options supplémentaires pour la stabilité
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Vérifie la connexion au serveur SMTP
   * @returns True si la connexion est valide
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Configuration SMTP valide');
      return true;
    } catch (error) {
      console.error('❌ Erreur de configuration SMTP:', error);
      return false;
    }
  }

  /**
   * Envoie un email de bienvenue avec mot de passe temporaire
   * @param to - Adresse email du destinataire
   * @param temporaryPassword - Mot de passe temporaire
   * @param role - Rôle de l'utilisateur (ADMIN, UNIVERSITY, STUDENT)
   */
  async sendWelcomeEmail(
    to: string,
    temporaryPassword: string,
    role: string
  ): Promise<void> {
    const roleNames: { [key: string]: string } = {
      ADMIN: 'Administrateur',
      UNIVERSITY: 'Université',
      STUDENT: 'Étudiant',
    };

    const mailOptions = {
      from: env.smtpFrom,
      to,
      subject: 'Bienvenue sur DiplomaVerif - Vos identifiants',
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
                <p>Plateforme de Vérification de Diplômes</p>
              </div>
              <div class="content">
                <h2>Bienvenue!</h2>
                <p>Votre compte ${roleNames[role]} a été créé avec succès sur la plateforme DiplomaVerif.</p>
                
                <div class="credentials">
                  <p><strong>Adresse email:</strong> ${to}</p>
                  <p class="warning">⚠️ Mot de passe temporaire:</p>
                  <div class="password">${temporaryPassword}</div>
                </div>
                
                <p class="warning">🔒 Pour votre sécurité, veuillez changer ce mot de passe lors de votre première connexion.</p>
                
                <div style="text-align: center;">
                  <a href="${env.baseUrl}/login" class="button">Se connecter</a>
                </div>
                
                <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
              </div>
              <div class="footer">
                <p>DiplomaVerif © ${new Date().getFullYear()}</p>
                <p>Cet email est automatique, merci de ne pas y répondre.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await this.sendEmail(mailOptions);
  }

  /**
   * Envoie un email de notification de vérification de certificat
   * @param to - Adresse email du destinataire
   * @param studentName - Nom de l'étudiant
   * @param companyName - Nom de l'entreprise vérificatrice
   * @param date - Date de la vérification
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
      subject: 'Notification - Vérification de votre diplôme',
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
                <h1>🔍 Vérification de Diplôme</h1>
              </div>
              <div class="content">
                <h2>Notification de Vérification</h2>
                <p>Cher/Chère ${studentName},</p>
                
                <div class="info-box">
                  <p><strong>Entreprise vérificatrice:</strong> ${companyName}</p>
                  <p><strong>Date:</strong> ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p><strong>Heure:</strong> ${date.toLocaleTimeString('fr-FR')}</p>
                </div>
                
                <p>Votre diplôme a été vérifié avec succès. Cette vérification est enregistrée dans notre système pour référence.</p>
                
                <p>Si vous n'avez pas autorisé cette vérification, veuillez nous contacter immédiatement.</p>
              </div>
              <div class="footer">
                <p>DiplomaVerif © ${new Date().getFullYear()}</p>
                <p>Cet email est automatique, merci de ne pas y répondre.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await this.sendEmail(mailOptions);
  }

  /**
   * Méthode générique pour envoyer un email
   * @param mailOptions - Les options de l'email
   */
  private async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé à ${mailOptions.to}:`, info.messageId);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      // Ne pas faire échouer l'opération si l'email échoue
    }
  }
}

export default new EmailService();

