# 📡 API Reference - DiplomaVerif

Documentation complète des endpoints API de DiplomaVerif.

## 🔐 Authentification

### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@diplomaverif.com",
  "password": "Password123!"
}
```

**Réponse:** `200 OK`
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "email": "admin@diplomaverif.com",
      "role": "ADMIN"
    }
  }
}
```

### Profil Utilisateur
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Changer le Mot de Passe
```http
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "ancien",
  "newPassword": "nouveau"
}
```

## 🏫 Universités

### Liste des Universités
```http
GET /api/universities
Authorization: Bearer {token}
```

**Filtres:** Aucun

### Détails d'une Université
```http
GET /api/universities/{id}
Authorization: Bearer {token}
```

### Créer une Université (ADMIN)
```http
POST /api/universities
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Université de Test",
  "address": "123 Rue de Test",
  "contactEmail": "contact@test.fr",
  "phone": "+33 1 23 45 67 89",
  "logoUrl": "https://example.com/logo.png"
}
```

### Modifier une Université (ADMIN)
```http
PUT /api/universities/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nouveau Nom"
}
```

### Supprimer une Université (ADMIN)
```http
DELETE /api/universities/{id}
Authorization: Bearer {token}
```

## 👥 Étudiants

### Liste des Étudiants
```http
GET /api/students?universityId={id}&major={major}&page=1&limit=20
Authorization: Bearer {token}
```

**Filtres:**
- `universityId`: Filtrer par université
- `major`: Filtrer par major
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

### Détails d'un Étudiant
```http
GET /api/students/{id}
Authorization: Bearer {token}
```

### Créer un Étudiant (UNIVERSITY, ADMIN)
```http
POST /api/students
Authorization: Bearer {token}
Content-Type: application/json

{
  "universityId": "univ-uuid",
  "matricule": "STUD2024001",
  "email": "etudiant@test.fr",
  "dateOfBirth": "2000-05-15",
  "major": "Informatique",
  "photoUrl": "https://example.com/photo.jpg"
}
```

### Modifier un Étudiant (UNIVERSITY, ADMIN)
```http
PUT /api/students/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "major": "Mathématiques"
}
```

### Supprimer un Étudiant (ADMIN)
```http
DELETE /api/students/{id}
Authorization: Bearer {token}
```

## 📜 Certificats

### Liste des Certificats
```http
GET /api/certificates?studentId={id}&universityId={id}&status={ACTIVE|REVOKED}&page=1&limit=20
Authorization: Bearer {token}
```

**Filtres:**
- `studentId`: Filtrer par étudiant
- `universityId`: Filtrer par université
- `status`: Filtrer par statut (ACTIVE, REVOKED)
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

### Détails d'un Certificat
```http
GET /api/certificates/{id}
Authorization: Bearer {token}
```

### Créer un Certificat (UNIVERSITY, ADMIN)
```http
POST /api/certificates
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "student-uuid",
  "universityId": "univ-uuid",
  "degreeTitle": "Master en Informatique",
  "specialization": "IA",
  "graduationDate": "2024-06-30",
  "pdfUrl": "https://example.com/diploma.pdf"
}
```

**Note:** Le QR code est généré automatiquement

### Modifier un Certificat (UNIVERSITY, ADMIN)
```http
PUT /api/certificates/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "REVOKED"
}
```

### Révoquer un Certificat (UNIVERSITY, ADMIN)
```http
PATCH /api/certificates/{id}/revoke
Authorization: Bearer {token}
```

### Supprimer un Certificat (ADMIN)
```http
DELETE /api/certificates/{id}
Authorization: Bearer {token}
```

### Vérifier un Certificat (PUBLIC)
```http
GET /api/certificates/verify/{qrHash}
```

**Réponse:** `200 OK`
```json
{
  "success": true,
  "message": "Certificat valide",
  "data": {
    "certificate": {
      "degreeTitle": "Master en Informatique",
      "specialization": "IA",
      "status": "ACTIVE"
    }
  }
}
```

## 🔍 Vérifications

### Liste des Vérifications
```http
GET /api/verifications?certificateId={id}&page=1&limit=20
Authorization: Bearer {token}
```

