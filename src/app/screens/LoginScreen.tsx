import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Phone, Mail, Loader2, MessageSquare, AtSign, Shield, Car, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

type LoginMode = 'password' | 'otp';
type OtpChannel = 'sms' | 'email';

interface LoginScreenProps {
  onLogin: (phone: string, email?: string) => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
}

export function LoginScreen({ onLogin, onForgotPassword, onRegister }: LoginScreenProps) {
  const [mode, setMode] = useState<LoginMode>('password');
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('sms');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, requestOTP } = useAuth();

  const normalizePhone = (raw: string) => {
    let p = raw.replace(/\s/g, '');
    if (p.startsWith('0')) p = '+234' + p.slice(1);
    if (!p.startsWith('+')) p = '+234' + p;
    return p;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Enter your phone/email and password');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      if (err.message?.includes('PASSWORD_NOT_SET') || err.message?.includes('Password not set')) {
        toast.error('No password set. Use OTP login below.');
        setMode('otp');
      } else {
        toast.error(err.message || 'Invalid credentials');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = otpChannel === 'sms' ? normalizePhone(phoneNumber) : '';
    if (otpChannel === 'sms' && !phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }
    if (otpChannel === 'email' && !email) {
      toast.error('Please enter your email address');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await requestOTP(
        otpChannel === 'sms' ? cleanPhone : '',
        otpChannel === 'email' ? email : undefined,
        otpChannel
      );
      if (result._dev_otp) {
        toast.info(`Dev OTP: ${result._dev_otp}`, { duration: 15000 });
      }
      onLogin(cleanPhone, otpChannel === 'email' ? email : undefined);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "pl-12 h-12 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 focus:ring-[#E63946]/10 transition-all rounded-xl text-[#0F172A] placeholder:text-[#94A3B8]";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A1628] overflow-hidden">
      {/* Ambient orbs */}
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-[#E63946]/20 blur-[80px]" />
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[5%] right-[10%] w-56 h-56 rounded-full bg-[#F4A261]/15 blur-[60px]" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[20%] left-[30%] w-64 h-64 rounded-full bg-[#E63946]/10 blur-[70px]" />

      {/* Branding */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center shadow-lg shadow-[#E63946]/20">
            <Car className="w-12 h-12 text-white" />
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="text-white text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "Poppins" }}>
          SmartDrive
        </motion.h1>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="flex items-center gap-2 mb-2">
          <div className="h-[2px] w-6 bg-white/30 rounded-full" />
          <span className="text-[#E63946] text-sm font-extrabold tracking-[0.15em]" style={{ fontFamily: "Poppins" }}>NAIJA</span>
          <div className="h-[2px] w-6 bg-white/30 rounded-full" />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }} className="text-white/60 text-sm text-center max-w-xs">
          Master Nigerian driving rules and earn your certification
        </motion.p>
      </div>

      {/* Bottom card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-t-[2.5rem] px-8 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-10"
      >
        <div className="mb-5">
          <h2 className="text-[#0F172A] text-xl font-bold mb-1" style={{ fontFamily: "Poppins" }}>Welcome Back</h2>
          <p className="text-[#64748B] text-sm">Sign in to continue your journey</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-[#F1F5F9] rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold transition-all ${mode === 'password' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}
          >
            <Lock className="w-3.5 h-3.5" /> Password
          </button>
          <button
            type="button"
            onClick={() => setMode('otp')}
            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold transition-all ${mode === 'otp' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}
          >
            <KeyRound className="w-3.5 h-3.5" /> OTP
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'password' ? (
            <motion.form
              key="password-form"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePasswordLogin}
              className="space-y-4"
            >
              {/* Identifier */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Phone or Email</Label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input id="identifier" type="text" placeholder="+234 800 000 0000 or email" value={identifier} onChange={e => setIdentifier(e.target.value)} className={inputCls} required autoComplete="username" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-12`} required autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <button type="button" onClick={onForgotPassword} className="text-xs font-semibold text-[#E63946] hover:text-[#c62b36] transition-colors">
                  Forgot password?
                </button>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-12 text-white font-semibold rounded-xl" size="lg" disabled={isSubmitting || !identifier || !password} style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}>
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.form
              key="otp-form"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleOTPLogin}
              className="space-y-4"
            >
              {/* OTP channel toggle */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Receive code via</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setOtpChannel('sms')} className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-medium text-sm ${otpChannel === 'sms' ? 'border-[#E63946] bg-[#E63946]/5 text-[#E63946]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'}`}>
                    <MessageSquare className="w-4 h-4" /> SMS
                  </button>
                  <button type="button" onClick={() => setOtpChannel('email')} className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-medium text-sm ${otpChannel === 'email' ? 'border-[#E63946] bg-[#E63946]/5 text-[#E63946]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'}`}>
                    <Mail className="w-4 h-4" /> Email
                  </button>
                </div>
              </div>

              {/* Phone input */}
              {otpChannel === 'sms' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <Label htmlFor="otp-phone" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <Input id="otp-phone" type="tel" placeholder="+234 800 000 0000" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={inputCls} required />
                  </div>
                </motion.div>
              )}

              {/* Email input */}
              {otpChannel === 'email' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <Label htmlFor="otp-email" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Email Address</Label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <Input id="otp-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
                  </div>
                </motion.div>
              )}

              {/* Info pill */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="p-1.5 rounded-lg bg-[#E63946]/10 mt-0.5">
                  <Shield className="w-4 h-4 text-[#E63946]" />
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {otpChannel === 'sms' ? 'A 6-digit code will be sent to your Nigerian phone number.' : 'A 6-digit code will be sent to your email address.'}
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-12 text-white font-semibold rounded-xl" size="lg" disabled={isSubmitting || (otpChannel === 'sms' ? !phoneNumber : !email)} style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}>
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> : 'Send Verification Code'}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Register link */}
        <p className="text-center text-sm text-[#64748B] mt-5">
          New to SmartDrive?{' '}
          <button type="button" onClick={onRegister} className="font-semibold text-[#E63946] hover:text-[#c62b36] transition-colors">
            Create account
          </button>
        </p>
      </motion.div>
    </div>
  );
}
