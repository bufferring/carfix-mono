const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { loginValidation, registerValidation } = require('../middleware/validators');
const { generateToken, auth } = require('../middleware/auth');
const { supabase } = require('../config/db');

// Login route
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) throw error;

    if (!users || users.length === 0) {
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

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (checkError) throw checkError;

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        role
      }])
      .select('id, name, email, role')
      .single();

    if (insertError) throw insertError;

    const token = generateToken(newUser);
    res.status(201).json({
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_verified, is_active')
      .eq('id', req.user.id);

    if (error) throw error;

    if (!users || users.length === 0) {
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
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', req.user.id);

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
