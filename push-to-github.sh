#!/bin/bash

# Push AIsim landing page to GitHub
# Usage: ./push-to-github.sh [repository-url]

set -e

if [ -z "$1" ]; then
    echo "❌ Error: GitHub repository URL required"
    echo ""
    echo "Usage: ./push-to-github.sh <repository-url>"
    echo ""
    echo "Example:"
    echo "  ./push-to-github.sh https://github.com/yourusername/aisim-landing.git"
    echo "  ./push-to-github.sh git@github.com:yourusername/aisim-landing.git"
    echo ""
    echo "Or if you've already added the remote:"
    echo "  git push -u origin main"
    exit 1
fi

REPO_URL="$1"

echo "🚀 Setting up GitHub remote and pushing..."

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' already exists. Updating..."
    git remote set-url origin "$REPO_URL"
else
    echo "📦 Adding remote 'origin'..."
    git remote add origin "$REPO_URL"
fi

echo "📤 Pushing to GitHub..."
git push -u origin main

echo "✅ Successfully pushed to GitHub!"
echo ""
echo "Repository: $REPO_URL"
