# API Usage Examples - UK Academic Certification System

## Prerequisites
- API running on `http://localhost:3000`
- Authentication token obtained from `/api/auth/login`

---

## 1. University Management

### Create University (Admin Only)
```bash
POST /api/universities
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "University of Oxford",
  "address": "Oxford, United Kingdom",
  "contactEmail": "contact@oxford.ac.uk",
  "phone": "+44 1865 270000",
  "ukprn": "102832",
  "registrarName": "Prof. Sarah Johnson"
}

Response:
{
  "success": true,
  "message": "University created successfully",
  "data": {
    "id": "univ-uuid",
    "name": "University of Oxford",
    "ukprn": "102832",
    ...
  }
}
```

### Upload University Logo
```bash
PUT /api/universities/{id}/logo
Authorization: Bearer {token}
Content-Type: multipart/form-data

[Binary file: logo.png]

Response:
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "logoUrl": "http://localhost:3000/uploads/logos/uuid.png"
  }
}
```

### Upload Official Seal
```bash
PUT /api/universities/{id}/seal
Authorization: Bearer {token}
Content-Type: multipart/form-data

[Binary file: seal.png]

Response: Similar to logo upload
```

### Upload Signature
```bash
PUT /api/universities/{id}/signature
Authorization: Bearer {token}
Content-Type: multipart/form-data

[Binary file: signature.png]

Response: Similar to logo upload
```

---

## 2. Program Management

### Create Program
```bash
POST /api/programs
Authorization: Bearer {university-token}
Content-Type: application/json

{
  "universityId": "univ-uuid",
  "title": "Bachelor of Science in Computer Science",
  "level": "Undergraduate",
  "totalCreditsRequired": 360
}

Response:
{
  "success": true,
  "message": "Program created successfully",
  "data": {
    "id": "prog-uuid",
    "title": "Bachelor of Science in Computer Science",
    "level": "Undergraduate",
    "totalCreditsRequired": 360,
    "universityId": "univ-uuid"
  }
}
```

### List All Programs
```bash
GET /api/programs?universityId=univ-uuid
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "prog-uuid",
      "title": "BSc Computer Science",
      "level": "Undergraduate",
      "_count": {
        "students": 150,
        "modules": 24
      }
    },
    ...
  ]
}
```

### Get Program Details
```bash
GET /api/programs/{id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "prog-uuid",
    "title": "BSc Computer Science",
    "level": "Undergraduate",
    "totalCreditsRequired": 360,
    "students": [
      {
        "id": "student-uuid",
        "studentId": "20240001",
        "firstName": "John",
        "lastName": "Doe",
        "enrollmentDate": "2024-09-01"
      }
    ],
    "modules": [
      {
        "id": "module-uuid",
        "code": "CS101",
        "name": "Programming Fundamentals",
        "credits": 30
      }
    ]
  }
}
```

---

## 3. Module Management

### Create Module
```bash
POST /api/modules
Authorization: Bearer {university-token}
Content-Type: application/json

{
  "universityId": "univ-uuid",
  "programId": "prog-uuid",
  "code": "CS101",
  "name": "Programming Fundamentals",
  "credits": 30
}

Response:
{
  "success": true,
  "message": "Module created successfully",
  "data": {
    "id": "module-uuid",
    "code": "CS101",
    "name": "Programming Fundamentals",
    "credits": 30,
    "universityId": "univ-uuid",
    "programId": "prog-uuid"
  }
}
```

### Get Modules for Program
```bash
GET /api/modules/program/{programId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": "module-uuid",
      "code": "CS101",
      "name": "Programming Fundamentals",
      "credits": 30,
      "_count": {
        "grades": 150
      }
    },
    ...
  ]
}
```

---

## 4. Student Management

### Create Student (Auto-Generates ID)
```bash
POST /api/students
Authorization: Bearer {university-token}
Content-Type: application/json

{
  "universityId": "univ-uuid",
  "programId": "prog-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@student.oxford.ac.uk",
  "dateOfBirth": "2000-05-15",
  "enrollmentDate": "2024-09-01"
}

Response:
{
  "success": true,
  "message": "Student created successfully with auto-generated ID",
  "data": {
    "id": "student-uuid",
    "studentId": "20240001",  ← AUTO-GENERATED!
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@student.oxford.ac.uk",
    "enrollmentDate": "2024-09-01",
    "program": {
      "id": "prog-uuid",
      "title": "BSc Computer Science"
    }
  }
}
```

### Upload Student Photo
```bash
PUT /api/students/{id}/photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

[Binary file: student-photo.jpg]

Response:
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "id": "student-uuid",
    "photoUrl": "http://localhost:3000/uploads/photos/uuid.jpg"
  }
}
```

### Get Student with Grades
```bash
GET /api/students/{id}/with-grades
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "student-uuid",
    "studentId": "20240001",
    "firstName": "John",
    "lastName": "Doe",
    "program": {
      "title": "BSc Computer Science",
      "level": "Undergraduate"
    },
    "gradeCount": 8,
    "grades": [
      {
        "id": "grade-uuid",
        "mark": 78.5,
        "module": {
          "code": "CS101",
          "name": "Programming Fundamentals",
          "credits": 30
        }
      }
    ]
  }
}
```

---

## 5. Grade Management

