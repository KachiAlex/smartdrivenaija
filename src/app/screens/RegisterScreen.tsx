import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Phone, Mail, Loader2, MessageSquare, AtSign, Car, Lock, Eye, EyeOff, User, ChevronLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

type Step = 'contact' | 'verify' | 'complete';
type Channel = 'sms' | 'email';

interface RegisterScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export function RegisterScreen({ onComplete, onBack }: RegisterScreenProps) {
  const [step, setStep] = useState<Step>('contact');
  const [channel, setChannel] = useState<Channel>('sms');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerInit, registerVerifyOTP, registerComplete } = useAuth();

  const normalizePhone = (raw: string) => {
    let p = raw.replace(/\s/g, '');
    if (p.startsWith('0')) p = '+234' + p.slice(1);
    if (!p.startsWith('+')) p = '+234' + p;
    return p;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channel === 'sms' && !phone) { toast.error('Enter your phone number'); return; }
    if (channel === 'email' && !email) { toast.error('Enter your email address'); return; }
    setIsSubmitting(true);
    try {
      const cleanPhone = channel === 'sms' ? normalizePhone(phone) : '';
      const result = await registerInit(cleanPhone || '', channel === 'email' ? email : undefined, channel);
      if (result._dev_otp) toast.info(`Dev OTP: ${result._dev_otp}`, { duration: 15000 });
      setPhone(cleanPhone);
      setStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setIsSubmitting(true);
    try {
      const result = await registerVerifyOTP(
        channel === 'sms' ? phone : '',
        otp,
        channel === 'email' ? email : undefined
      );
      setTempToken(result.tempToken);
      setStep('complete');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Enter your full name'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setIsSubmitting(true);
    try {
      await registerComplete(tempToken, password, fullName.trim());
      toast.success('Account created! Welcome to SmartDrive.');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "pl-12 h-12 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 transition-all rounded-xl text-[#0F172A] placeholder:text-[#94A3B8]";

  const steps = ['contact', 'verify', 'complete'] as Step[];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A1628] overflow-hidden">
      {/* Ambient orbs */}
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-[#E63946]/20 blur-[80px]" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[20%] right-[10%] w-64 h-64 rounded-full bg-[#F4A261]/10 blur-[70px]" />

      {/* Back button + branding */}
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
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-white/60 text-sm text-center max-w-xs">
          Join thousands of Nigerian drivers
        </motion.p>

        {/* Step indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 mt-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < stepIdx ? 'bg-green-400 text-white' : i === stepIdx ? 'bg-[#E63946] text-white' : 'bg-white/20 text-white/50'}`}>
                {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 rounded-full ${i < stepIdx ? 'bg-green-400' : 'bg-white/20'}`} />}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-t-[2.5rem] px-8 pt-7 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-10"
      >
        <AnimatePresence mode="wait">

          {/* Step 1: Contact details */}
          {step === 'contact' && (
            <motion.form key="contact" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <h2 className="text-[#0F172A] text-lg font-bold" style={{ fontFamily: "Poppins" }}>Your contact</h2>
                <p className="text-[#64748B] text-sm mt-0.5">How should we reach you?</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Register via</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setChannel('sms')} className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-medium text-sm ${channel === 'sms' ? 'border-[#E63946] bg-[#E63946]/5 text-[#E63946]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'}`}>
                    <MessageSquare className="w-4 h-4" /> SMS
                  </button>
                  <button type="button" onClick={() => setChannel('email')} className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-medium text-sm ${channel === 'email' ? 'border-[#E63946] bg-[#E63946]/5 text-[#E63946]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'}`}>
                    <Mail className="w-4 h-4" /> Email
                  </button>
                </div>
              </div>
              {channel === 'sms' ? (
                <div className="space-y-2">
                  <Label htmlFor="reg-phone" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <Input id="reg-phone" type="tel" placeholder="+234 800 000 0000" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} required />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Email Address</Label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <Input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
                  </div>
                </div>
              )}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-12 text-white font-semibold rounded-xl" disabled={isSubmitting} style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}>
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> : 'Send Verification Code'}
                </Button>
              </motion.div>
            </motion.form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'verify' && (
            <motion.form key="verify" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <h2 className="text-[#0F172A] text-lg font-bold" style={{ fontFamily: "Poppins" }}>Verify your {channel === 'sms' ? 'phone' : 'email'}</h2>
                <p className="text-[#64748B] text-sm mt-0.5">Enter the 6-digit code sent to <span className="font-semibold text-[#0F172A]">{channel === 'sms' ? phone : email}</span></p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp-code" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Verification Code</Label>
                <Input id="otp-code" type="text" inputMode="numeric" placeholder="123456" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} className="h-14 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 transition-all rounded-xl text-[#0F172A] text-center text-2xl tracking-widest font-bold" required />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-2" onClick={() => setStep('contact')}>Back</Button>
                <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full h-12 text-white font-semibold rounded-xl" disabled={isSubmitting || otp.length !== 6} style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}>
                    {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</> : 'Verify Code'}
                  </Button>
                </motion.div>
              </div>
            </motion.form>
          )}

          {/* Step 3: Complete profile */}
          {step === 'complete' && (
            <motion.form key="complete" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleComplete} className="space-y-4">
              <div>
                <h2 className="text-[#0F172A] text-lg font-bold" style={{ fontFamily: "Poppins" }}>Set up your profile</h2>
                <p className="text-[#64748B] text-sm mt-0.5">Almost done! Just a few details.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full-name" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input id="full-name" type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-12`} required />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input id="confirm-password" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`${inputCls} ${confirmPassword && confirmPassword !== password ? 'border-red-400' : ''}`} required />
                </div>
                {confirmPassword && confirmPassword !== password && <p className="text-xs text-red-500">Passwords do not match</p>}
              </div>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-12 text-white font-semibold rounded-xl" disabled={isSubmitting || !fullName || password.length < 6 || password !== confirmPassword} style={{ background: "linear-gradient(135deg, #E63946, #c62b36)" }}>
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating account...</> : 'Create My Account'}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
