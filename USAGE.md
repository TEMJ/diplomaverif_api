# 📖 Guide d'Utilisation - DiplomaVerif

Ce guide explique comment utiliser DiplomaVerif pour gérer vos diplômes et certificats.

## 👤 Utilisateur: Admin

### Responsabilités
- Gestion globale du système
- Création/suppression des universités
- Supervision de tous les étudiants et certificats

### Actions Principales

#### 1. Se Connecter
```
POST /api/auth/login
Email: admin@diplomaverif.com
Password: Password123!
```

#### 2. Créer une Université
```bash
POST /api/universities
{
  "name": "Université de Technologie",
  "address": "123 Rue de la Science",
  "contactEmail": "contact@ut.fr",
  "phone": "+33 1 23 45 67 89"
}
```
→ Un compte utilisateur est automatiquement créé pour cette université

#### 3. Lister les Certificats
```bash
GET /api/certificates?page=1&limit=50
```

#### 4. Supprimer une Ressource
```bash
DELETE /api/universities/{id}
DELETE /api/students/{id}
DELETE /api/certificates/{id}
```

## 🏫 Utilisateur: Université

### Responsabilités
- Gérer ses étudiants
- Délivrer des certificats
- Uploader les dossiers étudiants

### Actions Principales

#### 1. Se Connecter
```
POST /api/auth/login
Email: (email de contact de l'université)
Password: (mot de passe temporaire reçu par email)
```

#### 2. Créer un Étudiant
```bash
POST /api/students
{
  "universityId": "votre-universite-id",
  "matricule": "STUD2024001",
  "email": "etudiant@mail.com",
  "dateOfBirth": "2000-05-15",
  "major": "Informatique",
  "photoUrl": "https://example.com/photo.jpg"
}
```
→ Un compte étudiant est automatiquement créé

#### 3. Uploader le Dossier Étudiant
```bash
POST /api/student-records
{
  "studentId": "student-id",
  "attendance": 85,
  "discipline": "Excellent comportement",
  "gradesPdfUrl": "https://votre-domaine.com/grades-123.pdf",
  "transcriptPdfUrl": "https://votre-domaine.com/transcript-123.pdf",
  "diplomaPdfUrl": "https://votre-domaine.com/diploma-123.pdf"
}
```

#### 4. Délivrer un Certificat
```bash
POST /api/certificates
{
  "studentId": "student-id",
  "universityId": "votre-universite-id",
  "degreeTitle": "Master en Informatique",
  "specialization": "Intelligence Artificielle",
  "graduationDate": "2024-06-30",
  "pdfUrl": "https://votre-domaine.com/diploma.pdf"
}
```
→ Un QR code est automatiquement généré et attaché

#### 5. Révoquer un Certificat
```bash
PATCH /api/certificates/{id}/revoke
```
→ Le certificat devient non valide pour les vérifications

#### 6. Lister ses Étudiants
```bash
GET /api/students?universityId=votre-id
```

#### 7. Filtrer par Major
```bash
GET /api/students?major=Informatique
```

## 🎓 Utilisateur: Étudiant

### Responsabilités
- Consulter ses diplômes
- Voir les vérifications de ses certificats

### Actions Principales

#### 1. Se Connecter
```
POST /api/auth/login
Email: (email d'étudiant)
Password: (mot de passe temporaire reçu par email)
```

#### 2. Voir son Profil
```bash
GET /api/auth/me
```

#### 3. Lister ses Certificats
```bash
GET /api/certificates?studentId=votre-id
```

#### 4. Voir son Dossier
```bash
GET /api/student-records/student/votre-id
```

#### 5. Voir les Vérifications de ses Certificats
```bash
GET /api/verifications?certificateId=cert-id
```

#### 6. Changer son Mot de Passe
```bash
POST /api/auth/change-password
{
  "currentPassword": "ancien",
  "newPassword": "nouveau"
}
```

## 🌐 Utilisateur: Public (Entreprises)

### Responsabilités
- Vérifier l'authenticité d'un diplôme via QR code

### Actions Principales

