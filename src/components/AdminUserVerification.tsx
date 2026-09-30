import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Mail,
  User,
  Shield
} from 'lucide-react';
import { UserAccount } from '../types/inventory';
import { 
  getAllUsers, 
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
  const [notice, setNotice] = useState<string | null>(null);

  const refreshList = () => {
    const updated = getAllUsers();
    setUsers(updated);
    if (onUsersUpdated) onUsersUpdated();
  };

  const handleApprove = (userId: string, name: string) => {
    verifyUserByAdmin(userId, currentAdmin.fullName || 'Admin');
    setNotice(`Akun "${name}" telah diverifikasi dan disetujui. Pengguna kini dapat login.`);
    refreshList();
    setTimeout(() => setNotice(null), 4000);
  };

  const handleReject = (userId: string, name: string) => {
    rejectUserByAdmin(userId);
    setNotice(`Pendaftaran akun "${name}" telah ditolak.`);
    refreshList();
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDelete = (userId: string, name: string) => {
    if (window.confirm(`Hapus akun pengguna "${name}" secara permanen?`)) {
      deleteUserByAdmin(userId);
      setNotice(`Akun "${name}" telah dihapus.`);
      refreshList();
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'active');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  return (
    <div className="space-y-6">
      
      {/* Notice Banner */}
      {notice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* SECTION 1: MENUNGGU VERIFIKASI ADMIN (Priority) */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <h3 className="text-sm font-bold text-slate-900">
              Permohonan Akun User Baru Menunggu Verifikasi
            </h3>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-lg">
            {pendingUsers.length} Permintaan
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            Tidak ada permohonan pendaftaran yang tertunda. Semua akun user telah diverifikasi.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {pendingUsers.map(user => (
              <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {user.fullName}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      @{user.username}
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                      Menunggu Verifikasi
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {user.email}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Mendaftar: {new Date(user.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleReject(user.id, user.fullName)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>

                  <button
                    onClick={() => handleApprove(user.id, user.fullName)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Setujui & Verifikasi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: DAFTAR PENGGUNA AKTIF */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Daftar Akun Pengguna Aktif & Terverifikasi
          </h3>
          <span className="text-xs text-slate-400">
            {activeUsers.length} Pengguna Aktif
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Nama & Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Peran (Role)</th>
                <th className="px-4 py-3">Status Verifikasi</th>
                <th className="px-4 py-3">Diverifikasi Oleh</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {activeUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {u.role === 'admin' ? (
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{u.fullName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                  </td>

                  <td className="px-4 py-3 font-mono">{u.email}</td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'admin'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role === 'admin' ? 'ADMIN' : 'OPERATOR (USER)'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Terverifikasi
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {u.verifiedBy || 'Admin'}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {u.id !== currentAdmin.id && u.username !== 'admin' && (
                      <button
                        onClick={() => handleDelete(u.id, u.fullName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus akun"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
