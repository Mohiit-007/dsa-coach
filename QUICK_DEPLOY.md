# 🚀 Quick Deployment Guide

## ✅ Current Status
- ✅ Frontend built successfully (dist folder created)
- ✅ Backend dependencies installed
- ✅ Vercel CLI installed and logged in
- ✅ Railway CLI installed

## 🌐 Deploy Frontend to Vercel

### Method 1: Web Interface (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Connect your GitHub repository OR
4. Click "Browse" and select the `frontend` folder
5. Click "Deploy"

### Method 2: CLI (If CLI works)
```bash
# Navigate to frontend folder
cd frontend

# Deploy
vercel --prod
```

## 🚂 Deploy Backend to Railway

### Method 1: Web Interface (Easiest)
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Select the `backend` folder
5. Configure environment variables:
   - `NODE_ENV=production`
   - `MONGO_URI=your-mongodb-uri`
   - `JWT_SECRET=your-jwt-secret`
   - `GROQ_API_KEY=your-groq-key`
6. Click "Deploy"

### Method 2: CLI (If CLI works)
```bash
# Navigate to backend folder
cd backend

# Login (opens browser)
railway login

# Initialize project
railway init

# Set environment variables
railway variables set NODE_ENV=production
railway variables set MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dsa-coach
railway variables set JWT_SECRET=your-super-secret-jwt-key-min-32-chars
railway variables set GROQ_API_KEY=gsk_your-groq-api-key

# Deploy
railway up
```

## 🔧 Environment Variables

### Required Environment Variables:

**Backend:**
- `MONGO_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT (min 32 characters)
- `GROQ_API_KEY` - Your Groq API key
- `NODE_ENV=production`

**Frontend:**
- `VITE_API_URL` - Your Railway backend URL

## 📋 Setup Checklist

### Before Deployment:
- [ ] MongoDB Atlas database created
- [ ] Groq API key obtained
- [ ] GitHub repository created (optional but recommended)

### After Deployment:
- [ ] Update frontend API URL to point to Railway backend
- [ ] Test all functionality
- [ ] Set up custom domain (optional)

## 🧪 Testing Your Deployment

1. **Backend Health Check:** Visit `https://your-backend-url.railway.app/api/health`
2. **Frontend:** Visit `https://your-frontend-url.vercel.app`
3. **Test Features:**
   - Login/Registration
   - Code Analyzer
   - Code Explainer
   - Debug Tool
   - History

## 🚨 Common Issues & Solutions

### Issue: CORS Errors
```javascript
// In backend/server.js, update allowed origins:
const allowedOrigins = [
  "https://your-frontend.vercel.app",
  "https://www.your-frontend.vercel.app"
];
```

### Issue: Environment Variables Not Working
- Double-check variable names
- Ensure no trailing spaces
- Restart the deployment after setting variables

### Issue: MongoDB Connection Failed
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has correct permissions

## 📞 Need Help?

If you run into issues:
1. Check the deployment platform logs
2. Verify environment variables
3. Test locally first
4. Check this guide for troubleshooting

---

**🎉 Your DSA Coach is ready to go live!**
