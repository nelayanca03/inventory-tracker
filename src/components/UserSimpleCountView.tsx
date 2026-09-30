import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Plus, 
  Minus, 
  Check, 
  CheckCircle2, 
  ZoomIn, 
  Package, 
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { InventoryItem, AppSettings, UserAccount } from '../types/inventory';

interface UserSimpleCountViewProps {
  currentUser: UserAccount;
  items: InventoryItem[];
  settings: AppSettings;
  onSaveCount: (updatedItem: InventoryItem) => void;
  onOpenPhotoLightbox: (item: InventoryItem) => void;
}

export const UserSimpleCountView: React.FC<UserSimpleCountViewProps> = ({
  currentUser,
  items,
  settings,
  onSaveCount,
  onOpenPhotoLightbox
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Count input states
  const [qtyFisik, setQtyFisik] = useState<number>(0);
  const [lokasi, setLokasi] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [isMatchConfirmed, setIsMatchConfirmed] = useState<boolean>(true);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userSessionCount, setUserSessionCount] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Available locations from settings or distinct items
  const allLocations = useMemo(() => {
    const list = [...(settings.availableLocations || []), ...items.map(i => i.namaTempat).filter(Boolean)];
    return Array.from(new Set(list)).sort();
  }, [settings.availableLocations, items]);

  // Filter items matching user search query (Searching nama atau kode)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return items.filter(item => 
      item.namaStok.toLowerCase().includes(q) || 
      item.kodeStok.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [items, searchTerm]);

  // When user clicks an item from search result
  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setQtyFisik(item.qtyFisik > 0 ? item.qtyFisik : 0);
    // Location is empty initially until user inputs it during counting
    setLokasi(item.namaTempat || '');
    setLocationError(null);
    setCatatan(item.catatan || '');
    setIsMatchConfirmed(true);
    setSearchTerm('');
  };

  const handleQuickAddQty = (amount: number) => {
    setQtyFisik(prev => Math.max(0, (Number(prev) || 0) + amount));
  };

  const handleConfirmSubmit = () => {
    if (!selectedItem) return;

    if (!lokasi.trim()) {
      setLocationError('Silakan pilih atau ketik lokasi rak tempat barang ini dihitung.');
      return;
    }

    const updatedItem: InventoryItem = {
      ...selectedItem,
      qtyFisik: Number(qtyFisik) || 0,
      namaTempat: lokasi.trim(),
      selisih: (Number(qtyFisik) || 0) - selectedItem.qtySistem,
      catatan: catatan.trim(),
      petugas: currentUser.fullName,
      isCounted: true,
      lastCountedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveCount(updatedItem);
    setUserSessionCount(prev => prev + 1);
    setSaveSuccessNotice(`✓ Data "${selectedItem.namaStok}" berhasil disimpan: ${qtyFisik} ${selectedItem.satuan} di ${lokasi}`);
    setSelectedItem(null);
    setSearchTerm('');
    setLocationError(null);
    
    // Auto clear success notice after 4 seconds
    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 4000);

    // Refocus search for next item
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      
      {/* Operator Welcome Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Operator: {currentUser.fullName}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
            Pencocokan Foto & Input Jumlah Stok
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Cari nama barang, cocokkan fisik barang dengan foto resmi admin, lalu masukkan jumlah & lokasinya.
          </p>
        </div>

        {userSessionCount > 0 && (
          <div className="shrink-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-slate-400">Telah Dihitung</div>
            <div className="text-base font-bold font-mono text-emerald-400">
              {userSessionCount} item
            </div>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {saveSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* STEP 1: Search Bar (Ultra Simple - Hanya Searching Nama) */}
      {!selectedItem && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
              Langkah 1: Cari Nama Barang
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama barang..."
                className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:ring-0 outline-none transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                >
                  Batal
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Ketik nama barang yang Anda temukan di rak gudang untuk melihat foto dan mengisi jumlah.
            </p>
          </div>

          {/* Search Results Dropdown List */}
          {searchTerm.trim() && (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Barang "<strong>{searchTerm}</strong>" belum terdaftar di master data.
                  <div className="mt-2 text-[11px] text-slate-400">
                    Hanya admin yang berwenang menambahkan master barang baru. Silakan hubungi admin gudang.
                  </div>
                </div>
              ) : (
                searchResults.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Photo Thumbnail */}
                      <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                        {item.gambarUrl ? (
                          <img
                            src={item.gambarUrl}
                            alt={item.namaStok}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {item.namaStok}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{item.kodeStok}</span>
                          <span>·</span>
                          <span>Rak Bawaan: {item.namaTempat}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="text-xs font-bold text-white bg-slate-900 group-hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors">
                        Pilih & Hitung →
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Quick Item List if no search query */}
          {!searchTerm.trim() && (
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                <span>Atau Pilih Cepat Barang di Bawah:</span>
                <span className="text-[11px] text-slate-400">{items.length} master barang</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {items.slice(0, 6).map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50/80 transition-all flex items-center gap-2.5 text-left"
                  >
                    <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                      {item.gambarUrl ? (
                        <img
                          src={item.gambarUrl}
                          alt={item.namaStok}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {item.namaStok}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.kodeStok} {item.namaTempat ? `· 📍 ${item.namaTempat}` : '· (Belum ada lokasi)'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* STEP 2: The Item Verification & Counting Card (Ultra Simple & Ergonomic) */}
      {selectedItem && (
        <div className="bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-lg space-y-0 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header of Selected Item */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                {selectedItem.kodeStok}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {selectedItem.namaStok}
              </h3>
            </div>
            
            <button
              onClick={() => setSelectedItem(null)}
              className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Ganti Barang
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            
            {/* Foto Master dari Admin & Instruksi Pencocokan */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Foto Referensi Master (Dari Admin):</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Klik foto untuk perbesar
                </span>
              </div>

              {selectedItem.gambarUrl ? (
                <div 
                  onClick={() => onOpenPhotoLightbox(selectedItem)}
                  className="relative group cursor-pointer aspect-video sm:aspect-[21/9] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center hover:ring-2 hover:ring-slate-900 transition-all"
                >
                  <img
                    src={selectedItem.gambarUrl}
                    alt={selectedItem.namaStok}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 backdrop-blur-xs">
                    <ZoomIn className="w-4 h-4" />
                    <span>Perbesar Foto</span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                    Foto Resmi Admin
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  Admin belum mengunggah foto master untuk barang ini.
                </div>
              )}

              {/* Visual Confirmation Checkbox */}
              <div className="pt-1 flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  id="confirmMatch"
                  type="checkbox"
                  checked={isMatchConfirmed}
                  onChange={(e) => setIsMatchConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                />
                <label htmlFor="confirmMatch" className="text-xs text-slate-700 font-medium select-none cursor-pointer">
                  Saya sudah mencocokkan bentuk fisik barang dengan foto master di atas.
                </label>
              </div>
            </div>

            {/* Input Qty Fisik (Lapang & Mudah untuk Jari) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Jumlah Fisik Aktual di Lokasi
                </label>
                <span className="text-xs font-mono text-slate-500">
                  Satuan: <strong className="text-slate-800">{selectedItem.satuan}</strong>
                </span>
              </div>

              {/* Large Plus/Minus Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickAddQty(-1)}
                  className="w-14 h-14 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-800 text-2xl font-bold flex items-center justify-center active:bg-slate-200 shadow-xs transition-colors shrink-0"
                >
                  <Minus className="w-6 h-6" />
                </button>

                <div className="flex-1 text-center bg-white border border-slate-300 rounded-xl py-2 px-3 shadow-xs">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={qtyFisik}
                    onChange={(e) => setQtyFisik(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-center text-3xl sm:text-4xl font-black font-mono text-slate-900 outline-none"
                  />
                  <div className="text-[11px] text-slate-400 font-sans">
                    Hasil hitungan fisik
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickAddQty(1)}
                  className="w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-2xl font-bold flex items-center justify-center active:bg-slate-700 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Quick Numpad Chips */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Tambah cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAddQty(5)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-mono font-medium text-slate-700"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddQty(10)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-mono font-medium text-slate-700"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddQty(50)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-mono font-medium text-slate-700"
                  >
                    +50
                  </button>
                </div>
              </div>
            </div>

            {/* Input Lokasi / Tempat (Wajib ditentukan saat penginputan) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  Lokasi / Rak Penginputan <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Wajib ditentukan saat hitung fisik
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => {
                    setLokasi(e.target.value);
                    if (locationError) setLocationError(null);
                  }}
                  placeholder="Pilih atau ketik lokasi..."
                  className={`w-full px-4 py-3 text-sm border rounded-xl focus:ring-1 outline-none transition-colors ${
                    locationError 
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-600 focus:ring-rose-600' 
                      : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900'
                  }`}
                />
              </div>

              {locationError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {locationError}
                </div>
              )}

              {/* Quick Suggestion Chips for Location */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 self-center">Pilihan cepat lokasi:</span>
                {allLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setLokasi(loc);
                      if (locationError) setLocationError(null);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                      lokasi === loc
                        ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan Tambahan (Opsional) */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-slate-900 outline-none"
              />
            </div>

            {/* Big Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5 text-white" />
                <span>Simpan Hasil Hitung ({qtyFisik} {selectedItem.satuan})</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
