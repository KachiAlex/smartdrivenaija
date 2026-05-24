import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { I18nProvider } from "./context/I18nContext";
import { SplashScreen } from "./screens/SplashScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { OTPScreen } from "./screens/OTPScreen";
import { LanguageSelectionScreen } from "./screens/LanguageSelectionScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ModulesScreen } from "./screens/ModulesScreen";
import { LessonScreen } from "./screens/LessonScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { MockTestScreen } from "./screens/MockTestScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { CertificateScreen } from "./screens/CertificateScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { EmergencyScreen } from "./screens/EmergencyScreen";
import { FirstAidScreen } from "./screens/FirstAidScreen";
import { BottomNav } from "./components/BottomNav";
import { Toaster } from "./components/ui/sonner";

type Screen =
  | "splash"
  | "onboarding"
  | "login"
  | "otp"
  | "language"
  | "home"
  | "modules"
  | "lesson"
  | "quiz"
  | "mock-test"
  | "results"
  | "certificate"
  | "profile"
  | "leaderboard"
  | "wallet"
  | "emergency"
  | "first-aid";

function AppContent() {
  const { isAuthenticated, isLoading, user, isNewUser } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [activeTab, setActiveTab] = useState("home");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  // Determine initial screen based on auth state
  useEffect(() => {
    if (currentScreen !== "splash") return;
    // Splash screen handles its own timeout, then we route
  }, [currentScreen]);

  const handleSplashComplete = () => {
    if (isLoading) {
      // Auth still loading, wait a bit
      const check = setInterval(() => {
        // This will re-evaluate on next render
        clearInterval(check);
      }, 100);
    }

    if (isAuthenticated) {
      if (isNewUser || !user?.onboardingCompleted) {
        setCurrentScreen("language");
      } else {
        setCurrentScreen("home");
      }
    } else {
      setCurrentScreen("onboarding");
    }
  };

  const navigate = (screen: string, data?: { moduleId?: number; lessonId?: number }) => {
    if (data?.moduleId) setSelectedModuleId(data.moduleId);
    if (data?.lessonId) setSelectedLessonId(data.lessonId);
    setCurrentScreen(screen as Screen);

    if (["home", "modules", "mock-test", "leaderboard", "profile"].includes(screen)) {
      setActiveTab(screen === "mock-test" ? "mock-test" : screen);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(tab as Screen);
  };

  const handleLoginSuccess = (phone: string, userEmail?: string) => {
    setPhoneNumber(phone);
    setEmail(userEmail || "");
    setCurrentScreen("otp");
  };

  const handleOTPVerified = () => {
    if (isNewUser || !user?.onboardingCompleted) {
      setCurrentScreen("language");
    } else {
      setCurrentScreen("home");
    }
  };

  const showBottomNav = ["home", "modules", "wallet", "mock-test", "leaderboard", "profile"].includes(currentScreen);

  return (
    <div className="min-h-[100dvh] min-h-screen w-full bg-background relative">
      {currentScreen === "splash" && <SplashScreen onComplete={handleSplashComplete} />}
      {currentScreen === "onboarding" && <OnboardingScreen onComplete={() => setCurrentScreen("login")} />}
      {currentScreen === "login" && <LoginScreen onLogin={handleLoginSuccess} />}
      {currentScreen === "otp" && (
        <OTPScreen
          phoneNumber={phoneNumber}
          email={email}
          onVerify={handleOTPVerified}
          onBack={() => setCurrentScreen("login")}
        />
      )}
      {currentScreen === "language" && (
        <LanguageSelectionScreen onComplete={() => setCurrentScreen("home")} />
      )}
      {currentScreen === "home" && <HomeScreen onNavigate={navigate} />}
      {currentScreen === "modules" && <ModulesScreen onNavigate={navigate} />}
      {currentScreen === "wallet" && <WalletScreen onNavigate={navigate} />}
      {currentScreen === "emergency" && <EmergencyScreen onNavigate={navigate} />}
      {currentScreen === "first-aid" && <FirstAidScreen onNavigate={navigate} onBack={() => setCurrentScreen("emergency")} />}
      {currentScreen === "lesson" && (
        <LessonScreen onNavigate={navigate} moduleId={selectedModuleId} lessonId={selectedLessonId} />
      )}
      {currentScreen === "quiz" && <QuizScreen onNavigate={navigate} moduleId={selectedModuleId} />}
      {currentScreen === "mock-test" && <MockTestScreen onNavigate={navigate} />}
      {currentScreen === "results" && <ResultsScreen onNavigate={navigate} />}
      {currentScreen === "certificate" && <CertificateScreen onNavigate={navigate} />}
      {currentScreen === "profile" && <ProfileScreen onNavigate={navigate} />}
      {currentScreen === "leaderboard" && <LeaderboardScreen />}

      {showBottomNav && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}