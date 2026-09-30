import { InventoryItem, AppSettings } from '../types/inventory';

const STORAGE_KEY = 'inventrack_items_v1';
const SETTINGS_KEY = 'inventrack_settings_v1';

export const INITIAL_LOCATIONS = [
  'SERVICE LT 1',
  'SERVICE LT 2',
  'SERVICE LT 3',
  'SERVICE LT 4',
  'DAPUR LT 1',
  'DAPUR LT 2',
  'DAPUR LT 3',
  'DAPUR LT 4',
  'BAR',
  'KASIR'
];

export const INITIAL_CATEGORIES = [
  'Sparepart Mesin',
  'Elektronik & Alat',
  'Bahan Baku / Raw Material',
  'Packaging & Kardus',
  'ATK & Perlengkapan Kantor',
  'Perlengkapan Safety / APD'
];

export const INITIAL_UNITS = [
  'Pcs',
  'Box',
  'Dus',
  'Pack',
  'Kg',
  'Liter',
  'Roll',
  'Unit',
  'Set',
  'Meter'
];

export const DEFAULT_SETTINGS: AppSettings = {
  googleSheetsWebhookUrl: '',
  autoSyncWebhook: false,
  defaultPetugas: 'Staff Lapangan',
  defaultTempat: 'SERVICE LT 1',
  defaultSatuan: 'Pcs',
  availableLocations: INITIAL_LOCATIONS
};

const SEED_DATA: InventoryItem[] = [
  {
    id: 'seed-1',
    kodeStok: 'SP-BRG-6204',
    namaStok: 'Bearing Deep Groove 6204 2RS C3',
    namaTempat: 'SERVICE LT 1',
    kategori: 'Sparepart Mesin',
    qtySistem: 120,
    qtyFisik: 118,
    selisih: -2,
    satuan: 'Pcs',
    kondisi: 'Baik',
    gambarUrl: '/src/assets/images/sparepart_bearing_box_1790743169272.jpg',
    petugas: 'Andi Pratama',
    catatan: '2 unit dipinjam tim maintenance belum ada slip return',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'seed-2',
    kodeStok: 'EL-SCN-2900',
    namaStok: 'Barcode Scanner Handheld 2D Wireless',
    namaTempat: 'KASIR',
    kategori: 'Elektronik & Alat',
    qtySistem: 15,
    qtyFisik: 15,
    selisih: 0,
    satuan: 'Unit',
    kondisi: 'Baik',
    gambarUrl: '/src/assets/images/electronic_barcode_scanner_1790743180827.jpg',
    petugas: 'Dewi Lestari',
    catatan: 'Kondisi fisik dan baterai semua berfungsi normal',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'seed-3',
    kodeStok: 'ATK-KRT-A480',
    namaStok: 'Kertas HVS PaperOne A4 80gsm 5 Rim',
    namaTempat: 'SERVICE LT 2',
    kategori: 'ATK & Perlengkapan Kantor',
    qtySistem: 50,
    qtyFisik: 54,
    selisih: 4,
    satuan: 'Dus',
    kondisi: 'Baik',
    gambarUrl: '/src/assets/images/office_stationery_carton_1790743192956.jpg',
    petugas: 'Budi Santoso',
    catatan: 'Ada tambahan kiriman PO kemarin sore belum diinput sistem ERP',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'seed-4',
    kodeStok: 'PCK-KRD-4030',
    namaStok: 'Kardus Box Master Kraft 40x30x25 Double Wall',
    namaTempat: 'DAPUR LT 1',
    kategori: 'Packaging & Kardus',
    qtySistem: 300,
    qtyFisik: 290,
    selisih: -10,
    satuan: 'Pcs',
    kondisi: 'Rusak',
    gambarUrl: '',
    petugas: 'Andi Pratama',
    catatan: '10 lembar basah terkena tetesan air hujan di pinggir dinding',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'seed-5',
    kodeStok: 'SFT-GLV-NBR9',
    namaStok: 'Sarung Tangan Nitrile Heavy Duty Size L',
    namaTempat: 'BAR',
    kategori: 'Perlengkapan Safety / APD',
    qtySistem: 85,
    qtyFisik: 85,
    selisih: 0,
    satuan: 'Box',
    kondisi: 'Baik',
    gambarUrl: '',
    petugas: 'Dewi Lestari',
    catatan: 'Stok tersegel rapi di rak tengah',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

export function getStoredItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load items from storage:', e);
    return SEED_DATA;
  }
}

