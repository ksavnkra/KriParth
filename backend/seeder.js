const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const User = require('./src/models/userModel');
const Product = require('./src/models/productModel');
const Order = require('./src/models/orderModel');
const Expense = require('./src/models/expenseModel');
const Stock = require('./src/models/stockModel');
const users = require('./data/users');
const products = require('./data/products');

dotenv.config();
connectDB();

const seed = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Order.deleteMany(),
      Expense.deleteMany(),
      Stock.deleteMany()
    ]);
    console.log('✦ Data cleared');

    // Seed users (use .create() so pre-save password hashing runs)
    const createdUsers = await User.create(users);
    const admin = createdUsers[0];
    console.log(`✦ ${createdUsers.length} users seeded`);

    // Seed products
    const createdProducts = await Product.insertMany(products);
    console.log(`✦ ${createdProducts.length} products seeded`);

    // Create sample orders (last 30 days)
    const orderBatch = [];
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let subtotal = 0;
      let totalGst = 0;

      for (let j = 0; j < numItems; j++) {
        const p = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const lineTotal = p.price * qty;
        const gstAmt = (lineTotal * p.gstPercentage) / 100;
        items.push({ product: p._id, name: p.name, category: p.category, price: p.price, quantity: qty, gstPercentage: p.gstPercentage, gstAmount: gstAmt });
        subtotal += lineTotal;
        totalGst += gstAmt;
      }

      orderBatch.push({
        orderNumber: `KP${String(orderDate.getFullYear()).slice(2)}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}${1000 + i}`,
        items,
        subtotal,
        totalGst,
        totalAmount: subtotal + totalGst,
        paymentMethod: ['cash', 'card', 'upi'][Math.floor(Math.random() * 3)],
        cashier: admin._id,
        createdAt: orderDate,
        updatedAt: orderDate
      });
    }
    await Order.insertMany(orderBatch);
    console.log(`✦ ${orderBatch.length} sample orders seeded`);

    // Create sample expenses
    const expenseCategories = ['rent', 'utilities', 'salary', 'supplies', 'transport', 'food', 'maintenance'];
    const expenseBatch = [];
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      expenseBatch.push({
        title: `${expenseCategories[i % expenseCategories.length]} expense`,
        amount: Math.floor(Math.random() * 5000) + 200,
        category: expenseCategories[i % expenseCategories.length],
        date,
        description: 'Auto-seeded expense entry',
        paymentMethod: ['cash', 'bank', 'upi'][Math.floor(Math.random() * 3)],
        addedBy: admin._id
      });
    }
    await Expense.insertMany(expenseBatch);
    console.log(`✦ ${expenseBatch.length} sample expenses seeded`);

    // Create sample stock entries
    const stockBatch = [];
    const sellers = [
      { name: 'Reliance Wholesale', gst: '27AABCR1234A1Z5' },
      { name: 'Metro Cash & Carry', gst: '07AABCM5678B2Z1' },
      { name: 'Local Supplier', gst: '' }
    ];
    for (let i = 0; i < 10; i++) {
      const p = createdProducts[i % createdProducts.length];
      const seller = sellers[i % sellers.length];
      const qty = Math.floor(Math.random() * 50) + 10;
      const basePricePerUnit = p.costPrice;
      const gstPct = p.gstPercentage;
      const gstType = i % 3 === 0 ? 'igst' : 'cgst_sgst';
      // totalCost is GST-inclusive
      const baseTotal = basePricePerUnit * qty;
      const totalCost = baseTotal * (1 + gstPct / 100);
      const gstAmount = totalCost - baseTotal;
      stockBatch.push({
        product: p._id,
        quantity: qty,
        totalCost,
        purchasePrice: totalCost / qty,
        baseAmount: baseTotal,
        sellerName: seller.name,
        sellerGstNumber: seller.gst,
        gstPercentage: gstPct,
        gstType,
        gstAmount,
        cgstAmount: gstType === 'cgst_sgst' ? gstAmount / 2 : 0,
        sgstAmount: gstType === 'cgst_sgst' ? gstAmount / 2 : 0,
        igstAmount: gstType === 'igst' ? gstAmount : 0,
        addedBy: admin._id
      });
    }
    await Stock.insertMany(stockBatch);
    console.log(`✦ ${stockBatch.length} stock entries seeded`);

    console.log('\n✦ Seeding complete!');
    console.log('Admin: admin@kriparth.com / admin123');
    console.log('Cashier: cashier@kriparth.com / cashier123\n');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
