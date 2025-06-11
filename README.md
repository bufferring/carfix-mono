# CarFix - Automotive Parts Management System 🚗

[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8-orange?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
[![Express](https://img.shields.io/badge/Express-4-black?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-4-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

A modern, full-stack application for managing automotive parts inventory, sales, and customer interactions.

## 🌟 Features

### Customer Features
- Browse and search automotive parts
- View featured products with image galleries
- Shopping cart functionality
- Secure user authentication
- Order management
- Product filtering by categories and brands

### Seller Features
- Seller dashboard for inventory management
- Product management (CRUD operations)
- Category management
- Brand management
- Order tracking and management
- Image upload for products (up to 5 images per product)
- Featured product management

### Security Features
- JWT-based authentication
- Role-based access control (Customer/Seller)
- Secure password hashing
- Protected API endpoints
- CORS and Helmet security middleware

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- AOS (Animate On Scroll)
- Axios for API calls

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- Multer for file uploads
- Express Validator
- Helmet for security
- CORS enabled

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher) - Required for Vite and modern React features
- MySQL (v8 or higher)
- npm (v7 or higher) or yarn

### Test Credentials

#### Seller Account
```
Email: manny@carfixve.app
Password: (contact administrator for password)
Role: seller
```

### Database Setup
1. Create a MySQL database named `carfix`
2. Configure your database credentials in `.env` file in the backend directory:
```bash
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=carfix
JWT_SECRET=your-secret-key  # Change this in production!
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server (using node directly since no start script is defined)
node index.js
```
The backend server will run on http://localhost:3000

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev

# For production build
npm run build

# To preview production build
npm run preview
```
The frontend development server will run on http://localhost:5173 with API proxy configured to http://localhost:3000

## 📁 Project Structure

```
carfix/
├── backend/
│   ├── middleware/     # Authentication and validation middleware
│   │   ├── auth.js     # JWT authentication
│   │   └── validators.js # Request validation
│   ├── routes/        # API routes
│   │   └── auth.js    # Authentication routes
│   ├── uploads/       # Product images storage
│   ├── .env          # Environment variables
│   ├── .gitignore    # Git ignore rules
│   └── index.js      # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── auth/     # Authentication components
│   │   │   ├── customer/ # Customer-facing components
│   │   │   └── seller/   # Seller dashboard components
│   │   ├── contexts/     # React contexts (AuthContext)
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── .env             # Frontend environment variables
│   ├── .gitignore       # Git ignore rules
│   ├── index.html       # HTML template
│   ├── postcss.config.js # PostCSS config for Tailwind
│   ├── tailwind.config.js # Tailwind CSS config
│   └── vite.config.js    # Vite configuration
└── README.md
```

## 🔒 Environment Variables

### Backend (.env)
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=carfix
JWT_SECRET=your-secret-key  # Change this in production!
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login (requires email and password)
- `POST /api/auth/register` - User registration (requires name, email, password, role)

### Products
- `GET /api/products` - Get all active products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Seller only, requires auth token)
  - Supports multipart/form-data for image uploads (max 5 images, 5MB each)
- `PUT /api/products/:id` - Update product (Seller only, requires auth token)
- `DELETE /api/products/:id` - Delete product (Seller only, requires auth token)

### Categories
- `GET /api/categories` - Get all active categories
- `POST /api/categories` - Create category (Seller only, requires auth token)
- `PUT /api/categories/:id` - Update category (Seller only, requires auth token)
- `DELETE /api/categories/:id` - Delete category (Seller only, requires auth token)

### Cart
- `GET /api/cart` - Get user's cart (Customer only, requires auth token)
- `POST /api/cart` - Add item to cart (Customer only, requires auth token)
  - Body: { product_id, quantity }
- `PUT /api/cart/:id` - Update cart item (Customer only, requires auth token)
- `DELETE /api/cart/:id` - Remove item from cart (Customer only, requires auth token)

### File Upload
- `GET /uploads/:filename` - Get uploaded product images
  - Supports: JPEG, PNG, GIF
  - Max file size: 5MB
  - CORS enabled

## :scroll: Licensing

This work is licensed under a [MIT License](LICENSE).

## :brain: Acknowledgments

_"Whoever loves discipline loves knowledge, but whoever hates correction is stupid."_