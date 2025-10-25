# CarFix - Deployment Guide

Complete e-commerce platform with Supabase (database) + Render (backend) + Vercel (frontend)

## 🗄️ Step 1: Deploy Database (Supabase)

### 1.1 Apply Schema
1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in left sidebar
3. Copy contents of `database/supabase-schema.sql`
4. Paste and click **"Run"**
5. Verify 11 tables created in **Table Editor**

### 1.2 Reload API Cache
1. Click **"API"** in left sidebar
2. Scroll to **"Schema Cache"** section
3. Click **"Reload schema"** button
4. Wait 10 seconds

### 1.3 Create Admin User
```bash
cd backend
bun run create-admin
```

Admin credentials will be displayed after creation.

## 🚀 Step 2: Deploy Backend (Render)

### 2.1 Configure Service
- **Build Command:** `bun install`
- **Start Command:** `bun run start`
- **Root Directory:** `backend`

### 2.2 Environment Variables
Add these in Render dashboard:
```
NODE_ENV=production
JWT_SECRET=your-random-secret-key-here
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

Get Supabase credentials from: Project Settings → API

### 2.3 Test Deployment
```bash
curl https://your-app.onrender.com/health
# Should return: {"status":"ok"}
```

## 🎨 Step 3: Deploy Frontend (Vercel)

### 3.1 Update Environment Variable
In Vercel project settings:
- **Key:** `VITE_API_URL`
- **Value:** `https://your-backend.onrender.com/api`
- **Environments:** Production, Preview, Development

### 3.2 Redeploy
Push to git or click "Redeploy" in Vercel dashboard

### 3.3 Test
Visit your Vercel URL and test login with admin credentials

## 🧪 Local Development

### Backend
```bash
cd backend
bun install
bun run dev
```

### Frontend
```bash
cd frontend
bun install
bun run dev
```

## 📝 Notes

- `.env` file is gitignored (contains sensitive keys)
- Use `.env.example` as template for local development
- Old MySQL backend backed up as `index-mysql-backup.js`
- Schema must be applied before creating admin user

## 🔒 Security

- Never commit `.env` files
- Rotate JWT_SECRET in production
- Use service_role key only in backend
- Change admin password after first login
