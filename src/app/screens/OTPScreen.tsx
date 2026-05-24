import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { motion } from "motion/react";
import { ArrowLeft, Shield, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface OTPScreenProps {
  phoneNumber?: string;
  email?: string;
  onVerify: () => void;
  onBack: () => void;
}

export function OTPScreen({ phoneNumber = "+234 800 000 0000", email, onVerify, onBack }: OTPScreenProps) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyOTP, requestOTP } = useAuth();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleResend = async () => {
    setTimer(60);
    setCanResend(false);
    setOtp("");
    try {
      const result = await requestOTP(phoneNumber, email, email ? 'email' : 'sms');
      toast.success('New code sent!');
      if (result._dev_otp) {
        toast.info(`Dev OTP: ${result._dev_otp}`, { duration: 15000 });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend code');
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setIsVerifying(true);
    try {
      await verifyOTP(phoneNumber, otp, email);
      onVerify();
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP');
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A1628] overflow-hidden">
      {/* Glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[5%] right-[5%] w-64 h-64 rounded-full bg-[#E63946]/20 blur-[80px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[10%] w-48 h-48 rounded-full bg-[#F4A261]/15 blur-[60px]"
      />

      {/* Back button */}
      <div className="relative z-10 px-6 pt-6">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      </div>

      {/* Top branding area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center shadow-lg shadow-[#E63946]/20">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-white text-2xl font-bold mb-2"
          style={{ fontFamily: "Poppins" }}
        >
          {email ? 'Verify Your Email' : 'Verify Your Number'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-white/60 text-sm text-center max-w-xs"
        >
          Enter the 6-digit code sent to your {email ? 'email' : 'phone'}
        </motion.p>
      </div>

      {/* White bottom card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-t-[2.5rem] px-8 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-10"
      >
        {/* Recipient pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
        >
          {email ? (
            <Mail className="w-4 h-4 text-[#E63946]" />
          ) : (
            <MessageSquare className="w-4 h-4 text-[#E63946]" />
          )}
          <span className="text-sm font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>
            {email || phoneNumber}
          </span>
        </motion.div>

        {/* OTP Input */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex justify-center mb-6"
        >
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </motion.div>

        {/* Timer / Resend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-6"
        >
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-[#E63946] text-sm font-semibold hover:underline transition-all"
            >
              Resend Code
            </button>
          ) : (
            <p className="text-sm text-[#64748B]">
              Resend code in <span className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>{timer}s</span>
            </p>
          )}
        </motion.div>

        {/* Info pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] mb-6"
        >
          <div className="p-1.5 rounded-lg bg-[#E63946]/10 mt-0.5">
            <Shield className="w-4 h-4 text-[#E63946]" />
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Your verification code is valid for 10 minutes. Please check your {email ? 'email inbox' : 'SMS messages'}.
          </p>
        </motion.div>

        {/* Verify Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleVerify}
            className="w-full h-12 text-white font-semibold rounded-xl"
            size="lg"
            disabled={otp.length !== 6 || isVerifying}
            style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}
          >
            {isVerifying ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</>
            ) : (
              'Verify & Continue'
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
