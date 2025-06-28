const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { generateToken, verifyToken } = require('../middleware/auth');

// In-memory user storage (in production, use a database)
const users = [];

// Register route
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required.'
    });
  }

  // Check if user already exists
  const existingUser = users.find(user => 
    user.email === email || user.username === username
  );

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists.'
    });
  }

  // Create new user
  const newUser = {
    id: uuidv4(), // Generate a unique ID
    username,
    email,
    password, // In production, hash the password
    createdAt: new Date()
  };

  users.push(newUser);

  // Generate JWT token
  const token = generateToken({
    id: newUser.id,
    username: newUser.username,
    email: newUser.email
  });

  // Set token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    }
  });
});

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  // Find user
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email
  });

  // Set token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// Get current user profile (protected route)
router.get('/profile', verifyToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
  });
});

// Verify token route
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid.',
    user: req.user
  });
});

module.exports = router;
