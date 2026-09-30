import React from 'react';
import { 
  FileSpreadsheet, 
  Clock, 
  Download, 
  Copy,
  Check, 
  ShieldCheck, 
  User, 
  Package, 
  Search,
  LogOut,
  Users,
  Database
} from 'lucide-react';
import { InventoryItem, UserAccount } from '../types/inventory';
import { exportInventoryToCsv, copyInventoryToClipboardTSV } from '../services/csvService';
import { getAllUsers } from '../services/authService';

interface NavbarProps {
  currentUser: UserAccount;
  activeTab: 'user-count' | 'admin-master' | 'list' | 'logs';
  setActiveTab: (tab: 'user-count' | 'admin-master' | 'list' | 'logs') => void;
  items: InventoryItem[];
  onLogout: () => void;
  onOpenStorageModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentUser,
  activeTab, 
  setActiveTab, 
  items,
  onLogout,
  onOpenStorageModal
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyTSV = async () => {
    const success = await copyInventoryToClipboardTSV(items);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAdmin = currentUser.role === 'admin';
  const pendingCount = isAdmin ? getAllUsers().filter(u => u.status === 'pending').length : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab(isAdmin ? 'admin-master' : 'user-count')}
              className="text-left group flex items-center gap-2.5 focus-visible:outline-none"
            >
              <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs transition-colors ${
                isAdmin ? 'bg-slate-900' : 'bg-emerald-600'
              }`}>
                IT
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  InvenTrack
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-normal text-slate-400">
                  {isAdmin ? 'Panel Admin' : 'Input Operator'}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Strictly partitioned by role) */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            {!isAdmin ? (
              /* USER NAVIGATION: ONLY ALLOWED TO INPUT */
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 border border-emerald-200">
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  Mode Input Stok Lapangan
                </span>
              </div>
            ) : (
              /* ADMIN NAVIGATION: FULL ACCESS */
              <>
                <button
                  onClick={() => setActiveTab('admin-master')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'admin-master'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-4 h-4 text-amber-600" />
                  Master Barang & CSV
                  {pendingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'list'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  Rekap Hasil Opname
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'logs'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Log Penginputan
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: User Profile Badge & Logout */}
          <div className="flex items-center gap-2.5">

            {/* Cloud Real-Time Sync Indicator */}
            <div 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-800 shadow-2xs"
              title="Real-Time Cloud Sync: Seluruh data dan foto otomatis tersinkron ke semua HP dan komputer secara langsung"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Cloud Sync Aktif</span>
            </div>
            
            {/* Admin Export CSV button */}
            {isAdmin && (
              <button
                onClick={() => exportInventoryToCsv(items)}
                title="Download CSV Hasil Opname"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            )}

            {/* Storage Database Monitor Button */}
            {isAdmin && onOpenStorageModal && (
              <button
                type="button"
                onClick={onOpenStorageModal}
                title="Cek sisa kuota dan status storage database Firebase"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Storage DB</span>
              </button>
            )}

            {/* Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isAdmin ? 'ADMINISTRATOR' : 'OPERATOR LAPANGAN'}
                </div>
              </div>

              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isAdmin ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
                title="Keluar dari akun (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Sub-Header for User info */}
        {!isAdmin && (
          <div className="md:hidden py-1.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-emerald-800">
              Operator: {currentUser.fullName}
            </span>
            <span className="text-[11px] text-slate-400">
              Hanya mode input aktif
            </span>
          </div>
        )}

      </div>
    </header>
  );
};
