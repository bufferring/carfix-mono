import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api'; 

function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const searchInputRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/api/products');
        setProducts(response.data);

        const categoriesResponse = await apiClient.get('/api/categories');
        setCategories(categoriesResponse.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Parse and filter function
  const handleSearchChange = () => {    
    const normalize = (str) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    };

    const escapeRegExp = (str) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const buildSearch = (query) => {
      const pattern = query
        .trim()
        .split(/\s+/)
        .map(t => escapeRegExp(t))
        .map(t => `(?=.*${t})`)
        .join('') + '.*';

        return new RegExp(pattern, 'i');
    };

    const query = buildSearch(normalize(searchInputRef.current.value));
    const results = products.filter(product => query.test(normalize(product.name)));

    setFilteredProducts(results);
  };

  const handleAddToCart = async (productId) => {
    setAddingToCart(productId);
    try {
      const response = await apiClient.post('/api/cart', {
          product_id: productId,
          quantity: 1
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

  // Defensive helper to avoid rendering 0, null, undefined, or empty string
  const safeField = (val) => (val === null || val === undefined || val === '' || val === 0 ? '' : val);

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
      {/* Search bar */}
      <div className="flex flex-col w-full items-center mb-10">
        <h1 className="text-4xl text-gray-900 font-medium mb-4">Find Products</h1>
        <div className="flex gap-2 w-[80%] bg-white rounded-full overflow-hidden shadow-sm border-[2px] border-gray-300">
          <input ref={searchInputRef} onChange={handleSearchChange} type="text" className="w-full border-transparent focus:border-transparent focus:outline-none focus:ring-transparent" />
          <button className="pr-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="border-gray-300" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.5094 8.25078C19.0094 8.25078 19.4094 7.85078 19.4094 7.35078V2.70078C19.4094 2.20078 19.0094 1.80078 18.5094 1.80078C18.0094 1.80078 17.6094 2.20078 17.6094 2.70078V7.35078C17.6094 7.84078 18.0194 8.25078 18.5094 8.25078Z" fill="#292D32"/>
              <path d="M11.9996 15.75C11.4996 15.75 11.0996 16.15 11.0996 16.65V21.3C11.0996 21.8 11.4996 22.2 11.9996 22.2C12.4996 22.2 12.8996 21.8 12.8996 21.3V16.65C12.8996 16.16 12.4996 15.75 11.9996 15.75Z" fill="#292D32"/>
              <path d="M5.48984 8.25078C5.98984 8.25078 6.38984 7.85078 6.38984 7.35078V2.70078C6.38984 2.20078 5.98984 1.80078 5.48984 1.80078C4.98984 1.80078 4.58984 2.20078 4.58984 2.70078V7.35078C4.58984 7.84078 4.98984 8.25078 5.48984 8.25078Z" fill="#292D32"/>
              <path d="M7.35047 10.1719H3.63047C3.13047 10.1719 2.73047 10.5719 2.73047 11.0719C2.73047 11.5719 3.13047 11.9719 3.63047 11.9719H4.59047V21.3019C4.59047 21.8019 4.99047 22.2019 5.49047 22.2019C5.99047 22.2019 6.39047 21.8019 6.39047 21.3019V11.9719H7.35047C7.85047 11.9719 8.25047 11.5719 8.25047 11.0719C8.25047 10.5719 7.84047 10.1719 7.35047 10.1719Z" fill="#292D32"/>
              <path d="M20.37 10.1719H16.65C16.15 10.1719 15.75 10.5719 15.75 11.0719C15.75 11.5719 16.15 11.9719 16.65 11.9719H17.61V21.3019C17.61 21.8019 18.01 22.2019 18.51 22.2019C19.01 22.2019 19.41 21.8019 19.41 21.3019V11.9719H20.37C20.87 11.9719 21.27 11.5719 21.27 11.0719C21.27 10.5719 20.87 10.1719 20.37 10.1719Z" fill="#292D32"/>
              <path d="M13.8602 12.0308H12.9002V2.70078C12.9002 2.20078 12.5002 1.80078 12.0002 1.80078C11.5002 1.80078 11.1002 2.20078 11.1002 2.70078V12.0308H10.1402C9.64023 12.0308 9.24023 12.4308 9.24023 12.9308C9.24023 13.4308 9.64023 13.8308 10.1402 13.8308H13.8602C14.3602 13.8308 14.7602 13.4308 14.7602 12.9308C14.7602 12.4308 14.3602 12.0308 13.8602 12.0308Z" fill="#292D32"/>
            </svg>
          </button>
        </div>
      </div>

      {/* TODO: Show this when the filter button has been pressed or make a NavBar */}
      {/* Select filter Panel
      <div className="flex flex-col mb-4 w-full align-center">
        <p className="text-lg font-medium">Filter by</p>
        <div className="mt-2 flex space-between gap-4">
          <div className="flex flex-col bg-white rounded-md overflow-hidden border-[2.5px] border-[#ea8080] shadow-md">
            <p className="text-md font-medium p-2 w-full text-center text-white bg-red-500">Category</p>
            {categories.map((category, index) => (
              <div key={index} className="flex items-center pl-2 pr-4 mt-2 mb-2">
                <input
                  id={categories[index].name}
                  type="checkbox"
                  className="appearance-none focus:outline-none accent-red-500 hover:checked:bg-red-500 focus:checked:bg-red-500 focus:ring-transparent rounded-sm form-checkbox mr-2 size-4 checked:bg-red-500"
                />
                <label htmlFor={categories[index].name} className="text-sm">{categories[index].name}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
       */}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {((searchInputRef.current?.value.length === 0) ? products : filteredProducts).map((product, idx) => (
          <div
            key={product.id}
            data-aos="fade-up"
            data-aos-delay={idx * 50}
            className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105${product.featured ? ' ring-2 ring-blue-500' : ''}`}
          >
            <div className="relative">
              {product.images && product.images.length > 1 ? (
                <div className="grid grid-cols-2 gap-1 w-full h-48 bg-gray-200">
                  {product.images.slice(0, 4).map((img, idx) => (
                    img.imageData ? (
                      <img
                        key={idx}
                        src={img.imageData}
                        alt={`${product.name} (${idx + 1})`}
                        className="w-full h-full object-cover"
                      />
                    ) : (idx === 0) ? (
                      <div key={idx} className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ) : null
                  ))}
                </div>
              ) : (product.images && product.images[0] && product.images[0].imageData) ? (
                <div className="w-full h-48 bg-gray-200">
                  <img
                    src={product.images[0].imageData}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
              <h3 className="text-lg font-medium text-gray-900">{safeField(product.name)}</h3>
              <p className="mt-1 text-sm text-gray-500">{safeField(product.category)}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-lg font-medium text-gray-900">{safeField(product.price) !== '' ? `$${product.price}` : ''}</p>
                {safeField(product.brand) ? <p className="text-sm text-gray-500">{product.brand}</p> : null}
              </div>
              <div className="mt-4">
                {product.stock > 0 ? (
                  <button
                    className="w-full rounded-md bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    onClick={() => navigate(`/cart?add=${product.id}`)}
                  >
                    Shop
                  </button>
                ) : (
                  <button
                    className="w-full rounded-md bg-gray-200 text-gray-600 px-3 py-2 text-sm font-medium cursor-not-allowed opacity-50"
                    disabled
                  >
                    Out of Stock
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products; 
