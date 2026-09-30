import { InventoryItem, InputLog, UserAccount, AppSettings } from '../types/inventory';

export interface StorageMetricDetail {
  collectionName: string;
  label: string;
  documentCount: number;
  totalBytes: number;
  formattedSize: string;
  percentageOfTotalUsed: number;
  detailInfo?: string;
}

export interface PhotoStorageAnalysis {
  totalItems: number;
  itemsWithPhoto: number;
  itemsWithoutPhoto: number;
  embeddedBase64Count: number;
  embeddedBase64Bytes: number;
  externalUrlCount: number;
  externalUrlBytes: number;
  formattedBase64Size: string;
}

export interface FirebaseStorageReport {
  timestamp: string;
  totalBytesUsed: number;
  totalMegaBytesUsed: number;
  formattedTotalUsed: string;
  quotaLimitBytes: number; // 1 GiB = 1073741824 bytes
  quotaLimitMegaBytes: number; // 1024 MB
  formattedQuotaLimit: string;
  remainingBytes: number;
  remainingMegaBytes: number;
  formattedRemaining: string;
  percentUsed: number;
  percentRemaining: number;
  status: 'optimal' | 'moderate' | 'warning' | 'critical';
  details: StorageMetricDetail[];
  photoAnalysis: PhotoStorageAnalysis;
  estimatedRemainingItems: number;
  averageItemSizeBytes: number;
  formattedAvgItemSize: string;
}

// 1 GiB in Bytes (Firebase Firestore Spark Free Tier Quota)
export const FIRESTORE_FREE_QUOTA_BYTES = 1024 * 1024 * 1024; // 1,073,741,824 bytes (1 GiB)
export const FIRESTORE_FREE_QUOTA_MB = 1024; // 1,024 MB

const encoder = new TextEncoder();

/**
 * Calculates accurate Firestore document size in bytes
 * based on Google Cloud Firestore storage calculation specifications:
 * - 32 bytes document metadata overhead
 * - documentId length + 16 bytes
 * - Each field name length + 1 byte
 * - Values: String (UTF-8 length + 1), Number (8 bytes), Boolean (1 byte), etc.
 */
