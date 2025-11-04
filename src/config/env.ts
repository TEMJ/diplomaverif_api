import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

/**
 * Configuration centralisée des variables d'environnement
 * Assure la validation et la disponibilité des configurations nécessaires
 */
interface EnvConfig {
  // Base de données
  databaseUrl: string;
  
  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // Email
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  
  // Serveur
  port: number;
  nodeEnv: string;
  baseUrl: string;
  
  // Stockage
  uploadDir: string;
}

/**
 * Validation des variables d'environnement requises
 */
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
];

// Vérification des variables d'environnement requises
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:', missingEnvVars.join(', '));
  process.exit(1);
}

/**
 * Configuration exportée
 */
export const env: EnvConfig = {
  // Base de données
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Email
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || 'DiplomaVerif <noreply@diplomaverif.com>',
  
  // Serveur
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  
  // Stockage
  uploadDir: process.env.UPLOAD_DIR || './uploads',
};

export default env;

