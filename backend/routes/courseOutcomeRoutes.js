const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getCourseOutcomes, createCourseOutcome, updateCourseOutcome, deleteCourseOutcome } = require('../controllers/courseOutcomeController');

const router = express.Router();
router.route('/').get(protect, authorize(['Admin', 'Faculty']), getCourseOutcomes).post(protect, authorize(['Admin', 'Faculty']), createCourseOutcome);
router.route('/:id').put(protect, authorize(['Admin', 'Faculty']), updateCourseOutcome).delete(protect, authorize(['Admin', 'Faculty']), deleteCourseOutcome);

module.exports = router;
