import { useState, useEffect } from 'react';
import API from '../config/axios';
import { TrendingUp, ShoppingBag, Wallet, IndianRupee, ArrowUpRight, ArrowDownRight, Package, Sparkles, AlertTriangle, Info, CheckCircle, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const insightIcons = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  alert: <AlertTriangle size={18} className="text-red-500" />,
  danger: <AlertTriangle size={18} className="text-red-500" />,
  info: <Info size={18} className="text-blue-500" />,
  ai: <Brain size={18} className="text-violet-500" />,
};

const insightBg = {
  success: 'bg-emerald-50 border-emerald-200',
  warning: 'bg-amber-50 border-amber-200',
  alert: 'bg-red-50 border-red-200',
  danger: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  ai: 'bg-violet-50 border-violet-200',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, ai] = await Promise.all([
          API.get('/dashboard'),
          API.get('/ai/insights').catch(() => ({ data: { insights: [] } })),
        ]);
        setData(dash.data);
        setInsights(ai.data.insights || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  if (!data) return <p className="text-zinc-500">Failed to load dashboard</p>;

  const { stats, charts, recentOrders, lowStock } = data;

  const statCards = [
    { label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString()}`, sub: `${stats.todayOrders} orders`, icon: IndianRupee, color: 'from-brand-500 to-teal-400', trend: 'up' },
    { label: 'Monthly Revenue', value: `₹${stats.monthRevenue.toLocaleString()}`, sub: `${stats.monthOrders} orders`, icon: TrendingUp, color: 'from-blue-500 to-blue-400', trend: 'up' },
    { label: 'Monthly Expenses', value: `₹${stats.monthExpenses.toLocaleString()}`, sub: 'This month', icon: Wallet, color: 'from-amber-500 to-amber-400', trend: 'down' },
    { label: 'Net Profit', value: `₹${stats.netProfit.toLocaleString()}`, sub: `GST: ₹${stats.totalGstCollected.toLocaleString()}`, icon: ShoppingBag, color: stats.netProfit >= 0 ? 'from-emerald-500 to-emerald-400' : 'from-red-500 to-red-400', trend: stats.netProfit >= 0 ? 'up' : 'down' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 stagger">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card animate-fadeIn group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
                <card.icon size={20} className="text-white" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${card.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                {card.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 mb-0.5">{card.value}</p>
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="text-xs text-zinc-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80 animate-fadeIn">
          <h3 className="text-base font-semibold text-zinc-900 mb-1">Revenue & Expenses</h3>
          <p className="text-xs text-zinc-400 mb-4">Last 7 days overview</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={charts.revenueByDay}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: '13px' }} formatter={(v) => [`₹${v.toLocaleString()}`, undefined]} />
              <Area type="monotone" dataKey="revenue" stroke="#0d9488" fill="url(#gRev)" strokeWidth={2.5} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#f59e0b" fill="url(#gExp)" strokeWidth={2} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80 animate-fadeIn">
          <h3 className="text-base font-semibold text-zinc-900 mb-1">Sales by Category</h3>
          <p className="text-xs text-zinc-400 mb-2">This month</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={charts.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {charts.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {charts.categoryData.slice(0, 5).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-zinc-600">{c.name}</span>
                </div>
                <span className="font-medium text-zinc-900">₹{c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Products + AI Insights + Low Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80 animate-fadeIn">
          <h3 className="text-base font-semibold text-zinc-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {charts.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-warm-100 flex items-center justify-center text-xs font-bold text-zinc-500">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{p.name}</p>
                  <p className="text-xs text-zinc-400">{p.quantity} units</p>
                </div>
                <span className="text-sm font-semibold text-zinc-900">₹{Math.round(p.revenue).toLocaleString()}</span>
              </div>
            ))}
            {charts.topProducts.length === 0 && <p className="text-sm text-zinc-400">No sales data yet</p>}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80 animate-fadeIn">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-brand-600" />
            <h3 className="text-base font-semibold text-zinc-900">Smart Insights</h3>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {insights.map((ins, i) => (
              <div key={i} className={`p-3 rounded-xl border ${insightBg[ins.type] || 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex items-start gap-2">
                  {insightIcons[ins.type]}
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">{ins.title}</p>
                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{ins.message}</p>
                    {ins.items && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ins.items.slice(0, 3).map((item, j) => (
                          <span key={j} className="text-[10px] bg-white/60 px-2 py-0.5 rounded-full text-zinc-600">{item}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && <p className="text-sm text-zinc-400">No insights yet. Start selling!</p>}
          </div>
        </div>

        {/* Low Stock Alerts + Recent Orders */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80 animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-amber-500" />
              <h3 className="text-base font-semibold text-zinc-900">Low Stock</h3>
            </div>
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-zinc-700 truncate">{p.name}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
              {lowStock.length === 0 && <p className="text-sm text-zinc-400">Stock levels healthy</p>}
            </div>
          </div>

          {/* Recent Orders Mini */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80 animate-fadeIn">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Recent Orders</h3>
            <div className="space-y-2">
              {recentOrders.slice(0, 4).map((o) => (
                <div key={o._id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono text-xs text-zinc-500">{o.orderNumber}</span>
                  </div>
                  <span className="font-medium text-zinc-900">₹{Math.round(o.totalAmount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
