import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import des routes
import authRoutes from './routes/auth.routes';
import universityRoutes from './routes/university.routes';
import studentRoutes from './routes/student.routes';
import certificateRoutes from './routes/certificate.routes';
import verificationRoutes from './routes/verification.routes';
import studentRecordRoutes from './routes/student-record.routes';

// Import des middlewares
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Chargement des variables d'environnement
dotenv.config();

/**
 * Application Express principale
 * Configure les middlewares et les routes
 */
const app = express();

// Middlewares globaux
app.use(cors()); // Autoriser les requêtes cross-origin
app.use(express.json()); // Parser le JSON dans les requêtes
app.use(express.urlencoded({ extended: true })); // Parser les données URL encodées

// Route de santé pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Serveur DiplomaVerif opérationnel',
    timestamp: new Date().toISOString(),
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/student-records', studentRecordRoutes);

// Route racine
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenue sur l\'API DiplomaVerif',
    version: '1.0.0',
    documentation: 'Consultez le README pour la documentation complète',
  });
});

// Gestion des routes non trouvées (doit être après toutes les routes)
app.use(notFoundHandler);

// Gestion des erreurs (doit être le dernier middleware)
app.use(errorHandler);

export default app;

