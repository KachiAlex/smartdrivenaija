import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Car, Phone, Mail, Loader2, MessageSquare, AtSign } from "lucide-react";
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

    // Normalize phone: ensure +234 prefix
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
    <div className="size-full flex flex-col bg-[#FAFBFF] p-6 relative overflow-hidden">
      {/* Cosmic mesh blobs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#6366F1]/15 blur-[100px]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, -15, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#8B5CF6]/10 blur-[80px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[60%] right-[10%] w-48 h-48 rounded-full bg-[#F59E0B]/10 blur-[60px]"
      />

      {/* Subtle particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-[#6366F1]/40 particle particle-delay-1" />
        <div className="absolute top-[40%] right-[15%] w-3 h-3 rounded-full bg-[#8B5CF6]/30 particle particle-delay-2" />
        <div className="absolute bottom-[30%] left-[20%] w-2 h-2 rounded-full bg-[#22D3EE]/30 particle particle-delay-3" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-10 pt-8 relative z-10"
      >
        <motion.div
          whileHover={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          className="p-3 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-lg shadow-[#6366F1]/30"
        >
          <Car className="w-8 h-8 text-white" />
        </motion.div>
        <div>
          <h1 className="text-[#0F172A]" style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "Poppins" }}>SmartDrive Naija</h1>
          <p className="text-sm text-[#64748B] font-medium">Welcome back!</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col relative z-10"
      >
        <h2 className="mb-2 text-[#0F172A]" style={{ fontSize: "1.875rem", fontWeight: 700, fontFamily: "Poppins" }}>Login to Continue</h2>
        <p className="text-[#64748B] mb-8 font-medium">
          {deliveryMethod === 'sms' ? 'Enter your phone number to access your account' : 'Enter your email to access your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Delivery Method Toggle */}
          <div className="space-y-2">
            <Label className="font-medium text-[#0F172A]">Receive OTP via</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod('sms')}
                className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-all font-medium ${
                  deliveryMethod === 'sms'
                    ? 'border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1] shadow-md shadow-[#6366F1]/10'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#6366F1]/30'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('email')}
                className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-all font-medium ${
                  deliveryMethod === 'email'
                    ? 'border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1] shadow-md shadow-[#6366F1]/10'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#6366F1]/30'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </div>

          {/* Phone Input - shown when SMS is selected */}
          {deliveryMethod === 'sms' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="phone" className="font-medium text-[#0F172A]">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-12 h-12 border-2 border-[#E2E8F0] bg-white focus:border-[#6366F1]/50 focus:ring-[#6366F1]/20 transition-all rounded-xl"
                  required={deliveryMethod === 'sms'}
                />
              </div>
              <p className="text-xs text-[#64748B]">
                We'll send you a verification code via SMS
              </p>
            </motion.div>
          )}

          {/* Email Input - shown when Email delivery is selected */}
          {deliveryMethod === 'email' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="font-medium text-[#0F172A]">Email Address</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 border-2 border-[#E2E8F0] bg-white focus:border-[#6366F1]/50 focus:ring-[#6366F1]/20 transition-all rounded-xl"
                  required={deliveryMethod === 'email'}
                />
              </div>
              <p className="text-xs text-[#64748B]">
                We'll send your verification code to this email
              </p>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`p-4 border-2 rounded-xl ${
              deliveryMethod === 'sms'
                ? 'bg-gradient-to-r from-[#F59E0B]/10 to-[#FB923C]/5 border-[#F59E0B]/20'
                : 'bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/5 border-[#6366F1]/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                className={`p-2 rounded-lg ${
                  deliveryMethod === 'sms' ? 'bg-[#F59E0B]/20' : 'bg-[#6366F1]/20'
                }`}
              >
                <span className="text-2xl">{deliveryMethod === 'sms' ? '🇳🇬' : '✉️'}</span>
              </motion.div>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold text-[#0F172A]">
                  {deliveryMethod === 'sms' ? 'Nigerian Numbers Only' : 'Email Verification'}
                </h4>
                <p className="text-sm text-[#64748B]">
                  {deliveryMethod === 'sms'
                    ? 'This service is currently available for Nigerian phone numbers only.'
                    : 'We will send a 6-digit verification code to your email address.'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button type="submit" className="w-full h-12 shadow-lg shadow-[#6366F1]/30" size="lg" disabled={isSubmitting || (deliveryMethod === 'sms' ? !phoneNumber : !email)}
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> : 'Send Verification Code'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
