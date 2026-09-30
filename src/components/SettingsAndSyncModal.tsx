import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Zap, 
  Save, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { InventoryItem, AppSettings } from '../types/inventory';
import { exportInventoryToCsv, copyInventoryToClipboardTSV, downloadCsvTemplate, readSpreadsheetFile, parseCsvText } from '../services/csvService';
import { sendToGoogleSheetsWebhook, INITIAL_LOCATIONS, INITIAL_UNITS } from '../services/storageService';

interface SettingsAndSyncModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  items: InventoryItem[];
  onImportItems: (newItems: InventoryItem[], replace: boolean) => void;
  onClearAll: () => void;
}

export const SettingsAndSyncModal: React.FC<SettingsAndSyncModalProps> = ({
  settings,
  onSaveSettings,
  items,
  onImportItems,
  onClearAll
}) => {
  const [webhookUrl, setWebhookUrl] = useState(settings.googleSheetsWebhookUrl);
  const [autoSync, setAutoSync] = useState(settings.autoSyncWebhook);
  const [defaultPetugas, setDefaultPetugas] = useState(settings.defaultPetugas);
  const [defaultTempat, setDefaultTempat] = useState(settings.defaultTempat);
  const [defaultSatuan, setDefaultSatuan] = useState(settings.defaultSatuan);

  const [isSending, setIsSending] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // File import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<Partial<InventoryItem>[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSave = () => {
    onSaveSettings({
      googleSheetsWebhookUrl: webhookUrl.trim(),
      autoSyncWebhook: autoSync,
      defaultPetugas: defaultPetugas.trim() || 'Staff Inventory',
      defaultTempat: defaultTempat.trim() || 'Gudang A - Rak 01',
      defaultSatuan: defaultSatuan || 'Pcs',
      availableLocations: settings.availableLocations || []
    });
    setSyncMessage({ success: true, text: 'Pengaturan berhasil disimpan!' });
    setTimeout(() => setSyncMessage(null), 3000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setSyncMessage({ success: false, text: 'Masukkan Webhook URL Google Sheets terlebih dahulu.' });
      return;
    }

    setIsSending(true);
    setSyncMessage(null);
    try {
      const res = await sendToGoogleSheetsWebhook(webhookUrl.trim(), items.slice(0, 3));
      setSyncMessage({ success: res.success, text: res.message });
    } catch (err: any) {
      setSyncMessage({ success: false, text: err?.message || 'Gagal mengirim data.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyTSV = async () => {
    const success = await copyInventoryToClipboardTSV(items);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    try {
      const parsed = await readSpreadsheetFile(file, defaultTempat || 'Gudang A - Rak 01');
      if (parsed.length === 0) {
        setImportError('File kosong atau kolom tidak dikenali. Pastikan kolom memiliki Product Name atau Product Code.');
        return;
      }
      setImportPreview(parsed);
    } catch (err: any) {
      setImportError(err?.message || 'Gagal membaca file spreadsheet. Pastikan file valid (.xlsx, .xls, .csv).');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleConfirmImport = (replace: boolean) => {
    if (!importPreview || importPreview.length === 0) return;

    const fullItems: InventoryItem[] = importPreview.map((p, idx) => ({
      id: 'import_' + Date.now() + '_' + idx,
      kodeStok: p.kodeStok || `STK-${idx + 1}`,
      namaStok: p.namaStok || 'Item Tanpa Nama',
      namaTempat: p.namaTempat || defaultTempat || 'Gudang Utama',
      kategori: p.kategori || 'Umum',
      qtySistem: p.qtySistem ?? 0,
      qtyFisik: p.qtyFisik ?? (p.qtySistem ?? 0),
      selisih: (p.qtyFisik ?? (p.qtySistem ?? 0)) - (p.qtySistem ?? 0),
      satuan: p.satuan || defaultSatuan || 'Pcs',
      kondisi: (p.kondisi || 'Baik') as any,
      petugas: p.petugas || defaultPetugas || 'Petugas',
      catatan: p.catatan || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    onImportItems(fullItems, replace);
    setImportPreview(null);
    setSyncMessage({ success: true, text: `Berhasil mengimpor ${fullItems.length} baris data inventory!` });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Integrasi Spreadsheet & Pengaturan Aplikasi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hubungkan formulir web ke Google Sheets, impor data master dari Excel, dan kelola preferensi default.
            </p>
          </div>
        </div>
      </div>

      {syncMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
          syncMessage.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {syncMessage.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Section 1: Google Sheets Webhook Integration */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Koneksi Otomatis Google Sheets (Apps Script Webhook)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Opsional / Live Sync</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Jika Anda ingin data yang disimpan di web langsung bertambah otomatis ke Google Spreadsheet Anda secara live, pasang Webhook URL di bawah ini. Kode script penerima dapat Anda lihat di tab <strong>Blueprint Sistem</strong>.
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Google Apps Script Web App URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="autoSync"
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <label htmlFor="autoSync" className="text-xs text-slate-700 select-none">
            Kirim otomatis setiap kali menekan tombol "Simpan" di form input
          </label>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={handleTestWebhook}
            disabled={isSending || !webhookUrl}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Tes Kirim Contoh Baris</span>
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Section 2: Ekspor & Salin ke Spreadsheet */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600" />
          Ekspor & Salin Cepat ke Spreadsheet
        </h3>
        <p className="text-xs text-slate-600">
          Gunakan opsi ini jika Anda tidak ingin menggunakan Webhook. Cukup klik tombol di bawah untuk mendapatkan data dalam format spreadsheet:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => exportInventoryToCsv(items)}
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-slate-700" />
                Download CSV Lengkap
              </div>
              <p className="text-[11px] text-slate-500">
                Format UTF-8 BOM agar langsung rapi di Excel & Google Sheets.
              </p>
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold mt-3">Download ({items.length} item) →</span>
          </button>

          <button
            onClick={handleCopyTSV}
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-700" />}
                {copied ? 'Tersalin ke Clipboard!' : 'Salin Data (Ctrl+V)'}
              </div>
              <p className="text-[11px] text-slate-500">
                Salin format tabel lalu buka Google Sheets dan tekan Ctrl + V.
              </p>
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold mt-3">Salin ke Clipboard →</span>
          </button>

          <button
            onClick={downloadCsvTemplate}
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
                Download Template CSV
              </div>
              <p className="text-[11px] text-slate-500">
                File contoh dengan header kolom yang sesuai untuk diisi di Excel.
              </p>
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold mt-3">Download Template →</span>
          </button>
        </div>
      </div>

      {/* Section 3: Impor CSV dari Spreadsheet Lama */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-600" />
          Impor Data dari Spreadsheet Lama (CSV)
        </h3>
        <p className="text-xs text-slate-600">
          Punya file data master inventory di Excel atau Google Sheets? Ekspor spreadsheet Anda menjadi file <strong>.csv</strong> lalu upload ke sini untuk langsung mulai opname fisik!
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />

        {importError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {!importPreview ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-700 flex flex-col items-center justify-center gap-1 transition-colors text-xs font-medium"
          >
            <Upload className="w-6 h-6 text-slate-400 mb-1" />
            <span className="font-semibold text-slate-900">Pilih File CSV dari Komputer / HP</span>
            <span className="text-[11px] text-slate-500">Mendukung pemisah koma (,) titik-koma (;), atau tab</span>
          </button>
        ) : (
          <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-900">
                Terdeteksi {importPreview.length} baris barang dari file CSV
              </span>
              <button
                onClick={() => setImportPreview(null)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                Batal
              </button>
            </div>

            {/* Mini preview table */}
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 font-medium">
                  <tr>
                    <th className="p-2">Kode</th>
                    <th className="p-2">Nama Barang</th>
                    <th className="p-2">Tempat</th>
                    <th className="p-2 text-right">Qty Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importPreview.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono">{row.kodeStok}</td>
                      <td className="p-2">{row.namaStok}</td>
                      <td className="p-2">{row.namaTempat}</td>
                      <td className="p-2 text-right font-mono">{row.qtySistem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => handleConfirmImport(false)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Tambahkan ke Data yang Sudah Ada (+{importPreview.length})
              </button>

              <button
                onClick={() => handleConfirmImport(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Gantikan Semua Data Lama
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Default Field Preferences */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Pengaturan Nilai Default Form Input
        </h3>
        <p className="text-xs text-slate-500">
          Nilai ini akan otomatis terisi saat operator membuka formulir input barang baru untuk mempercepat pekerjaan di lapangan.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Petugas Pemeriksa Default
            </label>
            <input
              type="text"
              value={defaultPetugas}
              onChange={(e) => setDefaultPetugas(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tempat / Rak Default
            </label>
            <input
              type="text"
              value={defaultTempat}
              onChange={(e) => setDefaultTempat(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Satuan Default
            </label>
            <select
              value={defaultSatuan}
              onChange={(e) => setDefaultSatuan(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-slate-900 bg-white"
            >
              {INITIAL_UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Preferensi</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Yakin ingin mereset seluruh data inventory ke contoh awal?')) {
                onClearAll();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Data ke Awal</span>
          </button>
        </div>
      </div>

    </div>
  );
};
