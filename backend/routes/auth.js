const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { loginValidation, registerValidation } = require('../middleware/validators');
const { generateToken, auth } = require('../middleware/auth');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'r00tr00t',
  database: process.env.DB_NAME || 'carfix'
};

// Login route
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    const conn = await mysql.createConnection(dbConfig);

    const [users] = await conn.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    await conn.end();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register route
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const conn = await mysql.createConnection(dbConfig);

    // Check if user already exists
    const [existingUsers] = await conn.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await conn.end();
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await conn.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    const [newUser] = await conn.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [result.insertId]
    );

    await conn.end();

    const token = generateToken(newUser[0]);
    res.status(201).json({
      token,
      user: newUser[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [users] = await conn.execute(
      'SELECT id, name, email, role, is_verified, is_active FROM users WHERE id = ?',
      [req.user.id]
    );
    await conn.end();

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Validate token route
router.get('/validate', auth, async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [users] = await conn.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [req.user.id]
    );
    await conn.end();

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 