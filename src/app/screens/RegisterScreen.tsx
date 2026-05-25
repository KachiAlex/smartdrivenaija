import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, Car, Lock, Eye, EyeOff, User, ChevronLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

type Step = 'details' | 'verify' | 'password';

interface RegisterScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

const COUNTRY_CODES = [
  { code: '+234', flag: '🇳🇬', label: 'NG' },
  { code: '+1',   flag: '🇺🇸', label: 'US' },
  { code: '+44',  flag: '🇬🇧', label: 'UK' },
  { code: '+233', flag: '🇬🇭', label: 'GH' },
  { code: '+254', flag: '🇰🇪', label: 'KE' },
];

export function RegisterScreen({ onComplete, onBack }: RegisterScreenProps) {
  const [step, setStep] = useState<Step>('details');

  // Step 1 — personal details
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 — OTP
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');

  // Step 3 — password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerInit, registerVerifyOTP, registerComplete } = useAuth();

  // Build the full E.164 phone number
  const fullPhone = () => {
    let local = phoneLocal.replace(/\s/g, '');
    if (local.startsWith('0')) local = local.slice(1);
    return countryCode + local;
  };

  // Validation helpers
  const phoneValid = () => /^\+[1-9]\d{6,14}$/.test(fullPhone());
  const emailValid = () => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const sendOTP = async () => {
    setIsSubmitting(true);
    try {
      const phone = fullPhone();
      const result = await registerInit(phone, email.trim() || undefined, 'sms');
      if (result._dev_otp) toast.info(`Dev OTP: ${result._dev_otp}`, { duration: 15000 });
      setStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { toast.error('Enter your first name'); return; }
    if (!surname.trim()) { toast.error('Enter your surname'); return; }
    if (!phoneLocal) { toast.error('Enter your phone number'); return; }
    if (!phoneValid()) { toast.error('Enter a valid phone number'); return; }
    if (!emailValid()) { toast.error('Enter a valid email address'); return; }
    await sendOTP();
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setIsSubmitting(true);
    try {
      const result = await registerVerifyOTP(fullPhone(), otp, email.trim() || undefined);
      setTempToken(result.tempToken);
      setStep('password');
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setIsSubmitting(true);
    try {
      const name = `${firstName.trim()} ${surname.trim()}`;
      await registerComplete(tempToken, password, name);
      toast.success('Account created! Welcome to SmartDrive.');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "h-12 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 transition-all rounded-xl text-[#0F172A] placeholder:text-[#94A3B8]";

  const steps: Step[] = ['details', 'verify', 'password'];
  const stepIdx = steps.indexOf(step);

  const stepLabels = ['Details', 'Verify', 'Password'];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A1628] overflow-hidden">
      {/* Ambient orbs */}
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-[#E63946]/20 blur-[80px]" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[20%] right-[10%] w-64 h-64 rounded-full bg-[#F4A261]/10 blur-[70px]" />

      {/* Branding + step indicator */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <button onClick={onBack} className="absolute top-4 left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="mb-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center shadow-lg shadow-[#E63946]/20">
            <Car className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-white text-2xl font-bold mb-1" style={{ fontFamily: "Poppins" }}>
          Create Account
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-white/60 text-sm text-center max-w-xs mb-4">
          Join thousands of Nigerian drivers
        </motion.p>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < stepIdx ? 'bg-green-400 text-white' : i === stepIdx ? 'bg-[#E63946] text-white' : 'bg-white/20 text-white/50'}`}>
                  {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] font-semibold ${i === stepIdx ? 'text-white' : 'text-white/40'}`}>{stepLabels[i]}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 rounded-full mb-4 ${i < stepIdx ? 'bg-green-400' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-t-[2.5rem] px-6 pt-7 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-10 max-h-[72vh] overflow-y-auto"
      >
        <AnimatePresence mode="wait">

          {/* ── Step 1: Personal details ── */}
          {step === 'details' && (
            <motion.form key="details" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <h2 className="text-[#0F172A] text-lg font-bold" style={{ fontFamily: "Poppins" }}>Your details</h2>
                <p className="text-[#64748B] text-sm mt-0.5">Tell us a bit about yourself</p>
              </div>

              {/* First name + Surname side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first-name" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="pl-9 h-12 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 transition-all rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] text-sm"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="surname" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Surname</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      id="surname"
                      type="text"
                      placeholder="Doe"
                      value={surname}
                      onChange={e => setSurname(e.target.value)}
                      className="pl-9 h-12 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 transition-all rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] text-sm"
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>

              {/* Phone number with country code */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Phone Number</Label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    className="h-12 px-2 border-2 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-[#0F172A] text-sm font-semibold focus:border-[#E63946]/50 outline-none transition-all"
                    style={{ minWidth: '90px' }}
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <Input
                    type="tel"
                    placeholder="0801 234 5678"
                    value={phoneLocal}
                    onChange={e => setPhoneLocal(e.target.value)}
                    className={`flex-1 pl-4 ${inputCls}`}
                    required
                    autoComplete="tel-national"
                    inputMode="tel"
                  />
                </div>
                <p className="text-xs text-[#94A3B8]">Full number: <span className="font-semibold text-[#64748B]">{fullPhone()}</span></p>
              </div>

              {/* Email (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Email <span className="normal-case font-normal text-[#94A3B8]">(optional)</span>
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`pl-4 ${inputCls}`}
                  autoComplete="email"
                />
              </div>

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-12 text-white font-semibold rounded-xl"
                  disabled={isSubmitting || !firstName || !surname || !phoneLocal}
                  style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}
                >
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending code...</> : 'Send Verification Code →'}
                </Button>
              </motion.div>
            </motion.form>
          )}

          {/* ── Step 2: Verify OTP ── */}
          {step === 'verify' && (
            <motion.form key="verify" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <h2 className="text-[#0F172A] text-lg font-bold" style={{ fontFamily: "Poppins" }}>Verify your phone</h2>
                <p className="text-[#64748B] text-sm mt-0.5">
                  6-digit code sent to <span className="font-semibold text-[#0F172A]">{fullPhone()}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp-code" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Verification Code</Label>
                <Input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="1 2 3 4 5 6"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="h-16 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 transition-all rounded-xl text-[#0F172A] text-center text-3xl tracking-[0.4em] font-bold"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="h-12 px-5 rounded-xl border-2" onClick={() => setStep('details')}>← Back</Button>
                <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full h-12 text-white font-semibold rounded-xl" disabled={isSubmitting || otp.length !== 6} style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}>
                    {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Verifying...</> : 'Verify Code →'}
                  </Button>
                </motion.div>
              </div>
              <button type="button" onClick={sendOTP} disabled={isSubmitting} className="w-full text-xs text-[#E63946] font-semibold text-center hover:underline disabled:opacity-50">
                Didn't receive a code? Resend
              </button>
            </motion.form>
          )}

          {/* ── Step 3: Set password ── */}
          {step === 'password' && (
            <motion.form key="password" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleComplete} className="space-y-4">
              <div>
                <h2 className="text-[#0F172A] text-lg font-bold" style={{ fontFamily: "Poppins" }}>Set your password</h2>
                <p className="text-[#64748B] text-sm mt-0.5">
                  Almost done, <span className="font-semibold text-[#0F172A]">{firstName}</span>! Choose a secure password.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`pl-12 pr-12 ${inputCls}`}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`pl-12 ${inputCls} ${confirmPassword && confirmPassword !== password ? 'border-red-400' : ''}`}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {confirmPassword && confirmPassword !== password && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
              </div>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-12 text-white font-semibold rounded-xl"
                  disabled={isSubmitting || password.length < 6 || password !== confirmPassword}
                  style={{ background: "linear-gradient(135deg, #E63946, #c62b36)" }}
                >
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating account...</> : '🎉 Create My Account'}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
