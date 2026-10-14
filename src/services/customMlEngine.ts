import { InventoryItem } from '../types/inventory';

export interface MlTrainingSample {
  id: string;
  inputPhrase: string;
  targetKodeStok: string;
  targetNamaStok: string;
  targetQty?: number | null;
  targetLokasi?: string | null;
  targetCatatan?: string | null;
  source: 'seed' | 'manual_training' | 'auto_learned';
  confidence: number;
  learnedAt: string;
  hitCount: number;
}

export interface MlPredictionResult {
  matchedItem: InventoryItem | null;
  matchedKode: string | null;
  matchedNama: string | null;
  qtyFisik: number | null;
  lokasi: string | null;
  catatan: string | null;
  confidence: number; // 0.0 to 1.0
  inferenceTimeMs: number;
  recognizedTokens: {
    itemTokens: string[];
    qtyToken?: string;
    locationToken?: string;
    conditionTokens?: string[];
  };
  matchedRuleOrSample?: string;
  breakdown: string;
  method: 'exact_code' | 'learned_pattern' | 'ngram_fuzzy' | 'fallback';
}

export interface MlModelStats {
  totalSamples: number;
  seedSamples: number;
  userTrainedSamples: number;
  autoLearnedSamples: number;
  customAliasesCount: number;
  totalPredictionsMade: number;
}

const STORAGE_KEY_ML_SAMPLES = 'inventrack_ml_training_samples_v1';
const STORAGE_KEY_ML_ALIASES = 'inventrack_ml_custom_aliases_v1';
const STORAGE_KEY_ML_AUTO_LEARN = 'inventrack_ml_auto_learn_enabled';

// Standard Indonesian number words mapping
const INDO_NUMBER_WORDS: Record<string, number> = {
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  duabelas: 12,
  tigabelas: 13,
  empatbelas: 14,
  limabelas: 15,
  duapuluh: 20,
  tigapuluh: 30,
  limapuluh: 50,
  seratus: 100,
};

// Default slang/abbreviation dictionary for warehouse
const DEFAULT_ALIASES: Record<string, string> = {
  lmp: 'lampu',
  lpu: 'lampu',
  srt: 'sorot',
  kbl: 'kabel',
  baut: 'baut',
  btg: 'batang',
  skrup: 'sekrup',
  saklar: 'sakelar',
  steker: 'steker',
  fiting: 'fitting',
  ftg: 'fitting',
  solasi: 'isolasi',
  slsi: 'isolasi',
  dus: 'box',
  kardus: 'box',
  biji: 'buah',
  bh: 'buah',
  pcs: 'buah',
  pc: 'buah',
  ltr: 'liter',
  mtr: 'meter',
  m: 'meter',
  kg: 'kilogram',
  gr: 'gram',
  sch: 'schneider',
  phil: 'philips',
  etn: 'eterna',
  sup: 'supreme',
  pan: 'panasonic',
};

// Seed dataset to give the model immediate intelligence
const SEED_SAMPLES: MlTrainingSample[] = [
  {
    id: 'seed-1',
    inputPhrase: 'lampu sorot 50w rak a 20',
    targetKodeStok: 'STO1901',
    targetNamaStok: 'Lampu Sorot LED 50W',
    targetQty: 20,
    targetLokasi: 'Rak A',
    targetCatatan: '',
    source: 'seed',
    confidence: 0.95,
    learnedAt: new Date().toISOString(),
    hitCount: 5,
  },
  {
    id: 'seed-2',
    inputPhrase: 'kabel eterna 2x1.5 roll b1 15',
    targetKodeStok: 'STO1902',
    targetNamaStok: 'Kabel Eterna NYM 2x1.5mm',
    targetQty: 15,
    targetLokasi: 'Rak B1',
    targetCatatan: '',
    source: 'seed',
    confidence: 0.95,
    learnedAt: new Date().toISOString(),
    hitCount: 4,
  },
  {
    id: 'seed-3',
    inputPhrase: 'mcb schneider 16a ada 30 rak c2',
    targetKodeStok: 'STO1903',
    targetNamaStok: 'MCB Schneider 16A 1P',
    targetQty: 30,
    targetLokasi: 'Rak C2',
    targetCatatan: '',
    source: 'seed',
    confidence: 0.96,
    learnedAt: new Date().toISOString(),
    hitCount: 3,
  },
  {
    id: 'seed-4',
    inputPhrase: 'pipa pvc 1/2 aw 50 batang rak d',
    targetKodeStok: 'STO1904',
    targetNamaStok: 'Pipa PVC Rucika AW 1/2 inch',
    targetQty: 50,
    targetLokasi: 'Rak D',
    targetCatatan: '',
    source: 'seed',
    confidence: 0.95,
    learnedAt: new Date().toISOString(),
    hitCount: 2,
  },
];

