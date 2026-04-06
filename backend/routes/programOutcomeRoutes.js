const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getProgramOutcomes, createProgramOutcome, updateProgramOutcome, deleteProgramOutcome } = require('../controllers/programOutcomeController');

const router = express.Router();
router.route('/')
  .get(protect, authorize(['Admin', 'Faculty']), getProgramOutcomes)
  .post(protect, authorize(['Admin']), createProgramOutcome);
router.route('/:id')
  .put(protect, authorize(['Admin']), updateProgramOutcome)
  .delete(protect, authorize(['Admin']), deleteProgramOutcome);

module.exports = router;
