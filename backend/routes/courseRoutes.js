const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getCourses, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');

const router = express.Router();
router.route('/')
  .get(protect, authorize(['Admin', 'Faculty']), getCourses)
  .post(protect, authorize(['Admin']), createCourse);
router.route('/:id')
  .put(protect, authorize(['Admin']), updateCourse)
  .delete(protect, authorize(['Admin']), deleteCourse);

module.exports = router;
