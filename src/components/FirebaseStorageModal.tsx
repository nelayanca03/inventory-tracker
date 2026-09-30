import React, { useState, useMemo } from 'react';
import { 
  Database, 
  X, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Image as ImageIcon, 
  Trash2, 
  Layers, 
  TrendingUp, 
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  Users,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import { InventoryItem, InputLog, UserAccount, AppSettings } from '../types/inventory';
import { generateFirebaseStorageReport, FirebaseStorageReport } from '../services/storageUsageService';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  logs: InputLog[];
  users: UserAccount[];
  settings?: AppSettings | null;
  onClearLogs?: () => void;
}

export const FirebaseStorageModal: React.FC<FirebaseStorageModalProps> = ({
  isOpen,
  onClose,
  items,
  logs,
  users,
  settings,
  onClearLogs
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Compute report based on real state data
  const report: FirebaseStorageReport = useMemo(() => {
    return generateFirebaseStorageReport(items, logs, users, settings);
  }, [items, logs, users, settings, refreshKey]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(false);
    }, 400);
  };

  const getCollectionIcon = (colName: string) => {
    switch (colName) {
      case 'inventory_items':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'activity_logs':
        return <Clock className="w-4 h-4 text-indigo-600" />;
      case 'user_accounts':
        return <Users className="w-4 h-4 text-amber-600" />;
      case 'app_settings':
        return <SettingsIcon className="w-4 h-4 text-slate-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  Status & Sisa Kuota Storage Database
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Firebase Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring kapasitas penyimpanan real-time Cloud Database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
          
          {/* Card 1: Main Gauge & Remaining Storage */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md relative overflow-hidden">
            {/* Background glow decoration */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Sisa Kapasitas Penyimpanan
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5 flex items-baseline gap-2">
                    <span>{report.formattedRemaining}</span>
                    <span className="text-xs font-sans font-medium text-emerald-400">
                      ({report.percentRemaining}% Tersedia)
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] font-medium text-slate-400 block">
                    Batas Kuota Gratis (Spark Plan):
                  </span>
                  <span className="text-sm font-bold font-mono text-white">
                    {report.formattedQuotaLimit}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    Digunakan: <strong className="text-white font-mono">{report.formattedTotalUsed}</strong>
                  </span>
                  <span className="text-slate-400">
                    Maksimal: <strong className="text-white font-mono">1.024 MB</strong>
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm"
                    style={{ width: `${Math.max(1, report.percentUsed)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Status Storage: Sangat Optimal (Lapang)
                  </span>
                  <span className="font-mono">
                    {report.percentUsed}% Terpakai
                  </span>
                </div>
              </div>

              {/* Estimate Remaining Capacity Banner */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Berdasarkan rata-rata ukuran barang saat ini ({report.formattedAvgItemSize}/item), database ini masih sanggup menampung estimasi hingga <strong className="text-white font-bold font-mono">+{report.estimatedRemainingItems.toLocaleString('id-ID')} produk</strong> lagi tanpa biaya.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Breakdown per Koleksi Firestore */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                Rincian Penggunaan Per Koleksi Database
              </h4>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                title="Hitung ulang ukuran data saat ini"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
                <span>Hitung Ulang</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
              {report.details.map((col) => (
                <div key={col.collectionName} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {getCollectionIcon(col.collectionName)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {col.label}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-slate-400">ID: {col.collectionName}</span>
                        <span>·</span>
                        <span className="text-slate-600">{col.detailInfo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {col.formattedSize}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {col.percentageOfTotalUsed.toFixed(1)}% dari total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Photo Storage Analysis */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Analisis Penyimpanan Foto Master Barang
              </span>
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                {report.photoAnalysis.itemsWithPhoto} / {report.photoAnalysis.totalItems} Foto
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Foto Terkompresi (Base64)</span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  {report.photoAnalysis.embeddedBase64Count} item
                </span>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                  Ukuran: {report.photoAnalysis.formattedBase64Size}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Foto Link URL Web</span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  {report.photoAnalysis.externalUrlCount} item
                </span>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
                  Sangat Ringan (&lt;1 KB)
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Barang Tanpa Foto</span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  {report.photoAnalysis.itemsWithoutPhoto} item
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Teks data saja
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-start gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Otomatisasi Kompresi Aktif:</strong> Setiap foto yang Anda upload, foto kamera, atau paste clipboard otomatis dikompres ke format hemat ukuran sebelum dikirim ke database Firestore.
              </span>
            </div>
          </div>

          {/* Card 4: Firebase Spark Plan Free Limits Reference */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Spesifikasi Kuota Gratis Firebase (Spark Plan)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Kapasitas Simpan</span>
                <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">1 GB</span>
                <span className="text-[10px] text-emerald-600 font-medium">Gratis Selamanya</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Tulis (Writes)</span>
                <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">20.000</span>
                <span className="text-[10px] text-slate-500">Operasi / Hari</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Baca (Reads)</span>
                <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">50.000</span>
                <span className="text-[10px] text-slate-500">Operasi / Hari</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Hapus (Deletes)</span>
                <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">20.000</span>
                <span className="text-[10px] text-slate-500">Operasi / Hari</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono text-center pt-1">
              Project ID: {firebaseConfig.projectId || 'ai-studio-inventrackwebinp'}
            </div>
          </div>

          {/* Action: Pembersihan Log jika sudah menumpuk */}
          {logs.length > 50 && onClearLogs && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Terdapat <strong>{logs.length} riwayat log penginputan</strong>. Jika ingin merapikan database, Anda dapat membersihkan riwayat lama.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
              >
                Bersihkan Log
              </button>
            </div>
          )}

          {showClearConfirm && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-900">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Konfirmasi Bersihkan Riwayat Log Aktivitas
              </div>
              <p>
                Tindakan ini akan mengosongkan seluruh riwayat log penginputan di database. Data master barang dan hasil opname tetap aman dan tidak akan terhapus.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearLogs?.();
                    setShowClearConfirm(false);
                  }}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
                >
                  Ya, Bersihkan Log Sekarang
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Terakhir dihitung: {report.timestamp}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Tutup Tampilan
          </button>
        </div>

      </div>
    </div>
  );
};
