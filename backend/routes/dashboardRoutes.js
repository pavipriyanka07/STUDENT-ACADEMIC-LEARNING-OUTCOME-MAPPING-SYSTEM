const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getDashboardSummary } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/summary', protect, authorize(['Admin', 'Faculty']), getDashboardSummary);

module.exports = router;
