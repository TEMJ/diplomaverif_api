# 📡 API Reference - DiplomaVerif

Complete documentation of DiplomaVerif API endpoints.

## 🔐 Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@diplomaverif.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
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

### User Profile
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Change Password
```
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "old",
  "newPassword": "new"
}
```

## 🏫 Universities

### Universities List
```http
GET /api/universities
Authorization: Bearer {token}
```

**Filters:** None

### University Details
```http
GET /api/universities/{id}
Authorization: Bearer {token}
```

### Create University (ADMIN)
```http
POST /api/universities
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Test University",
  "address": "123 Test Street",
  "contactEmail": "contact@test.com",
  "phone": "+1 234 567 8900",
  "logoUrl": "https://example.com/logo.png"
}
```

### Update University (ADMIN)
```http
PUT /api/universities/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Name"
}
```

### Delete University (ADMIN)
```http
DELETE /api/universities/{id}
Authorization: Bearer {token}
```

## 👥 Students

### Students List
```http
GET /api/students?universityId={id}&major={major}&page=1&limit=20
Authorization: Bearer {token}
```

**Filters:**
- `universityId`: Filter by university
- `major`: Filter by major
- `page`: Page number
- `limit`: Items per page

### Student Details
```http
GET /api/students/{id}
Authorization: Bearer {token}
```

### Create Student (UNIVERSITY, ADMIN)
```http
POST /api/students
Authorization: Bearer {token}
Content-Type: application/json

{
  "universityId": "univ-uuid",
  "matricule": "STUD2024001",
  "email": "student@test.com",
  "dateOfBirth": "2000-05-15",
  "major": "Computer Science",
  "photoUrl": "https://example.com/photo.jpg"
}
```

### Update Student (UNIVERSITY, ADMIN)
```http
PUT /api/students/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "major": "Mathematics"
}
```

### Delete Student (ADMIN)
```http
DELETE /api/students/{id}
Authorization: Bearer {token}
```

## 📜 Certificates

### Certificates List
```http
GET /api/certificates?studentId={id}&universityId={id}&status={ACTIVE|REVOKED}&page=1&limit=20
Authorization: Bearer {token}
```

**Filters:**
- `studentId`: Filter by student
- `universityId`: Filter by university
- `status`: Filter by status (ACTIVE, REVOKED)
- `page`: Page number
- `limit`: Items per page

### Certificate Details
```http
GET /api/certificates/{id}
Authorization: Bearer {token}
```

### Download Certificate PDF
```http
GET /api/certificates/{id}/pdf
Authorization: Bearer {token}
```
Returns the certificate as a PDF file. Students can only download their own certificate.

### Download Transcript PDF (Relevé de notes)
```http
GET /api/certificates/{id}/transcript
Authorization: Bearer {token}
```
Returns a PDF transcript with all grades for the certificate's student (module code, name, credits, mark, date; final mark and classification). Students can only download their own transcript.

**Student page – two download buttons:** On the student's certificate detail view, expose two actions:
- **Certificate** → `GET /api/certificates/{id}/pdf` (diplôme)
- **Transcript** → `GET /api/certificates/{id}/transcript` (relevé de notes)

Example (trigger download with Bearer token):
```javascript
// Certificate button: open or download PDF
window.open(`${API_BASE}/api/certificates/${certificateId}/pdf?token=${token}`, '_blank');
// Or use fetch + blob to force download with filename
const res = await fetch(`${API_BASE}/api/certificates/${certificateId}/pdf`, {
  headers: { Authorization: `Bearer ${token}` }
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href = url; a.download = 'certificate.pdf'; a.click();

// Transcript button: same pattern with /transcript
const resT = await fetch(`${API_BASE}/api/certificates/${certificateId}/transcript`, {
  headers: { Authorization: `Bearer ${token}` }
});
const blobT = await resT.blob();
const urlT = URL.createObjectURL(blobT);
const aT = document.createElement('a'); aT.href = urlT; aT.download = 'transcript.pdf'; aT.click();
```

### Create Certificate (UNIVERSITY, ADMIN)
```http
POST /api/certificates
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "student-uuid",
  "universityId": "univ-uuid",
  "degreeTitle": "Master in Computer Science",
  "specialization": "AI",
  "graduationDate": "2024-06-30",
  "pdfUrl": "https://example.com/diploma.pdf"
}
```

**Note:** QR code is generated automatically

### Update Certificate (UNIVERSITY, ADMIN)
```http
PUT /api/certificates/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "REVOKED"
}
```

### Revoke Certificate (UNIVERSITY, ADMIN)
```http
PATCH /api/certificates/{id}/revoke
Authorization: Bearer {token}
```

### Delete Certificate (ADMIN)
```http
DELETE /api/certificates/{id}
Authorization: Bearer {token}
```

### Verify Certificate (PUBLIC)
```http
GET /api/certificates/verify/{qrHash}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Certificate valid",
  "data": {
    "certificate": {
      "degreeTitle": "Master in Computer Science",
      "specialization": "AI",
      "status": "ACTIVE"
    }
  }
}
```

## 🔍 Verifications

### Verifications List
```http
GET /api/verifications?certificateId={id}&page=1&limit=20
Authorization: Bearer {token}
```

### Verification Details
```http
GET /api/verifications/{id}
Authorization: Bearer {token}
```

### Create Verification
```http
POST /api/verifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "certificateId": "cert-uuid",
  "companyName": "TechCorp",
  "email": "hr@techcorp.com",
  "reason": "Pre-employment verification"
}
```

### Delete Verification (ADMIN)
```http
DELETE /api/verifications/{id}
Authorization: Bearer {token}
```

## 📁 Student Records

### Records List
```http
GET /api/student-records?studentId={id}&page=1&limit=20
Authorization: Bearer {token}
```

### Record Details
```http
GET /api/student-records/{id}
Authorization: Bearer {token}
```

### Record by Student
```http
GET /api/student-records/student/{studentId}
Authorization: Bearer {token}
```

### Create Record (UNIVERSITY, ADMIN)
```http
POST /api/student-records
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "student-uuid",
  "attendance": 85,
  "discipline": "Excellent behavior",
  "gradesPdfUrl": "https://example.com/grades.pdf",
  "transcriptPdfUrl": "https://example.com/transcript.pdf",
  "diplomaPdfUrl": "https://example.com/diploma.pdf"
}
```

### Update Record (UNIVERSITY, ADMIN)
```http
PUT /api/student-records/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "attendance": 90
}
```

### Delete Record (ADMIN)
```http
DELETE /api/student-records/{id}
Authorization: Bearer {token}
```

## 🚨 Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created successfully |
| 400  | Invalid request |
| 401  | Not authenticated |
| 403  | Access forbidden |
| 404  | Resource not found |
| 409  | Conflict (duplicate) |
| 500  | Server error |

## 📝 Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated List
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

## 🔗 Examples

### Complete Workflow

1. **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diplomaverif.com","password":"Password123!"}'
```

2. **Create University**
```bash
curl -X POST http://localhost:3000/api/universities \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

3. **Create Student**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

4. **Create Certificate**
```bash
curl -X POST http://localhost:3000/api/certificates \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

5. **Verify Certificate**
```bash
curl -X GET http://localhost:3000/api/certificates/verify/{qrHash}
```

For more information, see [README.md](README.md).

