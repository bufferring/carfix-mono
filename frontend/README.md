# CarFix Frontend

A modern web application for automotive parts and services, built with React, Vite, and Tailwind CSS.

## Features

- Modern React with Vite for fast development
- Responsive design with Tailwind CSS
- Client-side routing with React Router
- Real-time data fetching from the CarFix API
- User-friendly interface for browsing products, orders, and user management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx        # Main application component
│   ├── main.jsx       # Application entry point
│   └── index.css      # Global styles and Tailwind imports
├── public/            # Static assets
├── index.html         # HTML template
└── vite.config.js     # Vite configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend communicates with the CarFix backend API running at `http://localhost:3000`. The API endpoints include:

- `/api/users` - User management
- `/api/products` - Product catalog
- `/api/orders` - Order management
- `/api/categories` - Product categories
- `/api/brands` - Product brands
- `/api/reviews` - Product reviews
- `/api/cart` - Shopping cart
- `/api/wishlist` - User wishlists
- `/api/notifications` - User notifications 