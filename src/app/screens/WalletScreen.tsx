import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Calendar, 
  AlertCircle, 
  Upload, 
  CheckCircle, 
  Clock,
  Shield,
  ChevronRight,
  Plus,
  Bell,
  X
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { api, DriverDocument, ComplianceStatus, Reminder } from "../lib/api";

interface Document {
  id: string;
  type: string;
  name: string;
  expiryDate: string | null;
  status: "valid" | "expiring" | "expired";
  fileUrl: string | null;
}

const DOCUMENT_TYPES = [
  { id: "license", name: "Driver's License", icon: FileText, required: true },
  { id: "insurance", name: "Vehicle Insurance", icon: Shield, required: true },
  { id: "roadworthiness", name: "Roadworthiness Certificate", icon: CheckCircle, required: true },
  { id: "registration", name: "Vehicle Registration", icon: FileText, required: true },
  { id: "lasdri", name: "LASDRI (Lagos Only)", icon: Calendar, required: false },
  { id: "hackney", name: "Hackney Permit", icon: FileText, required: false },
];

export function WalletScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceStatus = async () => {
    try {
      const status = await api.getComplianceStatus();
      setComplianceStatus(status);
    } catch (error) {
      console.error('Failed to load compliance status:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const reminderData = await api.getReminders();
      setReminders(reminderData);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markReminderAsRead(id);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to mark reminder as read:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadComplianceStatus();
    loadReminders();
  }, []);

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatus = (expiryDate: string | null) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (!days) return "valid";
    if (days < 0) return "expired";
    if (days <= 30) return "expiring";
    return "valid";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-500/20 text-green-700 border-green-500/30";
      case "expiring":
        return "bg-[#F4A261]/20 text-[#D97706] border-[#F4A261]/30";
      case "expired":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30";
    }
  };

  const handleUpload = async (docType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(docType);
      try {
        const docTypeConfig = DOCUMENT_TYPES.find(d => d.id === docType);
        if (!docTypeConfig) return;

        await api.uploadDocument(file, docType, docTypeConfig.name);
        await loadDocuments();
        await loadComplianceStatus();
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-[#0A1628] pb-24">
      {/* Header with gradient and animated blob */}
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
            Digital Driver Wallet
          </h1>
          <p className="text-white/80 text-sm">
            Store your documents securely and never miss a renewal
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 relative z-20">
        {/* Reminders Section */}
        <AnimatePresence>
          {reminders.filter(r => !r.is_read).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Card className="p-4 glass-card border-2 border-[#F4A261]/30">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-5 h-5 text-[#F4A261]" />
                  <h3 className="text-white font-semibold" style={{ fontFamily: "Poppins" }}>
                    Reminders
                  </h3>
                  <span className="ml-auto text-white/60 text-sm">
                    {reminders.filter(r => !r.is_read).length} unread
                  </span>
                </div>
                <div className="space-y-2">
                  {reminders.filter(r => !r.is_read).map((reminder) => (
                    <div key={reminder.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[#E63946]/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-[#E63946]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{reminder.message}</p>
                        {reminder.days_before_expiry && (
                          <p className="text-white/50 text-xs mt-1">
                            Expires in {reminder.days_before_expiry} day(s)
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(reminder.id)}
                        className="h-8 w-8 p-0 text-white/50 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compliance Status Card */}
        <Card className="p-5 glass-card border-2 border-[#E63946]/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold mb-1" style={{ fontFamily: "Poppins" }}>
                Compliance Status
              </h3>
              <p className="text-white/60 text-sm">
                {complianceStatus 
                  ? `${complianceStatus.validDocuments} of ${complianceStatus.totalDocuments} documents uploaded`
                  : 'Loading...'}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
            >
              <span className="text-white text-xl font-bold">
                {complianceStatus ? `${complianceStatus.compliancePercentage}%` : '0%'}
              </span>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: complianceStatus ? `${complianceStatus.compliancePercentage}%` : '0%',
                background: "linear-gradient(90deg, #E63946, #F4A261)"
              }}
            />
          </div>
        </Card>

        {/* Documents List */}
        <h2 className="text-white font-semibold mb-4" style={{ fontFamily: "Poppins" }}>
          Your Documents
        </h2>

        <div className="space-y-3">
          {DOCUMENT_TYPES.map((doc) => {
            const Icon = doc.icon;
            const existingDoc = documents.find(d => d.document_type === doc.id);
            const status = existingDoc ? getStatus(existingDoc.expiry_date) : "valid";
            const daysUntilExpiry = existingDoc ? getDaysUntilExpiry(existingDoc.expiry_date) : null;

            return (
              <motion.div
                key={doc.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="p-4 glass-card border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E63946]/20">
                      <Icon className="w-6 h-6 text-[#E63946]" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium" style={{ fontFamily: "Poppins" }}>
                          {doc.name}
                        </h3>
                        {doc.required && (
                          <Badge className="text-xs bg-[#E63946]/20 text-[#E63946] border-[#E63946]/30">
                            Required
                          </Badge>
                        )}
                      </div>
                      
                      {existingDoc ? (
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getStatusColor(status)}`}>
                            {status === "valid" && "Valid"}
                            {status === "expiring" && `Expires in ${daysUntilExpiry} days`}
                            {status === "expired" && "Expired"}
                          </Badge>
                          {existingDoc.expiry_date && (
                            <span className="text-white/50 text-xs">
                              {new Date(existingDoc.expiry_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-white/50 text-sm">Not uploaded</p>
                      )}
                    </div>

                    {existingDoc ? (
                      <ChevronRight className="w-5 h-5 text-white/50" />
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleUpload(doc.id)}
                        disabled={uploading === doc.id}
                        className="h-9 px-4 text-white"
                        style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
                      >
                        {uploading === doc.id ? (
                          <Clock className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Add Custom Document Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4"
        >
          <Card className="p-4 glass-card border-dashed border-2 border-white/20 cursor-pointer hover:border-[#E63946]/50 transition-colors">
            <div className="flex items-center justify-center gap-2 text-white/60">
              <Plus className="w-5 h-5" />
              <span className="text-sm">Add Custom Document</span>
            </div>
          </Card>
        </motion.div>

        {/* Info Card */}
        <Card className="p-4 glass-card border-[#F4A261]/20 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F4A261]/20 flex-shrink-0">
              <Shield className="w-4 h-4 text-[#F4A261]" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-1" style={{ fontFamily: "Poppins" }}>
                Secure Storage
              </h4>
              <p className="text-white/60 text-xs">
                Your documents are encrypted and stored securely. We'll send you reminders before they expire.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
