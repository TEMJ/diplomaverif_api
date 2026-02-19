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

