# Authenticity Validator for Academia

A comprehensive system for verifying academic certificates using OCR, AI-based analysis, and institutional database verification.

## Project Overview

This application addresses the problem of academic certificate fraud by providing employers, institutions, and government agencies with a reliable platform to verify certificate authenticity. The system combines:

- **OCR Technology** (Tesseract): Extracts text from certificate images
- **AI/ML Analysis**: Detects tampering, forgeries, and anomalies
- **Database Verification**: Cross-checks against institutional records
- **Audit Logging**: Tracks all verification activities
- **Admin Dashboard**: Comprehensive monitoring and reporting

## Features

### 1. Certificate Verification
- Upload certificates in PDF or image formats
- Automatic text extraction using OCR
- Real-time authenticity verification
- Tampering detection
- Risk assessment and flagging

### 2. Institution Management
- Register and manage institutions
- Upload and maintain certificate records
- Revoke certificates when needed
- Monitor institutional statistics

### 3. User Roles
- **Admin**: Full system access, statistics, reporting
- **Institution**: Upload and manage certificates
- **Verifier**: Query certificates, verify authenticity

### 4. Security Features
- Multi-level authentication (JWT)
- Data encryption (AES-256 at rest, SSL/TLS in transit)
- Input validation and sanitization
- Rate limiting
- Audit trails for all actions
- IP-based tracking

### 5. Admin Dashboard
- Real-time verification statistics
- Certificate status monitoring
- Verification trends (7-day view)
- Recent certificate logs
- Fraudulent activity detection

## System Architecture

```
Frontend (React + Vite)
    ↓
Express Backend API
    ↓
├── Certificate Controller
├── OCR Service (Tesseract)
├── Verification Service (AI Analysis)
├── Audit Service
├── Upload Middleware
└── Validation Middleware
    ↓
MongoDB Database
```

## Technology Stack

### Backend
- **Node.js & Express**: API Server
- **MongoDB**: NoSQL Database
- **Mongoose**: ODM
- **Tesseract.js**: OCR Engine
- **Sharp**: Image Processing
- **JWT**: Authentication
- **Multer**: File Upload Handling
- **Express-validator**: Input Validation
- **Helmet**: Security Headers

### Frontend
- **React 18**: UI Framework
- **Vite**: Build Tool
- **Axios**: HTTP Client
- **React Router**: Routing
- **Zustand**: State Management
- **Recharts**: Data Visualization
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (Atlas or Local)
- npm or yarn

### Backend Setup

1. **Clone the repository and navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Configure .env with your MongoDB URI and JWT secret:**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/db-name
JWT_SECRET=your_secret_key
NODE_ENV=development
PORT=5000
```

5. **Run the server:**
```bash
npm run dev
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Certificate Management
- `POST /api/certificates/upload` - Upload certificate (Protected)
- `POST /api/certificates/verify` - Verify certificate (Public)
- `GET /api/certificates/:id` - Get certificate details
- `GET /api/certificates/institution/:institutionId` - Get institution certificates
- `PUT /api/certificates/:id/revoke` - Revoke certificate
- `GET /api/certificates/search` - Search certificates

### Admin
- `GET /api/certificates/stats/overview` - System statistics
- `GET /api/dev` - Development routes (DB viewer)

## Database Schema

### Certificate
- `_id`: ObjectId (Primary Key)
- `institution`: Reference to Institution User
- `studentName`: String
- `rollNumber`: String (Indexed)
- `course`: String
- `graduationYear`: Number
- `grade`: String
- `certificateId`: String (Unique, Indexed)
- `issueDate`: Date
- `status`: 'active' | 'revoked'
- `filePath`: String
- `mimeType`: String
- `fileSize`: Number
- `verificationStatus`: 'pending' | 'verified' | 'suspicious' | 'fraud'
- `tamperFlags`: Array
- `ocrData`: { extractedText, confidence }
- `timestamps`: createdAt, updatedAt

### User
- `_id`: ObjectId (Primary Key)
- `name`: String
- `email`: String (Unique, Indexed)
- `password`: String (Hashed with bcrypt)
- `role`: 'admin' | 'institution' | 'verifier'
- `institutionDetails`: { organizationName, registrationNumber }
- `timestamps`: createdAt, updatedAt

### VerificationLog
- `_id`: ObjectId (Primary Key)
- `certificate`: Reference to Certificate
- `queryValue`: String (Indexed)
- `queryType`: String
- `result`: String
- `verifiedBy`: Reference to User
- `ipAddress`: String
- `verifierOrganisation`: String
- `metadata`: Map
- `riskScore`: Number
- `timestamps`: createdAt, updatedAt (Indexed)

## Usage Examples

### 1. Register as Institution
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "ABC University",
  "email": "admin@abcuniversity.edu",
  "password": "SecurePassword123",
  "role": "institution",
  "institutionDetails": {
    "organizationName": "ABC University",
    "registrationNumber": "REG123456"
  }
}
```

### 2. Upload Certificate
```bash
POST /api/certificates/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

