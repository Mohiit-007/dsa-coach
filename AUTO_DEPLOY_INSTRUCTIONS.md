# 🚀 Auto Deployment Instructions

## ✅ Current Status
- ✅ Frontend built and ready (`dist` folder created)
- ✅ Backend dependencies installed
- ✅ All configuration files prepared
- ✅ Existing Vercel project found: `https://dsa-coach-one.vercel.app`

## 🌐 Step 1: Deploy Frontend to Vercel

### Method A: Update Existing Project (Recommended)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your `dsa-coach` project
3. Click "View Domains"
4. Click "Redeploy" or "Git Integration"
5. Connect your GitHub repository OR upload the `frontend/dist` folder

### Method B: Quick Upload
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Drag and drop the `frontend/dist` folder
4. Click "Deploy"

## 🚂 Step 2: Deploy Backend to Railway

### Method A: Railway Web Interface
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Upload your `backend` folder OR connect GitHub
4. Configure environment variables:

**Required Environment Variables:**
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dsa-coach
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
GROQ_API_KEY=gsk_your-groq-api-key
CLIENT_URL=https://dsa-coach-one.vercel.app
```

### Method B: One-Click Deploy
1. Create a GitHub repository
2. Push your code to GitHub
3. Go to Railway and connect the repo
4. Railway will auto-detect and deploy

## 🔧 Step 3: Configure Environment Variables

### Frontend Environment Variable:
In Vercel dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-url.railway.app/api
```

### Backend Environment Variables:
In Railway dashboard → Variables:
```
NODE_ENV=production
MONGO_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-secret-key-min-32-chars
GROQ_API_KEY=your-groq-api-key
CLIENT_URL=https://dsa-coach-one.vercel.app
```

## 📋 Step 4: Get Required Services

### MongoDB Atlas (Free):
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free account
3. Create free cluster
4. Get connection string
5. Add your IP to whitelist

### Groq API Key:
1. Go to [groq.com](https://groq.com)
2. Create free account
3. Get API key from dashboard

## 🧪 Step 5: Test Deployment

1. **Test Backend:** Visit `https://your-backend-url.railway.app/api/health`
2. **Test Frontend:** Visit `https://dsa-coach-one.vercel.app`
3. **Test Features:**
   - Login/Registration
   - Code Analyzer
   - Code Explainer
   - Debug Tool

## 🚀 Quick Deploy Links

### Vercel Deploy:
- Direct: [vercel.com/new](https://vercel.com/new)
- Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)

### Railway Deploy:
- Direct: [railway.app/new](https://railway.app/new)
- Dashboard: [railway.app/dashboard](https://railway.app/dashboard)

## 📞 If You Need Help

1. **Vercel Issues:** Check Vercel dashboard logs
2. **Railway Issues:** Check Railway logs in dashboard
3. **MongoDB Issues:** Verify connection string and IP whitelist
4. **API Issues:** Check environment variables are correct

## 🎯 Expected URLs After Deployment

- **Frontend:** `https://dsa-coach-one.vercel.app`
- **Backend:** `https://your-app-name.railway.app`
- **API Health:** `https://your-app-name.railway.app/api/health`

---

**🎉 Your DSA Coach deployment is ready! Follow these steps and your app will be live in minutes!**
