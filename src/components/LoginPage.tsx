import React, { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('dev@company.com');
  const [password, setPassword] = useState('developer123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate standard token authentication matching backend main.py
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let matchedUser = null;
      if (email === 'dev@company.com' && password === 'developer123') {
        matchedUser = {
          email: 'dev@company.com',
          name: 'Alex Mercer',
          role: 'Data Engineer',
          dept: 'Data Operations',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          permissions: ['run_pipeline', 'view_reports', 'view_data']
        };
      } else if (email === 'admin@company.com' && password === 'admin123') {
        matchedUser = {
          email: 'admin@company.com',
          name: 'Sarah Connor',
          role: 'System Administrator',
          dept: 'IT Infrastructure',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          permissions: ['run_pipeline', 'view_reports', 'view_data', 'edit_config', 'manage_roles']
        };
      }

      if (matchedUser) {
        // Create access token matching format
        const expire = Date.now() + 3600 * 1000;
        const fakeToken = `uid:${email}|role:${matchedUser.role}|exp:${expire}.fakesignature`;
        onLogin(fakeToken, matchedUser);
      } else {
        setError('Invalid enterprise email or access credentials.');
      }
    } catch (err) {
      setError('Connection to auth server failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Brand & Teaser */}
        <div className="md:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl border border-white/10 backdrop-blur-md">
              <Zap className="w-6 h-6 text-indigo-400 fill-current" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">V2.0</span>
            </div>
          </div>

          <div className="my-16 space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Smart DataOps <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
                Enterprise Studio
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Consolidate local database migrations, Azure Blob Storage cloud syncs, automated email alerts, and data profiling into a unified workspace.
            </p>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-350">Secure Role-Based Access Control Enabled</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to workspace</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Use your employee portal credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200/80 rounded-2xl p-4 flex gap-3 text-red-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Enterprise Email</label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Access Key</label>
                <div className="relative">
                  <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3.5 px-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Enter Platform'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Available Demo Roles</span>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-slate-650">
                <div>
                  <p className="text-slate-900 font-bold">Data Engineer:</p>
                  <p className="font-mono mt-0.5 text-slate-500">dev@company.com</p>
                  <p className="font-mono text-slate-400">developer123</p>
                </div>
                <div>
                  <p className="text-slate-900 font-bold">Administrator:</p>
                  <p className="font-mono mt-0.5 text-slate-500">admin@company.com</p>
                  <p className="font-mono text-slate-400">admin123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
