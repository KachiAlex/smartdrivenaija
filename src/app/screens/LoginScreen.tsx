import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Phone, Mail, Loader2, MessageSquare, AtSign, Shield, Car } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface LoginScreenProps {
  onLogin: (phone: string, email?: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<'sms' | 'email'>('sms');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestOTP } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryMethod === 'sms' && !phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    if (deliveryMethod === 'email' && !email) {
      toast.error('Please enter your email address');
      return;
    }

    let cleanPhone = phoneNumber.replace(/\s/g, '').replace(/^0/, '+234');
    if (!cleanPhone.startsWith('+234')) {
      cleanPhone = '+234' + cleanPhone;
    }

    setIsSubmitting(true);
    try {
      const result = await requestOTP(cleanPhone, email || undefined, deliveryMethod);
      if (result._dev_otp) {
        toast.info(`Dev OTP: ${result._dev_otp}`, { duration: 15000 });
      }
      onLogin(cleanPhone, deliveryMethod === 'email' ? email : undefined);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A1628] overflow-hidden">
      {/* Glowing orbs — matching Splash/Onboarding */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-[#E63946]/20 blur-[80px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[5%] right-[10%] w-56 h-56 rounded-full bg-[#F4A261]/15 blur-[60px]"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] left-[30%] w-64 h-64 rounded-full bg-[#E63946]/10 blur-[70px]"
      />

      {/* Top branding area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center shadow-lg shadow-[#E63946]/20">
            <Car className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-white text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "Poppins" }}
        >
          SmartDrive
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex items-center gap-2 mb-2"
        >
          <div className="h-[2px] w-6 bg-white/30 rounded-full" />
          <span className="text-[#E63946] text-sm font-extrabold tracking-[0.15em]" style={{ fontFamily: "Poppins" }}>
            NAIJA
          </span>
          <div className="h-[2px] w-6 bg-white/30 rounded-full" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-white/60 text-sm text-center max-w-xs"
        >
          Master Nigerian driving rules and earn your certification
        </motion.p>
      </div>

      {/* White bottom card — onboarding style */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-t-[2.5rem] px-8 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-10"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-[#0F172A] text-xl font-bold mb-1" style={{ fontFamily: "Poppins" }}>
            Welcome Back
          </h2>
          <p className="text-[#64748B] text-sm">
            {deliveryMethod === 'sms'
              ? 'Enter your phone number to continue'
              : 'Enter your email to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Delivery Method Toggle */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Receive OTP via</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('sms')}
                className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-medium text-sm ${
                  deliveryMethod === 'sms'
                    ? 'border-[#E63946] bg-[#E63946]/5 text-[#E63946]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:border-[#E63946]/30'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('email')}
                className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-medium text-sm ${
                  deliveryMethod === 'email'
                    ? 'border-[#E63946] bg-[#E63946]/5 text-[#E63946]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:border-[#E63946]/30'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </div>

          {/* Phone Input */}
          {deliveryMethod === 'sms' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="phone" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-12 h-12 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 focus:ring-[#E63946]/10 transition-all rounded-xl text-[#0F172A] placeholder:text-[#94A3B8]"
                  required={deliveryMethod === 'sms'}
                />
              </div>
            </motion.div>
          )}

          {/* Email Input */}
          {deliveryMethod === 'email' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Email Address</Label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 border-2 border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#E63946]/50 focus:ring-[#E63946]/10 transition-all rounded-xl text-[#0F172A] placeholder:text-[#94A3B8]"
                  required={deliveryMethod === 'email'}
                />
              </div>
            </motion.div>
          )}

          {/* Info pill */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="p-1.5 rounded-lg bg-[#E63946]/10 mt-0.5">
              <Shield className="w-4 h-4 text-[#E63946]" />
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {deliveryMethod === 'sms'
                ? 'We will send a 6-digit verification code to your Nigerian phone number.'
                : 'We will send a 6-digit verification code to your email address.'}
            </p>
          </div>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className="w-full h-12 text-white font-semibold rounded-xl"
              size="lg"
              disabled={isSubmitting || (deliveryMethod === 'sms' ? !phoneNumber : !email)}
              style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
