import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import apiClient from '../../api';
import { Link } from 'react-router-dom';

function Cart() {
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { cartItems, loading, fetchCart } = useCart();
  const navigate = useNavigate();

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdating(itemId);
    try {
      await apiClient.put(`/api/cart/${itemId}`, { quantity: newQuantity });
      fetchCart(); // Refresh cart from context
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdating(itemId);
    try {
      await apiClient.delete(`/api/cart/${itemId}`);
      fetchCart(); // Refresh cart from context
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading cart</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
          <div className="px-4 py-10 sm:px-6 flex flex-col items-center justify-center">
            <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="mt-2 text-lg font-medium text-gray-500">Your cart is empty</p>
            <p className="mt-1 text-sm text-gray-500">Add some items to get started</p>
            <div className="mt-6">
              <Link to="/products" className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <ul className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <li key={item.id} className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.product_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996l14.873-14.874 3.752 3.752L24 20.993zM5.805 12.6l-1.4-1.4 3.507-3.507 1.4 1.4-3.507 3.507zM20.896 7.2l-1.4 1.4-3.507-3.507 1.4-1.4 3.507 3.507z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.product_name || `Product ${item.product_id}`}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.description || 'Description unavailable'}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        In Stock: {item.stock}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500">Qty:</span>
                        <select
                          className="ml-2 block rounded-md border-gray-300 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          value={item.quantity}
                          disabled={updating === item.id}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                        >
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-lg font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={updating === item.id}
                    onClick={() => handleRemoveItem(item.id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
          <div className="flex justify-between text-lg font-medium text-gray-900">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Shipping and taxes calculated at checkout</p>
          <div className="mt-6">
            <button
              onClick={handleCheckout}
              className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Checkout
            </button>
          </div>
          <div className="mt-6 flex justify-center text-sm text-gray-500">
            <p>
              or <Link to="/products" className="text-blue-600 font-medium hover:text-blue-500">Continue Shopping<span aria-hidden="true"> &rarr;</span></Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