export function calculateDocumentSize(docId: string, data: Record<string, any>): number {
  let size = 32; // Document metadata overhead
  size += encoder.encode(docId).length + 16; // Document key overhead

  function calculateValueSize(val: any): number {
    if (val === null || val === undefined) return 1;
    if (typeof val === 'boolean') return 1;
    if (typeof val === 'number') return 8;
    if (typeof val === 'string') {
      return encoder.encode(val).length + 1;
    }
    if (Array.isArray(val)) {
      return val.reduce((acc, item) => acc + calculateValueSize(item), 0);
    }
    if (typeof val === 'object') {
      let objSize = 0;
      for (const [k, v] of Object.entries(val)) {
        objSize += encoder.encode(k).length + 1 + calculateValueSize(v);
      }
      return objSize;
    }
    return 8;
  }

  for (const [key, val] of Object.entries(data)) {
    size += encoder.encode(key).length + 1;
    size += calculateValueSize(val);
  }

  return size;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(3)} GB`;
}

/**
 * Computes complete Firebase Storage & Quota report
 */
export function generateFirebaseStorageReport(
  items: InventoryItem[],
  logs: InputLog[],
  users: UserAccount[],
  settings?: AppSettings | null
): FirebaseStorageReport {
  // 1. Calculate Items size & analyze photos
  let itemsBytes = 0;
  let embeddedBase64Count = 0;
  let embeddedBase64Bytes = 0;
  let externalUrlCount = 0;
  let externalUrlBytes = 0;
  let itemsWithPhoto = 0;

  items.forEach(item => {
    const docSize = calculateDocumentSize(item.id, item);
    itemsBytes += docSize;

    if (item.gambarUrl) {
      itemsWithPhoto++;
      if (item.gambarUrl.startsWith('data:image/')) {
        embeddedBase64Count++;
        const photoBytes = encoder.encode(item.gambarUrl).length;
        embeddedBase64Bytes += photoBytes;
      } else {
        externalUrlCount++;
        const urlBytes = encoder.encode(item.gambarUrl).length;
        externalUrlBytes += urlBytes;
      }
    }
  });

  // 2. Calculate Logs size
  let logsBytes = 0;
  logs.forEach(log => {
    logsBytes += calculateDocumentSize(log.id, log);
  });

  // 3. Calculate Users size
  let usersBytes = 0;
  users.forEach(user => {
    usersBytes += calculateDocumentSize(user.id, user);
  });

  // 4. Calculate Settings size
  let settingsBytes = 0;
  if (settings) {
    settingsBytes = calculateDocumentSize('global_config', settings);
  } else {
    settingsBytes = 512; // estimated
  }

  const totalBytesUsed = itemsBytes + logsBytes + usersBytes + settingsBytes;
  const totalMegaBytesUsed = totalBytesUsed / (1024 * 1024);
  const remainingBytes = Math.max(0, FIRESTORE_FREE_QUOTA_BYTES - totalBytesUsed);
  const remainingMegaBytes = remainingBytes / (1024 * 1024);

  const percentUsed = Math.min(100, (totalBytesUsed / FIRESTORE_FREE_QUOTA_BYTES) * 100);
  const percentRemaining = Math.max(0, 100 - percentUsed);

  let status: 'optimal' | 'moderate' | 'warning' | 'critical' = 'optimal';
  if (percentUsed > 90) status = 'critical';
  else if (percentUsed > 75) status = 'warning';
  else if (percentUsed > 40) status = 'moderate';

  const averageItemSizeBytes = items.length > 0 ? Math.round(itemsBytes / items.length) : 4096;
  const estimatedRemainingItems = Math.floor(remainingBytes / Math.max(averageItemSizeBytes, 2048));

  const details: StorageMetricDetail[] = [
    {
      collectionName: 'inventory_items',
      label: 'Data Master Barang & Opname',
      documentCount: items.length,
      totalBytes: itemsBytes,
      formattedSize: formatBytes(itemsBytes),
      percentageOfTotalUsed: totalBytesUsed > 0 ? (itemsBytes / totalBytesUsed) * 100 : 0,
      detailInfo: `${items.length} produk tersimpan (${itemsWithPhoto} memiliki foto)`
    },
    {
      collectionName: 'activity_logs',
      label: 'Riwayat & Log Penginputan',
      documentCount: logs.length,
      totalBytes: logsBytes,
      formattedSize: formatBytes(logsBytes),
      percentageOfTotalUsed: totalBytesUsed > 0 ? (logsBytes / totalBytesUsed) * 100 : 0,
      detailInfo: `${logs.length} riwayat input fisik & perubahan`
    },
    {
      collectionName: 'user_accounts',
      label: 'Akun Pengguna (Petugas & Admin)',
      documentCount: users.length,
      totalBytes: usersBytes,
      formattedSize: formatBytes(usersBytes),
      percentageOfTotalUsed: totalBytesUsed > 0 ? (usersBytes / totalBytesUsed) * 100 : 0,
      detailInfo: `${users.length} akun terdaftar`
    },
    {
      collectionName: 'app_settings',
      label: 'Konfigurasi Sistem & Lokasi Rak',
      documentCount: 1,
      totalBytes: settingsBytes,
      formattedSize: formatBytes(settingsBytes),
      percentageOfTotalUsed: totalBytesUsed > 0 ? (settingsBytes / totalBytesUsed) * 100 : 0,
      detailInfo: 'Daftar master lokasi lantai & preferensi'
    }
  ];

  const photoAnalysis: PhotoStorageAnalysis = {
    totalItems: items.length,
    itemsWithPhoto,
    itemsWithoutPhoto: items.length - itemsWithPhoto,
    embeddedBase64Count,
    embeddedBase64Bytes,
    externalUrlCount,
    externalUrlBytes,
    formattedBase64Size: formatBytes(embeddedBase64Bytes)
  };

  return {
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    totalBytesUsed,
    totalMegaBytesUsed,
    formattedTotalUsed: formatBytes(totalBytesUsed),
    quotaLimitBytes: FIRESTORE_FREE_QUOTA_BYTES,
    quotaLimitMegaBytes: FIRESTORE_FREE_QUOTA_MB,
    formattedQuotaLimit: '1,00 GB (1.024 MB)',
    remainingBytes,
    remainingMegaBytes,
    formattedRemaining: formatBytes(remainingBytes),
    percentUsed: parseFloat(percentUsed.toFixed(3)),
    percentRemaining: parseFloat(percentRemaining.toFixed(3)),
    status,
    details,
    photoAnalysis,
    estimatedRemainingItems,
    averageItemSizeBytes,
    formattedAvgItemSize: formatBytes(averageItemSizeBytes)
  };
}
