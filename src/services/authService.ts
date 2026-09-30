import { UserAccount, UserRole, UserStatus } from '../types/inventory';
import { 
  saveCloudUser, 
  deleteCloudUser, 
  subscribeToCloudUsers 
} from './firebase';

const USERS_STORAGE_KEY = 'inventrack_users_v2';
const SESSION_STORAGE_KEY = 'inventrack_session_v2';

const SEED_USERS: UserAccount[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    email: 'admin@inventrack.com',
    fullName: 'Kepala Gudang (Admin)',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    verifiedBy: 'System'
  },
  {
    id: 'user-op-1',
    username: 'budi',
    email: 'budi@inventrack.com',
    fullName: 'Budi Santoso',
    password: 'budi123',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    verifiedBy: 'Kepala Gudang (Admin)'
  },
  {
    id: 'user-op-2',
    username: 'andi',
    email: 'andi@inventrack.com',
    fullName: 'Andi Pratama',
    password: 'andi123',
    role: 'user',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

// Synchronize users in real-time with Cloud Firestore
try {
  subscribeToCloudUsers((cloudUsers) => {
    if (cloudUsers.length > 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cloudUsers));
    } else {
      // Seed initial users to cloud on first setup
      const local = getAllUsers();
      local.forEach(u => saveCloudUser(u).catch(console.error));
    }
  });
} catch (e) {
  console.warn('[Firebase] Auth sync listener not initialized:', e);
}

export function getAllUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to get users:', err);
    return SEED_USERS;
  }
}

export function saveAllUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users:', err);
  }
}

export function getCurrentSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function setCurrentSession(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to set session:', err);
  }
}

export function loginUser(
  identifier: string, 
  passwordInput: string
): { success: boolean; user?: UserAccount; message: string } {
  const users = getAllUsers();
  const cleanId = identifier.trim().toLowerCase();
  
  const found = users.find(u => 
    u.username.toLowerCase() === cleanId || 
    u.email.toLowerCase() === cleanId
  );

  if (!found) {
    return { success: false, message: 'Username atau email tidak terdaftar.' };
  }

  if (found.password !== passwordInput) {
    return { success: false, message: 'Kata sandi yang Anda masukkan salah.' };
  }

  // Check verification status
  if (found.status === 'pending') {
    return { 
      success: false, 
      message: 'Akun Anda sedang menunggu persetujuan / verifikasi dari Admin gudang. Silakan hubungi admin untuk verifikasi.' 
    };
  }

  if (found.status === 'rejected') {
    return { 
      success: false, 
      message: 'Pendaftaran akun Anda ditolak oleh Admin. Silakan hubungi admin gudang.' 
    };
  }

  // Set session
  setCurrentSession(found);
  return { success: true, user: found, message: `Selamat datang, ${found.fullName}!` };
}

export function registerUser(data: {
  username: string;
  email: string;
  fullName: string;
  password: string;
}): { success: boolean; message: string } {
  const users = getAllUsers();
  const cleanUsername = data.username.trim().toLowerCase();
  const cleanEmail = data.email.trim().toLowerCase();

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
  }

  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'Email sudah terdaftar. Silakan login atau gunakan email lain.' };
  }

  const newUser: UserAccount = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    username: data.username.trim(),
    email: cleanEmail,
    fullName: data.fullName.trim(),
    password: data.password,
    role: 'user', // strictly normal user by default
    status: 'pending', // MUST be verified by admin
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveAllUsers(users);
  saveCloudUser(newUser).catch(console.error);

  return {
    success: true,
    message: 'Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi & persetujuan dari Admin gudang sebelum dapat login.'
  };
}

export function verifyUserByAdmin(userId: string, adminName: string): boolean {
  const users = getAllUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return false;

  target.status = 'active';
  target.verifiedAt = new Date().toISOString();
  target.verifiedBy = adminName;
  saveAllUsers(users);
  saveCloudUser(target).catch(console.error);
  return true;
}

export function rejectUserByAdmin(userId: string): boolean {
  const users = getAllUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return false;

  target.status = 'rejected';
  saveAllUsers(users);
  saveCloudUser(target).catch(console.error);
  return true;
}

export function deleteUserByAdmin(userId: string): boolean {
  const users = getAllUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;

  saveAllUsers(filtered);
  deleteCloudUser(userId).catch(console.error);
  return true;
}

/**
 * Admin directly creates active user accounts for warehouse operators
 */
export function createUserByAdmin(data: {
  username: string;
  fullName: string;
  email?: string;
  password: string;
  role?: 'admin' | 'user';
  adminName: string;
}): { success: boolean; message: string; user?: UserAccount } {
  const users = getAllUsers();
  const cleanUsername = data.username.trim().toLowerCase();
  const cleanEmail = (data.email || `${cleanUsername}@inventrack.local`).trim().toLowerCase();

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
  }

  const newUser: UserAccount = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    username: data.username.trim(),
    email: cleanEmail,
    fullName: data.fullName.trim(),
    password: data.password,
    role: data.role || 'user',
    status: 'active', // Instantly active & ready to login
    createdAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    verifiedBy: data.adminName
  };

  users.push(newUser);
  saveAllUsers(users);
  saveCloudUser(newUser).catch(console.error);

  return {
    success: true,
    message: `Akun "${newUser.fullName}" (@${newUser.username}) berhasil dibuat dan langsung aktif.`,
    user: newUser
  };
}

export function updateUserPasswordByAdmin(userId: string, newPassword: string): boolean {
  const users = getAllUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return false;

  target.password = newPassword;
  saveAllUsers(users);
  saveCloudUser(target).catch(console.error);
  return true;
}

export function logoutUser(): void {
  setCurrentSession(null);
}
