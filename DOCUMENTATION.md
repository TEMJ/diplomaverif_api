# DiplomaVerif API — Complete Project Documentation

**Version:** 2.0.0  
**Description:** UK-compliant academic certification and diploma verification platform with QR code verification, JWT authentication, and role-based access control.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technologies & Dependencies](#2-technologies--dependencies)
3. [Project Structure](#3-project-structure)
4. [Configuration & Environment](#4-configuration--environment)
5. [Database Schema](#5-database-schema)
6. [API Routes Reference](#6-api-routes-reference)
7. [Authentication & Security](#7-authentication--security)
8. [Services](#8-services)
9. [Middleware](#9-middleware)
10. [Utilities](#10-utilities)
11. [Scripts & Commands](#11-scripts--commands)

---

## 1. Project Overview

DiplomaVerif is a REST API for:

- **Universities:** Manage institutions, programs, modules, students, and certificates.
- **Students:** View own profile, certificates, and change password.
- **Admins:** Full CRUD on all entities.
- **Public:** Verify a certificate by scanning its QR code (no auth).

Main features:

- JWT authentication with roles: `ADMIN`, `UNIVERSITY`, `STUDENT`.
- Automatic student ID (matricule) generation per university and year.
- UK degree classification (1st, 2:1, 2:2, 3rd, Fail) from weighted module grades (CATS credits).
- Certificate PDF generation with university logo, seal, and registrar signature.
- Unique QR hash per certificate for public verification.
- Welcome and verification notification emails (Nodemailer).
- File uploads for logos, seals, signatures, and student photos (Multer).

---

## 2. Technologies & Dependencies

| Category        | Technology / Package |
|----------------|----------------------|
| Runtime        | Node.js (TypeScript) |
| Framework      | Express.js |
| ORM            | Prisma |
| Database       | MySQL 8+ |
| Auth           | JWT (jsonwebtoken), bcrypt |
| Validation     | express-validator |
| Email          | Nodemailer |
| QR codes       | qrcode |
| PDF            | PDFKit |
| File upload    | Multer |
| IDs            | uuid |

**Dev:** TypeScript, ts-node, ts-node-dev, Prisma CLI.

---

## 3. Project Structure

```
diplomaVerif_api/
├── prisma/
│   ├── schema.prisma          # Database models and enums
│   ├── seed.ts                # Seed script (universities, users, students, certificates, etc.)
│   └── migrations/            # SQL migrations
├── src/
│   ├── app.ts                 # Express app: middleware, routes, error handlers
│   ├── server.ts              # Entry: DB connect, SMTP check, start server, graceful shutdown
│   ├── config/
│   │   ├── env.ts             # Environment variables validation and export
│   │   └── database.ts        # Prisma client singleton, connect/disconnect
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── university.controller.ts
│   │   ├── student.controller.ts
│   │   ├── certificate.controller.ts
│   │   ├── verification.controller.ts
│   │   ├── student-record.controller.ts
│   │   ├── program.controller.ts
│   │   ├── module.controller.ts
│   │   ├── grade.controller.ts
│   │   └── bulkGrade.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts      # authenticate, authorize(roles), authorizeUniversityAccess, authorizeStudentAccess
│   │   ├── error.middleware.ts     # errorHandler, notFoundHandler
│   │   └── validation.middleware.ts # validate, validateLogin, validateUniversityCreate, etc.
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── university.routes.ts
│   │   ├── student.routes.ts
│   │   ├── certificate.routes.ts
│   │   ├── verification.routes.ts
│   │   ├── student-record.routes.ts
│   │   ├── program.routes.ts
│   │   ├── module.routes.ts
│   │   └── grade.routes.ts
│   ├── services/
│   │   ├── auth.service.ts         # JWT, bcrypt, temporary password
│   │   ├── email.service.ts       # Welcome, verification notification, certificate issuance
│   │   ├── qrcode.service.ts       # Hash generation, QR data URL / buffer
│   │   ├── file-upload.service.ts # Multer configs for photos, logos, seals, signatures
│   │   ├── certificate.service.ts # PDF generation, certificate with grades
│   │   ├── academic.service.ts    # Weighted average, UK classification, recalc certificates
│   │   └── bulkGrade.service.ts   # Bulk grade upsert per module
│   └── utils/
│       └── student-id-generator.ts # Auto matricule: YEAR + sequence per university
├── public/                    # Static files (if used)
├── uploads/                   # Uploaded files (photos, logos, seals, signatures)
├── .env                       # Local config (not committed)
├── package.json
├── tsconfig.json
├── README.md
├── SETUP.md
├── API_EXAMPLES.md
└── DOCUMENTATION.md           # This file
```

**Note:** `src/routes/subject.routes.ts` and `src/controllers/subject.controller.ts` exist but are **not** mounted in `app.ts`; the app uses **Program** and **Module** instead of Subject.

---

## 4. Configuration & Environment

### Required environment variables

Defined and validated in `src/config/env.ts`. Missing required vars cause process exit at startup.

| Variable        | Description |
|----------------|-------------|
| `DATABASE_URL` | MySQL connection string (e.g. `mysql://user:pass@localhost:3306/diplomaverif`) |
| `JWT_SECRET`   | Secret for signing JWT tokens |
| `SMTP_HOST`    | SMTP host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT`    | SMTP port (e.g. `587`) |
| `SMTP_USER`    | SMTP username |
| `SMTP_PASSWORD`| SMTP password (e.g. Gmail app password) |

### Optional environment variables

| Variable        | Default | Description |
|----------------|---------|-------------|
| `JWT_EXPIRES_IN` | `7d`  | JWT expiration |
| `SMTP_FROM`      | `DiplomaVerif <noreply@diplomaverif.com>` | From address |
| `PORT`           | `3000` | HTTP port |
| `NODE_ENV`       | `development` | Environment |
| `BASE_URL`       | `http://localhost:5173` | Base URL for emails/links |
| `UPLOAD_DIR`     | `./uploads` | Root directory for uploads |
| `API_URL`        | —     | Used by file-upload and certificate services for file URLs |

### Exported config (`env`)

- `databaseUrl`, `jwtSecret`, `jwtExpiresIn`
- `smtpHost`, `smtpPort`, `smtpUser`, `smtpPassword`, `smtpFrom`
- `port`, `nodeEnv`, `baseUrl`
- `uploadDir`

---

## 5. Database Schema

**Provider:** MySQL. **ORM:** Prisma. Schema: `prisma/schema.prisma`.

### Enums

- **Role:** `ADMIN`, `UNIVERSITY`, `STUDENT`
- **CertificateStatus:** `ACTIVE`, `REVOKED`

### Models

| Model          | Main fields | Notes |
|----------------|-------------|--------|
| **University** | id, name, address, contactEmail, phone, logoUrl, ukprn, officialSealUrl, registrarName, signatureUrl, createdAt | UKPRN, seal, registrar, signature for compliance |
| **User**       | id, universityId?, studentId?, email (unique), password, role, createdAt, updatedAt | One user per university or per student; admin has no universityId/studentId |
| **Student**    | id, universityId, programId?, studentId? (unique, matricule), firstName, lastName, email, photoUrl, dateOfBirth, enrollmentDate, createdAt | Unique (universityId, studentId) |
| **Program**     | id, universityId, title, level, totalCreditsRequired (default 360), createdAt, updatedAt | Unique (universityId, title) |
| **Module**     | id, universityId, programId, code, name, credits (default 0), createdAt, updatedAt | Unique (universityId, code) |
| **Certificate** | id, studentId, universityId, programId, graduationDate, finalMark?, degreeClassification?, qrHash (unique), status, createdAt | finalMark/degreeClassification computed from grades |
| **Verification** | id, certificateId, companyName, email, reason, verificationDate, ipAddress | One per verification event |
| **StudentRecord** | id, studentId (unique), attendance, discipline, gradesPdfUrl, transcriptPdfUrl, diplomaPdfUrl, createdAt | One record per student |
| **Grade**       | id, studentId, moduleId, mark (0–100), date, createdAt, updatedAt | Unique (studentId, moduleId) |

### Key relations

- University → students, certificates, users, programs, modules
- Student → university, program?, certificates, user?, studentRecord?, grades
- Certificate → student, university, program, verifications
- Grade → student, module
- Module → program, university, grades
- Program → university, students, modules, certificates

Cascades: Deleting a university removes its students, certificates, users, programs, modules. Deleting a student removes certificates, user, studentRecord, grades.

---

## 6. API Routes Reference

Base path: **`/api`**. Unless stated, responses use `{ success, message?, data?, count? }`. Errors: `success: false`, `message`, optional `errors`.

### 6.1 Health & root

| Method | Path     | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/health`| No   | Server health check |
| GET    | `/`      | No   | Welcome and feature list |

---

### 6.2 Auth — `/api/auth`

| Method | Path              | Auth | Description |
|--------|-------------------|------|-------------|
| POST   | `/api/auth/login` | No   | Login with email + password; returns JWT and user |
| GET    | `/api/auth/me`    | Yes  | Current user profile (no password) |
| POST   | `/api/auth/change-password` | Yes | Change password (currentPassword, newPassword) |

**Login body:** `{ "email": "", "password": "" }`  
**Change-password body:** `{ "currentPassword": "", "newPassword": "" }` — new password min 8 characters.

---

### 6.3 Universities — `/api/universities`

All routes require **authentication**. Create/Update/Delete and uploads are restricted by role as below.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET    | `/`  | All   | List all universities (with _count) |
| GET    | `/:id` | All | University by ID (with sample students, programs, _count) |
| POST   | `/`  | ADMIN | Create university; optional multipart: logo, seal, signature |
| PUT    | `/:id` | ADMIN | Update university |
| PUT    | `/:id/logo`    | ADMIN or own UNIVERSITY | Upload logo (single file) |
| PUT    | `/:id/seal`    | ADMIN or own UNIVERSITY | Upload seal (single file) |
| PUT    | `/:id/signature` | ADMIN or own UNIVERSITY | Upload signature (single file) |
| DELETE | `/:id` | ADMIN | Delete university (cascade) |

Create body (JSON or form): name, address, contactEmail, phone; optional: logoUrl, ukprn, officialSealUrl, registrarName, signatureUrl. Creating a university also creates a USER with role UNIVERSITY (contactEmail) and sends a welcome email.

---

### 6.4 Students — `/api/students`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET    | `/`  | All   | List students; query: universityId, programId |
| GET    | `/:id` | All | Student by ID (university, program, certificates, studentRecord, grades) |
| GET    | `/:id/with-grades` | All | Student with full grades list and gradeCount |
| POST   | `/`  | UNIVERSITY, ADMIN | Create student; auto-generates studentId (matricule) and user; sends welcome email |
| PUT    | `/:id` | UNIVERSITY, ADMIN | Update student |
| PUT    | `/:id/photo` | Student (own), UNIVERSITY, ADMIN | Upload photo (single file) |
| DELETE | `/:id` | ADMIN | Delete student (cascade) |

Create body: universityId, programId? (optional), firstName, lastName, email; optional: photoUrl, dateOfBirth, enrollmentDate. studentId is generated (e.g. 20240001) and must be unique per university.

---

### 6.5 Certificates — `/api/certificates`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET    | `/verify/:qrHash` | **No** | Public | Verify certificate by QR hash; creates a verification record; returns certificate summary and verification |
| GET    | `/`  | Yes  | All (STUDENT sees only own) | List certificates; query: studentId, universityId, status, sortBy, sortOrder |
| GET    | `/:id` | Yes | All | Certificate by ID with grades and relations |
| GET    | `/:id/pdf` | Yes | All | Download certificate as PDF |
| POST   | `/`  | Yes  | UNIVERSITY, ADMIN | Create certificate; optional marks array; computes finalMark/degreeClassification; sends issuance email |
| PUT    | `/:id` | Yes | UNIVERSITY, ADMIN | Update (e.g. graduationDate, status) |
| PATCH  | `/:id/revoke` | Yes | UNIVERSITY, ADMIN | Set status to REVOKED |
| DELETE | `/:id` | Yes | ADMIN | Delete certificate |

Create body: studentId, universityId, programId, graduationDate; optional: finalMark, degreeClassification, marks (array of { moduleId, mark }). If marks are provided, grades are upserted and certificate classification is recalculated.

---

### 6.6 Verifications — `/api/verifications`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET    | `/`  | Yes  | All   | List verifications; query: certificateId |
| GET    | `/:id` | Yes | All | Verification by ID |
| POST   | `/`  | Yes  | All   | Create verification; sends notification email to student |
| DELETE | `/:id` | Yes | ADMIN | Delete verification |

Create body: certificateId, companyName, email, reason. ipAddress is set from request.

---

### 6.7 Student records — `/api/student-records`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET    | `/`  | All   | List records; query: studentId |
| GET    | `/student/:studentId` | All | Record by studentId |
| GET    | `/:id` | All | Record by ID |
| POST   | `/`  | UNIVERSITY, ADMIN | Create (one per student) |
| PUT    | `/:id` | UNIVERSITY, ADMIN | Update |
| DELETE | `/:id` | ADMIN | Delete |

Create body: studentId, gradesPdfUrl, transcriptPdfUrl, diplomaPdfUrl; optional: attendance, discipline.

**Note:** The student-record controller currently selects `matricule` and `major` on the student relation; the Prisma `Student` model uses `studentId` (not `matricule`) and has no `major` field. Those selects may need to be updated to avoid Prisma errors.

---

### 6.8 Programs — `/api/programs`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET    | `/`  | All   | List programs; query: universityId |
| GET    | `/:id` | All | Program by ID (modules, students, _count) |
| POST   | `/`  | UNIVERSITY, ADMIN | Create; level: Undergraduate \| Postgraduate |
| PUT    | `/:id` | UNIVERSITY, ADMIN | Update (university can only own) |
| DELETE | `/:id` | ADMIN | Delete |

Create body: universityId, title, level; optional: totalCreditsRequired (default 360).

---

### 6.9 Modules — `/api/modules`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET    | `/`  | All   | List modules; query: universityId, programId |
| GET    | `/program/:programId` | All | Modules by program |
| GET    | `/:id` | All | Module by ID (grades, students count) |
| POST   | `/`  | UNIVERSITY, ADMIN | Create; university can only own |
| PUT    | `/:id` | UNIVERSITY, ADMIN | Update |
| DELETE | `/:id` | ADMIN | Delete |

Create body: universityId, programId, code, name; optional: credits (default 15).

---

### 6.10 Grades — `/api/grades`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET    | `/`  | All   | List grades; query: studentId, moduleId, universityId |
| GET    | `/student/:studentId` | All | Grades for student with statistics and classification |
| GET    | `/university/:universityId` | All (UNIVERSITY only own) | All grades for that university |
| GET    | `/:id` | All | Grade by ID |
| POST   | `/`  | UNIVERSITY, ADMIN | Create or update grade (upsert by studentId + moduleId); mark 0–100; triggers certificate recalc |
| POST   | `/bulk-entry` | UNIVERSITY, ADMIN | Bulk upsert grades for one module; body: { moduleId, grades: [{ studentId, mark }] } |
| PUT    | `/:id` | UNIVERSITY, ADMIN | Update mark (blocked if ACTIVE certificate exists for that program) |
| DELETE | `/:id` | UNIVERSITY, ADMIN | Delete grade (blocked if ACTIVE certificate exists) |

Mark must be 0–100. Student and module must belong to the same program. Creating/updating grades triggers recalculation of certificate finalMark and degreeClassification for that student.

---

## 7. Authentication & Security

### 7.1 JWT

- **Header:** `Authorization: Bearer <token>`
- Payload: `userId`, `email`, `role`, optional `universityId`, `studentId`
- Signing: `env.jwtSecret`; expiry: `env.jwtExpiresIn` (e.g. 7d)
- Issued on login; validated by `authenticate` middleware

### 7.2 Password

- Stored with **bcrypt** (10 rounds)
- Temporary passwords generated on user creation (12 chars, mixed)
- Change password: requires current password; new password min 8 characters

### 7.3 Role-based access

- **ADMIN:** Full access; can delete universities, students, certificates, verifications, programs, modules, grades, student records.
- **UNIVERSITY:** Own university only (enforced in controllers and via authorize + resource checks). Can create/update students, certificates, programs, modules, grades, student records; upload logo/seal/signature for own university; upload student photo.
- **STUDENT:** Own data only (e.g. certificates list filtered by studentId). Can get profile, change password, upload own photo.
- **Public:** Only `GET /api/certificates/verify/:qrHash` (no token).

### 7.4 Middleware chain

- **authenticate:** Reads Bearer token, verifies JWT, sets `req.user`.
- **authorize(...roles):** Ensures `req.user.role` is in allowed roles.
- **authorizeUniversityAccess:** ADMIN or UNIVERSITY with matching universityId (params/body).
- **authorizeStudentAccess:** ADMIN or UNIVERSITY or STUDENT with matching studentId.

### 7.5 Other security measures

- **Validation:** express-validator used in validation middleware (e.g. login, university create, student create, certificate create, verification create).
- **Prisma:** Parameterized queries (no raw SQL in app) to mitigate SQL injection.
- **File uploads:** Multer; max size 5MB; allowed types: image/jpeg, image/png, image/webp, image/gif.
- **Error handling:** Central error handler; Prisma P2002 → 409, P2025 → 404; validation and JSON errors → 400; generic → 500.
- **CORS:** Enabled for all origins in app (can be restricted in production).

---

## 8. Services

| Service | File | Purpose |
|---------|------|---------|
| **Auth** | `auth.service.ts` | generateToken, verifyToken, hashPassword, comparePassword, generateTemporaryPassword |
| **Email** | `email.service.ts` | verifyConnection (SMTP), sendWelcomeEmail, sendVerificationNotification, sendCertificateIssuanceEmail |
| **QR code** | `qrcode.service.ts` | generateHash, generateQRCode (data URL), generateQRCodeBuffer (PNG for PDF), generateQRCodeWithHash, extractHashFromUrl |
| **File upload** | `file-upload.service.ts` | createPhotoUpload, createLogoUpload, createSealUpload, createSignatureUpload, createCombinedUpload; getFileUrl, deleteFile, getRelativePath; 5MB limit, image types only |
| **Certificate** | `certificate.service.ts` | generateCertificatePdf(id), getCertificateWithGrades(id); loads logo/seal/signature from URL or local path; builds PDF (Cambridge-style layout) |
| **Academic** | `academic.service.ts` | calculateWeightedAverageMark, getDegreeClassification (UK), calculateStudentClassification, updateCertificateWithClassification, recalculateStudentCertificates, getGradeStatistics, validateGradeMark(0–100) |
| **Bulk grade** | `bulkGrade.service.ts` | bulkUpsert(moduleId, grades[]) — upsert per student/module; skips if student not in program |

---

## 9. Middleware

| Middleware | File | Purpose |
|-----------|------|---------|
| **authenticate** | auth.middleware.ts | Require valid JWT; set req.user |
| **authorize(...roles)** | auth.middleware.ts | Require req.user.role in allowed roles |
| **authorizeUniversityAccess** | auth.middleware.ts | ADMIN or UNIVERSITY with matching universityId |
| **authorizeStudentAccess** | auth.middleware.ts | ADMIN or UNIVERSITY or STUDENT with matching studentId |
| **errorHandler** | error.middleware.ts | Map Prisma/validation/generic errors to JSON and status code |
| **notFoundHandler** | error.middleware.ts | 404 for unknown method/path |
| **validate** | validation.middleware.ts | Check express-validator validationResult; 400 if errors |
| **validateLogin** | validation.middleware.ts | body: email (isEmail), password (notEmpty) + validate |
| **validateUniversityCreate** | validation.middleware.ts | name, address, contactEmail, phone + validate |
| **validateStudentCreate** | validation.middleware.ts | universityId, matricule, firstName, lastName, email, dateOfBirth (ISO), major + validate |
| **validateCertificateCreate** | validation.middleware.ts | studentId, universityId, degreeTitle, specialization, graduationDate (ISO), pdfUrl (URL) + validate |
| **validateVerificationCreate** | validation.middleware.ts | certificateId, companyName, email, reason + validate |

Note: Some route handlers perform their own validation and do not use the validation middleware arrays above.

---

## 10. Utilities

### StudentIdGenerator (`src/utils/student-id-generator.ts`)

- **generateStudentId(universityId, enrollmentYear?):** Returns next matricule for that university and year; format `YYYYNNNN` (e.g. 20240001). Uses last student with studentId starting with year to get next sequence.
- **validateStudentId(id):** Format check (8 digits).
- **getYearFromStudentId(id):** First 4 digits.
- **getSequenceFromStudentId(id):** Last 4 digits.

---

## 11. Scripts & Commands

| Command | Description |
|--------|-------------|
| `npm run dev` | Start with ts-node-dev (watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run `node dist/server.js` (or entry in package.json) |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:seed` | Seed database (see seed.ts) |
| `npm run prisma:studio` | Open Prisma Studio (default port 5555) |
| `npm run test-email` | Run test email script (src/test-email.ts) |

**Entry:** `package.json` `main` is `dist/server.js`; dev script uses `src/server.ts`.

---

## Summary

- **Entry:** `server.ts` → connects DB, checks SMTP in dev, mounts `app`, graceful shutdown on SIGTERM/SIGINT.
- **App:** `app.ts` → CORS, json, urlencoded, static, `/health`, `/`, then `/api/auth`, `/api/universities`, `/api/students`, `/api/certificates`, `/api/verifications`, `/api/student-records`, `/api/programs`, `/api/modules`, `/api/grades`; then notFoundHandler and errorHandler.
- **Auth:** JWT in Authorization header; roles ADMIN, UNIVERSITY, STUDENT; university/student scoping where applicable.
- **Data:** MySQL + Prisma; universities, users, students, programs, modules, grades, certificates, verifications, student records; UK-focused (classification, CATS credits).
- **Security:** bcrypt, JWT, validation, role checks, file type/size limits, centralized error handling.

For setup and examples, see **README.md**, **SETUP.md**, and **API_EXAMPLES.md**.
