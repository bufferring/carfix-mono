import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './components/Home';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Products from './components/customer/Products';
import Cart from './components/customer/Cart';
import SellerDashboard from './components/seller/SellerDashboard';
import ProductForm from './components/seller/ProductForm';
import CategoryManagement from './components/seller/CategoryManagement';
import AOS from 'aos';
import 'aos/dist/aos.css';

function App() {
  useEffect(() => {
    AOS.init({ once: true, duration: 600 });
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Nav />
          <main className="py-10 flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/products" element={<Products />} />

              {/* Protected customer routes */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute roles={['customer']}>
                    <Cart />
                  </ProtectedRoute>
                }
              />

              {/* Protected seller routes */}
              <Route
                path="/seller/dashboard"
                element={
                  <ProtectedRoute roles={['seller']}>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/categories"
                element={
                  <ProtectedRoute roles={['seller']}>
                    <CategoryManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/products/new"
                element={
                  <ProtectedRoute roles={['seller']}>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/products/edit/:id"
                element={
                  <ProtectedRoute roles={['seller']}>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App; 