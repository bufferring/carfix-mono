# Setup Supabase Storage for Product Images

## Option 1: Via Supabase Dashboard (Recommended - 1 minute)

1. Go to: https://hfnsgdeitwuhovcupqdn.supabase.co
2. Click **"Storage"** in left sidebar
3. Click **"New bucket"**
4. Name: `product-images`
5. Check **"Public bucket"** ✓
6. Click **"Create bucket"**

Done! The backend will now upload images to Supabase Storage.

## Option 2: Via SQL Editor

If you prefer SQL, run this in SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
```

## How It Works

- **Before**: Images saved to `/uploads/` folder on Render (lost on redeploy)
- **After**: Images uploaded to Supabase Storage (permanent, CDN-backed)
- **URLs**: Public URLs like `https://...supabase.co/storage/v1/object/public/product-images/products/123.jpg`
- **Frontend**: No changes needed - URLs work the same way
