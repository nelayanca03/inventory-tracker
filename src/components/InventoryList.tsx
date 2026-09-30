import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Image as ImageIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  LayoutList, 
  LayoutGrid, 
  ArrowUpDown, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  X,
  FileSpreadsheet,
  Download,
  Copy
} from 'lucide-react';
import { InventoryItem, FilterState, ViewMode } from '../types/inventory';
import { exportInventoryToCsv, copyInventoryToClipboardTSV } from '../services/csvService';

interface InventoryListProps {
  items: InventoryItem[];
  onAddNew: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onQuickUpdateQty: (id: string, newQtyFisik: number) => void;
  onOpenPhotoLightbox: (item: InventoryItem) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  items,
  onAddNew,
  onEdit,
  onDelete,
  onQuickUpdateQty,
  onOpenPhotoLightbox
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [copied, setCopied] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    tempat: 'all',
    kategori: 'all',
    statusSelisih: 'all',
    kondisi: 'all',
    sortBy: 'namaStok',
    sortOrder: 'asc'
  });

  // Extract distinct locations and categories
  const locations = useMemo(() => {
    const list = items.map(i => i.namaTempat).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [items]);

  const categories = useMemo(() => {
    const list = items.map(i => i.kategori).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [items]);

  // Filtered and sorted items - always stable A to Z by default
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search text
      if (filters.searchTerm.trim()) {
        const query = filters.searchTerm.toLowerCase();
        const matchKode = item.kodeStok.toLowerCase().includes(query);
        const matchNama = item.namaStok.toLowerCase().includes(query);
        const matchTempat = item.namaTempat.toLowerCase().includes(query);
        const matchCatatan = (item.catatan || '').toLowerCase().includes(query);
        const matchPetugas = item.petugas.toLowerCase().includes(query);
        if (!matchKode && !matchNama && !matchTempat && !matchCatatan && !matchPetugas) {
          return false;
        }
      }

      // Filter Tempat
      if (filters.tempat !== 'all' && item.namaTempat !== filters.tempat) {
        return false;
      }

      // Filter Kategori
      if (filters.kategori !== 'all' && item.kategori !== filters.kategori) {
        return false;
      }

      // Filter Status Selisih
      if (filters.statusSelisih === 'selisih' && item.selisih === 0) return false;
      if (filters.statusSelisih === 'sesuai' && item.selisih !== 0) return false;
      if (filters.statusSelisih === 'minus' && item.selisih >= 0) return false;
      if (filters.statusSelisih === 'plus' && item.selisih <= 0) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'namaStok') {
        comparison = a.namaStok.localeCompare(b.namaStok, 'id', { numeric: true, sensitivity: 'base' });
        if (comparison === 0) {
          comparison = a.kodeStok.localeCompare(b.kodeStok, 'id', { numeric: true, sensitivity: 'base' });
        }
      } else if (filters.sortBy === 'kodeStok') {
        comparison = a.kodeStok.localeCompare(b.kodeStok, 'id', { numeric: true, sensitivity: 'base' });
        if (comparison === 0) {
          comparison = a.namaStok.localeCompare(b.namaStok, 'id', { numeric: true, sensitivity: 'base' });
        }
      } else if (filters.sortBy === 'namaTempat') {
        comparison = (a.namaTempat || '').localeCompare(b.namaTempat || '', 'id', { numeric: true });
        if (comparison === 0) {
          comparison = a.namaStok.localeCompare(b.namaStok, 'id', { numeric: true, sensitivity: 'base' });
        }
      } else if (filters.sortBy === 'selisih') {
        comparison = Math.abs(b.selisih) - Math.abs(a.selisih);
        if (comparison === 0) {
          comparison = a.namaStok.localeCompare(b.namaStok, 'id', { numeric: true, sensitivity: 'base' });
        }
      } else {
        comparison = a.namaStok.localeCompare(b.namaStok, 'id', { numeric: true, sensitivity: 'base' });
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, filters]);

  // Statistics
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQtyFisik = items.reduce((acc, curr) => acc + (Number(curr.qtyFisik) || 0), 0);
    const selisihCount = items.filter(i => i.selisih !== 0).length;
    const sesuaiCount = items.filter(i => i.selisih === 0).length;
    const minusCount = items.filter(i => i.selisih < 0).length;
    const plusCount = items.filter(i => i.selisih > 0).length;

    return { totalItems, totalQtyFisik, selisihCount, sesuaiCount, minusCount, plusCount };
  }, [items]);

  const handleCopyTSV = async () => {
    const success = await copyInventoryToClipboardTSV(filteredItems);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      tempat: 'all',
      kategori: 'all',
      statusSelisih: 'all',
      kondisi: 'all',
      sortBy: 'namaStok',
      sortOrder: 'asc'
    });
  };

  const handleSortToggle = (column: 'kodeStok' | 'namaStok' | 'namaTempat' | 'selisih') => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const hasActiveFilters = filters.searchTerm !== '' || filters.tempat !== 'all' || filters.kategori !== 'all' || filters.statusSelisih !== 'all' || filters.kondisi !== 'all' || filters.sortBy !== 'namaStok' || filters.sortOrder !== 'asc';

  return (
    <div className="space-y-6">
      
      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Dihitung</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {stats.totalItems} <span className="text-xs font-sans font-normal text-slate-400">item</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total fisik: <strong className="font-mono">{stats.totalQtyFisik.toLocaleString('id-ID')}</strong> unit
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Stok Sesuai (100% Match)
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {stats.sesuaiCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalItems > 0 ? Math.round((stats.sesuaiCount / stats.totalItems) * 100) : 0}% tingkat akurasi
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-rose-700 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Selisih Kurang (Minus)
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
            {stats.minusCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Perlu investigasi fisik
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-amber-700 font-medium">
            Selisih Lebih (Surplus)
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {stats.plusCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Barang berlebih di rak
          </div>
        </div>
      </div>

      {/* Control Strip: Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="Cari data opname..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all placeholder:text-slate-400"
            />
            {filters.searchTerm && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons on Toolbar */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Tabel Lapang"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Kartu Foto"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onAddNew}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Data Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          
          {/* Tempat / Rak Filter */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.tempat}
              onChange={(e) => setFilters(prev => ({ ...prev, tempat: e.target.value }))}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-slate-900 focus:bg-white"
            >
              <option value="all">Semua Tempat / Lokasi ({locations.length})</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Status Selisih Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={filters.statusSelisih}
              onChange={(e) => setFilters(prev => ({ ...prev, statusSelisih: e.target.value as any }))}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-slate-900 focus:bg-white"
            >
              <option value="all">Semua Status Stok</option>
              <option value="selisih">Hanya Yang Ada Selisih</option>
              <option value="sesuai">Hanya Yang Sesuai (0)</option>
              <option value="minus">Selisih Kurang (Minus)</option>
              <option value="plus">Selisih Lebih (Surplus)</option>
            </select>
          </div>

          {/* Kategori Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={filters.kategori}
                onChange={(e) => setFilters(prev => ({ ...prev, kategori: e.target.value }))}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-slate-900 focus:bg-white"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Urutan / Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
                setFilters(prev => ({ ...prev, sortBy: sb, sortOrder: so }));
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-slate-900 focus:bg-white"
            >
              <option value="namaStok-asc">Urutkan: Nama Barang (A - Z)</option>
              <option value="namaStok-desc">Urutkan: Nama Barang (Z - A)</option>
              <option value="kodeStok-asc">Urutkan: Kode Stok (A - Z)</option>
              <option value="namaTempat-asc">Urutkan: Lokasi / Rak</option>
              <option value="selisih-desc">Urutkan: Selisih Terbesar</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors ml-auto flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reset Filter
            </button>
          )}

        </div>
      </div>

      {/* Main Content: Table View vs Card View */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            {hasActiveFilters ? 'Tidak ada data inventory yang cocok dengan filter' : 'Belum ada data perhitungan inventory'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {hasActiveFilters 
              ? 'Coba ganti kata kunci pencarian atau bersihkan filter lokasi.' 
              : 'Mulai input perhitungan fisik stok di rak gudang Anda sekarang.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset Semua Filter
              </button>
            ) : (
              <button
                onClick={onAddNew}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                + Input Data Pertama
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (High Legibility & Ergonomics) */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">Foto</th>
                  <th 
                    onClick={() => handleSortToggle('kodeStok')}
                    className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    title="Klik untuk urutkan berdasarkan Kode Stok"
                  >
                    <div className="flex items-center gap-1">
                      <span>Kode Stok</span>
                      {filters.sortBy === 'kodeStok' && (
                        <span className="text-slate-900 font-bold">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSortToggle('namaStok')}
                    className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    title="Klik untuk urutkan Nama Barang A-Z"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nama Stok & Kategori</span>
                      {filters.sortBy === 'namaStok' ? (
                        <span className="text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                          {filters.sortOrder === 'asc' ? 'A → Z ↑' : 'Z → A ↓'}
                        </span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSortToggle('namaTempat')}
                    className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    title="Klik untuk urutkan berdasarkan Tempat / Lokasi"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tempat / Lokasi</span>
                      {filters.sortBy === 'namaTempat' && (
                        <span className="text-slate-900 font-bold">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-right font-mono">Qty Sistem</th>
                  <th className="px-4 py-3.5 text-center font-mono">Qty Fisik</th>
                  <th 
                    onClick={() => handleSortToggle('selisih')}
                    className="px-4 py-3.5 text-right font-mono cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    title="Klik untuk urutkan berdasarkan Selisih"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Selisih</span>
                      {filters.sortBy === 'selisih' && (
                        <span className="text-slate-900 font-bold">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Petugas & Update</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    
                    {/* Foto Thumbnail */}
                    <td className="px-4 py-3 text-center">
                      {item.gambarUrl ? (
                        <button
                          onClick={() => onOpenPhotoLightbox(item)}
                          className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 inline-block relative group/thumb hover:ring-2 hover:ring-slate-900 transition-all"
                          title="Klik untuk perbesar foto"
                        >
                          <img
                            src={item.gambarUrl}
                            alt={item.namaStok}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300 mx-auto" title="Tidak ada foto">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </td>

                    {/* Kode Stok */}
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {item.kodeStok}
                    </td>

                    {/* Nama Stok & Kategori */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-slate-900 line-clamp-1">{item.namaStok}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{item.kategori || 'Umum'}</span>
                        {item.catatan && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-600 truncate max-w-[150px]" title={item.catatan}>
                              {item.catatan}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Tempat / Rak */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.namaTempat ? (
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item.namaTempat}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 px-2 py-0.5 rounded">
                          Belum diinput
                        </span>
                      )}
                    </td>

                    {/* Qty Sistem */}
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      <span className="font-semibold">{item.qtySistem}</span>{' '}
                      <span className="text-[10px] text-slate-400 font-sans">{item.satuan}</span>
                    </td>

                    {/* Qty Fisik (With quick inline recount) */}
                    <td className="px-4 py-3 text-center font-mono">
                      <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        <button
                          onClick={() => onQuickUpdateQty(item.id, Math.max(0, item.qtyFisik - 1))}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 font-bold active:bg-slate-300"
                          title="Kurangi 1 fisik"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-slate-900">
                          {item.qtyFisik}
                        </span>
                        <button
                          onClick={() => onQuickUpdateQty(item.id, item.qtyFisik + 1)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 font-bold active:bg-slate-300"
                          title="Tambah 1 fisik"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Selisih */}
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                      {item.selisih === 0 ? (
                        <span className="text-emerald-700 font-medium">
                          0 {item.satuan}
                        </span>
                      ) : item.selisih < 0 ? (
                        <span className="text-rose-700 font-bold">
                          {item.selisih} {item.satuan}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold">
                          +{item.selisih} {item.satuan}
                        </span>
                      )}
                    </td>

                    {/* Petugas & Tanggal */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-slate-800 text-xs">{item.petugas}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.updatedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit data"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Hapus data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer info */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              Menampilkan <strong>{filteredItems.length}</strong> dari <strong>{items.length}</strong> total baris inventory.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTSV}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Tersalin!' : 'Salin Semua Baris'}
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={() => exportInventoryToCsv(filteredItems)}
                className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CARD / GRID VIEW (Ideal for Visual Stock Inspection with Photos) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative aspect-video bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center">
                  {item.gambarUrl ? (
                    <img
                      src={item.gambarUrl}
                      alt={item.namaStok}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => onOpenPhotoLightbox(item)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-[11px]">Belum ada foto</span>
                    </div>
                  )}

                  {/* Variance floating badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-mono font-bold rounded-md shadow-xs backdrop-blur-md ${
                      item.selisih === 0
                        ? 'bg-emerald-600/90 text-white'
                        : item.selisih < 0
                        ? 'bg-rose-600/90 text-white'
                        : 'bg-amber-600/90 text-white'
                    }`}>
                      {item.selisih === 0 ? 'Match 0' : item.selisih > 0 ? `+${item.selisih}` : item.selisih} {item.satuan}
                    </span>
                  </div>

                  {/* Location floating chip */}
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{item.namaTempat || 'Belum diinput'}</span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">
                      {item.kodeStok} · {item.kategori}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
                      {item.namaStok}
                    </h4>
                    {item.catatan && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">
                        "{item.catatan}"
                      </p>
                    )}
                  </div>

                  {/* Quantity Breakdown Box */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] font-sans block">Qty Sistem:</span>
                      <span className="font-semibold text-slate-800">{item.qtySistem} {item.satuan}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-sans block">Qty Fisik:</span>
                      <span className="font-bold text-slate-900">{item.qtyFisik} {item.satuan}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Petugas: <strong>{item.petugas}</strong></span>
                    <span>{new Date(item.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-mono">
                  <button
                    onClick={() => onQuickUpdateQty(item.id, Math.max(0, item.qtyFisik - 1))}
                    className="w-7 h-7 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 font-bold"
                  >
                    -
                  </button>
                  <button
                    onClick={() => onQuickUpdateQty(item.id, item.qtyFisik + 1)}
                    className="w-7 h-7 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(item)}
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-900 font-medium hover:bg-slate-200 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Hapus data barang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Data Barang?
              </h3>
              <p className="text-xs text-slate-500">
                Tindakan ini akan menghapus data barang berikut dari inventaris:
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 text-xs">
              {itemToDelete.gambarUrl ? (
                <img
                  src={itemToDelete.gambarUrl}
                  alt={itemToDelete.namaStok}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 truncate">{itemToDelete.namaStok}</div>
                <div className="text-slate-500 font-mono text-[11px]">{itemToDelete.kodeStok}</div>
                <div className="text-slate-400 text-[10px]">{itemToDelete.namaTempat}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
