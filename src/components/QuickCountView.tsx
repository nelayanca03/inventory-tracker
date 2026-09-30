import React, { useState, useMemo } from 'react';
import { 
  Smartphone, 
  MapPin, 
  Plus, 
  Minus, 
  Check, 
  Camera, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface QuickCountViewProps {
  items: InventoryItem[];
  onUpdateQty: (id: string, newQtyFisik: number) => void;
  onAddNew: () => void;
  onOpenPhotoLightbox: (item: InventoryItem) => void;
}

export const QuickCountView: React.FC<QuickCountViewProps> = ({
  items,
  onUpdateQty,
  onAddNew,
  onOpenPhotoLightbox
}) => {
  // Available locations
  const locations = useMemo(() => {
    return Array.from(new Set(items.map(i => i.namaTempat).filter(Boolean))).sort();
  }, [items]);

  const [activeLocation, setActiveLocation] = useState<string>(locations[0] || 'Gudang A - Rak 01');

  // Items at this active location
  const locationItems = useMemo(() => {
    return items.filter(i => i.namaTempat === activeLocation);
  }, [items, activeLocation]);

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-16">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            Mode Penghitungan Cepat di Rak
          </div>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
            {locationItems.length} item di rak ini
          </span>
        </div>
        
        {/* Location selector */}
        <label className="text-xs text-slate-300 block mb-1">
          Pilih Rak / Tempat yang Sedang Dihitung:
        </label>
        <div className="relative">
          <select
            value={activeLocation}
            onChange={(e) => setActiveLocation(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-400 focus:outline-none"
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items list in this rack */}
      {locationItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs">Tidak ada item yang terdaftar di "{activeLocation}".</p>
          <button
            onClick={onAddNew}
            className="mt-3 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg"
          >
            + Input Barang di Rak Ini
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {locationItems.map(item => {
            const selisih = item.qtyFisik - item.qtySistem;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
              >
                {/* Item header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                      {item.kodeStok}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.namaStok}
                    </h4>
                  </div>
                  
                  {item.gambarUrl ? (
                    <button
                      onClick={() => onOpenPhotoLightbox(item)}
                      className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0"
                    >
                      <img
                        src={item.gambarUrl}
                        alt={item.namaStok}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : null}
                </div>

                {/* Counter Control Section */}
                <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-200">
                  <div className="text-xs">
                    <span className="text-[10px] text-slate-500 block">Sistem:</span>
                    <span className="font-mono font-bold text-slate-700">{item.qtySistem} {item.satuan}</span>
                  </div>

                  {/* Big Touch +/- Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQty(item.id, Math.max(0, item.qtyFisik - 1))}
                      className="w-11 h-11 bg-white border border-slate-300 rounded-xl text-slate-800 flex items-center justify-center font-bold text-xl active:bg-slate-200 shadow-xs"
                      title="Kurang 1"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <div className="w-16 text-center">
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {item.qtyFisik}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.satuan}</div>
                    </div>

                    <button
                      onClick={() => onUpdateQty(item.id, item.qtyFisik + 1)}
                      className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xl active:bg-slate-700 shadow-xs"
                      title="Tambah 1"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className={`font-mono text-xs font-semibold ${
                    selisih === 0
                      ? 'text-emerald-700'
                      : selisih < 0
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}>
                    {selisih === 0 ? '✓ Sesuai (0)' : selisih < 0 ? `Selisih Kurang (${selisih})` : `Selisih Lebih (+${selisih})`}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateQty(item.id, item.qtyFisik + 10)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-mono"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => onUpdateQty(item.id, item.qtySistem)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
                    >
                      Reset = Sistem
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Add Action */}
      <button
        onClick={onAddNew}
        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4 text-slate-600" />
        <span>Tambah Item Baru di Tempat Ini</span>
      </button>

    </div>
  );
};
