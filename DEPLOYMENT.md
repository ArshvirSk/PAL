# 🚀 Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables documented
- [ ] .gitignore includes .env files
- [ ] Build passes locally (`npm run build`)
- [ ] No sensitive data in code
- [ ] README.md is complete

---

## Step 1: Push to GitHub

### Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: P.A.L. Platform"
```

### Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `pal-platform` (or your choice)
3. Description: "AI-powered college onboarding platform"
4. Keep it Public or Private
5. **DO NOT** initialize with README (you already have one)
6. Click "Create repository"

### Push to GitHub
```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/pal-platform.git

# Push code
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Frontend (Vercel)

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Environment Variables**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```
   (You'll update this after deploying backend)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your frontend will be live at: `https://your-project.vercel.app`

### Option B: Deploy via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
```

---

## Step 3: Deploy Backend (Railway)

### Why Railway?
- Free tier available
- Easy PostgreSQL setup
- Redis support
- Simple deployment

### Steps:

1. **Sign Up**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `backend` folder as root

3. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will create a database
   - Copy the `DATABASE_URL` from variables

4. **Add Redis**
   - Click "New" → "Database" → "Redis"
   - Copy the `REDIS_URL` from variables

5. **Configure Backend Service**
   - Click on your backend service
   - Go to "Variables" tab
   - Add all environment variables:

   ```
   PORT=3002
   NODE_ENV=production
   DATABASE_URL=<from Railway PostgreSQL>
   REDIS_URL=<from Railway Redis>
   GOOGLE_API_KEY=<your Gemini API key>
   JWT_SECRET=<generate random string>
   JWT_EXPIRES_IN=7d
   SUPABASE_URL=<your Supabase URL>
   SUPABASE_SERVICE_KEY=<your Supabase key>
   CHROMA_HOST=<ChromaDB host>
   CHROMA_PORT=8000
   ```

6. **Deploy**
   - Railway auto-deploys on push
   - Wait for build to complete
   - Copy your backend URL: `https://your-backend.railway.app`

7. **Run Migrations**
   - In Railway dashboard, go to your backend service
   - Click "Settings" → "Deploy"
   - Or run locally: `DATABASE_URL=<railway-url> npm run db:migrate`

---

## Step 4: Update Frontend with Backend URL

1. **Go back to Vercel**
   - Open your project
   - Go to "Settings" → "Environment Variables"
   - Update `NEXT_PUBLIC_API_URL` with Railway backend URL
   - Example: `https://pal-backend.railway.app`

2. **Redeploy Frontend**
   - Go to "Deployments"
   - Click "..." on latest deployment
   - Click "Redeploy"

---

## Step 5: Setup Supabase (Database & Storage)

1. **Create Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose organization
   - Set database password (save it!)
   - Select region (closest to you)
   - Wait 2-3 minutes for setup

2. **Get Credentials**
   - Go to "Settings" → "API"
   - Copy:
     - Project URL (SUPABASE_URL)
     - Service Role Key (SUPABASE_SERVICE_KEY)

3. **Run Database Schema**
   - Go to "SQL Editor"
   - Copy content from `backend/src/db/schema.sql`
   - Paste and run

4. **Setup Storage**
   - Go to "Storage"
   - Create bucket: `documents`
   - Set as public or private based on needs

5. **Update Environment Variables**
   - Add to Railway backend variables
   - Redeploy backend

---

## Step 6: Setup ChromaDB (Vector Database)

### Option A: Docker on Railway
```bash
# Add Dockerfile to backend/
FROM chromadb/chroma:latest
EXPOSE 8000
```

### Option B: Hosted ChromaDB
1. Sign up at https://www.trychroma.com/
2. Get API endpoint
3. Update CHROMA_HOST in environment variables

### Option C: Skip for Demo
- RAG chat will work with mock data
- Can add later

---

## Step 7: Get Google Gemini API Key

1. **Go to Google AI Studio**
   - Visit https://makersuite.google.com/app/apikey
   - Sign in with Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select project or create new
   - Copy the API key

3. **Add to Environment**
   - Add `GOOGLE_API_KEY` to Railway backend
   - Redeploy

---

## Step 8: Test Deployment

### Frontend Tests
```
✓ Visit your Vercel URL
✓ Login page loads
✓ Can login with test credentials
✓ Dashboard displays
✓ Dark mode works
```

### Backend Tests
```bash
# Health check
curl https://your-backend.railway.app/health

# Should return: {"status":"ok"}
```

### Integration Tests
```
✓ Login works
✓ API calls succeed
✓ Documents upload
✓ Chat responds
✓ Admin dashboard loads
```

---

## Step 9: Custom Domain (Optional)

### For Frontend (Vercel)
1. Go to project settings
2. Click "Domains"
3. Add your domain
4. Update DNS records as shown
5. Wait for SSL certificate

### For Backend (Railway)
1. Go to service settings
2. Click "Networking"
3. Add custom domain
4. Update DNS records

---

## Environment Variables Summary

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Backend (Railway)
```env
PORT=3002
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
GOOGLE_API_KEY=AIza...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

---

## Quick Commands

### Push Updates
```bash
git add .
git commit -m "Update: description"
git push origin main
```
Both Vercel and Railway will auto-deploy!

### View Logs
```bash
# Vercel
vercel logs

# Railway
# View in dashboard under "Deployments" → "Logs"
```

### Rollback
```bash
# Vercel - Go to Deployments → Click previous → Promote to Production
# Railway - Go to Deployments → Click previous → Redeploy
```

---

## Troubleshooting

### Build Fails on Vercel
- Check build logs
- Ensure all dependencies in package.json
- Verify Node version compatibility

### Backend 500 Errors
- Check Railway logs
- Verify environment variables
- Check database connection

### CORS Errors
- Add frontend URL to backend CORS whitelist
- Check API_URL in frontend env

---

## Cost Estimate

### Free Tier (Good for Demo/MVP)
- Vercel: Free (Hobby plan)
- Railway: $5/month credit (enough for small app)
- Supabase: Free (500MB database, 1GB storage)
- Google Gemini: Free tier (60 requests/min)

### Paid (Production)
- Vercel Pro: $20/month
- Railway: ~$20-50/month (based on usage)
- Supabase Pro: $25/month
- Google Gemini: Pay as you go

---

## Post-Deployment

1. **Monitor Performance**
   - Setup Vercel Analytics
   - Monitor Railway metrics
   - Check error logs

2. **Setup Monitoring**
   - Add Sentry for error tracking
   - Setup uptime monitoring

3. **Backup Database**
   - Enable Supabase daily backups
   - Export data regularly

4. **Security**
   - Enable 2FA on all services
   - Rotate API keys regularly
   - Monitor for vulnerabilities

---

## 🎉 You're Live!

Your P.A.L. platform is now deployed and accessible worldwide!

**Share your links:**
- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-backend.railway.app`
- GitHub: `https://github.com/your-username/pal-platform`
