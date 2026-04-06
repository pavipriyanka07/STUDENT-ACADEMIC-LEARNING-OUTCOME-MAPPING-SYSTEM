const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getReports } = require('../controllers/reportController');

const router = express.Router();

router.get('/', protect, authorize(['Admin', 'Faculty']), getReports);

module.exports = router;
