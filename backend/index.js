const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/expenses', require('./src/routes/expenseRoutes'));
app.use('/api/stock', require('./src/routes/stockRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'KriParth POS API v2.0 is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✦ KriParth POS server running on port ${PORT}`));