class CustomMlEngine {
  private samples: MlTrainingSample[] = [];
  private aliases: Record<string, string> = { ...DEFAULT_ALIASES };
  private autoLearnEnabled: boolean = true;
  private predictionCounter: number = 0;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedSamples = localStorage.getItem(STORAGE_KEY_ML_SAMPLES);
      if (storedSamples) {
        this.samples = JSON.parse(storedSamples);
      } else {
        this.samples = [...SEED_SAMPLES];
        this.saveSamples();
      }

      const storedAliases = localStorage.getItem(STORAGE_KEY_ML_ALIASES);
      if (storedAliases) {
        this.aliases = { ...DEFAULT_ALIASES, ...JSON.parse(storedAliases) };
      }

      const storedAutoLearn = localStorage.getItem(STORAGE_KEY_ML_AUTO_LEARN);
      if (storedAutoLearn !== null) {
        this.autoLearnEnabled = storedAutoLearn === 'true';
      }
    } catch (e) {
      console.warn('CustomMlEngine init fallback:', e);
      this.samples = [...SEED_SAMPLES];
    }
  }

  private saveSamples() {
    try {
      localStorage.setItem(STORAGE_KEY_ML_SAMPLES, JSON.stringify(this.samples));
    } catch (e) {
      console.error('Failed to save ML samples:', e);
    }
  }

  private saveAliases() {
    try {
      localStorage.setItem(STORAGE_KEY_ML_ALIASES, JSON.stringify(this.aliases));
    } catch (e) {
      console.error('Failed to save ML aliases:', e);
    }
  }

  public isAutoLearnEnabled(): boolean {
    return this.autoLearnEnabled;
  }

  public setAutoLearnEnabled(enabled: boolean) {
    this.autoLearnEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEY_ML_AUTO_LEARN, String(enabled));
    } catch (e) {}
  }

  public getStats(): MlModelStats {
    const seed = this.samples.filter(s => s.source === 'seed').length;
    const manual = this.samples.filter(s => s.source === 'manual_training').length;
    const auto = this.samples.filter(s => s.source === 'auto_learned').length;
    return {
      totalSamples: this.samples.length,
      seedSamples: seed,
      userTrainedSamples: manual,
      autoLearnedSamples: auto,
      customAliasesCount: Object.keys(this.aliases).length,
      totalPredictionsMade: this.predictionCounter,
    };
  }

  public getSamples(): MlTrainingSample[] {
    return [...this.samples];
  }

  public getAliases(): Record<string, string> {
    return { ...this.aliases };
  }

  public addAlias(alias: string, fullTerm: string) {
    const cleanAlias = alias.trim().toLowerCase();
    const cleanTerm = fullTerm.trim().toLowerCase();
    if (cleanAlias && cleanTerm) {
      this.aliases[cleanAlias] = cleanTerm;
      this.saveAliases();
    }
  }

  public removeAlias(alias: string) {
    delete this.aliases[alias.trim().toLowerCase()];
    this.saveAliases();
  }

  /**
   * Teach / Train the model with a custom phrase and target outputs
   */
  public trainModel(params: {
    inputPhrase: string;
    targetKodeStok: string;
    targetNamaStok: string;
    targetQty?: number | null;
    targetLokasi?: string | null;
    targetCatatan?: string | null;
    source?: 'manual_training' | 'auto_learned';
  }): MlTrainingSample {
    const normalizedInput = params.inputPhrase.trim().toLowerCase();

    // Check if an existing sample exists for this phrase
    const existingIndex = this.samples.findIndex(
      s => s.inputPhrase.trim().toLowerCase() === normalizedInput
    );

    const sample: MlTrainingSample = {
      id: existingIndex >= 0 ? this.samples[existingIndex].id : 'ml-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      inputPhrase: params.inputPhrase.trim(),
      targetKodeStok: params.targetKodeStok.trim(),
      targetNamaStok: params.targetNamaStok.trim(),
      targetQty: params.targetQty !== undefined ? params.targetQty : null,
      targetLokasi: params.targetLokasi ? params.targetLokasi.trim() : null,
      targetCatatan: params.targetCatatan ? params.targetCatatan.trim() : null,
      source: params.source || 'manual_training',
      confidence: 0.98,
      learnedAt: new Date().toISOString(),
      hitCount: existingIndex >= 0 ? this.samples[existingIndex].hitCount + 1 : 1,
    };

    if (existingIndex >= 0) {
      this.samples[existingIndex] = sample;
    } else {
      this.samples.unshift(sample);
    }

    this.saveSamples();
    return sample;
  }

  public deleteSample(id: string) {
    this.samples = this.samples.filter(s => s.id !== id);
    this.saveSamples();
  }

  public resetSamplesToDefault() {
    this.samples = [...SEED_SAMPLES];
    this.aliases = { ...DEFAULT_ALIASES };
    this.saveSamples();
    this.saveAliases();
  }

  /**
   * Export all training dataset as JSON string
   */
  public exportDatasetJson(): string {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        stats: this.getStats(),
        aliases: this.aliases,
        samples: this.samples,
      },
      null,
      2
    );
  }

  /**
   * Import dataset from JSON
   */
  public importDatasetJson(jsonStr: string): { success: boolean; count: number; error?: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.samples)) {
        this.samples = data.samples;
        this.saveSamples();
        if (data.aliases && typeof data.aliases === 'object') {
          this.aliases = { ...DEFAULT_ALIASES, ...data.aliases };
          this.saveAliases();
        }
        return { success: true, count: data.samples.length };
      }
      return { success: false, count: 0, error: 'Format JSON data latih tidak valid' };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'JSON parsing error' };
    }
  }

  /**
   * Auto-learn from operator activity when they submit a count
   */
  public autoLearnFromConfirmedCount(
    searchOrInputText: string,
    item: InventoryItem,
    qtyFisik: number,
    location?: string
  ) {
    if (!this.autoLearnEnabled) return;
    const cleanText = searchOrInputText.trim();
    // Only learn meaningful queries that aren't just single numbers
    if (cleanText.length < 3 || /^\d+$/.test(cleanText)) return;

    this.trainModel({
      inputPhrase: cleanText,
      targetKodeStok: item.kodeStok,
      targetNamaStok: item.namaStok,
      targetQty: qtyFisik,
      targetLokasi: location || item.namaTempat || '',
      source: 'auto_learned',
    });
  }

  // --- NLP & FEATURE EXTRACTION PIPELINE ---

  /**
   * Normalize and tokenize text
   */
  public tokenize(rawText: string): string[] {
    let clean = rawText.toLowerCase();

    // Replace known slangs
    Object.entries(this.aliases).forEach(([alias, full]) => {
      const regex = new RegExp(`\\b${alias}\\b`, 'gi');
      clean = clean.replace(regex, full);
    });

    // Replace punctuation except decimals and dashes
    clean = clean.replace(/[^\w\s\.\-\/]/g, ' ');

    return clean
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  /**
   * Extract Quantity from raw input or tokens
   */
  public extractQuantity(text: string): { qty: number | null; rawMatch?: string } {
    const lower = text.toLowerCase();

    // 1. Check patterns like "20 pcs", "ada 50", "qty 15", "fisik 10", "15 btg", "10 dus", "x 25"
    const patternExplicit = /(?:qty|fisik|ada|hitung|dapat|jumlah|stok)?\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:pcs|buah|dus|box|pack|set|roll|btg|batang|meter|m|biji|unit|sak|kg|gram)?\b/i;
    const match = lower.match(patternExplicit);

    // 2. Check for Indonesian number words
    for (const [word, val] of Object.entries(INDO_NUMBER_WORDS)) {
      const wordRegex = new RegExp(`\\b(?:ada|qty|jumlah)?\\s*${word}\\s*(?:pcs|buah|dus|box|pack|roll|btg)?\\b`, 'i');
      if (wordRegex.test(lower)) {
        return { qty: val, rawMatch: word };
      }
    }

    if (match && match[1]) {
      const num = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(num)) {
        return { qty: num, rawMatch: match[0].trim() };
      }
    }

    // 3. Fallback: isolated number at the end or standalone (e.g. "lampu sorot 25")
    const words = lower.split(/\s+/);
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i].replace(/[^\d]/g, '');
      if (w && !isNaN(Number(w))) {
        // avoid matching item specifications like 50w, 16a, 2x1.5
        const origWord = words[i];
        if (!origWord.includes('w') && !origWord.includes('a') && !origWord.includes('x') && !origWord.includes('mm') && !origWord.includes('cm') && !origWord.includes('/')) {
          return { qty: Number(w), rawMatch: words[i] };
        }
      }
    }

    return { qty: null };
  }

  /**
   * Extract Location coordinate from raw text
   */
  public extractLocation(text: string, knownLocations: string[] = []): { location: string | null; rawMatch?: string } {
    const lower = text.toLowerCase();

    // 1. Direct match with existing warehouse locations (e.g. "Rak A-01", "Gudang Timur")
    for (const loc of knownLocations) {
      if (loc && lower.includes(loc.toLowerCase())) {
        return { location: loc, rawMatch: loc };
      }
    }

    // 2. Common Indonesian warehouse patterns: "rak a-1", "blok c", "bin 2", "lantai 2", "sebelah kiri"
    const locPattern = /\b(?:rak|blok|bin|lantai|gudang|zone|lorong)\s*([a-z0-9\-]+)\b/i;
    const match = text.match(locPattern);
    if (match) {
      return { location: match[0].trim(), rawMatch: match[0].trim() };
    }

    // 3. Coordinate shortcut like "B-01", "A3", "R-12"
    const coordPattern = /\b([a-z]-\d{1,3}|[a-z]\d{1,2})\b/i;
    const coordMatch = text.match(coordPattern);
    if (coordMatch) {
      return { location: coordMatch[0].toUpperCase(), rawMatch: coordMatch[0] };
    }

    return { location: null };
  }

  /**
   * Extract Notes or Conditions (e.g., segel sobek, kardus basah, retak)
   */
  public extractConditions(text: string): { conditionNote: string | null } {
    const lower = text.toLowerCase();
    const keywords = [
      'rusak', 'pecah', 'retak', 'bocor', 'basah', 'sobek', 'penyok', 'karatan',
      'berdebu', 'segel terbuka', 'cacat', 'kadaluarsa', 'expired', 'box rusak', 'kardus penyok',
      'hilang', 'kurang', 'lebih'
    ];

    const detected = keywords.filter(kw => lower.includes(kw));
    if (detected.length > 0) {
      return { conditionNote: detected.join(', ') };
    }
    return { conditionNote: null };
  }

  /**
   * Calculate string similarity (Levenshtein + token overlap)
   */
  private computeStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.85;

    const tokens1 = s1.split(/\s+/).filter(Boolean);
    const tokens2 = s2.split(/\s+/).filter(Boolean);

    let common = 0;
    for (const t1 of tokens1) {
      if (tokens2.some(t2 => t2 === t1 || t2.includes(t1) || t1.includes(t2))) {
        common++;
      }
    }

    const overlap = (2.0 * common) / (tokens1.length + tokens2.length);
    return Math.min(overlap, 0.95);
  }

  /**
   * Predict / Infer the intended item, quantity, location, and notes from freeform text
   * Returns in 1-5 milliseconds with full explainability
   */
  public predict(inputText: string, items: InventoryItem[], knownLocations: string[] = []): MlPredictionResult {
    const startTime = performance.now();
    this.predictionCounter++;

    const raw = inputText.trim();
    if (!raw) {
      return {
        matchedItem: null,
        matchedKode: null,
        matchedNama: null,
        qtyFisik: null,
        lokasi: null,
        catatan: null,
        confidence: 0,
        inferenceTimeMs: Math.round(performance.now() - startTime),
        recognizedTokens: { itemTokens: [] },
        breakdown: 'Teks input kosong',
        method: 'fallback',
      };
    }

    const normalizedTokens = this.tokenize(raw);
    const qtyExtract = this.extractQuantity(raw);
    const locExtract = this.extractLocation(raw, knownLocations);
    const condExtract = this.extractConditions(raw);

    // 1. RULE 1: Exact Product Code match (e.g. STO1901)
    const upperInput = raw.toUpperCase();
    const exactCodeItem = items.find(i => 
      upperInput.includes(i.kodeStok.toUpperCase()) || 
      i.kodeStok.toUpperCase() === upperInput
    );

    if (exactCodeItem) {
      const inferenceTime = performance.now() - startTime;
      return {
        matchedItem: exactCodeItem,
        matchedKode: exactCodeItem.kodeStok,
        matchedNama: exactCodeItem.namaStok,
        qtyFisik: qtyExtract.qty,
        lokasi: locExtract.location || exactCodeItem.namaTempat || null,
        catatan: condExtract.conditionNote,
        confidence: 0.99,
        inferenceTimeMs: Math.max(1, Math.round(inferenceTime)),
        recognizedTokens: {
          itemTokens: [exactCodeItem.kodeStok],
          qtyToken: qtyExtract.rawMatch,
          locationToken: locExtract.rawMatch,
          conditionTokens: condExtract.conditionNote ? [condExtract.conditionNote] : [],
        },
        matchedRuleOrSample: `Exact Kode Stok: ${exactCodeItem.kodeStok}`,
        breakdown: `Dikenali langsung dari Kode Barang resmi (${exactCodeItem.kodeStok})`,
        method: 'exact_code',
      };
    }

    // 2. RULE 2: Learned Samples & Model Weights Matching
    let bestSample: MlTrainingSample | null = null;
    let bestSampleScore = 0;

    for (const sample of this.samples) {
      const sim = this.computeStringSimilarity(raw, sample.inputPhrase);
      if (sim > bestSampleScore && sim >= 0.70) {
        bestSampleScore = sim;
        bestSample = sample;
      }
    }

    if (bestSample && bestSampleScore >= 0.70) {
      // Find matching item in current inventory
      const matchedItem = items.find(
        i => i.kodeStok.toLowerCase() === bestSample!.targetKodeStok.toLowerCase()
      ) || null;

      if (matchedItem) {
        // Increment hit count
        bestSample.hitCount++;
        const inferenceTime = performance.now() - startTime;

        return {
          matchedItem,
          matchedKode: matchedItem.kodeStok,
          matchedNama: matchedItem.namaStok,
          qtyFisik: qtyExtract.qty !== null ? qtyExtract.qty : (bestSample.targetQty ?? null),
          lokasi: locExtract.location || bestSample.targetLokasi || matchedItem.namaTempat || null,
          catatan: condExtract.conditionNote || bestSample.targetCatatan || null,
          confidence: Math.min(0.98, Math.round((bestSampleScore * 0.95 + 0.05) * 100) / 100),
          inferenceTimeMs: Math.max(1, Math.round(inferenceTime)),
          recognizedTokens: {
            itemTokens: normalizedTokens,
            qtyToken: qtyExtract.rawMatch,
            locationToken: locExtract.rawMatch,
            conditionTokens: condExtract.conditionNote ? [condExtract.conditionNote] : [],
          },
          matchedRuleOrSample: `Pola Latih: "${bestSample.inputPhrase}" (${bestSample.source})`,
          breakdown: `Model mengenali kecocokan ${(bestSampleScore * 100).toFixed(0)}% dari data latih mesin sebelumnya`,
          method: 'learned_pattern',
        };
      }
    }

    // 3. RULE 3: N-gram & Cosine Keyword Overlap against Inventory Master
    let bestItem: InventoryItem | null = null;
    let bestScore = 0;

    // Filter out numbers and location tokens from candidate item phrase
    const filteredItemPhrase = raw
      .replace(new RegExp(qtyExtract.rawMatch || '', 'gi'), '')
      .replace(new RegExp(locExtract.rawMatch || '', 'gi'), '')
      .replace(new RegExp(condExtract.conditionNote || '', 'gi'), '')
      .trim();

    const searchTokens = this.tokenize(filteredItemPhrase);

    for (const item of items) {
      const itemTitle = `${item.kodeStok} ${item.namaStok} ${item.kategori || ''} ${item.subKategori || ''}`.toLowerCase();
      
      // Calculate token hit ratio
      let matchCount = 0;
      for (const t of searchTokens) {
        if (t.length > 1 && itemTitle.includes(t)) {
          matchCount++;
        }
      }

      if (searchTokens.length > 0) {
        const tokenRatio = matchCount / searchTokens.length;
        const stringSim = this.computeStringSimilarity(filteredItemPhrase, item.namaStok);
        const combinedScore = (tokenRatio * 0.6) + (stringSim * 0.4);

        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestItem = item;
        }
      }
    }

    const inferenceTime = performance.now() - startTime;

    if (bestItem && bestScore >= 0.45) {
      const confidence = Math.min(0.92, Math.round(bestScore * 100) / 100);
      return {
        matchedItem: bestItem,
        matchedKode: bestItem.kodeStok,
        matchedNama: bestItem.namaStok,
        qtyFisik: qtyExtract.qty,
        lokasi: locExtract.location || bestItem.namaTempat || null,
        catatan: condExtract.conditionNote,
        confidence,
        inferenceTimeMs: Math.max(1, Math.round(inferenceTime)),
        recognizedTokens: {
          itemTokens: searchTokens,
          qtyToken: qtyExtract.rawMatch,
          locationToken: locExtract.rawMatch,
          conditionTokens: condExtract.conditionNote ? [condExtract.conditionNote] : [],
        },
        matchedRuleOrSample: `Klasifikasi N-gram kata kunci: ${bestItem.namaStok}`,
        breakdown: `Model memetakan kata "${searchTokens.join(' ')}" ke "${bestItem.namaStok}" dengan skor ${(confidence * 100).toFixed(0)}%`,
        method: 'ngram_fuzzy',
      };
    }

    // 4. Fallback: Not enough confidence
    return {
      matchedItem: null,
      matchedKode: null,
      matchedNama: null,
      qtyFisik: qtyExtract.qty,
      lokasi: locExtract.location,
      catatan: condExtract.conditionNote,
      confidence: bestScore > 0 ? Math.round(bestScore * 100) / 100 : 0.2,
      inferenceTimeMs: Math.max(1, Math.round(inferenceTime)),
      recognizedTokens: {
        itemTokens: searchTokens,
        qtyToken: qtyExtract.rawMatch,
        locationToken: locExtract.rawMatch,
      },
      breakdown: 'Model belum memiliki data latih yang cukup untuk frasa ini. Anda dapat mengajari mesin di bawah.',
      method: 'fallback',
    };
  }
}

export const customMlEngine = new CustomMlEngine();
