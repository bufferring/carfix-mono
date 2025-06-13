import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api';

function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/seller/products');
      setProducts(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const handleProductUpdated = () => fetchProducts();
    window.addEventListener('productUpdated', handleProductUpdated);
    return () => window.removeEventListener('productUpdated', handleProductUpdated);
  }, [fetchProducts]);

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    try {
      await apiClient.delete(`/api/seller/products/${productId}`);
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al eliminar el producto');
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const response = await apiClient.put(`/api/seller/products/${productId}/status`, {
        is_active: !currentStatus
      });
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId ? { ...p, is_active: response.data.is_active } : p
        )
      );
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al actualizar el estado del producto');
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
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar los productos</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-aos="fade-up">
      <div className="sm:flex sm:items-center sm:justify-between mb-8" data-aos="fade-up" data-aos-delay="100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="mt-1 text-sm text-gray-500">Administra tus productos, actualiza inventario y revisa ventas</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/seller/products/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Agregar Nuevo Producto
          </Link>
        </div>
      </div>
      <div className="mt-8 flex flex-col" data-aos="fade-up" data-aos-delay="200">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8" data-aos="fade-up" data-aos-delay="300">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Miniatura</th>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Producto</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Categoría</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Precio</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Stock</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ventas</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {products.map((product, idx) => (
                    <tr key={product.id} data-aos="fade-up" data-aos-delay={idx * 50}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        {product.imageData ? <img src={product.imageData} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover' }} /> : <span style={{ display: "inline-block", width: "50px", height: "50px", lineHeight: "50px", textAlign: "center", background: "#eee", color: "#666" }}>Sin imagen</span>}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-gray-500">{product.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.category}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${product.price}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.stock}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <button onClick={() => handleToggleStatus(product.id, product.is_active)} className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{product.is_active ? 'Activo' : 'Inactivo'}</button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">{product.total_orders} pedidos</div>
                        <div className="text-gray-500">{product.total_sold || 0} unidades vendidas</div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => navigate(`/seller/products/edit/${product.id}`)} className="text-red-600 hover:text-red-900">Editar</button>
                          <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
