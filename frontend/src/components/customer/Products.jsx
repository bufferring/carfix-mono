import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    if (!user || user.role !== 'customer') {
      // TODO: Show login prompt or redirect to login
      return;
    }

    setAddingToCart(productId);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to cart');
      }

      // Show success message or update cart count
      // TODO: Add toast notification
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading products</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(product => (
          <div
            key={product.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 ${
              product.featured ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="relative">
              {product.images && product.images.length > 1 ? (
                /* Mosaic (grid) for two or more images */
                <div className="grid grid-cols-2 gap-1 w-full h-48 bg-gray-200">
                  {product.images.slice(0, 4).map((img, idx) => (
                     (img.imageData) ? (
                        <img
                           key={idx}
                           src={img.imageData}
                           alt={`${product.name} (${idx + 1})`}
                           className="w-full h-full object-cover"
                           onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/96?text=No+Image'; }}
                        />
                     ) : (idx === 0) ? (
                        <div key={idx} className="w-full h-full flex items-center justify-center bg-gray-200">
                           <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586 a 2 2 0 012.828 0L20 14m-6-6h.01M6 20h 12 a 2 2 0 002 – 2 V 6 a 2 2 0 00 – 2 – 2 H 6 a 2 2 0 00 – 2 2 v 12 a 2 2 0 00 2 2 z" />
                           </svg>
                        </div>
                     ) : (null)
                  ))}
                </div>
              ) : (product.images && product.images[0] && product.images[0].imageData) ? (
                /* One image (or fallback) */
                <div className="w-full h-48 bg-gray-200">
                   <img
                      src={product.images[0].imageData}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/96?text=No+Image'; }}
                   />
                </div>
              ) : (
                /* Fallback (no image) */
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                   <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16 l 4.586 – 4.586 a 2 2 0 012.828 0 L 16 16 m – 2 – 2 l 1.586 – 1.586 a 2 2 0 012.828 0 L 20 14 m – 6 – 6 h.01 M 6 20 h 12 a 2 2 0 002 – 2 V 6 a 2 2 0 00 – 2 – 2 H 6 a 2 2 0 00 – 2 2 v 12 a 2 2 0 00 2 2 z" />
                   </svg>
                </div>
              )}
              {product.featured && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Featured
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{product.category}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-lg font-medium text-gray-900">${product.price}</p>
                <p className="text-sm text-gray-500">{product.brand}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleAddToCart(product.id)}
                  disabled={addingToCart === product.id || !product.is_active}
                  className={`w-full px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    addingToCart === product.id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : product.is_active
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {addingToCart === product.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding...
                    </span>
                  ) : product.is_active ? (
                    'Add to Cart'
                  ) : (
                    'Out of Stock'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products; 