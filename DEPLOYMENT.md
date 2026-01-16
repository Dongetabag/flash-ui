# Vercel Deployment Guide

## Quick Deploy

The app is ready to deploy to Vercel with the API key configured.

### Option 1: Using the Deployment Script

```bash
# Make sure you're logged in
vercel login

# Run the deployment script
./deploy.sh
```

### Option 2: Manual Deployment

```bash
# 1. Login to Vercel
vercel login

# 2. Set environment variables (for all environments)
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY production
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY preview  
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY development

# 3. Deploy to production
vercel --prod --yes
```

### Option 3: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository (or drag & drop the folder)
3. Add environment variable:
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI`
   - Environments: Production, Preview, Development
4. Click Deploy

## Environment Variable

The app uses `GEMINI_API_KEY` which is automatically mapped to `process.env.API_KEY` in the Vite config.

**API Key configured:** `AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI`

## Build Configuration

- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

All configuration is in `vercel.json`.
