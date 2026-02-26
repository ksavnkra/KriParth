const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  totalCost: { type: Number, required: true }, // GST-inclusive total entered by user
  purchasePrice: { type: Number, default: 0 }, // auto-calc: totalCost / quantity (inclusive per unit)
  baseAmount: { type: Number, default: 0 },    // totalCost without GST
  sellerName: { type: String, required: true },
  sellerGstNumber: { type: String, default: '' },
  gstPercentage: { type: Number, default: 18 },
  gstType: { type: String, enum: ['cgst_sgst', 'igst'], default: 'cgst_sgst' },
  gstAmount: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  invoiceNumber: { type: String, default: '' },
  notes: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// GST is INCLUSIVE — totalCost already contains GST
stockSchema.pre('save', function (next) {
  const rate = Number(this.gstPercentage) || 0;
  this.baseAmount = rate > 0 ? this.totalCost / (1 + rate / 100) : this.totalCost;
  this.gstAmount = this.totalCost - this.baseAmount;
  this.purchasePrice = this.totalCost / this.quantity; // inclusive per-unit

  if (this.gstType === 'igst') {
    this.igstAmount = this.gstAmount;
    this.cgstAmount = 0;
    this.sgstAmount = 0;
  } else {
    this.cgstAmount = this.gstAmount / 2;
    this.sgstAmount = this.gstAmount / 2;
    this.igstAmount = 0;
  }
  next();
});

module.exports = mongoose.model('Stock', stockSchema);
