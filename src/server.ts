import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import emailService from './services/email.service';

/**
 * Point d'entrée principal du serveur
 * Initialise la connexion à la base de données et démarre le serveur Express
 */
const startServer = async (): Promise<void> => {
  try {
    // Connexion à la base de données
    await connectDatabase();

    // Vérifier la configuration SMTP (en mode développement)
    if (env.nodeEnv === 'development') {
      await emailService.verifyConnection();
    }

    // Démarrer le serveur
    const server = app.listen(env.port, () => {
      console.log('\n🚀 Serveur DiplomaVerif démarré avec succès!');
      console.log(`📡 Port: ${env.port}`);
      console.log(`🌐 Environnement: ${env.nodeEnv}`);
      console.log(`🔗 URL: http://localhost:${env.port}`);
      console.log(`📖 Health check: http://localhost:${env.port}/health\n`);
      console.log('📊 Endpoints disponibles:');
      console.log('   - POST   /api/auth/login');
      console.log('   - GET    /api/auth/me');
      console.log('   - POST   /api/auth/change-password');
      console.log('   - GET    /api/universities');
      console.log('   - POST   /api/universities');
      console.log('   - GET    /api/students');
      console.log('   - POST   /api/students');
      console.log('   - GET    /api/certificates');
      console.log('   - POST   /api/certificates');
      console.log('   - GET    /api/certificates/verify/:qrHash');
      console.log('   - GET    /api/verifications');
      console.log('   - POST   /api/verifications');
      console.log('   - GET    /api/student-records');
      console.log('   - POST   /api/student-records\n');
    });

    // Gestion de l'arrêt gracieux
    const gracefulShutdown = async (): Promise<void> => {
      console.log('\n⚠️  Signal d\'arrêt reçu, fermeture gracieuse...');
      
      server.close(async () => {
        console.log('✅ Serveur HTTP fermé');
        
        // Fermer la connexion à la base de données
        await disconnectDatabase();
        
        console.log('✅ Base de données déconnectée');
        console.log('👋 Au revoir!\n');
        process.exit(0);
      });
    };

    // Écouter les signaux d'arrêt
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

