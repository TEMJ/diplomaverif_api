import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Unique Prisma client instance
 * Manages connection to MySQL database
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Function to initialize database connection
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ MySQL database connection established');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

/**
 * Function to close database connection
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing connection:', error);
    throw error;
  }
};

export default prisma;

