import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Crop, 
  Upload, 
  Check, 
  AlertTriangle, 
  Image as ImageIcon, 
  Layers, 
  Trash2, 
  Search, 
  Sliders, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  ClipboardPaste,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  FolderUp
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { CATALOG_PAGES, CatalogPageDefinition } from '../data/catalogPagesMap';
import { compressImageSource } from '../services/storageService';

interface CatalogBatchPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onUpdateItem: (item: InventoryItem) => Promise<void> | void;
  onBatchUpdateItems?: (items: InventoryItem[]) => Promise<void> | void;
}

type TabType = 'cropper' | 'batchUpload' | 'statusList';

interface CroppedItemResult {
  slot: number;
  kodeStok: string;
  namaStok: string;
  matchedItem: InventoryItem | null;
  dataUrl: string;
  fileSizeBytes: number;
}

interface BatchUploadMatch {
  file: File;
  previewUrl: string;
  matchedItem: InventoryItem | null;
  matchType: 'code' | 'name' | 'manual' | 'none';
  status: 'pending' | 'saving' | 'saved' | 'error';
}

export const CatalogBatchPhotoModal: React.FC<CatalogBatchPhotoModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateItem,
  onBatchUpdateItems
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('cropper');
  
  // ==========================================
  // TAB 1: 3x3 CATALOG PAGE CROPPER
  // ==========================================
  const [selectedPageNum, setSelectedPageNum] = useState<number>(2);
  const [pageImageSource, setPageImageSource] = useState<string | null>(null);
  const [pageImageName, setPageImageName] = useState<string>('');
  const [isProcessingCrop, setIsProcessingCrop] = useState<boolean>(false);
  const [croppedResults, setCroppedResults] = useState<CroppedItemResult[]>([]);
  const [cropSuccessMsg, setCropSuccessMsg] = useState<string | null>(null);
  const [cropErrorMsg, setCropErrorMsg] = useState<string | null>(null);

  // Crop geometry tuners (in percentages of image size)
  // Standard catalog: 3 cols x 3 rows with Lius Garden header at top
  const [cropStartYPercent, setCropStartYPercent] = useState<number>(15.5); // Top boundary of grid
  const [cropGridHeightPercent, setCropGridHeightPercent] = useState<number>(78.5); // Total grid height
  const [cropStartXPercent, setCropStartXPercent] = useState<number>(5.0); // Left boundary
  const [cropGridWidthPercent, setCropGridWidthPercent] = useState<number>(90.0); // Total grid width
  const [photoHeightInCellPercent, setPhotoHeightInCellPercent] = useState<number>(64.0); // Photo portion in cell
  const [showAdvancedTuner, setShowAdvancedTuner] = useState<boolean>(false);

  const fileInputPageRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Current page definition
  const currentPageDef: CatalogPageDefinition | undefined = useMemo(() => {
    return CATALOG_PAGES.find(p => p.pageNumber === selectedPageNum);
  }, [selectedPageNum]);

  // Lookup map by kodeStok
  const itemsByKode = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    items.forEach(it => {
      if (it.kodeStok) {
        map.set(it.kodeStok.trim().toUpperCase(), it);
      }
    });
    return map;
  }, [items]);

  // Handle global paste for the cropper (press Ctrl+V to paste screenshot of page!)
  useEffect(() => {
    if (!isOpen || activeTab !== 'cropper') return;

    const handlePaste = (e: ClipboardEvent) => {
      const itemsList = e.clipboardData?.items;
      if (!itemsList) return;

      for (let i = 0; i < itemsList.length; i++) {
        if (itemsList[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = itemsList[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const res = ev.target?.result as string;
              if (res) {
                setPageImageSource(res);
                setPageImageName(`Screenshot_Paste_${new Date().toLocaleTimeString()}`);
                setCropSuccessMsg('Gambar halaman berhasil dipaste dari clipboard! Memproses potongan...');
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, activeTab]);

  // Perform 3x3 automatic crop when image or parameters change
  useEffect(() => {
    if (!pageImageSource || !currentPageDef) {
      setCroppedResults([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      sliceCatalogPage(img, currentPageDef);
    };
    img.src = pageImageSource;
  }, [
    pageImageSource, 
    selectedPageNum, 
    cropStartYPercent, 
    cropGridHeightPercent, 
    cropStartXPercent, 
    cropGridWidthPercent, 
    photoHeightInCellPercent,
    currentPageDef,
    itemsByKode
  ]);

  const sliceCatalogPage = (img: HTMLImageElement, pageDef: CatalogPageDefinition) => {
    try {
      const imgW = img.naturalWidth || img.width;
      const imgH = img.naturalHeight || img.height;

      const gridX = (cropStartXPercent / 100) * imgW;
      const gridY = (cropStartYPercent / 100) * imgH;
      const gridW = (cropGridWidthPercent / 100) * imgW;
      const gridH = (cropGridHeightPercent / 100) * imgH;

      const colW = gridW / 3;
      const rowH = gridH / 3;

      const results: CroppedItemResult[] = [];

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const slot = row * 3 + col;
          const pageItem = pageDef.items.find(i => i.slot === slot);
          if (!pageItem) continue;

          // Inside cell:
          // cell bounds:
          const cellX = gridX + col * colW;
          const cellY = gridY + row * rowH;

          // Padding inside cell
          const padX = colW * 0.04;
          const padTop = rowH * 0.02;

          const photoX = cellX + padX;
          const photoY = cellY + padTop;
          const photoW = colW - (padX * 2);
          const photoH = (rowH * (photoHeightInCellPercent / 100)) - padTop;

          // Draw on temporary canvas
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(photoW));
          canvas.height = Math.max(1, Math.round(photoH));
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(
              img,
              Math.max(0, photoX),
              Math.max(0, photoY),
              photoW,
              photoH,
              0,
              0,
              canvas.width,
              canvas.height
            );

            // Compress to webp / jpeg
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            const approxBytes = Math.round((dataUrl.length * 3) / 4);

            const matched = itemsByKode.get(pageItem.kodeStok.toUpperCase()) || null;

            results.push({
              slot,
              kodeStok: pageItem.kodeStok,
              namaStok: pageItem.namaStok,
              matchedItem: matched,
              dataUrl,
              fileSizeBytes: approxBytes
            });
          }
        }
      }

      setCroppedResults(results);
    } catch (err) {
      console.error('Error slicing page:', err);
      setCropErrorMsg('Gagal memproses potongan gambar. Silakan coba kembali.');
    }
  };

  const handleSaveCroppedResults = async () => {
    if (croppedResults.length === 0) return;

    setIsProcessingCrop(true);
    setCropSuccessMsg(null);
    setCropErrorMsg(null);

    try {
      let savedCount = 0;
      const updatedList: InventoryItem[] = [];

      for (const res of croppedResults) {
        if (res.matchedItem && res.dataUrl) {
          // Compress cleanly to avoid Firebase quota excess
          const optimizedPhoto = await compressImageSource(res.dataUrl, 800, 800, 0.78);
          const updatedItem: InventoryItem = {
            ...res.matchedItem,
            gambarUrl: optimizedPhoto,
            updatedAt: new Date().toISOString()
          };

          await onUpdateItem(updatedItem);
          updatedList.push(updatedItem);
          savedCount++;
        }
      }

      setCropSuccessMsg(`Berhasil memasang ${savedCount} foto untuk Halaman ${selectedPageNum} ke database!`);

      // Auto advance to next page if available
      if (selectedPageNum < 42) {
        setTimeout(() => {
          setSelectedPageNum(prev => prev + 1);
          setPageImageSource(null);
          setPageImageName('');
          setCroppedResults([]);
          setCropSuccessMsg(`Siap untuk Halaman ${selectedPageNum + 1}. Silakan upload atau paste foto Halaman ${selectedPageNum + 1}!`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving cropped items:', err);
      setCropErrorMsg('Terjadi kesalahan saat menyimpan foto ke database. Silakan coba lagi.');
    } finally {
      setIsProcessingCrop(false);
    }
  };

  // ==========================================
  // TAB 2: MULTI-FILE JPG BATCH MATCHER
  // ==========================================
  const [batchMatches, setBatchMatches] = useState<BatchUploadMatch[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const handleBatchFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessingBatch(true);
    setBatchSuccessMsg(null);

    const newMatches: BatchUploadMatch[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      // Extract raw name without extension
      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, '').trim();

      // 1. Try matching by Stock Code (e.g. STO1901)
      let matched: InventoryItem | null = null;
      let matchType: 'code' | 'name' | 'none' = 'none';

      // Look for STO or STA pattern in filename
      const codeRegex = /(STO\d{3,5}|STA\d{3,5}|UNF\d{3,5})/i;
      const codeMatch = filenameWithoutExt.match(codeRegex);

      if (codeMatch) {
        const foundCode = codeMatch[1].toUpperCase();
        matched = itemsByKode.get(foundCode) || null;
        if (matched) matchType = 'code';
      }

      // 2. If not matched, try matching by Product Name
      if (!matched) {
        const cleanFileName = filenameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, ' ');
        const found = items.find(it => {
          const cleanItemName = it.namaStok.toLowerCase().replace(/[^a-z0-9]/g, ' ');
          return cleanItemName.includes(cleanFileName) || cleanFileName.includes(cleanItemName);
        });

        if (found) {
          matched = found;
          matchType = 'name';
        }
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      newMatches.push({
        file,
        previewUrl,
        matchedItem: matched,
        matchType,
        status: 'pending'
      });
    }

    setBatchMatches(prev => [...prev, ...newMatches]);
    setIsProcessingBatch(false);
  };

  const handleApplyAllBatch = async () => {
    const validMatches = batchMatches.filter(m => m.matchedItem !== null && m.status !== 'saved');
    if (validMatches.length === 0) return;

    setIsProcessingBatch(true);
    let count = 0;

    for (let i = 0; i < batchMatches.length; i++) {
      const match = batchMatches[i];
      if (!match.matchedItem || match.status === 'saved') continue;

      try {
        const compressed = await compressImageSource(match.file, 800, 800, 0.78);
        const updatedItem: InventoryItem = {
          ...match.matchedItem,
          gambarUrl: compressed,
          updatedAt: new Date().toISOString()
        };

        await onUpdateItem(updatedItem);
        count++;

        setBatchMatches(prev => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: 'saved' };
          return copy;
        });
      } catch (err) {
        console.error('Failed to save batch item:', match.file.name, err);
        setBatchMatches(prev => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: 'error' };
          return copy;
        });
      }
    }

    setIsProcessingBatch(false);
    setBatchSuccessMsg(`Selesai! ${count} foto berhasil dipasang dan disimpan ke database.`);
  };

  // ==========================================
  // TAB 3: STATUS KELENGKAPAN FOTO
  // ==========================================
  const [statusFilterOnlyMissing, setStatusFilterOnlyMissing] = useState<boolean>(true);
  const [statusSearchQuery, setStatusSearchQuery] = useState<string>('');

  const itemsWithPhotoCount = useMemo(() => {
    return items.filter(it => it.gambarUrl && it.gambarUrl.trim().length > 0).length;
  }, [items]);

  const filteredStatusItems = useMemo(() => {
    return items.filter(it => {
      const hasPhoto = Boolean(it.gambarUrl && it.gambarUrl.trim().length > 0);
      if (statusFilterOnlyMissing && hasPhoto) return false;

      if (!statusSearchQuery) return true;
      const q = statusSearchQuery.toLowerCase();
      return it.namaStok.toLowerCase().includes(q) || it.kodeStok.toLowerCase().includes(q);
    });
  }, [items, statusFilterOnlyMissing, statusSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Auto-Potong & Upload Foto Katalog Lius Garden
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Katalog 42 Halaman
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Potong presisi foto per halaman atau upload file JPG sekaligus langsung ke 377 master barang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('cropper')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'cropper'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Crop className="w-4 h-4" />
            <span>Potong Lembar Katalog (Grid 3x3 Otomatis)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batchUpload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'batchUpload'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>Upload File JPG Sekaligus (Batch Matcher)</span>
            {batchMatches.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px]">
                {batchMatches.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('statusList')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ml-auto ${
              activeTab === 'statusList'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Status Foto ({itemsWithPhotoCount}/{items.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* ==================================================== */}
          {/* TAB 1: 3x3 GRID AUTO CROPPER                         */}
          {/* ==================================================== */}
          {activeTab === 'cropper' && (
            <div className="space-y-4">
              
              {/* Top Controls: Page Selector & File/Paste Trigger */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Pilih Halaman Katalog:</span>
                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      disabled={selectedPageNum <= 2}
                      onClick={() => {
                        setSelectedPageNum(prev => Math.max(2, prev - 1));
                        setCropSuccessMsg(null);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <select
                      value={selectedPageNum}
                      onChange={(e) => {
                        setSelectedPageNum(Number(e.target.value));
                        setCropSuccessMsg(null);
                      }}
                      className="text-xs font-bold bg-transparent border-none text-slate-900 focus:outline-hidden px-2 py-0.5"
                    >
                      {CATALOG_PAGES.map(p => (
                        <option key={p.pageNumber} value={p.pageNumber}>
                          Halaman {p.pageNumber} ({p.items[0]?.kodeStok} - {p.items[p.items.length - 1]?.kodeStok})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={selectedPageNum >= 42}
                      onClick={() => {
                        setSelectedPageNum(prev => Math.min(42, prev + 1));
                        setCropSuccessMsg(null);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Upload or Paste Buttons */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputPageRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setPageImageSource(ev.target?.result as string);
                          setPageImageName(file.name);
                        };
                        reader.readAsDataURL(file);
                      }
                      if (e.target) e.target.value = '';
                    }}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputPageRef.current?.click()}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Upload Foto Halaman {selectedPageNum}</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-900 rounded-xl text-[11px] font-medium border border-amber-200">
                    <ClipboardPaste className="w-3.5 h-3.5 text-amber-600" />
                    <span>Atau tekan <kbd className="px-1 py-0.5 bg-amber-200 font-mono font-bold rounded">Ctrl + V</kbd> untuk paste</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedTuner(!showAdvancedTuner)}
                    className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors"
                    title="Atur Kalibrasi Kotak Potong"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Advanced Crop Tuner Sliders (Collapsible) */}
              {showAdvancedTuner && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> Kalibrasi Presisi Kotak Potong (3x3 Grid Lius Garden)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCropStartYPercent(15.5);
                        setCropGridHeightPercent(78.5);
                        setCropStartXPercent(5.0);
                        setCropGridWidthPercent(90.0);
                        setPhotoHeightInCellPercent(64.0);
                      }}
                      className="text-[10px] font-bold text-amber-700 underline"
                    >
                      Reset Default
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-600">Posisi Y Atas: {cropStartYPercent}%</label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        step="0.5"
                        value={cropStartYPercent}
                        onChange={(e) => setCropStartYPercent(Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600">Tinggi Grid Total: {cropGridHeightPercent}%</label>
                      <input
                        type="range"
                        min="60"
                        max="90"
                        step="0.5"
                        value={cropGridHeightPercent}
                        onChange={(e) => setCropGridHeightPercent(Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600">Lebar Grid Total: {cropGridWidthPercent}%</label>
                      <input
                        type="range"
                        min="70"
                        max="98"
                        step="0.5"
                        value={cropGridWidthPercent}
                        onChange={(e) => setCropGridWidthPercent(Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600">Tinggi Foto per Kotak: {photoHeightInCellPercent}%</label>
                      <input
                        type="range"
                        min="40"
                        max="85"
                        step="1"
                        value={photoHeightInCellPercent}
                        onChange={(e) => setPhotoHeightInCellPercent(Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Notice Alerts */}
              {cropSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{cropSuccessMsg}</span>
                </div>
              )}
              {cropErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cropErrorMsg}</span>
                </div>
              )}

              {/* Content Area: If no image uploaded yet */}
              {!pageImageSource ? (
                <div 
                  onClick={() => fileInputPageRef.current?.click()}
                  className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-8 sm:p-12 text-center bg-amber-50/20 hover:bg-amber-50/40 transition-colors cursor-pointer space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <Crop className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Upload atau Paste Gambar Halaman {selectedPageNum}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Ambil screenshot atau foto halaman {selectedPageNum} dari katalog PDF Lius Garden, lalu klik disini untuk upload atau langsung tekan <kbd className="px-1.5 py-0.5 bg-slate-200 font-mono font-bold rounded">Ctrl + V</kbd>.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs">
                      <Upload className="w-4 h-4" /> Pilih File Gambar Halaman {selectedPageNum}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sistem akan memotong otomatis 9 kotak barang pada halaman ini dan mencocokkan ke database.
                  </div>
                </div>
              ) : (
                /* When Image is loaded: Show the 9 cropped items ready to save! */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Hasil Potong 9 Barang Halaman {selectedPageNum}</span>
                        <span className="text-[11px] font-normal text-slate-500 font-mono">({pageImageName})</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Periksa potongan foto di bawah ini, lalu klik tombol simpan untuk memasangnya ke database master.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPageImageSource(null);
                          setCroppedResults([]);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl"
                      >
                        Ganti Gambar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingCrop || croppedResults.length === 0}
                        onClick={handleSaveCroppedResults}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                      >
                        {isProcessingCrop ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyimpan ke Cloud...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Simpan & Pasang 9 Foto Ini ke Database</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3x3 Preview Grid of Cropped Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {croppedResults.map((crop) => (
                      <div 
                        key={crop.slot} 
                        className="border border-slate-200 rounded-xl p-3 bg-white hover:border-amber-400 transition-colors shadow-2xs flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="relative aspect-4/3 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                            <img
                              src={crop.dataUrl}
                              alt={crop.namaStok}
                              className="w-full h-full object-contain p-1"
                            />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-bold">
                              Slot {crop.slot + 1}
                            </span>
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/90 text-slate-700 rounded text-[9px] font-mono">
                              {(crop.fileSizeBytes / 1024).toFixed(0)} KB
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-amber-700 font-mono bg-amber-50 px-1.5 py-0.5 rounded">
                              {crop.kodeStok}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2" title={crop.namaStok}>
                              {crop.namaStok}
                            </h5>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {crop.matchedItem ? (
                            <span className="text-emerald-700 flex items-center gap-1 font-semibold text-[10px]">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Cocok di Master</span>
                            </span>
                          ) : (
                            <span className="text-rose-600 text-[10px]">
                              Belum ada di DB
                            </span>
                          )}

                          {crop.matchedItem?.gambarUrl && (
                            <span className="text-[10px] text-slate-400">
                              (Sudah ada foto)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: MULTI-FILE JPG BATCH MATCHER                  */}
          {/* ==================================================== */}
          {activeTab === 'batchUpload' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Upload Banyak File Foto JPG Sekaligus
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pilih puluhan atau ratusan file foto dari komputer. Sistem akan otomatis mencocokkannya berdasarkan Kode Stok (misal: STO1901.jpg) atau Nama Barang.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={batchFileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleBatchFilesSelected(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => batchFileInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih Foto dari Komputer</span>
                  </button>

                  {batchMatches.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBatchMatches([])}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                      title="Bersihkan Daftar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {batchSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{batchSuccessMsg}</span>
                </div>
              )}

              {batchMatches.length === 0 ? (
                <div 
                  onClick={() => batchFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-8 sm:p-12 text-center bg-slate-50/50 hover:bg-amber-50/20 transition-colors cursor-pointer space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FolderUp className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      Drop Folder atau Kumpulan File Foto JPG Disini
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Tips penamaan file: Beri nama file sesuai Kode Stok (contoh: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">STO1901.jpg</code>) agar sistem dapat mencocokkan 100% akurat secara instan.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-600">
                      Total <b>{batchMatches.length}</b> file dimuat •{' '}
                      <span className="text-emerald-700 font-bold">
                        {batchMatches.filter(m => m.matchedItem).length} Cocok
                      </span>{' '}
                      •{' '}
                      <span className="text-rose-600 font-bold">
                        {batchMatches.filter(m => !m.matchedItem).length} Tidak Cocok
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingBatch || batchMatches.filter(m => m.matchedItem && m.status !== 'saved').length === 0}
                      onClick={handleApplyAllBatch}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      {isProcessingBatch ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan ke Cloud...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Terapkan Semua Foto Cocok ke Database ({batchMatches.filter(m => m.matchedItem && m.status !== 'saved').length})</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {batchMatches.map((match, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={match.previewUrl}
                            alt={match.file.name}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0">
                            <span className="font-mono text-[11px] font-bold text-slate-800 truncate block">
                              {match.file.name}
                            </span>
                            {match.matchedItem ? (
                              <div className="text-emerald-700 flex items-center gap-1.5 mt-0.5">
                                <span className="font-bold font-mono text-[10px] bg-emerald-100 px-1 rounded">
                                  {match.matchedItem.kodeStok}
                                </span>
                                <span className="truncate">{match.matchedItem.namaStok}</span>
                              </div>
                            ) : (
                              <span className="text-rose-500 text-[10px]">
                                Tidak dapat menemukan barang dengan nama/kode ini
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {match.status === 'saved' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Tersimpan
                            </span>
                          ) : match.status === 'error' ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                              Error
                            </span>
                          ) : match.matchedItem ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                              Siap Pasang
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: STATUS KELENGKAPAN FOTO                       */}
          {/* ==================================================== */}
          {activeTab === 'statusList' && (
            <div className="space-y-4">
              
              {/* Progress Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Kelengkapan Foto Master Barang:</span>
                  <span className="font-mono font-bold text-amber-800">
                    {itemsWithPhotoCount} dari {items.length} Barang ({((itemsWithPhotoCount / Math.max(1, items.length)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${(itemsWithPhotoCount / Math.max(1, items.length)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={statusSearchQuery}
                    onChange={(e) => setStatusSearchQuery(e.target.value)}
                    placeholder="Cari kode stok atau nama barang..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilterOnlyMissing}
                    onChange={(e) => setStatusFilterOnlyMissing(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Hanya tampilkan yang belum memiliki foto ({items.length - itemsWithPhotoCount})</span>
                </label>
              </div>

              {/* Items List */}
              <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {filteredStatusItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Tidak ada barang yang sesuai dengan kriteria filter.
                  </div>
                ) : (
                  filteredStatusItems.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.gambarUrl ? (
                          <img
                            src={item.gambarUrl}
                            alt={item.namaStok}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            {item.kodeStok}
                          </span>
                          <h6 className="font-bold text-slate-900 truncate mt-0.5">{item.namaStok}</h6>
                          <span className="text-[10px] text-slate-400">{item.kategori} • {item.namaTempat}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {item.gambarUrl ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ada Foto
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                            Belum Ada Foto
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Semua foto yang disimpan otomatis dikompresi agar hemat kuota Firebase Storage.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
