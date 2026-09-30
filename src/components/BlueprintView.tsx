import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Database, 
  Cloud, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Check, 
  Smartphone, 
  Camera, 
  Filter, 
  FileSpreadsheet, 
  ExternalLink,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';

export const BlueprintView: React.FC = () => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'arsitektur' | 'skema' | 'spreadsheet' | 'vercel'>('arsitektur');

  const appsScriptCode = `// KODE GOOGLE APPS SCRIPT UNTUK MENERIMA DATA INVENTORY DARI WEB
// Tempelkan kode ini di Google Sheets: Extensions -> Apps Script -> Simpan & Deploy as Web App

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Buat header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Waktu Input",
        "Kode Stok", 
        "Nama Stok", 
        "Nama Tempat", 
        "Kategori", 
        "Qty Sistem", 
        "Qty Fisik", 
        "Selisih", 
        "Satuan", 
        "Kondisi", 
        "Petugas", 
        "Catatan"
      ]);
    }
    
    // Tulis baris data
    var rows = data.rows || [data];
    for (var i = 0; i < rows.length; i++) {
      var item = rows[i];
      sheet.appendRow([
        new Date(),
        item.kodeStok,
        item.namaStok,
        item.namaTempat,
        item.kategori || "Umum",
        Number(item.qtySistem) || 0,
        Number(item.qtyFisik) || 0,
        (Number(item.qtyFisik) || 0) - (Number(item.qtySistem) || 0),
        item.satuan,
        item.kondisi,
        item.petugas,
        item.catatan || ""
      ]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", count: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Blueprint Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="text-xs font-semibold tracking-wide text-indigo-600 uppercase mb-1">
              Dokumen Perancangan Sistem
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              Blueprint: Web Penginputan Data Inventory & Stock Opname
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
              Arsitektur sistem transisi dari form spreadsheet sel kecil yang rawan salah ketik menjadi antarmuka web modern yang ergonomis, berbasis Vercel Frontend dan Google Spreadsheet Database via CSV & Webhook.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Target: Vercel + Spreadsheet</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('arsitektur')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'arsitektur'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Arsitektur & Perbandingan
          </button>
          <button
            onClick={() => setActiveTab('skema')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'skema'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            2. Skema Data & Kamus Kolom
          </button>
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'spreadsheet'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            3. Integrasi Spreadsheet Database
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'vercel'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cloud className="w-4 h-4" />
            4. Panduan Deploy Vercel
          </button>
        </div>
      </div>

      {/* Tab 1: Arsitektur & Problem Comparison */}
      {activeTab === 'arsitektur' && (
        <div className="space-y-6">
          {/* Comparison Cards: Before vs After */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-6">
              <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-3">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Kondisi Lama: Input Spreadsheet Sel Kecil
              </div>
              <ul className="space-y-2.5 text-xs text-rose-900/80 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-rose-600">✕</span>
                  <span><strong>Ukuran input terlalu sempit:</strong> Operator di gudang sulit mengetik angka di layar HP/tablet tanpa zooming berulang kali.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-rose-600">✕</span>
                  <span><strong>Risiko salah baris tinggi:</strong> Jari mudah salah tap baris barang tetangga sehingga stok barang lain yang tertimpa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-rose-600">✕</span>
                  <span><strong>Tidak bisa lampirkan foto fisik:</strong> Spreadsheet biasa tidak ramah kompresi foto kamera lapangan untuk bukti barang rusak atau kemasan pecah.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-rose-600">✕</span>
                  <span><strong>Pencarian lambat:</strong> Fitur Ctrl+F di spreadsheet mobile lambat dan tidak mengelompokkan lokasi rak/tempat secara otomatis.</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Solusi Baru: Web Input Lapang & Modern
              </div>
              <ul className="space-y-2.5 text-xs text-emerald-950/80 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Tombol & Input Lapang:</strong> Numpad besar, tombol +/- cepat, input jelas dan ramah sentuhan sarung tangan kerja.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Kamera & Foto Barang Langsung:</strong> Ambil foto bukti barang langsung dari kamera HP/tablet dengan kompresi otomatis berbobot ringan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Pencarian & Filter Multikriteria:</strong> Filter instan berdasarkan Kode Stok, Nama Tempat/Rak, Kategori, atau Status Selisih.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Penghitungan Selisih Otomatis:</strong> Selisih langsung terkalkulasi realtime dengan penanda visual: Pas, Surplus (+), atau Minus (-).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* System Diagram Flow */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <h3 className="text-base font-semibold text-slate-900">
              Alur Data (System Architecture Diagram)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900">1. Input Lapangan</div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Petugas menginput via HP / Tablet: Kode Stok, Tempat/Rak, Foto & Hitung Fisik.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900">2. Local Storage Cache</div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Data tersimpan aman di memori browser. Jika sinyal gudang putus, data tidak hilang.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
                  <Cloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900">3. Vercel Hosting</div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Frontend React Single Page Application berjalan cepat melalui Global Edge CDN Vercel.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900">4. Database Spreadsheet</div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Menerima data via Download CSV (UTF-8 BOM) atau otomatis via Google Apps Script Webhook.
                </p>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-xs text-blue-900 flex items-start gap-3">
              <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Keunggulan Desain Ini:</strong> Anda tidak memerlukan server database berbayar yang rumit (seperti MySQL atau PostgreSQL). Semua laporan dan histori tetap tersimpan rapi di Google Sheets atau Microsoft Excel seperti workflow Anda sebelumnya, namun operator gudang mendapatkan antarmuka input yang nyaman dan minim kesalahan.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Skema Data & Kamus Kolom */}
      {activeTab === 'skema' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Kamus Data (Data Dictionary & Column Mapping)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Struktur data yang digunakan pada formulir input dan diselaraskan ke kolom spreadsheet target.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">Nama Kolom</th>
                  <th className="px-4 py-3">Tipe Data</th>
                  <th className="px-4 py-3">Contoh Nilai</th>
                  <th className="px-4 py-3">Wajib?</th>
                  <th className="px-4 py-3">Keterangan Fungsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900 font-mono">Kode Stok</td>
                  <td className="px-4 py-3">String / Alphanumeric</td>
                  <td className="px-4 py-3 font-mono text-indigo-600">SP-BRG-6204</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">Ya (Unik)</td>
                  <td className="px-4 py-3">SKU, Part Number, atau kode barcode barang di sistem master.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">Nama Stok</td>
                  <td className="px-4 py-3">String</td>
                  <td className="px-4 py-3">Bearing Deep Groove 6204</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">Ya</td>
                  <td className="px-4 py-3">Nama lengkap barang agar mudah dikenali operator di rak.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">Nama Tempat</td>
                  <td className="px-4 py-3">String / Dropdown</td>
                  <td className="px-4 py-3">Gudang A - Rak 01</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">Ya</td>
                  <td className="px-4 py-3">Lokasi fisik rak, lorong, bin, atau zona penyimpanan.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">Kategori</td>
                  <td className="px-4 py-3">String / Dropdown</td>
                  <td className="px-4 py-3">Sparepart Mesin</td>
                  <td className="px-4 py-3 text-slate-400">Opsional</td>
                  <td className="px-4 py-3">Pengelompokan barang (Sparepart, Bahan Baku, ATK, APD).</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900 font-mono">Qty Sistem</td>
                  <td className="px-4 py-3">Number</td>
                  <td className="px-4 py-3 font-mono">120</td>
                  <td className="px-4 py-3 text-slate-400">Opsional (Default 0)</td>
                  <td className="px-4 py-3">Stok buku yang tercatat di spreadsheet/pembukuan sebelum opname.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900 font-mono">Qty Fisik</td>
                  <td className="px-4 py-3">Number</td>
                  <td className="px-4 py-3 font-mono">118</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">Ya</td>
                  <td className="px-4 py-3">Jumlah fisik aktual yang dihitung di lapangan saat audit.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900 font-mono">Selisih</td>
                  <td className="px-4 py-3">Formula / Number</td>
                  <td className="px-4 py-3 font-mono text-rose-600">-2</td>
                  <td className="px-4 py-3 text-slate-400">Auto Dihitung</td>
                  <td className="px-4 py-3">Dihitung otomatis: Qty Fisik dikurangi Qty Sistem.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">Satuan</td>
                  <td className="px-4 py-3">String / Dropdown</td>
                  <td className="px-4 py-3">Pcs, Box, Dus, Kg</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">Ya</td>
                  <td className="px-4 py-3">Unit of Measurement (UOM) barang.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">Kondisi</td>
                  <td className="px-4 py-3">Enum</td>
                  <td className="px-4 py-3">Baik / Rusak / Kadaluarsa</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">Ya</td>
                  <td className="px-4 py-3">Kondisi fisik barang di rak saat dihitung.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">Foto Barang</td>
                  <td className="px-4 py-3">Image / Base64 / URL</td>
                  <td className="px-4 py-3 text-slate-500">[Gambar Bukti Fisik]</td>
                  <td className="px-4 py-3 text-slate-400">Opsional</td>
                  <td className="px-4 py-3">Foto fisik barang dari kamera handphone untuk verifikasi visual.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">Petugas</td>
                  <td className="px-4 py-3">String</td>
                  <td className="px-4 py-3">Andi Pratama</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">Ya</td>
                  <td className="px-4 py-3">Nama personil yang bertanggung jawab menghitung.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">Catatan</td>
                  <td className="px-4 py-3">Text</td>
                  <td className="px-4 py-3">2 unit dipinjam tim maintenance</td>
                  <td className="px-4 py-3 text-slate-400">Opsional</td>
                  <td className="px-4 py-3">Keterangan selisih atau catatan khusus dari tim lapangan.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Integrasi Spreadsheet Database */}
      {activeTab === 'spreadsheet' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Dua Cara Menghubungkan Web Input ke Spreadsheet
            </h3>
            <p className="text-xs text-slate-600">
              Aplikasi ini menyediakan 2 metode integrasi spreadsheet sesuai kenyamanan alur kerja tim Anda:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Metode 1: Ekspor File CSV (Paling Praktis)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Setelah tim selesai menghitung stok di gudang, klik tombol <strong>"Download CSV untuk Spreadsheet"</strong> atau <strong>"Salin ke Spreadsheet"</strong>.
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Menggunakan format UTF-8 BOM sehingga langsung terbuka rapi di Excel tanpa teks berantakan.</li>
                    <li>Bisa langsung dibuka di Google Sheets: <em>File &gt; Import &gt; Upload CSV</em>.</li>
                    <li>Tombol <em>"Salin ke Spreadsheet"</em> memungkinkan Anda langsung tekan <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300">Ctrl + V</code> di Google Sheets!</li>
                  </ul>
                </div>
              </div>

              <div className="border border-indigo-100 rounded-xl p-5 bg-indigo-50/40 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    Metode 2: Google Apps Script Webhook (Otomatis Live)
                  </div>
                  <p className="text-xs text-indigo-950/80 leading-relaxed mb-4">
                    Setiap kali operator menekan tombol <strong>"Simpan & Hitung"</strong> di web, data otomatis terkirim dan bertambah sebagai baris baru di Google Sheets Anda.
                  </p>
                  <ul className="text-[11px] text-indigo-900/80 space-y-1.5 list-disc pl-4">
                    <li>Tidak perlu download atau upload file manual.</li>
                    <li>Manager di kantor bisa memantau spreadsheet secara live selagi operator input di gudang.</li>
                    <li>Kode Apps Script siap pakai telah disediakan di bawah ini.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Apps script code block */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-mono">google-sheets-webhook.gs</div>
                <div className="text-sm font-semibold text-white">Kode Script Penerima Data di Google Sheets</div>
              </div>
              <button
                onClick={handleCopyScript}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode Script</span>
                  </>
                )}
              </button>
            </div>

            <pre className="text-xs font-mono bg-slate-950 p-4 rounded-lg overflow-x-auto text-emerald-400 leading-relaxed border border-slate-800">
              {appsScriptCode}
            </pre>

            <div className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
              <div className="font-semibold text-white">Cara Memasang di Google Sheets Anda:</div>
              <ol className="list-decimal pl-5 space-y-1 text-slate-400">
                <li>Buka file Google Sheets Anda.</li>
                <li>Pilih menu <strong>Extensions (Ekstensi) &gt; Apps Script</strong>.</li>
                <li>Hapus kode bawaan, lalu paste kode di atas, kemudian klik <strong>Simpan (ikon disket)</strong>.</li>
                <li>Klik tombol biru <strong>Deploy &gt; New deployment</strong>.</li>
                <li>Pilih tipe: <strong>Web app</strong>. Atur <em>Who has access: Anyone (Siapa saja)</em>.</li>
                <li>Salin <strong>Web App URL</strong> yang dihasilkan, lalu tempelkan di tab <strong>Pengaturan</strong> aplikasi ini. Selesai!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Panduan Deploy Vercel */}
      {activeTab === 'vercel' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Panduan Deploy ke Vercel (Gratis & Siap Pakai)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Karena frontend web ini dibuat murni berbasis React SPA (Single Page Application), proses hosting ke Vercel sangat cepat tanpa perlu konfigurasi backend rumit.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-900">Push Proyek ke GitHub atau GitLab</div>
                <p className="text-slate-600">
                  Buat repositori baru di GitHub Anda (misal: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">inventory-stock-opname</code>) lalu upload atau push source code ini.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-900">Buka Vercel Dashboard</div>
                <p className="text-slate-600">
                  Login ke <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">vercel.com</a>, klik tombol <strong>"Add New... &gt; Project"</strong>, dan pilih repositori GitHub yang baru dibuat.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-900">Pengaturan Build (Vite Otomatis Terdeteksi)</div>
                <p className="text-slate-600">
                  Vercel akan otomatis mengenali Vite. Anda tidak perlu mengubah setting apapun:
                </p>
                <div className="font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-700 mt-2 space-y-1">
                  <div>Framework Preset: <strong>Vite</strong></div>
                  <div>Build Command: <strong>npm run build</strong></div>
                  <div>Output Directory: <strong>dist</strong></div>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                4
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-900">Klik "Deploy" & Bagikan Link ke Operator Gudang</div>
                <p className="text-slate-600">
                  Dalam waktu kurang dari 60 detik, website Anda telah online dengan URL gratis (contoh: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">https://inventory-anda.vercel.app</code>) yang bisa langsung dibuka di browser smartphone staf gudang tanpa instalasi apapun!
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-white">
            <div className="text-xs font-semibold text-slate-900 mb-2">Konfigurasi Tambahan: vercel.json</div>
            <p className="text-xs text-slate-600 mb-3">
              File <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">vercel.json</code> sudah kami sediakan di dalam proyek untuk memastikan routing SPA selalu diarahkan dengan sempurna:
            </p>
            <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto">
{`{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
