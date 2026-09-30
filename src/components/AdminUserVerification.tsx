import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  User,
  Shield,
  Plus,
  Key,
  Eye,
  EyeOff,
  UserPlus,
  Clock,
  Sparkles
} from 'lucide-react';
import { UserAccount } from '../types/inventory';
import { 
  getAllUsers, 
  createUserByAdmin,
  updateUserPasswordByAdmin,
  verifyUserByAdmin, 
  rejectUserByAdmin, 
  deleteUserByAdmin 
} from '../services/authService';

interface AdminUserVerificationProps {
  currentAdmin: UserAccount;
  onUsersUpdated?: () => void;
}

export const AdminUserVerification: React.FC<AdminUserVerificationProps> = ({
  currentAdmin,
  onUsersUpdated
}) => {
  const [users, setUsers] = useState<UserAccount[]>(getAllUsers());
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for creating new user
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  // Change password modal/inline state
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [changePasswordValue, setChangePasswordValue] = useState('');

  // Visible passwords toggles
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const refreshList = () => {
    const updated = getAllUsers();
    setUsers(updated);
    if (onUsersUpdated) onUsersUpdated();
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4500);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim() || !newPassword.trim()) {
      showNotification('error', 'Semua kolom nama, username, dan kata sandi wajib diisi.');
      return;
    }

    if (newPassword.length < 4) {
      showNotification('error', 'Kata sandi minimal 4 karakter.');
      return;
    }

    const res = createUserByAdmin({
      fullName: newFullName.trim(),
      username: newUsername.trim(),
      password: newPassword.trim(),
      role: newRole,
      adminName: currentAdmin.fullName || 'Admin'
    });

    if (!res.success) {
      showNotification('error', res.message);
      return;
    }

    showNotification('success', res.message);
    setNewFullName('');
    setNewUsername('');
    setNewPassword('');
    setShowCreateForm(false);
    refreshList();
  };

  const handleTogglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleSaveNewPassword = (userId: string, name: string) => {
    if (!changePasswordValue.trim() || changePasswordValue.length < 4) {
      showNotification('error', 'Kata sandi baru minimal 4 karakter.');
      return;
    }

    updateUserPasswordByAdmin(userId, changePasswordValue.trim());
    setEditingPasswordUserId(null);
    setChangePasswordValue('');
    showNotification('success', `Kata sandi akun "${name}" berhasil diperbarui.`);
    refreshList();
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (userId === currentAdmin.id) {
      showNotification('error', 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.');
      return;
    }

    if (window.confirm(`Hapus akun pengguna "${name}" secara permanen? Akun ini tidak akan dapat login lagi.`)) {
      deleteUserByAdmin(userId);
      showNotification('success', `Akun "${name}" telah dihapus.`);
      refreshList();
    }
  };

  const handleApprovePending = (userId: string, name: string) => {
    verifyUserByAdmin(userId, currentAdmin.fullName || 'Admin');
    showNotification('success', `Akun "${name}" telah disetujui.`);
    refreshList();
  };

  const handleRejectPending = (userId: string, name: string) => {
    rejectUserByAdmin(userId);
    showNotification('success', `Permohonan akun "${name}" telah ditolak.`);
    refreshList();
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'active');

  return (
    <div className="space-y-6">
      
      {/* Notice Banner */}
      {notice && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
          notice.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {notice.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{notice.message}</span>
        </div>
      )}

      {/* Top Action Header: Admin User Creation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Manajemen Akun Operator & Staf Gudang
              </h3>
              <p className="text-xs text-slate-500">
                Hanya Admin yang berwenang membuat akun untuk user. User tidak dapat mendaftar sendiri.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(prev => !prev)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <span>{showCreateForm ? 'Tutup Formulir' : '+ Buat Akun Operator Baru'}</span>
        </button>
      </div>

      {/* Form: Buat Akun Operator Baru */}
      {showCreateForm && (
        <form 
          onSubmit={handleCreateUserSubmit}
          className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in zoom-in-98"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-900" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Formulir Pembuatan Akun Baru (Langsung Aktif)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Nama Lengkap Petugas *
              </label>
              <input
                type="text"
                required
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Username Login *
              </label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Kata Sandi *
              </label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Hak Akses / Peran
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="user">Operator Lapangan (Hanya Input)</option>
                <option value="admin">Administrator Gudang (Akses Penuh)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan & Aktifkan Akun</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION PENDING (Jika sebelumnya ada pendaftaran lama) */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Permohonan Lama Menunggu Persetujuan ({pendingUsers.length})
            </h4>
          </div>
          <div className="divide-y divide-amber-200/60 border border-amber-200 rounded-xl overflow-hidden bg-white">
            {pendingUsers.map(user => (
              <div key={user.id} className="p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{user.fullName}</span>{' '}
                  <span className="text-slate-500 font-mono">(@{user.username})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRejectPending(user.id, user.fullName)}
                    className="px-2.5 py-1 text-slate-600 hover:text-rose-700 border border-slate-200 rounded text-[11px]"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleApprovePending(user.id, user.fullName)}
                    className="px-3 py-1 bg-emerald-600 text-white font-bold rounded text-[11px]"
                  >
                    Setujui
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: TABEL SEMUA AKUN AKTIF */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Daftar Akun Pengguna Aktif ({activeUsers.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Tersimpan di Cloud Firestore
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Nama Petugas</th>
                <th className="px-4 py-3">Username Login</th>
                <th className="px-4 py-3">Peran / Hak Akses</th>
                <th className="px-4 py-3">Kata Sandi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {activeUsers.map(user => {
                const isCurrentUser = user.id === currentAdmin.id;
                const isPasswordEditing = editingPasswordUserId === user.id;
                const isPasswordVisible = !!visiblePasswords[user.id];

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Nama */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                          user.role === 'admin' ? 'bg-slate-900' : 'bg-emerald-600'
                        }`}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">{user.fullName}</span>
                          {isCurrentUser && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                              (Anda)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">
                      @{user.username}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        user.role === 'admin'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                      }`}>
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3 text-amber-600" />
                            <span>Admin Gudang</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 text-emerald-600" />
                            <span>Operator Lapangan</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Password View / Edit */}
                    <td className="px-4 py-3">
                      {isPasswordEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={changePasswordValue}
                            onChange={(e) => setChangePasswordValue(e.target.value)}
                            className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                          <button
                            onClick={() => handleSaveNewPassword(user.id, user.fullName)}
                            className="px-2 py-1 bg-slate-900 text-white rounded text-[11px] font-bold"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => {
                              setEditingPasswordUserId(null);
                              setChangePasswordValue('');
                            }}
                            className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-[11px]"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {isPasswordVisible ? (user.password || '******') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePasswordVisibility(user.id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                            title={isPasswordVisible ? 'Sembunyikan sandi' : 'Lihat sandi'}
                          >
                            {isPasswordVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPasswordUserId(user.id);
                              setChangePasswordValue(user.password || '');
                            }}
                            className="text-[11px] text-indigo-600 hover:underline font-medium ml-1"
                          >
                            Ubah
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.fullName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus akun ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center justify-between">
          <span>
            💡 Berikan username dan kata sandi yang tertera di atas kepada operator terkait untuk mereka gunakan login di HP masing-masing.
          </span>
        </div>
      </div>

    </div>
  );
};
