import React from 'react';
import { X, MapPin, Barcode, Calendar, User, Download } from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface PhotoLightboxProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ item, onClose }) => {
  if (!item || !item.gambarUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative max-w-3xl w-full bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-300">
              {item.kodeStok}
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-medium text-slate-200 truncate max-w-xs">
              {item.namaStok}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={item.gambarUrl}
              download={`${item.kodeStok}_foto.jpg`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Download gambar"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image viewport */}
        <div className="flex-1 bg-black/60 flex items-center justify-center p-4 min-h-[300px] overflow-hidden">
          <img
            src={item.gambarUrl}
            alt={item.namaStok}
            referrerPolicy="no-referrer"
            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Caption footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.namaTempat}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span>Qty Fisik: <strong className="text-white">{item.qtyFisik} {item.satuan}</strong></span>
              <span className={`ml-2 font-bold ${
                item.selisih === 0
                  ? 'text-emerald-400'
                  : item.selisih < 0
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}>
                ({item.selisih === 0 ? 'Match' : item.selisih > 0 ? `+${item.selisih}` : item.selisih})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Petugas: {item.petugas}</span>
            <span>·</span>
            <span>Kondisi: {item.kondisi}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
