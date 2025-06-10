import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_IMAGES = 5;

const CATEGORY_OPTIONS = [
  { value: '1', label: 'Engine Parts' },
  { value: '2', label: 'Brake Systems' },
  { value: '3', label: 'Suspension' },
  { value: '4', label: 'Electrical' },
];
const BRAND_OPTIONS = [
  { value: '1', label: 'Toyota' },
  { value: '2', label: 'Honda' },
  { value: '3', label: 'Ford' },
  { value: '4', label: 'BMW' },
];

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:3000${url}`;
};

const ProductForm = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const { token } = useAuth();
  const isEdit = Boolean(productId);

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageErrors, setImageErrors] = useState([]);
  const [product, setProduct] = useState({ name: '', description: '', price: '', category_id: '', brand_id: '', stock: '', featured: false, is_active: true, images: [] });

  // Prefill logic for edit mode
  useEffect(() => {
    if (!isEdit) return;
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/seller/products/${productId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch product');
        const data = await response.json();
        // (Ensure price and stock are strings, and images is an array (or empty array if none).)
        const updatedProduct = { ...data, price: data.price.toString(), stock: (data.stock || '').toString(), images: (data.images || []) };
        setProduct(updatedProduct);
        localStorage.setItem('editProduct', JSON.stringify(updatedProduct));
      } catch (error) { setServerError(error.message); } finally { setIsLoading(false); }
    };
    fetchProduct();
  }, [isEdit, productId, token]);

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

  const removeImage = (index, isExisting = false) => {
    if (isExisting) {
      setProduct(prev => ({
        ...prev,
        images: prev.images.map((img, i) => (i === index ? { ...img, markedForDelete: true } : img))
      }));
    } else {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!product.name.trim()) errors.push('Product name is required');
    if (!product.description.trim()) errors.push('Description is required');
    if (!product.price || parseFloat(product.price) <= 0) errors.push('Valid price is required');
    if (!product.category_id) errors.push('Category is required');
    if (!product.brand_id) errors.push('Brand is required');
    if (!product.stock || parseInt(product.stock) < 0) errors.push('Valid stock quantity is required');

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

    if (product.images.length + imageFiles.length === 0) {
      setImageErrors(['At least one product image is required']);
      return;
    }

    setIsSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', product.name);
      formDataToSend.append('description', product.description);
      formDataToSend.append('price', parseFloat(product.price));
      formDataToSend.append('category_id', parseInt(product.category_id));
      formDataToSend.append('brand_id', parseInt(product.brand_id));
      formDataToSend.append('stock', parseInt(product.stock));
      formDataToSend.append('featured', product.featured ? '1' : '0');
      formDataToSend.append('is_active', product.is_active ? '1' : '0');

      // For edit: add images to delete
      if (isEdit) {
        const imagesToDelete = product.images.filter(img => img.markedForDelete);
        if (imagesToDelete.length > 0) {
          formDataToSend.append('delete_images', JSON.stringify(imagesToDelete.map(img => img.id)));
        }
      }

      // Append new image files
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const url = isEdit ? `/api/seller/products/${productId}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      // Show success message
      setSuccessMessage(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
      // Update localStorage with latest product data (for edit mode)
      if (isEdit) {
        localStorage.setItem('editProduct', JSON.stringify(data));
      }
      // Clear form
      setProduct({
        name: '',
        description: '',
        price: '',
        category_id: '',
        brand_id: '',
        stock: '',
        featured: false,
        is_active: true,
        images: []
      });
      setImageFiles([]);
      setImagePreviews([]);
      // Refetch product details before redirecting
      if (isEdit) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/seller/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const updatedProduct = await response.json();
            const newProduct = { ...updatedProduct, price: updatedProduct.price.toString(), stock: (updatedProduct.stock || '').toString(), images: (updatedProduct.images || []) };
            setProduct(newProduct);
            localStorage.setItem('editProduct', JSON.stringify(newProduct));
          }
        } catch {}
        setIsLoading(false);
      }
      // Remove localStorage item for edit mode
      if (isEdit) { localStorage.removeItem('editProduct'); }
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 2000);
      // (Optional) trigger a refetch of the product list (for example, via a global event or callback) so that the dashboard is also updated.
      // (For example, dispatch a custom event (e.g. 'productUpdated') so that SellerDashboard can listen and refetch.)
      window.dispatchEvent(new Event('productUpdated'));
    } catch (error) {
      setServerError(error.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
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
            value={product.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={product.description}
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
              value={product.price}
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
              value={product.stock}
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
              value={product.category_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Brand</label>
            <select
              name="brand_id"
              value={product.brand_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a brand</option>
              {BRAND_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="featured"
              checked={product.featured}
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
                  {preview ? (
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-24 object-cover rounded-lg"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/96?text=No+Image'; }}
                    />
                  ) : (
                    <span style={{ display: "inline-block", width: "100px", height: "100px", lineHeight: "100px", textAlign: "center", background: "#eee", color: "#666" }}>No image</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index, false)}
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

          {product.images.filter(img => !img.markedForDelete).length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Images</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {product.images.filter(img => !img.markedForDelete).map((image, filteredIndex) => {
                  const originalIndex = product.images.findIndex(img => img.id === image.id);
                  return (
                    <div key={image.id} className="relative">
                      {image.imageData ? (
                        <img
                          src={image.imageData}
                          alt={`Product ${filteredIndex + 1}`}
                          className="h-24 w-24 object-cover rounded-lg"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/96?text=No+Image'; }}
                        />
                      ) : (
                        <span style={{ display: "inline-block", width: "100px", height: "100px", lineHeight: "100px", textAlign: "center", background: "#eee", color: "#666" }}>No image</span>
                      )}
                      <button type="button" onClick={() => removeImage(originalIndex, true)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {image.is_primary && <span className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Primary</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isSaving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 