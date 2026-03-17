import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type Language = 'RO' | 'EN';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (ro: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'petricani22_language';
const FIRST_VISIT_KEY = 'petricani22_visited';

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  const langCode = browserLang.toLowerCase().split('-')[0];

  if (langCode === 'ro') {
    return 'RO';
  }
  if (langCode === 'en') {
    return 'EN';
  }
  return 'RO';
}

function getStoredLanguage(): Language | null {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'RO' || stored === 'EN') {
    return stored;
  }
  return null;
}

function setStoredLanguage(lang: Language): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

function isFirstVisit(): boolean {
  return !localStorage.getItem(FIRST_VISIT_KEY);
}

function markVisited(): void {
  localStorage.setItem(FIRST_VISIT_KEY, 'true');
}

function getLanguageFromPath(pathname: string): Language {
  if (pathname.startsWith('/en')) {
    return 'EN';
  }
  return 'RO';
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const language: Language = getLanguageFromPath(location.pathname);

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  const setLanguage = (newLang: Language) => {
    const currentPath = location.pathname;
    const langPrefix = newLang === 'RO' ? 'ro' : 'en';
    const currentLangPrefix = language === 'RO' ? 'ro' : 'en';

    let newPath: string;

    if (currentPath.startsWith(`/${currentLangPrefix}/`)) {
      newPath = currentPath.replace(`/${currentLangPrefix}/`, `/${langPrefix}/`);
    } else if (currentPath === `/${currentLangPrefix}`) {
      newPath = `/${langPrefix}`;
    } else {
      newPath = `/${langPrefix}${currentPath}`;
    }

    navigate(newPath + location.search + location.hash);
  };

  const t = (ro: string, en: string): string => {
    return language === 'RO' ? ro : en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let targetLang: Language;

    if (isFirstVisit()) {
      targetLang = detectBrowserLanguage();
      markVisited();
    } else {
      targetLang = getStoredLanguage() || 'RO';
    }

    const langPrefix = targetLang === 'RO' ? 'ro' : 'en';
    const currentPath = location.pathname === '/' ? '' : location.pathname;
    navigate(`/${langPrefix}${currentPath}${location.search}${location.hash}`, { replace: true });
  }, [navigate, location]);

  return null;
}

export { getStoredLanguage, detectBrowserLanguage };
