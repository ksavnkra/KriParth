const express = require('express');
const router = express.Router();
const { getStockEntries, addStock, getStockSummary } = require('../controllers/stockController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/summary', protect, getStockSummary);
router.get('/', protect, getStockEntries);
router.post('/', protect, admin, addStock);

module.exports = router;
