import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Plus, 
  Minus, 
  Check, 
  RotateCcw, 
  MapPin, 
  Barcode, 
  Package, 
  User, 
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { InventoryItem, AppSettings } from '../types/inventory';
import { compressImageFile, INITIAL_LOCATIONS, INITIAL_CATEGORIES, INITIAL_UNITS } from '../services/storageService';

interface InventoryFormProps {
  initialItem?: InventoryItem | null;
  onSave: (item: InventoryItem, keepLocation?: boolean) => void;
  onCancel: () => void;
  settings: AppSettings;
  availableLocations: string[];
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  initialItem,
  onSave,
  onCancel,
  settings,
  availableLocations
}) => {
  const [kodeStok, setKodeStok] = useState(initialItem?.kodeStok || '');
  const [namaStok, setNamaStok] = useState(initialItem?.namaStok || '');
  const [namaTempat, setNamaTempat] = useState(initialItem?.namaTempat || settings.defaultTempat || 'Gudang A - Rak 01');
  const [kategori, setKategori] = useState(initialItem?.kategori || 'Sparepart Mesin');
  const [qtySistem, setQtySistem] = useState<number>(initialItem ? initialItem.qtySistem : 0);
  const [qtyFisik, setQtyFisik] = useState<number>(initialItem ? initialItem.qtyFisik : 0);
  const [satuan, setSatuan] = useState(initialItem?.satuan || settings.defaultSatuan || 'Pcs');
  const [kondisi, setKondisi] = useState<InventoryItem['kondisi']>(initialItem?.kondisi || 'Baik');
  const [gambarUrl, setGambarUrl] = useState<string>(initialItem?.gambarUrl || '');
  const [petugas, setPetugas] = useState(initialItem?.petugas || settings.defaultPetugas || 'Staff Inventory');
  const [catatan, setCatatan] = useState(initialItem?.catatan || '');
  
  const [isCompressing, setIsCompressing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Calculate live variance
  const selisih = (Number(qtyFisik) || 0) - (Number(qtySistem) || 0);

  // Combine suggested locations
  const allLocations = Array.from(new Set([...availableLocations, ...INITIAL_LOCATIONS]));

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImageFile(file, 1000, 1000, 0.75);
      setGambarUrl(compressedDataUrl);
    } catch (err) {
      console.error('Failed to compress image:', err);
      setFormError('Gagal memproses gambar. Silakan coba file lain.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleQuickAddQty = (amount: number) => {
    setQtyFisik(prev => Math.max(0, (Number(prev) || 0) + amount));
  };

  const generateAutoKode = () => {
    const prefix = kategori.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setKodeStok(`${prefix}-${randomNum}`);
  };

  const handleSubmit = (continueNext = false) => {
    setFormError(null);

    if (!kodeStok.trim()) {
      setFormError('Kode Stok (SKU) wajib diisi.');
      return;
    }
    if (!namaStok.trim()) {
      setFormError('Nama Stok barang wajib diisi.');
      return;
    }
    if (!namaTempat.trim()) {
      setFormError('Nama Tempat / Lokasi Rak wajib diisi.');
      return;
    }

    const newItem: InventoryItem = {
      id: initialItem?.id || 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      kodeStok: kodeStok.trim().toUpperCase(),
      namaStok: namaStok.trim(),
      namaTempat: namaTempat.trim(),
      kategori,
      qtySistem: Number(qtySistem) || 0,
      qtyFisik: Number(qtyFisik) || 0,
      selisih,
      satuan,
      kondisi,
      gambarUrl,
      petugas: petugas.trim() || 'Petugas',
      catatan: catatan.trim(),
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newItem, continueNext);

    if (continueNext) {
      // Clear specific fields for next item in the same rack
      setKodeStok('');
      setNamaStok('');
      setQtySistem(0);
      setQtyFisik(0);
      setGambarUrl('');
      setCatatan('');
      setFormError(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {initialItem ? 'Edit Data Perhitungan Inventory' : 'Form Penginputan Data Inventory'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Input berukuran lapang, ramah sentuhan layar HP/tablet, dan menghitung selisih secara otomatis.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {formError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Identitas & Lokasi */}
          <div className="space-y-4">
            
            {/* Kode Stok */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-slate-500" />
                  Kode Stok / SKU / Barcode <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateAutoKode}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Generate
                </button>
              </div>
              <input
                type="text"
                value={kodeStok}
                onChange={(e) => setKodeStok(e.target.value)}
                placeholder="Contoh: SP-BRG-6204 atau scan barcode"
                className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all uppercase placeholder:normal-case placeholder:font-sans"
              />
            </div>

            {/* Nama Stok */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Stok / Deskripsi Barang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={namaStok}
                onChange={(e) => setNamaStok(e.target.value)}
                placeholder="Contoh: Bearing Deep Groove 6204 2RS"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
            </div>

            {/* Nama Tempat / Lokasi Rak */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Nama Tempat / Lokasi Rak / Bin <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={namaTempat}
                onChange={(e) => setNamaTempat(e.target.value)}
                placeholder="Ketik lokasi baru atau pilih saran di bawah"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
              
              {/* Quick Suggestion Chips for Location */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 self-center">Pilihan cepat:</span>
                {allLocations.slice(0, 5).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setNamaTempat(loc)}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      namaTempat === loc
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Kategori & Satuan */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kategori
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                >
                  {INITIAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Satuan (UOM)
                </label>
                <select
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                >
                  {INITIAL_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kondisi & Petugas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kondisi Barang
                </label>
                <select
                  value={kondisi}
                  onChange={(e) => setKondisi(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                >
                  <option value="Baik">Baik (Normal)</option>
                  <option value="Rusak">Rusak (Damaged)</option>
                  <option value="Kadaluarsa">Kadaluarsa (Expired)</option>
                  <option value="Perlu Cek">Perlu Cek Ulang</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Petugas
                </label>
                <input
                  type="text"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  placeholder="Nama staf"
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Perhitungan Stok & Upload Gambar */}
          <div className="space-y-4">
            
            {/* Box Perhitungan Stok (Qty Sistem, Fisik, Selisih) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Perhitungan Stok</span>
                <span className="text-[11px] font-normal text-slate-500 lowercase">
                  satuan: <strong className="text-slate-800 uppercase">{satuan}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Qty Sistem */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Qty Sistem (Buku)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={qtySistem}
                    onChange={(e) => setQtySistem(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 text-base font-semibold font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Data tercatat sebelumnya</span>
                </div>

                {/* Qty Fisik */}
                <div>
                  <label className="block text-xs font-medium text-slate-900 font-semibold mb-1 flex items-center justify-between">
                    <span>Qty Fisik (Aktual)</span>
                    <span className="text-[10px] text-indigo-600 font-normal">Hasil hitung</span>
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleQuickAddQty(-1)}
                      className="px-2.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-l-lg border border-r-0 border-slate-300 active:bg-slate-400"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={qtyFisik}
                      onChange={(e) => setQtyFisik(parseFloat(e.target.value) || 0)}
                      className="w-full py-2.5 text-center text-lg font-bold font-mono border-y border-slate-300 focus:ring-2 focus:ring-slate-900 bg-white z-10"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickAddQty(1)}
                      className="px-2.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-r-lg border border-l-0 border-slate-300 active:bg-slate-400"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Numpad Buttons for warehouse floor */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500">Tambah cepat:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAddQty(5)}
                  className="px-2 py-1 text-xs font-mono font-medium bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddQty(10)}
                  className="px-2 py-1 text-xs font-mono font-medium bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddQty(50)}
                  className="px-2 py-1 text-xs font-mono font-medium bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700"
                >
                  +50
                </button>
                <button
                  type="button"
                  onClick={() => setQtyFisik(qtySistem)}
                  className="ml-auto px-2 py-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline"
                >
                  Samakan dg Sistem
                </button>
              </div>

              {/* Real-time Selisih Status Banner */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                selisih === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : selisih < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="text-xs">
                  <div className="font-semibold">
                    {selisih === 0
                      ? 'Stok Sesuai (Match)'
                      : selisih < 0
                      ? 'Selisih Kurang (Minus / Defisit)'
                      : 'Selisih Lebih (Surplus)'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    Qty Fisik ({qtyFisik}) - Qty Sistem ({qtySistem})
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono">
                    {selisih > 0 ? `+${selisih}` : selisih}
                  </span>
                  <span className="text-xs ml-1 font-medium">{satuan}</span>
                </div>
              </div>
            </div>

            {/* Foto Barang */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                Data Gambar / Foto Barang
              </label>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {gambarUrl ? (
                <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 aspect-video max-h-44 flex items-center justify-center">
                  <img
                    src={gambarUrl}
                    alt="Preview Barang"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setGambarUrl('')}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                    title="Hapus foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded">
                    Foto tersimpan
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isCompressing}
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-3 border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl text-indigo-700 flex flex-col items-center justify-center gap-1.5 transition-colors text-xs font-medium"
                  >
                    <Camera className="w-5 h-5 text-indigo-600" />
                    <span>Buka Kamera HP</span>
                    <span className="text-[10px] text-indigo-500 font-normal">Foto barang langsung</span>
                  </button>

                  <button
                    type="button"
                    disabled={isCompressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-700 flex flex-col items-center justify-center gap-1.5 transition-colors text-xs font-medium"
                  >
                    <Upload className="w-5 h-5 text-slate-500" />
                    <span>Upload dari Galeri</span>
                    <span className="text-[10px] text-slate-400 font-normal">File JPG, PNG, WEBP</span>
                  </button>
                </div>
              )}
            </div>

            {/* Catatan Lapangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Catatan Temuan Fisik
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Barang berdebu, kemasan sobek, atau nomor seri tidak terbaca..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Batal & Kembali
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {!initialItem && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                Simpan & Lanjut Item Berikutnya
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Simpan Data Perhitungan</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
