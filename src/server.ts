import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import emailService from './services/email.service';

/**
 * Main server entry point
 * Initializes database connection and starts Express server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Verify SMTP configuration (in development mode)
    if (env.nodeEnv === 'development') {
      await emailService.verifyConnection();
    }

    // Start server
    const server = app.listen(env.port, () => {
      console.log('\n🚀 DiplomaVerif server started successfully!');
      console.log(`📡 Port: ${env.port}`);
      console.log(`🌐 Environment: ${env.nodeEnv}`);
      console.log(`🔗 URL: http://localhost:${env.port}`);
      console.log(`📖 Health check: http://localhost:${env.port}/health\n`);
      console.log('📊 Available endpoints:');
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

    // Handle graceful shutdown
    const gracefulShutdown = async (): Promise<void> => {
      console.log('\n⚠️  Shutdown signal received, gracefully closing...');
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        // Close database connection
        await disconnectDatabase();
        
        console.log('✅ Database disconnected');
        console.log('👋 Goodbye!\n');
        process.exit(0);
      });
    };

    // Listen for shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

// Start server
startServer();

