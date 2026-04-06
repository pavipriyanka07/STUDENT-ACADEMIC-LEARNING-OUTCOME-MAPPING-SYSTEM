const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getSubjects, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');

const router = express.Router();
router.route('/').get(protect, authorize(['Admin', 'Faculty']), getSubjects).post(protect, authorize(['Admin', 'Faculty']), createSubject);
router.route('/:id').put(protect, authorize(['Admin', 'Faculty']), updateSubject).delete(protect, authorize(['Admin', 'Faculty']), deleteSubject);

module.exports = router;
