const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'r00tr00t',
  database: process.env.DB_NAME || 'carfix',
};

// Helper to get a connection
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// GET /users
app.get('/users', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, name, email, role, is_verified, is_active FROM users ORDER BY id');
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /products
app.get('/products', async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
});

// GET /orders
app.get('/orders', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT o.id, u.name AS customer, o.total_amount, o.status, o.payment_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /categories
app.get('/categories', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, name, description, is_featured, is_active FROM categories ORDER BY id');
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /brands
app.get('/brands', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, name, description, is_featured, is_active FROM brands ORDER BY id');
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reviews
app.get('/reviews', async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
});

// GET /cart
app.get('/cart', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT c.id, u.name AS customer, p.name AS product, c.quantity
      FROM cart c
      JOIN users u ON c.user_id = u.id
      JOIN products p ON c.product_id = p.id
      ORDER BY c.id
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /wishlist
app.get('/wishlist', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT w.id, u.name AS customer, p.name AS product
      FROM wishlist w
      JOIN users u ON w.user_id = u.id
      JOIN products p ON w.product_id = p.id
      ORDER BY w.id
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /notifications
app.get('/notifications', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT n.id, u.name AS user, n.title, n.message, n.type, n.is_read
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.id
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
}); 