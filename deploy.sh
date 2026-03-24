#!/bin/bash

echo "🚀 DSA Coach Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the dsa-coach root directory"
    exit 1
fi

echo "📦 Building frontend..."
cd frontend
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo "🔧 Preparing backend..."
cd backend
npm install --production

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend dependency installation failed"
    exit 1
fi

cd ..

echo "🌐 Checking for deployment tools..."

# Check for Vercel
if command -v vercel &> /dev/null; then
    echo "📤 Deploying frontend to Vercel..."
    cd frontend
    vercel --prod
    cd ..
else
    echo "💡 Vercel not found. Install with: npm i -g vercel"
fi

# Check for Railway
if command -v railway &> /dev/null; then
    echo "🚂 Deploying backend to Railway..."
    cd backend
    railway up
    cd ..
else
    echo "💡 Railway not found. Install with: npm install -g @railway/cli"
fi

echo "✅ Deployment process completed!"
echo "📋 Next steps:"
echo "   1. Set up your environment variables"
echo "   2. Configure your database connection"
echo "   3. Update your frontend API URL"
echo "   4. Test your deployed application"
