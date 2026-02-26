const Expense = require('../models/expenseModel');

// GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const expenses = await Expense.find(filter).populate('addedBy', 'name').sort('-date');
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ expenses, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/expenses/summary
const getExpenseSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [monthExpenses, todayExpenses] = await Promise.all([
      Expense.find({ date: { $gte: startOfMonth } }),
      Expense.find({ date: { $gte: startOfDay } })
    ]);

    const byCategory = {};
    monthExpenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    // Daily totals for the last 30 days
    const dailyTotals = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayExpenses = monthExpenses.filter(e => e.date >= dayStart && e.date < dayEnd);
      dailyTotals.push({
        date: dayStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        total: dayExpenses.reduce((s, e) => s + e.amount, 0)
      });
    }

    res.json({
      todayTotal: todayExpenses.reduce((s, e) => s + e.amount, 0),
      monthTotal: monthExpenses.reduce((s, e) => s + e.amount, 0),
      byCategory,
      dailyTotals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary };
