require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mysql = require('mysql2/promise');
const { auth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

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
      SELECT p.id, p.name, p.price, c.name AS category, b.name AS brand, u.name AS seller
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      JOIN users u ON p.seller_id = u.id
      ORDER BY p.id
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
}); 