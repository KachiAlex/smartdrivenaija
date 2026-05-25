import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Phone, Mail, Loader2, MessageSquare, AtSign, Car, Lock, Eye, EyeOff, ChevronLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

type Step = 'contact' | 'verify' | 'reset';
type Channel = 'sms' | 'email';

interface ForgotPasswordScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export function ForgotPasswordScreen({ onComplete, onBack }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<Step>('contact');
  const [channel, setChannel] = useState<Channel>('sms');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { requestPasswordReset, confirmPasswordReset } = useAuth();

  const normalizePhone = (raw: string) => {
    let p = raw.replace(/\s/g, '');
    if (p.startsWith('0')) p = '+234' + p.slice(1);
    if (!p.startsWith('+')) p = '+234' + p;
    return p;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channel === 'sms' && !phone) { toast.error('Enter your phone number'); return; }
    if (channel === 'email' && !email) { toast.error('Enter your email address'); return; }
    setIsSubmitting(true);
    try {
      const cleanPhone = channel === 'sms' ? normalizePhone(phone) : '';
      const result = await requestPasswordReset(cleanPhone || '', channel === 'email' ? email : undefined, channel);
      if (result._dev_otp) toast.info(`Dev OTP: ${result._dev_otp}`, { duration: 15000 });
      setPhone(cleanPhone);
      setStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setStep('reset');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(
        channel === 'sms' ? phone : '',
        otp,
        newPassword,
        channel === 'email' ? email : undefined
      );
      toast.success('Password reset! Please sign in with your new password.');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "pl-12 h-12 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 transition-all rounded-xl text-[#0F172A] placeholder:text-[#94A3B8]";
  const steps = ['contact', 'verify', 'reset'] as Step[];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A1628] overflow-hidden">
      {/* Ambient orbs */}
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] right-[5%] w-64 h-64 rounded-full bg-[#F4A261]/20 blur-[70px]" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[20%] left-[10%] w-72 h-72 rounded-full bg-[#E63946]/10 blur-[80px]" />

      {/* Branding */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <button onClick={onBack} className="absolute top-4 left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="mb-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F4A261] to-[#E63946] flex items-center justify-center shadow-lg shadow-[#F4A261]/20">
            <Car className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-white text-2xl font-bold mb-1" style={{ fontFamily: "Poppins" }}>
          Reset Password
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-white/60 text-sm text-center max-w-xs">
          Recover access to your account
        </motion.p>

        {/* Step indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 mt-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < stepIdx ? 'bg-green-400 text-white' : i === stepIdx ? 'bg-[#F4A261] text-white' : 'bg-white/20 text-white/50'}`}>
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

          {/* Step 1: Contact */}
          {step === 'contact' && (
            <motion.form key="contact" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <h2 className="text-[#0F172A] text-lg font-bold" style={{ fontFamily: "Poppins" }}>Find your account</h2>
                <p className="text-[#64748B] text-sm mt-0.5">We'll send a reset code to verify it's you.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Reset via</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setChannel('sms')} className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-medium text-sm ${channel === 'sms' ? 'border-[#F4A261] bg-[#F4A261]/5 text-[#F4A261]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'}`}>
                    <MessageSquare className="w-4 h-4" /> SMS
                  </button>
                  <button type="button" onClick={() => setChannel('email')} className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-medium text-sm ${channel === 'email' ? 'border-[#F4A261] bg-[#F4A261]/5 text-[#F4A261]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'}`}>
                    <Mail className="w-4 h-4" /> Email
                  </button>
                </div>
              </div>
              {channel === 'sms' ? (
                <div className="space-y-2">
                  <Label htmlFor="reset-phone" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <Input id="reset-phone" type="tel" placeholder="+234 800 000 0000" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} required />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Email Address</Label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <Input id="reset-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
                  </div>
                </div>
              )}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-12 text-white font-semibold rounded-xl" disabled={isSubmitting} style={{ background: "linear-gradient(135deg, #F4A261, #E63946)" }}>
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> : 'Send Reset Code'}
                </Button>
              </motion.div>
            </motion.form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'verify' && (
            <motion.form key="verify" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleVerify} className="space-y-4">
              <div>
                <h2 className="text-[#0F172A] text-lg font-bold" style={{ fontFamily: "Poppins" }}>Enter the code</h2>
                <p className="text-[#64748B] text-sm mt-0.5">Code sent to <span className="font-semibold text-[#0F172A]">{channel === 'sms' ? phone : email}</span></p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-otp" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Verification Code</Label>
                <Input id="reset-otp" type="text" inputMode="numeric" placeholder="123456" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} className="h-14 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#F4A261]/50 transition-all rounded-xl text-[#0F172A] text-center text-2xl tracking-widest font-bold" required />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-2" onClick={() => setStep('contact')}>Back</Button>
                <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full h-12 text-white font-semibold rounded-xl" disabled={otp.length !== 6} style={{ background: "linear-gradient(135deg, #F4A261, #E63946)" }}>
                    Verify Code
                  </Button>
                </motion.div>
              </div>
            </motion.form>
          )}

          {/* Step 3: New password */}
          {step === 'reset' && (
            <motion.form key="reset" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleReset} className="space-y-4">
              <div>
                <h2 className="text-[#0F172A] text-lg font-bold" style={{ fontFamily: "Poppins" }}>New password</h2>
                <p className="text-[#64748B] text-sm mt-0.5">Choose a strong password for your account.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input id="new-password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`${inputCls} pr-12`} required />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input id="confirm-new-password" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`${inputCls} ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400' : ''}`} required />
                </div>
                {confirmPassword && confirmPassword !== newPassword && <p className="text-xs text-red-500">Passwords do not match</p>}
              </div>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-12 text-white font-semibold rounded-xl" disabled={isSubmitting || newPassword.length < 6 || newPassword !== confirmPassword} style={{ background: "linear-gradient(135deg, #F4A261, #E63946)" }}>
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Resetting...</> : 'Reset Password'}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