#### 1. Scanner le QR Code
- Recevoir un QR code de l'étudiant
- Scanner le code avec un lecteur QR

#### 2. Vérifier le Certificat
```bash
GET /api/certificates/verify/{qrHash}
```

**Réponse Possible:**

✅ **Certificat Valide:**
```json
{
  "success": true,
  "message": "Certificat valide",
  "data": {
    "certificate": {
      "degreeTitle": "Master en Informatique",
      "specialization": "IA",
      "status": "ACTIVE",
      "student": { ... },
      "university": { ... }
    },
    "verification": {
      "id": "...",
      "verificationDate": "2024-01-15T10:30:00Z"
    }
  }
}
```

❌ **Certificat Révoqué:**
```json
{
  "success": true,
  "message": "Certificat révoqué",
  "data": {
    "certificate": {
      "status": "REVOKED"
    }
  }
}
```

❌ **Certificat Introuvable:**
```json
{
  "success": false,
  "message": "Certificat introuvable ou hash invalide"
}
```

#### 3. Enregistrer la Vérification (Optionnel)
```bash
POST /api/verifications
Authorization: Bearer {token}
{
  "certificateId": "cert-id",
  "companyName": "Mon Entreprise",
  "email": "hr@mon-entreprise.com",
  "reason": "Vérification pré-emploi"
}
```
→ L'étudiant reçoit une notification par email

## 🔍 Workflows Complets

### Workflow: Délivrance d'un Diplôme

1. **Université**: Créer l'étudiant
2. **Université**: Uploader le dossier étudiant (notes, transcript)
3. **Université**: Délivrer le certificat → QR code généré
4. **Étudiant**: Consulter son certificat et QR code
5. **Entreprise**: Scanner le QR code et vérifier

### Workflow: Vérification d'un Diplôme

1. **Étudiant**: Présenter son QR code à l'employeur
2. **Entreprise**: Scanner le QR code
3. **Système**: Récupérer et afficher les informations du certificat
4. **Entreprise**: Confirmer l'authenticité
5. **Étudiant**: Reçoit une notification par email

### Workflow: Révoquer un Diplôme

1. **Université/Admin**: Détecter une fraude
2. **Université/Admin**: Révoquer le certificat
3. **Système**: Le certificat devient non valide
4. **Entreprises**: Vérifications futures indiquent "REVOKED"

## 📊 Statistiques et Rapports

### Pour une Université

```bash
# Nombre d'étudiants par major
GET /api/students?universityId={id}&major=Informatique

# Certificats délivrés
GET /api/certificates?universityId={id}

# Taux de vérifications
GET /api/verifications?certificateId={id}
```

### Pour un Étudiant

```bash
# Mes certificats
GET /api/certificates?studentId={id}

# Mon dossier
GET /api/student-records/student/{id}

# Vérifications de mes diplômes
GET /api/verifications?certificateId={id}
```

## 🔐 Bonnes Pratiques

### Sécurité
- ✅ Changez votre mot de passe après la première connexion
- ✅ Utilisez un mot de passe fort (min 8 caractères)
- ✅ Ne partagez jamais votre QR code publiquement
- ✅ Vérifiez l'URL lors des vérifications

### Gestion
- ✅ Vérifiez régulièrement la validité des certificats
- ✅ Révoquez immédiatement en cas de fraude
- ✅ Conservez les preuves de toute activité suspecte
- ✅ Sauvegardez régulièrement vos données

### Communication
- ✅ Notifiez les étudiants de toute révocation
- ✅ Informez des changements de contact
- ✅ Partagez les statistiques anonymes

## 🆘 Support

En cas de problème:
1. Consultez le [README.md](README.md)
2. Vérifiez la documentation API ([API.md](API.md))
3. Contactez l'administrateur système
4. Consultez les logs du serveur

## 📚 Ressources Additionnelles

- [Guide d'Installation](SETUP.md)
- [Référence API](API.md)
- [Documentation Complète](README.md)

---

**Besoin d'aide?** Contactez support@diplomaverif.com

