const jwt = require('jsonwebtoken');

// JWT secret key (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!JWT_SECRET) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error. Secret has not been set.' 
    });
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h' 
  });
};

module.exports = {
  verifyToken,
  generateToken,
  JWT_SECRET
}; 