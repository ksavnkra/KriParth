const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    enum: ['rent', 'utilities', 'salary', 'supplies', 'marketing', 'transport', 'maintenance', 'food', 'other'],
    default: 'other'
  },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  paymentMethod: { type: String, enum: ['cash', 'bank', 'upi', 'card'], default: 'cash' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
