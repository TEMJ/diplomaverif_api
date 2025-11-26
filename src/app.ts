import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes';
import universityRoutes from './routes/university.routes';
import studentRoutes from './routes/student.routes';
import certificateRoutes from './routes/certificate.routes';
import verificationRoutes from './routes/verification.routes';
import studentRecordRoutes from './routes/student-record.routes';

// Import middlewares
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

/**
 * Main Express application
 * Configures middlewares and routes
 */
const app = express();

// Global middlewares
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON in requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Health check route to verify server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DiplomaVerif server operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/student-records', studentRecordRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to DiplomaVerif API',
    version: '1.0.0',
    documentation: 'See README for complete documentation',
  });
});

// Handle not found routes (must be after all routes)
app.use(notFoundHandler);

// Error handling (must be last middleware)
app.use(errorHandler);

export default app;

