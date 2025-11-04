# 🚀 Guide de Démarrage Rapide - DiplomaVerif

Ce guide vous aidera à démarrer rapidement DiplomaVerif en quelques minutes.

## ⚡ Installation Rapide

### 1. Installer les Dépendances

```bash
npm install
```

### 2. Configurer l'Environnement

Copiez le contenu ci-dessous dans un fichier `.env` à la racine du projet:

```env
# Base de données MySQL
DATABASE_URL="mysql://root:password@localhost:3306/diplomaverif"

# JWT
JWT_SECRET="changez_cela_par_une_cle_secrete_forte"
JWT_EXPIRES_IN="7d"

# Email SMTP (Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="votre_email@gmail.com"
SMTP_PASSWORD="votre_mot_de_passe_application"
SMTP_FROM="DiplomaVerif <noreply@diplomaverif.com>"

# Serveur
PORT=3000
NODE_ENV="development"
BASE_URL="http://localhost:3000"

# Stockage
UPLOAD_DIR="./uploads"
```

**⚠️ Important:** 
- Remplacez `root:password` par vos identifiants MySQL
- Créez une base de données MySQL nommée `diplomaverif`
- Pour Gmail, utilisez un [mot de passe d'application](https://myaccount.google.com/apppasswords)

### 3. Créer la Base de Données

```sql
CREATE DATABASE diplomaverif CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Générer le Client Prisma

```bash
npm run prisma:generate
```

### 5. Exécuter les Migrations

```bash
npm run prisma:migrate
```

### 6. Seed les Données de Test

```bash
npm run prisma:seed
```

Cette étape crée:
- 10 universités
- 1 admin (admin@diplomaverif.com)
- 100 étudiants
- 100 certificats avec QR codes
- 50 vérifications

**Mot de passe par défaut**: `Password123!`

### 7. Démarrer le Serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 🧪 Tester l'API

### 1. Connexion en tant qu'Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diplomaverif.com","password":"Password123!"}'
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "email": "admin@diplomaverif.com",
      "role": "ADMIN"
    }
  }
}
```

### 2. Récupérer votre Profil

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 3. Lister les Universités

```bash
curl -X GET http://localhost:3000/api/universities \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 4. Lister les Étudiants

```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 5. Vérifier un Certificat par QR Code

```bash
curl -X GET http://localhost:3000/api/certificates/verify/QHASH_AQUI
```

## 🎯 Prochaines Étapes

1. **Explorer avec Prisma Studio:**
   ```bash
   npm run prisma:studio
   ```
   Interface disponible sur `http://localhost:5555`

2. **Consulter la Documentation Complète:**
   Lisez le [README.md](README.md) pour tous les détails

3. **Créer votre Première Université:**
   Utilisez les routes API pour créer vos propres données

## ❓ Problèmes Courants

### "Error: P1001: Can't reach database server"
- Vérifiez que MySQL est démarré
- Vérifiez les credentials dans `.env`

### "Error: P2002: Unique constraint failed"
- Les données existent déjà
- Exécutez `npx prisma migrate reset` pour réinitialiser

### "SMTP Error"
- Vérifiez votre configuration email
- Pour Gmail, utilisez un mot de passe d'application

### Port déjà utilisé
- Changez le `PORT` dans `.env`
- Ou arrêtez le processus utilisant le port 3000

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Express](https://expressjs.com/)
- [Documentation JWT](https://jwt.io/)
- [Documentation Nodemailer](https://nodemailer.com/)

## 🎉 C'est Prêt!

Votre plateforme DiplomaVerif est maintenant opérationnelle. Bon développement! 🚀

