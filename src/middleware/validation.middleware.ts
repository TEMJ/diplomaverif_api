import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 * Middleware to validate validation results
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
    return;
  }
  
  next();
};

/**
 * Validation rules for login
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Invalid email'),
  body('password')
    .notEmpty()
    .withMessage('Password required'),
  validate,
];

/**
 * Validation rules for creating a university
 */
export const validateUniversityCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('contactEmail')
    .isEmail()
    .withMessage('Invalid contact email'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  validate,
];

/**
 * Validation rules for creating a student
 */
export const validateStudentCreate = [
  body('universityId')
    .notEmpty()
    .withMessage('University is required'),
  body('matricule')
    .trim()
    .notEmpty()
    .withMessage('Matricule is required'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('email')
    .isEmail()
    .withMessage('Invalid email'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Invalid date of birth'),
  body('major')
    .trim()
    .notEmpty()
    .withMessage('Major is required'),
  validate,
];

/**
 * Validation rules for creating a certificate
 */
export const validateCertificateCreate = [
  body('studentId')
    .notEmpty()
    .withMessage('Student is required'),
  body('universityId')
    .notEmpty()
    .withMessage('University is required'),
  body('degreeTitle')
    .trim()
    .notEmpty()
    .withMessage('Degree title is required'),
  body('specialization')
    .trim()
    .notEmpty()
    .withMessage('Specialization is required'),
  body('graduationDate')
    .isISO8601()
    .withMessage('Invalid graduation date'),
  body('pdfUrl')
    .isURL()
    .withMessage('Invalid PDF URL'),
  validate,
];

/**
 * Validation rules for creating a verification
 */
export const validateVerificationCreate = [
  body('certificateId')
    .notEmpty()
    .withMessage('Certificate is required'),
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required'),
  body('email')
    .isEmail()
    .withMessage('Invalid email'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required'),
  validate,
];

