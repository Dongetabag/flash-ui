<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AIsim Landing Page

The official landing page for AIsim featuring Flash UI - AI-powered creative UI generation.

**Live Site:** [Deployed on Vercel](https://flash-gg6b121b2-dongetabags-projects.vercel.app)

## Features

- 🎨 **Flash UI** - Generate stunning UI components instantly with AI
- ⚡ **Real-time Generation** - See your designs come to life in seconds
- 🎭 **Multiple Variations** - Get 3 unique design directions per prompt
- 💻 **Source Code Access** - View and copy the generated HTML/CSS
- 🎯 **Creative Prompts** - Dynamic placeholder suggestions

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` environment variable:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```
   Or create a `.env.local` file with:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Deploy to Vercel

1. Install Vercel CLI (if not already installed):
   `npm i -g vercel`

2. Login to Vercel:
   `vercel login`

3. Deploy using the provided script:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   Or manually:
   ```bash
   # Set environment variable
   echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY production
   echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY preview
   echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY development
   
   # Deploy
   vercel --prod --yes
   ```

The API key `AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI` has been configured for deployment.

## Push to GitHub

To push this repository to GitHub:

1. **Create a new repository on GitHub** (or use an existing one)

2. **Push using the script:**
   ```bash
   ./push-to-github.sh https://github.com/yourusername/aisim-landing.git
   ```

   Or manually:
   ```bash
   git remote add origin https://github.com/yourusername/aisim-landing.git
   git push -u origin main
   ```

3. **After pushing, Vercel will auto-deploy** if connected to your GitHub repo
