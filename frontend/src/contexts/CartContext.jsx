import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const response = await apiClient.get('/api/cart');
      setCartItems(response.data);
    } catch (err) {
      console.error('Cart API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await apiClient.post('/api/cart', { product_id: productId, quantity });
      fetchCart(); // Refresh cart
      return true;
    } catch (err) {
      console.error('Add to cart error:', err);
      return false;
    }
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
