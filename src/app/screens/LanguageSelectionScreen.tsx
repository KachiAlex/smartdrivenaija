import { useState } from "react";
import { Button } from "../components/ui/button";
import { LanguageCard } from "../components/LanguageCard";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";

interface LanguageSelectionScreenProps {
  onComplete: () => void;
}

const languages = [
  { id: "en", name: "English", region: "Official Language", icon: "🇬🇧" },
  { id: "ha", name: "Hausa", region: "Northern Nigeria", icon: "🗣️" },
  { id: "yo", name: "Yoruba", region: "Western Nigeria", icon: "🗣️" },
  { id: "ig", name: "Igbo", region: "Eastern Nigeria", icon: "🗣️" },
  { id: "pi", name: "Pidgin", region: "Widely Spoken", icon: "🇳🇬" }
];

export function LanguageSelectionScreen({ onComplete }: LanguageSelectionScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isSaving, setIsSaving] = useState(false);
  const { updateUser } = useAuth();

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await api.completeOnboarding({ preferredLanguage: selectedLanguage });
      updateUser({ preferredLanguage: selectedLanguage, onboardingCompleted: true });
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preference');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="size-full flex flex-col bg-[#FAFBFF] p-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-8 mb-8"
      >
        <h1 className="mb-2 text-[#0F172A]" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
          Choose Your Language
        </h1>
        <p className="text-[#64748B] text-lg">
          Select your preferred language for learning
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 overflow-auto"
      >
        <div className="grid gap-4 mb-6">
          {languages.map((language, index) => (
            <motion.div
              key={language.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <LanguageCard
                {...language}
                isSelected={selectedLanguage === language.id}
                onClick={() => setSelectedLanguage(language.id)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#FAFBFF] border-t border-[#E2E8F0]">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={handleComplete} className="w-full h-12 shadow-lg shadow-[#E63946]/20" size="lg" disabled={isSaving}
            style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
          >
            {isSaving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : 'Continue'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
