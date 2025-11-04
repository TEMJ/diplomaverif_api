import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 * Middleware pour valider les résultats de la validation
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array(),
    });
    return;
  }
  
  next();
};

/**
 * Règles de validation pour la connexion
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis'),
  validate,
];

/**
 * Règles de validation pour la création d'une université
 */
export const validateUniversityCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('L\'adresse est requise'),
  body('contactEmail')
    .isEmail()
    .withMessage('Email de contact invalide'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Le numéro de téléphone est requis'),
  validate,
];

/**
 * Règles de validation pour la création d'un étudiant
 */
export const validateStudentCreate = [
  body('universityId')
    .notEmpty()
    .withMessage('L\'université est requise'),
  body('matricule')
    .trim()
    .notEmpty()
    .withMessage('Le matricule est requis'),
  body('email')
    .isEmail()
    .withMessage('Email invalide'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Date de naissance invalide'),
  body('major')
    .trim()
    .notEmpty()
    .withMessage('La major est requise'),
  validate,
];

/**
 * Règles de validation pour la création d'un certificat
 */
export const validateCertificateCreate = [
  body('studentId')
    .notEmpty()
    .withMessage('L\'étudiant est requis'),
  body('universityId')
    .notEmpty()
    .withMessage('L\'université est requise'),
  body('degreeTitle')
    .trim()
    .notEmpty()
    .withMessage('Le titre du diplôme est requis'),
  body('specialization')
    .trim()
    .notEmpty()
    .withMessage('La spécialisation est requise'),
  body('graduationDate')
    .isISO8601()
    .withMessage('Date de graduation invalide'),
  body('pdfUrl')
    .isURL()
    .withMessage('URL du PDF invalide'),
  validate,
];

/**
 * Règles de validation pour la création d'une vérification
 */
export const validateVerificationCreate = [
  body('certificateId')
    .notEmpty()
    .withMessage('Le certificat est requis'),
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Le nom de l\'entreprise est requis'),
  body('email')
    .isEmail()
    .withMessage('Email invalide'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('La raison est requise'),
  validate,
];

