import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import enTranslations from '@/locales/en.json';
import kuTranslations from '@/locales/ku.json';

export type Language = 'en' | 'ku';
export type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  translations: typeof enTranslations | typeof kuTranslations;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>, options?: { returnObjects?: boolean }) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: enTranslations,
  ku: kuTranslations,
};

const languageDirections: Record<Language, Direction> = {
  en: 'ltr',
  ku: 'rtl',
};

const LANGUAGE_STORAGE_KEY = 'preferred-language';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get language from localStorage first
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'ku')) {
      return stored as Language;
    }

    // Default to English
    return 'en';
  });

  const direction = languageDirections[language];
  const currentTranslations = translations[language];

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

    // Update document direction and lang attributes
    document.documentElement.dir = languageDirections[lang];
    document.documentElement.lang = lang;
  };

  // Set initial direction and lang
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  // Translation function with parameter interpolation
  const t = (key: string, params?: Record<string, string>, options?: { returnObjects?: boolean }): any => {
    // Safety check for undefined or null key
    if (!key || typeof key !== 'string') {
      console.warn(`Invalid translation key: ${key}`);
      return String(key || '');
    }

    const keys = key.split('.');
    let value: any = currentTranslations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // Handle parameter interpolation only if it's a string
    if (typeof value === 'string' && params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        translations: currentTranslations,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

