import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Camera, 
  Upload, 
  X, 
  Save, 
  MapPin, 
  Barcode, 
  ShieldCheck, 
  Image as ImageIcon,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Users,
  Check,
  ClipboardPaste,
  FileText,
  Loader2,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  Clock,
  Link as LinkIcon,
  Globe,
  Sparkles,
  ExternalLink,
  Layers,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import { InventoryItem, AppSettings, UserAccount } from '../types/inventory';
import { 
  compressImageFile, 
  compressImageSource,
  PRESET_CATEGORY_ILLUSTRATIONS,
  INITIAL_LOCATIONS,
  INITIAL_CATEGORIES, 
  INITIAL_UNITS 
} from '../services/storageService';
import { exportInventoryToCsv, readSpreadsheetFile, parseCsvText, downloadCsvTemplate } from '../services/csvService';
import { AdminUserVerification } from './AdminUserVerification';
import { getAllUsers } from '../services/authService';

interface AdminMasterManagementProps {
  currentAdmin: UserAccount;
  items: InventoryItem[];
  settings: AppSettings;
  initialEditingItem?: InventoryItem | null;
  onClearEditingItem?: () => void;
  onSaveItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteMultipleItems?: (ids: string[]) => void;
  onClearAllItems?: () => void;
  onImportItems: (newItems: InventoryItem[], replace: boolean) => void;
  onUpdateLocations: (locations: string[]) => void;
  onOpenPhotoLightbox: (item: InventoryItem) => void;
  onSwitchToUser: () => void;
}

