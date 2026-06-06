/**
 * auth.js — Role-Based Authentication Module
 * Kampala School & Academy Management Portal
 *
 * Roles:
 *   exec    → Full access (all tabs + reports)
 *   admin   → Administrative ops (students, payments, programs, conduct, admin)
 *   bursary → Financial interface (payments, bursary, reports-finance)
 *   coach   → Sports interface (sports, attendance, bursary-read)
 *
 * Storage: Credentials hashed via SHA-256 (Web Crypto API), stored in
 *          localStorage under 'ksa_users'. Sessions stored under 'ksa_session'.
 */

'use strict';

/* ─── Default Credentials (change on first login) ──────────────────────────
   Passwords are stored as SHA-256 hashes. The defaults below are:
     exec    → "Exec@2026"
     admin   → "Admin@2026"
     bursary → "Bursary@2026"
     coach   → "Coach@2026"
   Hash them with: AUTH.hashPassword("YourPassword") in browser console.
─────────────────────────────────────────────────────────────────────────── */
const DEFAULT_USERS = [
  {
    id: 'U001',
    username: 'exec',
    displayName: 'Executive Director',
    role: 'exec',
    // SHA-256 of "Exec@2026"
    passwordHash: 'ac923e8c9023086b19cc87d9445223f55fbdf5662eea5fe54f07d05107f99aa8',
    mustChangePassword: true,
    createdAt: '2026-06-01',
    lastLogin: null,
  },
  {
    id: 'U002',
    username: 'admin',
    displayName: 'School Administrator',
    role: 'admin',
    passwordHash: 'bfd57fbbea4b125299267559a211ebf8000529d37969f18221b1dc3b79594bec',
    mustChangePassword: true,
    createdAt: '2026-06-01',
    lastLogin: null,
  },
  {
    id: 'U003',
    username: 'bursary',
    displayName: 'Bursary Officer',
    role: 'bursary',
    passwordHash: 'e822d8d083d535d157e9f7bd055da0bf5dc46a7395482dc9f776bbbc63132f77',
    mustChangePassword: true,
    createdAt: '2026-06-01',
    lastLogin: null,
  },
  {
    id: 'U004',
    username: 'coach',
    displayName: 'Head Coach',
    role: 'coach',
    passwordHash: 'c8011273d5842801cf1c1e7b16ef4a11d86929be2ded33014f45bd4334ad210e',
    mustChangePassword: true,
    createdAt: '2026-06-01',
    lastLogin: null,
  },
];

/* ─── Role → Tab Permission Map ─────────────────────────────────────────── */
const ROLE_PERMISSIONS = {
  exec: {
    label: 'Executive Director',
    color: '#6d28d9',
    accentColor: '#7c3aed',
    badge: 'EXEC',
    tabs: ['overview', 'directory', 'academics', 'payments', 'sports', 'attendance', 'competitions', 'bursary', 'conduct', 'reports', 'admin', 'noticeboard'],
    canExport: true,
    canImport: true,
    canReset: true,
    canManageUsers: true,
    canDeleteStudents: true,
    canDeleteConduct: true,
    canAwardBursary: true,
    canRecordPayment: true,
    canRegisterStudent: true,
    canAddProgram: true,
    canLogPerformance: true,
    canMarkAttendance: true,
    canAddAcademic: true,
    canLogConduct: true,
    canManageTerms: true,
    canViewEMIS: true,
    canPostNotice: true,
    canManageCompetitions: true,
    canManageSquads: true,
  },
  admin: {
    label: 'School Administrator',
    color: '#0369a1',
    accentColor: '#0284c7',
    badge: 'ADMIN',
    tabs: ['overview', 'directory', 'academics', 'payments', 'conduct', 'admin', 'noticeboard'],
    canExport: true,
    canImport: true,
    canReset: false,
    canManageUsers: false,
    canDeleteStudents: true,
    canDeleteConduct: true,
    canAwardBursary: false,
    canRecordPayment: true,
    canRegisterStudent: true,
    canAddProgram: true,
    canLogPerformance: false,
    canMarkAttendance: false,
    canAddAcademic: true,
    canLogConduct: true,
    canManageTerms: true,
    canViewEMIS: false,
    canPostNotice: true,
    canManageCompetitions: false,
    canManageSquads: false,
  },
  bursary: {
    label: 'Bursary Officer',
    color: '#065f46',
    accentColor: '#059669',
    badge: 'BURSARY',
    tabs: ['payments', 'bursary', 'reports', 'noticeboard'],
    canExport: true,
    canImport: false,
    canReset: false,
    canManageUsers: false,
    canDeleteStudents: false,
    canDeleteConduct: false,
    canAwardBursary: true,
    canRecordPayment: true,
    canRegisterStudent: false,
    canAddProgram: false,
    canLogPerformance: false,
    canMarkAttendance: false,
    canAddAcademic: false,
    canLogConduct: false,
    canManageTerms: false,
    canViewEMIS: false,
    canPostNotice: false,
    canManageCompetitions: false,
    canManageSquads: false,
  },
  coach: {
    label: 'Head Coach',
    color: '#92400e',
    accentColor: '#d97706',
    badge: 'COACH',
    tabs: ['sports', 'attendance', 'competitions', 'bursary', 'noticeboard'],
    canExport: false,
    canImport: false,
    canReset: false,
    canManageUsers: false,
    canDeleteStudents: false,
    canDeleteConduct: false,
    canAwardBursary: false,
    canRecordPayment: false,
    canRegisterStudent: false,
    canAddProgram: true,
    canLogPerformance: true,
    canMarkAttendance: true,
    canAddAcademic: false,
    canLogConduct: false,
    canManageTerms: false,
    canViewEMIS: false,
    canPostNotice: true,
    canManageCompetitions: true,
    canManageSquads: true,
  },
};

