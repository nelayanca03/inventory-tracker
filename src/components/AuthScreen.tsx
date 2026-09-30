import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles,
  Info
} from 'lucide-react';
import { UserAccount } from '../types/inventory';
import { loginUser, registerUser } from '../services/authService';

interface AuthScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  
  // Login form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regNotice, setRegNotice] = useState<{ success: boolean; message: string } | null>(null);

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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegNotice(null);

    if (!fullName.trim() || !username.trim() || !email.trim() || !regPassword) {
      setRegNotice({ success: false, message: 'Semua kolom wajib diisi.' });
      return;
    }

    if (regPassword.length < 5) {
      setRegNotice({ success: false, message: 'Kata sandi minimal 5 karakter.' });
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setRegNotice({ success: false, message: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    const res = registerUser({
      fullName,
      username,
      email,
      password: regPassword
    });

    setRegNotice(res);

    if (res.success) {
      // Clear form
      setFullName('');
      setUsername('');
      setEmail('');
      setRegPassword('');
      setRegPasswordConfirm('');
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
          
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setLoginError(null);
                setRegNotice(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setLoginError(null);
                setRegNotice(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          {/* TAB 1: LOGIN */}
          {activeMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {loginError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
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
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
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
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
              >
                <span>Masuk ke Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Fill Test Accounts */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Uji Coba Akun Siap Pakai:
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
                      User (Terverifikasi)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      budi / budi123
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('andi', 'andi123')}
                  className="w-full p-2 bg-amber-50 hover:bg-amber-100/70 border border-amber-200 rounded-xl text-center text-[11px] text-amber-800 font-medium transition-colors"
                >
                  Tes Akun Belum Diverifikasi: <strong>andi</strong> (Menunggu Admin)
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              
              {/* Notice that admin approval is strictly required */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Aturan Keamanan:</strong> Akun user baru yang didaftarkan wajib <strong>diverifikasi & disetujui oleh Admin</strong> terlebih dahulu sebelum diizinkan masuk untuk menginput stok.
                </span>
              </div>

              {regNotice && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  regNotice.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {regNotice.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{regNotice.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Lengkap Operator
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="budisantoso"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:border-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@kantor.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 5 karakter"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Ulangi Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  placeholder="Ketik ulang kata sandi"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-slate-900 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-3"
              >
                <span>Daftarkan Akun & Ajukan Verifikasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('login')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Sudah punya akun? Masuk di sini
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

    </div>
  );
};
