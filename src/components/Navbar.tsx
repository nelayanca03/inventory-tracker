import React from 'react';
import { 
  FileSpreadsheet, 
  Clock, 
  Download, 
  LogOut, 
  Package, 
  Database,
  Search,
  CheckCircle2,
  Sparkles,
  BrainCircuit
} from 'lucide-react';
import { InventoryItem, UserAccount } from '../types/inventory';
import { exportInventoryToCsv } from '../services/csvService';
import { getAllUsers } from '../services/authService';

interface NavbarProps {
  currentUser: UserAccount;
  activeTab: 'user-count' | 'admin-master' | 'list' | 'logs';
  setActiveTab: (tab: 'user-count' | 'admin-master' | 'list' | 'logs') => void;
  items: InventoryItem[];
  onLogout: () => void;
  onOpenStorageModal?: () => void;
  onOpenMlStudio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentUser,
  activeTab, 
  setActiveTab, 
  items,
  onLogout,
  onOpenStorageModal,
  onOpenMlStudio
}) => {
  const isAdmin = currentUser.role === 'admin';
  const pendingCount = isAdmin ? getAllUsers().filter(u => u.status === 'pending').length : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-4">
          
          {/* Brand & Context */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setActiveTab(isAdmin ? 'admin-master' : 'user-count')}
              className="text-left flex items-center gap-2.5 focus:outline-hidden group"
            >
              <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-2xs transition-transform group-hover:scale-105 ${
                isAdmin ? 'bg-slate-900' : 'bg-emerald-600'
              }`}>
                IT
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-slate-900">
                    InvenTrack
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cloud Sync
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Segmented Controls (Admin vs Operator) */}
          <nav className="hidden md:flex items-center">
            {!isAdmin ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stasiun Input Opname</span>
              </div>
            ) : (
              <div className="flex items-center bg-slate-100/90 p-1 rounded-xl text-xs font-semibold border border-slate-200/80">
                <button
                  onClick={() => setActiveTab('admin-master')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'admin-master'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-slate-700" />
                  <span>Master Barang</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'list'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
                  <span>Rekap Opname</span>
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'logs'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-slate-700" />
                  <span>Log Riwayat</span>
                </button>
              </div>
            )}
          </nav>

          {/* Utility Tools & User Profile */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                {/* Storage DB Monitor */}
                {onOpenStorageModal && (
                  <button
                    type="button"
                    onClick={onOpenStorageModal}
                    title="Cek sisa kuota & kapasitas storage Firebase"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl transition-colors shadow-2xs"
                  >
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden lg:inline">Storage DB</span>
                  </button>
                )}

                {/* Export CSV */}
                <button
                  onClick={() => exportInventoryToCsv(items)}
                  title="Download File CSV Hasil Opname"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>
              </>
            )}

            {/* Studio ML (Machine Learning Mandiri) Button */}
            {onOpenMlStudio && (
              <button
                type="button"
                onClick={onOpenMlStudio}
                title="Buka Studio Machine Learning (Latih Model & Uji Coba Input)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-2xs active:scale-95"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Studio ML</span>
              </button>
            )}

            {/* Profile Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-none">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                  {isAdmin ? 'Admin' : 'Operator'}
                </div>
              </div>

              <div 
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-2xs ${
                  isAdmin ? 'bg-slate-900' : 'bg-emerald-600'
                }`}
                title={`${currentUser.fullName} (${isAdmin ? 'Admin' : 'Operator'})`}
              >
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-0.5"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Mobile Navigation Bar for Admin */}
        {isAdmin && (
          <div className="md:hidden py-2 border-t border-slate-100 flex items-center justify-between gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('admin-master')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center font-semibold transition-all whitespace-nowrap ${
                activeTab === 'admin-master' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Master Barang
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center font-semibold transition-all whitespace-nowrap ${
                activeTab === 'list' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Rekap Opname
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center font-semibold transition-all whitespace-nowrap ${
                activeTab === 'logs' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Log Riwayat
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
