import { useState, useEffect } from 'react';
import API from '../config/axios';
import { Plus, Search, Edit3, Trash2, X, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyProduct = { name: '', category: '', price: '', costPrice: '', gstPercentage: 18, stock: 0, barcode: '', unit: 'pcs', description: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  const load = async () => {
    try {
      const { data } = await API.get('/products');
      setProducts(data);
    } catch { toast.error('Failed to load products'); }
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditing(null); setForm(emptyProduct); setShowModal(true); };
  const openEdit = (p) => { setEditing(p._id); setForm({ name: p.name, category: p.category, price: p.price, costPrice: p.costPrice, gstPercentage: p.gstPercentage, stock: p.stock, barcode: p.barcode || '', unit: p.unit, description: p.description || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/products/${editing}`, { ...form, price: Number(form.price), costPrice: Number(form.costPrice), gstPercentage: Number(form.gstPercentage), stock: Number(form.stock) });
        toast.success('Product updated');
      } else {
        await API.post('/products', { ...form, price: Number(form.price), costPrice: Number(form.costPrice), gstPercentage: Number(form.gstPercentage), stock: Number(form.stock) });
        toast.success('Product added');
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await API.delete(`/products/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed to delete'); }
  };

  const gstOptions = [0, 5, 12, 18, 28];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="input-field pl-11" />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 ml-4">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-card border border-zinc-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-warm-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Price</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cost</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">GST %</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stock</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map(p => (
                <tr key={p._id} className="hover:bg-warm-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Package size={16} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-800">{p.name}</p>
                        <p className="text-xs text-zinc-400">{p.barcode || p.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg">{p.category}</span></td>
                  <td className="px-5 py-3.5 text-right text-sm font-semibold text-zinc-900">₹{p.price}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-zinc-500">₹{p.costPrice}</td>
                  <td className="px-5 py-3.5 text-center"><span className="text-xs font-medium bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{p.gstPercentage}%</span></td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      p.stock > 20 ? 'bg-emerald-100 text-emerald-700' : p.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-zinc-400 text-sm">No products found</div>}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Product Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input-field" placeholder="Enter product name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Category *</label>
                  <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} required className="input-field" placeholder="e.g. Groceries" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Unit</label>
                  <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="input-field" placeholder="pcs, kg, L" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Selling Price *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required className="input-field" placeholder="₹0" min="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Cost Price</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} className="input-field" placeholder="₹0" min="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">GST %</label>
                  <select value={form.gstPercentage} onChange={e => setForm({...form, gstPercentage: e.target.value})} className="input-field">
                    {gstOptions.map(g => <option key={g} value={g}>{g}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Barcode</label>
                  <input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="input-field" placeholder="Optional" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} placeholder="Optional description" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
