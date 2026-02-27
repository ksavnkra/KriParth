const Order = require('../models/orderModel');
const Expense = require('../models/expenseModel');
const Product = require('../models/productModel');
const Stock = require('../models/stockModel');

const getGemini = () => {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return null;
};

// GET /api/ai/insights
const getInsights = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [orders, expenses, products, stocks] = await Promise.all([
      Order.find({ createdAt: { $gte: startOfLastMonth }, status: 'completed' }),
      Expense.find({ date: { $gte: startOfLastMonth } }),
      Product.find({}),
      Stock.find({ createdAt: { $gte: startOfLastMonth } })
    ]);

    const thisMonthOrders = orders.filter(o => o.createdAt >= startOfMonth);
    const lastMonthOrders = orders.filter(o => o.createdAt < startOfMonth);
    const thisMonthRevenue = thisMonthOrders.reduce((s, o) => s + o.totalAmount, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.totalAmount, 0);
    const thisMonthExpenses = expenses.filter(e => e.date >= startOfMonth).reduce((s, e) => s + e.amount, 0);
    const lastMonthExpenses = expenses.filter(e => e.date < startOfMonth).reduce((s, e) => s + e.amount, 0);
    const revenueGrowth = lastMonthRevenue ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;
    const lowStockProducts = products.filter(p => p.stock <= 10 && p.isActive);

    const topProducts = {};
    thisMonthOrders.forEach(o => o.items.forEach(item => {
      topProducts[item.name] = (topProducts[item.name] || 0) + item.quantity;
    }));
    const sortedProducts = Object.entries(topProducts).sort((a, b) => b[1] - a[1]);

    // Build rule-based insights
    const insights = [];

    if (Number(revenueGrowth) > 0) {
      insights.push({ type: 'success', title: 'Revenue Growing', message: `Revenue is up ${revenueGrowth}% compared to last month. Great momentum!` });
    } else if (Number(revenueGrowth) < 0) {
      insights.push({ type: 'warning', title: 'Revenue Decline', message: `Revenue dropped ${Math.abs(revenueGrowth)}% vs last month. Consider promotions or expanding products.` });
    }

    if (lowStockProducts.length > 0) {
      insights.push({ type: 'alert', title: 'Low Stock Alert', message: `${lowStockProducts.length} product(s) running low. Reorder soon!`, items: lowStockProducts.map(p => `${p.name} (${p.stock} left)`) });
    }

    if (sortedProducts.length > 0) {
      insights.push({ type: 'info', title: 'Best Seller', message: `"${sortedProducts[0][0]}" leads this month with ${sortedProducts[0][1]} units sold.` });
    }

    if (lastMonthExpenses > 0) {
      const expChange = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1);
      if (expChange > 20) {
        insights.push({ type: 'warning', title: 'Expense Spike', message: `Expenses jumped ${expChange}% this month. Review your spending categories.` });
      }
    }

    const profit = thisMonthRevenue - thisMonthExpenses;
    const margin = thisMonthRevenue > 0 ? (profit / thisMonthRevenue * 100).toFixed(1) : 0;
    insights.push({
      type: profit > 0 ? 'success' : 'danger',
      title: profit > 0 ? 'Profitable' : 'Loss Alert',
      message: profit > 0
        ? `Net profit: ₹${Math.round(profit).toLocaleString()} (${margin}% margin)`
        : `Net loss: ₹${Math.abs(Math.round(profit)).toLocaleString()}. Focus on boosting sales or cutting costs.`
    });

    // GST insight
    const gstCollected = thisMonthOrders.reduce((s, o) => s + o.totalGst, 0);
    const gstPaid = stocks.filter(st => st.createdAt >= startOfMonth).reduce((s, st) => s + st.gstAmount, 0);
    insights.push({
      type: 'info',
      title: 'GST Summary',
      message: `Collected: ₹${Math.round(gstCollected).toLocaleString()} | Paid: ₹${Math.round(gstPaid).toLocaleString()} | Liability: ₹${Math.round(gstCollected - gstPaid).toLocaleString()}`
    });

    // Try Gemini for advanced insights
    const model = getGemini();
    if (model) {
      try {
        const prompt = `You are a concise business analytics assistant for a POS system. Give 2-3 brief, actionable recommendations.\n\nBusiness data: Revenue this month ₹${Math.round(thisMonthRevenue)}, last month ₹${Math.round(lastMonthRevenue)}. Expenses ₹${Math.round(thisMonthExpenses)}. Orders: ${thisMonthOrders.length}. Low stock: ${lowStockProducts.length} items. Top product: ${sortedProducts[0]?.[0] || 'N/A'}. Keep under 150 words.`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        insights.push({ type: 'ai', title: 'AI Recommendation', message: response.text() });
      } catch (err) {
        console.log('Gemini unavailable:', err.message);
      }
    }

    res.json({ insights, hasAI: !!model });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/ai/report
const generateReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const [orders, expenses, stocks] = await Promise.all([
      Order.find({ createdAt: { $gte: start, $lte: end }, status: 'completed' }),
      Expense.find({ date: { $gte: start, $lte: end } }),
      Stock.find({ createdAt: { $gte: start, $lte: end } })
    ]);

    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalPurchases = stocks.reduce((s, st) => s + st.totalCost, 0);
    const gstCollected = orders.reduce((s, o) => s + o.totalGst, 0);
    const gstPaid = stocks.reduce((s, st) => s + st.gstAmount, 0);

    // Sales by day
    const salesByDay = {};
    orders.forEach(o => {
      const day = o.createdAt.toISOString().split('T')[0];
      if (!salesByDay[day]) salesByDay[day] = { revenue: 0, orders: 0 };
      salesByDay[day].revenue += o.totalAmount;
      salesByDay[day].orders += 1;
    });

    // Expense breakdown
    const expenseBreakdown = {};
    expenses.forEach(e => {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
    });

    // Payment method breakdown
    const paymentMethods = {};
    orders.forEach(o => {
      paymentMethods[o.paymentMethod] = (paymentMethods[o.paymentMethod] || 0) + o.totalAmount;
    });

    res.json({
      period: { start, end },
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalExpenses),
        totalPurchases: Math.round(totalPurchases),
        netProfit: Math.round(totalRevenue - totalExpenses),
        totalOrders: orders.length,
        avgOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
        gstCollected: Math.round(gstCollected),
        gstPaid: Math.round(gstPaid),
        gstLiability: Math.round(gstCollected - gstPaid)
      },
      salesByDay: Object.entries(salesByDay).map(([date, data]) => ({ date, ...data })),
      expenseBreakdown: Object.entries(expenseBreakdown).map(([name, value]) => ({ name, value: Math.round(value) })),
      paymentMethods: Object.entries(paymentMethods).map(([name, value]) => ({ name, value: Math.round(value) }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getInsights, generateReport };
