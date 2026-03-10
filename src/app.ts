import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes';
import universityRoutes from './routes/university.routes';
import studentRoutes from './routes/student.routes';
import certificateRoutes from './routes/certificate.routes';
import verificationRoutes from './routes/verification.routes';
import programRoutes from './routes/program.routes';
import moduleRoutes from './routes/module.routes';
import gradeRoutes from './routes/grade.routes';

// Import middlewares
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Main Express application (UK-compliant Academic Certification System)
 * Configures middlewares and routes for secure certificate generation and verification
 */
const app = express();

const uploadRootPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadRootPath));
console.log(`[Static] Serveur d'images actif sur : ${uploadRootPath}`);

// Global middlewares
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON in requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Serve static files from public directory
app.use(express.static('public'));

// Health check route to verify server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DiplomaVerif API server operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/grades', gradeRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to DiplomaVerif API - UK Academic Certification & Verification System',
    version: '2.0.0',
    documentation: 'See README for complete documentation',
    features: [
      'Automatic student ID generation',
      'Weighted grade calculations with CATS credits',
      'UK degree classification (1st, 2:1, 2:2, 3rd, Fail)',
      'Secure certificate generation with QR codes',
      'File uploads for photos, logos, seals, and signatures',
      'Complete academic record management',
    ],
  });
});

// Handle not found routes (must be after all routes)
app.use(notFoundHandler);

// Error handling (must be last middleware)
app.use(errorHandler);

export default app;
