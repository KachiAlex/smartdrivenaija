import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { motion } from "motion/react";
import { Award, Download, Share2, QrCode, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface CertificateScreenProps {
  onNavigate: (screen: string) => void;
}

export function CertificateScreen({ onNavigate }: CertificateScreenProps) {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="size-full flex flex-col bg-[#FAFBFF] p-6 pb-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="flex justify-center mb-6 pt-8"
      >
        <div className="p-6 rounded-full bg-[#E63946]/10">
          <Award className="w-20 h-20 text-[#E63946]" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="mb-2 text-[#0F172A]" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
          Congratulations! 🎉
        </h1>
        <p className="text-[#64748B] text-lg">
          You've completed the module
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <Card className="p-8 glass-card border-2 border-[#E63946]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E63946]/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#F59E0B]/10 rounded-full translate-y-12 -translate-x-12" />

          <div className="relative">
            <div className="flex justify-center mb-4">
              <Badge className="bg-[#E63946] text-white px-4 py-1 border-0">
                Certificate of Completion
              </Badge>
            </div>

            <div className="text-center mb-6">
              <h2 className="mb-2 text-[#0F172A]" style={{ fontSize: "1.5rem", fontWeight: 600, fontFamily: "Poppins" }}>
                Road Signs & Markings
              </h2>
              <p className="text-[#64748B]">
                Awarded to
              </p>
              <h3 className="mt-2 mb-4 text-[#0F172A]" style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "Poppins" }}>
                Chinedu Okafor
              </h3>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-[#E63946]" />
              <span className="text-sm text-[#64748B]">
                Completed on May 20, 2026
              </span>
            </div>

            <div className="border-t border-dashed border-[#E2E8F0] pt-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#64748B] mb-1">Certificate ID</p>
                  <p className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>
                    SDN-2026-RS-00234
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#E2E8F0]">
                  <QrCode className="w-12 h-12 text-[#64748B]" />
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F59E0B]/20 text-[#D97706]">
                <Award className="w-5 h-5" />
                <span className="font-semibold" style={{ fontFamily: "Poppins" }}>
                  +500 XP Earned
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12 border-[#E63946]/30 text-[#E63946]">
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="h-12 border-[#E63946]/30 text-[#E63946]">
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => onNavigate("home")} className="w-full h-12 shadow-lg shadow-[#E63946]/20" size="lg"
            style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}
          >
            Back to Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
