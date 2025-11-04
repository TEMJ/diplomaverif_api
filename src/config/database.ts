import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

/**
 * Instance unique du client Prisma
 * Gère la connexion à la base de données MySQL
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Fonction pour initialiser la connexion à la base de données
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données MySQL établie');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    throw error;
  }
};

/**
 * Fonction pour fermer la connexion à la base de données
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Connexion à la base de données fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de la connexion:', error);
    throw error;
  }
};

export default prisma;

