# 🚀 DSA Coach Backend Deployment to Render

## ✅ Current Status
- ✅ Backend prepared for Render deployment
- ✅ Dockerfile created
- ✅ Health check script ready
- ✅ Render configuration prepared
- ✅ All deployment links opened

## 🌐 Render Deployment Steps

### Step 1: Create GitHub Repository
1. Go to [github.com/new](https://github.com/new) (opened in browser)
2. Create new repository: `dsa-coach-backend`
3. Don't initialize with README (we have code ready)

### Step 2: Push Backend to GitHub
```bash
cd backend
git init
git add .
git commit -m "Initial backend deployment"
git branch -M main
git remote add origin https://github.com/yourusername/dsa-coach-backend.git
git push -u origin main
```

### Step 3: Deploy to Render
1. Go to [render.com/dashboard](https://render.com/dashboard) (opened in browser)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select `dsa-coach-backend` repository
5. Configure deployment:

**Render Configuration:**
- **Name:** `dsa-coach-backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

### Step 4: Environment Variables
Set these in Render dashboard:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dsa-coach
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
GROQ_API_KEY=gsk_your-groq-api-key
CLIENT_URL=https://dsa-coach-one.vercel.app
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. Your backend will be live at: `https://dsa-coach-backend.onrender.com`

## 🔧 Frontend Configuration

Update frontend environment variable to point to Render backend:

**In Vercel Dashboard:**
```
VITE_API_URL=https://dsa-coach-backend.onrender.com/api
```

## 📋 Required Services

### MongoDB Atlas Setup
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) (opened in browser)
2. Create free cluster
3. Create database user
4. Get connection string
5. Add your IP to whitelist

### Groq API Key
1. Go to [groq.com](https://groq.com) (opened in browser)
2. Create free account
3. Get API key from dashboard

## 🧪 Testing Your Deployment

### Backend Health Check
Visit: `https://dsa-coach-backend.onrender.com/api/health`

Expected Response:
```json
{
  "success": true,
  "message": "DSA-coach API is running 🚀"
}
```

### Full Application Test
1. Frontend: `https://dsa-coach-one.vercel.app`
2. Test login/registration
3. Test code analyzer
4. Test all features

## 🚨 Troubleshooting

### Common Issues

**Build Failed:**
- Check package.json scripts
- Verify all dependencies are in package.json
- Check Render build logs

**Database Connection Failed:**
- Verify MONGO_URI format
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

**CORS Errors:**
- Verify CLIENT_URL matches your Vercel domain
- Check environment variables are set correctly

**API Not Responding:**
- Check Render service logs
- Verify PORT is set to 5000
- Ensure health check passes

## 📊 Expected URLs

- **Backend:** `https://dsa-coach-backend.onrender.com`
- **API Health:** `https://dsa-coach-backend.onrender.com/api/health`
- **Frontend:** `https://dsa-coach-one.vercel.app`

## 🔄 Auto-Deploy Setup

For automatic deployments when you push to GitHub:

1. In Render dashboard → Web Service → Settings
2. Enable "Auto-Deploy" on main branch
3. Every push to GitHub will auto-deploy

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify environment variables
3. Test locally first
4. Check this guide for solutions

---

**🎉 Your DSA Coach backend will be live on Render in minutes!**
