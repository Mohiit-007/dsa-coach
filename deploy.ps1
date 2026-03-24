# DSA Coach Deployment Script for PowerShell

Write-Host "🚀 Starting DSA Coach Deployment..." -ForegroundColor Green

# Deploy Frontend to Vercel
Write-Host "📦 Deploying frontend to Vercel..." -ForegroundColor Yellow
Set-Location frontend
vercel --prod

# Deploy Backend to Railway
Write-Host "🚂 Deploying backend to Railway..." -ForegroundColor Yellow
Set-Location ..\backend
railway login
railway init
railway up

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Set up environment variables in Railway dashboard" -ForegroundColor White
Write-Host "   2. Update frontend API URL in Vercel dashboard" -ForegroundColor White
Write-Host "   3. Test your deployed application" -ForegroundColor White

Set-Location ..
