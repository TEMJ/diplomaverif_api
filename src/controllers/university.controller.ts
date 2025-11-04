import { Request, Response } from 'express';
import prisma from '../config/database';
import authService from '../services/auth.service';
import emailService from '../services/email.service';

/**
 * Contrôleur pour la gestion des universités
 * Gère les opérations CRUD sur les universités
 */
class UniversityController {
  /**
   * Récupérer toutes les universités
   * GET /api/universities
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const universities = await prisma.university.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              students: true,
              certificates: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        count: universities.length,
        data: universities,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des universités:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des universités',
      });
    }
  }

  /**
   * Récupérer une université par ID
   * GET /api/universities/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const university = await prisma.university.findUnique({
        where: { id },
        include: {
          students: {
            select: {
              id: true,
              matricule: true,
              email: true,
              major: true,
            },
            take: 10,
          },
          _count: {
            select: {
              students: true,
              certificates: true,
            },
          },
        },
      });

      if (!university) {
        res.status(404).json({
          success: false,
          message: 'Université introuvable',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: university,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'université:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération de l\'université',
      });
    }
  }

  /**
   * Créer une nouvelle université
   * POST /api/universities
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, address, contactEmail, phone, logoUrl } = req.body;

      // Validation des données
      if (!name || !address || !contactEmail || !phone) {
        res.status(400).json({
          success: false,
          message: 'Nom, adresse, email et téléphone requis',
        });
        return;
      }

      // Vérifier si l'université existe déjà
      const existingUniversity = await prisma.university.findFirst({
        where: { contactEmail },
      });

      if (existingUniversity) {
        res.status(409).json({
          success: false,
          message: 'Une université avec cet email existe déjà',
        });
        return;
      }

      // Créer l'université
      const university = await prisma.university.create({
        data: {
          name,
          address,
          contactEmail,
          phone,
          logoUrl,
        },
      });

      // Générer un mot de passe temporaire
      const temporaryPassword = authService.generateTemporaryPassword();
      const hashedPassword = await authService.hashPassword(temporaryPassword);

      // Créer l'utilisateur université associé
      await prisma.user.create({
        data: {
          universityId: university.id,
          email: university.contactEmail,
          password: hashedPassword,
          role: 'UNIVERSITY',
        },
      });

      // Envoyer l'email de bienvenue
      await emailService.sendWelcomeEmail(university.contactEmail, temporaryPassword, 'UNIVERSITY');

      res.status(201).json({
        success: true,
        message: 'Université créée avec succès',
        data: university,
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'université:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création de l\'université',
      });
    }
  }

  /**
   * Mettre à jour une université
   * PUT /api/universities/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, address, contactEmail, phone, logoUrl } = req.body;

      // Vérifier si l'université existe
      const existingUniversity = await prisma.university.findUnique({
        where: { id },
      });

      if (!existingUniversity) {
        res.status(404).json({
          success: false,
          message: 'Université introuvable',
        });
        return;
      }

      // Mettre à jour l'université
      const university = await prisma.university.update({
        where: { id },
        data: {
          name,
          address,
          contactEmail,
          phone,
          logoUrl,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Université mise à jour avec succès',
        data: university,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'université:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour de l\'université',
      });
    }
  }

  /**
   * Supprimer une université
   * DELETE /api/universities/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Vérifier si l'université existe
      const existingUniversity = await prisma.university.findUnique({
        where: { id },
      });

      if (!existingUniversity) {
        res.status(404).json({
          success: false,
          message: 'Université introuvable',
        });
        return;
      }

      // Supprimer l'université (cascade supprimera les étudiants et certificats associés)
      await prisma.university.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Université supprimée avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'université:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la suppression de l\'université',
      });
    }
  }
}

export default new UniversityController();

