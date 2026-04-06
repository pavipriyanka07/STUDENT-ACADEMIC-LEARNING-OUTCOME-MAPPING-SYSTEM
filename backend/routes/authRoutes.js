const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { optionalProtect } = require('../middleware/auth');

const router = express.Router();
router.post('/register', optionalProtect, registerUser);
router.post('/login', loginUser);

module.exports = router;