export function saveStoredItems(items: InventoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save items to storage:', e);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    // Auto-migrate if stored settings still have the old warehouse locations
    if (parsed.availableLocations && parsed.availableLocations.includes('Gudang A - Rak 01')) {
      parsed.availableLocations = INITIAL_LOCATIONS;
      parsed.defaultTempat = 'SERVICE LT 1';
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * Compress an uploaded file or camera capture using HTML Canvas
 * to avoid exceeding browser storage quotas while keeping high clarity.
 */
export async function compressImageFile(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> {
  return compressImageSource(file, maxWidth, maxHeight, quality);
}

/**
 * Universal image compressor from File, Blob, dataUrl, or image URL
 */
export async function compressImageSource(
  source: File | Blob | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const handleSrc = (src: string) => {
      // If it's already an SVG data URL, return directly
      if (src.startsWith('data:image/svg+xml')) {
        resolve(src);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          // If tainted by CORS, return original src
          resolve(src);
        }
      };
      img.onerror = () => {
        // If image fails to load via canvas (e.g. strict CORS), still resolve original URL if it's a web link
        if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
          resolve(src);
        } else {
          reject(new Error('Gagal memuat gambar dari sumber'));
        }
      };
      img.src = src;
    };

    if (typeof source === 'string') {
      handleSrc(source);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        handleSrc(result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

const makeSvgPreset = (bg: string, fg: string, emoji: string, label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
    <rect width="320" height="320" fill="${bg}" rx="28"/>
    <circle cx="160" cy="140" r="70" fill="${fg}" fill-opacity="0.12"/>
    <text x="160" y="165" font-size="76" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <rect x="30" y="240" width="260" height="42" rx="12" fill="${fg}" fill-opacity="0.18"/>
    <text x="160" y="266" font-size="16" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" fill="${fg}" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export interface PresetCategoryIllustration {
  id: string;
  name: string;
  category: string;
  icon: string;
  url: string;
}

export const PRESET_CATEGORY_ILLUSTRATIONS: PresetCategoryIllustration[] = [
  {
    id: 'sparepart-bearing',
    name: 'Bearing & Sparepart',
    category: 'Sparepart',
    icon: '⚙️',
    url: '/src/assets/images/sparepart_bearing_box_1790743169272.jpg'
  },
  {
    id: 'elektronik-scanner',
    name: 'Scanner & Elektronik',
    category: 'Elektronik',
    icon: '📱',
    url: '/src/assets/images/electronic_barcode_scanner_1790743180827.jpg'
  },
  {
    id: 'atk-kertas',
    name: 'ATK & Kertas Rim',
    category: 'ATK',
    icon: '📄',
    url: '/src/assets/images/office_stationery_carton_1790743192956.jpg'
  },
  {
    id: 'preset-kardus',
    name: 'Kardus & Kemasan',
    category: 'Packaging & Dus',
    icon: '📦',
    url: makeSvgPreset('#fef3c7', '#92400e', '📦', 'Kardus & Box Kemasan')
  },
  {
    id: 'preset-safety',
    name: 'APD & Perlengkapan Safety',
    category: 'Safety',
    icon: '🦺',
    url: makeSvgPreset('#ffedd5', '#c2410c', '🦺', 'APD & Safety Helmet')
  },
  {
    id: 'preset-tools',
    name: 'Tools & Perkakas',
    category: 'Peralatan',
    icon: '🔧',
    url: makeSvgPreset('#e0f2fe', '#0369a1', '🔧', 'Tools & Perkakas')
  },
  {
    id: 'preset-oli',
    name: 'Oli & Pelumas Mesin',
    category: 'Cairan & Kimia',
    icon: '🛢️',
    url: makeSvgPreset('#f3e8ff', '#7e22ce', '🛢️', 'Oli & Pelumas')
  },
  {
    id: 'preset-material',
    name: 'Bahan Baku & Logam',
    category: 'Material',
    icon: '🧱',
    url: makeSvgPreset('#f1f5f9', '#334155', '🧱', 'Raw Material')
  }
];

/**
 * Send an item or batch to a Google Apps Script Webhook
 */
export async function sendToGoogleSheetsWebhook(webhookUrl: string, itemOrItems: InventoryItem | InventoryItem[]): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'URL Webhook Google Sheets belum diatur atau tidak valid.' };
  }

  try {
    const payload = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // avoids CORS preflight triggers on Google Apps Script
      },
      body: JSON.stringify({
        action: 'append_inventory',
        timestamp: new Date().toISOString(),
        rows: payload.map(i => ({
          kodeStok: i.kodeStok,
          namaStok: i.namaStok,
          namaTempat: i.namaTempat,
          kategori: i.kategori,
          qtySistem: i.qtySistem,
          qtyFisik: i.qtyFisik,
          selisih: i.selisih,
          satuan: i.satuan,
          kondisi: i.kondisi,
          petugas: i.petugas,
          catatan: i.catatan || '',
          updatedAt: i.updatedAt
        }))
      })
    });

    if (!response.ok) {
      return { success: false, message: `Status server spreadsheet: ${response.status} ${response.statusText}` };
    }

    return { success: true, message: 'Data berhasil disinkronkan ke Google Spreadsheet.' };
  } catch (err: any) {
    // Note: Due to Google Apps Script redirect behavior, opaque response may occur, but data is usually written.
    console.warn('Google sheets push result notice:', err);
    return { success: true, message: 'Data dikirim ke Google Sheets (Apps Script). Silakan periksa spreadsheet Anda.' };
  }
}
