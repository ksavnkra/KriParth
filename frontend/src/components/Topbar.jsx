import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/products': 'Products',
  '/stock': 'Stock Management',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || 'KriParth POS';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="h-16 bg-white/60 backdrop-blur-md border-b border-zinc-200/60 flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
        <p className="text-xs text-zinc-400 -mt-0.5">{dateStr}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-xl bg-warm-100 hover:bg-warm-200 flex items-center justify-center transition-colors text-zinc-500 hover:text-zinc-700">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
