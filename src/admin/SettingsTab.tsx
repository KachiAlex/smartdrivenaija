import { useState } from 'react';
import { motion } from 'motion/react';
import { api } from './api';

// ── Password strength bar ─────────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const s = !password ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[^a-zA-Z0-9]/.test(password) ? 4 : 3;
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= s ? colors[s] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${s <= 1 ? 'text-red-400' : s === 2 ? 'text-orange-400' : s === 3 ? 'text-yellow-500' : 'text-green-600'}`}>
        {labels[s]}
      </p>
    </div>
  );
}

// ── Change Password Card ──────────────────────────────────────────────────────
function ChangePasswordCard({ token, toast }: { token: string; toast: { ok: (m: string) => void; err: (m: string) => void } }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:border-[#E63946] outline-none transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) { toast.err('Password must be at least 6 characters'); return; }
    if (next !== confirm) { toast.err('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.changePassword(token, current, next);
      toast.ok('Password changed successfully');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: any) { toast.err(e.message || 'Failed to change password'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E63946]/10 glass-card shadow-sm p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1D3557]/10 flex items-center justify-center text-[#1D3557] text-lg">🔑</div>
        <div>
          <h2 className="font-bold text-gray-800">Change Password</h2>
          <p className="text-xs text-gray-400">Update your admin account password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Current Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder="Enter current password"
              className={inputCls + ' pr-12'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">New Password</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={next}
            onChange={e => setNext(e.target.value)}
            placeholder="Min 6 characters"
            className={inputCls}
            required
          />
          <StrengthBar password={next} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Confirm New Password</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            className={inputCls + (confirm && confirm !== next ? ' border-red-400' : '')}
            required
          />
          {confirm && confirm !== next && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
        </div>

        <button
          type="submit"
          disabled={saving || !current || next.length < 6 || next !== confirm}
          className="w-full h-11 bg-[#1D3557] text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-[#0A1628] transition-colors"
        >
          {saving ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </motion.div>
  );
}

// ── Admin Info Card ───────────────────────────────────────────────────────────
function AdminInfoCard({ token }: { token: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl border border-[#E63946]/10 glass-card shadow-sm p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg">🛡️</div>
        <div>
          <h2 className="font-bold text-gray-800">Security</h2>
          <p className="text-xs text-gray-400">Your session and access info</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <div className="flex items-center gap-2 text-gray-600">
            <span>🔒</span>
            <span>JWT Session</span>
          </div>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <div className="flex items-center gap-2 text-gray-600">
            <span>⚙️</span>
            <span>Admin Role</span>
          </div>
          <span className="px-2 py-0.5 bg-[#1D3557]/10 text-[#1D3557] rounded-full text-xs font-semibold">admin</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <div className="flex items-center gap-2 text-gray-600">
            <span>🌐</span>
            <span>API Endpoint</span>
          </div>
          <span className="text-xs text-gray-400 font-mono">/api/admin</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Danger Zone Card ──────────────────────────────────────────────────────────
function DangerZoneCard({ token, onLogout, toast }: {
  token: string;
  onLogout: () => void;
  toast: { ok: (m: string) => void; err: (m: string) => void };
}) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete all non-admin user data.\n\nType "CONFIRM" in the next prompt to proceed.'
    );
    if (!confirmed) return;
    const typed = prompt('Type CONFIRM to delete all user data:');
    if (typed !== 'CONFIRM') { toast.err('Cancelled — text did not match'); return; }
    setResetting(true);
    try {
      await api.resetDatabase(token);
      toast.ok('Database reset — all user data deleted');
    } catch (e: any) { toast.err(e.message || 'Reset failed'); }
    finally { setResetting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl border-2 border-red-100 shadow-sm p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">⚠️</div>
        <div>
          <h2 className="font-bold text-red-700">Danger Zone</h2>
          <p className="text-xs text-red-400">Irreversible actions</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-xl border border-red-100 bg-red-50 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">Reset Database</p>
            <p className="text-xs text-gray-500 mt-0.5">Delete all user data (admin accounts preserved)</p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="shrink-0 h-9 px-4 bg-red-500 text-white text-xs font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {resetting ? 'Resetting…' : 'Reset'}
          </button>
        </div>

        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">Sign Out</p>
            <p className="text-xs text-gray-500 mt-0.5">End this admin session</p>
          </div>
          <button
            onClick={onLogout}
            className="shrink-0 h-9 px-4 border-2 border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main SettingsTab ──────────────────────────────────────────────────────────
export function SettingsTab({
  token,
  toast,
  onLogout,
}: {
  token: string;
  toast: { ok: (m: string) => void; err: (m: string) => void };
  onLogout: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-2xl space-y-5"
    >
      <h1 className="text-2xl font-bold text-[#0F172A]">Settings</h1>
      <ChangePasswordCard token={token} toast={toast} />
      <AdminInfoCard token={token} />
      <DangerZoneCard token={token} onLogout={onLogout} toast={toast} />
    </motion.div>
  );
}
