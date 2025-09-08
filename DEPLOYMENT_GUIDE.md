# Deployment Guide - Vercel KV Setup

## What Changed
Your app now uses **Vercel KV** (Redis) instead of localStorage, which means:
✅ **Shared data** - All team members see the same tasks
✅ **Real-time collaboration** - Changes are visible to everyone
✅ **Persistent storage** - Data survives deployments

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Vercel KV storage for team collaboration"
git push
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy (it will fail initially - that's expected)

### 3. Add Vercel KV Database
1. In your Vercel dashboard, go to your project
2. Click **Storage** tab
3. Click **Create Database**
4. Select **KV** (Redis)
5. Choose a name like `nocena-devs-kv`
6. Click **Create**

### 4. Connect KV to Your Project
1. After creating the KV database, click **Connect Project**
2. Select your `nocena-devs` project
3. This automatically adds the environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 5. Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Your app should now work with shared storage!

## Testing
After deployment:
1. Open your app in multiple browser tabs/devices
2. Add a task in one tab
3. Refresh the other tab - you should see the task appear
4. Team members can now collaborate on the same task board

## Features Available
- **Export/Import**: Backup and restore data using the buttons at the top
- **Real-time sharing**: All changes are immediately available to all users
- **Persistent storage**: Data survives deployments and browser changes

## Troubleshooting
If you see errors:
1. Check that KV database is connected in Vercel dashboard
2. Verify environment variables are set in **Settings > Environment Variables**
3. Redeploy after making any changes

## Cost
- Vercel KV has a generous free tier
- Perfect for small teams (up to 30,000 commands/month free)