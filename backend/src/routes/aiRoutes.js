const express = require('express');
const router = express.Router();
const { getInsights, generateReport } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/insights', protect, getInsights);
router.get('/report', protect, generateReport);

module.exports = router;
