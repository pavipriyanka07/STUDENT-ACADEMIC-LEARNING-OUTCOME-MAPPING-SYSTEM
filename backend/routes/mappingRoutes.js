const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getMappings, upsertMapping, deleteMapping, getMatrix } = require('../controllers/mappingController');

const router = express.Router();
router.get('/matrix', protect, authorize(['Admin', 'Faculty']), getMatrix);
router.get('/', protect, authorize(['Admin', 'Faculty']), getMappings);
router.post('/', protect, authorize(['Admin', 'Faculty']), upsertMapping);
router.delete('/:id', protect, authorize(['Admin', 'Faculty']), deleteMapping);

module.exports = router;
