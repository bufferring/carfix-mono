require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, generateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth-supabase');
const { productValidation } = require('./middleware/validators');
const { supabase } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    cb(null, allowedTypes.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Serve uploads
app.use('/uploads', express.static(uploadsDir));

// Helper to read image as base64
const getImageData = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return null;
  try {
    const filePath = path.join(uploadsDir, imageUrl.replace('/uploads/', ''));
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif' };
    const mime = mimeTypes[ext] || 'image/png';
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch (err) {
    console.error('Error reading image:', err);
    return null;
  }
};

// Routes
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Users
app.get('/api/users', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_verified, is_active')
      .order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`*, categories(name), brands(name), users(name)`)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('featured', { ascending: false })
      .order('id');
    
    if (error) throw error;

    const productsWithImages = await Promise.all(products.map(async (p) => {
      const { data: images } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', p.id);
      
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        featured: p.featured,
        category: p.categories?.name || '',
        brand: p.brands?.name || '',
        seller: p.users?.name || '',
        images: images?.map(img => ({ imageData: getImageData(img.image_url) })) || []
      };
    }));

    res.json(productsWithImages);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders
app.get('/api/orders', auth, async (req, res) => {
  try {
    let query = supabase
      .from('orders')
      .select('id, total_amount, status, payment_status, users(name)');
    
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }
    
    const { data, error } = await query.order('id');
    if (error) throw error;
    
    res.json(data.map(o => ({ ...o, customer: o.users?.name || '' })));
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, is_featured, is_active')
      .eq('is_deleted', false)
      .order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/categories', auth, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Forbidden' });
  const { name, description, is_featured } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, description, is_featured: is_featured || false }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/categories/:id', auth, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Forbidden' });
  const { name, description, is_featured, is_active } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({ name, description, is_featured, is_active })
      .eq('id', req.params.id)
      .eq('is_deleted', false)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/categories/:id', auth, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', req.params.id)
      .eq('is_deleted', false);
    
    if (count > 0) return res.status(400).json({ error: 'Category has products' });
    
    const { error } = await supabase
      .from('categories')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Brands
