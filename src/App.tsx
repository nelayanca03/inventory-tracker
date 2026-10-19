import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { UserSimpleCountView } from './components/UserSimpleCountView';
import { AdminMasterManagement } from './components/AdminMasterManagement';
import { InventoryList } from './components/InventoryList';
import { ActivityLogView } from './components/ActivityLogView';
import { PhotoLightbox } from './components/PhotoLightbox';
import { FirebaseStorageModal } from './components/FirebaseStorageModal';
import { CustomMlStudioModal } from './components/CustomMlStudioModal';
import { InventoryItem, AppSettings, UserAccount, InputLog } from './types/inventory';
import { 
  getStoredItems, 
  saveStoredItems, 
  getStoredSettings, 
  saveStoredSettings, 
  sendToGoogleSheetsWebhook 
} from './services/storageService';
import { 
  subscribeToCloudInventory, 
  saveCloudInventoryItem, 
  saveCloudInventoryItemAtomic,
  deleteCloudInventoryItem, 
  batchSaveCloudInventory,
  subscribeToCloudSettings,
  saveCloudSettings,
  subscribeToCloudLogs,
  saveCloudLog,
  clearCloudLogs
} from './services/firebase';
import { getCurrentSession, logoutUser, getAllUsers } from './services/authService';
import { CheckCircle2, Cloud, Database } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(getCurrentSession());
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InputLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [activeTab, setActiveTab] = useState<'user-count' | 'admin-master' | 'list' | 'logs'>('user-count');
  
  const [lightboxItem, setLightboxItem] = useState<InventoryItem | null>(null);
  const [editingMasterItem, setEditingMasterItem] = useState<InventoryItem | null>(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isMlStudioOpen, setIsMlStudioOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Load items from local storage initially as immediate cache
  useEffect(() => {
    const loaded = getStoredItems();
    setItems(loaded);
  }, []);

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    // 1. Subscribe to real-time inventory updates
    const unsubscribeItems = subscribeToCloudInventory((cloudItems) => {
      if (cloudItems.length > 0) {
        setItems(cloudItems);
        saveStoredItems(cloudItems);
      } else {
        // If cloud database is empty on first setup, seed initial items to cloud
        const initial = getStoredItems();
        if (initial.length > 0) {
          batchSaveCloudInventory(initial, false).catch(console.error);
        }
      }
      setIsCloudConnected(true);
    });

    // 2. Subscribe to real-time warehouse settings & locations
    const unsubscribeSettings = subscribeToCloudSettings((cloudSettings) => {
      setSettings(cloudSettings);
      saveStoredSettings(cloudSettings);
    });

    // 3. Subscribe to real-time input activity logs
    const unsubscribeLogs = subscribeToCloudLogs((cloudLogs) => {
      setLogs(cloudLogs);
    });

    return () => {
      unsubscribeItems();
      unsubscribeSettings();
      unsubscribeLogs();
    };
  }, []);

  // Update default tab based on role when session changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setActiveTab('admin-master');
      } else {
        setActiveTab('user-count');
      }
    }
  }, [currentUser]);

  // Save items whenever items change
  const updateItems = (newItems: InventoryItem[]) => {
    setItems(newItems);
    saveStoredItems(newItems);
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    showToast(`Selamat datang, ${user.fullName}!`);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    showToast('Anda telah keluar dari aplikasi.');
  };

  // Helper to record input activity logs
  const recordInputLog = (
    item: InventoryItem,
    qtySebelum: number,
    actionType: 'input_fisik' | 'quick_adjust' | 'tambah_barang' | 'edit_master'
  ) => {
    const newLog: InputLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      itemId: item.id,
      kodeStok: item.kodeStok,
      namaStok: item.namaStok,
      namaTempat: item.namaTempat || 'Tidak Ditentukan',
      qtySebelum: qtySebelum,
      qtyFisik: item.qtyFisik,
      selisih: item.selisih,
      satuan: item.satuan,
      petugas: item.petugas || currentUser?.fullName || 'Petugas',
      petugasUsername: currentUser?.username,
      catatan: item.catatan || '',
      actionType: actionType,
      timestamp: new Date().toISOString()
    };
    saveCloudLog(newLog).catch(console.error);
  };

  // Handlers for inventory items with real-time cloud sync, atomic concurrency & logging
  const handleSaveItem = async (
    item: InventoryItem, 
    mode: 'replace' | 'accumulate' = 'replace',
    addedQty = 0
  ) => {
    const existing = items.find(i => i.id === item.id);
    const index = items.findIndex(i => i.id === item.id);
    
    let finalItem = item;
    if (mode === 'accumulate' && existing) {
      const newQty = (Number(existing.qtyFisik) || 0) + addedQty;
      finalItem = {
        ...item,
        qtyFisik: newQty,
        selisih: newQty - item.qtySistem,
        isCounted: true,
        updatedAt: new Date().toISOString()
      };
    }

    let updated: InventoryItem[];

    if (index >= 0) {
      updated = [...items];
      updated[index] = finalItem;
      showToast(`Data "${finalItem.namaStok}" berhasil disimpan.`);
      // Record audit log if counted or modified
      const qtySebelum = existing ? existing.qtyFisik : 0;
      recordInputLog(finalItem, qtySebelum, 'input_fisik');
    } else {
      updated = [finalItem, ...items];
      showToast(`Barang master "${finalItem.namaStok}" berhasil ditambahkan.`);
      recordInputLog(finalItem, 0, 'tambah_barang');
    }

    updateItems(updated);

    // Push real-time to Cloud Firestore with atomic transaction guarantee
    saveCloudInventoryItemAtomic(finalItem, mode, addedQty).catch((err) => {
      console.warn('[Firebase] Atomic transaction fallback to standard save:', err);
      saveCloudInventoryItem(finalItem).catch(console.error);
    });

    // Auto-sync to Google Sheets if configured
    if (settings.autoSyncWebhook && settings.googleSheetsWebhookUrl) {
      sendToGoogleSheetsWebhook(settings.googleSheetsWebhookUrl, finalItem).catch(err => {
        console.warn('Auto sync warning:', err);
      });
    }
  };

  const handleResetAllQtyFisik = () => {
    if (items.length === 0) return;
    const now = new Date().toISOString();
    const updatedItems = items.map(item => ({
      ...item,
      qtyFisik: 0,
      selisih: 0 - item.qtySistem,
      isCounted: false,
      updatedAt: now
    }));

    updateItems(updatedItems);
    batchSaveCloudInventory(updatedItems, false).catch(console.error);

    const logId = `log-reset-all-${Date.now()}`;
    const resetLog: InputLog = {
      id: logId,
      itemId: 'ALL',
      kodeStok: 'SEMUA_ITEM',
      namaStok: `Kosongkan Seluruh Qty Fisik (${items.length} Barang)`,
      namaTempat: 'Semua Lokasi',
      qtySebelum: 0,
      qtyFisik: 0,
      selisih: 0,
      satuan: 'item',
      petugas: currentUser?.fullName || 'Admin Gudang',
      timestamp: now,
      actionType: 'input_fisik',
      catatan: 'Pengosongan / reset serentak Qty Fisik seluruh hasil opname'
    };
    setLogs(prev => [resetLog, ...prev]);
    saveCloudLog(resetLog).catch(console.error);

    showToast(`Seluruh Qty Fisik (${items.length} barang) telah berhasil dikosongkan ke 0.`);
  };

  const handleBulkUpdateItems = (updatedItems: InventoryItem[], message: string) => {
    updateItems(updatedItems);
    batchSaveCloudInventory(updatedItems, false).catch(console.error);

    const logId = `log-bulk-${Date.now()}`;
    const bulkLog: InputLog = {
      id: logId,
      itemId: 'BULK',
      kodeStok: 'MASAL',
      namaStok: `Pengaturan Masal: ${message}`,
      namaTempat: 'Masal',
      qtySebelum: 0,
      qtyFisik: 0,
      selisih: 0,
      satuan: 'item',
      petugas: currentUser?.fullName || 'Admin Gudang',
      timestamp: new Date().toISOString(),
      actionType: 'input_fisik',
      catatan: `Pengaturan serentak untuk ${updatedItems.length} barang: ${message}`
    };
    setLogs(prev => [bulkLog, ...prev]);
    saveCloudLog(bulkLog).catch(console.error);

    showToast(`Pengaturan masal berhasil diterapkan (${message}).`);
  };

  const handleDeleteItem = (id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;

    const updated = items.filter(i => i.id !== id);
    updateItems(updated);
    deleteCloudInventoryItem(id).catch(console.error);
    showToast(`Item "${target.namaStok}" telah dihapus.`);
  };

  const handleDeleteMultipleItems = (ids: string[]) => {
    if (ids.length === 0) return;
    const updated = items.filter(i => !ids.includes(i.id));
    updateItems(updated);
    ids.forEach(id => deleteCloudInventoryItem(id).catch(console.error));
    showToast(`${ids.length} data barang berhasil dihapus dari master.`);
  };

  const handleClearAllItems = () => {
    updateItems([]);
    batchSaveCloudInventory([], true).catch(console.error);
    showToast('Seluruh data master barang telah dikosongkan.');
  };

  const handleQuickUpdateQty = (id: string, newQtyFisik: number) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    const qtyFisik = Math.max(0, newQtyFisik);
    const updatedItem: InventoryItem = {
      ...target,
      qtyFisik,
      selisih: qtyFisik - target.qtySistem,
      isCounted: qtyFisik > 0,
      updatedAt: new Date().toISOString()
    };
    handleSaveItem(updatedItem, 'replace');
  };

  const handleUpdateLocations = (newLocations: string[]) => {
    const updatedSettings = {
      ...settings,
      availableLocations: newLocations
    };
    setSettings(updatedSettings);
    saveStoredSettings(updatedSettings);
    saveCloudSettings(updatedSettings).catch(console.error);
    showToast('Daftar lokasi penginputan berhasil diperbarui.');
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    saveCloudSettings(newSettings).catch(console.error);
    showToast('Pengaturan aplikasi berhasil disimpan.');
  };

  const handleImportItems = (newItems: InventoryItem[], replace: boolean) => {
    if (replace) {
      updateItems(newItems);
    } else {
      updateItems([...newItems, ...items]);
    }
    batchSaveCloudInventory(newItems, replace).catch(console.error);
    setActiveTab('admin-master');
    showToast(`Berhasil menambahkan ${newItems.length} produk dari file CSV.`);
  };

  const handleClearLogs = () => {
    clearCloudLogs().catch(console.error);
    setLogs([]);
    showToast('Seluruh riwayat log penginputan telah dibersihkan.');
  };

  const handleResetToDemo = () => {
    localStorage.removeItem('inventrack_items_v1');
    const fresh = getStoredItems();
    setItems(fresh);
    showToast('Data berhasil direset ke contoh awal.');
  };

  // If not logged in, render Auth screen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar 
        currentUser={currentUser}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        items={items} 
        onLogout={handleLogout}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
        onOpenMlStudio={() => setIsMlStudioOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Toast alert */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* ROLE 1: USER / OPERATOR (HANYA MENGINPUT & LIHAT FOTO MASTER) */}
        {/* ============================================================ */}
        {!isAdmin && (
          <UserSimpleCountView
            currentUser={currentUser}
            items={items}
            settings={settings}
            onSaveCount={handleSaveItem}
            onOpenPhotoLightbox={(item) => setLightboxItem(item)}
            onOpenMlStudio={() => setIsMlStudioOpen(true)}
          />
        )}

        {/* ============================================================ */}
        {/* ROLE 2: ADMIN GUDANG (MANAJEMEN MASTER, CSV, USER, & REKAP)  */}
        {/* ============================================================ */}
        {isAdmin && (
          <>
            {/* Tab: Admin Master Management (Nama Barang, Kode Stok, Foto Master, Lokasi, CSV) */}
            {activeTab === 'admin-master' && (
              <AdminMasterManagement
                currentAdmin={currentUser}
                items={items}
                settings={settings}
                initialEditingItem={editingMasterItem}
                onClearEditingItem={() => setEditingMasterItem(null)}
                onSaveItem={handleSaveItem}
                onDeleteItem={handleDeleteItem}
                onDeleteMultipleItems={handleDeleteMultipleItems}
                onClearAllItems={handleClearAllItems}
                onImportItems={handleImportItems}
                onUpdateLocations={handleUpdateLocations}
                onOpenPhotoLightbox={(item) => setLightboxItem(item)}
                onSwitchToUser={() => setActiveTab('user-count')}
                onOpenStorageModal={() => setIsStorageModalOpen(true)}
                onBulkUpdateItems={handleBulkUpdateItems}
              />
            )}

            {/* Tab: Mode Input Testing untuk Admin */}
            {activeTab === 'user-count' && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                  <span>Anda sedang melihat tampilan input persis seperti yang dilihat oleh user/operator lapangan.</span>
                  <button
                    onClick={() => setActiveTab('admin-master')}
                    className="font-bold underline text-amber-800"
                  >
                    Kembali ke Panel Admin →
                  </button>
                </div>
                <UserSimpleCountView
                  currentUser={currentUser}
                  items={items}
                  settings={settings}
                  onSaveCount={handleSaveItem}
                  onOpenPhotoLightbox={(item) => setLightboxItem(item)}
                  onOpenMlStudio={() => setIsMlStudioOpen(true)}
                />
              </div>
            )}

            {/* Tab: Daftar Rekap Hasil Opname (Hanya untuk Admin) */}
            {activeTab === 'list' && (
              <InventoryList
                items={items}
                onAddNew={() => {
                  setEditingMasterItem(null);
                  setActiveTab('admin-master');
                }}
                onEdit={(item) => {
                  setEditingMasterItem(item);
                  setActiveTab('admin-master');
                }}
                onDelete={handleDeleteItem}
                onQuickUpdateQty={handleQuickUpdateQty}
                onResetAllQtyFisik={handleResetAllQtyFisik}
                onOpenPhotoLightbox={(item) => setLightboxItem(item)}
                onOpenMlStudio={() => setIsMlStudioOpen(true)}
              />
            )}

            {/* Tab: Log Riwayat Penginputan Stok */}
            {activeTab === 'logs' && (
              <ActivityLogView
                logs={logs}
                currentUser={currentUser}
                onClearLogs={handleClearLogs}
              />
            )}
          </>
        )}

      </main>

      {/* Photo Lightbox Modal */}
      <PhotoLightbox
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />

      {/* Firebase Database Storage Monitor Modal */}
      <FirebaseStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        items={items}
        logs={logs}
        users={getAllUsers()}
        settings={settings}
        onClearLogs={handleClearLogs}
      />

      {/* Custom Machine Learning Studio Modal */}
      <CustomMlStudioModal
        isOpen={isMlStudioOpen}
        onClose={() => setIsMlStudioOpen(false)}
        items={items}
        availableLocations={settings.availableLocations}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">InvenTrack</span>
            {isAdmin && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setIsStorageModalOpen(true)}
                  className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium"
                >
                  <Database className="w-3 h-3 text-indigo-500" />
                  <span>Kapasitas Storage DB</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAdmin ? (
              <button
                onClick={() => setActiveTab('logs')}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Log Penginputan ({logs.length})
              </button>
            ) : (
              <span className="text-emerald-700 font-medium">
                Masuk sebagai: {currentUser.fullName}
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
