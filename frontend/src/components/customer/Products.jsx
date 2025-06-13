import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api'; 

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const [featured, setFeatured] = useState(true);

  const filtersRef = useRef({
    "categories" : [],
    "brands" : [],
  });

  const searchInputRef = useRef(null);
  const partialsResultsRef = useRef(null);

  const [filteredProducts, setFilteredProducts] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await Promise.all([
          apiClient.get('/api/products'),
          apiClient.get('/api/categories'),
          apiClient.get('/api/brands')
        ])
        .then(([prodRes, catRes, brandRes]) => {
          setProducts(prodRes.data);
          setCategories(catRes.data);
          setBrands(brandRes.data);
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSearchChange = () => {
    const normalize = (str) => str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const escapeRegExp = (str) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    const results = partialsResultsRef.current.filter(product => query.test(normalize(product.name)));

    setFilteredProducts(results);
  };

  const handleCheckbox = (e = null) => {
    if (e) {
      const id = e.target.id;
      if (!id) return;

      if (e.target.checked) {
        filtersRef.current[e.target.name].push(id);
      } else {
        filtersRef.current[e.target.name] = filtersRef.current[e.target.name].filter(item => item !== id);
      }
    }

    const partialsResults = products.map((product) => {
        const passesFilter = (
          (!featured || product.featured) &&
          (filtersRef.current['categories'].length === 0 || filtersRef.current['categories'].includes(product.category)) &&
          (filtersRef.current['brands'].length === 0 || filtersRef.current['brands'].includes(product.brand))
        );

        if (passesFilter) return product;
    }).filter(product => product !== undefined);

    partialsResultsRef.current = partialsResults;

    handleSearchChange();
  };

  useEffect(() => {
    if (!loading) handleCheckbox();
  }, [loading]);

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
    <div className="flex flex-wrap flex-col items-center sm:items-start sm:ml-4 sm:flex-nowrap sm:flex-row">
      {/* Select filter Panel */}
      <div className="flex flex-col mb-4 w-[90%] sm:w-[300px]">
        <p className="text-lg font-medium">Filter by</p>
        {/* Featured */}
        <div className="flex items-center pl-2 pr-4 my-2">
          <input
            type="checkbox"
            name="featured"
            onClick={(e) => {
              if (e.target.checked) setFeatured(false);
              else setFeatured(true);
              handleCheckbox(e);
            }}
            className="appearance-none focus:outline-none accent-red-500 hover:checked:bg-red-500 focus:checked:bg-red-500 focus:ring-transparent rounded-sm form-checkbox mr-2 size-4 checked:bg-red-500"
          />
          <label htmlFor="featured" className="text-sm">Only Featured</label>
        </div>

        {/* Categories */}
        <div className="flex flex-col mt-2 space-between mb-4 bg-white rounded-md overflow-hidden border-[2.5px] border-[#ea8080] shadow-md">
          <p className="text-md font-medium p-2 w-full text-center text-white bg-red-500">Category</p>
          {categories.map((category, index) => (
            <div key={index} className="flex items-center pl-2 pr-4 mt-2 mb-2">
              <input
                id={categories[index].name}
                type="checkbox"
                name={'categories'}
                onChange={handleCheckbox}
                className="appearance-none focus:outline-none accent-red-500 hover:checked:bg-red-500 focus:checked:bg-red-500 focus:ring-transparent rounded-sm form-checkbox mr-2 size-4 checked:bg-red-500"
              />
              <label htmlFor={categories[index].name} className="text-sm">{categories[index].name}</label>
            </div>
          ))}
        </div>

        {/* Brand */}
        <div className="flex flex-col mt-2 flex space-between bg-white rounded-md overflow-hidden border-[2.5px] border-[#ea8080] shadow-md w-full">
          <p className="text-md font-medium p-2 w-full text-center text-white bg-red-500">Brand</p>
          {brands.map((category, index) => (
            <div key={index} className="flex items-center pl-2 pr-4 mt-2 mb-2">
              <input
                id={brands[index].name}
                type="checkbox"
                name={'brands'}
                onChange={handleCheckbox}
                className="appearance-none focus:outline-none accent-red-500 hover:checked:bg-red-500 focus:checked:bg-red-500 focus:ring-transparent rounded-sm form-checkbox mr-2 size-4 checked:bg-red-500"
              />
              <label htmlFor={brands[index].name} className="text-sm">{brands[index].name}</label>
            </div>
          ))}
        </div>
      </div>
    
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Search bar */}
        <div className="flex flex-col w-full items-center mb-10">
          <h1 className="text-4xl text-gray-900 text-center font-medium mb-4">Find the spare part you are looking for</h1>
          <div className="flex gap-2 w-[80%] bg-white rounded-full overflow-hidden shadow-sm border-[2.5px] transition duration-5000 ease-in-out border-gray-300 hover:border-red-400 hover:shadow-red-400">
            <input placeholder="Search products..." ref={searchInputRef} onChange={handleSearchChange} type="text" className="w-full border-transparent focus:border-transparent focus:outline-none focus:ring-transparent" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product, idx) => (
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
    </div>
  );
}

export default Products; 
