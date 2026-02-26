import { useState, useEffect } from 'react';
import API from '../config/axios';
import { FileText, Download, IndianRupee, ShoppingBag, Wallet, Receipt } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/ai/report', { params: { startDate, endDate } });
      setReport(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = () => load();

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  if (!report) return <p className="text-zinc-500">Failed to load report</p>;

  const { summary: s, salesByDay, expenseBreakdown, paymentMethods } = report;

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex items-end gap-4 no-print">
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field py-2" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field py-2" />
        </div>
        <button onClick={handleGenerate} className="btn-primary flex items-center gap-2">
          <FileText size={16} /> Generate Report
        </button>
        <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Print
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={16} className="text-brand-600" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Revenue</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900">₹{s.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-zinc-400 mt-1">{s.totalOrders} orders · Avg ₹{s.avgOrderValue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-red-500" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Expenses</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900">₹{s.totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-zinc-400 mt-1">Purchases: ₹{s.totalPurchases.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag size={16} className="text-emerald-500" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Net Profit</p>
          </div>
          <p className={`text-2xl font-bold ${s.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ₹{s.netProfit.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {s.totalRevenue > 0 ? `${((s.netProfit / s.totalRevenue) * 100).toFixed(1)}% margin` : 'No revenue'}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={16} className="text-amber-500" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">GST Summary</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm"><span className="text-zinc-500">Collected:</span> <span className="font-semibold text-zinc-900">₹{s.gstCollected.toLocaleString()}</span></p>
            <p className="text-sm"><span className="text-zinc-500">Paid (Input):</span> <span className="font-semibold text-amber-600">₹{s.gstPaid.toLocaleString()}</span></p>
            <p className="text-sm border-t border-zinc-100 pt-1 mt-1"><span className="text-zinc-500">Liability:</span> <span className="font-bold text-brand-700">₹{s.gstLiability.toLocaleString()}</span></p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Sales Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80">
          <h3 className="text-base font-semibold text-zinc-900 mb-1">Sales Trend</h3>
          <p className="text-xs text-zinc-400 mb-4">Daily revenue for the selected period</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={salesByDay}>
              <defs>
                <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} formatter={v => [`₹${Math.round(v).toLocaleString()}`, undefined]} />
              <Area type="monotone" dataKey="revenue" stroke="#0d9488" fill="url(#gSales)" strokeWidth={2} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80">
          <h3 className="text-base font-semibold text-zinc-900 mb-1">Expense Breakdown</h3>
          <p className="text-xs text-zinc-400 mb-4">By category</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {expenseBreakdown.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-zinc-600 capitalize truncate">{item.name}</span>
                <span className="ml-auto font-medium text-zinc-800">₹{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80">
        <h3 className="text-base font-semibold text-zinc-900 mb-4">Payment Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map((pm, i) => (
            <div key={pm.name} className="flex items-center gap-4 p-4 rounded-xl bg-warm-50">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${COLORS[i % COLORS.length]}20` }}>
                <span className="text-lg font-bold capitalize" style={{ color: COLORS[i % COLORS.length] }}>{pm.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-800 capitalize">{pm.name}</p>
                <p className="text-lg font-bold text-zinc-900">₹{pm.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
          {paymentMethods.length === 0 && <p className="text-sm text-zinc-400 col-span-3 text-center">No payment data</p>}
        </div>
      </div>
    </div>
  );
}
