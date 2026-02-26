const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
  gstPercentage: { type: Number, default: 18 },
  stock: { type: Number, default: 0 },
  barcode: { type: String, default: '' },
  unit: { type: String, default: 'pcs' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: 'text', category: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', productSchema);
