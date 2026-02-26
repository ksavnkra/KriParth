const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  gstPercentage: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  totalGst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi'], default: 'cash' },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['completed', 'cancelled', 'refunded'], default: 'completed' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
