import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  X, 
  MapPin, 
  Tag, 
  Layers, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Sparkles
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface BulkItemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  selectedIds: string[];
  locations: string[];
  categories: string[];
  units: string[];
  onApplyBulkUpdate: (updatedItems: InventoryItem[], changeDescription: string) => void;
}

export const BulkItemSettingsModal: React.FC<BulkItemSettingsModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedIds,
  locations,
  categories,
  units,
  onApplyBulkUpdate
}) => {
  // Target scope: all items or only checked items
  const [targetScope, setTargetScope] = useState<'all' | 'selected'>(
    selectedIds.length > 0 ? 'selected' : 'all'
  );

  // Field toggles
  const [changeLocation, setChangeLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [locationOverwriteMode, setLocationOverwriteMode] = useState<'all' | 'unassigned_only'>('all');

  const [changeCategory, setChangeCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const [changeUnit, setChangeUnit] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');

  const [changeQtyFisik, setChangeQtyFisik] = useState(false);
  const [qtyFisikMode, setQtyFisikMode] = useState<'reset_zero' | 'match_system' | 'custom_value'>('reset_zero');
  const [customQtyValue, setCustomQtyValue] = useState<number>(0);

  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  // Items that will be affected
  const targetItems = targetScope === 'selected' && selectedIds.length > 0
    ? items.filter(i => selectedIds.includes(i.id))
    : items;

  const targetCount = targetItems.length;

  const hasAnyChangeSelected = changeLocation || changeCategory || changeUnit || changeQtyFisik;

  const handleApply = () => {
    if (!hasAnyChangeSelected || targetCount === 0) return;

    setIsApplying(true);
    const now = new Date().toISOString();
    const finalLocation = customLocation.trim() || selectedLocation;
    const finalCategory = customCategory.trim() || selectedCategory;

    const descriptions: string[] = [];

    const updatedItems = items.map(item => {
      // Check if this item is in target list
      const isTarget = targetScope === 'all' || selectedIds.includes(item.id);
      if (!isTarget) return item;

      let newItem = { ...item };
      let modified = false;

      // 1. Location
      if (changeLocation && finalLocation) {
        if (locationOverwriteMode === 'all' || !newItem.namaTempat) {
          newItem.namaTempat = finalLocation;
          modified = true;
        }
      }

      // 2. Category
      if (changeCategory && finalCategory) {
        newItem.kategori = finalCategory;
        modified = true;
      }

      // 3. Unit
      if (changeUnit && selectedUnit) {
        newItem.satuan = selectedUnit;
        modified = true;
      }

      // 4. Qty Fisik
      if (changeQtyFisik) {
        if (qtyFisikMode === 'reset_zero') {
          newItem.qtyFisik = 0;
          newItem.selisih = 0 - newItem.qtySistem;
          newItem.isCounted = false;
          modified = true;
        } else if (qtyFisikMode === 'match_system') {
          newItem.qtyFisik = newItem.qtySistem;
          newItem.selisih = 0;
          newItem.isCounted = true;
          newItem.lastCountedAt = now;
          modified = true;
        } else if (qtyFisikMode === 'custom_value') {
          newItem.qtyFisik = customQtyValue;
          newItem.selisih = customQtyValue - newItem.qtySistem;
          newItem.isCounted = true;
          newItem.lastCountedAt = now;
          modified = true;
        }
      }

      if (modified) {
        newItem.updatedAt = now;
      }

      return newItem;
    });

    if (changeLocation && finalLocation) descriptions.push(`Lokasi → "${finalLocation}"`);
    if (changeCategory && finalCategory) descriptions.push(`Kategori → "${finalCategory}"`);
    if (changeUnit && selectedUnit) descriptions.push(`Satuan → "${selectedUnit}"`);
    if (changeQtyFisik) {
      if (qtyFisikMode === 'reset_zero') descriptions.push('Qty Fisik → 0 (Kosongkan)');
      else if (qtyFisikMode === 'match_system') descriptions.push('Qty Fisik → Sesuai Qty Sistem');
      else descriptions.push(`Qty Fisik → ${customQtyValue}`);
    }

    onApplyBulkUpdate(updatedItems, descriptions.join(', '));
    setIsApplying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                Pengaturan Masal / Semua Item Sekaligus
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ubah lokasi, kategori, atau reset fisik serentak
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          
          {/* Section 1: Target Scope */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
              1. Terapkan Pengaturan Ke:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                targetScope === 'all' 
                  ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-xs' 
                  : 'bg-white/60 border-slate-200 hover:bg-white'
              }`}>
                <input
                  type="radio"
                  name="scope"
                  checked={targetScope === 'all'}
                  onChange={() => setTargetScope('all')}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Semua Barang Master</span>
                  <span className="text-[11px] text-slate-500 font-mono">Total {items.length} item</span>
                </div>
              </label>

              <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                targetScope === 'selected' 
                  ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-xs' 
                  : selectedIds.length === 0 
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200' 
                    : 'bg-white/60 border-slate-200 hover:bg-white'
              }`}>
                <input
                  type="radio"
                  name="scope"
                  disabled={selectedIds.length === 0}
                  checked={targetScope === 'selected'}
                  onChange={() => setTargetScope('selected')}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Hanya Barang Dicentang</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedIds.length > 0 ? `${selectedIds.length} item terpilih` : 'Belum ada dicentang'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Choose fields to change */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
              2. Pilih Pengaturan yang Ingin Diubah Sekaligus:
            </label>

            {/* Field A: Lokasi / Rak */}
            <div className={`p-4 rounded-2xl border transition-all ${
              changeLocation ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={changeLocation}
                    onChange={(e) => setChangeLocation(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Setel Lokasi / Rak Masal</span>
                </label>
                {changeLocation && <span className="text-[10px] text-indigo-600 font-bold uppercase">Aktif</span>}
              </div>

              {changeLocation && (
                <div className="mt-3 pl-6 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Pilih dari lokasi rak yang ada:</span>
                      <select
                        value={selectedLocation}
                        onChange={(e) => {
                          setSelectedLocation(e.target.value);
                          setCustomLocation('');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="">-- Pilih Lokasi --</option>
                        {locations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Atau ketik lokasi baru:</span>
                      <input
                        type="text"
                        value={customLocation}
                        onChange={(e) => {
                          setCustomLocation(e.target.value);
                          setSelectedLocation('');
                        }}
                        placeholder="Contoh: Rak B-02"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="locOverwrite"
                        checked={locationOverwriteMode === 'all'}
                        onChange={() => setLocationOverwriteMode('all')}
                      />
                      <span>Ubah seluruh barang</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="locOverwrite"
                        checked={locationOverwriteMode === 'unassigned_only'}
                        onChange={() => setLocationOverwriteMode('unassigned_only')}
                      />
                      <span>Hanya barang yang belum punya lokasi</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Field B: Kategori */}
            <div className={`p-4 rounded-2xl border transition-all ${
              changeCategory ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={changeCategory}
                    onChange={(e) => setChangeCategory(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>Setel Kategori Masal</span>
                </label>
                {changeCategory && <span className="text-[10px] text-indigo-600 font-bold uppercase">Aktif</span>}
              </div>

              {changeCategory && (
                <div className="mt-3 pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Pilih kategori yang ada:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setCustomCategory('');
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Atau ketik kategori baru:</span>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => {
                        setCustomCategory(e.target.value);
                        setSelectedCategory('');
                      }}
                      placeholder="Contoh: Sembako"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Field C: Satuan */}
            <div className={`p-4 rounded-2xl border transition-all ${
              changeUnit ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={changeUnit}
                    onChange={(e) => setChangeUnit(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Setel Satuan Masal</span>
                </label>
                {changeUnit && <span className="text-[10px] text-indigo-600 font-bold uppercase">Aktif</span>}
              </div>

              {changeUnit && (
                <div className="mt-3 pl-6">
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full sm:w-1/2 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Pilih Satuan --</option>
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Field D: Qty Fisik Hasil Opname */}
            <div className={`p-4 rounded-2xl border transition-all ${
              changeQtyFisik ? 'bg-rose-50/60 border-rose-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={changeQtyFisik}
                    onChange={(e) => setChangeQtyFisik(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Setel / Reset Qty Fisik Masal</span>
                </label>
                {changeQtyFisik && <span className="text-[10px] text-rose-600 font-bold uppercase">Perhatian</span>}
              </div>

              {changeQtyFisik && (
                <div className="mt-3 pl-6 space-y-2 text-xs">
                  <label className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="qtyFisikMode"
                      checked={qtyFisikMode === 'reset_zero'}
                      onChange={() => setQtyFisikMode('reset_zero')}
                      className="mt-0.5 text-rose-600"
                    />
                    <div>
                      <strong className="text-rose-900">Kosongkan Semua Qty Fisik (Reset ke 0)</strong>
                      <span className="text-[11px] text-slate-500 block">
                        Cocok untuk memulai periode opname baru. Status diubah ke belum dihitung.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="qtyFisikMode"
                      checked={qtyFisikMode === 'match_system'}
                      onChange={() => setQtyFisikMode('match_system')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <strong className="text-emerald-900">Setel Sesuai Stok Sistem (Auto-Match 100%)</strong>
                      <span className="text-[11px] text-slate-500 block">
                        Qty Fisik otomatis disamakan dengan Qty Sistem (selisih menjadi 0).
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="qtyFisikMode"
                      checked={qtyFisikMode === 'custom_value'}
                      onChange={() => setQtyFisikMode('custom_value')}
                      className="mt-0.5 text-slate-900"
                    />
                    <div className="flex-1">
                      <strong className="text-slate-900">Setel ke Nilai Tertentu</strong>
                      {qtyFisikMode === 'custom_value' && (
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={customQtyValue}
                            onChange={(e) => setCustomQtyValue(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-24 px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold"
                          />
                          <span className="text-[11px] text-slate-500">unit untuk setiap barang</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

          </div>

          {/* Notice banner */}
          {hasAnyChangeSelected && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2 text-indigo-900 text-xs">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Pengaturan akan langsung diterapkan ke <strong>{targetCount} barang</strong> dan disinkronkan ke Cloud Firestore secara serentak.
              </span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!hasAnyChangeSelected || targetCount === 0 || isApplying}
            onClick={handleApply}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Terapkan ke {targetCount} Barang</span>
          </button>
        </div>

      </div>
    </div>
  );
};