certificate: <file>
studentName: John Doe
rollNumber: ABC2021001
course: B.Tech Computer Science
graduationYear: 2024
grade: A
institutionId: <institution_id>
```

### 3. Verify Certificate (Public)
```bash
POST /api/certificates/verify
Content-Type: application/json

{
  "certificateId": "CERT-123456789",
  "verifierOrganisation": "XYZ Company"
}
```

## File Upload Handling

- **Supported formats**: PDF, JPEG, PNG
- **Max file size**: 10 MB
- **Location**: `./backend/uploads/`
- **Validation**: MIME type and extension verification
- **Security**: Filename randomization to prevent enumeration

## OCR Process

1. File uploaded and validated
2. Image preprocessing (normalization, brightness adjustment)
3. Tesseract.js text extraction
4. Key fields extraction using regex:
   - Student name
   - Roll number
   - Course name
   - Institution name
   - Graduation year
   - Grade/CGPA

## AI-Based Verification

The system performs multi-level analysis:

1. **Text Content Verification** - Matching extracted text with database
2. **Date Consistency Checks** - Validating issue and graduation dates
3. **Grade Validation** - Format and range verification
4. **Visual Analysis** - Image metadata and quality assessment
5. **Duplicate Detection** - Hash-based comparison

## Verification Result Status

- **Valid**: Certificate authentic and all data matches
- **Suspicious**: Minor inconsistencies or moderate risk factors
- **Fraud**: Clear indicators of tampering or forgery
- **Invalid**: Certificate not found in database
- **Revoked**: Certificate has been invalidated by issuer

## Security Implementation

### Authentication & Authorization
- JWT tokens with 30-day expiration
- Role-based access control (RBAC)
- Password hashing with bcrypt (10 rounds)
- Secure token storage

### Data Protection
- Input validation on all endpoints
- XSS prevention through sanitization
- SQL injection prevention (Mongoose queries)
- CORS configured for trusted origins
- Security headers via Helmet.js

### Audit & Logging
- All verifications logged with timestamp
- IP address tracking for each action
- User action logging
- Certificate status change history
- Risk score and tamper flag recording

## Performance Features

- Database indexing on frequently queried fields
- Pagination support for large result sets
- Asynchronous image processing
- Connection pooling
- Error handling with proper status codes

## Environment Variables

Create a `.env` file in the backend directory with:

```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
MAX_FILE_SIZE=10485760
OCR_ENGINE=tesseract
OCR_LANGUAGE=eng
CONFIDENCE_THRESHOLD=0.7
```

## Running the Application

### Development Mode
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Build
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## Testing the System

1. **Register** a new institution account
2. **Upload** a certificate with complete details
3. **Verify** the certificate using the public verification page
4. **View** dashboard statistics as admin
5. **Revoke** certificate if needed

## Troubleshooting

### MongoDB Connection Issues
- Verify MONGO_URI in .env
- Ensure MongoDB Atlas IP whitelist includes your IP
- Check network connectivity

### OCR Not Working
- Install tesseract native dependencies if needed
- Check image quality and resolution
- Verify supported file formats

### File Upload Errors
- Check file size (max 10MB)
- Verify MIME type support
- Ensure uploads directory exists and is writable

### Frontend Connection Issues
- Verify API URL in frontend
- Check backend server is running
- Review CORS configuration

## Contributing

1. Create a feature branch
2. Make changes
3. Commit with clear messages
4. Push and create Pull Request

## Deployment Guide

### Docker Deployment

1. **Build and run with Docker Compose:**
```bash
docker-compose up --build
```

This will start:
- MongoDB on port 27017
- AI Service (Flask) on port 8000
- Backend API on port 5000
- Frontend on port 80

### Production Deployment

1. **Environment Setup:**
   - Set `NODE_ENV=production` in backend .env
   - Configure production MongoDB URI
   - Set strong JWT_SECRET

2. **Build Frontend:**
```bash
cd frontend
npm run build
```

3. **Start Services:**
```bash
# AI Service
cd ai services
pip install -r requirements.txt
python app_flask.py

# Backend
cd backend
npm start

# Frontend (serve built files)
cd frontend
npm run preview
```

### Cloud Deployment Options

- **Backend**: Deploy to Heroku, Railway, or Vercel
- **Frontend**: Deploy to Netlify, Vercel, or Cloudflare Pages
- **Database**: Use MongoDB Atlas
- **AI Service**: Deploy to Railway, Render, or AWS Lambda

### Security Checklist

- [ ] Change default JWT secret
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database authentication
- [ ] Regular security updates

## Team

- **Backend Development**: Pravinthaa
- **OCR & AI Implementation**: Deepak
- **Security & Integration**: Deepika
- **Frontend & UI/UX**: Yuvashree

## License

Part of Smart India Hackathon 2025 initiative

## Support & Contact

For issues, questions, or contributions, please open an issue in the repository.

## Roadmap

- [ ] Blockchain integration for certificate hashing
- [ ] Mobile application
- [ ] Advanced ML models for tampering detection
- [ ] Multi-language support
- [ ] QR code generation and scanning
- [ ] IPFS storage integration
- [ ] Email notification system
- [ ] SMS alerts
- [ ] Advanced reporting and analytics
- [ ] API rate limiting
- [ ] Webhook support for institutions
