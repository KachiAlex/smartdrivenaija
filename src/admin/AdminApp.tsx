import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { api, type AdminUser, type Stats, type User, type Pagination } from './api';
import { ContentTab } from './ContentTab';
import { SettingsTab } from './SettingsTab';

// ── Tiny toast ────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'ok' | 'err' }[]>([]);
  const show = (msg: string, type: 'ok' | 'err' = 'ok') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };
  return { toasts, ok: (m: string) => show(m, 'ok'), err: (m: string) => show(m, 'err') };
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-[#E63946]/10 glass-card flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[#0F172A] leading-tight">{value}</p>
      </div>
    </motion.div>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────
const roleBadge: Record<string, string> = {
  learner: 'bg-blue-100 text-blue-700',
  instructor: 'bg-purple-100 text-purple-700',
  school_admin: 'bg-orange-100 text-orange-700',
  frsc_admin: 'bg-red-100 text-red-700',
  admin: 'bg-gray-800 text-white',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge[role] || 'bg-gray-100 text-gray-600'}`}>
      {role.replace('_', ' ')}
    </span>
  );
}

// ── User detail drawer ────────────────────────────────────────────────────────
function UserDrawer({ userId, token, onClose, onUpdated }: { userId: string; token: string; onClose: () => void; onUpdated: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.getUser(token, userId).then(u => {
      setUser(u); setRole(u.role); setIsPremium(u.is_premium); setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, token]);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateUser(token, userId, { role, isPremium });
      toast.ok('User updated');
      onUpdated();
    } catch (e: any) { toast.err(e.message); }
    finally { setSaving(false); }
  };

  const revoke = async () => {
    if (!confirm('Revoke all active sessions for this user?')) return;
    try {
      const r = await api.revokeSessions(token, userId);
      toast.ok(`${r.count} session(s) revoked`);
    } catch (e: any) { toast.err(e.message); }
  };

  const del = async () => {
    if (!confirm(`Delete user ${user?.email || user?.phone}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(token, userId);
      toast.ok('User deleted');
      onUpdated();
      onClose();
    } catch (e: any) { toast.err(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
        {/* Toast */}
        <div className="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none">
          {toast.toasts.map(t => (
            <div key={t.id} className={`px-4 py-2 rounded-xl text-sm font-medium shadow-lg ${t.type === 'ok' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{t.msg}</div>
          ))}
        </div>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">User Detail</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading…</div>
        ) : !user ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Not found</div>
        ) : (
          <div className="flex-1 p-6 space-y-5">
            {/* Identity */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center text-white text-xl font-bold">
                  {(user.full_name || user.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user.full_name || '—'}</p>
                  <p className="text-xs text-gray-500">{user.email || user.phone || 'No contact'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div><span className="text-gray-400">Phone:</span> <span className="text-gray-700 font-medium">{user.phone || '—'}</span></div>
                <div><span className="text-gray-400">Email:</span> <span className="text-gray-700 font-medium">{user.email || '—'}</span></div>
                <div><span className="text-gray-400">XP:</span> <span className="text-gray-700 font-medium">{user.xp_total}</span></div>
                <div><span className="text-gray-400">Streak:</span> <span className="text-gray-700 font-medium">{user.streak_current} 🔥</span></div>
                <div><span className="text-gray-400">Sessions:</span> <span className="text-gray-700 font-medium">{user.active_sessions}</span></div>
                <div><span className="text-gray-400">Password:</span> <span className="text-gray-700 font-medium">{user.has_password ? '✓ Set' : '✗ None'}</span></div>
                <div><span className="text-gray-400">Joined:</span> <span className="text-gray-700 font-medium">{new Date(user.created_at).toLocaleDateString()}</span></div>
                <div><span className="text-gray-400">Language:</span> <span className="text-gray-700 font-medium">{user.preferred_language}</span></div>
              </div>
            </div>

            {/* Edit role */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-[#E63946] outline-none">
                {['learner', 'instructor', 'school_admin', 'frsc_admin'].map(r => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Premium toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Premium Account</p>
                <p className="text-xs text-gray-400">Grants premium features access</p>
              </div>
              <button
                onClick={() => setIsPremium(v => !v)}
                className={`w-12 h-6 rounded-full transition-colors ${isPremium ? 'bg-green-500' : 'bg-gray-300'} relative`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isPremium ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Actions */}
            <button onClick={save} disabled={saving} className="w-full h-11 bg-[#1D3557] text-white rounded-xl font-semibold text-sm hover:bg-[#0A1628] disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>

            <button onClick={revoke} className="w-full h-11 border-2 border-orange-200 text-orange-600 rounded-xl font-semibold text-sm hover:bg-orange-50 transition-colors">
              Revoke All Sessions
            </button>

            <button onClick={del} className="w-full h-11 border-2 border-red-200 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors">
              Delete User
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { date: string; count: string }[] }) {
  if (!data.length) return <p className="text-xs text-gray-400 text-center py-6">No data</p>;
  const max = Math.max(...data.map(d => parseInt(d.count)), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 pt-2">
      {data.map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-gradient-to-t from-[#E63946] to-[#F4A261] rounded-sm"
            style={{ height: `${(parseInt(d.count) / max) * 64}px`, minHeight: 2 }}
          />
          <span className="text-[9px] text-gray-400 rotate-45 origin-left leading-none">
            {new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main AdminApp ─────────────────────────────────────────────────────────────
export function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token') || '');
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const s = sessionStorage.getItem('admin_user');
    return s ? JSON.parse(s) : null;
  });

  const [tab, setTab] = useState<'dashboard' | 'users' | 'content' | 'settings'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const toast = useToast();

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    setToken(''); setAdmin(null);
  };

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoadingStats(true);
    try { setStats(await api.stats(token)); }
    catch (e: any) { if (e.message.includes('401')) logout(); }
    finally { setLoadingStats(false); }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const r = await api.users(token, { page, search, role: roleFilter });
      setUsers(r.users); setPagination(r.pagination);
    } catch (e: any) { if (e.message.includes('401')) logout(); }
    finally { setLoadingUsers(false); }
  }, [token, page, search, roleFilter]);

  useEffect(() => { if (token && tab === 'dashboard') fetchStats(); }, [token, tab, fetchStats]);
  useEffect(() => { if (token && tab === 'users') fetchUsers(); }, [token, tab, page, fetchUsers]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(''); setLoggingIn(true);
    try {
      const r = await api.login(email, password);
      sessionStorage.setItem('admin_token', r.token);
      sessionStorage.setItem('admin_user', JSON.stringify(r.user));
      setToken(r.token); setAdmin(r.user);
    } catch (e: any) { setLoginError(e.message); }
    finally { setLoggingIn(false); }
  };

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!token || !admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] to-[#1D3557] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center text-white text-3xl mb-3">🚗</div>
            <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>SmartDrive Admin</h1>
            <p className="text-xs text-gray-500 mt-1">Sign in to your admin account</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@example.com"
                className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:border-[#E63946] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:border-[#E63946] outline-none transition-colors"
              />
            </div>
            {loginError && <p className="text-xs text-red-500 font-medium">{loginError}</p>}
            <button
              type="submit" disabled={loggingIn}
              className="w-full h-11 text-white font-semibold rounded-xl text-sm disabled:opacity-60 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#1D3557,#0A1628)' }}
            >
              {loggingIn ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard layout ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFBFF] flex flex-col">
      {/* Global toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toast.toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded-xl text-sm font-medium shadow-lg ${t.type === 'ok' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{t.msg}</div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 flex flex-col py-6 px-4 gap-1 shrink-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A1628 0%, #1D3557 100%)' }}>
          <div className="flex items-center gap-2 px-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center text-white text-base">🚗</div>
            <span className="text-white font-bold text-sm">SmartDrive</span>
          </div>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'users',     label: 'Users',     icon: '👥' },
            { id: 'content',   label: 'Content',   icon: '📚' },
            { id: 'settings',  label: 'Settings',  icon: '⚙️' },
          ].map(item => (
            <motion.button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left relative overflow-hidden
                ${tab === item.id ? 'text-white' : 'text-white/50 hover:text-white'}`}
            >
              {tab === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/15 rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.icon}</span>
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          ))}

          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="px-3 mb-3">
              <p className="text-xs text-white/40 truncate">{admin.email}</p>
              <p className="text-xs text-white/70 font-semibold">{admin.fullName || 'Admin'}</p>
            </div>
            <motion.button
              onClick={logout}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-colors w-full"
            >
              <span>🚪</span> Sign out
            </motion.button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">

          {/* ── Dashboard tab ── */}
          {tab === 'dashboard' && (
            <div className="p-8 space-y-6 max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
              >
                <div>
                  <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard</h1>
                  <p className="text-gray-500 text-sm mt-0.5">Welcome back, {admin.fullName || admin.email}</p>
                </div>
                <motion.button
                  onClick={fetchStats}
                  disabled={loadingStats}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {loadingStats ? '⟳ Loading…' : '⟳ Refresh'}
                </motion.button>
              </motion.div>

              {loadingStats && !stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <motion.div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} />
                  ))}
                </div>
              ) : stats ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="from-blue-500 to-blue-600" />
                    <StatCard label="Premium" value={stats.premiumUsers} icon="⭐" color="from-[#F59E0B] to-[#F59E0B]" />
                    <StatCard label="New Today" value={stats.newToday} icon="🆕" color="from-green-500 to-green-600" />
                    <StatCard label="OTP Today" value={stats.otpRequestsToday} icon="🔐" color="from-purple-500 to-purple-600" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {/* Signups chart */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E63946]/10 glass-card">
                      <p className="text-sm font-semibold text-[#0F172A] mb-3">Signups — Last 7 Days</p>
                      <MiniBarChart data={stats.signupsLast7Days} />
                    </div>

                    {/* Role breakdown */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E63946]/10 glass-card">
                      <p className="text-sm font-semibold text-[#0F172A] mb-3">Users by Role</p>
                      <div className="space-y-2">
                        {stats.roleBreakdown.filter(r => r.role !== 'admin').map(r => {
                          const pct = stats.totalUsers ? Math.round((parseInt(r.count) / stats.totalUsers) * 100) : 0;
                          return (
                            <div key={r.role}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 font-medium capitalize">{r.role.replace('_', ' ')}</span>
                                <span className="text-gray-400">{r.count} ({pct}%)</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#E63946] to-[#F4A261] rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  {/* Active sessions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-[#E63946]/10 glass-card flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[#E63946] to-[#F4A261] rounded-xl flex items-center justify-center text-2xl">🔑</div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Sessions</p>
                      <p className="text-2xl font-bold text-[#0F172A]">{stats.activeRefreshTokens}</p>
                    </div>
                  </motion.div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Failed to load stats</p>
              )}
            </div>
          )}

          {/* ── Users tab ── */}
          {tab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 space-y-4 max-w-6xl"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#0F172A]">Users</h1>
                <span className="text-sm text-gray-400">{pagination?.total ?? '—'} total</span>
              </div>

              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <input
                  type="search"
                  placeholder="Search name, email, phone…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                  className="flex-1 min-w-48 h-10 px-4 border-2 border-gray-200 rounded-xl text-sm bg-white focus:border-[#E63946] outline-none"
                />
                <select
                  value={roleFilter}
                  onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                  className="h-10 px-3 border-2 border-gray-200 rounded-xl text-sm bg-white focus:border-[#E63946] outline-none"
                >
                  <option value="">All roles</option>
                  {['learner', 'instructor', 'school_admin', 'frsc_admin'].map(r => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
                <button onClick={fetchUsers} className="h-10 px-4 bg-[#1D3557] text-white text-sm rounded-xl hover:bg-[#0A1628] transition-colors">
                  Search
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E63946]/10 glass-card overflow-hidden">
                {loadingUsers ? (
                  <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No users found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">XP</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Premium</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Joined</th>
                          <th className="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <motion.tr
                            key={u.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{u.full_name || <span className="text-gray-400 italic">No name</span>}</p>
                                  <p className="text-xs text-gray-400">{u.email || u.phone || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                            <td className="px-5 py-3.5 text-gray-600 font-medium">{u.xp_total.toLocaleString()}</td>
                            <td className="px-5 py-3.5">
                              {u.is_premium
                                ? <span className="text-yellow-500 font-semibold text-xs">⭐ Premium</span>
                                : <span className="text-gray-300 text-xs">—</span>
                              }
                            </td>
                            <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="px-5 py-3.5">
                              <button
                                onClick={() => setSelectedUserId(u.id)}
                                className="text-xs text-[#E63946] font-semibold hover:underline"
                              >
                                View →
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={pagination.page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                      >← Prev</button>
                      <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                      >Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {/* ── Content tab ── */}
          {tab === 'content' && <ContentTab token={token} toast={toast} />}

          {/* ── Settings tab ── */}
          {tab === 'settings' && (
            <SettingsTab
              token={token}
              toast={toast}
              onLogout={() => {
                sessionStorage.removeItem('admin_token');
                sessionStorage.removeItem('admin_user');
                setToken('');
                setAdmin(null);
              }}
            />
          )}
        </main>
      </div>

      {/* User detail drawer */}
      {selectedUserId && (
        <UserDrawer
          userId={selectedUserId}
          token={token}
          onClose={() => setSelectedUserId(null)}
          onUpdated={() => { fetchUsers(); setSelectedUserId(null); toast.ok('Updated'); }}
        />
      )}
    </div>
  );
}