### Détails d'une Vérification
```http
GET /api/verifications/{id}
Authorization: Bearer {token}
```

### Créer une Vérification
```http
POST /api/verifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "certificateId": "cert-uuid",
  "companyName": "TechCorp",
  "email": "hr@techcorp.com",
  "reason": "Vérification pré-emploi"
}
```

### Supprimer une Vérification (ADMIN)
```http
DELETE /api/verifications/{id}
Authorization: Bearer {token}
```

## 📁 Dossiers Étudiants

### Liste des Dossiers
```http
GET /api/student-records?studentId={id}&page=1&limit=20
Authorization: Bearer {token}
```

### Détails d'un Dossier
```http
GET /api/student-records/{id}
Authorization: Bearer {token}
```

### Dossier par Étudiant
```http
GET /api/student-records/student/{studentId}
Authorization: Bearer {token}
```

### Créer un Dossier (UNIVERSITY, ADMIN)
```http
POST /api/student-records
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "student-uuid",
  "attendance": 85,
  "discipline": "Excellent comportement",
  "gradesPdfUrl": "https://example.com/grades.pdf",
  "transcriptPdfUrl": "https://example.com/transcript.pdf",
  "diplomaPdfUrl": "https://example.com/diploma.pdf"
}
```

### Modifier un Dossier (UNIVERSITY, ADMIN)
```http
PUT /api/student-records/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "attendance": 90
}
```

### Supprimer un Dossier (ADMIN)
```http
DELETE /api/student-records/{id}
Authorization: Bearer {token}
```

## 🚨 Codes d'Erreur

| Code | Description |
|------|-------------|
| 200  | Succès |
| 201  | Créé avec succès |
| 400  | Requête invalide |
| 401  | Non authentifié |
| 403  | Accès interdit |
| 404  | Ressource introuvable |
| 409  | Conflit (doublon) |
| 500  | Erreur serveur |

## 📝 Format des Réponses

### Succès
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { ... }
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

### Liste Paginée
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "totalPages": 10,
  "data": [ ... ]
}
```

## 🔒 Permissions

| Endpoint | ADMIN | UNIVERSITY | STUDENT | PUBLIC |
|----------|-------|------------|---------|--------|
| Login    |  ✅   |       ✅  |     ✅  |    ✅ |
| Me        | ✅    |      ✅   |   ✅    | ❌  |
| Universities (GET) | ✅ | ✅ | ✅ | ❌ |
| Universities (POST/PUT/DELETE) | ✅ | ❌ | ❌ | ❌ |
| Students (GET) | ✅ | ✅ | ✅ | ❌ |
| Students (POST/PUT) | ✅ | ✅ | ❌ | ❌ |
| Students (DELETE) | ✅ | ❌ | ❌ | ❌ |
| Certificates (GET) | ✅ | ✅ | ✅ | ❌ |
| Certificates (POST/PUT/REVOKE) | ✅ | ✅ | ❌ | ❌ |
| Certificates (DELETE) | ✅ | ❌ | ❌ | ❌ |
| Certificates Verify | ✅ | ✅ | ✅ | ✅ |
| Verifications (GET/POST) | ✅ | ✅ | ✅ | ❌ |
| Verifications (DELETE) | ✅ | ❌ | ❌ | ❌ |
| Records (GET) | ✅ | ✅ | ✅ | ❌ |
| Records (POST/PUT) | ✅ | ✅ | ❌ | ❌ |
| Records (DELETE) | ✅ | ❌ | ❌ | ❌ |

## 🔗 Exemples

### Workflow Complet

1. **Connexion**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diplomaverif.com","password":"Password123!"}'
```

2. **Créer une Université**
```bash
curl -X POST http://localhost:3000/api/universities \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

3. **Créer un Étudiant**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

4. **Créer un Certificat**
```bash
curl -X POST http://localhost:3000/api/certificates \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

5. **Vérifier le Certificat**
```bash
curl -X GET http://localhost:3000/api/certificates/verify/{qrHash}
```

Pour plus d'informations, consultez le [README.md](README.md).

