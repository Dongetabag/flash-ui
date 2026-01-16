#!/bin/bash

# Deploy Flash UI to Vercel using Access Token
# Usage: VERCEL_TOKEN=your_token ./deploy-with-token.sh

set -e

echo "🚀 Deploying Flash UI to Vercel..."

# Check for token
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN environment variable is required"
    echo ""
    echo "To get your Vercel token:"
    echo "1. Go to: https://vercel.com/account/tokens"
    echo "2. Click 'Create Token'"
    echo "3. Copy the token"
    echo "4. Run: VERCEL_TOKEN=your_token ./deploy-with-token.sh"
    exit 1
fi

# Set environment variables using token
echo "📝 Setting GEMINI_API_KEY environment variable..."
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY production --token "$VERCEL_TOKEN"
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY preview --token "$VERCEL_TOKEN"
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY development --token "$VERCEL_TOKEN"

# Deploy to production
echo "🚀 Deploying to Vercel..."
vercel --prod --yes --token "$VERCEL_TOKEN"

echo "✅ Deployment complete!"
