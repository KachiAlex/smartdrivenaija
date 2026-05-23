import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { motion } from "motion/react";
import { ArrowLeft, Shield, Loader2 } from "lucide-react";
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
    <div className="size-full flex flex-col bg-[#FAFBFF] p-6">
      <button onClick={onBack} className="flex items-center gap-2 mb-8 pt-4 text-[#64748B]">
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center mb-8"
      >
        <div className="p-6 rounded-full bg-[#6366F1]/10">
          <Shield className="w-16 h-16 text-[#6366F1]" />
        </div>
      </motion.div>

      <div className="flex-1">
        <h2 className="text-center mb-2 text-[#0F172A]" style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "Poppins" }}>
          {email ? 'Verify Your Email' : 'Verify Your Number'}
        </h2>
        <p className="text-center text-[#64748B] mb-8">
          Enter the 6-digit code sent to<br />
          <span className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>{email || phoneNumber}</span>
        </p>

        <div className="flex justify-center mb-8">
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
        </div>

        <div className="text-center mb-8">
          {canResend ? (
            <Button variant="link" onClick={handleResend} className="text-[#6366F1]">
              Resend Code
            </Button>
          ) : (
            <p className="text-sm text-[#64748B]">
              Resend code in <span className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>{timer}s</span>
            </p>
          )}
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleVerify}
            className="w-full h-12 shadow-lg shadow-[#6366F1]/20"
            size="lg"
            disabled={otp.length !== 6 || isVerifying}
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            {isVerifying ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</> : 'Verify & Continue'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
