@echo off
echo 🚀 DSA Coach Backend Deployment to Render
echo ========================================

echo.
echo 🌐 Opening Render for backend deployment...
start https://render.com/dashboard

echo.
echo 📦 Opening GitHub for repository setup...
start https://github.com/new

echo.
echo 🗄️ Opening MongoDB Atlas for database setup...
start https://mongodb.com/atlas

echo.
echo 🤖 Opening Groq for API key...
start https://groq.com

echo.
echo ✅ Deployment links opened in your browser!
echo.
echo 📋 Render Deployment Steps:
echo    1. Create GitHub repository
echo    2. Push backend code to GitHub
echo    3. Go to Render dashboard
echo    4. Click "New +" → "Web Service"
echo    5. Connect your GitHub repository
echo    6. Select backend folder
echo    7. Set environment variables:
echo       - NODE_ENV=production
echo       - MONGO_URI=your-mongodb-uri
echo       - JWT_SECRET=your-secret-key
echo       - GROQ_API_KEY=your-groq-key
echo       - CLIENT_URL=https://dsa-coach-one.vercel.app
echo    8. Click "Create Web Service"
echo.
echo 🎉 Your backend will be live at: https://your-app-name.onrender.com
pause
