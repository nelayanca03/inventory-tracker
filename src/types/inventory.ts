export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'pending' | 'rejected';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface InventoryItem {
  id: string;
  no?: number;
  kodeStok: string; // Product Code
  namaStok: string; // Product Name
  namaTempat: string; // Lokasi Rak / Bin
  kategori: string; // Category
  subKategori?: string; // Sub Category (from user template)
  qtySistem: number; // Opname Qty (Stok Buku)
  qtyFisik: number; // Hasil Hitung Fisik Lapangan
  opnameValue?: number; // Opname Value (from user template)
  selisih: number;
  satuan: string; // Unit
  kondisi: 'Baik' | 'Rusak' | 'Kadaluarsa' | 'Perlu Cek';
  gambarUrl?: string; // Foto resmi dari admin
  petugas: string;
  catatan?: string;
  isCounted?: boolean;
  lastCountedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'table' | 'card';

export interface FilterState {
  searchTerm: string;
  tempat: string;
  kategori: string;
  statusSelisih: 'all' | 'selisih' | 'sesuai' | 'minus' | 'plus';
  kondisi: string;
  sortBy: 'kodeStok' | 'namaStok' | 'namaTempat' | 'selisih' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface AppSettings {
  googleSheetsWebhookUrl: string;
  autoSyncWebhook: boolean;
  defaultPetugas: string;
  defaultTempat: string;
  defaultSatuan: string;
  availableLocations: string[];
}
