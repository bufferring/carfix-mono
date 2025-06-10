import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Nav from './components/Nav';
import Home from './components/Home';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Products from './components/customer/Products';
import Cart from './components/customer/Cart';
import SellerDashboard from './components/seller/SellerDashboard';
import ProductForm from './components/seller/ProductForm';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <main className="py-10">
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
    </div>
  );
}

export default App; 