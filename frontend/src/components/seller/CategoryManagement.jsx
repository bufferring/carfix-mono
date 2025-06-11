import React, { useState, useEffect } from 'react';
import apiClient from '../../api';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', is_featured: false });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/categories');
      setCategories(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/categories', newCategory);
      await fetchCategories();
      setNewCategory({ name: '', description: '', is_featured: false });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/api/categories/${editingCategory.id}`, editingCategory);
      await fetchCategories();
      setEditingCategory(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update category');
    }
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      await apiClient.put(`/api/categories/${categoryId}`, { is_active: !currentStatus });
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update category status');
    }
  };

  const handleToggleFeatured = async (categoryId, currentStatus) => {
    try {
      await apiClient.put(`/api/categories/${categoryId}`, { is_featured: !currentStatus });
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update category featured status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product categories
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {editingCategory ? 'Edit Category' : 'Create New Category'}
        </h2>
        <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
              <input type="text" name="name" id="name" value={editingCategory ? editingCategory.name : newCategory.name} onChange={(e) => editingCategory ? setEditingCategory({ ...editingCategory, name: e.target.value }) : setNewCategory({ ...newCategory, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <input type="text" name="description" id="description" value={editingCategory ? editingCategory.description : newCategory.description} onChange={(e) => editingCategory ? setEditingCategory({ ...editingCategory, description: e.target.value }) : setNewCategory({ ...newCategory, description: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={editingCategory ? editingCategory.is_featured : newCategory.is_featured} onChange={(e) => editingCategory ? setEditingCategory({ ...editingCategory, is_featured: e.target.checked }) : setNewCategory({ ...newCategory, is_featured: e.target.checked })} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
              <span className="text-sm font-medium text-gray-700">Featured Category</span>
            </label>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            {editingCategory && (
              <button type="button" onClick={() => setEditingCategory(null)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Cancel
              </button>
            )}
            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={() => handleToggleStatus(category.id, category.is_active)} className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={() => handleToggleFeatured(category.id, category.is_featured)} className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${category.is_featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {category.is_featured ? 'Featured' : 'Not Featured'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => setEditingCategory(category)} className="text-red-600 hover:text-red-900 mr-4">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
