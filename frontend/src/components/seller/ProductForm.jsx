import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_IMAGES = 5;

const BRAND_OPTIONS = [
  { value: '1', label: 'Toyota' },
  { value: '2', label: 'Honda' },
  { value: '3', label: 'Ford' },
  { value: '4', label: 'BMW' },
];

const ProductForm = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const isEdit = Boolean(productId);

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageErrors, setImageErrors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState({ name: '', description: '', price: '', category_id: '', brand_id: '', stock: '', featured: false, is_active: true, images: [] });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/api/categories');
        setCategories(response.data.filter(cat => cat.is_active));
      } catch (err) {
        console.error('Error fetching categories:', err);
        setServerError('Error al cargar las categorías');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get(`/api/seller/products/${productId}`);
        const data = response.data;
        const updatedProduct = { ...data, price: data.price.toString(), stock: (data.stock || '').toString(), images: (data.images || []) };
        setProduct(updatedProduct);
      } catch (error) {
        setServerError(error.response?.data?.error || error.message || 'Error al cargar el producto');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [isEdit, productId]);

  const validateImage = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Tipo de archivo inválido. Solo se permiten JPEG, PNG y GIF.';
    if (file.size > MAX_FILE_SIZE) return 'El tamaño del archivo debe ser menor a 5MB.';
    return null;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageErrors([]);

    if (imageFiles.length + files.length > MAX_IMAGES) {
      setImageErrors([`Solo puedes subir hasta ${MAX_IMAGES} imágenes.`]);
      return;
    }

    const newErrors = [];
    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      const error = validateImage(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    });

    if (newErrors.length > 0) {
      setImageErrors(newErrors);
    } else {
      setImageFiles(prev => [...prev, ...validFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
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
    setProduct(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateForm = () => {
    const errors = [];
    if (!product.name.trim()) errors.push('El nombre del producto es requerido');
    if (!product.description.trim()) errors.push('La descripción es requerida');
    if (!product.price || parseFloat(product.price) <= 0) errors.push('Se requiere un precio válido');
    if (!product.category_id) errors.push('La categoría es requerida');
    if (!product.brand_id) errors.push('La marca es requerida');
    if (!product.stock || parseInt(product.stock, 10) < 0) errors.push('Se requiere una cantidad válida de stock');
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

    if (!validateForm()) return;

    const existingImagesCount = product.images.filter(img => !img.markedForDelete).length;
    if (existingImagesCount + imageFiles.length === 0) {
      setImageErrors(['Se requiere al menos una imagen del producto']);
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('price', parseFloat(product.price));
      formData.append('category_id', parseInt(product.category_id, 10));
      formData.append('brand_id', parseInt(product.brand_id, 10));
      formData.append('stock', parseInt(product.stock, 10));
      formData.append('featured', product.featured);
      formData.append('is_active', product.is_active);

      if (isEdit) {
        const imagesToDelete = product.images.filter(img => img.markedForDelete).map(img => img.id);
        if (imagesToDelete.length > 0) {
          formData.append('delete_images', JSON.stringify(imagesToDelete));
        }
      }

      imageFiles.forEach(file => formData.append('images', file));

      const url = isEdit ? `/api/seller/products/${productId}` : '/api/products';
      const method = isEdit ? 'put' : 'post';

      const response = await apiClient[method](url, formData);

      setSuccessMessage(isEdit ? '¡Producto actualizado exitosamente!' : '¡Producto creado exitosamente!');
      window.dispatchEvent(new Event('productUpdated'));
      
      setTimeout(() => navigate('/seller/dashboard'), 2000);

    } catch (error) {
      setServerError(error.response?.data?.error || error.message || 'Error al guardar el producto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8" data-aos="fade-up">
      <h2 className="text-2xl font-bold mb-6">{isEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
      
      {serverError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{serverError}</div>}
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" data-aos="fade-up" data-aos-delay="100">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
          <input type="text" name="name" value={product.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea name="description" value={product.description} onChange={handleChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio</label>
            <input type="number" name="price" value={product.price} onChange={handleChange} step="0.01" min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" name="stock" value={product.stock} onChange={handleChange} min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <select name="category_id" value={product.category_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" required>
              <option value="">Selecciona una categoría</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Marca</label>
            <select name="brand_id" value={product.brand_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" required>
              <option value="">Selecciona una marca</option>
              {BRAND_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="featured" checked={product.featured} onChange={handleChange} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
            <span className="text-sm font-medium text-gray-700">Producto Destacado</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Imágenes del Producto</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                  <span>Subir archivos</span>
                  <input id="file-upload" name="file-upload" type="file" multiple accept="image/jpeg,image/png,image/gif" onChange={handleImageChange} className="sr-only" />
                </label>
                <p className="pl-1">o arrastrar y soltar</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 5MB cada uno (máximo 5 imágenes)</p>
            </div>
          </div>
          {imageErrors.length > 0 && <div className="mt-2 text-sm text-red-600">{imageErrors.map((error, index) => <p key={index}>{error}</p>)}</div>}
          {(product.images.filter(img => !img.markedForDelete).length > 0 || imagePreviews.length > 0) && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Imágenes Actuales</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {product.images.filter(img => !img.markedForDelete).map((image, i) => (
                  <div key={image.id} className="relative">
                    <img src={image.imageData} alt={`Product ${i + 1}`} className="h-24 w-24 object-cover rounded-lg" />
                    <button type="button" onClick={() => removeImage(product.images.findIndex(img => img.id === image.id), true)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                ))}
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt={`Preview ${index + 1}`} className="h-24 w-24 object-cover rounded-lg" />
                    <button type="button" onClick={() => removeImage(index, false)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" disabled={isSaving || isLoading} className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSaving || isLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'}`}>
            {isLoading ? 'Cargando...' : isSaving ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
