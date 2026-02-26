const Stock = require('../models/stockModel');
const Product = require('../models/productModel');

// GET /api/stock
const getStockEntries = async (req, res) => {
  try {
    const { product, startDate, endDate } = req.query;
    const filter = {};
    if (product) filter.product = product;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const entries = await Stock.find(filter)
      .populate('product', 'name category')
      .populate('addedBy', 'name')
      .sort('-createdAt');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/stock
const addStock = async (req, res) => {
  try {
    const { product: productId, quantity, totalCost, sellerName, sellerGstNumber, gstPercentage, gstType, invoiceNumber, notes } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const stock = await Stock.create({
      product: productId,
      quantity,
      totalCost,
      sellerName,
      sellerGstNumber: sellerGstNumber || '',
      gstPercentage: gstPercentage !== undefined ? gstPercentage : product.gstPercentage,
      gstType: gstType || 'cgst_sgst',
      invoiceNumber: invoiceNumber || '',
      notes: notes || '',
      addedBy: req.user._id
    });

    // Update product stock quantity and cost price (base price per unit, ex-GST)
    product.stock += quantity;
    product.costPrice = stock.baseAmount / quantity;
    await product.save();

    const populated = await Stock.findById(stock._id)
      .populate('product', 'name category')
      .populate('addedBy', 'name');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/stock/summary
const getStockSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthStocks = await Stock.find({ createdAt: { $gte: startOfMonth } }).populate('product', 'name category');

    const totalPurchases = monthStocks.reduce((s, st) => s + st.totalCost, 0);
    const totalGstPaid = monthStocks.reduce((s, st) => s + st.gstAmount, 0);
    const totalQuantity = monthStocks.reduce((s, st) => s + st.quantity, 0);

    // By seller
    const bySeller = {};
    monthStocks.forEach(st => {
      if (!bySeller[st.sellerName]) bySeller[st.sellerName] = { total: 0, gst: 0, entries: 0 };
      bySeller[st.sellerName].total += st.totalCost;
      bySeller[st.sellerName].gst += st.gstAmount;
      bySeller[st.sellerName].entries += 1;
    });

    res.json({ totalPurchases: Math.round(totalPurchases), totalGstPaid: Math.round(totalGstPaid), totalQuantity, bySeller, entries: monthStocks.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStockEntries, addStock, getStockSummary };
