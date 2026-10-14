import { InventoryItem } from '../types/inventory';

export interface SmartParseResult {
  matchedKode?: string | null;
  matchedNama?: string | null;
  qtyFisik?: number | null;
  lokasi?: string | null;
  catatan?: string | null;
  confidence?: number;
  penjelasan?: string;
  error?: string;
}

export interface PhotoIdentifyResult {
  matchedKode?: string;
  matchedNama?: string;
  confidence?: number;
  alasan?: string;
  alternatif?: Array<{ kodeStok: string; namaStok: string; confidence: number }>;
  error?: string;
}

export interface AuditSummaryResult {
  ringkasanStatus?: string;
  poinPenting?: string[];
  barangPerluAuditUlang?: Array<{
    kodeStok: string;
    namaStok: string;
    alasan: string;
    prioritas: 'TINGGI' | 'SEDANG' | 'RENDAH';
  }>;
  rekomendasiTindakan?: string[];
  error?: string;
}

export const aiService = {
  /**
   * Smart parse input text or voice transcription to extract product, qty, location, notes
   */
  async smartParseInput(text: string, items: InventoryItem[]): Promise<SmartParseResult> {
    try {
      const itemsListSummary = items.slice(0, 150).map(i => ({
        kodeStok: i.kodeStok,
        namaStok: i.namaStok,
        namaTempat: i.namaTempat || '',
      }));

      const res = await fetch('/api/ai/smart-parse-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, itemsListSummary }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('smartParseInput error:', err);
      return {
        confidence: 0,
        penjelasan: 'Gagal memproses via AI: ' + (err.message || 'Koneksi terganggu'),
        error: err.message,
      };
    }
  },

  /**
   * Identify an item from a photo or camera snapshot using Gemini Vision
   */
  async identifyItemFromPhoto(
    imageBase64: string,
    items: InventoryItem[],
    mimeType: string = 'image/jpeg'
  ): Promise<PhotoIdentifyResult> {
    try {
      const candidateItemsSummary = items.slice(0, 180).map(i => ({
        kodeStok: i.kodeStok,
        namaStok: i.namaStok,
      }));

      const res = await fetch('/api/ai/identify-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          candidateItemsSummary,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('identifyItemFromPhoto error:', err);
      return {
        confidence: 0,
        alasan: 'Gagal mengidentifikasi foto: ' + (err.message || 'Koneksi terganggu'),
        error: err.message,
      };
    }
  },

  /**
   * Chat with the InvenTrack AI Assistant
   */
  async chatWithAssistant(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    items: InventoryItem[]
  ): Promise<{ reply: string; error?: string }> {
    try {
      const totalItems = items.length;
      const countedItems = items.filter(i => i.isCounted || (i.qtyFisik !== undefined && i.qtyFisik > 0)).length;
      const discrepancyItems = items.filter(i => (i.selisih ?? 0) !== 0);
      const locations = Array.from(new Set(items.map(i => i.namaTempat).filter(Boolean))) as string[];

      const sampleDiscrepancies = discrepancyItems
        .sort((a, b) => Math.abs(b.selisih ?? 0) - Math.abs(a.selisih ?? 0))
        .slice(0, 20)
        .map(i => ({
          kodeStok: i.kodeStok,
          namaStok: i.namaStok,
          qtySistem: i.qtySistem,
          qtyFisik: i.qtyFisik,
          selisih: i.selisih,
          lokasi: i.namaTempat,
          petugas: i.petugas,
        }));

      const inventoryContext = {
        totalItems,
        countedItems,
        itemsWithDifference: discrepancyItems.length,
        locations,
        sampleDiscrepancies,
      };

      const res = await fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          inventoryContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return { reply: data.reply || 'Maaf, tidak ada tanggapan.' };
    } catch (err: any) {
      console.error('chatWithAssistant error:', err);
      return {
        reply: 'Terjadi kendala saat menghubungi AI: ' + (err.message || 'Koneksi error'),
        error: err.message,
      };
    }
  },

  /**
   * Generate an executive audit summary of current inventory
   */
  async generateAuditSummary(items: InventoryItem[]): Promise<AuditSummaryResult> {
    try {
      const total = items.length;
      const counted = items.filter(i => i.isCounted || (i.qtyFisik !== undefined && i.qtyFisik > 0));
      const withDiff = items.filter(i => (i.selisih ?? 0) !== 0);
      const minusDiff = items.filter(i => (i.selisih ?? 0) < 0);
      const plusDiff = items.filter(i => (i.selisih ?? 0) > 0);

      const itemsSummary = {
        totalBarang: total,
        sudahDihitung: counted.length,
        persentaseSelesai: total > 0 ? Math.round((counted.length / total) * 100) + '%' : '0%',
        jumlahBarangSelisih: withDiff.length,
        totalSelisihMinus: minusDiff.length,
        totalSelisihPlus: plusDiff.length,
        topSelisihMinusTerbesar: minusDiff
          .sort((a, b) => (a.selisih ?? 0) - (b.selisih ?? 0))
          .slice(0, 10)
          .map(i => ({ kode: i.kodeStok, nama: i.namaStok, sistem: i.qtySistem, fisik: i.qtyFisik, selisih: i.selisih, lokasi: i.namaTempat })),
        topSelisihPlusTerbesar: plusDiff
          .sort((a, b) => (b.selisih ?? 0) - (a.selisih ?? 0))
          .slice(0, 10)
          .map(i => ({ kode: i.kodeStok, nama: i.namaStok, sistem: i.qtySistem, fisik: i.qtyFisik, selisih: i.selisih, lokasi: i.namaTempat })),
      };

      const res = await fetch('/api/ai/audit-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemsSummary }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('generateAuditSummary error:', err);
      return {
        ringkasanStatus: 'Gagal membuat laporan audit: ' + (err.message || 'Koneksi error'),
        error: err.message,
      };
    }
  },
};
