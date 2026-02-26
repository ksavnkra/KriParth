const Order = require('../models/orderModel');
const Product = require('../models/productModel');

// Generate unique order number
const generateOrderNumber = () => {
  const now = new Date();
  const prefix = 'KP';
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${date}${rand}`;
};

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { items, paymentMethod, customerName, customerPhone } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items in order' });

    let subtotal = 0;
    let totalGst = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const lineTotal = product.price * item.quantity;
      const gstAmount = (lineTotal * product.gstPercentage) / 100;

      orderItems.push({
        product: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: item.quantity,
        gstPercentage: product.gstPercentage,
        gstAmount
      });

      subtotal += lineTotal;
      totalGst += gstAmount;

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      items: orderItems,
      subtotal,
      totalGst,
      totalAmount: subtotal + totalGst,
      paymentMethod: paymentMethod || 'cash',
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      cashier: req.user._id
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const { startDate, endDate, status, limit } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const orders = await Order.find(filter)
      .populate('cashier', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit) || 100);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('cashier', 'name');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getOrders, getOrder };
