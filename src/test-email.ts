import dotenv from 'dotenv';
import emailService from './services/email.service';

// Charger les variables d'environnement
dotenv.config();

async function testEmailSending() {
  console.log('🔍 Variables d\'environnement SMTP:');
  console.log(`HOST: ${process.env.SMTP_HOST}`);
  console.log(`PORT: ${process.env.SMTP_PORT}`);
  console.log(`USER: ${process.env.SMTP_USER}`);
  console.log(`PASSWORD: ${process.env.SMTP_PASSWORD ? '***configuré***' : '***manquant***'}`);
  console.log(`FROM: ${process.env.SMTP_FROM}`);
  
  console.log('\n📧 Test de connexion SMTP...');
  
  try {
    // Test de connexion d'abord
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
      console.log('❌ Échec de la connexion SMTP');
      return;
    }
    
    console.log('✅ Connexion SMTP réussie');
    
    // Test d'un email de bienvenue
    console.log('📧 Envoi d\'email de bienvenue...');
    await emailService.sendWelcomeEmail(
      'temj78@gmail.com',
      'TestPassword123!',
      'STUDENT'
    );
    
    console.log('✅ Email de bienvenue envoyé!');
    
    // Test d'une notification de vérification
    console.log('📧 Envoi d\'email de notification...');
    await emailService.sendVerificationNotification(
      'juniortemgoua406@gmail.com',
      'Jean Dupont',
      'Entreprise Test SA',
      new Date()
    );
    
    console.log('✅ Email de notification envoyé!');
    
  } catch (error) {
    console.error('❌ Erreur:', (error as Error).message);
    
    if ((error as any).code === 'EAUTH') {
      console.log('💡 Problème d\'authentification - vérifiez SMTP_USER et SMTP_PASSWORD');
    } else if ((error as any).code === 'ENOTFOUND') {
      console.log('💡 Problème de résolution DNS - vérifiez SMTP_HOST');
    } else if ((error as any).code === 'ECONNREFUSED') {
      console.log('💡 Connexion refusée - vérifiez SMTP_PORT et firewall');
    }
  }
}

testEmailSending();