# ⚡ Quick Start - DiplomaVerif

## 🚀 Installation in 5 Minutes

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with:
DATABASE_URL="mysql://user:password@localhost:3306/diplomaverif"
JWT_SECRET="your_secret_key"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"
SMTP_FROM="DiplomaVerif <noreply@diplomaverif.com>"
PORT=3000
BASE_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"

# 3. Create MySQL database
mysql -u root -p
CREATE DATABASE diplomaverif CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 4. Generate Prisma client
npm run prisma:generate

# 5. Apply migrations
npm run prisma:migrate

# 6. Populate with test data
npm run prisma:seed

# 7. Start server
npm run dev
```

Server starts on `http://localhost:3000`

## 🔑 Test Credentials

**Admin:**
- Email: `admin@diplomaverif.com`
- Password: `Password123!`

**Universities:**
- Check console after seed for emails
- Password: `Password123!`

**Students:**
- Check console after seed for emails
- Password: `Password123!`

## 🧪 Quick Test

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diplomaverif.com","password":"Password123!"}'

# 2. Copy token from response

# 3. Test protected route
curl -X GET http://localhost:3000/api/universities \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Verify certificate (public)
curl -X GET http://localhost:3000/api/certificates/verify/QHASH_FROM_CERTIFICATE
```

## 📚 Documentation

- **README.md** - Complete documentation
- **SETUP.md** - Detailed installation guide
- **API.md** - Complete API reference
- **USAGE.md** - Usage guide
- **PROJECT_SUMMARY.md** - Project overview

## 🛠 Useful Commands

```bash
npm run dev           # Development
npm run build         # Compile
npm start            # Production
npm run prisma:studio # Database GUI
```

## ❗ Common Issues

**MySQL connection failed:**
```bash
# Check MySQL is running
# Check DATABASE_URL in .env
```

**Port already in use:**
```bash
# Change PORT in .env
```

**Migration error:**
```bash
# Reset: npx prisma migrate reset
```

## ✅ Checklist

- [ ] MySQL installed and running
- [ ] Database created
- [ ] .env configured
- [ ] Dependencies installed
- [ ] Migrations applied
- [ ] Data seeded
- [ ] Server started
- [ ] First test successful

---

**Ready! 🎉** See other documents for more details.

