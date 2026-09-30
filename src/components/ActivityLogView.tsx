import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  MapPin, 
  User, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Package,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { InputLog, UserAccount } from '../types/inventory';

interface ActivityLogViewProps {
  logs: InputLog[];
  currentUser: UserAccount;
  onClearLogs?: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  logs,
  currentUser,
  onClearLogs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterPetugas, setFilterPetugas] = useState('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week'>('all');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Distinct locations & petugas from logs
  const distinctLocations = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.namaTempat).filter(Boolean))).sort();
  }, [logs]);

  const distinctPetugas = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.petugas).filter(Boolean))).sort();
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchNama = log.namaStok.toLowerCase().includes(q);
        const matchKode = log.kodeStok.toLowerCase().includes(q);
        const matchPetugas = log.petugas.toLowerCase().includes(q);
        const matchCatatan = (log.catatan || '').toLowerCase().includes(q);
        const matchLokasi = (log.namaTempat || '').toLowerCase().includes(q);
        if (!matchNama && !matchKode && !matchPetugas && !matchCatatan && !matchLokasi) {
          return false;
        }
      }

      // Location
      if (filterLocation !== 'all' && log.namaTempat !== filterLocation) {
        return false;
      }

      // Petugas
      if (filterPetugas !== 'all' && log.petugas !== filterPetugas) {
        return false;
      }

      // Date
      if (filterDate !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        if (filterDate === 'today') {
          if (logDate.toDateString() !== now.toDateString()) return false;
        } else if (filterDate === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
          if (logDate < sevenDaysAgo) return false;
        }
      }

      return true;
    });
  }, [logs, searchTerm, filterLocation, filterPetugas, filterDate]);

  // Statistics
  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter(l => new Date(l.timestamp).toDateString() === today).length;
  }, [logs]);

  // Export logs to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'Waktu & Jam (WIB)',
      'Petugas / Operator',
      'Kode Stok',
      'Nama Barang',
      'Lokasi / Lantai',
      'Qty Sebelum',
      'Qty Fisik Diinput',
      'Selisih',
      'Satuan',
      'Tipe Aksi',
      'Catatan'
    ];

    const rows = filteredLogs.map(l => {
      const d = new Date(l.timestamp);
      const timeStr = `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID')}`;
      return [
        `"${timeStr}"`,
        `"${l.petugas}"`,
        `"${l.kodeStok}"`,
        `"${l.namaStok.replace(/"/g, '""')}"`,
        `"${l.namaTempat}"`,
        l.qtySebelum,
        l.qtyFisik,
        l.selisih,
        `"${l.satuan}"`,
        `"${l.actionType}"`,
        `"${(l.catatan || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Log_Penginputan_Opname_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const datePart = date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timePart = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return { datePart, timePart };
    } catch {
      return { datePart: iso, timePart: '' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner / Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Log Riwayat Penginputan Stok
              </h2>
              <p className="text-xs text-slate-500">
                Catatan waktu real-time setiap penginputan fisik, jam berapa diinput, siapa operatornya, dan rincian selisih stok.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Download riwayat penginputan dalam format Excel/CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV Log ({filteredLogs.length})</span>
          </button>

          {currentUser.role === 'admin' && onClearLogs && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              disabled={logs.length === 0}
              className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-40"
              title="Bersihkan riwayat log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Aktivitas Input
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {logs.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Semua riwayat tercatat
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Input Hari Ini
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {todayCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Penginputan aktif hari ini
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Jumlah Operator
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {distinctPetugas.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Staf lapangan yang menginput
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Lokasi Tercatat
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {distinctLocations.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Lantai / area opname
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari riwayat penginputan..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter Tanggal */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value as any)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hanya Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
              </select>
            </div>

            {/* Filter Operator */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterPetugas}
                onChange={(e) => setFilterPetugas(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Operator ({distinctPetugas.length})</option>
                {distinctPetugas.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Filter Lokasi */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Lokasi ({distinctLocations.length})</option>
                {distinctLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {(searchTerm || filterLocation !== 'all' || filterPetugas !== 'all' || filterDate !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterLocation('all');
                  setFilterPetugas('all');
                  setFilterDate('all');
                }}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Log Table View */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Belum ada aktivitas penginputan tercatat
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Setiap kali operator lapangan menginput atau memperbarui jumlah stok fisik, jam dan rincian lengkapnya akan langsung otomatis tercatat di halaman ini secara real-time.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Waktu & Jam Input</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Operator / Petugas</th>
                  <th className="px-4 py-3.5">Barang & Kode</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Lokasi / Lantai</th>
                  <th className="px-4 py-3.5 text-right font-mono whitespace-nowrap">Qty Fisik</th>
                  <th className="px-4 py-3.5 text-right font-mono whitespace-nowrap">Selisih</th>
                  <th className="px-4 py-3.5">Catatan Input</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredLogs.map((log) => {
                  const { datePart, timePart } = formatDateTime(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Exact Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-900 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{timePart}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {datePart}
                        </div>
                      </td>

                      {/* Petugas */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700">
                            {log.petugas.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">{log.petugas}</span>
                            {log.petugasUsername && (
                              <span className="text-[10px] text-slate-400 block font-mono">@{log.petugasUsername}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Barang & Kode */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">{log.namaStok}</div>
                        <div className="text-[11px] font-mono text-slate-400">{log.kodeStok}</div>
                      </td>

                      {/* Lokasi */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium text-[11px]">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          {log.namaTempat || 'Tidak Ditentukan'}
                        </span>
                      </td>

                      {/* Qty Fisik */}
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {log.qtyFisik} {log.satuan}
                        </div>
                        {log.qtySebelum !== undefined && log.qtySebelum !== log.qtyFisik && (
                          <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                            <span>Sebelum: {log.qtySebelum}</span>
                          </div>
                        )}
                      </td>

                      {/* Selisih */}
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        {log.selisih === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Sesuai (0)
                          </span>
                        ) : log.selisih < 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                            {log.selisih} {log.satuan}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            +{log.selisih} {log.satuan}
                          </span>
                        )}
                      </td>

                      {/* Catatan */}
                      <td className="px-4 py-3 max-w-xs text-xs text-slate-500">
                        {log.catatan ? (
                          <span className="italic line-clamp-1">"{log.catatan}"</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Menampilkan <strong>{filteredLogs.length}</strong> dari <strong>{logs.length}</strong> log penginputan.
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Real-time Audit Log Active
            </span>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear Logs */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Bersihkan Riwayat Log?
              </h3>
              <p className="text-xs text-slate-500">
                Semua catatan riwayat penginputan akan dihapus dari server. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearLogs?.();
                  setIsClearModalOpen(false);
                }}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Ya, Bersihkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
