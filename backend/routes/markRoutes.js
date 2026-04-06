const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getMarks, createMark, updateMark, deleteMark } = require('../controllers/markController');

const router = express.Router();

router.route('/')
  .get(protect, authorize(['Admin', 'Faculty']), getMarks)
  .post(protect, authorize(['Admin', 'Faculty']), createMark);

router.route('/:id')
  .put(protect, authorize(['Admin', 'Faculty']), updateMark)
  .delete(protect, authorize(['Admin', 'Faculty']), deleteMark);

module.exports = router;
