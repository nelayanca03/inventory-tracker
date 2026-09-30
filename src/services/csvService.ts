import * as XLSX from 'xlsx';
import { InventoryItem } from '../types/inventory';

/**
 * Helper to escape CSV cell values
 */
function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  if (/[",\n\r;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Robust number parsing supporting both Indonesian (2.500.000 or 12,5)
 * and US (2,500,000 or 12.5) formatting.
 */
export function parseFlexibleNumber(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;
  
  let str = String(val).trim();
  // Strip currency symbols and letters (e.g. "Rp", "IDR", "pcs")
  str = str.replace(/[^\d.,\-+]/g, '').trim();
  if (!str) return 0;

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Indonesian format: 1.250.000,50 -> 1250000.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,250,000.50 -> 1250000.50
      str = str.replace(/,/g, '');
    }
  } else if (hasDot) {
    // Check if multiple dots: 1.250.000 -> 1250000
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      str = str.replace(/\./g, '');
    } else {
      // Single dot. If followed by exactly 3 digits at the end (e.g. "1.500" in Indonesian),
      // or if it's typical price, check if user meant 1500 or 1.5.
      // Usually in Indonesian inventory: quantities can be decimal (1.5) or integer (1500).
      // If after dot is 3 digits without further digits, it could be thousands (e.g. 1.000).
      // We will parse standard float unless dot is clearly a thousand separator
      const parts = str.split('.');
      if (parts[1] && parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
        // e.g. "1.000", "25.000" -> likely thousands
        str = str.replace('.', '');
      }
    }
  } else if (hasComma) {
    // Check if multiple commas: 1,250,000 -> 1250000
    const commaCount = (str.match(/,/g) || []).length;
    if (commaCount > 1) {
      str = str.replace(/,/g, '');
    } else {
      // Single comma in Indonesian is decimal (e.g. "4,5" -> "4.5")
      // UNLESS followed by 3 digits like "1,000" in US format
      const parts = str.split(',');
      if (parts[1] && parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
        // e.g. "1,000" -> 1000
        str = str.replace(',', '');
      } else {
        str = str.replace(',', '.');
      }
    }
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Export inventory items into CSV matching user's spreadsheet template:
 * No, Product Name, Product Code, Category, Sub Category, Unit, Opname Qty, Opname Value, Hasil Fisik, Lokasi Rak, Selisih
 */
export function exportInventoryToCsv(items: InventoryItem[], filename = 'data_opname_inventory.csv'): void {
  const headers = [
    'No',
    'Product Name',
    'Product Code',
    'Category',
    'Sub Category',
    'Unit',
    'Opname Qty (Sistem)',
    'Hasil Fisik (User)',
    'Selisih',
    'Opname Value',
    'Lokasi Rak',
    'Kondisi',
    'Petugas',
    'Catatan',
    'Waktu Update'
  ];

  const rows = items.map((item, index) => [
    item.no || index + 1,
    escapeCsvCell(item.namaStok),
    escapeCsvCell(item.kodeStok),
    escapeCsvCell(item.kategori || 'Umum'),
    escapeCsvCell(item.subKategori || '-'),
    escapeCsvCell(item.satuan),
    item.qtySistem,
    item.qtyFisik,
    item.selisih,
    item.opnameValue || 0,
    escapeCsvCell(item.namaTempat),
    escapeCsvCell(item.kondisi),
    escapeCsvCell(item.petugas),
    escapeCsvCell(item.catatan || ''),
    escapeCsvCell(new Date(item.updatedAt).toLocaleString('id-ID'))
  ]);

  const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n');
  
  // Prepend UTF-8 BOM (\uFEFF) so Excel/Google Sheets correctly parses UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate TSV (Tab Separated Values) for quick direct Ctrl+V copy into Google Sheets / Excel
 */
export async function copyInventoryToClipboardTSV(items: InventoryItem[]): Promise<boolean> {
  const headers = [
    'No',
    'Product Name',
    'Product Code',
    'Category',
    'Sub Category',
    'Unit',
    'Opname Qty',
    'Hasil Fisik',
    'Selisih',
    'Lokasi Rak'
  ];

  const rows = items.map((item, index) => [
    item.no || index + 1,
    item.namaStok,
    item.kodeStok,
    item.kategori || 'Umum',
    item.subKategori || '-',
    item.satuan,
    item.qtySistem,
    item.qtyFisik,
    item.selisih,
    item.namaTempat
  ]);

  const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * Generate and download CSV template matching user's exact spreadsheet format:
 * [No, Product Name, Product Code, Category, Sub Category, Unit, Opname Qty, Opname Value]
 */
export function downloadCsvTemplate(): void {
  const headers = [
    'No',
    'Product Name',
    'Product Code',
    'Category',
    'Sub Category',
    'Unit',
    'Opname Qty',
    'Opname Value'
  ];

  const sampleRows = [
    ['1', 'ACRYLIC STANDING LOLLIPOP (16 LUBANG) 18 CM x 18 CM', 'STO1901', 'GUDANG STOCK', 'GUDANG STOCK', 'PCS', '4', '2500000'],
    ['2', 'ALAS CANGKIR ESPRESSO 170 ML', 'STO1781', 'GUDANG STOCK', 'GUDANG STOCK', 'PCS', '9', '450000'],
    ['3', 'ALAS STEAMAN 18"', 'STO0006', 'GUDANG STOCK', 'GUDANG STOCK', 'PCS', '6', '120000'],
    ['4', 'ALUMINIUM FOIL 30 CM X 7.6 M', 'STO1763', 'GUDANG STOCK', 'GUDANG STOCK', 'ROLL', '12', '180000']
  ];

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...sampleRows.map(row => row.map(c => `"${c}"`).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_opname_gudang.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Clean & normalize header strings for fuzzy matching
 */
function normalizeHeader(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Helper to process 2D rows array into Partial<InventoryItem>[]
 * Intelligently scans rows (handles empty row 1 in Excel, custom headers, Indonesian & English terms)
 */
export function process2DRows(
  matrix: (string | number | undefined | null)[][], 
  defaultLocation = ''
): Partial<InventoryItem>[] {
  if (!matrix || matrix.length === 0) return [];

  // Find header row index by scanning first 25 rows
  let headerRowIndex = -1;
  let idxNo = -1;
  let idxProductName = -1;
  let idxProductCode = -1;
  let idxCategory = -1;
  let idxSubCategory = -1;
  let idxUnit = -1;
  let idxOpnameQty = -1;
  let idxOpnameValue = -1;
  let idxLocation = -1;

  for (let r = 0; r < Math.min(25, matrix.length); r++) {
    const row = matrix[r] || [];
    const normalizedRow = row.map(cell => normalizeHeader(String(cell || '')));

    // Check if this row looks like header
    const pName = normalizedRow.findIndex(h => 
      h.includes('productname') || 
      h.includes('namastok') || 
      h.includes('namabarang') || 
      h.includes('namaproduk') || 
      h.includes('itemname') ||
      h.includes('nama') ||
      h.includes('deskripsi') ||
      h.includes('description')
    );

    const pCode = normalizedRow.findIndex(h => 
      h.includes('productcode') || 
      h.includes('kodestok') || 
      h.includes('kodebarang') || 
      h.includes('kodeproduk') || 
      h.includes('itemcode') || 
      h.includes('sku') || 
      h.includes('code') || 
      h.includes('kode') || 
      h.includes('barcode')
    );

    if (pName !== -1 || pCode !== -1) {
      headerRowIndex = r;
      idxProductName = pName;
      idxProductCode = pCode;
      
      idxNo = normalizedRow.findIndex(h => h === 'no' || h === 'nomor' || h === 'num' || h === 'id');
      
      // Category & Sub Category
      idxSubCategory = normalizedRow.findIndex(h => 
        h.includes('subcategory') || 
        h.includes('subkategori') || 
        h.includes('subcat')
      );
      idxCategory = normalizedRow.findIndex((h, idx) => 
        idx !== idxSubCategory && (h.includes('category') || h.includes('kategori'))
      );

      idxUnit = normalizedRow.findIndex(h => 
        h === 'unit' || h === 'satuan' || h === 'uom' || h.includes('satuan')
      );

      idxOpnameQty = normalizedRow.findIndex(h => 
        h.includes('opnameqty') || 
        h.includes('qtyopname') || 
        h.includes('opname') || 
        h.includes('qty') || 
        h.includes('quantity') || 
        h.includes('jumlah') || 
        h.includes('stok') || 
        h.includes('stock') ||
        h.includes('sistem')
      );

      idxOpnameValue = normalizedRow.findIndex(h => 
        h.includes('opnamebuyprice') || 
        h.includes('buyprice') || 
        h.includes('opnamevalue') || 
        h.includes('value') || 
        h.includes('nilai') || 
        h.includes('harga') || 
        h.includes('price')
      );

      idxLocation = normalizedRow.findIndex(h => 
        h.includes('lokasi') || 
        h.includes('tempat') || 
        h.includes('rak') || 
        h.includes('bin') || 
        h.includes('gudang')
      );

      break;
    }
  }

  // Fallback: If no header found by keywords, search for first row with at least 2 non-empty cells
  if (headerRowIndex === -1) {
    for (let r = 0; r < Math.min(10, matrix.length); r++) {
      const nonEmpties = (matrix[r] || []).filter(c => c !== undefined && c !== null && String(c).trim() !== '');
      if (nonEmpties.length >= 2) {
        headerRowIndex = r;
        // Default standard column sequence matching user's template:
        // Col 0: No, Col 1: Product Name, Col 2: Product Code, Col 3: Category, Col 4: Sub Category, Col 5: Unit, Col 6: Opname Qty, Col 7: Value
        idxNo = 0;
        idxProductName = 1;
        idxProductCode = 2;
        idxCategory = 3;
        idxSubCategory = 4;
        idxUnit = 5;
        idxOpnameQty = 6;
        idxOpnameValue = 7;
        break;
      }
    }
  }

  if (headerRowIndex === -1) return [];

  // Default fallback index positions if some are missing
  if (idxProductName === -1 && idxProductCode !== -1) {
    // If code is col 2, maybe col 1 is product name
    idxProductName = idxProductCode === 2 ? 1 : (idxProductCode === 1 ? 0 : 1);
  }
  if (idxProductCode === -1 && idxProductName !== -1) {
    idxProductCode = idxProductName === 1 ? 2 : (idxProductName === 0 ? 1 : 2);
  }

  const parsedItems: Partial<InventoryItem>[] = [];

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.length === 0) continue;

    // Check if row has any meaningful content
    const hasContent = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
    if (!hasContent) continue;

    const noCell = idxNo !== -1 ? row[idxNo] : undefined;
    const nameCell = idxProductName !== -1 ? row[idxProductName] : row[1];
    const codeCell = idxProductCode !== -1 ? row[idxProductCode] : row[2];
    const catCell = idxCategory !== -1 ? row[idxCategory] : row[3];
    const subCatCell = idxSubCategory !== -1 ? row[idxSubCategory] : row[4];
    const unitCell = idxUnit !== -1 ? row[idxUnit] : row[5];
    const qtyCell = idxOpnameQty !== -1 ? row[idxOpnameQty] : row[6];
    const valCell = idxOpnameValue !== -1 ? row[idxOpnameValue] : row[7];
    const locCell = idxLocation !== -1 ? row[idxLocation] : undefined;

    const namaStok = String(nameCell || '').trim();
    const rawCode = String(codeCell || '').trim().toUpperCase();

    // If both name and code are empty, skip row
    if (!namaStok && !rawCode) continue;

    // If code is empty but name exists, generate code
    const kodeStok = rawCode || `PRD-${String(parsedItems.length + 1).padStart(4, '0')}`;

    const noVal = noCell !== undefined ? parseInt(String(noCell).replace(/[^0-9]/g, ''), 10) : (parsedItems.length + 1);
    
    // Parse quantity using robust parser
    const qtySistem = parseFlexibleNumber(qtyCell);

    // Parse value / buy price using robust parser
    const opnameValue = parseFlexibleNumber(valCell);

    const satuan = String(unitCell || '').trim() || 'PCS';
    const kategori = String(catCell || '').trim() || 'GUDANG STOCK';
    const subKategori = String(subCatCell || '').trim() || 'GUDANG STOCK';
    const namaTempat = locCell ? String(locCell).trim() : defaultLocation;

    parsedItems.push({
      no: isNaN(noVal) ? (parsedItems.length + 1) : noVal,
      namaStok: namaStok || `Produk Baris ${r + 1}`,
      kodeStok,
      kategori,
      subKategori,
      satuan,
      qtySistem,
      qtyFisik: 0,
      selisih: 0 - qtySistem,
      opnameValue,
      namaTempat,
      kondisi: 'Baik',
      petugas: '-',
      catatan: '',
      gambarUrl: '', // As requested: admin uploads CSV without pictures; photos are added by admin separately
      isCounted: false
    });
  }

  return parsedItems;
}

/**
 * Universal Spreadsheet Reader using SheetJS
 * Supports: .xlsx, .xls, .csv, .tsv, .txt
 */
export async function readSpreadsheetFile(
  file: File, 
  defaultLocation = ''
): Promise<Partial<InventoryItem>[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Read workbook using SheetJS (handles both binary Excel formats and plain CSV/TSV)
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      raw: false,
      cellDates: true,
      codepage: 65001 // UTF-8
    });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('File spreadsheet tidak memiliki lembar kerja (sheet). Pastikan file tidak rusak.');
    }

    const sheet = workbook.Sheets[firstSheetName];
    // Convert sheet to 2D array
    const matrix = XLSX.utils.sheet_to_json(sheet, { 
      header: 1, 
      defval: '',
      blankrows: true
    }) as (string | number | undefined | null)[][];

    const items = process2DRows(matrix, defaultLocation);
    if (items.length === 0) {
      throw new Error(
        'Tidak ditemukan data produk pada file. Pastikan lembar kerja memiliki kolom minimal "Product Name" (Nama Barang) atau "Product Code" (Kode Stok).'
      );
    }

    return items;
  } catch (err: any) {
    console.error('Error reading spreadsheet file:', err);
    throw new Error(err?.message || 'Gagal membaca file spreadsheet. Pastikan format file .xlsx, .xls, atau .csv valid.');
  }
}

