import { useState, useEffect, useMemo } from 'react';
import API from '../config/axios';
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Smartphone, Banknote, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          API.get('/products?active=true'),
          API.get('/products/categories'),
        ]);
        setProducts(pRes.data);
        setCategories(['All', ...cRes.data]);
      } catch (err) {
        toast.error('Failed to load products');
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== 'All') result = result.filter(p => p.category === activeCategory);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(s) || p.barcode?.includes(s));
    }
    return result;
  }, [products, activeCategory, search]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error('Stock limit reached'); return prev; }
        return prev.map(c => c.product === product._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      if (product.stock <= 0) { toast.error('Out of stock'); return prev; }
      return [...prev, { product: product._id, name: product.name, price: product.price, gstPercentage: product.gstPercentage, quantity: 1, maxStock: product.stock }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev =>
      prev.map(c => {
        if (c.product !== productId) return c;
        const newQty = c.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > c.maxStock) { toast.error('Stock limit'); return c; }
        return { ...c, quantity: newQty };
      }).filter(Boolean)
    );
  };

  const removeItem = (productId) => setCart(prev => prev.filter(c => c.product !== productId));

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const totalGst = cart.reduce((s, c) => s + (c.price * c.quantity * c.gstPercentage) / 100, 0);
  const total = subtotal + totalGst;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const { data } = await API.post('/orders', {
        items: cart.map(c => ({ product: c.product, quantity: c.quantity })),
        paymentMethod,
        customerName,
        customerPhone,
      });
      setLastOrder(data);
      setCart([]);
      setShowCheckout(false);
      setCustomerName('');
      setCustomerPhone('');
      toast.success('Order placed!');
      // Refresh products for updated stock
      const pRes = await API.get('/products?active=true');
      setProducts(pRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search & Filters */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11"
              autoFocus
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 content-start pr-1">
          {filtered.map(product => (
            <div
              key={product._id}
              onClick={() => addToCart(product)}
              className="product-card"
            >
              <div className="w-full h-20 rounded-xl bg-gradient-to-br from-warm-100 to-warm-200 flex items-center justify-center mb-3">
                <ShoppingBag size={24} className="text-zinc-400" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-800 truncate">{product.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-base font-bold text-zinc-900">₹{product.price}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  product.stock > 10 ? 'bg-emerald-100 text-emerald-700' :
                  product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">GST: {product.gstPercentage}%</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-40 text-zinc-400 text-sm">
              No products found
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-96 bg-white rounded-2xl border border-zinc-100 shadow-card flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h3 className="font-bold text-zinc-900">Current Order</h3>
          <p className="text-xs text-zinc-400">{cart.length} item(s)</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {cart.map(item => (
            <div key={item.product} className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{item.name}</p>
                <p className="text-xs text-zinc-400">₹{item.price} × {item.quantity} · GST {item.gstPercentage}%</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateQty(item.product, -1)} className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQty(item.product, 1)} className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
                  <Plus size={14} />
                </button>
                <button onClick={() => removeItem(item.product)} className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center ml-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-300">
              <ShoppingBag size={40} strokeWidth={1.5} />
              <p className="text-sm mt-2">Cart is empty</p>
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-zinc-500"><span>GST</span><span>₹{Math.round(totalGst).toLocaleString()}</span></div>
            <div className="flex justify-between text-lg font-bold text-zinc-900 pt-2 border-t border-zinc-100">
              <span>Total</span><span>₹{Math.round(total).toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className="btn-primary w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-warm-50">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{Math.round(total).toLocaleString()}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">Including ₹{Math.round(totalGst).toLocaleString()} GST</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'cash', label: 'Cash', icon: Banknote },
                    { value: 'card', label: 'Card', icon: CreditCard },
                    { value: 'upi', label: 'UPI', icon: Smartphone },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setPaymentMethod(value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === value
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Customer Name</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Optional" className="input-field text-sm py-2.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Phone</label>
                  <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Optional" className="input-field text-sm py-2.5" />
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
              >
                {placing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={18} /> Confirm Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {lastOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl animate-scaleIn text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-1">Order Placed!</h3>
            <p className="text-zinc-500 text-sm mb-4">#{lastOrder.orderNumber}</p>
            <div className="p-4 rounded-xl bg-warm-50 mb-4 text-left space-y-1">
              {lastOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-zinc-600">{item.name} × {item.quantity}</span>
                  <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-zinc-200 pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>₹{Math.round(lastOrder.totalAmount).toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => setLastOrder(null)} className="btn-primary w-full">New Order</button>
          </div>
        </div>
      )}
    </div>
  );
}
