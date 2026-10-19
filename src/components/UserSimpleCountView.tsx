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
  Sparkles,
  Info,
  AlertTriangle,
  Loader2,
  X,
  Camera,
  Mic,
  BrainCircuit
} from 'lucide-react';
import { InventoryItem, AppSettings, UserAccount } from '../types/inventory';
import { AISmartInputModal } from './AISmartInputModal';
import { customMlEngine } from '../services/customMlEngine';

interface UserSimpleCountViewProps {
  currentUser: UserAccount;
  items: InventoryItem[];
  settings: AppSettings;
  onSaveCount: (updatedItem: InventoryItem, mode?: 'replace' | 'accumulate', addedQty?: number) => void;
  onOpenPhotoLightbox: (item: InventoryItem) => void;
  onOpenMlStudio?: () => void;
}

export const UserSimpleCountView: React.FC<UserSimpleCountViewProps> = ({
  currentUser,
  items,
  settings,
  onSaveCount,
  onOpenPhotoLightbox,
  onOpenMlStudio
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lastInputQuery, setLastInputQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Count input states
  const [qtyFisik, setQtyFisik] = useState<number>(0);
  const [lokasi, setLokasi] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userSessionCount, setUserSessionCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleApplyAiItem = (item: InventoryItem, qty: number, loc: string, cat: string) => {
    setSelectedItem(item);
    setQtyFisik(qty > 0 ? qty : (item.qtyFisik > 0 ? item.qtyFisik : 0));
    setLokasi(loc || item.namaTempat || '');
    setLocationError(null);
    setCatatan(cat || item.catatan || '');
    setLastInputQuery(searchTerm);
    setSearchTerm('');
  };

  // Real-time track if someone else updated this item while open
  const currentCloudItem = useMemo(() => {
    if (!selectedItem) return null;
    return items.find(i => i.id === selectedItem.id) || null;
  }, [items, selectedItem]);

  const wasUpdatedByOther = useMemo(() => {
    if (!selectedItem || !currentCloudItem) return false;
    return (
      currentCloudItem.updatedAt !== selectedItem.updatedAt &&
      currentCloudItem.petugas !== currentUser.fullName
    );
  }, [selectedItem, currentCloudItem, currentUser.fullName]);

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

  // Real-time In-App Machine Learning Prediction for loose queries, abbreviations & slangs
  const mlPrediction = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return null;
    return customMlEngine.predict(searchTerm, items, allLocations);
  }, [searchTerm, items, allLocations]);

  // When user clicks an item from search result
  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setQtyFisik(item.qtyFisik > 0 ? item.qtyFisik : 0);
    setLokasi(item.namaTempat || '');
    setLocationError(null);
    setCatatan(item.catatan || '');
    setLastInputQuery(searchTerm);
    setSearchTerm('');
  };

  const handleQuickAddQty = (amount: number) => {
    setQtyFisik(prev => Math.max(0, (Number(prev) || 0) + amount));
  };

  const handleConfirmSubmit = async (mode: 'replace' | 'accumulate' = 'replace') => {
    if (!selectedItem || isSubmitting) return;

    if (!lokasi.trim()) {
      setLocationError('Pilih atau ketik lokasi rak tempat barang ini dihitung.');
      return;
    }

    setIsSubmitting(true);
    const numInput = Number(qtyFisik) || 0;
    const baseItem = currentCloudItem || selectedItem;

    let targetQty = numInput;
    if (mode === 'accumulate') {
      targetQty = (Number(baseItem.qtyFisik) || 0) + numInput;
    }

    // Machine Learning Auto-learning: Teach the model from this confirmed transaction!
    if (lastInputQuery && lastInputQuery.trim().length >= 3) {
      customMlEngine.autoLearnFromConfirmedCount(
        lastInputQuery,
        baseItem,
        targetQty,
        lokasi.trim()
      );
    }

    const updatedItem: InventoryItem = {
      ...baseItem,
      qtyFisik: targetQty,
      namaTempat: lokasi.trim(),
      selisih: targetQty - baseItem.qtySistem,
      catatan: catatan.trim(),
      petugas: currentUser.fullName,
      isCounted: true,
      lastCountedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSaveCount(updatedItem, mode, numInput);
      setUserSessionCount(prev => prev + 1);

      if (mode === 'accumulate') {
        setSaveSuccessNotice(
          `✓ Ditambahkan +${numInput} ${selectedItem.satuan}. Total fisik: ${targetQty} ${selectedItem.satuan} di ${lokasi}`
        );
      } else {
        setSaveSuccessNotice(
          `✓ Tersimpan: ${selectedItem.namaStok} (${targetQty} ${selectedItem.satuan}) di ${lokasi}`
        );
      }

      setSelectedItem(null);
      setSearchTerm('');
      setLocationError(null);
      
      setTimeout(() => {
        setSaveSuccessNotice(null);
      }, 3500);

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    } catch (err) {
      console.error('Submit error:', err);
      setLocationError('Gagal menyimpan data ke cloud. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">
      
      {/* Success Notification Alert */}
      {saveSuccessNotice && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          <span className="text-[11px] text-emerald-200">Siap input berikutnya</span>
        </div>
      )}

      {/* STATE 1: SEARCH & SELECT BARANG */}
      {!selectedItem && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Stasiun Hitung Opname
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cari barang berdasarkan nama atau kode untuk mencocokkan fisik & foto
              </p>
            </div>

            {userSessionCount > 0 && (
              <div className="self-start sm:self-auto px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold font-mono">
                ✓ {userSessionCount} barang dihitung sesi ini
              </div>
            )}
          </div>

          {/* Machine Learning & Smart Input Quick Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-linear-to-r from-indigo-50 via-teal-50 to-emerald-50 border border-indigo-200/80 rounded-2xl">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                <BrainCircuit className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block leading-tight">Studio Machine Learning & Input Pintar</span>
                <span className="text-[11px] text-slate-500">Mengenali singkatan, suara, dan foto barang otomatis via Model ML Mandiri</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {onOpenMlStudio && (
                <button
                  type="button"
                  onClick={onOpenMlStudio}
                  title="Buka Studio Machine Learning & Latih Model Otomatis"
                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Studio ML</span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-indigo-600 text-white rounded-md font-extrabold uppercase shadow-2xs">
                    Latih
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Mic className="w-3.5 h-3.5 text-amber-300" />
                <span>Input Suara / Teks</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-200" />
                <span>Scan Foto Barang</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik nama atau kode barang..."
              className="w-full pl-12 pr-10 py-3.5 text-base border-2 border-slate-200 focus:border-slate-900 rounded-2xl outline-hidden transition-all placeholder:text-slate-400 font-medium shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Real-time In-App Machine Learning Prediction Box */}
          {mlPrediction && mlPrediction.matchedItem && !selectedItem && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-emerald-50/80 border-2 border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <BrainCircuit className="w-5 h-5 text-indigo-200" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                      Prediksi ML: {(mlPrediction.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Metode: {mlPrediction.method} ({mlPrediction.inferenceTimeMs}ms)
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                    <span className="text-indigo-600 font-mono mr-1.5">[{mlPrediction.matchedKode}]</span>
                    <span>{mlPrediction.matchedNama}</span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 mt-0.5">
                    {mlPrediction.qtyFisik !== null && (
                      <span className="font-semibold text-emerald-700">
                        Qty Fisik: <span className="font-mono">{mlPrediction.qtyFisik}</span>
                      </span>
                    )}
                    {mlPrediction.lokasi && (
                      <span className="text-slate-600">
                        Lokasi: <strong>{mlPrediction.lokasi}</strong>
                      </span>
                    )}
                    {mlPrediction.catatan && (
                      <span className="text-slate-500 italic">
                        Catatan: {mlPrediction.catatan}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleApplyAiItem(
                      mlPrediction.matchedItem!,
                      mlPrediction.qtyFisik || 0,
                      mlPrediction.lokasi || '',
                      mlPrediction.catatan || ''
                    );
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Pilih & Hitung Barang Ini</span>
                </button>
              </div>
            </div>
          )}

          {/* Search Results Dropdown List */}
          {searchTerm.trim() && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-md">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <Package className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="font-semibold text-slate-700">Barang &quot;{searchTerm}&quot; tidak ditemukan</div>
                  <p className="text-[11px] text-slate-400">Pastikan ejaan nama atau kode stok sudah sesuai.</p>
                  {onOpenMlStudio && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={onOpenMlStudio}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ajari Model ML Frasa Ini di Studio</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                searchResults.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
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

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {item.namaStok}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                          <span>{item.kodeStok}</span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span className="text-slate-600">{item.namaTempat || 'Lokasi belum ditentukan'}</span>
                          {item.qtyFisik > 0 && (
                            <>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <span className="text-emerald-700 font-semibold">Tercatat: {item.qtyFisik} {item.satuan}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pl-3">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-white bg-slate-100 group-hover:bg-slate-900 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs">
                        Hitung →
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Quick Item List if no search query */}
          {!searchTerm.trim() && (
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Daftar Barang Master:</span>
                <span className="font-mono text-[11px]">{items.length} produk</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {items.slice(0, 8).map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center gap-3 text-left group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                      {item.gambarUrl ? (
                        <img
                          src={item.gambarUrl}
                          alt={item.namaStok}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                        {item.namaStok}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {item.kodeStok} · {item.namaTempat || 'Belum ada rak'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* STATE 2: FOCUS COUNTING TERMINAL (CLEAN & TACTILE) */}
      {selectedItem && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header of Selected Item */}
          <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 bg-white/10 px-2 py-0.5 rounded-md font-bold">
                {selectedItem.kodeStok}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1 truncate">
                {selectedItem.namaStok}
              </h3>
            </div>
            
            <button
              onClick={() => setSelectedItem(null)}
              className="text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl transition-colors shrink-0 font-medium"
            >
              Ganti Barang
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Top Split: Photo & Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center pb-5 border-b border-slate-100">
              
              {/* Photo Box */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Foto Master Resmi Admin
                </span>
                {selectedItem.gambarUrl ? (
                  <div 
                    onClick={() => onOpenPhotoLightbox(selectedItem)}
                    className="relative group cursor-pointer aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center hover:ring-2 hover:ring-slate-900 transition-all shadow-2xs"
                    title="Klik untuk melihat foto ukuran penuh"
                  >
                    <img
                      src={selectedItem.gambarUrl}
                      alt={selectedItem.namaStok}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-xs">
                      <ZoomIn className="w-4 h-4" />
                      <span>Perbesar Foto</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                    <Package className="w-7 h-7 text-slate-300 mb-1" />
                    <span>Belum ada foto master</span>
                  </div>
                )}
              </div>

              {/* System Specs Box */}
              <div className="space-y-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Stok Sistem:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {selectedItem.qtySistem} {selectedItem.satuan}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-medium text-slate-800">{selectedItem.kategori}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rak Default:</span>
                  <span className="font-medium text-slate-800">{selectedItem.namaTempat || 'Belum diatur'}</span>
                </div>
              </div>

            </div>

            {/* Input Qty Fisik Counter */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Hasil Hitungan Fisik Aktual
                </label>
                <span className="text-xs font-mono text-slate-500">
                  Satuan: <strong className="text-slate-900">{selectedItem.satuan}</strong>
                </span>
              </div>

              {/* Large Minus / Input / Plus */}
              <div className="flex items-center gap-2.5 sm:gap-4">
                <button
                  type="button"
                  onClick={() => handleQuickAddQty(-1)}
                  disabled={qtyFisik <= 0}
                  className="w-14 h-14 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 border border-slate-300 rounded-2xl text-slate-800 text-2xl font-black flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer"
                  title="Kurangi 1"
                >
                  <Minus className="w-6 h-6" />
                </button>

                <div className="flex-1 bg-white border-2 border-slate-300 focus-within:border-slate-900 rounded-2xl py-2 px-3 shadow-2xs transition-colors">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={qtyFisik}
                    onChange={(e) => setQtyFisik(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-center text-3xl sm:text-4xl font-black font-mono text-slate-900 outline-hidden"
                  />
                  <div className="text-[10px] text-slate-400 font-sans text-center mt-0.5">
                    Ketik angka langsung atau gunakan tombol +/-
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickAddQty(1)}
                  className="w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-2xl font-black flex items-center justify-center active:scale-95 shadow-xs transition-all shrink-0 cursor-pointer"
                  title="Tambah 1"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Quick Numpad Chips */}
              <div className="flex items-center gap-1.5 pt-1 text-xs">
                <span className="text-[11px] text-slate-400 mr-1">Tambah cepat:</span>
                {[5, 10, 50, 100].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAddQty(amt)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-mono font-bold text-slate-700 text-xs transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Lokasi / Rak */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                Lokasi / Rak Gudang <span className="text-rose-500">*</span>
              </label>

              <input
                type="text"
                value={lokasi}
                onChange={(e) => {
                  setLokasi(e.target.value);
                  if (locationError) setLocationError(null);
                }}
                placeholder="Pilih atau ketik lokasi rak..."
                className={`w-full px-4 py-3 text-sm border rounded-xl outline-hidden transition-all ${
                  locationError 
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600' 
                    : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />

              {locationError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {locationError}
                </div>
              )}

              {/* Quick Suggestion Chips */}
              {allLocations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {allLocations.slice(0, 6).map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setLokasi(loc);
                        if (locationError) setLocationError(null);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        lokasi === loc
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Catatan Tambahan (Opsional) */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Catatan Fisik (Opsional)
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Dus agak penyok, sisa di lantai..."
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 outline-hidden"
              />
            </div>

            {/* Real-time Conflict Alert when another operator updated this item */}
            {wasUpdatedByOther && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-950 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold">
                    Peringatan: Barang ini baru saja diinput oleh &quot;{currentCloudItem?.petugas}&quot;!
                  </div>
                  <p className="text-slate-700">
                    Jumlah fisik di database saat ini: <strong>{currentCloudItem?.qtyFisik} {selectedItem.satuan}</strong> di <strong>{currentCloudItem?.namaTempat || 'lokasi'}</strong>.
                  </p>
                  <p className="text-amber-800 font-medium">
                    Pilih <strong>Tambah (Akumulasi)</strong> agar kedua hitungan digabung, atau <strong>Ganti Nilai Total</strong> jika mengoreksi.
                  </p>
                </div>
              </div>
            )}

            {/* Previous count info */}
            {((currentCloudItem?.qtyFisik || selectedItem.qtyFisik) > 0) && !wasUpdatedByOther && (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Stok fisik tercatat sebelumnya: <strong>{currentCloudItem?.qtyFisik || selectedItem.qtyFisik} {selectedItem.satuan}</strong> (oleh {currentCloudItem?.petugas || selectedItem.petugas})
                  </span>
                </div>
              </div>
            )}

            {/* Submit Action Buttons */}
            <div className="pt-2 space-y-2">
              {((currentCloudItem?.qtyFisik || selectedItem.qtyFisik) > 0) ? (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleConfirmSubmit('accumulate')}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menyimpan ke Cloud...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-white" />
                        <span>
                          Tambahkan ke Stok Sebelumnya (+{qtyFisik} = {((currentCloudItem?.qtyFisik || selectedItem.qtyFisik) + (Number(qtyFisik) || 0))} {selectedItem.satuan})
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleConfirmSubmit('replace')}
                    className="w-full py-3 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-300 text-slate-800 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-slate-600" />
                    <span>Ganti Nilai Total Menjadi {qtyFisik} {selectedItem.satuan}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmSubmit('replace')}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Menyimpan ke Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 text-white" />
                      <span>Simpan Hasil Hitung ({qtyFisik} {selectedItem.satuan})</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* AI Smart Input Modal */}
      <AISmartInputModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        items={items}
        onApplyParsedItem={handleApplyAiItem}
      />

    </div>
  );
};
