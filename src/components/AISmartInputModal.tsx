import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Camera,
  Upload,
  Check,
  AlertCircle,
  X,
  Loader2,
  Package,
  MapPin,
  FileText,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { aiService, SmartParseResult, PhotoIdentifyResult } from '../services/aiService';

interface AISmartInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onApplyParsedItem: (item: InventoryItem, qty: number, location: string, catatan: string) => void;
}

export const AISmartInputModal: React.FC<AISmartInputModalProps> = ({
  isOpen,
  onClose,
  items,
  onApplyParsedItem,
}) => {
  const [activeTab, setActiveTab] = useState<'text-voice' | 'photo-scan'>('text-voice');
  
  // Voice & Text state
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [parseResult, setParseResult] = useState<SmartParseResult | null>(null);

  // Photo Scan state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [photoResult, setPhotoResult] = useState<PhotoIdentifyResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Speech Recognition support
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung Speech Recognition otomatis. Silakan ketik perintah di kotak teks.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleProcessText = async (textToProcess?: string) => {
    const query = textToProcess || inputText;
    if (!query.trim()) return;

    setIsProcessingText(true);
    setParseResult(null);

    const result = await aiService.smartParseInput(query, items);
    setParseResult(result);
    setIsProcessingText(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedPhoto(base64);
      setPhotoResult(null);
      // Auto analyze photo
      triggerPhotoScan(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const triggerPhotoScan = async (base64: string, mimeType: string = 'image/jpeg') => {
    setIsScanningPhoto(true);
    setPhotoResult(null);

    const res = await aiService.identifyItemFromPhoto(base64, items, mimeType);
    setPhotoResult(res);
    setIsScanningPhoto(false);
  };

  // Find actual item from parse result
  const matchedParsedItem = parseResult?.matchedKode
    ? items.find(
        i =>
          i.kodeStok.toLowerCase() === parseResult.matchedKode?.toLowerCase() ||
          i.namaStok.toLowerCase() === parseResult.matchedNama?.toLowerCase()
      )
    : null;

  // Find actual item from photo result
  const matchedPhotoItem = photoResult?.matchedKode
    ? items.find(
        i =>
          i.kodeStok.toLowerCase() === photoResult.matchedKode?.toLowerCase() ||
          i.namaStok.toLowerCase() === photoResult.matchedNama?.toLowerCase()
      )
    : null;

  const handleApplyTextResult = () => {
    if (!matchedParsedItem) return;
    const qty = parseResult?.qtyFisik ?? matchedParsedItem.qtyFisik ?? 0;
    const loc = parseResult?.lokasi || matchedParsedItem.namaTempat || '';
    const cat = parseResult?.catatan || matchedParsedItem.catatan || '';
    onApplyParsedItem(matchedParsedItem, qty, loc, cat);
    onClose();
  };

  const handleApplyPhotoResult = (targetItem: InventoryItem) => {
    onApplyParsedItem(targetItem, targetItem.qtyFisik || 0, targetItem.namaTempat || '', targetItem.catatan || '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                AI Smart Input InvenTrack
                <span className="text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Gemini
                </span>
              </h3>
              <p className="text-xs text-white/80">
                Pencatatan opname otomatis lewat ucapan suara, teks cepat, atau foto barang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('text-voice')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'text-voice'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-4 h-4 text-emerald-600" />
            <span>Suara & Teks Cepat</span>
          </button>
          <button
            onClick={() => setActiveTab('photo-scan')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'photo-scan'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Scan Foto Barang AI</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'text-voice' ? (
            <div className="space-y-4">
              {/* Examples suggestion pills */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Contoh Perintah Suara / Teks:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Catat STO1901 fisik 15 di rak A kardus rapi',
                    'Pot tawon ada 20 pcs di rak belakang',
                    'Standing lollipop jumlah fisik 8 tempat rak C1',
                    'STO1781 fisik 32 selisih aman',
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(example);
                        handleProcessText(example);
                      }}
                      className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-600 text-left transition-colors"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input area with Mic */}
              <div className="relative border-2 border-slate-200 focus-within:border-emerald-500 rounded-2xl overflow-hidden bg-white shadow-2xs transition-colors">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ketik atau gunakan mic: Contoh: 'Catat STO1901 fisik 25 di rak B kardus agak kusam'..."
                  rows={3}
                  className="w-full p-3.5 pr-20 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleProcessText();
                    }
                  }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    title={isListening ? 'Berhenti mendengarkan' : 'Bicara sekarang (Mic)'}
                    className={`p-2 rounded-xl transition-all ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProcessText()}
                    disabled={isProcessingText || !inputText.trim()}
                    className="p-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 rounded-xl transition-colors shadow-2xs"
                  >
                    {isProcessingText ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Parsed Output Card */}
              {parseResult && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Hasil Pemahaman AI:
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Tingkat Keyakinan: {Math.round((parseResult.confidence || 0.8) * 100)}%
                    </span>
                  </div>

                  {matchedParsedItem ? (
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {matchedParsedItem.gambarUrl ? (
                            <img
                              src={matchedParsedItem.gambarUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-900 text-white rounded-md tracking-wider">
                            {matchedParsedItem.kodeStok}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 truncate mt-1">
                            {matchedParsedItem.namaStok}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Stok Sistem: <b className="text-slate-800">{matchedParsedItem.qtySistem}</b>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-emerald-700 block font-semibold">Qty Fisik</span>
                          <span className="text-base font-extrabold text-emerald-900">
                            {parseResult.qtyFisik ?? matchedParsedItem.qtyFisik ?? 0}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                          <span className="text-[10px] text-slate-500 block font-semibold">Lokasi Rak</span>
                          <span className="font-bold text-slate-800 truncate block">
                            {parseResult.lokasi || matchedParsedItem.namaTempat || '-'}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                          <span className="text-[10px] text-slate-500 block font-semibold">Catatan</span>
                          <span className="font-medium text-slate-700 truncate block text-[11px]">
                            {parseResult.catatan || matchedParsedItem.catatan || '-'}
                          </span>
                        </div>
                      </div>

                      {parseResult.penjelasan && (
                        <p className="text-[11px] text-slate-600 italic">
                          "{parseResult.penjelasan}"
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleApplyTextResult}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Terapkan & Lanjutkan Hitung</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        AI tidak menemukan kode atau nama barang yang cocok. Silakan sebutkan kode stok (contoh: STO1901) lebih spesifik.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Photo Scan Tab */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedPhoto ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Ambil Foto Barang atau Upload Gambar
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Arahkan kamera smartphone ke barang di rak atau kardus kemasan, AI Gemini akan mencocokkan barang secara visual dengan katalog.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih / Foto Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                    <img
                      src={selectedPhoto}
                      alt="Preview Foto"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-2 right-2 px-2.5 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold rounded-lg backdrop-blur-xs flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Ganti Foto</span>
                    </button>
                  </div>

                  {isScanningPhoto && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3 text-indigo-900">
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold block">Sedang Menganalisis Foto dengan Gemini Vision...</span>
                        <span className="text-indigo-700">Mencocokkan bentuk, label teks, dan fitur visual ke 377 master barang.</span>
                      </div>
                    </div>
                  )}

                  {photoResult && (
                    <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Hasil Deteksi Visual:
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          Kecocokan: {Math.round((photoResult.confidence || 0.8) * 100)}%
                        </span>
                      </div>

                      {matchedPhotoItem ? (
                        <div className="bg-white p-3.5 rounded-xl border border-indigo-200/80 shadow-2xs space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {matchedPhotoItem.gambarUrl ? (
                                <img
                                  src={matchedPhotoItem.gambarUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-indigo-600 text-white rounded-md tracking-wider">
                                {matchedPhotoItem.kodeStok}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 truncate mt-1">
                                {matchedPhotoItem.namaStok}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Lokasi: {matchedPhotoItem.namaTempat || '-'} • Sistem: {matchedPhotoItem.qtySistem}
                              </p>
                            </div>
                          </div>

                          {photoResult.alasan && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                              💡 <b>Analisis AI:</b> {photoResult.alasan}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => handleApplyPhotoResult(matchedPhotoItem)}
                            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Pilih Barang Ini untuk Input Opname</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                          {photoResult.alasan || 'Tidak menemukan barang yang identik.'}
                        </div>
                      )}

                      {/* Alternatives if any */}
                      {photoResult.alternatif && photoResult.alternatif.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Kemungkinan Lain:
                          </span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {photoResult.alternatif.map((alt, i) => {
                              const altItem = items.find(it => it.kodeStok === alt.kodeStok);
                              if (!altItem) return null;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleApplyPhotoResult(altItem)}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-left text-xs transition-colors"
                                >
                                  <span className="truncate pr-2">
                                    <b>{alt.kodeStok}</b> - {alt.namaStok}
                                  </span>
                                  <span className="text-[10px] text-indigo-600 font-bold shrink-0">
                                    {Math.round(alt.confidence * 100)}%
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500 flex items-center justify-between">
          <span>InvenTrack AI didukung Google Gemini 3.8 Flash</span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
