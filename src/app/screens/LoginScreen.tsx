import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Car, Phone, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface LoginScreenProps {
  onLogin: (phone: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestOTP } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    // Normalize: ensure +234 prefix
    let cleanPhone = phoneNumber.replace(/\s/g, '').replace(/^0/, '+234');
    if (!cleanPhone.startsWith('+234')) {
      cleanPhone = '+234' + cleanPhone;
    }

    setIsSubmitting(true);
    try {
      const result = await requestOTP(cleanPhone);
      if (result._dev_otp) {
        toast.info(`Dev OTP: ${result._dev_otp}`, { duration: 15000 });
      }
      onLogin(cleanPhone);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="size-full flex flex-col bg-gradient-to-br from-background to-muted/20 p-6 relative overflow-hidden">
      {/* Nigerian-inspired pattern overlay */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute inset-0 nigerian-pattern" />
      </div>

      {/* Animated accent circle */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-12 pt-8 relative z-10"
      >
        <motion.div
          whileHover={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          className="p-3 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg"
        >
          <Car className="w-8 h-8 text-white" />
        </motion.div>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "Poppins" }}>SmartDrive Naija</h1>
          <p className="text-sm text-muted-foreground font-medium">Welcome back!</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col relative z-10"
      >
        <h2 className="mb-2" style={{ fontSize: "1.875rem", fontWeight: 700, fontFamily: "Poppins" }}>Login to Continue</h2>
        <p className="text-muted-foreground mb-8 font-medium">
          Enter your phone number to access your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone" className="font-medium">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-12 h-12 border-2 focus:border-primary/50 transition-all"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We'll send you a verification code
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-4 bg-gradient-to-r from-accent/10 to-accent/5 border-2 border-accent/20 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                className="p-2 rounded-lg bg-accent/20"
              >
                <span className="text-2xl">🇳🇬</span>
              </motion.div>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold">Nigerian Numbers Only</h4>
                <p className="text-sm text-muted-foreground">
                  This service is currently available for Nigerian phone numbers only.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg" size="lg" disabled={isSubmitting || !phoneNumber}>
              {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> : 'Send Verification Code'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
