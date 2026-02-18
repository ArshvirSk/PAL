# ✅ Pre-Deployment Checklist

## Before Pushing to GitHub

- [ ] Remove all console.logs (optional, but cleaner)
- [ ] Verify .gitignore includes .env files
- [ ] Test build locally: `npm run build`
- [ ] Check no sensitive data in code
- [ ] Update README.md with your info

## GitHub Setup

- [ ] Create GitHub account (if needed)
- [ ] Create new repository
- [ ] Initialize git: `git init`
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Add remote: `git remote add origin <url>`
- [ ] Push: `git push -u origin main`

## Accounts to Create

- [ ] Vercel account (https://vercel.com) - for frontend
- [ ] Railway account (https://railway.app) - for backend
- [ ] Supabase account (https://supabase.com) - for database
- [ ] Google Cloud account (https://makersuite.google.com) - for Gemini API

## Environment Variables to Prepare

### You'll Need:
- [ ] Google Gemini API key
- [ ] Supabase URL and Service Key
- [ ] JWT Secret (generate random string)

### Generate JWT Secret:
```bash
# Run this in terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment Order

1. [ ] Push to GitHub
2. [ ] Deploy Frontend to Vercel (will fail initially - that's ok)
3. [ ] Deploy Backend to Railway
4. [ ] Setup Supabase database
5. [ ] Get Gemini API key
6. [ ] Update all environment variables
7. [ ] Redeploy both frontend and backend
8. [ ] Test everything

## Quick Start Commands

```bash
# 1. Commit everything
git add .
git commit -m "Ready for deployment"

# 2. Push to GitHub
git push origin main

# 3. Then follow DEPLOYMENT.md
```

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**Ready? Let's deploy! 🚀**
