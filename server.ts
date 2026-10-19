import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure assets/images directory exists and is statically served
const imagesDir = path.resolve(__dirname, 'src/assets/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
app.use('/assets/images', express.static(imagesDir));
app.use('/src/assets/images', express.static(imagesDir));

// Endpoint: Upload attached image to assets/images and return web URL
app.post('/api/upload-image', (req: Request, res: Response) => {
  try {
    const { imageBase64, filename, kodeStok } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'Data base64 gambar diperlukan' });
      return;
    }

    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    let ext = 'jpg';
    let rawBase64 = imageBase64;
    if (matches && matches.length === 3) {
      ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      rawBase64 = matches[2];
    } else {
      rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    const safeKode = (kodeStok || 'item').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = filename 
      ? filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      : `${safeKode}_${Date.now()}.${ext}`;

    const finalFilename = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`;
    const targetPath = path.join(imagesDir, finalFilename);

    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/assets/images/${finalFilename}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: finalFilename,
      bytes: buffer.length,
    });
  } catch (err: any) {
    console.error('Error in /api/upload-image:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan foto ke folder assets/images' });
  }
});

// Endpoint: Delete image file from assets/images
app.post('/api/delete-image', (req: Request, res: Response) => {
  try {
    const { url, filename } = req.body;
    const targetFilename = filename || (url ? path.basename(url) : null);
    if (!targetFilename) {
      res.status(400).json({ error: 'Nama file gambar tidak valid' });
      return;
    }

    const safeFile = path.basename(targetFilename);
    const targetPath = path.join(imagesDir, safeFile);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    res.json({ success: true, message: `Foto ${safeFile} berhasil dihapus dari folder assets/images` });
  } catch (err: any) {
    console.error('Error in /api/delete-image:', err);
    res.status(500).json({ error: err.message || 'Gagal menghapus file foto' });
  }
});

// Initialize Google Gemini SDK on the server
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient model caller: tries flagship gemini-3.8-flash with 5s timeout, and auto-falls back to ultra-fast gemini-3.1-flash-lite
async function generateGeminiContent(params: { contents: any; config?: any }) {
  const tryModel = (model: string) =>
    ai.models.generateContent({
      model,
      contents: params.contents,
      config: params.config,
    });

  const withTimeout = (promise: Promise<any>, ms: number) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      ),
    ]);

  try {
    return await withTimeout(tryModel('gemini-3.8-flash'), 5000);
  } catch (err: any) {
    console.warn('Gemini 3.8-flash timeout/error, auto falling back to gemini-3.1-flash-lite:', err.message);
    return await tryModel('gemini-3.1-flash-lite');
  }
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!apiKey,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint 1: Smart Parse Voice/Text for Inventory Input
app.post('/api/ai/smart-parse-input', async (req: Request, res: Response) => {
  try {
    const { text, itemsListSummary } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Teks instruksi input harus disertakan.' });
      return;
    }

    const prompt = `Anda adalah asisten AI cerdas untuk aplikasi input opname gudang (InvenTrack).
Tugas Anda adalah mengekstrak data pencatatan stok dari ucapan atau teks operator berikut:
"${text}"

Daftar ringkas barang yang terdaftar di sistem (sebagai referensi pencocokan):
${JSON.stringify((itemsListSummary || []).slice(0, 150))}

Instruksi Ekstraksi:
1. Temukan kode barang (contoh: STO1901) atau nama barang yang paling cocok dari daftar referensi.
2. Temukan jumlah fisik (qtyFisik) yang disebutkan (angka integer). Jika tidak disebutkan jumlah spesifik, kosongkan atau 0.
3. Temukan nama tempat atau lokasi rak (misal: "Rak A", "Gudang Belakang", "Rak B-2").
4. Temukan catatan kondisi atau keterangan tambahan (misal: "kardus penyok", "segel utuh", "posisi atas").
5. Berikan penjelasan singkat (1 kalimat ramah dalam Bahasa Indonesia).

Kembalikan jawaban HANYA berupa JSON valid dengan struktur:
{
  "matchedKode": string atau null,
  "matchedNama": string atau null,
  "qtyFisik": number atau null,
  "lokasi": string atau null,
  "catatan": string atau null,
  "confidence": number (0 sampai 1),
  "penjelasan": string
}`;

    const response = await generateGeminiContent({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(outputText);
    } catch {
      parsed = { penjelasan: outputText };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in smart-parse-input:', error);
    res.status(500).json({ error: error.message || 'Gagal memproses teks dengan AI' });
  }
});

// Endpoint 2: Identify Item from Photo / Camera snapshot
app.post('/api/ai/identify-photo', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', candidateItemsSummary } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Gambar tidak ditemukan.' });
      return;
    }

    // Clean base64 prefix if provided
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const candidatesText = (candidateItemsSummary || []).slice(0, 200).map(
      (c: any) => `${c.kodeStok}: ${c.namaStok}`
    ).join('\n');

    const promptText = `Perhatikan foto produk atau kemasan/label ini dengan seksama.
Tugas Anda adalah mengidentifikasi barang inventaris ini dan mencocokkannya dengan salah satu item dari katalog gudang berikut:

Daftar Katalog Barang Gudang:
${candidatesText}

Instruksi:
1. Analisis objek foto: jenis barang, bentuk, warna, tulisan/kode/ukuran pada kemasan atau stiker jika ada.
2. Cocokkan dengan item yang paling mungkin dari daftar katalog di atas.
3. Berikan skor keyakinan (confidence: 0.0 sampai 1.0).
4. Berikan alasan visual singkat (maksimal 2 kalimat) mengapa barang ini cocok.

Kembalikan HANYA format JSON valid:
{
  "matchedKode": string,
  "matchedNama": string,
  "confidence": number,
  "alasan": string,
  "alternatif": [{"kodeStok": string, "namaStok": string, "confidence": number}]
}`;

    const response = await generateGeminiContent({
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    let result = {};
    try {
      result = JSON.parse(outputText);
    } catch {
      result = { alasan: outputText };
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in identify-photo:', error);
    res.status(500).json({ error: error.message || 'Gagal mengidentifikasi foto dengan AI' });
  }
});

// Endpoint 3: Interactive Inventory AI Assistant Chat
app.post('/api/ai/chat-assistant', async (req: Request, res: Response) => {
  try {
    const { messages, inventoryContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Format pesan tidak valid.' });
      return;
    }

    const contextPrompt = `Anda adalah InvenTrack AI — Asisten Cerdas untuk Manajemen Gudang dan Stock Opname.
Anda bertindak ramah, profesional, cepat tanggap, dan sangat membantu operator maupun admin gudang.
Gunakan Bahasa Indonesia yang jelas, ringkas, dan praktis.

Konteks Terkini Gudang:
- Total Master Barang: ${inventoryContext?.totalItems || 0} barang
- Barang Sudah Dihitung: ${inventoryContext?.countedItems || 0} barang (${inventoryContext?.totalItems ? Math.round(((inventoryContext.countedItems || 0) / inventoryContext.totalItems) * 100) : 0}%)
- Barang Ada Selisih (Fisik vs Sistem): ${inventoryContext?.itemsWithDifference || 0} barang
- Lokasi Rak Terdaftar: ${(inventoryContext?.locations || []).slice(0, 30).join(', ')}
- Contoh Beberapa Barang yang Mengalami Selisih / Perlu Perhatian:
${JSON.stringify((inventoryContext?.sampleDiscrepancies || []).slice(0, 20), null, 2)}

Petunjuk Menjawab:
- Berikan jawaban yang tepat sasaran, ringkas, dan mudah dibaca di mobile/desktop (gunakan bullet point rapi jika ada daftar).
- Jika pengguna menanyakan analisis selisih, sebutkan barang dengan selisih terbesar dan berikan saran audit (misal: cek double input, periksa dus di rak lain, verifikasi dokumen retur/masuk).
- Jangan membuat-buat data di luar konteks yang diberikan.`;

    // Format chat history
    const formattedContents: any[] = [];
    for (const msg of messages) {
      formattedContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const response = await generateGeminiContent({
      contents: formattedContents,
      config: {
        systemInstruction: contextPrompt,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text || '' });
  } catch (error: any) {
    console.error('Error in chat-assistant:', error);
    res.status(500).json({ error: error.message || 'Gagal mendapatkan jawaban dari asisten AI' });
  }
});

// Endpoint 4: Comprehensive Audit & Executive Summary Report
app.post('/api/ai/audit-summary', async (req: Request, res: Response) => {
  try {
    const { itemsSummary } = req.body;
    const prompt = `Buat laporan eksekutif analisis audit stock opname gudang dalam format terstruktur dan profesional.
Data Opname Gudang Saat Ini:
${JSON.stringify(itemsSummary || {}, null, 2)}

Buat analisis yang mencakup:
1. Ringkasan Progres Opname (Berapa % selesai, estimasi waktu).
2. Temuan Utama Selisih (Selisih minus/kehilangan terbesar, selisih plus/lebih fisik).
3. Evaluasi Risiko & Anomali (Contoh: barang fisik 0 padahal sistem banyak, atau barang belum tersentuh).
4. 4 Langkah Rekomendasi Tindakan Audit untuk Manajemen.

Format jawaban dalam JSON:
{
  "ringkasanStatus": string,
  "poinPenting": string[],
  "barangPerluAuditUlang": [{"kodeStok": string, "namaStok": string, "alasan": string, "prioritas": "TINGGI" | "SEDANG" | "RENDAH"}],
  "rekomendasiTindakan": string[]
}`;

    const response = await generateGeminiContent({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let result = {};
    try {
      result = JSON.parse(response.text || '{}');
    } catch {
      result = { ringkasanStatus: response.text || '' };
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in audit-summary:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan laporan audit AI' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server InvenTrack aktif di http://0.0.0.0:${PORT}`);
  });
}

startServer();
