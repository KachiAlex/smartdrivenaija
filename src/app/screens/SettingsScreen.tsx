import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock, Eye, EyeOff, Loader2, Fingerprint, Smartphone,
  Trash2, ShieldOff, ChevronDown, Bell,
  Moon, Globe, LogOut, Shield, User, KeyRound,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api, type BiometricCredential } from "../lib/api";

// ── Section accordion button ──────────────────────────────────────────────────
function SectionRow({
  icon, label, description, open, onToggle,
}: { icon: React.ReactNode; label: string; description?: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#F8FAFC] transition-colors"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${open ? "bg-[#E63946] text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#0F172A]">{label}</p>
        {description && <p className="text-xs text-[#94A3B8]">{description}</p>}
      </div>
      <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDown className="w-4 h-4 text-[#CBD5E1]" />
      </motion.div>
    </button>
  );
}

// ── Password strength bar ─────────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const s = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[^a-zA-Z0-9]/.test(password) ? 4 : 3;
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= s ? colors[s] : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${s <= 1 ? "text-red-400" : s === 2 ? "text-orange-400" : s === 3 ? "text-yellow-500" : "text-green-500"}`}>
        {labels[s]}
      </p>
    </div>
  );
}

// ── Change Password Panel ─────────────────────────────────────────────────────
function ChangePasswordPanel() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (next !== confirm) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    try {
      await changePassword(current, next);
      toast.success("Password changed successfully");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2 space-y-3 bg-[#F8FAFC]">
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <Input
          type={show ? "text" : "password"}
          placeholder="Current password"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          className="pl-10 h-11 border-2 border-[#E2E8F0] bg-white rounded-xl text-sm"
          required
        />
      </div>
      <div className="space-y-1.5">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input
            type={show ? "text" : "password"}
            placeholder="New password (min 6 chars)"
            value={next}
            onChange={e => setNext(e.target.value)}
            className="pl-10 pr-10 h-11 border-2 border-[#E2E8F0] bg-white rounded-xl text-sm"
            required
          />
          <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <StrengthBar password={next} />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <Input
          type={show ? "text" : "password"}
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className={`pl-10 h-11 border-2 bg-white rounded-xl text-sm ${confirm && confirm !== next ? "border-red-400" : "border-[#E2E8F0]"}`}
          required
        />
      </div>
      {confirm && confirm !== next && <p className="text-xs text-red-500">Passwords do not match</p>}
      <Button
        type="submit"
        className="w-full h-10 text-white text-sm font-semibold rounded-xl"
        disabled={saving || !current || next.length < 6 || next !== confirm}
        style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}
      >
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save New Password"}
      </Button>
    </form>
  );
}

// ── Biometric Credentials Panel ───────────────────────────────────────────────
function BiometricsPanel() {
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await api.getBiometricCredentials();
      setCredentials(r.credentials);
    } catch { setCredentials([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Remove this biometric credential?")) return;
    setRemoving(id);
    try {
      await api.deleteBiometricCredential(id);
      toast.success("Credential removed");
      setCredentials(c => c.filter(x => x.credentialId !== id));
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setRemoving(null); }
  };

  const deactivate = async (id: string) => {
    setRemoving(id);
    try {
      await api.deactivateBiometricCredential(id);
      toast.success("Credential deactivated");
      setCredentials(c => c.map(x => x.credentialId === id ? { ...x, isActive: false } : x));
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setRemoving(null); }
  };

  const deviceIcon = (type: string | null) => {
    if (!type) return "📱";
    const t = type.toLowerCase();
    if (t.includes("face")) return "😊";
    if (t.includes("finger")) return "👆";
    return "🔒";
  };

  return (
    <div className="px-4 pb-4 pt-2 space-y-3 bg-[#F8FAFC]">
      <p className="text-xs text-[#64748B] leading-relaxed">
        Biometric credentials allow you to log in using Face ID or fingerprint. Registered devices appear below.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-[#E63946]" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <Fingerprint className="w-10 h-10 text-[#CBD5E1] mx-auto" />
          <p className="text-sm text-[#94A3B8]">No biometric credentials registered</p>
          <p className="text-xs text-[#CBD5E1]">Use the mobile app to register your device</p>
        </div>
      ) : (
        <div className="space-y-2">
          {credentials.map(c => (
            <div key={c.credentialId} className={`bg-white rounded-xl border-2 p-3 flex items-center gap-3 ${c.isActive ? "border-[#E2E8F0]" : "border-gray-100 opacity-60"}`}>
              <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-xl shrink-0">
                {deviceIcon(c.biometricType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">
                  {c.deviceName || "Unknown device"}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {c.biometricType || c.deviceType || "Biometric"} · {c.isActive ? "Active" : "Inactive"}
                </p>
                {c.lastUsedAt && (
                  <p className="text-xs text-[#CBD5E1]">Last used {new Date(c.lastUsedAt).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {c.isActive && (
                  <button
                    onClick={() => deactivate(c.credentialId)}
                    disabled={removing === c.credentialId}
                    className="p-2 rounded-lg hover:bg-orange-50 text-orange-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                    title="Deactivate"
                  >
                    {removing === c.credentialId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => remove(c.credentialId)}
                  disabled={removing === c.credentialId}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Remove"
                >
                  {removing === c.credentialId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Account Info Panel ────────────────────────────────────────────────────────
function AccountPanel({ onNavigate }: { onNavigate?: (s: string) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.fullName || "");
  const [lang, setLang] = useState(user?.preferredLanguage || "en");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({ fullName: name, preferredLanguage: lang });
      toast.success("Profile updated");
    } catch (e: any) { toast.error(e.message || "Failed to update profile"); }
    finally { setSaving(false); }
  };

  const langs = [
    { value: "en", label: "English" },
    { value: "ha", label: "Hausa" },
    { value: "yo", label: "Yoruba" },
    { value: "ig", label: "Igbo" },
    { value: "pi", label: "Pidgin" },
  ];

  return (
    <form onSubmit={handleSave} className="px-4 pb-4 pt-2 space-y-3 bg-[#F8FAFC]">
      <div>
        <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            className="pl-10 h-11 border-2 border-[#E2E8F0] bg-white rounded-xl text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Phone</label>
        <div className="relative">
          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input
            value={user?.phone || ""}
            disabled
            className="pl-10 h-11 border-2 border-[#E2E8F0] bg-gray-50 rounded-xl text-sm text-[#94A3B8]"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Preferred Language</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="w-full pl-10 pr-4 h-11 border-2 border-[#E2E8F0] bg-white rounded-xl text-sm appearance-none focus:border-[#E63946] outline-none"
          >
            {langs.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>
      <Button
        type="submit"
        disabled={saving}
        className="w-full h-10 text-white text-sm font-semibold rounded-xl"
        style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
      >
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
      </Button>
    </form>
  );
}

// ── Appearance & Notifications Panel ─────────────────────────────────────────
function AppearancePanel() {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="px-4 pb-4 pt-2 space-y-1 bg-[#F8FAFC]">
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Moon className="w-4 h-4 text-[#64748B]" />
          <Label className="text-sm font-medium text-[#0F172A] cursor-pointer">Dark Mode</Label>
        </div>
        <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
      </div>
      <div className="border-t border-[#F1F5F9]" />
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-[#64748B]" />
          <Label className="text-sm font-medium text-[#0F172A] cursor-pointer">Push Notifications</Label>
        </div>
        <Switch checked={notifications} onCheckedChange={setNotifications} />
      </div>
      <div className="border-t border-[#F1F5F9]" />
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-[#64748B]" />
          <Label className="text-sm font-medium text-[#0F172A] cursor-pointer">Study Reminders</Label>
        </div>
        <Switch defaultChecked />
      </div>
    </div>
  );
}

// ── Main SettingsScreen ───────────────────────────────────────────────────────
export function SettingsScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState<string | null>("account");

  const toggle = (id: string) => setOpen(v => (v === id ? null : id));

  const handleLogout = async () => {
    await logout();
    onNavigate?.("login");
  };

  const sections = [
    {
      id: "account",
      icon: <User className="w-4 h-4" />,
      label: "Account",
      description: "Name, phone, language",
      content: <AccountPanel onNavigate={onNavigate} />,
    },
    {
      id: "password",
      icon: <KeyRound className="w-4 h-4" />,
      label: "Change Password",
      description: "Update your login password",
      content: <ChangePasswordPanel />,
    },
    {
      id: "biometrics",
      icon: <Fingerprint className="w-4 h-4" />,
      label: "Biometric Login",
      description: "Face ID & fingerprint devices",
      content: <BiometricsPanel />,
    },
    {
      id: "appearance",
      icon: <Moon className="w-4 h-4" />,
      label: "Appearance & Notifications",
      description: "Dark mode, alerts",
      content: <AppearancePanel />,
    },
    {
      id: "privacy",
      icon: <Shield className="w-4 h-4" />,
      label: "Privacy & Security",
      description: "Data, sessions, permissions",
      content: (
        <div className="px-4 pb-4 pt-2 space-y-3 bg-[#F8FAFC]">
          <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y">
            <div className="p-3 flex items-start gap-3">
              <Shield className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">End-to-End Encrypted</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">All your data is encrypted in transit and at rest.</p>
              </div>
            </div>
            <div className="p-3 flex items-start gap-3">
              <Lock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">JWT Session Tokens</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">Sessions expire automatically after 24 hours of inactivity.</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full h-10 text-red-500 border-red-200 hover:bg-red-50 text-sm rounded-xl"
            onClick={() => { if (confirm("Sign out of all devices? You will need to log in again.")) handleLogout(); }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out All Devices
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="size-full overflow-auto bg-[#FAFBFF] pb-28">
      {/* Header */}
      <div
        className="relative px-6 pt-14 pb-16 rounded-b-[2.5rem] overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1D3557 0%, #0A1628 100%)" }}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#E63946]/20 blur-[70px]"
        />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 relative z-10"
        >
          <Avatar className="w-16 h-16 border-4 border-white/20">
            <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
              {(user?.fullName || user?.phone || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-white text-xl font-bold">{user?.fullName || "Learner"}</h1>
            <p className="text-white/60 text-sm">{user?.phone}</p>
            <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${user?.isPremium ? "bg-[#F4A261] text-white" : "bg-white/20 text-white/80"}`}>
              {user?.isPremium ? "⭐ Premium" : "Free Plan"}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="p-5 -mt-4 relative z-10 space-y-3">
        {/* Settings sections */}
        <Card className="overflow-hidden glass-card border-[#E63946]/10 divide-y divide-[#F1F5F9]">
          {sections.map(s => (
            <div key={s.id}>
              <SectionRow
                icon={s.icon}
                label={s.label}
                description={s.description}
                open={open === s.id}
                onToggle={() => toggle(s.id)}
              />
              <AnimatePresence initial={false}>
                {open === s.id && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    {s.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </Card>

        {/* Logout */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full h-12 text-red-400 border-red-200 hover:bg-red-50 hover:text-red-500 rounded-2xl font-semibold"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </motion.div>

        {/* App version */}
        <p className="text-center text-xs text-[#CBD5E1] pb-2">SmartDrive Naija v1.0.0</p>
      </div>
    </div>
  );
}
