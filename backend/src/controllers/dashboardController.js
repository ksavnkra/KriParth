const Order = require('../models/orderModel');
const Expense = require('../models/expenseModel');
const Product = require('../models/productModel');
const Stock = require('../models/stockModel');

// GET /api/dashboard
const getDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayOrders, monthOrders, monthExpenses, products, monthStocks] = await Promise.all([
      Order.find({ createdAt: { $gte: startOfDay }, status: 'completed' }),
      Order.find({ createdAt: { $gte: startOfMonth }, status: 'completed' }),
      Expense.find({ date: { $gte: startOfMonth } }),
      Product.find({}),
      Stock.find({ createdAt: { $gte: startOfMonth } })
    ]);

    const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
    const monthRevenue = monthOrders.reduce((s, o) => s + o.totalAmount, 0);
    const monthExpenseTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalGstCollected = monthOrders.reduce((s, o) => s + o.totalGst, 0);
    const totalGstPaid = monthStocks.reduce((s, st) => s + st.gstAmount, 0);

    // Revenue over last 7 days
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = monthOrders.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd);
      const dayExpenses = monthExpenses.filter(e => e.date >= dayStart && e.date < dayEnd);

      revenueByDay.push({
        date: dayStart.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
        expenses: dayExpenses.reduce((s, e) => s + e.amount, 0),
        orders: dayOrders.length
      });
    }

    // Category breakdown for pie chart
    const categoryMap = {};
    monthOrders.forEach(order => {
      order.items.forEach(item => {
        const cat = item.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + item.price * item.quantity;
      });
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value: Math.round(value) }));

    // Top 5 products
    const productSales = {};
    monthOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Expense by category
    const expenseByCategory = {};
    monthExpenses.forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });
    const expenseCategoryData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value: Math.round(value) }));

    // Recent orders
    const recentOrders = await Order.find({}).sort('-createdAt').limit(8).populate('cashier', 'name');

    // Low stock items
    const lowStock = products.filter(p => p.stock <= 10 && p.isActive).sort((a, b) => a.stock - b.stock).slice(0, 5);

    res.json({
      stats: {
        todayRevenue: Math.round(todayRevenue),
        todayOrders: todayOrders.length,
        monthRevenue: Math.round(monthRevenue),
        monthOrders: monthOrders.length,
        monthExpenses: Math.round(monthExpenseTotal),
        netProfit: Math.round(monthRevenue - monthExpenseTotal),
        totalGstCollected: Math.round(totalGstCollected),
        totalGstPaid: Math.round(totalGstPaid),
        totalProducts: products.length
      },
      charts: { revenueByDay, categoryData, topProducts, expenseCategoryData },
      recentOrders,
      lowStock
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardData };
