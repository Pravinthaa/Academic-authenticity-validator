# Deployment & Setup Guide

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account or local MongoDB
- Git

### 1. Local Development Setup

#### Step 1: Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/authenticity-validator
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
OCR_ENGINE=tesseract
OCR_LANGUAGE=eng
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
EOF
```

**Note**: Replace `MONGO_URI` and `JWT_SECRET` with your actual values.

#### Step 2: Seed Database (Optional)

```bash
npm run seed
```

This creates test data with sample institutions and certificates.

#### Step 3: Start Backend Server

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

#### Step 4: Setup Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 2. Access the Application

#### Test Credentials (from seed script)

**Admin:**
- Email: `admin@verichain.io`
- Password: `Admin@1234`

**Institution:**
- Email: `admin@annauniv.edu`
- Password: `Instit@1234`

**Verifier:**
- Email: `priya@hrfirm.com`
- Password: `Verify@1234`

### 3. Test the System

1. **Upload Certificate** (as Institution)
   - Navigate to `/certificate/upload`
   - Select a PDF or image
   - Fill in student details
   - Submit

2. **Verify Certificate** (Public)
   - Navigate to `/verify`
   - Enter certificate ID or roll number
   - View verification results

3. **View Admin Dashboard** (as Admin)
   - Navigate to `/admin/dashboard`
   - See statistics and logs

## Production Deployment

### Backend Deployment (Heroku)

#### Step 1: Create Heroku Account

- Visit [Heroku](https://www.heroku.com)
- Create free account

#### Step 2: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows (via npm)
npm install -g heroku
```

#### Step 3: Prepare Backend

```bash
cd backend

# Add Procfile
echo "web: npm start" > Procfile

# Add start script to package.json
# Ensure "start": "node server.js" is in scripts

# Verify important dependencies
# Ensure all required packages are in dependencies (not devDependencies)
```

#### Step 4: Deploy

```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Frontend Deployment (Vercel)

#### Step 1: Create Vercel Account

- Visit [Vercel](https://vercel.com)
- Sign up with GitHub

#### Step 2: Configure Environment

Create `.env.production` in frontend directory:

```
VITE_API_URL=https://your-heroku-app.herokuapp.com/api
```

#### Step 3: Deploy

```bash
cd frontend

# Build
npm run build

# Deploy via CLI
npm install -g vercel
vercel

# Or connect GitHub repo to Vercel dashboard
# Select frontend folder as root
# Add environment variable: VITE_API_URL
```

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. Create a cluster:
   - Choose free tier
   - Select nearest region
   - Create cluster

3. Set up database user:
   - Go to Database Access
   - Create user
   - Set strong password
   - Grant `readWriteAnyDatabase` role

4. Configure network:
   - Go to Network Access
   - Add IP address (or 0.0.0.0/0 for testing)
   - Save

5. Get connection string:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<username>` and `<password>` with your database user credentials

6. Use in .env as `MONGO_URI`

## Docker Deployment

### Docker Setup

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGO_URI: mongodb://mongodb:27017/authenticity-validator
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongodb
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      VITE_API_URL: http://localhost:5000/api
    depends_on:
      - backend

  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: authenticity-validator

volumes:
  mongodb_data:
```

### Docker Build & Run

```bash
# Build images
docker-compose build

# Run containers
docker-compose up

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (min 32 characters)
- [ ] Configure CORS for frontend domain
- [ ] Enable HTTPS/SSL
- [ ] Set up rate limiting
- [ ] Configure logging and monitoring
- [ ] Set up database backups
- [ ] Create admin account
- [ ] Test all workflows
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure email notifications
- [ ] Set up CDN for static assets

## Performance Optimization

### Database
- Ensure indexes are created on frequently queried fields
- Use connection pooling
- Archive old verification logs periodically

### API
- Implement caching with Redis
- Use compression middleware
- Optimize image processing
- Implement pagination

### Frontend
- Build optimization
- Code splitting
- Image optimization
- Lazy loading routes

## Monitoring & Logging

### Backend Logging

Use Winston or similar:

```bash
npm install winston
```

### Error Tracking

Set up Sentry:

```bash
npm install @sentry/node
```

### Health Checks

Add health endpoint:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});
```

## Scaling

### Horizontal Scaling
- Deploy multiple backend instances
- Use load balancer (nginx, HAProxy)
- Use same MongoDB connection pool

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Cache frequently accessed data

## Troubleshooting

### MongoDB Connection Fails
```bash
# Check connection string format
# Verify IP whitelist in Atlas
# Ensure database user credentials are correct
```

### Frontend Can't Connect to API
```bash
# Verify backend is running
# Check CORS settings
# Verify API URL in frontend .env
# Check firewall settings
```

### OCR Not Working
```bash
# Ensure tesseract.js dependencies installed
# Check image format and quality
# Verify OCR language installed
```

### File Upload Issues
```bash
# Check uploads directory permissions
# Verify MAX_FILE_SIZE setting
# Check disk space availability
```

## Maintenance

### Regular Tasks
- Monitor disk space
- Review error logs
- Update dependencies monthly
- Back up database weekly
- Review and optimize slow queries
- Clear old temporary files

### Database Maintenance
```bash
# Create indexes for new queries
db.certificates.createIndex({ "certificateId": 1 })

# Archive old logs
db.verificationlogs.deleteMany({ 
  createdAt: { $lt: new Date(Date.now() - 90*24*60*60*1000) } 
})
```

## Support

For deployment issues:
- Check application logs
- Review MongoDB connection
- Verify environment variables
- Test API endpoints with curl/Postman
- Check network connectivity

## Additional Resources

- [Node.js Deployment](https://nodejs.org/en/knowledge/file-system/security/introduction/)
- [MongoDB Deployment](https://docs.mongodb.com/manual/deployment/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Optimization](https://react.dev/learn/render-and-commit)
