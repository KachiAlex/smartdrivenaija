import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ha" | "yo" | "ig" | "pi";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    welcome: "Welcome",
    home: "Home",
    modules: "Modules",
    profile: "Profile",
    leaderboard: "Leaderboard",
    mockTest: "Mock Test",
    startTest: "Start Test",
    submit: "Submit",
    next: "Next",
    previous: "Previous",
    correct: "Correct",
    incorrect: "Incorrect",
    passed: "Passed",
    failed: "Failed",
    xpEarned: "XP Earned",
    streak: "Day Streak",
    totalXP: "Total XP",
    badges: "Badges",
    settings: "Settings",
    language: "Language",
    darkMode: "Dark Mode",
    notifications: "Notifications",
    logout: "Logout",
  },
  ha: {
    welcome: "Barka da zuwa",
    home: "Gida",
    modules: "Sashi",
    profile: "Bayani",
    leaderboard: "Jerin Mafiya",
    mockTest: "Gwajin Kwaikwayo",
    startTest: "Fara Gwaji",
    submit: "Aika",
    next: "Na gaba",
    previous: "Na baya",
    correct: "Daidai",
    incorrect: "Ba daidai ba",
    passed: "Wuce",
    failed: "Rasa",
    xpEarned: "XP Samun",
    streak: "Rana",
    totalXP: "Dukkan XP",
    badges: "Badges",
    settings: "Saitunan",
    language: "Harshe",
    darkMode: "Lalubadar",
    notifications: "Sanarwa",
    logout: "Fita",
  },
  yo: {
    welcome: "Kaabo",
    home: "Ile",
    modules: "Eka",
    profile: "Awo",
    leaderboard: "Ayo",
    mockTest: "Idanwo",
    startTest: "Bere Idanwo",
    submit: "Fi",
    next: "Eke",
    previous: "Atele",
    correct: "Ooto",
    incorrect: "Airooto",
    passed: "Wole",
    failed: "Padanu",
    xpEarned: "XP Samun",
    streak: "Ojo",
    totalXP: "Gbogbo XP",
    badges: "Badges",
    settings: "Eto",
    language: "Ede",
    darkMode: "Ala",
    notifications: "Iroyin",
    logout: "Jade",
  },
  ig: {
    welcome: "Nno",
    home: "Ulo",
    modules: "Nzuko",
    profile: "Ozi",
    leaderboard: "Ndepụta",
    mockTest: "Nwale",
    startTest: "Bido Nwale",
    submit: "Gaa",
    next: "Nke na-esote",
    previous: "Nke gara-aga",
    correct: "Ziri ezi",
    incorrect: "Agha ziri ezi",
    passed: "Gafe",
    failed: "Mme",
    xpEarned: "XP Wetara",
    streak: "Ụbọchị",
    totalXP: "XP Nile",
    badges: "Badges",
    settings: "Ntọala",
    language: "Asụsụ",
    darkMode: "Ọchịchị",
    notifications: "Ozi",
    logout: "Pụọ",
  },
  pi: {
    welcome: "Howdy",
    home: "Haus",
    modules: "Modul",
    profile: "Profail",
    leaderboard: "Lidabod",
    mockTest: "Mock Test",
    startTest: "Start Test",
    submit: "Submit",
    next: "Next",
    previous: "Previous",
    correct: "Correct",
    incorrect: "Wrong",
    passed: "Pass",
    failed: "Fail",
    xpEarned: "XP Don Chop",
    streak: "Streak",
    totalXP: "Total XP",
    badges: "Badges",
    settings: "Settings",
    language: "Language",
    darkMode: "Dark Mode",
    notifications: "Notifications",
    logout: "Logout",
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