app.get('/api/brands', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, description, is_featured, is_active')
      .order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, title, comment, is_verified, is_approved, products(name), users(name)')
      .order('id');
    if (error) throw error;
    res.json(data.map(r => ({
      ...r,
      product: r.products?.name || '',
      reviewer: r.users?.name || ''
    })));
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cart
app.get('/api/cart', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .select('id, quantity, products(id, name, price, stock)')
      .eq('user_id', req.user.id)
      .order('id');
    if (error) throw error;
    
    const cartWithImages = await Promise.all(data.map(async (item) => {
      const { data: images } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', item.products.id)
        .order('is_primary', { ascending: false })
        .limit(1);
      
      return {
        id: item.id,
        product_id: item.products.id,
        product_name: item.products.name,
        price: item.products.price,
        quantity: item.quantity,
        stock: item.products.stock,
        image_url: images?.[0]?.image_url || null
      };
    }));
    
    res.json(cartWithImages);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/cart', auth, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customers only' });
  const { product_id, quantity } = req.body;
  
  try {
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', product_id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .single();
    
    if (pError || !product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Not enough stock' });
    
    const { data: existing } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', req.user.id)
      .eq('product_id', product_id)
      .single();
    
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) return res.status(400).json({ error: 'Not enough stock' });
      await supabase.from('cart').update({ quantity: newQty }).eq('id', existing.id);
    } else {
      await supabase.from('cart').insert([{ user_id: req.user.id, product_id, quantity }]);
    }
    
    const { data: cart } = await supabase
      .from('cart')
      .select('id, quantity, products(name, price)')
      .eq('user_id', req.user.id)
      .order('id');
    
    res.json(cart.map(i => ({ id: i.id, product: i.products?.name, quantity: i.quantity, price: i.products?.price })));
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/cart/:id', auth, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });
  
  try {
    const { data: item, error: cError } = await supabase
      .from('cart')
      .select('*, products(stock)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    
    if (cError || !item) return res.status(404).json({ error: 'Cart item not found' });
    if (item.products.stock < quantity) return res.status(400).json({ error: `Only ${item.products.stock} available` });
    
    const { error } = await supabase.from('cart').update({ quantity }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/cart/:id', auth, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customers only' });
  
  try {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Removed' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/cart/count', auth, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customers only' });
  
  try {
    const { count, error } = await supabase
      .from('cart')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Wishlist
app.get('/api/wishlist', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select('id, products(name, price)')
      .eq('user_id', req.user.id)
      .order('id');
    if (error) throw error;
    res.json(data.map(w => ({ id: w.id, product: w.products?.name, price: w.products?.price })));
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Notifications
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, type, is_read, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Seller Products
app.get('/api/seller/products', auth, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only' });
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name), brands(name)')
      .eq('seller_id', req.user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const productsWithDetails = await Promise.all(products.map(async (p) => {
      const { data: images } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', p.id)
        .order('is_primary', { ascending: false })
        .limit(1);
      
      const { count: totalOrders } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', p.id);
      
      const { data: soldData } = await supabase
        .from('order_items')
        .select('quantity')
        .eq('product_id', p.id);
      
      const totalSold = soldData?.reduce((sum, i) => sum + i.quantity, 0) || 0;
      
      return {
        ...p,
        category_id: p.category_id?.toString() || '',
        brand_id: p.brand_id?.toString() || '',
        category: p.categories?.name || '',
        brand: p.brands?.name || '',
        total_orders: totalOrders || 0,
        total_sold: totalSold,
        imageData: getImageData(images?.[0]?.image_url)
      };
    }));
    
    res.json(productsWithDetails);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/seller/products/:id', auth, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only' });
  
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(name), brands(name)')
      .eq('id', req.params.id)
      .eq('seller_id', req.user.id)
      .eq('is_deleted', false)
      .single();
    
    if (error || !product) return res.status(404).json({ error: 'Not found' });
    
    const { data: images } = await supabase
      .from('product_images')
      .select('id, image_url, is_primary')
      .eq('product_id', req.params.id);
    
    res.json({
      ...product,
      category_id: product.category_id?.toString() || '',
      brand_id: product.brand_id?.toString() || '',
      category_name: product.categories?.name || '',
      brand_name: product.brands?.name || '',
      images: images?.map(img => ({ id: img.id, imageData: getImageData(img.image_url), is_primary: img.is_primary })) || []
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/products', auth, upload.array('images', 5), productValidation, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only' });
  const { name, description, price, category_id, brand_id, stock, featured } = req.body;
  
  try {
    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        name, description,
        price: parseFloat(price),
        category_id: parseInt(category_id),
        brand_id: parseInt(brand_id),
        seller_id: req.user.id,
        stock: parseInt(stock),
        featured: featured === '1',
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    if (req.files?.length) {
      const images = req.files.map((f, i) => ({
        product_id: product.id,
        image_url: `/uploads/${f.filename}`,
        is_primary: i === 0
      }));
      await supabase.from('product_images').insert(images);
    }
    
    const { data: imgs } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', product.id);
    
    res.status(201).json({ ...product, images: imgs?.map(i => i.image_url) || [] });
  } catch (err) {
    req.files?.forEach(f => fs.unlink(f.path, () => {}));
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/seller/products/:id', auth, upload.array('images', 5), productValidation, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only' });
  const { name, description, price, category_id, brand_id, stock, featured, is_active, delete_images } = req.body;
  
  try {
    const { data: product, error: checkErr } = await supabase
      .from('products')
      .select('id')
      .eq('id', req.params.id)
      .eq('seller_id', req.user.id)
      .eq('is_deleted', false)
      .single();
    
    if (checkErr || !product) return res.status(404).json({ error: 'Not found' });
    
    const { error: updateErr } = await supabase
      .from('products')
      .update({
        name, description,
        price: parseFloat(price),
        category_id: parseInt(category_id),
        brand_id: parseInt(brand_id),
        stock: parseInt(stock),
        featured: featured === '1',
        is_active: is_active === '1'
      })
      .eq('id', req.params.id);
    
    if (updateErr) throw updateErr;
    
    if (delete_images) {
      const imageIds = JSON.parse(delete_images);
      if (imageIds.length) {
        const { data: toDelete } = await supabase
          .from('product_images')
          .select('image_url')
          .in('id', imageIds)
          .eq('product_id', req.params.id);
        
        await supabase.from('product_images').delete().in('id', imageIds).eq('product_id', req.params.id);
        toDelete?.forEach(img => {
          const p = path.join(uploadsDir, img.image_url.replace('/uploads/', ''));
          fs.unlink(p, () => {});
        });
      }
    }
    
    const { count: imagesLeft } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', req.params.id);
    
    if (req.files?.length) {
      const newImages = req.files.map((f, i) => ({
        product_id: parseInt(req.params.id),
        image_url: `/uploads/${f.filename}`,
        is_primary: imagesLeft === 0 && i === 0
      }));
      await supabase.from('product_images').insert(newImages);
    }
    
    const { data: updated } = await supabase
      .from('products')
      .select('*, categories(name), brands(name)')
      .eq('id', req.params.id)
      .single();
    
    const { data: images } = await supabase
      .from('product_images')
      .select('id, image_url, is_primary')
      .eq('product_id', req.params.id)
      .order('is_primary', { ascending: false });
    
    res.json({
      ...updated,
      category_id: updated.category_id?.toString() || '',
      brand_id: updated.brand_id?.toString() || '',
      category: updated.categories?.name || '',
      brand: updated.brands?.name || '',
      images: images?.map(img => ({ id: img.id, imageData: getImageData(img.image_url), is_primary: img.is_primary })) || []
    });
  } catch (err) {
    req.files?.forEach(f => fs.unlink(f.path, () => {}));
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/seller/products/:id', auth, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only' });
  
  try {
    const { data: product, error: checkErr } = await supabase
      .from('products')
      .select('id')
      .eq('id', req.params.id)
      .eq('seller_id', req.user.id)
      .single();
    
    if (checkErr || !product) return res.status(404).json({ error: 'Not found' });
    
    const { error } = await supabase
      .from('products')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
  console.log(`✅ CarFix API running on http://localhost:${PORT}`);
  console.log(`📊 Using Supabase PostgreSQL`);
});
