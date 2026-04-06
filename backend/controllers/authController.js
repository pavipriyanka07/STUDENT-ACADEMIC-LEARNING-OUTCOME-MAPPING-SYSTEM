const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

const registerUser = async (req, res, next) => {
  try {
    const { username, password, role = 'Admin' } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const usersExist = await User.exists({});
    const isAdmin = req.user && req.user.role === 'Admin';
    let normalizedRole = role === 'Faculty' ? 'Faculty' : 'Admin';
    if (usersExist && !isAdmin) {
      normalizedRole = 'Faculty';
    }
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = await User.create({ username, password, role: normalizedRole });
    return res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser };
