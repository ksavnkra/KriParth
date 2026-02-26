import { useState, useEffect } from 'react';
import API from '../config/axios';
import { Plus, X, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockManagement() {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    product: '', quantity: '', totalPrice: '', pricePerUnit: '',
    sellerName: '', sellerGstNumber: '',
    gstPercentage: 18, gstType: 'cgst_sgst',
    invoiceNumber: '', notes: ''
  });
  // Track which of the 3 fields was edited most recently so we know which to auto-calc
  const [lastEdited, setLastEdited] = useState([]);   // e.g. ['quantity','totalPrice']

  const load = async () => {
    try {
      const [eRes, pRes, sRes] = await Promise.all([
        API.get('/stock'),
        API.get('/products'),
        API.get('/stock/summary'),
      ]);
      setEntries(eRes.data);
      setProducts(pRes.data);
      setSummary(sRes.data);
    } catch { toast.error('Failed to load stock data'); }
  };

  useEffect(() => { load(); }, []);

  const gstOptions = [0, 5, 12, 18, 28];

  const handleProductChange = (productId) => {
    const p = products.find(pr => pr._id === productId);
    setForm({ ...form, product: productId, gstPercentage: p ? p.gstPercentage : 18 });
  };

  // --- Smart 3-field logic: enter any 2, the 3rd is auto-calculated ---
  const trackEdit = (field) => {
    setLastEdited(prev => {
      const filtered = prev.filter(f => f !== field);
      const updated = [...filtered, field];
      return updated.length > 2 ? updated.slice(-2) : updated;
    });
  };

  const derivedField = (() => {
    const allThree = ['quantity', 'totalPrice', 'pricePerUnit'];
    if (lastEdited.length < 2) return null;
    return allThree.find(f => !lastEdited.includes(f)) || null;
  })();

  const handleFieldChange = (field, value) => {
    const next = { ...form, [field]: value };
    trackEdit(field);

    // Compute the two "source" fields after this edit
    const sources = lastEdited.filter(f => f !== field);
    sources.push(field);
    const twoSources = sources.slice(-2);
    const target = ['quantity', 'totalPrice', 'pricePerUnit'].find(f => !twoSources.includes(f));

    const q = Number(field === 'quantity' ? value : next.quantity) || 0;
    const t = Number(field === 'totalPrice' ? value : next.totalPrice) || 0;
    const p = Number(field === 'pricePerUnit' ? value : next.pricePerUnit) || 0;

    if (target === 'pricePerUnit' && q > 0 && t > 0) {
      next.pricePerUnit = (t / q).toFixed(2);
    } else if (target === 'totalPrice' && q > 0 && p > 0) {
      next.totalPrice = (q * p).toFixed(2);
    } else if (target === 'quantity' && p > 0 && t > 0) {
      next.quantity = Math.round(t / p).toString();
    }
    setForm(next);
  };

  // --- Calculations (GST INCLUSIVE — totalPrice already contains GST) ---
  const qty = Number(form.quantity) || 0;
  const total = Number(form.totalPrice) || 0;
  const rate = Number(form.gstPercentage) || 0;
  const ppu = Number(form.pricePerUnit) || 0;

  const baseAmount = rate > 0 ? total / (1 + rate / 100) : total;
  const gstAmount = total - baseAmount;
  const cgst = form.gstType === 'cgst_sgst' ? gstAmount / 2 : 0;
  const sgst = form.gstType === 'cgst_sgst' ? gstAmount / 2 : 0;
  const igst = form.gstType === 'igst' ? gstAmount : 0;
  const basePricePerUnit = qty > 0 ? baseAmount / qty : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/stock', {
        product: form.product,
        quantity: qty,
        totalCost: total,
        sellerName: form.sellerName,
        sellerGstNumber: form.sellerGstNumber,
        gstPercentage: rate,
        gstType: form.gstType,
        invoiceNumber: form.invoiceNumber,
        notes: form.notes,
      });
      toast.success('Stock added successfully');
      setShowModal(false);
      setForm({ product: '', quantity: '', totalPrice: '', pricePerUnit: '', sellerName: '', sellerGstNumber: '', gstPercentage: 18, gstType: 'cgst_sgst', invoiceNumber: '', notes: '' });
      setLastEdited([]);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add stock'); }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Total Purchases</p>
            <p className="text-2xl font-bold text-zinc-900">₹{summary.totalPurchases.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">GST Paid (Input)</p>
            <p className="text-2xl font-bold text-amber-600">₹{summary.totalGstPaid.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Items Added</p>
            <p className="text-2xl font-bold text-blue-600">{summary.totalQuantity}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Stock Entries</p>
            <p className="text-2xl font-bold text-brand-600">{summary.entries}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">Purchase History</h3>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Stock
        </button>
      </div>

      {/* Seller Summary */}
      {summary?.bySeller && Object.keys(summary.bySeller).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(summary.bySeller).map(([seller, data]) => (
            <div key={seller} className="bg-white rounded-2xl p-5 shadow-card border border-zinc-100/80">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Building2 size={18} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{seller}</p>
                  <p className="text-xs text-zinc-400">{data.entries} purchase(s)</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total</span>
                <span className="font-semibold">₹{Math.round(data.total).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-500">GST Paid</span>
                <span className="text-amber-600 font-medium">₹{Math.round(data.gst).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Entries Table */}
      <div className="bg-white rounded-2xl shadow-card border border-zinc-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-warm-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Seller</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Qty</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">₹/Unit</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">GST</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">GST Amt</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total (incl.)</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {entries.map(entry => (
                <tr key={entry._id} className="hover:bg-warm-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-zinc-800">{entry.product?.name}</p>
                    <p className="text-xs text-zinc-400">{entry.product?.category}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-zinc-700">{entry.sellerName}</p>
                    {entry.sellerGstNumber && <p className="text-[10px] text-zinc-400 font-mono">{entry.sellerGstNumber}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm font-medium">{entry.quantity}</td>
                  <td className="px-5 py-3.5 text-right text-sm">₹{Number(entry.purchasePrice).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <div>
                      <span className="text-xs font-medium bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{entry.gstPercentage}%</span>
                      <p className="text-[10px] text-zinc-400 mt-0.5 uppercase">{entry.gstType === 'igst' ? 'IGST' : 'CGST+SGST'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-amber-600">
                    <p>₹{Math.round(entry.gstAmount).toLocaleString()}</p>
                    {entry.gstType === 'cgst_sgst' ? (
                      <p className="text-[10px] text-zinc-400">C:{Math.round(entry.cgstAmount)} S:{Math.round(entry.sgstAmount)}</p>
                    ) : (
                      <p className="text-[10px] text-zinc-400">I:{Math.round(entry.igstAmount)}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-semibold">₹{Math.round(entry.totalCost).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-xs text-zinc-400">{new Date(entry.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <div className="text-center py-12 text-zinc-400 text-sm">No stock entries yet</div>}
        </div>
      </div>

      {/* Add Stock Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Add Stock</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product select */}
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Product *</label>
                <select value={form.product} onChange={e => handleProductChange(e.target.value)} required className="input-field">
                  <option value="">Select a product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.category})</option>)}
                </select>
              </div>

              {/* Quantity / Total Price / Price Per Unit — enter any 2 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Enter any 2 fields</p>
                  {derivedField && (
                    <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      {derivedField === 'quantity' ? 'Qty' : derivedField === 'totalPrice' ? 'Total' : '₹/Unit'} = auto
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">
                      Quantity {derivedField === 'quantity' && <span className="text-emerald-500">●</span>}
                    </label>
                    <input type="number" value={form.quantity}
                      onChange={e => handleFieldChange('quantity', e.target.value)}
                      className={`input-field ${derivedField === 'quantity' ? 'ring-2 ring-emerald-200 bg-emerald-50/50' : ''}`}
                      min="1" placeholder="e.g. 10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">
                      Total Price <span className="text-zinc-400 text-[10px]">(incl. GST)</span> {derivedField === 'totalPrice' && <span className="text-emerald-500">●</span>}
                    </label>
                    <input type="number" value={form.totalPrice}
                      onChange={e => handleFieldChange('totalPrice', e.target.value)}
                      className={`input-field ${derivedField === 'totalPrice' ? 'ring-2 ring-emerald-200 bg-emerald-50/50' : ''}`}
                      min="0" step="0.01" placeholder="e.g. 200" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">
                      ₹ / Unit <span className="text-zinc-400 text-[10px]">(incl.)</span> {derivedField === 'pricePerUnit' && <span className="text-emerald-500">●</span>}
                    </label>
                    <input type="number" value={form.pricePerUnit}
                      onChange={e => handleFieldChange('pricePerUnit', e.target.value)}
                      className={`input-field ${derivedField === 'pricePerUnit' ? 'ring-2 ring-emerald-200 bg-emerald-50/50' : ''}`}
                      min="0" step="0.01" placeholder="e.g. 20" />
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="p-4 rounded-xl bg-warm-50 border border-zinc-100">
                <p className="text-xs font-semibold text-zinc-600 mb-3 uppercase tracking-wider">Seller Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Seller Name *</label>
                    <input value={form.sellerName} onChange={e => setForm({...form, sellerName: e.target.value})} required className="input-field bg-white" placeholder="Seller/Vendor name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Seller GST Number</label>
                    <input value={form.sellerGstNumber} onChange={e => setForm({...form, sellerGstNumber: e.target.value})} className="input-field bg-white font-mono" placeholder="e.g. 27AABCR1234A1Z5" maxLength={15} />
                  </div>
                </div>
              </div>

              {/* GST Section */}
              <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-100">
                <p className="text-xs font-semibold text-brand-700 mb-3 uppercase tracking-wider">GST (Inclusive in Total)</p>

                {/* GST Type toggle */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-zinc-500 mb-2 block">GST Type *</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm({...form, gstType: 'cgst_sgst'})}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.gstType === 'cgst_sgst'
                          ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                      }`}>
                      CGST + SGST
                      <p className="text-[10px] font-normal mt-0.5 opacity-80">Intra-state</p>
                    </button>
                    <button type="button" onClick={() => setForm({...form, gstType: 'igst'})}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.gstType === 'igst'
                          ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                      }`}>
                      IGST
                      <p className="text-[10px] font-normal mt-0.5 opacity-80">Inter-state</p>
                    </button>
                  </div>
                </div>

                {/* GST % */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-zinc-500 mb-2 block">GST Percentage *</label>
                  <div className="flex gap-2">
                    {gstOptions.map(g => (
                      <button key={g} type="button" onClick={() => setForm({...form, gstPercentage: g})}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                          Number(form.gstPercentage) === g
                            ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                        }`}>
                        {g}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Breakdown */}
                {total > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-white border border-zinc-100 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Base Amount (ex-GST)</span>
                      <span className="font-medium text-zinc-800">₹{baseAmount.toFixed(2)}</span>
                    </div>
                    {form.gstType === 'cgst_sgst' ? (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">CGST ({rate / 2}%)</span>
                          <span className="font-medium text-amber-600">₹{cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">SGST ({rate / 2}%)</span>
                          <span className="font-medium text-amber-600">₹{sgst.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">IGST ({rate}%)</span>
                        <span className="font-medium text-amber-600">₹{igst.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs border-t border-zinc-100 pt-1.5">
                      <span className="text-zinc-500">Total GST</span>
                      <span className="font-semibold text-amber-700">₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-zinc-100 pt-1.5">
                      <span className="font-medium text-zinc-700">Total (incl. GST)</span>
                      <span className="font-bold text-zinc-900">₹{total.toFixed(2)}</span>
                    </div>
                    {qty > 0 && (
                      <div className="flex justify-between text-xs border-t border-dashed border-zinc-200 pt-1.5">
                        <span className="text-zinc-500">Base price per unit</span>
                        <span className="font-medium text-zinc-700">₹{basePricePerUnit.toFixed(2)}</span>
                      </div>
                    )}
                    {ppu > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Price per unit (incl.)</span>
                        <span className="font-medium text-zinc-700">₹{ppu.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Invoice Number</label>
                  <input value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} className="input-field" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Notes</label>
                  <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" placeholder="Optional" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
