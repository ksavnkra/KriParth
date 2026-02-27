import { useState, useEffect } from 'react';
import API from '../config/axios';
import { Plus, Trash2, X, Wallet, TrendingDown, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const categories = ['rent', 'utilities', 'salary', 'supplies', 'marketing', 'transport', 'maintenance', 'food', 'other'];
const catColors = { rent: 'bg-blue-100 text-blue-700', utilities: 'bg-amber-100 text-amber-700', salary: 'bg-emerald-100 text-emerald-700', supplies: 'bg-violet-100 text-violet-700', marketing: 'bg-pink-100 text-pink-700', transport: 'bg-cyan-100 text-cyan-700', maintenance: 'bg-orange-100 text-orange-700', food: 'bg-lime-100 text-lime-700', other: 'bg-zinc-100 text-zinc-700' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'other', date: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'cash' });
  const [filterCat, setFilterCat] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filterCat) params.category = filterCat;
      const [eRes, sRes] = await Promise.all([
        API.get('/expenses', { params }),
        API.get('/expenses/summary'),
      ]);
      setExpenses(eRes.data.expenses);
      setTotal(eRes.data.total);
      setSummary(sRes.data);
    } catch { toast.error('Failed to load expenses'); }
  };

  useEffect(() => { load(); }, [filterCat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/expenses', { ...form, amount: Number(form.amount) });
      toast.success('Expense added');
      setShowModal(false);
      setForm({ title: '', amount: '', category: 'other', date: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'cash' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await API.delete(`/expenses/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-400 flex items-center justify-center">
                <CalendarDays size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Today's Expenses</p>
                <p className="text-xl font-bold text-zinc-900">₹{summary.todayTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
                <Wallet size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Monthly Expenses</p>
                <p className="text-xl font-bold text-zinc-900">₹{summary.monthTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center">
                <TrendingDown size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Top Category</p>
                <p className="text-xl font-bold text-zinc-900 capitalize">
                  {summary.byCategory ? Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A' : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Expenses Chart */}
      {summary?.dailyTotals && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-zinc-100/80">
          <h3 className="text-base font-semibold text-zinc-900 mb-1">Daily Expenses</h3>
          <p className="text-xs text-zinc-400 mb-4">Last 30 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={summary.dailyTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} formatter={v => [`₹${v.toLocaleString()}`, 'Expenses']} />
              <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category by breakdown pills */}
      {summary?.byCategory && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-zinc-100/80">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Expense Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
              <div key={cat} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${catColors[cat] || catColors.other}`}>
                <span className="capitalize">{cat}</span>: ₹{Math.round(amount).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-zinc-900">All Expenses</h3>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-field py-2 text-sm w-40">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* Expenses List */}
      <div className="space-y-2">
        {expenses.map(exp => (
          <div key={exp._id} className="bg-white rounded-xl px-5 py-4 shadow-card border border-zinc-100/80 flex items-center gap-4 hover:shadow-card-hover transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${catColors[exp.category] || catColors.other}`}>
              {exp.category.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-800">{exp.title}</p>
              <p className="text-xs text-zinc-400">{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {exp.paymentMethod} {exp.description && `· ${exp.description}`}</p>
            </div>
            <span className="text-base font-bold text-zinc-900">₹{exp.amount.toLocaleString()}</span>
            <button onClick={() => handleDelete(exp._id)} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-4"><Wallet className="w-10 h-10 text-teal-400" /></div>
            <p className="text-zinc-500 font-medium mb-1">No expenses recorded</p>
            <p className="text-zinc-400 text-sm mb-4">Track your daily expenses here</p>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-brand hover:shadow-lg transition-all">+ Add Expense</button>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 animate-fadeIn p-4 pt-[5vh] overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl animate-scaleIn my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Add Expense</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="input-field" placeholder="e.g. Electricity bill" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Amount *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="input-field" min="1" placeholder="₹0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field">
                    {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Payment</label>
                  <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="input-field">
                    {['cash', 'bank', 'upi', 'card'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} placeholder="Optional notes" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
