# Vercel Deployment Credentials

## What You Need to Deploy

### Option 1: Vercel Access Token (Recommended for Remote/Automated)

**Get Your Token:**
1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Give it a name (e.g., "Flash UI Deployment")
4. Copy the token (you'll only see it once!)

**Deploy with Token:**
```bash
cd "/Users/simeonreid/AiSim Virtual Workspace/flash-ui"
VERCEL_TOKEN=your_token_here ./deploy-with-token.sh
```

Or manually:
```bash
export VERCEL_TOKEN=your_token_here
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY production --token "$VERCEL_TOKEN"
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY preview --token "$VERCEL_TOKEN"
echo "AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI" | vercel env add GEMINI_API_KEY development --token "$VERCEL_TOKEN"
vercel --prod --yes --token "$VERCEL_TOKEN"
```

---

### Option 2: Interactive Login (For Local Development)

**Login:**
```bash
cd "/Users/simeonreid/AiSim Virtual Workspace/flash-ui"
vercel login
```

This will:
- Open your browser
- Ask you to authorize Vercel CLI
- Save credentials locally

**Then Deploy:**
```bash
./deploy.sh
```

---

### Option 3: GitHub Integration (Automatic Deployments)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel"
   git push origin main
   ```

2. **Connect in Vercel Dashboard:**
   - Go to: https://vercel.com/new
   - Click "Import Git Repository"
   - Select your GitHub repo
   - Add environment variable `GEMINI_API_KEY` = `AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI`
   - Click "Deploy"

   Vercel will auto-deploy on every push!

---

## Environment Variable Required

**Name:** `GEMINI_API_KEY`  
**Value:** `AIzaSyD443WHbp8N9Vif17kIlLbachESOjmN-mI`  
**Environments:** Production, Preview, Development

This is already configured in the deployment scripts.

---

## Quick Reference

| Method | Credential Needed | Best For |
|--------|------------------|----------|
| Access Token | Vercel Token | CI/CD, Automation |
| Interactive Login | Browser Auth | Local Development |
| GitHub Integration | GitHub Account | Automatic Deployments |
