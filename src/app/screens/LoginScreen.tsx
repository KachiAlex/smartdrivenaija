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
    <div className="size-full flex flex-col bg-gradient-to-br from-background to-muted/20 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-12 pt-8"
      >
        <div className="p-3 rounded-2xl bg-primary">
          <Car className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>SmartDrive Naija</h1>
          <p className="text-sm text-muted-foreground">Welcome back!</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col"
      >
        <h2 className="mb-2" style={{ fontSize: "1.75rem" }}>Login to Continue</h2>
        <p className="text-muted-foreground mb-8">
          Enter your phone number to access your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-12 h-12"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We'll send you a verification code
            </p>
          </div>

          <Card className="p-4 bg-accent/10 border-accent/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <span className="text-2xl">🇳🇬</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-1">Nigerian Numbers Only</h4>
                <p className="text-sm text-muted-foreground">
                  This service is currently available for Nigerian phone numbers only.
                </p>
              </div>
            </div>
          </Card>

          <Button type="submit" className="w-full h-12" size="lg" disabled={isSubmitting || !phoneNumber}>
            {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> : 'Send Verification Code'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
