import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  HeartPulse, 
  AlertTriangle, 
  CheckCircle,
  ChevronRight,
  X
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface FirstAidGuide {
  id: string;
  title: string;
  icon: any;
  category: string;
  steps: string[];
}

const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: "bleeding",
    title: "Severe Bleeding",
    icon: HeartPulse,
    category: "Injuries",
    steps: [
      "Apply direct pressure to the wound with a clean cloth or bandage",
      "Elevate the injured area above the heart if possible",
      "Do not remove the first bandage if blood soaks through - add another on top",
      "Continue applying pressure until bleeding stops or help arrives",
      "If bleeding doesn't stop after 10 minutes, call emergency services"
    ]
  },
  {
    id: "burns",
    title: "Burns",
    icon: AlertTriangle,
    category: "Injuries",
    steps: [
      "Cool the burn under running water for at least 20 minutes",
      "Remove any clothing or jewelry near the burn area",
      "Cover the burn with a sterile, non-stick bandage or clean cloth",
      "Do not apply ice, butter, or ointments to the burn",
      "Seek medical attention for severe burns or burns on face/hands/genitals"
    ]
  },
  {
    id: "fracture",
    title: "Possible Fracture",
    icon: AlertTriangle,
    category: "Injuries",
    steps: [
      "Keep the injured area immobilized - do not try to straighten it",
      "Apply ice wrapped in cloth to reduce swelling",
      "If possible, splint the area above and below the injury",
      "Do not move the person unless absolutely necessary",
      "Call emergency services immediately"
    ]
  },
  {
    id: "unconscious",
    title: "Unconscious Person",
    icon: HeartPulse,
    category: "Emergency",
    steps: [
      "Check if the person is breathing - look for chest rise",
      "If not breathing, begin CPR immediately",
      "Call emergency services (112) or have someone else call",
      "If alone, call 112 first then begin CPR",
      "Continue CPR until help arrives or person starts breathing"
    ]
  },
  {
    id: "shock",
    title: "Signs of Shock",
    icon: AlertTriangle,
    category: "Emergency",
    steps: [
      "Lay the person down on their back",
      "Elevate their feet about 12 inches if no head/neck injury",
      "Keep them warm with a blanket or coat",
      "Do not give them anything to eat or drink",
      "Monitor breathing and call emergency services"
    ]
  },
  {
    id: "concussion",
    title: "Possible Concussion",
    icon: AlertTriangle,
    category: "Head Injury",
    steps: [
      "Keep the person still and calm",
      "Apply ice to the head injury area",
      "Do not let them sleep for the first few hours",
      "Watch for vomiting, confusion, or unequal pupils",
      "Seek immediate medical attention if symptoms worsen"
    ]
  }
];

export function FirstAidScreen({ onNavigate, onBack }: { onNavigate: (screen: string) => void; onBack: () => void }) {
  const [selectedGuide, setSelectedGuide] = useState<FirstAidGuide | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Emergency", "Injuries", "Head Injury"];

  const filteredGuides = selectedCategory === "All" 
    ? FIRST_AID_GUIDES 
    : FIRST_AID_GUIDES.filter(g => g.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0A1628] pb-24">
      {/* Header */}
      <div className="relative p-6 pb-8 rounded-b-[2.5rem] overflow-hidden"
        style={{ background: "linear-gradient(135deg, #E63946 0%, #F4A261 40%, #0A1628 100%)" }}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#E63946]/30 blur-[80px]"
        />
        
        <div className="relative z-10 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={selectedGuide ? () => setSelectedGuide(null) : onBack}
            className="text-white hover:bg-white/10"
          >
            {selectedGuide ? <X className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          </Button>
          <div>
            <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: "Poppins" }}>
              {selectedGuide ? selectedGuide.title : "First Aid Guide"}
            </h1>
            <p className="text-white/80 text-sm">
              {selectedGuide ? "Emergency medical instructions" : "Quick access to life-saving information"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-20">
        <AnimatePresence mode="wait">
          {!selectedGuide ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <motion.button
                    key={category}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      selectedCategory === category
                        ? "text-white"
                        : "text-white/60 bg-white/10"
                    }`}
                    style={selectedCategory === category ? {
                      background: "linear-gradient(135deg, #E63946, #F4A261)"
                    } : {}}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>

              {/* Guide List */}
              <div className="space-y-3">
                {filteredGuides.map((guide) => {
                  const Icon = guide.icon;
                  return (
                    <motion.div
                      key={guide.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedGuide(guide)}
                    >
                      <Card className="p-4 glass-card border-white/10 cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E63946]/20">
                            <Icon className="w-6 h-6 text-[#E63946]" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1" style={{ fontFamily: "Poppins" }}>
                              {guide.title}
                            </h3>
                            <p className="text-white/50 text-sm">{guide.category}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/50" />
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Warning Card */}
              <Card className="p-4 glass-card border-[#F4A261]/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F4A261]/20 flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-[#F4A261]" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm mb-1" style={{ fontFamily: "Poppins" }}>
                      Important Disclaimer
                    </h4>
                    <p className="text-white/60 text-xs">
                      This guide provides basic first aid information. In an emergency, always call professional medical services (112) first.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Steps */}
              <Card className="p-5 glass-card border-white/10">
                <h3 className="text-white font-semibold mb-4" style={{ fontFamily: "Poppins" }}>
                  Steps to Follow
                </h3>
                <div className="space-y-3">
                  {selectedGuide.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
                      >
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed pt-1">
                        {step}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Emergency Call Button */}
              <Card className="p-4 glass-card border-2 border-[#E63946]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E63946]/20">
                      <HeartPulse className="w-6 h-6 text-[#E63946]" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm" style={{ fontFamily: "Poppins" }}>
                        Need Immediate Help?
                      </h4>
                      <p className="text-white/50 text-xs">Call emergency services</p>
                    </div>
                  </div>
                  <Button size="lg" className="h-12 px-6 text-white font-semibold"
                    style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
                  >
                    Call 112
                  </Button>
                </div>
              </Card>

              {/* Category Badge */}
              <div className="flex justify-center">
                <span className="px-4 py-2 rounded-full text-sm text-white/60 bg-white/10">
                  {selectedGuide.category}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