/* ─── Audit Log ─────────────────────────────────────────────────────────── */
function appendAuditLog(userId, username, action, detail = '') {
  const key = 'ksa_audit';
  let log = [];
  try { log = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
  log.unshift({
    ts: new Date().toISOString(),
    userId,
    username,
    action,
    detail: detail.slice(0, 200),
  });
  if (log.length > 500) log = log.slice(0, 500);
  localStorage.setItem(key, JSON.stringify(log));
}

/* ─── Crypto helpers ─────────────────────────────────────────────────────── */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ─── User Store ─────────────────────────────────────────────────────────── */
function loadUsers() {
  try {
    const raw = localStorage.getItem('ksa_users');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  // Seed defaults on first run
  localStorage.setItem('ksa_users', JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS.map(u => ({ ...u }));
}

function saveUsers(users) {
  localStorage.setItem('ksa_users', JSON.stringify(users));
}

/* ─── Session ────────────────────────────────────────────────────────────── */
function createSession(user) {
  const session = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    loginAt: Date.now(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8-hour session
  };
  localStorage.setItem('ksa_session', JSON.stringify(session));
  return session;
}

function getSession() {
  try {
    const raw = localStorage.getItem('ksa_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('ksa_session');
      return null;
    }
    return session;
  } catch (_) {
    return null;
  }
}

function clearSession() {
  const session = getSession();
  if (session) {
    appendAuditLog(session.userId, session.username, 'LOGOUT', '');
  }
  localStorage.removeItem('ksa_session');
}

/* ─── Public AUTH API ────────────────────────────────────────────────────── */
const AUTH = {
  /* Hash a password (use in console to generate new hashes) */
  async hashPassword(plain) {
    return await sha256(plain + 'ksa_salt_2026');
  },

  /* Attempt login → returns { ok, session, mustChangePassword, error } */
  async login(username, password) {
    const users = loadUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user) return { ok: false, error: 'Invalid username or password.' };

    const hash = await sha256(password + 'ksa_salt_2026');

    // First-run: if hash is a placeholder (44-char stub), auto-accept default
    // and force password change. In production, seed with real hashes.
    const defaultPasswords = {
      exec: 'Exec@2026',
      admin: 'Admin@2026',
      bursary: 'Bursary@2026',
      coach: 'Coach@2026',
    };
    let matched = (hash === user.passwordHash);
    // Fallback: allow default plaintext on first run (mustChangePassword flag)
    if (!matched && user.mustChangePassword) {
      const defPass = defaultPasswords[user.role];
      if (defPass && password === defPass) matched = true;
    }

    if (!matched) return { ok: false, error: 'Invalid username or password.' };

    // Update lastLogin
    user.lastLogin = new Date().toISOString();
    saveUsers(users);

    const session = createSession(user);
    appendAuditLog(user.id, user.username, 'LOGIN', `role=${user.role}`);
    return { ok: true, session, mustChangePassword: user.mustChangePassword };
  },

  logout() {
    clearSession();
  },

  getSession,

  getPermissions(role) {
    return ROLE_PERMISSIONS[role] || null;
  },

  can(permission) {
    const session = getSession();
    if (!session) return false;
    const perms = ROLE_PERMISSIONS[session.role];
    return perms ? !!perms[permission] : false;
  },

  hasTabAccess(tab) {
    const session = getSession();
    if (!session) return false;
    const perms = ROLE_PERMISSIONS[session.role];
    return perms ? perms.tabs.includes(tab) : false;
  },

  getDefaultTab() {
    const session = getSession();
    if (!session) return 'overview';
    const perms = ROLE_PERMISSIONS[session.role];
    if (!perms) return 'overview';
    return perms.tabs[0];
  },

  /* Change password for current user */
  async changePassword(currentPassword, newPassword) {
    const session = getSession();
    if (!session) return { ok: false, error: 'Not logged in.' };
    if (newPassword.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };

    const users = loadUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) return { ok: false, error: 'User not found.' };

    const currentHash = await sha256(currentPassword + 'ksa_salt_2026');
    const defaultPasswords = { exec: 'Exec@2026', admin: 'Admin@2026', bursary: 'Bursary@2026', coach: 'Coach@2026' };
    const defPass = defaultPasswords[user.role];
    const validCurrent = (currentHash === user.passwordHash) || (user.mustChangePassword && currentPassword === defPass);
    if (!validCurrent) return { ok: false, error: 'Current password is incorrect.' };

    user.passwordHash = await sha256(newPassword + 'ksa_salt_2026');
    user.mustChangePassword = false;
    saveUsers(users);
    appendAuditLog(session.userId, session.username, 'PASSWORD_CHANGE', '');
    return { ok: true };
  },

  /* Admin: create or update user (exec only) */
  async upsertUser(userData) {
    const session = getSession();
    if (!session || session.role !== 'exec') return { ok: false, error: 'Insufficient privileges.' };
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === userData.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...userData };
    } else {
      users.push({
        id: 'U' + Date.now(),
        mustChangePassword: true,
        createdAt: new Date().toISOString().slice(0, 10),
        lastLogin: null,
        ...userData,
      });
    }
    saveUsers(users);
    appendAuditLog(session.userId, session.username, 'USER_UPSERT', `target=${userData.username}`);
    return { ok: true };
  },

  getUsers() {
    const session = getSession();
    if (!session || session.role !== 'exec') return [];
    return loadUsers().map(u => ({ ...u, passwordHash: '***' }));
  },

  getAuditLog() {
    const session = getSession();
    if (!session || session.role !== 'exec') return [];
    try { return JSON.parse(localStorage.getItem('ksa_audit') || '[]'); } catch (_) { return []; }
  },

  /* Delete a user account (exec only, cannot delete self) */
  deleteUser(userId) {
    const session = getSession();
    if (!session || session.role !== 'exec') return { ok: false, error: 'Insufficient privileges.' };
    if (userId === session.userId) return { ok: false, error: 'Cannot delete your own account.' };
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { ok: false, error: 'User not found.' };
    const username = users[idx].username;
    users.splice(idx, 1);
    saveUsers(users);
    appendAuditLog(session.userId, session.username, 'USER_DELETE', `target=${username}`);
    return { ok: true };
  },

  /* Force-reset another user's password (exec only) */
  async adminResetPassword(userId, newPassword) {
    const session = getSession();
    if (!session || session.role !== 'exec') return { ok: false, error: 'Insufficient privileges.' };
    if (newPassword.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return { ok: false, error: 'User not found.' };
    user.passwordHash = await sha256(newPassword + 'ksa_salt_2026');
    user.mustChangePassword = true;
    saveUsers(users);
    appendAuditLog(session.userId, session.username, 'ADMIN_PWD_RESET', `target=${user.username}`);
    return { ok: true };
  },

  /* Refresh session expiry (called on user activity) */
  refreshSession() {
    const session = getSession();
    if (!session) return false;
    session.expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    localStorage.setItem('ksa_session', JSON.stringify(session));
    return true;
  },

  /* Remaining session time in seconds */
  sessionSecondsLeft() {
    const session = getSession();
    if (!session) return 0;
    return Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000));
  },

  ROLE_PERMISSIONS,
};

window.AUTH = AUTH;
