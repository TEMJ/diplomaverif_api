import { Request, Response } from 'express';
import prisma from '../config/database';
import authService from '../services/auth.service';
import emailService from '../services/email.service';

/**
 * Contrôleur pour la gestion des étudiants
 * Gère les opérations CRUD sur les étudiants
 */
class StudentController {
  /**
   * Récupérer tous les étudiants
   * GET /api/students
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, major, page = 1, limit = 10 } = req.query;

      const where: any = {};
      
      // Filtrer par université si spécifié
      if (universityId) {
        where.universityId = universityId as string;
      }
      
      // Filtrer par major si spécifié
      if (major) {
        where.major = major as string;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            university: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        }),
        prisma.student.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        count: students.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: students,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des étudiants',
      });
    }
  }

  /**
   * Récupérer un étudiant par ID
   * GET /api/students/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          university: true,
          certificates: {
            include: {
              university: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
          studentRecord: true,
        },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Étudiant introuvable',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'étudiant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération de l\'étudiant',
      });
    }
  }

  /**
   * Créer un nouvel étudiant
   * POST /api/students
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { universityId, matricule, email, photoUrl, dateOfBirth, major } = req.body;

      // Validation des données
      if (!universityId || !matricule || !email || !dateOfBirth || !major) {
        res.status(400).json({
          success: false,
          message: 'université, matricule, email, date de naissance et major requis',
        });
        return;
      }

      // Vérifier si l'étudiant existe déjà
      const existingStudent = await prisma.student.findFirst({
        where: {
          OR: [{ matricule }, { email }],
        },
      });

      if (existingStudent) {
        res.status(409).json({
          success: false,
          message: 'Un étudiant avec ce matricule ou cet email existe déjà',
        });
        return;
      }

      // Créer l'étudiant
      const student = await prisma.student.create({
        data: {
          universityId,
          matricule,
          email,
          photoUrl,
          dateOfBirth: new Date(dateOfBirth),
          major,
        },
      });

      // Générer un mot de passe temporaire
      const temporaryPassword = authService.generateTemporaryPassword();
      const hashedPassword = await authService.hashPassword(temporaryPassword);

      // Créer l'utilisateur étudiant associé
      await prisma.user.create({
        data: {
          studentId: student.id,
          email: student.email,
          password: hashedPassword,
          role: 'STUDENT',
        },
      });

      // Envoyer l'email de bienvenue
      await emailService.sendWelcomeEmail(student.email, temporaryPassword, 'STUDENT');

      res.status(201).json({
        success: true,
        message: 'Étudiant créé avec succès',
        data: student,
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'étudiant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création de l\'étudiant',
      });
    }
  }

  /**
   * Mettre à jour un étudiant
   * PUT /api/students/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { matricule, email, photoUrl, dateOfBirth, major } = req.body;

      // Vérifier si l'étudiant existe
      const existingStudent = await prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        res.status(404).json({
          success: false,
          message: 'Étudiant introuvable',
        });
        return;
      }

      // Mettre à jour l'étudiant
      const student = await prisma.student.update({
        where: { id },
        data: {
          matricule,
          email,
          photoUrl,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          major,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Étudiant mis à jour avec succès',
        data: student,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'étudiant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour de l\'étudiant',
      });
    }
  }

  /**
   * Supprimer un étudiant
   * DELETE /api/students/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Vérifier si l'étudiant existe
      const existingStudent = await prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        res.status(404).json({
          success: false,
          message: 'Étudiant introuvable',
        });
        return;
      }

      // Supprimer l'étudiant (cascade supprimera les certificats et dossiers associés)
      await prisma.student.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Étudiant supprimé avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'étudiant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la suppression de l\'étudiant',
      });
    }
  }
}

export default new StudentController();

