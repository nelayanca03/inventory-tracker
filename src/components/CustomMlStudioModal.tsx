import React, { useState, useEffect, useMemo } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Zap,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  RefreshCw,
  Search,
  Download,
  Upload,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Tag,
  Hash,
  MapPin,
  FileText,
  Sliders,
  Check,
  Wand2,
  Rocket,
  Layers,
  ChevronRight,
  Play,
  Cpu,
  Package,
  Bot,
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import {
  customMlEngine,
  MlPredictionResult,
  MlTrainingSample,
  MlModelStats,
  IndustryTrainingPreset,
  ItemTrainingVariation,
} from '../services/customMlEngine';

interface CustomMlStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  availableLocations?: string[];
  initialTab?: 'assistant' | 'test' | 'train' | 'dataset' | 'aliases';
  onApplyPrediction?: (prediction: {
    matchedItem: InventoryItem;
    qtyFisik: number | null;
    lokasi: string | null;
    catatan: string | null;
  }) => void;
}

export const CustomMlStudioModal: React.FC<CustomMlStudioModalProps> = ({
  isOpen,
  onClose,
  items,
  availableLocations = [],
  initialTab = 'assistant',
  onApplyPrediction,
}) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'test' | 'train' | 'dataset' | 'aliases'>(initialTab);

  // Testing sandbox state
  const [testInput, setTestInput] = useState<string>('lampu sorot 50w b3 20');
  const [prediction, setPrediction] = useState<MlPredictionResult | null>(null);

  // Train new pattern state
  const [trainPhrase, setTrainPhrase] = useState<string>('');
  const [selectedItemCode, setSelectedItemCode] = useState<string>('');
  const [trainQty, setTrainQty] = useState<string>('');
  const [trainLocation, setTrainLocation] = useState<string>('');
  const [trainNotes, setTrainNotes] = useState<string>('');
  const [trainSuccessMsg, setTrainSuccessMsg] = useState<string | null>(null);

  // Alias state
  const [newAliasKey, setNewAliasKey] = useState<string>('');
  const [newAliasValue, setNewAliasValue] = useState<string>('');

  // Stats & samples
  const [stats, setStats] = useState<MlModelStats>(customMlEngine.getStats());
  const [samples, setSamples] = useState<MlTrainingSample[]>(customMlEngine.getSamples());
  const [aliases, setAliases] = useState<Record<string, string>>(customMlEngine.getAliases());
  const [autoLearnEnabled, setAutoLearnEnabled] = useState<boolean>(customMlEngine.isAutoLearnEnabled());
  const [datasetSearch, setDatasetSearch] = useState<string>('');
  const [jsonNotice, setJsonNotice] = useState<string | null>(null);

  // Assistant / Auto-trainer states
  const [isBatchTraining, setIsBatchTraining] = useState<boolean>(false);
  const [batchTrainSuccess, setBatchTrainSuccess] = useState<{ total: number; count: number } | null>(null);
  const [assistantSelectedItemCode, setAssistantSelectedItemCode] = useState<string>('');
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);

  const presets = useMemo(() => customMlEngine.getIndustryPresets(), []);

  // Refresh stats
  const refreshEngineState = () => {
    setStats(customMlEngine.getStats());
    setSamples(customMlEngine.getSamples());
    setAliases(customMlEngine.getAliases());
    setAutoLearnEnabled(customMlEngine.isAutoLearnEnabled());
  };

  // Run prediction whenever testInput or items change
  useEffect(() => {
    if (isOpen && testInput.trim()) {
      const res = customMlEngine.predict(testInput, items, availableLocations);
      setPrediction(res);
    } else {
      setPrediction(null);
    }
  }, [testInput, isOpen, items, availableLocations, samples]);

  useEffect(() => {
    if (isOpen) {
      refreshEngineState();
      setActiveTab(initialTab);
      if (!selectedItemCode && items.length > 0) {
        setSelectedItemCode(items[0].kodeStok);
      }
      if (!assistantSelectedItemCode && items.length > 0) {
        setAssistantSelectedItemCode(items[0].kodeStok);
      }
    }
  }, [isOpen, items, initialTab]);

  if (!isOpen) return null;

  // Selected item for interactive assistant
  const assistantSelectedItem = items.find(i => i.kodeStok === assistantSelectedItemCode) || items[0];

  // Generated variations for selected item
  const currentVariations: ItemTrainingVariation[] = assistantSelectedItem
    ? customMlEngine.generateItemTrainingVariations(assistantSelectedItem, availableLocations)
    : [];

  // Handle 1-Click Batch Auto-Train All Items
  const handleBatchTrainAll = () => {
    setIsBatchTraining(true);
    setTimeout(() => {
      const res = customMlEngine.batchTrainAllItems(items, availableLocations);
      refreshEngineState();
      setIsBatchTraining(false);
      setBatchTrainSuccess({ total: res.totalGenerated, count: res.itemsTrained });
      setJsonNotice(`🎉 Berhasil melatih model! ${res.totalGenerated} variasi data latih baru telah dipelajari untuk seluruh ${res.itemsTrained} barang.`);
      setTimeout(() => setJsonNotice(null), 5000);
    }, 500);
  };

  // Handle Load Industry Preset
  const handleLoadPreset = (presetId: string) => {
    const res = customMlEngine.loadIndustryPreset(presetId, items);
    refreshEngineState();
    if (res.success) {
      setLoadedPresetId(presetId);
      setJsonNotice(res.message);
      setTimeout(() => {
        setJsonNotice(null);
      }, 4000);
    }
  };

  // Handle Train Single Variation from Assistant
  const handleTrainSingleVariation = (v: ItemTrainingVariation, targetItem: InventoryItem) => {
    customMlEngine.trainModel({
      inputPhrase: v.phrase,
      targetKodeStok: targetItem.kodeStok,
      targetNamaStok: targetItem.namaStok,
      targetQty: v.suggestedQty,
      targetLokasi: v.suggestedLokasi,
      targetCatatan: v.suggestedNotes,
      source: 'manual_training',
    });
    refreshEngineState();
    setJsonNotice(`✓ Pola "${v.phrase}" berhasil dilatihkan ke model.`);
    setTimeout(() => setJsonNotice(null), 3000);
  };

  // Handle Train All 4 Variations for Selected Item
  const handleTrainAllVariationsForItem = (targetItem: InventoryItem, variations: ItemTrainingVariation[]) => {
    for (const v of variations) {
      customMlEngine.trainModel({
        inputPhrase: v.phrase,
        targetKodeStok: targetItem.kodeStok,
        targetNamaStok: targetItem.namaStok,
        targetQty: v.suggestedQty,
        targetLokasi: v.suggestedLokasi,
        targetCatatan: v.suggestedNotes,
        source: 'manual_training',
      });
    }
    refreshEngineState();
    setJsonNotice(`✨ 4 variasi pola untuk "${targetItem.namaStok}" berhasil dilatihkan ke model!`);
    setTimeout(() => setJsonNotice(null), 3500);
  };

  // Handle Training form submit
  const handleTrainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainPhrase.trim() || !selectedItemCode) return;

    const matchedItem = items.find(i => i.kodeStok === selectedItemCode);
    if (!matchedItem) return;

    customMlEngine.trainModel({
      inputPhrase: trainPhrase.trim(),
      targetKodeStok: matchedItem.kodeStok,
      targetNamaStok: matchedItem.namaStok,
      targetQty: trainQty ? Number(trainQty) : null,
      targetLokasi: trainLocation.trim() || null,
      targetCatatan: trainNotes.trim() || null,
      source: 'manual_training',
    });

    refreshEngineState();
    setTrainSuccessMsg(`✓ Mesin berhasil dilatih mengenali frasa: "${trainPhrase}"`);
    setTrainPhrase('');
    setTrainQty('');
    setTrainNotes('');

    setTimeout(() => {
      setTrainSuccessMsg(null);
    }, 4000);
  };

  // Handle Add Alias
  const handleAddAlias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasKey.trim() || !newAliasValue.trim()) return;

    customMlEngine.addAlias(newAliasKey.trim(), newAliasValue.trim());
    refreshEngineState();
    setNewAliasKey('');
    setNewAliasValue('');
  };

  // Handle Delete Sample
  const handleDeleteSample = (id: string) => {
    customMlEngine.deleteSample(id);
    refreshEngineState();
  };

  // Handle Toggle Auto Learn
  const handleToggleAutoLearn = () => {
    const nextVal = !autoLearnEnabled;
    customMlEngine.setAutoLearnEnabled(nextVal);
    setAutoLearnEnabled(nextVal);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = customMlEngine.exportDatasetJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventrack_ml_model_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setJsonNotice('File model ML (.json) berhasil diunduh!');
    setTimeout(() => setJsonNotice(null), 3000);
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const res = customMlEngine.importDatasetJson(content);
      if (res.success) {
        refreshEngineState();
        setJsonNotice(`Berhasil mengimpor ${res.count} data latih model!`);
      } else {
        setJsonNotice(`Gagal impor: ${res.error}`);
      }
      setTimeout(() => setJsonNotice(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('Yakin ingin mereset model ML ke bawaan awal? Data latih manual akan dihapus.')) {
      customMlEngine.resetSamplesToDefault();
      refreshEngineState();
      setJsonNotice('Model ML berhasil direset ke setelan awal.');
      setTimeout(() => setJsonNotice(null), 3000);
    }
  };

  const filteredSamples = samples.filter(s => {
    const q = datasetSearch.toLowerCase();
    return (
      s.inputPhrase.toLowerCase().includes(q) ||
      s.targetKodeStok.toLowerCase().includes(q) ||
      s.targetNamaStok.toLowerCase().includes(q) ||
      (s.targetLokasi && s.targetLokasi.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[94vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <BrainCircuit className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Studio Machine Learning Mandiri</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  Lokal & Real-time
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Model pembelajaran adaptif untuk mengenali singkatan, suara, dan gaya ketik gudang secara otomatis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Stats & Info Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Total Data Latih: <strong className="text-slate-900 font-bold">{stats.totalSamples}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Akurasi & Latensi: <strong className="text-slate-900 font-bold">&lt; 3 ms</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-Learned: <strong className="text-emerald-700 font-bold">{stats.autoLearnedSamples}</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoLearnEnabled}
                onChange={handleToggleAutoLearn}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">Auto-Learn dari Riwayat Opname</span>
            </label>
          </div>
        </div>

        {/* Notice Message */}
        {jsonNotice && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{jsonNotice}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-1 bg-white overflow-x-auto">
          {/* TAB 0: ASSISTANT (BANTU TRAINING) */}
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'assistant'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>1. Asisten Bantu Training</span>
            <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-linear-to-r from-amber-500 to-indigo-600 text-white rounded-md shadow-2xs">
              Cepat
            </span>
          </button>

          {/* TAB 1: TEST / SANDBOX */}
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'test'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>2. Uji Coba Input (Sandbox)</span>
          </button>

          {/* TAB 2: TRAIN MANUAL */}
          <button
            type="button"
            onClick={() => setActiveTab('train')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'train'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>3. Ajari Manual Satu-satu</span>
          </button>

          {/* TAB 3: DATASET */}
          <button
            type="button"
            onClick={() => setActiveTab('dataset')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'dataset'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>4. Memori Data ({samples.length})</span>
          </button>

          {/* TAB 4: ALIASES */}
          <button
            type="button"
            onClick={() => setActiveTab('aliases')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'aliases'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>5. Kamus Singkatan ({Object.keys(aliases).length})</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 0: ASISTEN BANTU TRAINING */}
          {activeTab === 'assistant' && (
            <div className="space-y-6">
              
              {/* Header Card */}
              <div className="p-5 bg-linear-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl shadow-md border border-indigo-700 relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg text-xs font-bold text-amber-300 border border-white/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Solusi Cepat Pelatihan Model ML</span>
                  </div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    Bantu Pelatihan Otomatis (Auto-Training Machine Learning)
                  </h3>
                  <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                    Anda tidak perlu mengetik ratusan data satu per satu secara manual. Gunakan asisten ini untuk <strong>melatih seluruh barang di database dalam 1-klik</strong>, memasang <strong>paket dataset industri siap pakai</strong>, atau <strong>melatih variasi cerdas per barang</strong>.
                  </p>
                </div>
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* OPTION 1: 1-CLICK BATCH AUTO-TRAIN ALL ITEMS */}
              <div className="p-5 bg-linear-to-br from-indigo-50/80 via-white to-purple-50/60 border-2 border-indigo-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                      <Rocket className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">
                          Opsi 1: Latih Otomatis Seluruh Barang di Database (1-Klik)
                        </h4>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-full border border-indigo-200">
                          Paling Direkomendasikan
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Membuat 4 variasi cerdas (singkatan gudang, format kode + rak, percakapan suara, dan catatan kondisi) untuk setiap barang.
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Katalog Barang Aktif</div>
                    <div className="text-base font-extrabold text-indigo-900 font-mono">
                      {items.length} Barang Master
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border border-indigo-100 rounded-xl text-xs text-slate-700 space-y-1.5">
                  <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Yang akan otomatis dipelajari oleh model:</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pl-5 list-disc">
                    <li>Singkatan informal & slang (misal: <em>brg 6204, lmp 50w, kbl nym</em>)</li>
                    <li>Penyebutan kode barang & nomor rak lokasi penyimpanan</li>
                    <li>Bahasa lisan/suara (<em>"tolong catat ... dapat sekian di rak ..."</em>)</li>
                    <li>Catatan kondisi barang (<em>segel utuh, kardus basah, retak</em>)</li>
                  </ul>
                </div>

                {batchTrainSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <strong>Sukses!</strong> {batchTrainSuccess.total} variasi pola berhasil dilatihkan untuk {batchTrainSuccess.count} barang.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('test');
                        setTestInput(`${items[0]?.namaStok.split(' ')[0].toLowerCase()} 10`);
                      }}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                    >
                      <span>Coba Uji Sekarang</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isBatchTraining || items.length === 0}
                    onClick={handleBatchTrainAll}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 text-xs"
                  >
                    {isBatchTraining ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Sedang Melatih Model untuk {items.length} Barang...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Latih Semua {items.length} Barang Sekarang (~{items.length * 4} Pola Baru)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* OPTION 2: CURATED INDUSTRY PRESETS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-indigo-600" />
                      <span>Opsi 2: Pasang Paket Data Latih Industri Siap Pakai (Preset Curated)</span>
                    </h4>
                    <p className="text-xs text-slate-600">
                      Pilih bidang gudang Anda untuk menambahkan kumpulan contoh kalimat & kamus singkatan secara instan:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presets.map(preset => {
                    const isLoaded = loadedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isLoaded
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-600" />
                              {preset.name}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">
                              {preset.sampleCount} Pola Latih
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {preset.description}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {preset.highlightTokens.map((token, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-medium"
                              >
                                {token}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{Object.keys(preset.aliases).length} Kamus Singkatan
                          </span>
                          <button
                            type="button"
                            onClick={() => handleLoadPreset(preset.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                              isLoaded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200'
                            }`}
                          >
                            {isLoaded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Telah Terpasang</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Muat & Latih Paket Ini</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OPTION 3: GUIDED INTERACTIVE TRAINER PER ITEM */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-600" />
                      <span>Opsi 3: Latihan Terpandu per Barang (Pilih & Latih Variasi Rekomendasi)</span>
                    </h4>
                    <p className="text-xs text-slate-600">
                      Pilih barang spesifik di bawah untuk melihat variasi pola yang direkomendasikan sistem, lalu latih model dengan 1 klik:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Barang yang Ingin Dilatihkan:
                    </label>
                    <select
                      value={assistantSelectedItemCode}
                      onChange={e => setAssistantSelectedItemCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden bg-white font-medium shadow-2xs"
                    >
                      {items.map(item => (
                        <option key={item.kodeStok} value={item.kodeStok}>
                          [{item.kodeStok}] {item.namaStok} ({item.namaTempat || 'Rak Utama'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    {assistantSelectedItem && (
                      <button
                        type="button"
                        onClick={() => handleTrainAllVariationsForItem(assistantSelectedItem, currentVariations)}
                        className="w-full px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition-all shadow-xs text-xs flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Latih 4 Variasi Sekaligus</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Variations Cards */}
                {assistantSelectedItem && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Rekomendasi Pola untuk "{assistantSelectedItem.namaStok}":
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentVariations.map((v, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-100 text-slate-700">
                              {v.label}
                            </span>
                            <div className="text-xs font-medium text-slate-900 font-mono">
                              "{v.phrase}"
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Target Qty: <strong>{v.suggestedQty}</strong> • Lokasi: <strong>{v.suggestedLokasi}</strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTrainSingleVariation(v, assistantSelectedItem)}
                            title="Latih pola ini saja"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg transition-colors border border-indigo-200 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 1: TEST / SANDBOX */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Ketik Kalimat Bebas / Singkatan Inputan Gudang
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    placeholder="Contoh: lmp sorot 50w b3 25pcs kardus basah"
                    className="w-full px-4 py-3.5 text-base border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl outline-hidden font-medium text-slate-900 shadow-2xs"
                  />
                  {testInput && (
                    <button
                      type="button"
                      onClick={() => setTestInput('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick Test Chips */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[11px] font-semibold text-slate-400">Contoh Cepat:</span>
                  {[
                    'lmp sorot 50w b3 20',
                    'kabel eterna 2x1.5 roll b1 15',
                    'mcb schneider 16a 30 segel rusak',
                    'pipa pvc 1/2 aw 50 rak d',
                  ].map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTestInput(phrase)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg transition-colors border border-slate-200"
                    >
                      "{phrase}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Inference Result Card */}
              {prediction && (
                <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100 rounded-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        ML
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Hasil Prediksi Ekstraksi Otomatis</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Metode: {prediction.method} • Waktu: {prediction.inferenceTimeMs} ms
                        </div>
                      </div>
                    </div>

                    {/* Confidence Badge */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Confidence</div>
                        <div className="text-sm font-extrabold text-indigo-700 font-mono">
                          {(prediction.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            prediction.confidence > 0.8
                              ? 'bg-emerald-500'
                              : prediction.confidence > 0.5
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${prediction.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Extracted Entities Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Item */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                        <Tag className="w-3 h-3 text-indigo-600" />
                        <span>Barang Terdeteksi</span>
                      </div>
                      {prediction.matchedItem ? (
                        <div>
                          <div className="text-xs font-mono font-bold text-indigo-600">
                            {prediction.matchedKode}
                          </div>
                          <div className="text-sm font-bold text-slate-900 line-clamp-1">
                            {prediction.matchedNama}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-rose-500 italic">Belum terdeteksi</div>
                      )}
                    </div>

                    {/* Qty */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                        <Hash className="w-3 h-3 text-emerald-600" />
                        <span>Qty Fisik</span>
                      </div>
                      <div className="text-base font-extrabold text-emerald-700 font-mono">
                        {prediction.qtyFisik !== null ? prediction.qtyFisik : '-'}
                      </div>
                    </div>

                    {/* Lokasi */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>Lokasi Rak</span>
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {prediction.lokasi || '-'}
                      </div>
                    </div>

                    {/* Catatan / Kondisi */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                        <FileText className="w-3 h-3 text-purple-600" />
                        <span>Catatan Fisik</span>
                      </div>
                      <div className="text-xs font-medium text-slate-700 line-clamp-2">
                        {prediction.catatan || 'Kondisi Normal'}
                      </div>
                    </div>
                  </div>

                  {/* Explanation & Action */}
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-indigo-900 font-medium">
                      💡 {prediction.breakdown}
                    </span>

                    {prediction.matchedItem && onApplyPrediction && (
                      <button
                        type="button"
                        onClick={() => {
                          onApplyPrediction({
                            matchedItem: prediction.matchedItem!,
                            qtyFisik: prediction.qtyFisik,
                            lokasi: prediction.lokasi,
                            catatan: prediction.catatan,
                          });
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 active:scale-95 text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Terapkan ke Form Hitung</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TRAIN MODEL MANUAL */}
          {activeTab === 'train' && (
            <div className="space-y-5">
              <div className="p-4 bg-linear-to-r from-indigo-50 to-emerald-50 border border-indigo-100 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Ajari Mesin Inputan Baru (In-App Supervised Training)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Masukkan contoh kalimat yang sering Anda ketik atau ucapkan, lalu pilih barang targetnya. Mesin akan langsung belajar dan mengingat pola tersebut dalam memori model!
                </p>
              </div>

              {trainSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{trainSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleTrainSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Kalimat / Frasa Contoh Input (Misal singkatan / gaya bicara petugas) *
                  </label>
                  <input
                    type="text"
                    required
                    value={trainPhrase}
                    onChange={e => setTrainPhrase(e.target.value)}
                    placeholder="Contoh: kabel eterna nym 2x1.5 btg rak b1 10"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Target Barang Master *
                    </label>
                    <select
                      value={selectedItemCode}
                      onChange={e => setSelectedItemCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden bg-white font-medium"
                    >
                      {items.map(item => (
                        <option key={item.kodeStok} value={item.kodeStok}>
                          [{item.kodeStok}] {item.namaStok}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. Default Target Qty Fisik (Opsional)
                    </label>
                    <input
                      type="number"
                      value={trainQty}
                      onChange={e => setTrainQty(e.target.value)}
                      placeholder="Contoh: 10"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      4. Target Lokasi Rak (Opsional)
                    </label>
                    <input
                      type="text"
                      value={trainLocation}
                      onChange={e => setTrainLocation(e.target.value)}
                      placeholder="Contoh: Rak B1 atau Bin 02"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      5. Catatan / Kondisi Bawaan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={trainNotes}
                      onChange={e => setTrainNotes(e.target.value)}
                      placeholder="Contoh: Segel utuh, kardus baru"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 text-xs"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Latih Model Sekarang (Train Model)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: DATASET MEMORY */}
          {activeTab === 'dataset' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={datasetSearch}
                    onChange={e => setDatasetSearch(e.target.value)}
                    placeholder="Cari pola kalimat, kode, atau barang..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 focus:border-indigo-600 rounded-xl outline-hidden font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export JSON</span>
                  </button>

                  <label className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Import JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    title="Reset data latih ke default"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Table of samples */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Frasa Input yang Dipelajari</th>
                      <th className="px-3.5 py-2.5">Target Barang Master</th>
                      <th className="px-3.5 py-2.5">Target Qty/Lokasi</th>
                      <th className="px-3.5 py-2.5 text-center">Sumber</th>
                      <th className="px-3.5 py-2.5 text-center">Hit Count</th>
                      <th className="px-3.5 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredSamples.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          Tidak ada data latih yang cocok.
                        </td>
                      </tr>
                    ) : (
                      filteredSamples.map(sample => (
                        <tr key={sample.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">
                            "{sample.inputPhrase}"
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="font-mono font-bold text-indigo-600">[{sample.targetKodeStok}]</span>{' '}
                            <span className="text-slate-800">{sample.targetNamaStok}</span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600">
                            {sample.targetQty !== null && sample.targetQty !== undefined ? `Qty: ${sample.targetQty}` : '-'}
                            {sample.targetLokasi ? ` • ${sample.targetLokasi}` : ''}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                sample.source === 'auto_learned'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : sample.source === 'manual_training'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {sample.source === 'auto_learned'
                                ? 'Auto'
                                : sample.source === 'manual_training'
                                ? 'Manual'
                                : 'Seed'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-700">
                            {sample.hitCount}x
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSample(sample.id)}
                              title="Hapus data latih ini"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ALIASES & SLANG DICTIONARY */}
          {activeTab === 'aliases' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Kamus Singkatan & Slang Gudang
                </h3>
                <p className="text-xs text-slate-600">
                  Model akan otomatis menormalisasi singkatan atau kata sehari-hari ke istilah resminya sebelum melakukan klasifikasi barang.
                </p>
              </div>

              {/* Add Alias Form */}
              <form onSubmit={handleAddAlias} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  required
                  value={newAliasKey}
                  onChange={e => setNewAliasKey(e.target.value)}
                  placeholder="Singkatan (contoh: lpu)"
                  className="px-3 py-2 text-xs border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden w-36 font-mono"
                />
                <span className="text-slate-400 font-bold">→</span>
                <input
                  type="text"
                  required
                  value={newAliasValue}
                  onChange={e => setNewAliasValue(e.target.value)}
                  placeholder="Istilah Resmi (contoh: lampu)"
                  className="px-3 py-2 text-xs border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden flex-1 min-w-[160px]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kamus</span>
                </button>
              </form>

              {/* Grid of aliases */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(aliases).map(([alias, full]) => (
                  <div
                    key={alias}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-indigo-700">{alias}</span>
                      <span className="text-slate-400 mx-1.5">→</span>
                      <span className="font-medium text-slate-800">{full}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        customMlEngine.removeAlias(alias);
                        refreshEngineState();
                      }}
                      className="text-slate-300 hover:text-rose-600 p-0.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Model berjalan di mesin Anda (client-side TS). Bebas kuota & privasi 100% aman.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-2xs"
          >
            Tutup Studio
          </button>
        </div>

      </div>
    </div>
  );
};
