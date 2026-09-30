import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { InventoryItem, AppSettings, UserAccount, InputLog } from '../types/inventory';
import { DEFAULT_SETTINGS } from './storageService';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Critical constraint: validate connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection to Firestore verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or cannot reach Firestore.');
    }
  }
}
testConnection();

// Collection References
const ITEMS_COLLECTION = 'inventory_items';
const SETTINGS_COLLECTION = 'app_settings';
const SETTINGS_DOC_ID = 'global_config';
const USERS_COLLECTION = 'user_accounts';
const LOGS_COLLECTION = 'activity_logs';

/**
 * Real-time subscription to inventory items across all devices
 */
export function subscribeToCloudInventory(
  onUpdate: (items: InventoryItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, ITEMS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as InventoryItem);
      });
      // Sort by 'no' or 'createdAt'
      items.sort((a, b) => (a.no || 0) - (b.no || 0));
      onUpdate(items);
    },
    (err) => {
      console.error('[Firebase] Inventory sync error:', err);
      onError?.(err);
    }
  );
}

/**
 * Save or update single inventory item in Cloud Firestore
 */
export async function saveCloudInventoryItem(item: InventoryItem): Promise<void> {
  const docRef = doc(db, ITEMS_COLLECTION, item.id);
  await setDoc(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Delete inventory item from Cloud Firestore
 */
export async function deleteCloudInventoryItem(itemId: string): Promise<void> {
  const docRef = doc(db, ITEMS_COLLECTION, itemId);
  await deleteDoc(docRef);
}

/**
 * Batch import / replace inventory items
 */
export async function batchSaveCloudInventory(items: InventoryItem[], replaceAll = false): Promise<void> {
  if (replaceAll) {
    // Delete existing items
    const existingSnap = await getDocs(collection(db, ITEMS_COLLECTION));
    const deleteBatch = writeBatch(db);
    existingSnap.docs.forEach((d) => {
      deleteBatch.delete(d.ref);
    });
    await deleteBatch.commit();
  }

  // Write new items in batches of 400 (Firestore limit is 500)
  const chunkSize = 400;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      const ref = doc(db, ITEMS_COLLECTION, item.id);
      batch.set(ref, item);
    });
    await batch.commit();
  }
}

/**
 * Real-time subscription to warehouse settings & available racks
 */
export function subscribeToCloudSettings(
  onUpdate: (settings: AppSettings) => void
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as AppSettings;
      // Auto-migrate if cloud doc still has old demo locations
      if (data.availableLocations && data.availableLocations.includes('Gudang A - Rak 01')) {
        const migrated: AppSettings = {
          ...data,
          availableLocations: DEFAULT_SETTINGS.availableLocations,
          defaultTempat: DEFAULT_SETTINGS.defaultTempat
        };
        setDoc(docRef, migrated).catch(console.error);
        onUpdate(migrated);
      } else {
        onUpdate(data);
      }
    } else {
      // Seed default settings to cloud
      setDoc(docRef, DEFAULT_SETTINGS).catch(console.error);
      onUpdate(DEFAULT_SETTINGS);
    }
  });
}

/**
 * Save settings to Cloud Firestore
 */
export async function saveCloudSettings(settings: AppSettings): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  await setDoc(docRef, settings, { merge: true });
}

/**
 * Real-time subscription to users accounts
 */
export function subscribeToCloudUsers(
  onUpdate: (users: UserAccount[]) => void
): () => void {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const users: UserAccount[] = [];
    snapshot.forEach((docSnap) => {
      users.push(docSnap.data() as UserAccount);
    });
    onUpdate(users);
  });
}

/**
 * Save user account to Cloud Firestore
 */
export async function saveCloudUser(user: UserAccount): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, user.id);
  await setDoc(docRef, user, { merge: true });
}

/**
 * Delete user account from Cloud Firestore
 */
export async function deleteCloudUser(userId: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(docRef);
}

/**
 * Real-time subscription to input activity logs
 */
export function subscribeToCloudLogs(
  onUpdate: (logs: InputLog[]) => void
): () => void {
  const colRef = collection(db, LOGS_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const logs: InputLog[] = [];
    snapshot.forEach((docSnap) => {
      logs.push(docSnap.data() as InputLog);
    });
    // Sort descending by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    onUpdate(logs);
  });
}

/**
 * Save new input log to Cloud Firestore
 */
export async function saveCloudLog(log: InputLog): Promise<void> {
  const docRef = doc(db, LOGS_COLLECTION, log.id);
  await setDoc(docRef, log);
}

/**
 * Clear all activity logs
 */
export async function clearCloudLogs(): Promise<void> {
  const existingSnap = await getDocs(collection(db, LOGS_COLLECTION));
  const deleteBatch = writeBatch(db);
  existingSnap.docs.forEach((d) => {
    deleteBatch.delete(d.ref);
  });
  await deleteBatch.commit();
}

