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
    <div className="size-full flex flex-col bg-background p-6 pb-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="flex justify-center mb-6 pt-8"
      >
        <div className="p-6 rounded-full bg-primary/10">
          <Award className="w-20 h-20 text-primary" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="mb-2" style={{ fontSize: "2rem" }}>
          Congratulations! 🎉
        </h1>
        <p className="text-muted-foreground text-lg">
          You've completed the module
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full translate-y-12 -translate-x-12" />

          <div className="relative">
            <div className="flex justify-center mb-4">
              <Badge className="bg-primary text-white px-4 py-1">
                Certificate of Completion
              </Badge>
            </div>

            <div className="text-center mb-6">
              <h2 className="mb-2" style={{ fontSize: "1.5rem" }}>
                Road Signs & Markings
              </h2>
              <p className="text-muted-foreground">
                Awarded to
              </p>
              <h3 className="mt-2 mb-4" style={{ fontSize: "1.75rem" }}>
                Chinedu Okafor
              </h3>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                Completed on May 20, 2026
              </span>
            </div>

            <div className="border-t border-dashed pt-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Certificate ID</p>
                  <p className="font-heading" style={{ fontWeight: 600 }}>
                    SDN-2026-RS-00234
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <QrCode className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground">
                <Award className="w-5 h-5" />
                <span className="font-heading" style={{ fontWeight: 600 }}>
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
          <Button variant="outline" className="h-12">
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="h-12">
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
        </div>

        <Button onClick={() => onNavigate("home")} className="w-full h-12" size="lg">
          Back to Home
        </Button>
      </motion.div>
    </div>
  );
}
