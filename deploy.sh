#!/bin/bash

# Deploy Flash UI to Vercel
# This script will deploy the app and set the API key

echo "🚀 Deploying Flash UI to Vercel..."

# Check if logged in
if ! vercel whoami &>/dev/null; then
    echo "⚠️  Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

# Set environment variable
echo "📝 Setting GEMINI_API_KEY environment variable..."
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY production
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY preview
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY development

# Deploy to production
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment complete!"
