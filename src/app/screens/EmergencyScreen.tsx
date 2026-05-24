import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, 
  MapPin, 
  AlertTriangle, 
  Check,
  X,
  Share2,
  UserPlus,
  HeartPulse,
  Shield,
  Navigation,
  Edit,
  Trash2
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export function EmergencyScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [sosActive, setSosActive] = useState(false);
  const [locationShared, setLocationShared] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Emergency Contact 1", phone: "+2348000000000" },
    { id: "2", name: "Emergency Contact 2", phone: "+2348000000000" },
  ]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: "Ensure everyone is safe", completed: false },
    { id: 2, text: "Call emergency services (112)", completed: false },
    { id: 3, text: "Take photos of the scene", completed: false },
    { id: 4, text: "Exchange information with other parties", completed: false },
    { id: 5, text: "Move to a safe location if possible", completed: false },
  ]);

  const handleSOS = () => {
    setSosActive(true);
    // Share location when SOS is activated
    handleShareLocation();
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // TODO: Send location to backend / contacts
          console.log("Location shared:", { latitude, longitude });
          setLocationShared(true);
          
          // Generate a Google Maps link to share
          const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
          
          // Share via WhatsApp or SMS (mock)
          if (contacts.length > 0) {
            const message = `EMERGENCY SOS! I need help. My location: ${mapsUrl}`;
            console.log("Would share to contacts:", message);
          }
        },
        (error) => {
          console.error("Location access denied or error:", error);
          setLocationShared(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
    }
  };

  const handleCancelSOS = () => {
    setSosActive(false);
    setLocationShared(false);
  };

  const toggleChecklistItem = (id: number) => {
    setChecklistItems(items => 
      items.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      setContacts([...contacts, {
        id: Date.now().toString(),
        name: newContact.name,
        phone: newContact.phone
      }]);
      setNewContact({ name: "", phone: "" });
      setShowAddContact(false);
    }
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
  };

  const handleSaveContact = () => {
    if (editingContact) {
      setContacts(contacts.map(c => 
        c.id === editingContact.id ? editingContact : c
      ));
      setEditingContact(null);
    }
  };

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
        
        <div className="relative z-10">
          <h1 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: "Poppins" }}>
            Emergency Mode
          </h1>
          <p className="text-white/80 text-sm">
            Quick access to emergency services and assistance
          </p>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-20 space-y-4">
        {/* SOS Button */}
        <Card className="p-6 glass-card border-2 border-[#E63946]/30">
          <div className="flex flex-col items-center">
            <motion.button
              onClick={sosActive ? handleCancelSOS : handleSOS}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={sosActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: sosActive ? Infinity : 0 }}
              className="w-32 h-32 rounded-full flex items-center justify-center mb-4"
              style={{ 
                background: sosActive 
                  ? "linear-gradient(135deg, #DC2626, #991B1B)" 
                  : "linear-gradient(135deg, #E63946, #F4A261)"
              }}
            >
              <AlertTriangle className="w-16 h-16 text-white" />
            </motion.button>
            
            <h3 className="text-white font-semibold text-lg mb-1" style={{ fontFamily: "Poppins" }}>
              {sosActive ? "SOS Activated" : "Tap for SOS"}
            </h3>
            <p className="text-white/60 text-sm text-center">
              {sosActive 
                ? "Emergency contacts notified" 
                : "Alert your emergency contacts"}
            </p>

            <AnimatePresence>
              {locationShared && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex items-center gap-2 text-green-400"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Location shared</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="p-4 glass-card border-white/10 cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E63946]/20 mb-3">
                  <Phone className="w-6 h-6 text-[#E63946]" />
                </div>
                <h4 className="text-white font-medium text-sm mb-1" style={{ fontFamily: "Poppins" }}>
                  Call 112
                </h4>
                <p className="text-white/50 text-xs">Emergency Services</p>
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="p-4 glass-card border-white/10 cursor-pointer" onClick={() => onNavigate("first-aid")}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#F4A261]/20 mb-3">
                  <HeartPulse className="w-6 h-6 text-[#F4A261]" />
                </div>
                <h4 className="text-white font-medium text-sm mb-1" style={{ fontFamily: "Poppins" }}>
                  First Aid
                </h4>
                <p className="text-white/50 text-xs">Quick Guide</p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Emergency Contacts */}
        <Card className="p-4 glass-card border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold" style={{ fontFamily: "Poppins" }}>
              Emergency Contacts
            </h3>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-[#E63946]"
              onClick={() => setShowAddContact(true)}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <AnimatePresence>
            {showAddContact && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-white/5 rounded-lg space-y-3"
              >
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/50 text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/50 text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleAddContact}
                    className="flex-1 text-white"
                    style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
                  >
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setShowAddContact(false)}
                    className="text-white/60"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E63946]/20 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-[#E63946]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{contact.name}</p>
                    <p className="text-white/50 text-xs">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleEditContact(contact)}
                    className="h-8 w-8 p-0 text-white/50 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDeleteContact(contact.id)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" className="h-8 px-3 text-white"
                    style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Crash Checklist */}
        <Card className="p-4 glass-card border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold" style={{ fontFamily: "Poppins" }}>
              Crash Checklist
            </h3>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-[#E63946]"
              onClick={() => setShowChecklist(!showChecklist)}
            >
              {showChecklist ? <X className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
            </Button>
          </div>

          <AnimatePresence>
            {showChecklist && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {checklistItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      item.completed ? 'bg-green-500/20' : 'bg-white/5'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      item.completed ? 'bg-green-500' : 'bg-white/10'
                    }`}>
                      {item.completed && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className={`text-sm ${item.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Location Sharing */}
        <Card className="p-4 glass-card border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F4A261]/20 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-[#F4A261]" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium text-sm mb-1" style={{ fontFamily: "Poppins" }}>
                Share Location
              </h4>
              <p className="text-white/50 text-xs">
                Share your GPS location with emergency contacts
              </p>
            </div>
            <Button 
              size="sm" 
              className="h-9 px-4 text-white"
              style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
              onClick={handleShareLocation}
            >
              Share
            </Button>
          </div>
        </Card>

        {/* Safety Info */}
        <Card className="p-4 glass-card border-[#F4A261]/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F4A261]/20 flex-shrink-0">
              <Shield className="w-4 h-4 text-[#F4A261]" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-1" style={{ fontFamily: "Poppins" }}>
                Stay Calm & Safe
              </h4>
              <p className="text-white/60 text-xs">
                In an emergency, stay calm. Follow the checklist and contact emergency services immediately. Your safety is the priority.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
