# 🚀 Quick Start Guide - DiplomaVerif

This guide will help you get started with DiplomaVerif in a few minutes.

## ⚡ Quick Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the content below to a `.env` file at the project root:

```env
# MySQL Database
DATABASE_URL="mysql://root:password@localhost:3306/diplomaverif"

# JWT
JWT_SECRET="change_this_with_a_strong_secret_key"
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

**⚠️ Important:** 
- Replace `root:password` with your MySQL credentials
- Create a MySQL database named `diplomaverif`
- For Gmail, use an [app password](https://myaccount.google.com/apppasswords)

### 3. Create Database

```sql
CREATE DATABASE diplomaverif CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run Migrations

```bash
npm run prisma:migrate
```

### 6. Seed Test Data

```bash
npm run prisma:seed
```

This step creates:
- 10 universities
- 1 admin (admin@diplomaverif.com)
- 100 students
- 100 certificates with QR codes
- 50 verifications

**Default password**: `Password123!`

### 7. Start Server

```bash
npm run dev
```

Server starts on `http://localhost:3000`

## 🧪 Test the API

### 1. Login as Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diplomaverif.com","password":"Password123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "email": "admin@diplomaverif.com",
      "role": "ADMIN"
    }
  }
}
```

### 2. Get Your Profile

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. List Universities

```bash
curl -X GET http://localhost:3000/api/universities \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. List Students

```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Verify a Certificate by QR Code

```bash
curl -X GET http://localhost:3000/api/certificates/verify/QHASH_HERE
```

## 🎯 Next Steps

1. **Explore with Prisma Studio:**
   ```bash
   npm run prisma:studio
   ```
   Interface available at `http://localhost:5555`

2. **Read Complete Documentation:**
   See [README.md](README.md) for all details

3. **Create Your First University:**
   Use the API routes to create your own data

## ❓ Common Issues

### "Error: P1001: Can't reach database server"
- Verify MySQL is running
- Check credentials in `.env`

### "Error: P2002: Unique constraint failed"
- Data already exists
- Run `npx prisma migrate reset` to reset

### "SMTP Error"
- Check your email configuration
- For Gmail, use an app password

### Port already in use
- Change `PORT` in `.env`
- Or stop the process using port 3000

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Documentation](https://expressjs.com/)
- [JWT Documentation](https://jwt.io/)
- [Nodemailer Documentation](https://nodemailer.com/)

## 🎉 Ready!

Your DiplomaVerif platform is now operational. Happy coding! 🚀

