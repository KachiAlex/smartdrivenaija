import { useState, useEffect, useRef } from "react";
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
import { SettingsScreen } from "./screens/SettingsScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { EmergencyScreen } from "./screens/EmergencyScreen";
import { FirstAidScreen } from "./screens/FirstAidScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen";
import { BottomNav } from "./components/BottomNav";
import { Toaster } from "./components/ui/sonner";

type Screen =
  | "splash"
  | "onboarding"
  | "login"
  | "otp"
  | "register"
  | "forgot-password"
  | "language"
  | "home"
  | "modules"
  | "lesson"
  | "quiz"
  | "mock-test"
  | "results"
  | "certificate"
  | "profile"
  | "settings"
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

  const splashDoneRef = useRef(false);
  const otpPendingRef = useRef(false);

  // Respond to auth state changes for pending splash/OTP navigation
  useEffect(() => {
    if (isLoading) return;

    const routeAfterAuth = () => {
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

    if (splashDoneRef.current) {
      splashDoneRef.current = false;
      routeAfterAuth();
    }

    if (otpPendingRef.current) {
      otpPendingRef.current = false;
      if (isAuthenticated) {
        if (isNewUser || !user?.onboardingCompleted) {
          setCurrentScreen("language");
        } else {
          setCurrentScreen("home");
        }
      } else {
        setCurrentScreen("onboarding");
      }
    }
  }, [isLoading, isAuthenticated, isNewUser, user]);

  const handleSplashComplete = () => {
    if (isLoading) {
      splashDoneRef.current = true;
      return;
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

    if (["home", "modules", "wallet", "mock-test", "leaderboard", "settings"].includes(screen)) {
      setActiveTab(screen);
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
    if (isLoading) {
      otpPendingRef.current = true;
      return;
    }

    if (isAuthenticated) {
      if (isNewUser || !user?.onboardingCompleted) {
        setCurrentScreen("language");
      } else {
        setCurrentScreen("home");
      }
    } else {
      otpPendingRef.current = true;
    }
  };

  const showBottomNav = ["home", "modules", "wallet", "mock-test", "leaderboard", "settings", "profile", "emergency"].includes(currentScreen);

  return (
    <div className="min-h-[100dvh] min-h-screen w-full bg-background relative">
      {currentScreen === "splash" && <SplashScreen onComplete={handleSplashComplete} />}
      {currentScreen === "onboarding" && <OnboardingScreen onComplete={() => setCurrentScreen("login")} />}
      {currentScreen === "login" && (
        <LoginScreen
          onLogin={handleLoginSuccess}
          onForgotPassword={() => setCurrentScreen("forgot-password")}
          onRegister={() => setCurrentScreen("register")}
        />
      )}
      {currentScreen === "register" && (
        <RegisterScreen
          onComplete={handleOTPVerified}
          onBack={() => setCurrentScreen("login")}
        />
      )}
      {currentScreen === "forgot-password" && (
        <ForgotPasswordScreen
          onComplete={() => setCurrentScreen("login")}
          onBack={() => setCurrentScreen("login")}
        />
      )}
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
      {currentScreen === "settings" && <SettingsScreen onNavigate={navigate} />}
      {currentScreen === "leaderboard" && <LeaderboardScreen onNavigate={navigate} />}

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