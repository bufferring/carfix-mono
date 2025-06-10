require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mysql = require('mysql2/promise');
const { auth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const { productValidation } = require('./middleware/validators');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'r00tr00t',
  database: process.env.DB_NAME || 'carfix'
};

// Helper to get a connection
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// Routes
app.use('/api/auth', authRoutes);

// Protected routes
// GET /users
app.get('/api/users', auth, async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id, name, email, role, is_verified, is_active FROM users ORDER BY id'
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /products
app.get('/api/products', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT p.id, p.name, p.price, p.featured, c.name AS category, b.name AS brand, u.name AS seller
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.is_active = true AND p.is_deleted = false
      ORDER BY p.featured DESC, p.id
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /orders (protected, only customer's own orders or all orders for admin)
app.get('/api/orders', auth, async (req, res) => {
  try {
    const conn = await getConnection();
    let query = `
      SELECT o.id, u.name AS customer, o.total_amount, o.status, o.payment_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    
    // If not admin, only show user's own orders
    if (req.user.role !== 'admin') {
      query += ' WHERE o.user_id = ?';
    }
    
    query += ' ORDER BY o.id';
    
    const [rows] = await conn.execute(
      query,
      req.user.role !== 'admin' ? [req.user.id] : []
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /categories
app.get('/api/categories', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id, name, description, is_featured, is_active FROM categories ORDER BY id'
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /brands
app.get('/api/brands', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id, name, description, is_featured, is_active FROM brands ORDER BY id'
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT r.id, p.name AS product, u.name AS reviewer, r.rating, r.title, r.comment, r.is_verified, r.is_approved
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.id
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /cart (protected, only user's own cart)
app.get('/api/cart', auth, async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT c.id, p.name AS product, c.quantity, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.id
    `, [req.user.id]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /wishlist (protected, only user's own wishlist)
app.get('/api/wishlist', auth, async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT w.id, p.name AS product, p.price
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.id
    `, [req.user.id]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /notifications (protected, only user's own notifications)
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /seller/products (protected, seller only)
app.get('/api/seller/products', auth, async (req, res) => {
  // Check if user is a seller
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can access their products' });
  }

  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
        p.id, p.name, p.description, p.price, p.stock, p.featured,
        p.is_active, p.created_at, p.updated_at,
        c.name AS category, b.name AS brand,
        (SELECT COUNT(*) FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE oi.product_id = p.id) as total_orders,
        (SELECT SUM(oi.quantity) FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE oi.product_id = p.id) as total_sold
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      WHERE p.seller_id = ? AND p.is_deleted = false
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching seller products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /seller/products/:id (protected, seller only)
app.put('/api/seller/products/:id', auth, productValidation, async (req, res) => {
  // Check if user is a seller
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can update products' });
  }

  try {
    const { id } = req.params;
    const { name, description, price, category_id, brand_id, stock, featured, is_active } = req.body;
    const conn = await getConnection();

    // Verify product belongs to seller
    const [products] = await conn.execute(
      'SELECT id FROM products WHERE id = ? AND seller_id = ?',
      [id, req.user.id]
    );

    if (products.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Update product
    await conn.execute(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, category_id = ?, 
          brand_id = ?, stock = ?, featured = ?, is_active = ?,
          updated_at = NOW()
      WHERE id = ? AND seller_id = ?
    `, [name, description, price, category_id, brand_id, stock, featured, is_active, id, req.user.id]);

    // Get updated product
    const [updatedProduct] = await conn.execute(`
      SELECT p.*, c.name AS category, b.name AS brand
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?
    `, [id]);

    await conn.end();
    res.json(updatedProduct[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /seller/products/:id (protected, seller only)
app.delete('/api/seller/products/:id', auth, async (req, res) => {
  // Check if user is a seller
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can delete products' });
  }

  try {
    const { id } = req.params;
    const conn = await getConnection();

    // Verify product belongs to seller
    const [products] = await conn.execute(
      'SELECT id FROM products WHERE id = ? AND seller_id = ?',
      [id, req.user.id]
    );

    if (products.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Soft delete product
    await conn.execute(
      'UPDATE products SET is_deleted = true, updated_at = NOW() WHERE id = ?',
      [id]
    );

    await conn.end();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /products (protected, seller only)
app.post('/api/products', auth, productValidation, async (req, res) => {
  // Check if user is a seller
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can create products' });
  }

  try {
    const { name, description, price, category_id, brand_id, stock, images, featured } = req.body;
    const conn = await getConnection();

    // Start transaction
    await conn.beginTransaction();

    try {
      // Insert product
      const [result] = await conn.execute(
        `INSERT INTO products (
          name, description, price, category_id, brand_id, 
          seller_id, stock, featured, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW())`,
        [name, description, price, category_id, brand_id, req.user.id, stock, featured || false]
      );

      const productId = result.insertId;

      // Insert product images if provided
      if (images && images.length > 0) {
        const imageValues = images.map(image => [productId, image.url, image.alt || name]);
        await conn.execute(
          'INSERT INTO product_images (product_id, image_url, alt_text) VALUES ?',
          [imageValues]
        );
      }

      // Commit transaction
      await conn.commit();

      // Get the created product with its details
      const [product] = await conn.execute(`
        SELECT p.*, c.name AS category, b.name AS brand, u.name AS seller
        FROM products p
        JOIN categories c ON p.category_id = c.id
        JOIN brands b ON p.brand_id = b.id
        JOIN users u ON p.seller_id = u.id
        WHERE p.id = ?
      `, [productId]);

      await conn.end();
      res.status(201).json(product[0]);
    } catch (error) {
      // Rollback transaction on error
      await conn.rollback();
      throw error;
    }
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /cart (protected, customer only)
app.post('/api/cart', auth, async (req, res) => {
  // Check if user is a customer
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can add items to cart' });
  }

  try {
    const { product_id, quantity } = req.body;
    const conn = await getConnection();

    // Check if product exists and is active
    const [products] = await conn.execute(
      'SELECT id, stock FROM products WHERE id = ? AND is_active = true AND is_deleted = false',
      [product_id]
    );

    if (products.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    const product = products[0];
    if (product.stock < quantity) {
      await conn.end();
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // Check if item already in cart
    const [existingItems] = await conn.execute(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      if (product.stock < newQuantity) {
        await conn.end();
        return res.status(400).json({ error: 'Not enough stock available' });
      }

      await conn.execute(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      // Add new item
      await conn.execute(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );
    }

    // Get updated cart
    const [cartItems] = await conn.execute(`
      SELECT c.id, p.name AS product, c.quantity, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.id
    `, [req.user.id]);

    await conn.end();
    res.json(cartItems);
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /cart/:id (protected, customer only)
app.put('/api/cart/:id', auth, async (req, res) => {
  // Check if user is a customer
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can update cart' });
  }

  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const conn = await getConnection();

    // Verify cart item belongs to user
    const [cartItems] = await conn.execute(
      'SELECT c.*, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.user_id = ?',
      [id, req.user.id]
    );

    if (cartItems.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Cart item not found or unauthorized' });
    }

    const cartItem = cartItems[0];
    if (cartItem.stock < quantity) {
      await conn.end();
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // Update quantity
    await conn.execute(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    // Get updated cart
    const [updatedCart] = await conn.execute(`
      SELECT c.id, p.name AS product, c.quantity, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.id
    `, [req.user.id]);

    await conn.end();
    res.json(updatedCart);
  } catch (err) {
    console.error('Error updating cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /cart/:id (protected, customer only)
app.delete('/api/cart/:id', auth, async (req, res) => {
  // Check if user is a customer
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can remove items from cart' });
  }

  try {
    const { id } = req.params;
    const conn = await getConnection();

    // Verify cart item belongs to user
    const [cartItems] = await conn.execute(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (cartItems.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Cart item not found or unauthorized' });
    }

    // Remove item
    await conn.execute(
      'DELETE FROM cart WHERE id = ?',
      [id]
    );

    await conn.end();
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get cart count
app.get('/api/cart/count', auth, async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can access cart' });
  }

  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [req.user.id]
    );
    await conn.end();
    res.json({ count: parseInt(rows[0].count) });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
}); 