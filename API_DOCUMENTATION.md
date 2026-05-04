# API Documentation

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Obtain tokens via login endpoint.

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "role": "institution",
  "institutionDetails": {
    "organizationName": "ABC University",
    "registrationNumber": "REG123"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "institution"
  }
}
```

### Login

**POST** `/auth/login`

Authenticates user and returns token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "institution"
  }
}
```

### Get Profile

**GET** `/auth/profile`

Retrieves authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "institution",
    "institutionDetails": {
      "organizationName": "ABC University",
      "registrationNumber": "REG123"
    }
  }
}
```

### Logout

**POST** `/auth/logout`

Logs out the user (frontend should clear token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Certificate Endpoints

### Upload Certificate

**POST** `/certificates/upload`

Uploads a new certificate. File must be multipart/form-data.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `certificate` (file, required): PDF or image file (max 10MB)
- `studentName` (string, required): Full name of student
- `rollNumber` (string, required): Student's roll/registration number
- `institutionId` (string, required): MongoDB ID of institution
- `course` (string, optional): Course name
- `graduationYear` (number, optional): Year of graduation
- `grade` (string, optional): Grade or CGPA

**Response (201):**
```json
{
  "success": true,
  "message": "Certificate uploaded successfully",
  "certificateId": "507f1f77bcf86cd799439011",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "certificateId": "CERT-507f1f77bcf86cd799439011",
    "studentName": "John Doe",
    "rollNumber": "ABC2021001",
    "course": "B.Tech",
    "graduationYear": 2023,
    "grade": "A",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400`: Invalid input or file format
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `413`: File too large

### Verify Certificate (Public)

**POST** `/certificates/verify`

Verifies a certificate authenticity. Public endpoint - no authentication required.

**Request Body (one of the following):**

Option 1 - Certificate ID:
```json
{
  "certificateId": "CERT-507f1f77bcf86cd799439011",
  "verifierOrganisation": "XYZ Company"
}
```

Option 2 - Roll Number & Name:
```json
{
  "rollNumber": "ABC2021001",
  "studentName": "John Doe",
  "institutionId": "507f1f77bcf86cd799439011",
  "verifierOrganisation": "XYZ Company"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Certificate verification completed",
  "verificationId": "507f1f77bcf86cd799439011",
  "status": "valid",
  "certificate": {
    "_id": "507f1f77bcf86cd799439011",
    "studentName": "John Doe",
    "rollNumber": "ABC2021001",
    "course": "B.Tech",
    "graduationYear": 2023,
    "grade": "A",
    "issueDate": "2023-06-15T00:00:00Z",
    "status": "active"
  },
  "dataMatches": {
    "studentName": true,
    "rollNumber": true,
    "institution": true
  },
  "verifiedAt": "2024-01-15T10:30:00Z"
}
```

**Verification Status Values:**
- `valid`: Certificate is authentic and data matches
- `invalid`: Certificate not found in database
- `suspicious`: Minor inconsistencies detected
- `fraud`: Clear indicators of forgery/tampering
- `revoked`: Certificate has been revoked

### Get Certificate Details

**GET** `/certificates/:id`

Retrieves detailed information about a certificate.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string): MongoDB ID of certificate

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "studentName": "John Doe",
    "rollNumber": "ABC2021001",
    "course": "B.Tech",
    "graduationYear": 2023,
    "grade": "A",
    "certificateId": "CERT-507f1f77bcf86cd799439011",
    "status": "active",
    "issueDate": "2023-06-15T00:00:00Z",
    "filePath": "./uploads/abc123.jpg",
    "fileSize": 2097152,
    "verificationStatus": "verified",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Institution Certificates

**GET** `/certificates/institution/:institutionId`

Lists all certificates for a specific institution.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Results per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "studentName": "John Doe",
      "rollNumber": "ABC2021001",
      "course": "B.Tech",
      "graduationYear": 2023,
      "grade": "A",
      "status": "active"
    }
  ]
}
```

### Revoke Certificate

**PUT** `/certificates/:id/revoke`

Revokes a certificate (makes it invalid).

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string): MongoDB ID of certificate

**Request Body:**
```json
{
  "reason": "Certificate issued by mistake"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Certificate revoked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "studentName": "John Doe",
    "status": "revoked",
    "revokedAt": "2024-01-15T10:30:00Z",
    "revocationReason": "Certificate issued by mistake"
  }
}
```

### Search Certificates

**GET** `/certificates/search`

Searches for certificates by student name, roll number, or certificate ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `query` (string, required): Search term (min 2 characters)
- `type` (string, optional): Filter type - 'all', 'student', or 'certificate' (default: 'all')

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "studentName": "John Doe",
      "rollNumber": "ABC2021001",
      "certificateId": "CERT-507f1f77bcf86cd799439011",
      "status": "active"
    }
  ]
}
```

---

## Admin Endpoints

### Get Verification Statistics

**GET** `/certificates/stats/overview`

Retrieves system-wide statistics. Admin only.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "certificates": {
      "total": 150,
      "active": 145,
      "revoked": 5
    },
    "verifications": {
      "total": 1250,
      "found": 1100,
      "notFound": 150,
      "recentSevenDays": 120
    },
    "verificationRate": "88.00"
  }
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Description of the error",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `413`: Payload Too Large
- `500`: Internal Server Error

---

## Rate Limiting

API implements rate limiting:
- **Window**: 15 minutes
- **Limit**: 100 requests per window
- **Response Header**: `X-RateLimit-Remaining`

---

## Example Usage

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123",
    "role": "verifier"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Verify Certificate:**
```bash
curl -X POST http://localhost:5000/api/certificates/verify \
  -H "Content-Type: application/json" \
  -d '{
    "certificateId": "CERT-123456",
    "verifierOrganisation": "My Company"
  }'
```

### Using JavaScript/Fetch

```javascript
// Register
const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePassword123',
    role: 'verifier'
  })
});

const { token } = await registerResponse.json();

// Verify Certificate
const verifyResponse = await fetch('http://localhost:5000/api/certificates/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    certificateId: 'CERT-123456'
  })
});

const result = await verifyResponse.json();
```

### Using Axios (JavaScript)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Verify Certificate
const result = await api.post('/certificates/verify', {
  certificateId: 'CERT-123456'
});
```

---

## Webhooks (Future)

Future versions will support webhook notifications for:
- Certificate verification completion
- Fraudulent certificate detection
- Certificate revocation

---

## Rate Limiting

API implements rate limiting to prevent abuse:

**Limits:**
- 100 requests per 15-minute window
- Per IP address
- Headers include rate limit info

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Versioning

Current API version: `v1`

Future: Support for `/api/v2`, `/api/v3` etc. with backward compatibility.

---

## Support

For API issues or questions:
- Check response error messages
- Review logs for details
- Create issue on GitHub repository
