import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Info
} from 'lucide-react';
import { UserAccount } from '../types/inventory';
import { loginUser } from '../services/authService';

interface AuthScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Silakan masukkan username/email dan kata sandi.');
      return;
    }

    const res = loginUser(loginIdentifier, loginPassword);
    if (!res.success) {
      setLoginError(res.message);
      return;
    }

    if (res.user) {
      onLoginSuccess(res.user);
    }
  };

  const handleQuickLogin = (id: string, pass: string) => {
    setLoginIdentifier(id);
    setLoginPassword(pass);
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 selection:bg-slate-700 selection:text-white">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-slate-900 font-bold text-xl tracking-wider shadow-lg mb-4">
          IT
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          InvenTrack
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Sistem Penginputan Perhitungan Inventory & Stock Opname
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl shadow-2xl border border-slate-800/20 space-y-6">
          
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Masuk ke Aplikasi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan akun yang telah didaftarkan oleh Admin Gudang
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Username atau Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="admin atau budi"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
            >
              <span>Masuk ke Akun</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Fill Test Accounts */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                Akun Contoh:
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs transition-colors"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Admin Gudang
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    admin / admin123
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('budi', 'budi123')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs transition-colors"
                >
                  <div className="font-bold text-emerald-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Operator (User)
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    budi / budi123
                  </div>
                </button>
              </div>
            </div>

            {/* Information Notice for Non-Admins */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                Pendaftaran akun baru hanya dapat dibuat langsung oleh <strong>Admin Gudang</strong>. Jika Anda staf baru, hubungi admin untuk dibuatkan akun.
              </span>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
};
