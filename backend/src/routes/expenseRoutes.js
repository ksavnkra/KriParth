const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getExpenseSummary);
router.get('/', protect, getExpenses);
router.post('/', protect, createExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

module.exports = router;
