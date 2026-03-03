import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

/**
 * File Upload Service
 * Handles file uploads for student photos, university logos, seals, and signatures
 */
class FileUploadService {
  private uploadDir: string;
  private maxFileSize: number; // 5MB
  private allowedMimeTypes: Set<string>;
  private csvMimeTypes: Set<string>;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]);

    this.csvMimeTypes = new Set([
      'text/csv',
      'application/vnd.ms-excel',
      'text/plain',
    ]);

    // Ensure upload directories exist
    this.ensureUploadDirs();
  }

  /**
   * Ensure all required upload directories exist
   */
  private ensureUploadDirs(): void {
    const dirs = [
      path.join(this.uploadDir, 'photos'),
      path.join(this.uploadDir, 'logos'),
      path.join(this.uploadDir, 'seals'),
      path.join(this.uploadDir, 'signatures'),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get multer storage configuration for student photos
   */
  getPhotoStorage(): StorageEngine {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'photos'));
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  /**
   * Get multer storage configuration for university logos
   */
  getLogoStorage(): StorageEngine {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'logos'));
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  /**
   * Get multer storage configuration for official seals
   */
  getSealStorage(): StorageEngine {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'seals'));
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  /**
   * Get multer storage configuration for signatures
   */
  getSignatureStorage(): StorageEngine {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'signatures'));
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  /**
   * Create multer upload middleware for photos
   */
  createPhotoUpload() {
    return multer({
      storage: this.getPhotoStorage(),
      limits: { fileSize: this.maxFileSize },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
      },
    });
  }

  /**
   * Create multer upload middleware for logos
   */
  createLogoUpload() {
    return multer({
      storage: this.getLogoStorage(),
      limits: { fileSize: this.maxFileSize },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
      },
    });
  }

  /**
   * Create multer upload middleware for seals
   */
  createSealUpload() {
    return multer({
      storage: this.getSealStorage(),
      limits: { fileSize: this.maxFileSize },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
      },
    });
  }

  /**
   * Create multer upload middleware for signatures
   */
  createSignatureUpload() {
    return multer({
      storage: this.getSignatureStorage(),
      limits: { fileSize: this.maxFileSize },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
      },
    });
  }

  /**
   * Create combined multer upload middleware for multiple file types
   * Used when creating university with logo, seal, and signature in one request
   */
  createCombinedUpload() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        // Determine destination based on field name
        if (file.fieldname === 'logo') {
          cb(null, path.join(this.uploadDir, 'logos'));
        } else if (file.fieldname === 'seal') {
          cb(null, path.join(this.uploadDir, 'seals'));
        } else if (file.fieldname === 'signature') {
          cb(null, path.join(this.uploadDir, 'signatures'));
        } else {
          cb(null, path.join(this.uploadDir, 'logos')); // Default
        }
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });

    return multer({
      storage,
      limits: { fileSize: this.maxFileSize },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
      },
    });
  }

  /**
   * Create multer upload middleware for CSV files (in-memory)
   * Used for bulk import of programs, modules, and students
   */
  createCsvUpload() {
    return multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: this.maxFileSize },
      fileFilter: (req, file, cb) => {
        if (this.csvMimeTypes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only CSV files are allowed.'));
        }
      },
    });
  }

  /**
   * Get file URL from local storage
   * @param fileName - Name of the file
   * @param fileType - Type of file (photos, logos, seals, signatures)
   * @returns URL to access the file
   */
  getFileUrl(fileName: string, fileType: 'photos' | 'logos' | 'seals' | 'signatures'): string {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    return `${apiUrl}/uploads/${fileType}/${fileName}`;
  }

  /**
   * Delete a file from storage
   * @param fileName - Name of the file
   * @param fileType - Type of file
   */
  deleteFile(fileName: string, fileType: 'photos' | 'logos' | 'seals' | 'signatures'): void {
    try {
      const filePath = path.join(this.uploadDir, fileType, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  /**
   * Generate a relative path for the uploaded file
   * @param fileName - Name of the file
   * @param fileType - Type of file
   * @returns Relative path
   */
  getRelativePath(fileName: string, fileType: 'photos' | 'logos' | 'seals' | 'signatures'): string {
    return `uploads/${fileType}/${fileName}`;
  }
}

export default new FileUploadService();
