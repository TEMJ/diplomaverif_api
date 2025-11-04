import { Request, Response } from 'express';
import prisma from '../config/database';
import authService from '../services/auth.service';
import emailService from '../services/email.service';

/**
 * Contrôleur d'authentification
 * Gère la connexion des utilisateurs et la gestion des sessions
 */
class AuthController {
  /**
   * Connexion d'un utilisateur
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation des données
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis',
        });
        return;
      }

      // Rechercher l'utilisateur par email
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
          student: {
            select: {
              id: true,
            },
          },
        },
      });

      // Vérifier que l'utilisateur existe
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect',
        });
        return;
      }

      // Vérifier le mot de passe
      const isPasswordValid = await authService.comparePassword(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect',
        });
        return;
      }

      // Générer le token JWT
      const token = authService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        universityId: user.universityId || undefined,
        studentId: user.studentId || undefined,
      });

      // Retourner le token et les informations utilisateur
      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            universityId: user.universityId,
            studentId: user.studentId,
            university: user.university,
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la connexion',
      });
    }
  }

  /**
   * Récupérer les informations de l'utilisateur connecté
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      // Récupérer les informations complètes de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          university: true,
          student: {
            include: {
              university: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable',
        });
        return;
      }

      // Retourner les informations utilisateur (sans le mot de passe)
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du profil',
      });
    }
  }

  /**
   * Changer le mot de passe
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Validation des données
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Mot de passe actuel et nouveau mot de passe requis',
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
        });
        return;
      }

      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable',
        });
        return;
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await authService.comparePassword(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Mot de passe actuel incorrect',
        });
        return;
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await authService.hashPassword(newPassword);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      res.status(200).json({
        success: true,
        message: 'Mot de passe modifié avec succès',
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors du changement de mot de passe',
      });
    }
  }
}

export default new AuthController();

