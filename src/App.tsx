import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { UserSimpleCountView } from './components/UserSimpleCountView';
import { AdminMasterManagement } from './components/AdminMasterManagement';
import { InventoryList } from './components/InventoryList';
import { BlueprintView } from './components/BlueprintView';
import { SettingsAndSyncModal } from './components/SettingsAndSyncModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { InventoryItem, AppSettings, UserAccount } from './types/inventory';
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
  deleteCloudInventoryItem, 
  batchSaveCloudInventory,
  subscribeToCloudSettings,
  saveCloudSettings
} from './services/firebase';
import { getCurrentSession, logoutUser } from './services/authService';
import { CheckCircle2, Cloud } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(getCurrentSession());
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [activeTab, setActiveTab] = useState<'user-count' | 'admin-master' | 'list' | 'blueprint' | 'settings'>('user-count');
  
  const [lightboxItem, setLightboxItem] = useState<InventoryItem | null>(null);
  const [editingMasterItem, setEditingMasterItem] = useState<InventoryItem | null>(null);
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

    return () => {
      unsubscribeItems();
      unsubscribeSettings();
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

  // Handlers for inventory items with real-time cloud sync
  const handleSaveItem = async (item: InventoryItem) => {
    const index = items.findIndex(i => i.id === item.id);
    let updated: InventoryItem[];

    if (index >= 0) {
      updated = [...items];
      updated[index] = item;
      showToast(`Data "${item.namaStok}" berhasil disimpan.`);
    } else {
      updated = [item, ...items];
      showToast(`Barang master "${item.namaStok}" berhasil ditambahkan.`);
    }

    updateItems(updated);

    // Push real-time to Cloud Firestore
    saveCloudInventoryItem(item).catch(console.error);

    // Auto-sync to Google Sheets if configured
    if (settings.autoSyncWebhook && settings.googleSheetsWebhookUrl) {
      sendToGoogleSheetsWebhook(settings.googleSheetsWebhookUrl, item).catch(err => {
        console.warn('Auto sync warning:', err);
      });
    }
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
      isCounted: true,
      updatedAt: new Date().toISOString()
    };
    handleSaveItem(updatedItem);
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
                onOpenPhotoLightbox={(item) => setLightboxItem(item)}
              />
            )}

            {/* Tab: Blueprint Dokumen & Arsitektur */}
            {activeTab === 'blueprint' && (
              <BlueprintView />
            )}

            {/* Tab: Pengaturan & Spreadsheet Sync */}
            {activeTab === 'settings' && (
              <SettingsAndSyncModal
                settings={settings}
                onSaveSettings={handleSaveSettings}
                items={items}
                onImportItems={handleImportItems}
                onClearAll={handleResetToDemo}
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

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">InvenTrack</span>
            <span aria-hidden="true">·</span>
            <span>Autentikasi Terverifikasi & Manajemen Master CSV</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">Siap Vercel & Spreadsheet Database</span>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('blueprint')}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Blueprint Sistem
                </button>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  CSV Spreadsheet
                </button>
              </>
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