/**
 * Parse plain CSV / TSV text or text copied directly from Excel.
 * Exported for backward compatibility and copy-paste support.
 */
export function parseCsvText(
  pastedText: string, 
  defaultLocation = ''
): Partial<InventoryItem>[] {
  const clean = pastedText.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  try {
    // SheetJS can parse CSV/TSV plain string directly
    const workbook = XLSX.read(clean, { type: 'string', raw: false });
    const firstSheetName = workbook.SheetNames[0];
    if (firstSheetName) {
      const sheet = workbook.Sheets[firstSheetName];
      const matrix = XLSX.utils.sheet_to_json(sheet, { 
        header: 1, 
        defval: '',
        blankrows: true
      }) as (string | number | undefined | null)[][];
      
      const res = process2DRows(matrix, defaultLocation);
      if (res.length > 0) return res;
    }
  } catch (err) {
    console.warn('SheetJS text parsing fallback to manual parser:', err);
  }

  // Fallback: manual row splitter (handles commas, semicolons, and tabs)
  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Determine delimiter: tab, semicolon, or comma
  const sample = lines.slice(0, 5).join('\n');
  const tabCount = (sample.match(/\t/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;

  let delimiter = ',';
  if (tabCount > semicolonCount && tabCount > commaCount) delimiter = '\t';
  else if (semicolonCount > commaCount) delimiter = ';';

  const matrix = lines.map(line => {
    // Quick CSV split respecting quotes
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  });

  return process2DRows(matrix, defaultLocation);
}

/**
 * Parse plain text pasted directly from Excel (TSV / CSV)
 */
export function parsePastedExcelText(pastedText: string, defaultLocation = 'Gudang A - Rak 01'): Partial<InventoryItem>[] {
  return parseCsvText(pastedText, defaultLocation);
}
