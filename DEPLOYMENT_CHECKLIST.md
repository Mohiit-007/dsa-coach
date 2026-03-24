# ✅ DSA Coach Deployment Checklist

## 🚀 Pre-Deployment Checklist

### Environment Setup
- [ ] Node.js v18+ installed
- [ ] MongoDB database ready (MongoDB Atlas recommended)
- [ ] Domain name (optional but recommended)
- [ ] Git repository initialized

### Environment Variables
Create `.env` files:

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dsa-coach?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GROQ_API_KEY=gsk_your-groq-api-key-here
CLIENT_URL=https://your-frontend-url.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
```

### Code Preparation
- [ ] Remove all console.log statements
- [ ] Update API URLs for production
- [ ] Optimize images and assets
- [ ] Test all functionality locally

## 🌐 Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### Frontend (Vercel)
1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Build and Deploy**
```bash
cd frontend
npm run build
vercel --prod
```

4. **Configure Environment Variables**
```bash
vercel env add VITE_API_URL production
```

#### Backend (Railway)
1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
cd backend
railway init
```

4. **Set Environment Variables**
```bash
railway variables set NODE_ENV=production
railway variables set MONGO_URI=your-mongo-uri
railway variables set JWT_SECRET=your-jwt-secret
railway variables set GROQ_API_KEY=your-groq-key
```

5. **Deploy**
```bash
railway up
```

### Option 2: Netlify + Railway

#### Frontend (Netlify)
1. **Build**
```bash
cd frontend
npm run build
```

2. **Deploy**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Backend (Railway)
Same as above

### Option 3: DigitalOcean App Platform

1. **Create app.yaml** (already created)
2. **Push to GitHub**
3. **Connect DigitalOcean to GitHub**
4. **Configure environment variables**
5. **Deploy**

## 🔧 Post-Deployment Checklist

### Testing
- [ ] Homepage loads correctly
- [ ] Login/Registration works
- [ ] Dashboard loads user data
- [ ] Code Analyzer functions
- [ ] Code Explainer works
- [ ] Debug tool functions
- [ ] History page displays
- [ ] MCQ practice works
- [ ] Profile page loads

### Performance
- [ ] Page load speed < 3 seconds
- [ ] API response time < 2 seconds
- [ ] Mobile responsive design
- [ ] No console errors

### Security
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] JWT secrets strong

### Monitoring
- [ ] Error tracking set up
- [ ] Uptime monitoring configured
- [ ] Analytics implemented
- [ ] Logging enabled

## 🚨 Common Issues & Solutions

### CORS Errors
```javascript
// backend/server.js - Update allowed origins
const allowedOrigins = [
  "https://your-frontend-url.com",
  "https://www.your-frontend-url.com"
];
```

### MongoDB Connection Issues
- [ ] Check MongoDB Atlas IP whitelist
- [ ] Verify connection string
- [ ] Check network access

### Build Failures
```bash
# Clear and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variable Issues
- [ ] Double-check variable names
- [ ] Ensure no trailing spaces
- [ ] Verify API keys are valid

## 📊 Deployment URLs

### Frontend
- **Vercel**: `https://your-app.vercel.app`
- **Netlify**: `https://your-app.netlify.app`
- **Custom domain**: `https://yourdomain.com`

### Backend
- **Railway**: `https://your-app.railway.app`
- **DigitalOcean**: `https://your-app.ondigitalocean.app`

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: ./frontend
```

## 📞 Support Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [MongoDB Atlas Docs](https://docs.mongodb.com/atlas)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Railway Discord](https://discord.gg/railway)
- [Stack Overflow](https://stackoverflow.com)

---

**🎉 Ready to deploy! Follow this checklist step by step.**
