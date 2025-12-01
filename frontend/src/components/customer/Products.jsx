import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
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

  const [toast, setToast] = useState({ type: '', message: '', visible: false });

  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

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

  const showToast = (type, message) => {
    setToast({ type, message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Defensive helper to avoid rendering 0, null, undefined, or empty string
  const safeField = (val) => (val === null || val === undefined || val === '' || val === 0 ? '' : val);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]" role="status" aria-label="Cargando productos">
      <div className="w-12 h-12 rounded-full border-b-2 border-blue-500 animate-spin" aria-hidden="true"></div>
      <span className="sr-only">Cargando productos...</span>
    </div>
  );

  if (error) return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="p-4 bg-red-50 rounded-md border border-red-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar productos</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-wrap items-center sm:items-start sm:ml-4 sm:flex-nowrap sm:flex-row">
      {/* Toast Notification */}
      {toast.visible && (
        <div role="alert" aria-live="polite" className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <svg className="mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p>{toast.message}</p>
          </div>
        </div>
      )}
      
      {/* Select filter Panel */}
      <div className="flex flex-col mb-4 w-[90%] sm:w-[300px]">
        <p className="text-lg font-medium">Filtrar por</p>
        {/* Featured */}
        <div className="flex items-center pr-4 pl-2 my-2">
          <input
            type="checkbox"
            name="featured"
            onClick={(e) => {
              if (e.target.checked) setFeatured(false);
              else setFeatured(true);
              handleCheckbox(e);
            }}
            className="mr-2 rounded-sm appearance-none focus:outline-none accent-red-500 hover:checked:bg-red-500 focus:checked:bg-red-500 focus:ring-transparent form-checkbox size-4 checked:bg-red-500"
          />
          <label htmlFor="featured" className="text-sm">Solo Destacados</label>
        </div>

        {/* Categories */}
        <div className="flex flex-col mt-2 space-between mb-4 bg-white rounded-md overflow-hidden border-[2.5px] border-[#ea8080] shadow-md">
          <p className="p-2 w-full font-medium text-center text-white bg-red-500 text-md">Categoría</p>
          {categories.map((category, index) => (
            <div key={index} className="flex items-center pr-4 pl-2 mt-2 mb-2">
              <input
                id={categories[index].name}
                type="checkbox"
                name={'categories'}
                onChange={handleCheckbox}
                className="mr-2 rounded-sm appearance-none focus:outline-none accent-red-500 hover:checked:bg-red-500 focus:checked:bg-red-500 focus:ring-transparent form-checkbox size-4 checked:bg-red-500"
              />
              <label htmlFor={categories[index].name} className="text-sm">{categories[index].name}</label>
            </div>
          ))}
        </div>

        {/* Brand */}
        <div className="flex flex-col mt-2 flex space-between bg-white rounded-md overflow-hidden border-[2.5px] border-[#ea8080] shadow-md w-full">
          <p className="p-2 w-full font-medium text-center text-white bg-red-500 text-md">Marca</p>
          {brands.map((category, index) => (
            <div key={index} className="flex items-center pr-4 pl-2 mt-2 mb-2">
              <input
                id={brands[index].name}
                type="checkbox"
                name={'brands'}
                onChange={handleCheckbox}
                className="mr-2 rounded-sm appearance-none focus:outline-none accent-red-500 hover:checked:bg-red-500 focus:checked:bg-red-500 focus:ring-transparent form-checkbox size-4 checked:bg-red-500"
              />
              <label htmlFor={brands[index].name} className="text-sm">{brands[index].name}</label>
            </div>
          ))}
        </div>
      </div>
    
      <div className="px-4 py-8 mx-auto w-full max-w-7xl sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="flex flex-col items-center mb-10 w-full">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-gray-800">
            Encuentra el repuesto que buscas
          </h1>
          <div className="flex gap-2 w-[80%] bg-white rounded-full overflow-hidden shadow-sm border-[2.5px] transition duration-5000 ease-in-out border-gray-300 hover:border-red-400 hover:shadow-red-400">
            <label htmlFor="product-search" className="sr-only">Buscar productos</label>
            <input id="product-search" placeholder="Buscar productos..." ref={searchInputRef} onChange={handleSearchChange} type="search" aria-label="Buscar productos" className="w-full border-transparent focus:border-transparent focus:outline-none focus:ring-transparent" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list" aria-label="Lista de productos">
          {filteredProducts.map((product, idx) => (
            <div
              key={product.id}
              data-aos="fade-up"
              data-aos-delay={idx * 50}
              className={`flex flex-col bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105${product.featured ? ' ring-2 ring-blue-500' : ''}`}
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
                          className="object-cover w-full h-full"
                        />
                      ) : (idx === 0) ? (
                        <div key={idx} className="flex justify-center items-center w-full h-full bg-gray-200">
                          <svg className="w-12 h-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
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
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center w-full h-48 bg-gray-200">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {product.featured && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Destacado
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-grow p-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{safeField(product.name)}</h3>
                  <p className="mt-1 text-sm text-gray-500">{safeField(product.category)}</p>
                  <div className="flex justify-between items-center mt-2">
                  <p className="text-lg font-medium text-gray-900">{safeField(product.price) !== '' ? `$${product.price}` : ''}</p>
                  {safeField(product.brand) ? <p className="text-sm text-gray-500">{product.brand}</p> : null}
                </div>
                </div>
                <div className="pt-4 mt-auto">
                  {product.stock > 0 ? (
                    <button
                      className="px-3 py-2 w-full text-sm font-medium text-white bg-red-600 rounded-md transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      onClick={() => {
                        if (!user) {
                          navigate('/login', { state: { from: location } });
                          return;
                        }

                        setAddingToCart(product.id);
                        addToCart(product.id, 1)
                          .then((success) => {
                            if (success) {
                              showToast('success', 'Producto agregado al carrito');
                            } else {
                              showToast('error', 'No se pudo agregar el producto');
                            }
                          })
                          .catch(err => showToast('error', err.message || 'Error al agregar al carrito'))
                          .finally(() => setAddingToCart(null));
                      }}
                      disabled={addingToCart === product.id}
                    >
                      {addingToCart === product.id ? (
                        <span className="flex justify-center">
                          <svg className="mr-2 w-5 h-5 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </span>
                      ) : 'Comprar'}
                    </button>
                  ) : (
                    <button
                      className="px-3 py-2 w-full text-sm font-medium text-gray-600 bg-gray-200 rounded-md opacity-50 cursor-not-allowed"
                      disabled
                    >
                      Sin Stock
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
