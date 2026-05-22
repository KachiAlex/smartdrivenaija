import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { BookOpen, Globe, Award, WifiOff } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: BookOpen,
    title: "Master Nigerian Driving Rules",
    description: "Learn with interactive lessons aligned with FRSC curriculum and Nigerian road standards.",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    icon: Globe,
    title: "Learn in Your Language",
    description: "Study in English, Hausa, Yoruba, Igbo, or Pidgin. Education in your mother tongue.",
    gradient: "from-accent/20 to-accent/5"
  },
  {
    icon: Award,
    title: "Practice & Earn Certificates",
    description: "Take mock tests, track your progress, and earn certificates to prove your knowledge.",
    gradient: "from-secondary/20 to-secondary/5"
  },
  {
    icon: WifiOff,
    title: "Study Anywhere, Anytime",
    description: "Download lessons and learn offline. No internet? No problem!",
    gradient: "from-primary/20 to-primary/5"
  }
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="size-full flex flex-col bg-background">
      <div className="flex justify-end p-4">
        <Button variant="ghost" onClick={onComplete}>
          Skip
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md flex flex-col items-center text-center"
          >
            <div className={`p-12 rounded-full bg-gradient-to-br ${slides[currentSlide].gradient} mb-8`}>
              {(() => {
                const Icon = slides[currentSlide].icon;
                return <Icon className="w-20 h-20 text-primary" strokeWidth={2} />;
              })()}
            </div>

            <h2 className="mb-4 px-4" style={{ fontSize: "1.75rem" }}>
              {slides[currentSlide].title}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed px-4">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-8">
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <Button onClick={nextSlide} className="w-full h-12" size="lg">
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
