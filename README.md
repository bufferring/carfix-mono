# CarFix - E-Commerce Platform

Complete e-commerce platform for automotive parts with multi-role support (Admin, Seller, Customer).

## 🚀 Tech Stack

- **Frontend:** React + Vite + TailwindCSS + React Router
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage (Images)
- **Auth:** JWT + bcrypt
- **Deployment:** Vercel (Frontend) + Render (Backend)

## 📋 Features

### Customer Features
- Browse products by category and brand
- Search and filter products
- Shopping cart management
- Wishlist
- Order history
- Product reviews

### Seller Features
- Product management (CRUD)
- Image upload (up to 5 images per product)
- Inventory tracking
- Category management
- Sales dashboard

### Admin Features
- User management
- Full product oversight
- Category and brand management
- Order management

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ or Bun
- Supabase account
- Git

### 1. Database Setup (Supabase)

#### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to initialize

#### 1.2 Apply Database Schema
1. Go to Supabase Dashboard → **SQL Editor**
2. Copy contents of `database/supabase-schema.sql`
3. Paste and click **Run**
4. Verify 11 tables created in **Table Editor**

#### 1.3 Create Storage Bucket
1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Name: `product-images`
4. Check **Public bucket** ✓
5. Click **Create bucket**

#### 1.4 Get API Credentials
1. Go to **Settings** → **API**
2. Copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 2. Backend Setup

```bash
cd backend

# Install dependencies
bun install
# or: npm install

# Create environment file
cp .env.template .env

# Edit .env with your Supabase credentials
nano .env
```

**Configure `.env`:**
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-random-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Test database connection:**
```bash
bun run test-db
```

**Create admin user:**
```bash
bun run create-admin
```
Default credentials: `manny@carfixve.app` / `r00tr00t`

**Start backend:**
```bash
bun run dev
# or: npm run dev
```

Backend runs on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
bun install
# or: npm install

# Create environment file
cp .env.template .env

# Edit .env
nano .env
```

**Configure `.env`:**
```env
VITE_API_URL=http://localhost:3000
```

**Start frontend:**
```bash
bun run dev
# or: npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Test the Application

1. Open `http://localhost:5173`
2. Login with admin credentials
3. Create categories and brands
4. Add products with images
5. Test customer features

## 🌐 Production Deployment

### Backend (Render)

1. **Create Web Service:**
   - Repository: Your GitHub repo
   - Branch: `master`
   - Root Directory: `backend`
   - Build Command: `bun install`
   - Start Command: `bun run start`

2. **Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=your-production-secret
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

3. **Deploy** and copy your Render URL

### Frontend (Vercel)

1. **Import Project:**
   - Connect GitHub repository
   - Framework: Vite
   - Root Directory: `frontend`

2. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
   ⚠️ **Important:** Do NOT include `/api` at the end

3. **Deploy**

## 📁 Project Structure

```
carfix-mono/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth & validation
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts
│   ├── index.js         # Main server file
│   ├── package.json
│   └── .env.template
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── api.js       # API client
│   │   └── App.jsx
│   ├── package.json
│   └── .env.template
└── database/
    ├── supabase-schema.sql  # Database schema
    └── (test scripts)

```

## 🔧 Available Scripts

### Backend

```bash
bun run dev          # Start development server
bun run start        # Start production server
bun run test-db      # Test database connection
bun run create-admin # Create admin user
```

### Frontend

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run preview      # Preview production build
```

## 🔐 Security Notes

- ✅ `.env` files are gitignored
- ✅ Never commit API keys or secrets
- ✅ Use strong JWT secrets in production
- ✅ Change default admin password after first login
- ✅ Service role key only used in backend
- ✅ CORS enabled for frontend domain

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/validate` - Validate JWT token

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product (Seller)
- `PUT /api/seller/products/:id` - Update product (Seller)
- `DELETE /api/seller/products/:id` - Delete product (Seller)

### Categories & Brands
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (Seller)
- `GET /api/brands` - List brands

### Cart & Orders
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove from cart
- `GET /api/orders` - Get user orders

## 🐛 Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env`
- Check if schema is applied: `bun run test-db`
- Ensure service_role key is used (not anon key)

### Image Upload Not Working
- Verify `product-images` bucket exists in Supabase Storage
- Check bucket is set to **public**
- Ensure backend has correct SUPABASE_SERVICE_KEY

### Frontend Can't Connect to Backend
- Check `VITE_API_URL` in frontend `.env`
- Ensure backend is running
- Verify CORS is enabled in backend
- Check browser console for errors

### Authentication Errors
- Verify JWT_SECRET matches between requests
- Check token expiration (24 hours default)
- Clear localStorage and login again

## 📄 License

ISC

## 👥 Roles

- **Admin:** Full system access
- **Seller:** Product and category management
- **Customer:** Browse, purchase, review

## 🔄 Database Schema

The database includes:
- Users (with role-based access)
- Products & Product Images
- Categories & Brands
- Orders & Order Items
- Cart & Wishlist
- Reviews & Notifications

All tables include soft delete support and timestamps.

## 📞 Support

For issues or questions, check the troubleshooting section or review the code comments.
