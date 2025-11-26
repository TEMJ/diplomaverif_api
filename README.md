# 🎓 DiplomaVerif - Diploma Verification Platform

A complete platform for diploma verification using QR codes to secure and authenticate university certificates.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Migration](#database-migration)
- [Seed Data](#seed-data)
- [Startup](#startup)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Roles and Permissions](#roles-and-permissions)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Security](#security)

## ✨ Features

### 🔐 User Management
- **Secure JWT authentication** with bcrypt
- **Three roles**: Admin, University, Student
- **Automatic account creation** when creating universities/students
- **Automatic emails** with temporary passwords
- **Secure password change**

### 🏫 University Management
- Complete CRUD for universities
- Logo and contact information management
- Automatic user account association

### 👥 Student Management
- Complete CRUD for students
- **Filtering by university and major**
- Unique matricules
- Photos and personal information
- Complete student record management

### 📜 Certificate/Diploma Management
- Complete CRUD for certificates
- **Automatic QR code generation**
- Unique hash for each certificate
- ACTIVE or REVOKED status
- Public verification via QR code

### 🔍 Verifications
- Recording of all verifications
- IP tracking and timestamping
- Email notifications to students
- Complete history per certificate

### 📁 Student Records
- Attendance (percentage)
- Disciplinary evaluation
- Grades (PDF)
- Transcripts (PDF)
- Diplomas (PDF)

## 🏗 Architecture

```
DiplomaVerif/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Test data
├── src/
│   ├── config/
│   │   ├── database.ts     # Prisma configuration
│   │   └── env.ts          # Environment variables
│   ├── controllers/        # Business logic controllers
│   ├── middleware/         # Express middlewares
│   ├── routes/             # API routes
│   ├── services/           # Services (auth, email, qrcode)
│   ├── app.ts              # Express configuration
│   └── server.ts           # Entry point
├── uploads/                # Uploaded files
├── .env                    # Local configuration
└── package.json
```

## 🛠 Technologies

- **Runtime**: Node.js with TypeScript
- **ORM**: Prisma
- **Database**: MySQL
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer
- **QR Codes**: qrcode
- **Framework**: Express.js
- **Validation**: express-validator

## 📦 Prerequisites

- Node.js >= 18.x
- MySQL >= 8.0
- npm or yarn
- An email account for SMTP (ex: Gmail)

## 🚀 Installation

### 1. Clone and Install Dependencies

```bash
cd "New folder"
npm install
```

### 2. Database Configuration

Create a MySQL database:

```sql
CREATE DATABASE diplomaverif CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Email Configuration (Gmail)

To use Gmail as SMTP service:

1. Enable **two-factor authentication** on your Gmail account
2. Generate an **app password**:
   - Go to https://myaccount.google.com/apppasswords
   - Create a new app password
   - Copy the generated password

## ⚙️ Configuration

### `.env` File

Edit the `.env` file with your configurations:

```env
# MySQL Database
DATABASE_URL="mysql://username:password@localhost:3306/diplomaverif"

# JWT
JWT_SECRET="your_very_secure_jwt_secret_change_this_in_production"
JWT_EXPIRES_IN="7d"

# SMTP Email (Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"
SMTP_FROM="DiplomaVerif <noreply@diplomaverif.com>"

# Server
PORT=3000
NODE_ENV="development"
BASE_URL="http://localhost:3000"

# Storage
UPLOAD_DIR="./uploads"
```

## 🗄 Database Migration

Generate Prisma client and apply migrations:

```bash
# Generate Prisma client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate
```

This command will:
- Create all tables according to Prisma schema
- Apply constraints and indexes
- Create relationships between tables

## 🌱 Seed Data

Populate the database with test data:

```bash
npm run prisma:seed
```

This command creates:
- ✅ 10 universities
- ✅ 1 administrator (email: admin@diplomaverif.com)
- ✅ 10 university users
- ✅ 100 students (10 per university)
- ✅ 100 student users
- ✅ 100 student records
- ✅ 100 certificates with QR codes
- ✅ 50 verifications

**Default password for all accounts**: `Password123!`

## ▶️ Startup

### Development Mode

```bash
npm run dev
```

Server starts on `http://localhost:3000`

### Production Mode

```bash
# Compile TypeScript
npm run build

# Start server
npm start
```

### Prisma Studio (Graphical Interface)

To view and manage the database:

```bash
npm run prisma:studio
```

Interface available at `http://localhost:5555`

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST   /api/auth/login              # Login
GET    /api/auth/me                 # User profile
POST   /api/auth/change-password    # Change password
```

### Universities
```
GET    /api/universities            # List universities
GET    /api/universities/:id        # University details
POST   /api/universities            # Create (ADMIN)
PUT    /api/universities/:id        # Update (ADMIN)
DELETE /api/universities/:id        # Delete (ADMIN)
```

### Students
```
GET    /api/students                # List students
GET    /api/students/:id            # Student details
POST   /api/students                # Create (UNIVERSITY, ADMIN)
PUT    /api/students/:id            # Update (UNIVERSITY, ADMIN)
DELETE /api/students/:id            # Delete (ADMIN)

# Available filters:
GET /api/students?universityId=xxx
GET /api/students?major=Computer Science
GET /api/students?page=1&limit=20
```

### Certificates
```
GET    /api/certificates                      # List certificates
GET    /api/certificates/:id                  # Certificate details
POST   /api/certificates                      # Create (UNIVERSITY, ADMIN)
PUT    /api/certificates/:id                  # Update (UNIVERSITY, ADMIN)
PATCH  /api/certificates/:id/revoke           # Revoke (UNIVERSITY, ADMIN)
DELETE /api/certificates/:id                  # Delete (ADMIN)
GET    /api/certificates/verify/:qrHash       # Verify by QR (PUBLIC)

# Available filters:
GET /api/certificates?studentId=xxx
GET /api/certificates?universityId=xxx
GET /api/certificates?status=ACTIVE
GET /api/certificates?page=1&limit=20
```

### Verifications
```
GET    /api/verifications           # List verifications
GET    /api/verifications/:id       # Verification details
POST   /api/verifications           # Create
DELETE /api/verifications/:id       # Delete (ADMIN)

# Available filters:
GET /api/verifications?certificateId=xxx
GET /api/verifications?page=1&limit=20
```

### Student Records
```
GET    /api/student-records                    # List records
GET    /api/student-records/:id                # Record details
GET    /api/student-records/student/:studentId # By student
POST   /api/student-records                    # Create (UNIVERSITY, ADMIN)
PUT    /api/student-records/:id                # Update (UNIVERSITY, ADMIN)
DELETE /api/student-records/:id                # Delete (ADMIN)
```

## 🔒 Authentication

All routes (except `/api/auth/login` and `/api/certificates/verify/:qrHash`) require a JWT token in the header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Login Example

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@diplomaverif.com",
    "password": "Password123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@diplomaverif.com",
      "role": "ADMIN"
    }
  }
}
```

## 👥 Roles and Permissions

### ADMIN
- Full access to all resources
- CRUD on universities, students, certificates, etc.
- Resource deletion
- Admin creation

### UNIVERSITY
- View own data and students
- Create and manage students
- Create and manage certificates
- View verifications of own certificates
- Manage student records

### STUDENT
- View own data
- View own certificates
- Change password
- View verifications of own certificates

### PUBLIC
- Verify certificate via QR code

## 📝 Usage Examples

### Create University (Admin)

```bash
curl -X POST http://localhost:3000/api/universities \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test University",
    "address": "123 Test Street, City",
    "contactEmail": "contact@univ-test.com",
    "phone": "+1 234 567 8900",
    "logoUrl": "https://example.com/logo.png"
  }'
```

### Create Student (University)

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_UNIVERSITY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "universityId": "university-uuid",
    "matricule": "TEST2024001",
    "email": "student1@test.com",
    "dateOfBirth": "2000-05-15",
    "major": "Computer Science",
    "photoUrl": "https://example.com/photo.jpg"
  }'
```

### Create Certificate (University)

```bash
curl -X POST http://localhost:3000/api/certificates \
  -H "Authorization: Bearer YOUR_UNIVERSITY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-uuid",
    "universityId": "university-uuid",
    "degreeTitle": "Master in Computer Science",
    "specialization": "Artificial Intelligence",
    "graduationDate": "2024-06-30",
    "pdfUrl": "https://example.com/diploma.pdf"
  }'
```

### Verify Certificate by QR Code (Public)

```bash
curl -X GET http://localhost:3000/api/certificates/verify/YOUR_QR_HASH
```

## 📂 Project Structure

```
src/
├── config/              # Configuration
│   ├── database.ts      # Prisma client
│   └── env.ts           # Environment variables
├── controllers/         # Controllers
│   ├── auth.controller.ts
│   ├── certificate.controller.ts
│   ├── student.controller.ts
│   ├── student-record.controller.ts
│   ├── university.controller.ts
│   └── verification.controller.ts
├── middleware/          # Middlewares
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── routes/              # API Routes
│   ├── auth.routes.ts
│   ├── certificate.routes.ts
│   ├── student.routes.ts
│   ├── student-record.routes.ts
│   ├── university.routes.ts
│   └── verification.routes.ts
├── services/            # Services
│   ├── auth.service.ts      # JWT & bcrypt
│   ├── email.service.ts     # Nodemailer
│   └── qrcode.service.ts    # QR generation
├── app.ts               # Express application
└── server.ts            # Entry point
```

## 🔐 Security

### Implemented Measures

- ✅ **Hashed passwords** with bcrypt (10 rounds)
- ✅ **JWT** with expiration
- ✅ **Data validation** with express-validator
- ✅ **CSRF protection** via Bearer token
- ✅ **Role-based authentication**
- ✅ **Email verification** before sending
- ✅ **Unique hash** for each certificate
- ✅ **SQL injection prevention** (Prisma)
- ✅ **Secure error handling**

### Best Practices

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Configure firewall
- Limit login attempts
- Back up database regularly
- Keep dependencies updated

## 🐛 Troubleshooting

### Database Connection Error

Verify that MySQL is running and credentials in `.env` are correct.

### SMTP Error

Verify your email configuration in `.env`:
- Use app password for Gmail
- Verify port (587 for TLS, 465 for SSL)
- Verify firewall doesn't block SMTP connections

### Prisma Error

```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npm run prisma:generate
```

## 📞 Support

For any questions or issues, consult the documentation or open an issue.

## 📄 License

MIT

---

**Developed with ❤️ to secure diploma authentication**

