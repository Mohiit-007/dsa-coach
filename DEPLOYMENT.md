# 🚀 DSA Coach Deployment Guide

This guide will help you deploy your DSA Coach application to production.

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- Domain name (optional)
- Environment variables ready

## 🗂️ Project Structure

```
dsa-coach/
├── backend/                 # Node.js/Express API
├── frontend/               # React/Vite frontend
└── DEPLOYMENT.md          # This file
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for Frontend)

#### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Build Frontend**
```bash
cd frontend
npm run build
```

3. **Deploy to Vercel**
```bash
vercel --prod
```

4. **Create `vercel.json` in frontend folder:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Option 2: Netlify

#### Frontend Deployment (Netlify)

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Deploy to Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

3. **Create `netlify.toml` in frontend folder:**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Railway (Full Stack)

#### Backend + Frontend Deployment (Railway)

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Railway project**
```bash
railway init
```

4. **Create `railway.toml` in root:**
```toml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm start"
  healthcheckPath = "/api/health"
  healthcheckTimeout = 300
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 10

[[services]]
  name = "backend"

[[services]]
  name = "frontend"
  sourceDir = "frontend"
```

### Option 4: DigitalOcean App Platform

1. **Create `app.yaml` in root:**
```yaml
name: dsa-coach
services:
- name: backend
  source_dir: backend
  github:
    repo: your-username/dsa-coach
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
- name: frontend
  source_dir: frontend
  github:
    repo: your-username/dsa-coach
    branch: main
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
```

## 🔧 Environment Variables

Create `.env` files for both frontend and backend:

### Backend Environment Variables (.env)
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dsa-coach?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
GROQ_API_KEY=gsk_your-groq-api-key-here
```

### Frontend Environment Variables (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
```

## 📦 Build Process

### Frontend Build
```bash
cd frontend
npm install
npm run build
```

### Backend Production Setup
```bash
cd backend
npm install --production
```

## 🐳 Docker Deployment (Optional)

### Create Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Create Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Create docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - GROQ_API_KEY=${GROQ_API_KEY}

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

## 🚀 Quick Deploy Script

Create `deploy.sh` in root directory:
```bash
#!/bin/bash

echo "🚀 Deploying DSA Coach..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build

# Deploy to Vercel (if using Vercel)
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying to Vercel..."
    vercel --prod
fi

# Deploy backend (if using Railway)
if command -v railway &> /dev/null; then
    echo "🔧 Deploying backend to Railway..."
    cd ../backend
    railway up
fi

echo "✅ Deployment complete!"
```

## 🔍 Health Check

Add health check endpoint to backend:

```javascript
// backend/routes/health.js
express.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 📊 Monitoring

### Recommended Monitoring Tools
- **Uptime monitoring**: UptimeRobot or Pingdom
- **Error tracking**: Sentry
- **Performance**: Vercel Analytics or Google Analytics
- **Logs**: Railway logs or DigitalOcean logs

## 🔒 Security Checklist

- [ ] Environment variables are set
- [ ] HTTPS is enabled
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] JWT secrets are strong
- [ ] Database connection is secure
- [ ] API keys are not exposed

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
```javascript
// backend/server.js
const cors = require('cors');
app.use(cors({
  origin: ['https://your-frontend-url.com', 'http://localhost:3000'],
  credentials: true
}));
```

2. **MongoDB Connection**
```javascript
// backend/config/db.js
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
```

3. **Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

If you encounter issues during deployment:

1. Check the logs in your deployment platform
2. Verify all environment variables are set
3. Ensure MongoDB is accessible
4. Check if the API endpoints are working
5. Verify the frontend build process completed successfully

---

**Happy Deploying! 🎉**
