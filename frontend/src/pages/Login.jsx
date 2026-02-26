import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="gradient-mesh absolute inset-0 opacity-60" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-brand">
              <Zap size={24} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold">KriParth</span>
          </div>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Smart Business<br />
            <span className="bg-gradient-to-r from-brand-400 to-teal-300 bg-clip-text text-transparent">
              Management
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
            Powerful POS system with AI-driven insights, GST tracking, and real-time analytics — all in one place.
          </p>
        </div>
        <div className="relative z-10">
          <div className="flex gap-8 mb-6">
            {['GST Ready', 'AI Insights', 'Real-time'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-400" />
                <span className="text-zinc-500 text-sm">{t}</span>
              </div>
            ))}
          </div>
          <p className="text-zinc-600 text-xs">© 2026 KriParth POS. All rights reserved.</p>
        </div>
        {/* Decorative shapes */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute top-1/3 -left-10 w-60 h-60 rounded-full bg-brand-500/5 blur-2xl" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-warm-50">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">KriParth</span>
          </div>

          <h2 className="text-3xl font-bold text-zinc-900 mb-2">Welcome back</h2>
          <p className="text-zinc-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kriparth.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-brand-50/50 border border-brand-100">
            <p className="text-xs font-medium text-brand-700 mb-2">Demo Credentials</p>
            <p className="text-xs text-brand-600">Admin: admin@kriparth.com / admin123</p>
            <p className="text-xs text-brand-600">Cashier: cashier@kriparth.com / cashier123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
