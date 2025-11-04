# ⚡ Quick Start - DiplomaVerif

## 🚀 Installation en 5 Minutes

```bash
# 1. Installer les dépendances
npm install

# 2. Créer un fichier .env avec:
DATABASE_URL="mysql://user:password@localhost:3306/diplomaverif"
JWT_SECRET="votre_cle_secrete"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="votre_email@gmail.com"
SMTP_PASSWORD="votre_mot_de_passe_app"
SMTP_FROM="DiplomaVerif <noreply@diplomaverif.com>"
PORT=3000
BASE_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"

# 3. Créer la base de données MySQL
mysql -u root -p
CREATE DATABASE diplomaverif CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 4. Générer Prisma client
npm run prisma:generate

# 5. Appliquer les migrations
npm run prisma:migrate

# 6. Peupler avec des données de test
npm run prisma:seed

# 7. Démarrer le serveur
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 🔑 Credentials de Test

**Admin:**
- Email: `admin@diplomaverif.com`
- Password: `Password123!`

**Universités:**
- Voir la console après le seed pour les emails
- Password: `Password123!`

**Étudiants:**
- Voir la console après le seed pour les emails
- Password: `Password123!`

## 🧪 Test Rapide

```bash
# 1. Se connecter
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diplomaverif.com","password":"Password123!"}'

# 2. Copier le token de la réponse

# 3. Tester une route protégée
curl -X GET http://localhost:3000/api/universities \
  -H "Authorization: Bearer VOTRE_TOKEN"

# 4. Vérifier un certificat (public)
curl -X GET http://localhost:3000/api/certificates/verify/QHASH_D_UN_CERTIFICAT
```

## 📚 Documentation

- **README.md** - Documentation complète
- **SETUP.md** - Guide d'installation détaillé
- **API.md** - Référence API complète
- **USAGE.md** - Guide d'utilisation
- **PROJECT_SUMMARY.md** - Vue d'ensemble du projet

## 🛠 Commandes Utiles

```bash
npm run dev           # Développement
npm run build         # Compiler
npm start            # Production
npm run prisma:studio # Interface graphique DB
```

## ❗ Problèmes Courants

**MySQL connection failed:**
```bash
# Vérifier que MySQL tourne
# Vérifier DATABASE_URL dans .env
```

**Port already in use:**
```bash
# Changer PORT dans .env
```

**Migration error:**
```bash
# Réinitialiser: npx prisma migrate reset
```

## ✅ Checklist

- [ ] MySQL installé et démarré
- [ ] Base de données créée
- [ ] .env configuré
- [ ] Dépendances installées
- [ ] Migrations appliquées
- [ ] Données seedées
- [ ] Serveur démarré
- [ ] Premier test réussi

---

**Prêt! 🎉** Consultez les autres documents pour plus de détails.

