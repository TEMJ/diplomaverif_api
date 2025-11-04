# 🎓 DiplomaVerif - Plateforme de Vérification de Diplômes

Une plateforme complète de vérification de diplômes utilisant des QR codes pour sécuriser et authentifier les certificats universitaires.

## 📋 Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Migration de la Base de Données](#migration-de-la-base-de-données)
- [Seed des Données](#seed-des-données)
- [Démarrage](#démarrage)
- [API Endpoints](#api-endpoints)
- [Authentification](#authentification)
- [Rôles et Permissions](#rôles-et-permissions)
- [Exemples d'Utilisation](#exemples-dutilisation)
- [Structure du Projet](#structure-du-projet)
- [Sécurité](#sécurité)

## ✨ Fonctionnalités

### 🔐 Gestion des Utilisateurs
- **Authentification JWT** sécurisée avec bcrypt
- **Trois rôles**: Admin, Université, Étudiant
- **Création automatique** de comptes utilisateurs lors de la création d'universités/étudiants
- **Emails automatiques** avec mots de passe temporaires
- **Changement de mot de passe** sécurisé

### 🏫 Gestion des Universités
- CRUD complet pour les universités
- Gestion des logos et informations de contact
- Association automatique d'un compte utilisateur

### 👥 Gestion des Étudiants
- CRUD complet pour les étudiants
- **Filtrage par université et major**
- Matricules uniques
- Photos et informations personnelles
- Gestion des dossiers étudiants complets

### 📜 Gestion des Certificats/Diplômes
- CRUD complet pour les certificats
- **Génération automatique de QR codes**
- Hash unique pour chaque certificat
- Statut ACTIVE ou REVOKED
- Vérification publique via QR code

### 🔍 Vérifications
- Enregistrement de toutes les vérifications
- IP tracking et horodatage
- Notifications email aux étudiants
- Historique complet par certificat

### 📁 Dossiers Étudiants
- Assiduité (pourcentage)
- Évaluation disciplinaire
- Notes (PDF)
- Relevés de notes (PDF)
- Diplômes (PDF)

## 🏗 Architecture

```
DiplomaVerif/
├── prisma/
│   ├── schema.prisma       # Schéma de base de données
│   └── seed.ts             # Données de test
├── src/
│   ├── config/
│   │   ├── database.ts     # Configuration Prisma
│   │   └── env.ts          # Variables d'environnement
│   ├── controllers/        # Contrôleurs de logique métier
│   ├── middleware/         # Middlewares Express
│   ├── routes/             # Routes API
│   ├── services/           # Services (auth, email, qrcode)
│   ├── app.ts              # Configuration Express
│   └── server.ts           # Point d'entrée
├── uploads/                # Fichiers uploadés
├── .env                    # Configuration locale
└── package.json
```

## 🛠 Technologies

- **Runtime**: Node.js avec TypeScript
- **ORM**: Prisma
- **Base de données**: MySQL
- **Authentification**: JWT + bcrypt
- **Email**: Nodemailer
- **QR Codes**: qrcode
- **Framework**: Express.js
- **Validation**: express-validator

## 📦 Prérequis

- Node.js >= 18.x
- MySQL >= 8.0
- npm ou yarn
- Un compte email pour SMTP (ex: Gmail)

## 🚀 Installation

### 1. Cloner et Installer les Dépendances

```bash
cd "New folder"
npm install
```

### 2. Configuration de la Base de Données

Créez une base de données MySQL:

```sql
CREATE DATABASE diplomaverif CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configuration de l'Email (Gmail)

Pour utiliser Gmail comme service SMTP:

1. Activez l'**authentification à deux facteurs** sur votre compte Gmail
2. Générez un **mot de passe d'application**:
   - Aller sur https://myaccount.google.com/apppasswords
   - Créer un nouveau mot de passe d'application
   - Copier le mot de passe généré

## ⚙️ Configuration

### Fichier `.env`

Modifiez le fichier `.env` avec vos configurations:

```env
# Base de données MySQL
DATABASE_URL="mysql://username:password@localhost:3306/diplomaverif"

# JWT
JWT_SECRET="votre_secret_jwt_tres_securise_changez_cela_en_production"
JWT_EXPIRES_IN="7d"

# Email SMTP (exemple Gmail)
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

## 🗄 Migration de la Base de Données

Générer le client Prisma et appliquer les migrations:

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer et appliquer les migrations
npm run prisma:migrate
```

Cette commande va:
- Créer toutes les tables selon le schéma Prisma
- Appliquer les contraintes et index
- Créer les relations entre tables

## 🌱 Seed des Données

Populer la base de données avec des données de test:

```bash
npm run prisma:seed
```

Cette commande crée:
- ✅ 10 universités
- ✅ 1 administrateur (email: admin@diplomaverif.com)
- ✅ 10 utilisateurs universitaires
- ✅ 100 étudiants (10 par université)
- ✅ 100 utilisateurs étudiants
- ✅ 100 dossiers étudiants
- ✅ 100 certificats avec QR codes
- ✅ 50 vérifications

**Mot de passe par défaut pour tous les comptes**: `Password123!`

## ▶️ Démarrage

### Mode Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### Mode Production

```bash
# Compiler TypeScript
npm run build

# Démarrer le serveur
npm start
```

### Prisma Studio (Interface Graphique)

Pour visualiser et gérer la base de données:

```bash
npm run prisma:studio
```

Interface disponible sur `http://localhost:5555`

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### Authentification
```
POST   /api/auth/login              # Connexion
GET    /api/auth/me                 # Profil utilisateur
POST   /api/auth/change-password    # Changer le mot de passe
```

### Universités
```
GET    /api/universities            # Liste des universités
GET    /api/universities/:id        # Détails d'une université
POST   /api/universities            # Créer (ADMIN)
PUT    /api/universities/:id        # Modifier (ADMIN)
DELETE /api/universities/:id        # Supprimer (ADMIN)
```

### Étudiants
```
GET    /api/students                # Liste des étudiants
GET    /api/students/:id            # Détails d'un étudiant
POST   /api/students                # Créer (UNIVERSITY, ADMIN)
PUT    /api/students/:id            # Modifier (UNIVERSITY, ADMIN)
DELETE /api/students/:id            # Supprimer (ADMIN)

# Filtres disponibles:
GET /api/students?universityId=xxx
GET /api/students?major=Informatique
GET /api/students?page=1&limit=20
```

### Certificats
```
GET    /api/certificates                      # Liste des certificats
GET    /api/certificates/:id                  # Détails d'un certificat
POST   /api/certificates                      # Créer (UNIVERSITY, ADMIN)
PUT    /api/certificates/:id                  # Modifier (UNIVERSITY, ADMIN)
PATCH  /api/certificates/:id/revoke           # Révoquer (UNIVERSITY, ADMIN)
DELETE /api/certificates/:id                  # Supprimer (ADMIN)
GET    /api/certificates/verify/:qrHash       # Vérifier par QR (PUBLIC)

# Filtres disponibles:
GET /api/certificates?studentId=xxx
GET /api/certificates?universityId=xxx
GET /api/certificates?status=ACTIVE
GET /api/certificates?page=1&limit=20
```

### Vérifications
```
GET    /api/verifications           # Liste des vérifications
GET    /api/verifications/:id       # Détails d'une vérification
POST   /api/verifications           # Créer
DELETE /api/verifications/:id       # Supprimer (ADMIN)

# Filtres disponibles:
GET /api/verifications?certificateId=xxx
GET /api/verifications?page=1&limit=20
```

### Dossiers Étudiants
```
GET    /api/student-records                    # Liste des dossiers
GET    /api/student-records/:id                # Détails d'un dossier
GET    /api/student-records/student/:studentId # Par étudiant
POST   /api/student-records                    # Créer (UNIVERSITY, ADMIN)
PUT    /api/student-records/:id                # Modifier (UNIVERSITY, ADMIN)
DELETE /api/student-records/:id                # Supprimer (ADMIN)
```

## 🔒 Authentification

Toutes les routes (sauf `/api/auth/login` et `/api/certificates/verify/:qrHash`) nécessitent un token JWT dans le header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Exemple de Connexion

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
  "message": "Connexion réussie",
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

## 👥 Rôles et Permissions

### ADMIN
- Accès complet à toutes les ressources
- CRUD sur universités, étudiants, certificats, etc.
- Suppression de ressources
- Création d'administrateurs

### UNIVERSITY
- Voir ses propres données et étudiants
- Créer et gérer des étudiants
- Créer et gérer des certificats
- Voir les vérifications de ses certificats
- Gérer les dossiers étudiants

### STUDENT
- Voir ses propres données
- Voir ses certificats
- Changer son mot de passe
- Voir les vérifications de ses certificats

### PUBLIC
- Vérifier un certificat via QR code

## 📝 Exemples d'Utilisation

### Créer une Université (Admin)

```bash
curl -X POST http://localhost:3000/api/universities \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Université de Test",
    "address": "123 Rue de Test, Paris",
    "contactEmail": "contact@univ-test.fr",
    "phone": "+33 1 23 45 67 89",
    "logoUrl": "https://example.com/logo.png"
  }'
```

### Créer un Étudiant (Université)

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_UNIVERSITY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "universityId": "university-uuid",
    "matricule": "TEST2024001",
    "email": "etudiant1@test.fr",
    "dateOfBirth": "2000-05-15",
    "major": "Informatique",
    "photoUrl": "https://example.com/photo.jpg"
  }'
```

### Créer un Certificat (Université)

```bash
curl -X POST http://localhost:3000/api/certificates \
  -H "Authorization: Bearer YOUR_UNIVERSITY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-uuid",
    "universityId": "university-uuid",
    "degreeTitle": "Master en Informatique",
    "specialization": "Intelligence Artificielle",
    "graduationDate": "2024-06-30",
    "pdfUrl": "https://example.com/diploma.pdf"
  }'
```

### Vérifier un Certificat par QR Code (Public)

```bash
curl -X GET http://localhost:3000/api/certificates/verify/YOUR_QR_HASH
```

## 📂 Structure du Projet

```
src/
├── config/              # Configuration
│   ├── database.ts      # Client Prisma
│   └── env.ts           # Variables d'environnement
├── controllers/         # Contrôleurs
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
├── routes/              # Routes API
│   ├── auth.routes.ts
│   ├── certificate.routes.ts
│   ├── student.routes.ts
│   ├── student-record.routes.ts
│   ├── university.routes.ts
│   └── verification.routes.ts
├── services/            # Services
│   ├── auth.service.ts      # JWT & bcrypt
│   ├── email.service.ts     # Nodemailer
│   └── qrcode.service.ts    # Génération QR
├── app.ts               # Application Express
└── server.ts            # Point d'entrée
```

## 🔐 Sécurité

### Mesures Implémentées

- ✅ **Mots de passe hashés** avec bcrypt (10 rounds)
- ✅ **JWT** avec expiration
- ✅ **Validation des données** avec express-validator
- ✅ **Protection CSRF** via token Bearer
- ✅ **Authentification basée sur les rôles**
- ✅ **Email vérifié** avant envoi
- ✅ **Hash unique** pour chaque certificat
- ✅ **Prévention des attaques** par injection SQL (Prisma)
- ✅ **Gestion des erreurs** sécurisée

### Bonnes Pratiques

- Changez le `JWT_SECRET` en production
- Utilisez HTTPS en production
- Configurez un firewall
- Limitez les tentatives de connexion
- Sauvegardez régulièrement la base de données
- Gardez les dépendances à jour

## 🐛 Dépannage

### Erreur de Connexion à la Base de Données

Vérifiez que MySQL est démarré et que les credentials dans `.env` sont corrects.

### Erreur SMTP

Vérifiez votre configuration email dans `.env`:
- Utiliser un mot de passe d'application pour Gmail
- Vérifier le port (587 pour TLS, 465 pour SSL)
- Vérifier que le firewall n bloque pas les connexions SMTP

### Erreur Prisma

```bash
# Réinitialiser la base de données
npx prisma migrate reset

# Régénérer le client
npm run prisma:generate
```

## 📞 Support

Pour toute question ou problème, consultez la documentation ou ouvrez une issue.

## 📄 Licence

MIT

---

**Développé avec ❤️ pour sécuriser l'authentification des diplômes**