### Add Grade/Mark for Student
```bash
POST /api/grades
Authorization: Bearer {university-token}
Content-Type: application/json

{
  "studentId": "student-uuid",
  "moduleId": "module-uuid",
  "mark": 78.5
}

Response:
{
  "success": true,
  "message": "Grade created successfully",
  "data": {
    "id": "grade-uuid",
    "mark": 78.5,
    "student": {
      "studentId": "20240001",
      "firstName": "John",
      "lastName": "Doe"
    },
    "module": {
      "code": "CS101",
      "name": "Programming Fundamentals",
      "credits": 30
    }
  }
}
```

### Update Grade/Mark
```bash
PUT /api/grades/{id}
Authorization: Bearer {university-token}
Content-Type: application/json

{
  "mark": 82.0
}

Response:
{
  "success": true,
  "message": "Grade updated successfully",
  "data": {
    "id": "grade-uuid",
    "mark": 82.0,
    ...
  }
}
```

### Get Student's Grades with Classification
```bash
GET /api/grades/student/{studentId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "student": {
      "studentId": "20240001",
      "firstName": "John",
      "lastName": "Doe"
    },
    "statistics": {
      "gradeCount": 8,
      "highestMark": 92.0,
      "lowestMark": 65.5,
      "averageMark": 78.3,
      "grades": [
        {
          "moduleCode": "CS101",
          "moduleName": "Programming Fundamentals",
          "credits": 30,
          "mark": 78.5
        },
        ...
      ]
    },
    "classification": {
      "finalMark": 78.3,
      "degreeClassification": "2:1"  ← UK Classification!
    }
  }
}
```

### Get All Grades for University
```bash
GET /api/grades/university/{universityId}
Authorization: Bearer {university-token}

Response:
{
  "success": true,
  "count": 450,
  "data": [
    {
      "id": "grade-uuid",
      "mark": 78.5,
      "student": {
        "studentId": "20240001",
        "firstName": "John"
      },
      "module": {
        "code": "CS101",
        "name": "Programming Fundamentals"
      }
    },
    ...
  ]
}
```

---

## 6. Grade Calculation Examples

### Weighted Average Calculation

**Scenario:** Student has completed 4 modules:
- CS101 (30 credits): 78.5%
- CS102 (30 credits): 85.0%
- CS103 (15 credits): 72.0%
- CS104 (20 credits): 88.5%

**Calculation:**
```
Weighted Average = (78.5×30 + 85.0×30 + 72.0×15 + 88.5×20) / (30+30+15+20)
                 = (2355 + 2550 + 1080 + 1770) / 95
                 = 7755 / 95
                 = 81.63%
```

**API Response:**
```json
{
  "classification": {
    "finalMark": 81.63,
    "degreeClassification": "2:1"
  }
}
```

---

## 7. Degree Classification Examples

```
Mark Range    →  Classification
────────────────────────────────
93.5%         →  1st (First Class)
85.2%         →  2:1 (Upper Second)
65.0%         →  2:2 (Lower Second)
45.8%         →  3rd (Third Class)
35.2%         →  Fail
```

---

## 8. Error Responses

### Invalid Mark (Out of Range)
```bash
POST /api/grades
Body: { "studentId": "...", "moduleId": "...", "mark": 105 }

Response:
{
  "success": false,
  "message": "Mark must be a number between 0 and 100"
}
```

### Unauthorized Access
```bash
PUT /api/universities/{other-university-id}
Authorization: Bearer {different-university-token}

Response:
{
  "success": false,
  "message": "You can only update universities you manage"
}
```

### Not Found
```bash
GET /api/programs/invalid-id

Response:
{
  "success": false,
  "message": "Program not found"
}
```

---

## 9. File Upload Verification

### Verify Uploaded File Accessibility
```bash
# After uploading, verify the file is accessible:
GET http://localhost:3000/uploads/photos/uuid.jpg

# Should return 200 OK with image content
```

### Image Requirements
- Format: JPEG, PNG, WebP, or GIF
- Max Size: 5MB
- Recommended: At least 300x300 pixels
- Aspect Ratio: Any (will be preserved)

---

## 10. Common Workflows

### Workflow 1: New Student Enrollment
```
1. POST /api/programs           → Create program
2. POST /api/modules (×8)       → Add 8 modules
3. POST /api/students           → Create student (auto ID)
4. PUT /api/students/{id}/photo → Upload photo
5. POST /api/grades (×8)        → Add grades as received
6. GET /api/grades/student/{id} → View classification
```

### Workflow 2: Certificate Generation
```
1. GET /api/grades/student/{id}           → Get classification
2. POST /api/certificates                 → Create certificate
3. PUT /api/universities/{id}/seal        → Ensure seal uploaded
4. PUT /api/universities/{id}/signature   → Ensure signature uploaded
5. GET /api/certificates/{cert-id}        → View certificate with grades
```

### Workflow 3: Grade Verification
```
1. GET /api/students/{id}/with-grades     → View student's grades
2. PUT /api/grades/{grade-id}             → Update if needed
3. GET /api/grades/student/{id}           → Recalculate classification
```

---

## 11. Rate Limits & Best Practices

- Batch operations: Use university endpoints for all students
- File uploads: 5MB max, use appropriate formats
- Grade updates: Timestamps tracked automatically
- Queries: Include filters to limit results (universityId, programId)

---

## 12. Troubleshooting

| Issue | Solution |
|-------|----------|
| `studentId` not generated | Ensure `universityId` is valid |
| File upload fails | Check file size (<5MB) and type (JPEG/PNG/GIF/WebP) |
| Grade calculation wrong | Verify all modules have credits assigned |
| Classification doesn't update | Submit all grades before checking classification |
| Authorization error | Ensure token has correct role and belongs to right university |

---

**Last Updated:** 2026-01-18  
**API Version:** 2.0.0
