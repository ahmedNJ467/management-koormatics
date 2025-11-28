# Deploy to Vercel - Instructions

## Option 1: Deploy via Vercel CLI (Recommended)

### Step 1: Login to Vercel
```bash
npx vercel login
```
This will open your browser for authentication.

### Step 2: Deploy to Production
```bash
npx vercel --prod --yes
```

This will:
- Deploy the new build with fixed CSS files
- Replace the old build on Vercel
- Generate new CSS files with correct MIME types

---

## Option 2: Trigger Deployment from Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Find your project: `management-koormatics`
3. Click on the project
4. Go to the **Deployments** tab
5. Click **"Redeploy"** on the latest deployment
6. Or click **"Deploy"** → **"Redeploy"**

This will trigger a new build with all the fixes.

---

## Option 3: Push a Small Change to Trigger Auto-Deployment

If Vercel is connected to your GitHub repo, you can trigger a new deployment by making a small commit:

```bash
# Make a small change to trigger deployment
echo "# Build timestamp: $(Get-Date)" >> .vercel-deploy-trigger

# Commit and push
git add .vercel-deploy-trigger
git commit -m "Trigger deployment: Fix CSS MIME type error"
git push origin main
```

Vercel will automatically detect the push and deploy.

---

## After Deployment

1. **Wait 5-10 minutes** for Vercel's CDN cache to clear
2. **Clear your browser cache**:
   - Press `Ctrl+Shift+Delete`
   - Select "Cached images and files"
   - Click "Clear data"
3. **Hard refresh** the page: `Ctrl+Shift+R`
4. **Verify** the error is gone in the browser console

---

## What Was Fixed

✅ Deleted legacy files (`index.html`, `src/main.tsx`, `src/App.tsx`)
✅ Added explicit CSS Content-Type headers in `next.config.js`
✅ Configured service worker cleanup
✅ Clean build completed successfully

The new build will generate CSS files with correct MIME types and proper headers.

