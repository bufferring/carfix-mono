import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FeaturedSlider from './FeaturedSlider';
import apiClient from '../api';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await apiClient.get('/api/products', {
          params: { featured: true }
        });
        setFeaturedProducts(response.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to fetch featured products');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden" data-aos="fade-up">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28" data-aos="fade-up" data-aos-delay="100">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Bienvenido a</span>
                  <span className="block text-primary-600">CarFix</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Tu tienda de confianza para repuestos y accesorios automotrices de alta calidad. Encuentra las piezas perfectas para tu vehículo en nuestra extensa selección.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/products"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                    >
                      Ver Productos
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                    >
                      Ser Vendedor
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-aos="fade-up" data-aos-delay="200">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Productos Destacados
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Descubre nuestra selección cuidadosamente elegida de repuestos automotrices de alta calidad
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 mt-4">
            {error === 'Failed to fetch featured products' ? 'Error al cargar los productos destacados' : error}
          </div>
        ) : (
          <FeaturedSlider products={featuredProducts} />
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white py-12" data-aos="fade-up" data-aos-delay="300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center" data-aos="zoom-in" data-aos-delay="400">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Calidad Garantizada</h3>
              <p className="mt-2 text-base text-gray-500">
                Todos nuestros productos son probados exhaustivamente y vienen con garantía de calidad
              </p>
            </div>

            <div className="text-center" data-aos="zoom-in" data-aos-delay="500">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Envío Rápido</h3>
              <p className="mt-2 text-base text-gray-500">
                Entrega rápida a tu puerta con seguimiento en tiempo real
              </p>
            </div>

            <div className="text-center" data-aos="zoom-in" data-aos-delay="600">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Devoluciones Fáciles</h3>
              <p className="mt-2 text-base text-gray-500">
                Devoluciones y cambios sin complicaciones dentro de los 30 días
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