export const AdminMasterManagement: React.FC<AdminMasterManagementProps> = ({
  currentAdmin,
  items,
  settings,
  initialEditingItem,
  onClearEditingItem,
  onSaveItem,
  onDeleteItem,
  onDeleteMultipleItems,
  onClearAllItems,
  onImportItems,
  onUpdateLocations,
  onOpenPhotoLightbox,
  onSwitchToUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'barang' | 'upload-csv' | 'verifikasi-user' | 'lokasi'>('barang');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Search & Filter in Master Items
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPhoto, setFilterPhoto] = useState<'all' | 'has_photo' | 'no_photo'>('all');

  // Multi-select for Batch Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // In-App Modals (Replaces window.confirm completely)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [locToDelete, setLocToDelete] = useState<string | null>(null);
  const [isConfirmReplaceModalOpen, setIsConfirmReplaceModalOpen] = useState(false);

  // Form states
  const [kodeStok, setKodeStok] = useState('');
  const [namaStok, setNamaStok] = useState('');
  const [namaTempat, setNamaTempat] = useState('');
  const [kategori, setKategori] = useState('Sparepart');
  const [subKategori, setSubKategori] = useState('');
  const [qtySistem, setQtySistem] = useState<number>(0);
  const [opnameValue, setOpnameValue] = useState<number>(0);
  const [satuan, setSatuan] = useState('Pcs');
  const [gambarUrl, setGambarUrl] = useState('');
  const [catatan, setCatatan] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // CSV / Excel Import states
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
  const [pastedContent, setPastedContent] = useState('');
  const [csvPreview, setCsvPreview] = useState<Partial<InventoryItem>[] | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvNotice, setCsvNotice] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // In-app success alert banner
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Location management states
  const [newLocationInput, setNewLocationInput] = useState('');
  const [isBulkAddLocation, setIsBulkAddLocation] = useState(false);
  const [bulkLocationInput, setBulkLocationInput] = useState('');
  const [editingLocation, setEditingLocation] = useState<{ oldName: string; newName: string } | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isResetLocationsModalOpen, setIsResetLocationsModalOpen] = useState(false);

  // Quick Photo Modal states (for 1-click photo update directly from table rows)
  const [quickPhotoItem, setQuickPhotoItem] = useState<InventoryItem | null>(null);
  const [quickPhotoPreview, setQuickPhotoPreview] = useState<string>('');
  const [inputUrlQuickPhoto, setInputUrlQuickPhoto] = useState('');
  const [photoHelperNotice, setPhotoHelperNotice] = useState<string | null>(null);
  const [isQuickPhotoPresetsOpen, setIsQuickPhotoPresetsOpen] = useState(false);

  // Form Photo Helper states (inside main edit modal)
  const [inputImageUrl, setInputImageUrl] = useState('');
  const [isFormPhotoPresetsOpen, setIsFormPhotoPresetsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const quickCameraInputRef = useRef<HTMLInputElement>(null);

  const locations = settings.availableLocations || [];
  const pendingUsersCount = getAllUsers().filter(u => u.status === 'pending').length;

  // Global Paste Event Listener: Allows pasting images with Ctrl + V when any modal is open!
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // Only handle if edit modal or quick photo modal is currently open
      if (!isFormOpen && !quickPhotoItem) return;

      const itemsList = e.clipboardData?.items;
      if (!itemsList) return;

      for (let i = 0; i < itemsList.length; i++) {
        if (itemsList[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = itemsList[i].getAsFile();
          if (file) {
            setIsCompressing(true);
            try {
              const compressed = await compressImageSource(file, 1200, 1200, 0.8);
              if (quickPhotoItem) {
                setQuickPhotoPreview(compressed);
                setPhotoHelperNotice('Foto berhasil ditempel dari clipboard (Ctrl+V)!');
              } else if (isFormOpen) {
                setGambarUrl(compressed);
                showNotice('Foto berhasil ditempel dari clipboard (Ctrl+V)!');
              }
            } catch (err) {
              console.error('Failed to process pasted image:', err);
            } finally {
              setIsCompressing(false);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isFormOpen, quickPhotoItem]);

  // Extract distinct categories from items
  const categories = useMemo(() => {
    const list = items.map(i => i.kategori).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [items]);

  // Handle external edit request (e.g. from Recap / List)
  useEffect(() => {
    if (initialEditingItem) {
      handleOpenEditForm(initialEditingItem);
      onClearEditingItem?.();
    }
  }, [initialEditingItem]);

  const showNotice = (msg: string) => {
    setActionSuccessNotice(msg);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // Easy Image Helpers
  const handleReadClipboard = async (isQuickModal = false) => {
    setIsCompressing(true);
    setPhotoHelperNotice(null);
    try {
      if (!navigator.clipboard?.read) {
        showNotice('Silakan tekan tombol Ctrl + V di keyboard untuk menempelkan gambar langsung.');
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const compressed = await compressImageSource(blob, 1200, 1200, 0.8);
            if (isQuickModal) {
              setQuickPhotoPreview(compressed);
              setPhotoHelperNotice('Gambar berhasil diambil dari clipboard!');
            } else {
              setGambarUrl(compressed);
              showNotice('Gambar berhasil diambil dari clipboard!');
            }
            return;
          }
        }
      }
      showNotice('Tidak ada gambar di clipboard. Buka gambar di web, klik kanan "Salin Gambar" (Copy Image) lalu tekan Ctrl+V.');
    } catch {
      showNotice('Gunakan tombol Ctrl + V di keyboard untuk menempelkan gambar dari clipboard.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleOpenGoogleImagesSearch = (productName: string, productCode: string) => {
    const query = encodeURIComponent(`${productName} ${productCode}`.trim());
    window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
  };

  const handleApplyUrlImage = async (url: string, isQuickModal = false) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImageSource(trimmed, 1200, 1200, 0.8);
      if (isQuickModal) {
        setQuickPhotoPreview(compressed);
        setInputUrlQuickPhoto('');
        setPhotoHelperNotice('Gambar dari link URL berhasil dimuat!');
      } else {
        setGambarUrl(compressed);
        setInputImageUrl('');
        showNotice('Gambar dari link URL berhasil dimuat!');
      }
    } catch {
      if (isQuickModal) {
        setQuickPhotoPreview(trimmed);
        setInputUrlQuickPhoto('');
      } else {
        setGambarUrl(trimmed);
        setInputImageUrl('');
      }
      showNotice('Link URL gambar berhasil disetel.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveQuickPhoto = () => {
    if (!quickPhotoItem) return;
    const updated: InventoryItem = {
      ...quickPhotoItem,
      gambarUrl: quickPhotoPreview,
      updatedAt: new Date().toISOString()
    };
    onSaveItem(updated);
    showNotice(`Foto master untuk "${updated.namaStok}" berhasil disimpan!`);
    setQuickPhotoItem(null);
  };

  const handleOpenAddForm = () => {
    setEditingItem(null);
    setKodeStok('');
    setNamaStok('');
    setNamaTempat('');
    setKategori('Sparepart');
    setSubKategori('');
    setQtySistem(0);
    setOpnameValue(0);
    setSatuan('Pcs');
    setGambarUrl('');
    setCatatan('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: InventoryItem) => {
    setEditingItem(item);
    setKodeStok(item.kodeStok);
    setNamaStok(item.namaStok);
    setNamaTempat(item.namaTempat || '');
    setKategori(item.kategori || 'Sparepart');
    setSubKategori(item.subKategori || '');
    setQtySistem(item.qtySistem);
    setOpnameValue(item.opnameValue || 0);
    setSatuan(item.satuan);
    setGambarUrl(item.gambarUrl || '');
    setCatatan(item.catatan || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.8);
      setGambarUrl(compressedDataUrl);
    } catch (err) {
      console.error('Failed to compress image:', err);
      setFormError('Gagal memproses gambar foto master.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmitMasterItem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!kodeStok.trim()) {
      setFormError('Kode Stok (Product Code) wajib diisi.');
      return;
    }
    if (!namaStok.trim()) {
      setFormError('Nama Barang (Product Name) wajib diisi.');
      return;
    }

    const newItem: InventoryItem = {
      id: editingItem?.id || 'master_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      no: editingItem?.no || items.length + 1,
      kodeStok: kodeStok.trim().toUpperCase(),
      namaStok: namaStok.trim(),
      namaTempat: (namaTempat || editingItem?.namaTempat || '').trim(),
      kategori,
      subKategori: subKategori.trim(),
      qtySistem: Number(qtySistem) || 0,
      qtyFisik: editingItem ? editingItem.qtyFisik : 0,
      selisih: (editingItem ? editingItem.qtyFisik : 0) - (Number(qtySistem) || 0),
      opnameValue: Number(opnameValue) || 0,
      satuan,
      kondisi: editingItem ? editingItem.kondisi : 'Baik',
      gambarUrl,
      petugas: editingItem ? editingItem.petugas : currentAdmin.fullName,
      catatan: catatan.trim(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveItem(newItem);
    setIsFormOpen(false);
    showNotice(editingItem ? `Perubahan data "${newItem.namaStok}" berhasil disimpan!` : `Barang baru "${newItem.namaStok}" berhasil ditambahkan ke master!`);
  };

  // Delete Handlers using In-App Dialogs
  const handleConfirmSingleDelete = () => {
    if (!itemToDelete) return;
    const name = itemToDelete.namaStok;
    onDeleteItem(itemToDelete.id);
    setSelectedIds(prev => prev.filter(id => id !== itemToDelete.id));
    setItemToDelete(null);
    showNotice(`Barang "${name}" berhasil dihapus dari master data.`);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (onDeleteMultipleItems) {
      onDeleteMultipleItems(selectedIds);
    } else {
      selectedIds.forEach(id => onDeleteItem(id));
    }
    setSelectedIds([]);
    setIsBulkDeleteModalOpen(false);
    showNotice(`${count} data barang master berhasil dihapus sekaligus.`);
  };

  const handleConfirmClearAll = () => {
    if (onClearAllItems) {
      onClearAllItems();
    } else {
      items.forEach(i => onDeleteItem(i.id));
    }
    setSelectedIds([]);
    setIsClearAllModalOpen(false);
    showNotice('Seluruh data master barang telah dikosongkan.');
  };

  const handleConfirmDeleteLocation = () => {
    if (!locToDelete) return;
    const targetLoc = locToDelete;
    const updatedLocations = locations.filter(l => l !== targetLoc);
    onUpdateLocations(updatedLocations);

    // Reset items that were stored in this location
    const affected = items.filter(i => i.namaTempat === targetLoc);
    if (affected.length > 0) {
      affected.forEach(it => {
        onSaveItem({ ...it, namaTempat: '', updatedAt: new Date().toISOString() });
      });
    }
    setLocToDelete(null);
    showNotice(`Lokasi "${targetLoc}" berhasil dihapus.${affected.length > 0 ? ` (${affected.length} barang direset ke belum ada lokasi)` : ''}`);
  };

  // CSV & Excel Import handling
  const processUploadedFile = async (file: File) => {
    setCsvError(null);
    setCsvNotice(null);
    setIsProcessingFile(true);
    setUploadedFileName(file.name);

    try {
      const parsed = await readSpreadsheetFile(file, '');
      if (parsed.length === 0) {
        setCsvError('Tidak ada data produk yang terdeteksi. Pastikan file memiliki baris data dan kolom nama/kode barang.');
        setCsvPreview(null);
        return;
      }
      setCsvPreview(parsed);
      setCsvNotice(`Berhasil membaca file "${file.name}"! Ditemukan ${parsed.length} baris produk. Silakan periksa pratinjau di bawah.`);
    } catch (err: any) {
      console.error('Failed to parse file:', err);
      setCsvError(err?.message || 'Gagal membaca file spreadsheet. Pastikan file berformat .xlsx, .xls, atau .csv yang valid.');
      setCsvPreview(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleCsvFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    if (e.target) e.target.value = '';
  };

  const handleDropFile = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const handleProcessPastedText = () => {
    setCsvError(null);
    setCsvNotice(null);
    if (!pastedContent.trim()) {
      setCsvError('Silakan tempel (paste) data tabel dari Excel terlebih dahulu.');
      return;
    }

    try {
      const parsed = parseCsvText(pastedContent, '');
      if (parsed.length === 0) {
        setCsvError('Data yang ditempel tidak memuat baris produk yang valid. Pastikan Anda menyalin bersama header tabelnya.');
        return;
      }
      setCsvPreview(parsed);
      setUploadedFileName('Data Hasil Copy-Paste Excel');
      setCsvNotice(`Berhasil membaca ${parsed.length} baris produk dari teks yang ditempel!`);
    } catch (err: any) {
      setCsvError('Gagal memproses data yang ditempel: ' + (err?.message || 'Format tidak dikenali.'));
    }
  };

  const handleConfirmCsvImport = (replace: boolean) => {
    if (!csvPreview || csvPreview.length === 0) return;

    const fullItems: InventoryItem[] = csvPreview.map((p, idx) => ({
      id: 'import_' + Date.now() + '_' + idx,
      no: p.no || idx + 1,
      kodeStok: p.kodeStok || `PRD-${String(idx + 1).padStart(4, '0')}`,
      namaStok: p.namaStok || 'Item Tanpa Nama',
      namaTempat: p.namaTempat || '', // In master data, no location is assigned initially
      kategori: p.kategori || 'Umum',
      subKategori: p.subKategori || '-',
      qtySistem: p.qtySistem ?? 0,
      qtyFisik: 0,
      selisih: 0 - (p.qtySistem ?? 0),
      opnameValue: p.opnameValue ?? 0,
      satuan: p.satuan || 'Pcs',
      kondisi: 'Baik',
      petugas: '-',
      catatan: '',
      gambarUrl: '',
      isCounted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    onImportItems(fullItems, replace);
    setCsvNotice(`Berhasil memasukkan ${fullItems.length} produk ke dalam Master Data! Lokasi akan terisi saat operator melakukan input fisik.`);
    setCsvPreview(null);
    setPastedContent('');
    setIsConfirmReplaceModalOpen(false);
    setActiveSubTab('barang');
    showNotice(`Berhasil menambahkan ${fullItems.length} produk ke Master Data.`);
  };

  const handleAddSingleLocation = () => {
    const clean = newLocationInput.trim();
    if (!clean) return;
    if (locations.includes(clean)) {
      showNotice(`Lokasi "${clean}" sudah terdaftar.`);
      return;
    }
    onUpdateLocations([...locations, clean]);
    setNewLocationInput('');
    showNotice(`Lokasi baru "${clean}" berhasil ditambahkan!`);
  };

  const handleAddBulkLocations = () => {
    if (!bulkLocationInput.trim()) return;
    const parsed = bulkLocationInput
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const uniqueNew = parsed.filter(loc => !locations.includes(loc));
    if (uniqueNew.length === 0) {
      showNotice('Semua lokasi yang dimasukkan sudah ada sebelumnya.');
      return;
    }
    onUpdateLocations([...locations, ...uniqueNew]);
    setBulkLocationInput('');
    setIsBulkAddLocation(false);
    showNotice(`Berhasil menambahkan ${uniqueNew.length} lokasi rak baru!`);
  };

  const handleSaveEditLocation = () => {
    if (!editingLocation) return;
    const oldName = editingLocation.oldName;
    const newName = editingLocation.newName.trim();
    if (!newName || newName === oldName) {
      setEditingLocation(null);
      return;
    }
    const updated = locations.map(l => l === oldName ? newName : l);
    onUpdateLocations(updated);

    // Synchronize items that were stored in oldName
    const affected = items.filter(i => i.namaTempat === oldName);
    if (affected.length > 0) {
      affected.forEach(it => {
        onSaveItem({ ...it, namaTempat: newName, updatedAt: new Date().toISOString() });
      });
    }
    setEditingLocation(null);
    showNotice(`Lokasi "${oldName}" berhasil diubah menjadi "${newName}".${affected.length > 0 ? ` (${affected.length} barang diperbarui)` : ''}`);
  };

  const handleResetToDefaultLocations = () => {
    onUpdateLocations(INITIAL_LOCATIONS);
    setIsResetLocationsModalOpen(false);
    showNotice('Daftar lokasi telah dikembalikan ke 10 lokasi standar (SERVICE LT 1-4, DAPUR LT 1-4, BAR, KASIR).');
  };

  // Filtered locations for location tab search
  const filteredLocations = useMemo(() => {
    if (!locationSearchQuery.trim()) return locations;
    return locations.filter(l => l.toLowerCase().includes(locationSearchQuery.toLowerCase().trim()));
  }, [locations, locationSearchQuery]);

  // Filtered Items for Master Barang tab
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.namaStok.toLowerCase().includes(q) ||
        item.kodeStok.toLowerCase().includes(q) ||
        (item.kategori && item.kategori.toLowerCase().includes(q)) ||
        (item.subKategori && item.subKategori.toLowerCase().includes(q)) ||
        item.namaTempat.toLowerCase().includes(q);

      const matchLocation = 
        filterLocation === 'all' || 
        (filterLocation === 'unassigned' && !item.namaTempat) ||
        (filterLocation === 'assigned' && !!item.namaTempat) ||
        item.namaTempat === filterLocation;
      const matchCategory = filterCategory === 'all' || item.kategori === filterCategory;
      const matchPhoto = filterPhoto === 'all' || 
        (filterPhoto === 'has_photo' && !!item.gambarUrl) ||
        (filterPhoto === 'no_photo' && !item.gambarUrl);

      return matchSearch && matchLocation && matchCategory && matchPhoto;
    }).sort((a, b) => a.namaStok.localeCompare(b.namaStok, 'id', { numeric: true, sensitivity: 'base' }));
  }, [items, searchQuery, filterLocation, filterCategory, filterPhoto]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Admin Header with Back-to-User button */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            Panel Khusus Admin · {currentAdmin.fullName}
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Pengelolaan Data Master, Upload CSV & Verifikasi Akun
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Edit, hapus, upload file Excel/CSV, kelola foto master barang, dan atur akun operator gudang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInventoryToCsv(items)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Download seluruh data stok master sebagai file CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onSwitchToUser}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Tampilan Input User</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Global In-App Notice Banner */}
      {actionSuccessNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('barang')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'barang'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Master Barang & Foto ({items.length})
        </button>

        <button
          onClick={() => setActiveSubTab('upload-csv')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'upload-csv'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          Upload Data Excel / CSV
        </button>

        <button
          onClick={() => setActiveSubTab('verifikasi-user')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'verifikasi-user'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Kelola Akun Operator</span>
          {pendingUsersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
              {pendingUsersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('lokasi')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'lokasi'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Lokasi Rak ({locations.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUBTAB 1: MASTER BARANG & FOTO (DENGAN EDIT & HAPUS)     */}
      {/* ======================================================== */}
      {activeSubTab === 'barang' && (
        <div className="space-y-4">
          
          {/* Quick Stats & Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Total Master Barang</span>
                <span className="text-base font-bold text-slate-900">{items.length} item</span>
              </div>
              <div className="h-7 w-px bg-slate-200 hidden sm:block" />
              <div>
                <span className="text-slate-500 block text-[11px]">Sudah Ada Lokasi</span>
                <span className="text-base font-bold text-emerald-600">
                  {items.filter(i => !!i.namaTempat).length} item
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200 hidden sm:block" />
              <div>
                <span className="text-slate-500 block text-[11px]">Belum Diinput Lokasi</span>
                <span className="text-base font-bold text-amber-600">
                  {items.filter(i => !i.namaTempat).length} item
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveSubTab('lokasi')}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                title="Kelola daftar lokasi rak untuk pilihan input user"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kelola Lokasi ({locations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('upload-csv')}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ Upload Excel / CSV</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddForm}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>+ Tambah Barang Manual</span>
              </button>
            </div>
          </div>

          {/* Search, Filter & Bulk Action Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari master barang..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 outline-none bg-slate-50 focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Lokasi */}
              <div>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="all">Semua Status Lokasi</option>
                  <option value="unassigned">⏱ Belum Diinput Lokasi ({items.filter(i => !i.namaTempat).length})</option>
                  <option value="assigned">✓ Sudah Ada Lokasi ({items.filter(i => !!i.namaTempat).length})</option>
                  {locations.length > 0 && (
                    <optgroup label="Lokasi Spesifik">
                      {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Filter Kategori */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="all">Semua Kategori ({categories.length})</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Filter Status Foto */}
              <div>
                <select
                  value={filterPhoto}
                  onChange={(e) => setFilterPhoto(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="all">Semua Status Foto</option>
                  <option value="has_photo">Hanya yang Ada Foto</option>
                  <option value="no_photo">Hanya yang Belum Ada Foto</option>
                </select>
              </div>

            </div>

            {/* Selection Toolbar when items are checked */}
            {selectedIds.length > 0 && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-950">
                    {selectedIds.length} barang terpilih
                  </span>
                  <span className="text-slate-400">|</span>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-indigo-700 hover:underline"
                  >
                    Batal Pilihan
                  </button>
                </div>

                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus {selectedIds.length} Barang Terpilih</span>
                </button>
              </div>
            )}

            {/* Filter Result Counter & Reset */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div>
                Menampilkan <span className="font-bold text-slate-900">{filteredItems.length}</span> dari {items.length} barang
                {(searchQuery || filterLocation !== 'all' || filterCategory !== 'all' || filterPhoto !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterLocation('all');
                      setFilterCategory('all');
                      setFilterPhoto('all');
                    }}
                    className="ml-2 text-indigo-600 hover:underline text-[11px]"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {items.length > 0 && (
                <button
                  onClick={() => setIsClearAllModalOpen(true)}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Kosongkan Seluruh Data Master</span>
                </button>
              )}
            </div>
          </div>

          {/* Master Items Table with Edit & Delete */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">
                  {items.length === 0 ? 'Belum Ada Data Master Barang' : 'Tidak Ada Barang yang Cocok dengan Filter'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {items.length === 0 
                    ? 'Mulai dengan menambahkan barang manual atau unggah file spreadsheet Excel/CSV.' 
                    : 'Coba ubah kata kunci pencarian atau bersihkan filter di atas.'}
                </p>
                {items.length === 0 ? (
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={() => setActiveSubTab('upload-csv')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                    >
                      Upload File Excel / CSV
                    </button>
                    <button
                      onClick={handleOpenAddForm}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                    >
                      + Tambah Manual
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setSearchQuery(''); setFilterLocation('all'); setFilterCategory('all'); setFilterPhoto('all'); }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-3 py-3 text-center w-10">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="text-slate-400 hover:text-slate-900"
                          title={isAllSelected ? 'Batalkan pilih semua' : 'Pilih semua di halaman ini'}
                        >
                          {isAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-3 text-center w-10">No</th>
                      <th className="px-4 py-3 text-center w-20">Foto Master</th>
                      <th className="px-4 py-3">Product Name (Nama Barang)</th>
                      <th className="px-4 py-3 font-mono">Product Code</th>
                      <th className="px-4 py-3">Category / Sub</th>
                      <th className="px-4 py-3">Lokasi Rak</th>
                      <th className="px-4 py-3 text-right font-mono">Opname Qty</th>
                      <th className="px-4 py-3 text-right font-mono">Nilai (Rp)</th>
                      <th className="px-4 py-3 text-center">Status Foto</th>
                      <th className="px-4 py-3 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredItems.map((item, idx) => {
                      const isSelected = selectedIds.includes(item.id);
                      return (
                        <tr 
                          key={item.id} 
                          className={`transition-colors ${
                            isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          
                          {/* Checkbox */}
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectItem(item.id)}
                              className="text-slate-400 hover:text-indigo-600"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* No */}
                          <td className="px-3 py-3 text-center font-mono text-slate-400">
                            {item.no || idx + 1}
                          </td>

                          {/* Photo Thumbnail / Quick Upload */}
                          <td className="px-4 py-3 text-center">
                            {item.gambarUrl ? (
                              <div className="relative group inline-block">
                                <button
                                  type="button"
                                  onClick={() => onOpenPhotoLightbox(item)}
                                  className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 block hover:ring-2 hover:ring-slate-900 transition-all shadow-xs"
                                  title="Klik untuk zoom foto"
                                >
                                  <img
                                    src={item.gambarUrl}
                                    alt={item.namaStok}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickPhotoItem(item);
                                    setQuickPhotoPreview(item.gambarUrl || '');
                                    setPhotoHelperNotice(null);
                                    setInputUrlQuickPhoto('');
                                    setIsQuickPhotoPresetsOpen(false);
                                  }}
                                  className="absolute -top-1 -right-1 p-1 bg-slate-900 hover:bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                                  title="Ganti / atur foto master"
                                >
                                  <Camera className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickPhotoItem(item);
                                  setQuickPhotoPreview('');
                                  setPhotoHelperNotice(null);
                                  setInputUrlQuickPhoto('');
                                  setIsQuickPhotoPresetsOpen(false);
                                }}
                                className="w-12 h-12 rounded-lg border-2 border-dashed border-amber-300 hover:border-slate-900 bg-amber-50/50 hover:bg-slate-100 flex flex-col items-center justify-center text-amber-700 hover:text-slate-900 mx-auto transition-colors"
                                title="Klik untuk tambah foto (bisa Paste Ctrl+V, Cari di Google, URL, Preset, dll)"
                              >
                                <Camera className="w-4 h-4" />
                                <span className="text-[9px] font-bold mt-0.5">+ Foto</span>
                              </button>
                            )}
                          </td>

                          {/* Product Name */}
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 text-xs">
                              {item.namaStok}
                            </div>
                            {item.catatan && (
                              <div className="text-[11px] text-slate-400 italic mt-0.5">
                                Catatan: {item.catatan}
                              </div>
                            )}
                          </td>

                          {/* Product Code */}
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            {item.kodeStok}
                          </td>

                          {/* Category / Sub */}
                          <td className="px-4 py-3">
                            <div className="text-slate-800 font-medium">{item.kategori || '-'}</div>
                            <div className="text-[10px] text-slate-400">{item.subKategori || '-'}</div>
                          </td>

                          {/* Lokasi Rak */}
                          <td className="px-4 py-3">
                            {item.namaTempat ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                {item.namaTempat}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-50 border border-dashed border-slate-200 px-2 py-0.5 rounded-md text-[11px]" title="Lokasi belum ada di master data, akan otomatis terisi saat operator melakukan penginputan">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Belum Diinput
                              </span>
                            )}
                          </td>

                          {/* Opname Qty (Sistem) */}
                          <td className="px-4 py-3 text-right font-mono">
                            <span className="font-bold text-slate-900">{item.qtySistem}</span>{' '}
                            <span className="text-slate-400 text-[11px]">{item.satuan}</span>
                          </td>

                          {/* Opname Value (Nilai) */}
                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            {item.opnameValue ? `Rp ${item.opnameValue.toLocaleString('id-ID')}` : '-'}
                          </td>

                          {/* Status Foto */}
                          <td className="px-4 py-3 text-center">
                            {item.gambarUrl ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Ada Foto
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Belum Ada
                              </span>
                            )}
                          </td>

                          {/* Actions: Edit & Hapus (Clearly defined, responsive, in-app modal) */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(item)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                                title="Edit data & foto barang master"
                              >
                                <Edit3 className="w-3 h-3 text-indigo-500" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setItemToDelete(item)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                                title="Hapus barang ini dari master data"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 2: UPLOAD CSV / EXCEL SESUAI TEMPLATE SPREADSHEET */}
      {/* ======================================================== */}
      {activeSubTab === 'upload-csv' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Upload Data Barang via File Spreadsheet (Excel / CSV)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin dapat mengimpor data produk langsung dari spreadsheet. Setelah terunggah, semua data dapat diedit, dihapus, dan ditambahkan foto masternya.
              </p>
            </div>

            <button
              onClick={downloadCsvTemplate}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download Template Format Ini</span>
            </button>
          </div>

          {/* Format Reference Banner matching image.png */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-800">
              Format Kolom Spreadsheet yang Didukung Otomatis:
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs font-mono text-center border-collapse w-full">
                <thead>
                  <tr className="bg-white border border-slate-300 text-slate-800 font-bold">
                    <th className="p-2 border border-slate-300">No</th>
                    <th className="p-2 border border-slate-300">Product Name</th>
                    <th className="p-2 border border-slate-300">Product Code</th>
                    <th className="p-2 border border-slate-300">Category</th>
                    <th className="p-2 border border-slate-300">Sub Category</th>
                    <th className="p-2 border border-slate-300">Unit</th>
                    <th className="p-2 border border-slate-300">Opname Qty</th>
                    <th className="p-2 border border-slate-300">Opname Buy Price / Value</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-slate-600">
                  <tr className="bg-slate-50">
                    <td className="p-1.5 border border-slate-200">1</td>
                    <td className="p-1.5 border border-slate-200 text-left font-sans">Bearing 6204 2RS</td>
                    <td className="p-1.5 border border-slate-200">SP-BRG-6204</td>
                    <td className="p-1.5 border border-slate-200">Sparepart</td>
                    <td className="p-1.5 border border-slate-200">Mechanical</td>
                    <td className="p-1.5 border border-slate-200">Pcs</td>
                    <td className="p-1.5 border border-slate-200">120</td>
                    <td className="p-1.5 border border-slate-200">14400000</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              * Baris 1 yang kosong di Excel akan dilewati secara otomatis. Foto fisik barang master dapat diunggah atau diganti kapan saja melalui tab <strong>Master Barang & Foto</strong>.
            </p>
          </div>

          <input
            ref={csvFileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain"
            onChange={handleCsvFileSelected}
            className="hidden"
          />

          {/* Import Method Toggle: File Upload vs Paste from Excel */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setImportMethod('file')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                importMethod === 'file'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File Spreadsheet (.xlsx / .csv / .xls)</span>
            </button>
            <button
              type="button"
              onClick={() => setImportMethod('paste')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                importMethod === 'paste'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Tempel (Copy-Paste) Langsung dari Excel</span>
            </button>
          </div>

          {csvError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Gagal memproses spreadsheet:</span>
                <p>{csvError}</p>
                <p className="text-[11px] text-rose-600">
                  Tip: Pastikan file memiliki kolom &quot;Product Name&quot; atau &quot;Product Code&quot;. Anda juga dapat menggunakan opsi &quot;Tempel Langsung dari Excel&quot; di atas.
                </p>
              </div>
            </div>
          )}

          {csvNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{csvNotice}</span>
            </div>
          )}

          {/* METHOD 1: FILE UPLOAD DROPZONE */}
          {importMethod === 'file' && !csvPreview && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropFile}
              onClick={() => csvFileInputRef.current?.click()}
              className={`w-full py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer text-center px-4 ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-slate-900 bg-slate-50/80 hover:bg-slate-50'
              }`}
            >
              {isProcessingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="font-bold text-sm text-slate-800">Sedang membaca dan menganalisis file...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-emerald-600">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      Klik untuk Pilih File atau Tarik & Letakkan File ke Sini
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Mendukung file Excel langsung (<span className="font-semibold text-slate-700">.xlsx, .xls</span>) serta file CSV (<span className="font-semibold text-slate-700">.csv, .tsv</span>)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">
                    <span>Otomatis membaca header pada baris ke-2 atau baris pertama yang berisi kolom</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* METHOD 2: DIRECT EXCEL COPY-PASTE */}
          {importMethod === 'paste' && !csvPreview && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                Buka file Excel Anda, pilih/blok baris tabel barang (termasuk baris header), tekan <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[11px]">Ctrl + C</kbd>, lalu paste di kotak di bawah:
              </div>
              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder={"No\tProduct Name\tProduct Code\tCategory\tSub Category\tUnit\tOpname Qty\tOpname Buy Price\n1\tACRYLIC STANDING LOLLIPOP\tSTO1901\tGUDANG STOCK\tGUDANG STOCK\tPCS\t4\t2500000"}
                rows={6}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:border-slate-900 outline-none bg-white"
              />
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
              >
                <ClipboardPaste className="w-4 h-4 text-emerald-400" />
                <span>Analisis & Pratinjau Data yang Ditempel</span>
              </button>
            </div>
          )}

          {/* PREVIEW CONTAINER */}
          {csvPreview && (
            <div className="border border-indigo-200 bg-indigo-50/40 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-indigo-950 text-sm block">
                    Pratinjau: {csvPreview.length} Produk Siap Diimpor
                  </span>
                  <span className="text-[11px] text-indigo-700">
                    Sumber: {uploadedFileName || 'Spreadsheet'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setCsvPreview(null); setCsvNotice(null); }}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium"
                  >
                    Batal / Ganti File
                  </button>
                </div>
              </div>

              {/* Preview table */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-white text-xs shadow-inner">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold text-[11px]">
                    <tr>
                      <th className="p-2.5 text-center w-12">No</th>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5 font-mono">Product Code</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Sub Category</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5 text-right font-mono">Opname Qty</th>
                      <th className="p-2.5 text-right font-mono">Nilai/Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {csvPreview.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono text-slate-400">{row.no || idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{row.namaStok}</td>
                        <td className="p-2 font-mono font-medium text-slate-700">{row.kodeStok}</td>
                        <td className="p-2">{row.kategori}</td>
                        <td className="p-2 text-slate-400">{row.subKategori || '-'}</td>
                        <td className="p-2 font-medium">{row.satuan}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">{row.qtySistem}</td>
                        <td className="p-2 text-right font-mono text-slate-500">
                          {row.opnameValue ? `Rp ${row.opnameValue.toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {csvPreview.length > 15 && (
                <p className="text-[11px] text-slate-500 italic text-center">
                  Menampilkan 15 dari total {csvPreview.length} baris produk. Seluruh {csvPreview.length} baris akan diimpor saat Anda menekan tombol di bawah.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-100">
                <div className="text-[11px] text-slate-500">
                  Data yang diimpor dapat diedit dan dihapus kapan saja melalui tab Master Barang & Foto.
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConfirmCsvImport(false)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Tambahkan ke Master Barang (+{csvPreview.length})</span>
                  </button>

                  <button
                    onClick={() => setIsConfirmReplaceModalOpen(true)}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Gantikan Seluruh Data Lama
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 3: VERIFIKASI USER                                */}
      {/* ======================================================== */}
      {activeSubTab === 'verifikasi-user' && (
        <AdminUserVerification currentAdmin={currentAdmin} />
      )}

      {/* ======================================================== */}
      {/* SUBTAB 4: MASTER LOKASI PENGINPUTAN                      */}
      {/* ======================================================== */}
      {activeSubTab === 'lokasi' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kelola Master Lokasi & Rak Gudang
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar lokasi ini menjadi tombol pilihan saat operator gudang melakukan penginputan fisik.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsResetLocationsModalOpen(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                title="Kembalikan daftar lokasi ke 8 lokasi standar"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset ke Standar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulkAddLocation(!isBulkAddLocation)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                  isBulkAddLocation 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isBulkAddLocation ? 'Tutup Tambah Massal' : '+ Tambah Banyak Sekaligus'}</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Bulk Add Textarea */}
          {isBulkAddLocation ? (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Tambah Banyak Lokasi / Rak Sekaligus (Batch)
                </span>
                <span className="text-[11px] text-indigo-700">Pisahkan dengan koma atau enter</span>
              </div>
              <textarea
                value={bulkLocationInput}
                onChange={(e) => setBulkLocationInput(e.target.value)}
                placeholder={"Contoh:\nRak A-01\nRak A-02\nRak A-03\nRak B-01, Rak B-02, Rak B-03"}
                rows={4}
                className="w-full p-3 font-mono text-xs border border-indigo-200 rounded-xl focus:border-indigo-900 outline-none bg-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkAddLocation(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddBulkLocations}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Simpan Semua Lokasi
                </button>
              </div>
            </div>
          ) : (
            /* Mode 2: Single Add Input */
            <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={newLocationInput}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSingleLocation();
                    }
                  }}
                  placeholder="Nama lokasi / lantai baru..."
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-slate-900 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSingleLocation}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>+ Tambah Lokasi</span>
              </button>
            </div>
          )}

          {/* Search & Stats Bar for Locations */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <span className="font-bold text-slate-900">{locations.length} Lokasi Terdaftar</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                {items.filter(i => !!i.namaTempat).length} dari {items.length} barang sudah memiliki lokasi
              </span>
            </div>

            {locations.length > 4 && (
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  placeholder="Cari lokasi..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-slate-900 outline-none bg-slate-50 focus:bg-white"
                />
                {locationSearchQuery && (
                  <button
                    onClick={() => setLocationSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Location Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLocations.map(loc => {
              const itemCount = items.filter(i => i.namaTempat === loc).length;
              const isEditing = editingLocation?.oldName === loc;

              if (isEditing) {
                return (
                  <div
                    key={loc}
                    className="p-3 bg-amber-50/70 border-2 border-amber-300 rounded-xl flex items-center gap-2 text-xs shadow-xs"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingLocation.newName}
                      onChange={(e) => setEditingLocation({ ...editingLocation, newName: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEditLocation();
                        } else if (e.key === 'Escape') {
                          setEditingLocation(null);
                        }
                      }}
                      className="flex-1 px-2.5 py-1 text-xs border border-amber-300 rounded-lg outline-none bg-white font-semibold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEditLocation}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                      title="Simpan nama lokasi baru"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLocation(null)}
                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                      title="Batal edit"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={loc}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-slate-800 block truncate" title={loc}>
                        {loc}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {itemCount > 0 ? (
                          <span className="text-emerald-700 font-semibold">{itemCount} barang di sini</span>
                        ) : (
                          '0 barang'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => setEditingLocation({ oldName: loc, newName: loc })}
                      className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-white transition-colors"
                      title="Ubah nama lokasi ini"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocToDelete(loc)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Hapus lokasi ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLocations.length === 0 && (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                {locationSearchQuery ? `Tidak ada lokasi yang cocok dengan "${locationSearchQuery}".` : 'Belum ada lokasi yang didaftarkan.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: EDIT / TAMBAH BARANG MASTER (CENTERED OVERLAY) */}
      {/* ======================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 relative animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? 'Edit Data Master Barang & Foto' : 'Tambah Barang Baru ke Master'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingItem 
                    ? `Perbarui informasi atau ganti foto master untuk "${editingItem.namaStok}".` 
                    : 'Lengkapi nama, kode, lokasi rak, dan foto resmi acuan fisik.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitMasterItem} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left Column: Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Name (Nama Barang) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={namaStok}
                      onChange={(e) => setNamaStok(e.target.value)}
                      placeholder="Contoh: Bearing Deep Groove 6204 2RS"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-slate-900 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Code (Kode Stok / SKU) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={kodeStok}
                      onChange={(e) => setKodeStok(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:border-slate-900 uppercase outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Category (Kategori)
                      </label>
                      <input
                        type="text"
                        value={kategori}
                        onChange={(e) => setKategori(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sub Category
                      </label>
                      <input
                        type="text"
                        value={subKategori}
                        onChange={(e) => setSubKategori(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Unit (Satuan)
                      </label>
                      <select
                        value={satuan}
                        onChange={(e) => setSatuan(e.target.value)}
                        className="w-full px-2 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none"
                      >
                        {INITIAL_UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Opname Qty (Sistem)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={qtySistem}
                        onChange={(e) => setQtySistem(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Opname Value (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={opnameValue}
                        onChange={(e) => setOpnameValue(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  {/* Lokasi info in Master Form */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lokasi / Rak Penyimpanan Barang
                    </label>
                    {namaTempat ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[10px] text-emerald-700 font-semibold block uppercase tracking-wider">Lokasi Tercatat (Hasil Input Operator):</span>
                            <span className="font-bold text-slate-900 text-xs">{namaTempat}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNamaTempat('')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                          title="Hapus lokasi agar operator mengisi ulang saat hitung fisik"
                        >
                          Reset Lokasi
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">Belum Ada Lokasi (Sesuai Aturan Master Data)</span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Lokasi rak tidak ditentukan di master. Lokasi akan otomatis tercatat saat operator gudang melakukan penginputan fisik barang.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Keterangan spesifikasi / catatan rak"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                </div>

                {/* Right Column: Master Photo Management */}
                <div className="space-y-3 flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Foto Fisik Master (Acuan Verifikasi User)
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Bisa Ctrl + V</span>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {gambarUrl ? (
                    <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 min-h-[220px] flex items-center justify-center p-2">
                      <img
                        src={gambarUrl}
                        alt="Foto Master"
                        referrerPolicy="no-referrer"
                        className="max-h-52 max-w-full object-contain rounded-lg shadow-xs"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGambarUrl('')}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-md flex items-center gap-1 text-[11px] font-bold px-2.5"
                          title="Hapus foto ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Foto</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          setIsCompressing(true);
                          try {
                            const comp = await compressImageSource(file, 1200, 1200, 0.8);
                            setGambarUrl(comp);
                            showNotice('Gambar berhasil dipasang via drag & drop!');
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsCompressing(false);
                          }
                        }
                      }}
                      className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col p-4 bg-slate-50/80 gap-3"
                    >
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                        <span className="text-xs font-bold text-slate-800 block mt-1">Tambah Foto Master Barang</span>
                        <span className="text-[11px] text-slate-500 block">
                          Tarik & letakkan gambar ke sini, tekan <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl + V</kbd>, atau pilih opsi di bawah:
                        </span>
                      </div>

                      {/* Quick Method Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => handleReadClipboard(false)}
                          className="p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          title="Tempel gambar yang sudah Anda copy di browser atau screenshot"
                        >
                          <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Tempel Clipboard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenGoogleImagesSearch(namaStok, kodeStok)}
                          className="p-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          title="Buka pencarian gambar Google untuk produk ini"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>Cari di Google</span>
                        </button>

                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Upload File</span>
                        </button>

                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => cameraInputRef.current?.click()}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5 text-slate-500" />
                          <span>Buka Kamera</span>
                        </button>
                      </div>

                      {/* Extra Options: URL & Preset Ilustrasi */}
                      <div className="border-t border-slate-200/80 pt-2 space-y-2">
                        {/* URL Input */}
                        <div className="flex gap-1.5">
                          <input
                            type="url"
                            value={inputImageUrl}
                            onChange={(e) => setInputImageUrl(e.target.value)}
                            placeholder="https://"
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl outline-none bg-white placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            disabled={!inputImageUrl.trim() || isCompressing}
                            onClick={() => handleApplyUrlImage(inputImageUrl, false)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Pasang
                          </button>
                        </div>

                        {/* Presets Toggle */}
                        <div>
                          <button
                            type="button"
                            onClick={() => setIsFormPhotoPresetsOpen(!isFormPhotoPresetsOpen)}
                            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isFormPhotoPresetsOpen ? 'Tutup Ikon Preset' : 'Gunakan Ikon / Ilustrasi Kategori Standar'}</span>
                          </button>

                          {isFormPhotoPresetsOpen && (
                            <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in">
                              {PRESET_CATEGORY_ILLUSTRATIONS.map(preset => (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => {
                                    setGambarUrl(preset.url);
                                    setIsFormPhotoPresetsOpen(false);
                                    showNotice(`Ikon "${preset.name}" berhasil dipilih.`);
                                  }}
                                  className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-center transition-all flex flex-col items-center gap-1 group shadow-2xs"
                                  title={preset.name}
                                >
                                  <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100">
                                    {preset.url.startsWith('data:image/svg+xml') ? (
                                      <span className="text-xl">{preset.icon}</span>
                                    ) : (
                                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-700 truncate w-full group-hover:text-indigo-900">
                                    {preset.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      Cara termudah: Cari foto di Google → Klik kanan foto lalu klik <strong>"Salin Gambar" (Copy Image)</strong> → Kembali ke sini dan tekan <strong>Ctrl + V</strong>!
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Tambahkan ke Master'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: QUICK PHOTO MANAGEMENT (1-CLICK DARI BARIS TABEL) */}
      {/* ======================================================== */}
      {quickPhotoItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Kelola Foto Master
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {quickPhotoItem.namaStok}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Kode Stok: {quickPhotoItem.kodeStok}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickPhotoItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden native inputs for quick photo */}
            <input
              ref={quickCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setIsCompressing(true);
                  try {
                    const comp = await compressImageSource(file, 1200, 1200, 0.8);
                    setQuickPhotoPreview(comp);
                    setPhotoHelperNotice('Foto kamera berhasil diambil!');
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsCompressing(false);
                  }
                }
                if (e.target) e.target.value = '';
              }}
              className="hidden"
            />
            <input
              ref={quickFileInputRef}
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setIsCompressing(true);
                  try {
                    const comp = await compressImageSource(file, 1200, 1200, 0.8);
                    setQuickPhotoPreview(comp);
                    setPhotoHelperNotice('Foto file berhasil dimuat!');
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsCompressing(false);
                  }
                }
                if (e.target) e.target.value = '';
              }}
              className="hidden"
            />

            {/* In-Modal Alert / Notice */}
            {photoHelperNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{photoHelperNotice}</span>
              </div>
            )}

            {/* Image Preview Box */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 min-h-[200px] flex items-center justify-center p-3 relative">
              {quickPhotoPreview ? (
                <div className="relative w-full h-48 flex items-center justify-center">
                  <img
                    src={quickPhotoPreview}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="max-h-48 max-w-full object-contain rounded-lg shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQuickPhotoPreview('');
                      setPhotoHelperNotice(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <span className="text-xs font-bold text-slate-700 block mt-1">Belum Ada Foto Master</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Gunakan salah satu opsi cepat di bawah untuk menambahkan gambar dengan mudah.
                  </span>
                </div>
              )}
            </div>

            {/* 5 Easy Options */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Pilih Cara Menambah Gambar:
              </span>

              {/* Row 1: Clipboard & Google Images (The 2 easiest methods) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isCompressing}
                  onClick={() => handleReadClipboard(true)}
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-left transition-colors group shadow-2xs"
                >
                  <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                    <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                    <span>Paste Clipboard</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 mt-1 block">
                    Bisa langsung tekan <kbd className="px-1 py-0.5 bg-indigo-200/60 rounded font-mono">Ctrl+V</kbd>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenGoogleImagesSearch(quickPhotoItem.namaStok, quickPhotoItem.kodeStok)}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-left transition-colors group shadow-2xs"
                >
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Cari di Google</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Cari foto, klik kanan Copy Image, tekan Ctrl+V
                  </span>
                </button>
              </div>

              {/* Row 2: File Upload & Camera */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isCompressing}
                  onClick={() => quickFileInputRef.current?.click()}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Upload dari Komputer / HP</span>
                </button>

                <button
                  type="button"
                  disabled={isCompressing}
                  onClick={() => quickCameraInputRef.current?.click()}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>Buka Kamera Langsung</span>
                </button>
              </div>

              {/* Row 3: Link URL Web */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputUrlQuickPhoto}
                  onChange={(e) => setInputUrlQuickPhoto(e.target.value)}
                  placeholder="https://"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
                />
                <button
                  type="button"
                  disabled={!inputUrlQuickPhoto.trim() || isCompressing}
                  onClick={() => handleApplyUrlImage(inputUrlQuickPhoto, true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Pasang URL
                </button>
              </div>

              {/* Row 4: Category Preset Illustrations */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsQuickPhotoPresetsOpen(!isQuickPhotoPresetsOpen)}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isQuickPhotoPresetsOpen ? 'Tutup Ikon Preset' : 'Atau Pilih Ikon / Ilustrasi Kategori Standar'}</span>
                </button>

                {isQuickPhotoPresetsOpen && (
                  <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in">
                    {PRESET_CATEGORY_ILLUSTRATIONS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setQuickPhotoPreview(preset.url);
                          setPhotoHelperNotice(`Ikon "${preset.name}" dipilih.`);
                          setIsQuickPhotoPresetsOpen(false);
                        }}
                        className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-center transition-all flex flex-col items-center gap-1 group shadow-2xs"
                        title={preset.name}
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100">
                          {preset.url.startsWith('data:image/svg+xml') ? (
                            <span className="text-xl">{preset.icon}</span>
                          ) : (
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-slate-700 truncate w-full group-hover:text-indigo-900">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickPhotoItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isCompressing}
                onClick={handleSaveQuickPhoto}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Simpan Foto Master</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: KONFIRMASI RESET LOKASI KE STANDAR                */}
      {/* ======================================================== */}
      {isResetLocationsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Reset ke Lokasi Standar?
              </h3>
              <p className="text-xs text-slate-500">
                Daftar lokasi akan dikembalikan ke 10 lokasi standar (SERVICE LT 1 - 4, DAPUR LT 1 - 4, BAR, KASIR).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetLocationsModalOpen(false)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToDefaultLocations}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
              >
                Ya, Reset Lokasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: KONFIRMASI HAPUS 1 BARANG (IN-APP DIALOG)       */}
      {/* ======================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Barang dari Master Data?
              </h3>
              <p className="text-xs text-slate-500">
                Tindakan ini akan menghapus data barang berikut dari database:
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              {itemToDelete.gambarUrl ? (
                <img
                  src={itemToDelete.gambarUrl}
                  alt={itemToDelete.namaStok}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-bold text-slate-900 truncate">{itemToDelete.namaStok}</div>
                <div className="text-slate-500 font-mono text-[11px]">{itemToDelete.kodeStok}</div>
                <div className="text-slate-400 text-[10px]">{itemToDelete.namaTempat}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Ya, Hapus Barang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: BULK DELETE MULTIPLE ITEMS                      */}
      {/* ======================================================== */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Hapus {selectedIds.length} Barang Terpilih?
              </h3>
              <p className="text-xs text-slate-500">
                Semua {selectedIds.length} produk yang Anda centang akan dihapus permanen dari sistem master.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Ya, Hapus {selectedIds.length} Barang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CLEAR ALL ITEMS CONFIRMATION                    */}
      {/* ======================================================== */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Kosongkan Seluruh Master Barang?
              </h3>
              <p className="text-xs text-slate-500">
                Tindakan ini akan menghapus semua {items.length} produk yang ada di master data saat ini. Anda dapat mengimpor kembali file spreadsheet baru setelahnya.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Ya, Kosongkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CONFIRM REPLACE OLD DATA ON CSV IMPORT          */}
      {/* ======================================================== */}
      {isConfirmReplaceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Gantikan Seluruh Data Lama?
              </h3>
              <p className="text-xs text-slate-500">
                Data master barang lama ({items.length} item) akan digantikan sepenuhnya oleh {csvPreview?.length || 0} produk dari file spreadsheet baru ini.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmReplaceModalOpen(false)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmCsvImport(true)}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Ya, Gantikan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: DELETE LOCATION CONFIRMATION                    */}
      {/* ======================================================== */}
      {locToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Lokasi Rak?
              </h3>
              <p className="text-xs text-slate-500">
                Hapus &quot;<span className="font-bold text-slate-800">{locToDelete}</span>&quot; dari daftar pilihan lokasi operator?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLocToDelete(null)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLocation}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Ya, Hapus Lokasi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
