import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/insights';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Panel: Branding & Gradient */}
      <div className="hidden lg:flex lg:w-1/2 tfi-gradient p-16 flex-col justify-between text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/30">
            <span className="text-4xl font-bold italic">T</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 tracking-tight leading-tight">
            Empowering the <br />
            <span className="text-tfi-green">Next Generation</span> <br />
            of Leaders.
          </h1>
          <p className="text-white/70 text-lg max-w-md leading-relaxed">
            Welcome to the iTeach College Admissions Dashboard. Manage student applications, track progress, and drive impact through data.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 text-sm font-medium text-white/50 tracking-widest uppercase">
            <span>iTeach</span>
            <div className="w-12 h-[1px] bg-white/20"></div>
            <span>Admissions Portal</span>

          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-tfi-pink/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-tfi-cyan/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-tfi-dark mb-2">Sign In</h2>
            <p className="text-tfi-muted">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 animate-shake">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-tfi-dark flex items-center gap-2">
                <Mail size={16} className="text-tfi-pink" />
                Email Address
              </label>
              <input
                type="email"
                required
                className="input"
                placeholder="advisor@tfi.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-tfi-dark flex items-center gap-2">
                <Lock size={16} className="text-tfi-pink" />
                Password
              </label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-4 text-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-tfi-muted font-medium">© 2024 iTeach Admissions</p>
            <div className="flex gap-4">
              <span className="text-xs text-tfi-muted hover:text-tfi-pink cursor-pointer">Support</span>
              <span className="text-xs text-tfi-muted hover:text-tfi-pink cursor-pointer">Privacy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
