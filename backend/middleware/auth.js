const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const optionalProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  return protect(req, res, next);
};

const authorize = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (!roles.length || roles.includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Insufficient permissions' });
};

module.exports = { protect, optionalProtect, authorize };
