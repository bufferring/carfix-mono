import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProductForm = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageErrors, setImageErrors] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    brand_id: '',
    stock: '',
    featured: false
  });

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
  const MAX_IMAGES = 5;

  const validateImage = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG and GIF are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    return null;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageErrors([]);

    // Check number of images
    if (imageFiles.length + files.length > MAX_IMAGES) {
      setImageErrors([`You can only upload up to ${MAX_IMAGES} images.`]);
      return;
    }

    // Validate each file
    const newErrors = [];
    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      const error = validateImage(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          setImagePreviews([...imagePreviews, ...newPreviews]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (newErrors.length > 0) {
      setImageErrors(newErrors);
    } else {
      setImageFiles([...imageFiles, ...validFiles]);
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageErrors(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Product name is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Valid price is required');
    if (!formData.category_id) errors.push('Category is required');
    if (!formData.brand_id) errors.push('Brand is required');
    if (!formData.stock || parseInt(formData.stock) < 0) errors.push('Valid stock quantity is required');

    if (errors.length > 0) {
      setServerError(errors.join(', '));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setImageErrors([]);

    if (!validateForm()) {
      return;
    }

    if (imageFiles.length === 0) {
      setImageErrors(['At least one product image is required']);
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('category_id', parseInt(formData.category_id));
      formDataToSend.append('brand_id', parseInt(formData.brand_id));
      formDataToSend.append('stock', parseInt(formData.stock));
      formDataToSend.append('featured', formData.featured ? '1' : '0');

      // Append each image file
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      // Show success message
      setSuccessMessage('Product created successfully!');
      
      // Clear form
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        brand_id: '',
        stock: '',
        featured: false
      });
      setImageFiles([]);
      setImagePreviews([]);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 2000);
    } catch (error) {
      setServerError(error.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
      
      {serverError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a category</option>
              <option value="1">Engine Parts</option>
              <option value="2">Brake Systems</option>
              <option value="3">Suspension</option>
              <option value="4">Electrical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Brand</label>
            <select
              name="brand_id"
              value={formData.brand_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a brand</option>
              <option value="1">Toyota</option>
              <option value="2">Honda</option>
              <option value="3">Ford</option>
              <option value="4">BMW</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Featured Product</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Product Images</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload files</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each (max 5 images)</p>
            </div>
          </div>

          {imageErrors.length > 0 && (
            <div className="mt-2 text-sm text-red-600">
              {imageErrors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}

          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 