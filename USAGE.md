# 📖 Usage Guide - DiplomaVerif

This guide explains how to use DiplomaVerif to manage your diplomas and certificates.

## 👤 User: Admin

### Responsibilities
- Global system management
- Creation/deletion of universities
- Supervision of all students and certificates

### Main Actions

#### 1. Login
```
POST /api/auth/login
Email: admin@diplomaverif.com
Password: Password123!
```

#### 2. Create University
```bash
POST /api/universities
{
  "name": "Technology University",
  "address": "123 Science Street",
  "contactEmail": "contact@ut.com",
  "phone": "+1 234 567 8900"
}
```
→ A user account is automatically created for this university

#### 3. List Certificates
```bash
GET /api/certificates?page=1&limit=50
```

#### 4. Delete a Resource
```bash
DELETE /api/universities/{id}
DELETE /api/students/{id}
DELETE /api/certificates/{id}
```

## 🏫 User: University

### Responsibilities
- Manage own students
- Issue certificates
- Upload student records

### Main Actions

#### 1. Login
```
POST /api/auth/login
Email: (university contact email)
Password: (temporary password received by email)
```

#### 2. Create Student
```bash
POST /api/students
{
  "universityId": "your-university-id",
  "matricule": "STUD2024001",
  "email": "student@mail.com",
  "dateOfBirth": "2000-05-15",
  "major": "Computer Science",
  "photoUrl": "https://example.com/photo.jpg"
}
```
→ A student account is automatically created

#### 3. Upload Student Record
```bash
POST /api/student-records
{
  "studentId": "student-id",
  "attendance": 85,
  "discipline": "Excellent behavior",
  "gradesPdfUrl": "https://your-domain.com/grades-123.pdf",
  "transcriptPdfUrl": "https://your-domain.com/transcript-123.pdf",
  "diplomaPdfUrl": "https://your-domain.com/diploma-123.pdf"
}
```

#### 4. Issue Certificate
```bash
POST /api/certificates
{
  "studentId": "student-id",
  "universityId": "your-university-id",
  "degreeTitle": "Master in Computer Science",
  "specialization": "Artificial Intelligence",
  "graduationDate": "2024-06-30",
  "pdfUrl": "https://your-domain.com/diploma.pdf"
}
```
→ A QR code is automatically generated and attached

#### 5. Revoke Certificate
```bash
PATCH /api/certificates/{id}/revoke
```
→ The certificate becomes invalid for verifications

#### 6. List Your Students
```bash
GET /api/students?universityId=your-id
```

#### 7. Filter by Major
```bash
GET /api/students?major=Computer Science
```

## 🎓 User: Student

### Responsibilities
- View diplomas
- See verifications of certificates

### Main Actions

#### 1. Login
```
POST /api/auth/login
Email: (student email)
Password: (temporary password received by email)
```

#### 2. View Profile
```bash
GET /api/auth/me
```

#### 3. List Your Certificates
```bash
GET /api/certificates?studentId=your-id
```

#### 4. View Your Record
```bash
GET /api/student-records/student/your-id
```

#### 5. See Verifications of Your Certificates
```bash
GET /api/verifications?certificateId=cert-id
```

#### 6. Change Password
```bash
POST /api/auth/change-password
{
  "currentPassword": "old",
  "newPassword": "new"
}
```

## 🌐 User: Public (Companies)

### Responsibilities
- Verify authenticity of diploma via QR code

### Main Actions

#### 1. Scan QR Code
- Receive QR code from student
- Scan code with QR reader

#### 2. Verify Certificate
```bash
GET /api/certificates/verify/{qrHash}
```

**Possible Response:**

✅ **Valid Certificate:**
```json
{
  "success": true,
  "message": "Certificate valid",
  "data": {
    "certificate": {
      "degreeTitle": "Master in Computer Science",
      "specialization": "AI",
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

❌ **Revoked Certificate:**
```json
{
  "success": true,
  "message": "Certificate revoked",
  "data": {
    "certificate": {
      "status": "REVOKED"
    }
  }
}
```

❌ **Certificate Not Found:**
```json
{
  "success": false,
  "message": "Certificate not found or invalid hash"
}
```

#### 3. Register Verification (Optional)
```bash
POST /api/verifications
Authorization: Bearer {token}
{
  "certificateId": "cert-id",
  "companyName": "My Company",
  "email": "hr@my-company.com",
  "reason": "Pre-employment verification"
}
```
→ Student receives email notification

## 🔍 Complete Workflows

### Workflow: Issuing a Diploma

1. **University**: Create student
2. **University**: Upload student record (grades, transcript)
3. **University**: Issue certificate → QR code generated
4. **Student**: View certificate and QR code
5. **Company**: Scan QR code and verify

### Workflow: Verifying a Diploma

1. **Student**: Present QR code to employer
2. **Company**: Scan QR code
3. **System**: Retrieve and display certificate information
4. **Company**: Confirm authenticity
5. **Student**: Receives email notification

### Workflow: Revoke a Diploma

1. **University/Admin**: Detect fraud
2. **University/Admin**: Revoke certificate
3. **System**: Certificate becomes invalid
4. **Companies**: Future verifications show "REVOKED"

## 📊 Statistics and Reports

### For a University

```bash
# Number of students per major
GET /api/students?universityId={id}&major=Computer Science

# Certificates issued
GET /api/certificates?universityId={id}

# Verification rate
GET /api/verifications?certificateId={id}
```

### For a Student

```bash
# My certificates
GET /api/certificates?studentId={id}

# My record
GET /api/student-records/student/{id}

# Verifications of my diplomas
GET /api/verifications?certificateId={id}
```

## 🔐 Best Practices

### Security
- ✅ Change password after first login
- ✅ Use strong password (min 8 characters)
- ✅ Never share your QR code publicly
- ✅ Verify the URL during verifications

### Management
- ✅ Regularly check certificate validity
- ✅ Revoke immediately in case of fraud
- ✅ Keep evidence of any suspicious activity
- ✅ Back up your data regularly

### Communication
- ✅ Notify students of any revocation
- ✅ Inform about contact changes
- ✅ Share anonymous statistics

## 🆘 Support

In case of problems:
1. Consult [README.md](README.md)
2. Check API documentation ([API.md](API.md))
3. Contact system administrator
4. Check server logs

## 📚 Additional Resources

- [Installation Guide](SETUP.md)
- [API Reference](API.md)
- [Complete Documentation](README.md)

---

**Need help?** Contact support@diplomaverif.com

