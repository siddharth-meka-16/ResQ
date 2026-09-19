"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Locale, SUPPORTED_LANGUAGES, TranslationDictionary } from "@/types/i18n";
import { dictionaries } from "@/locales";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: TranslationDictionary;
  t: (keyPath: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "resq_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Read stored language on client mount (deferred to satisfy strict react-hooks rules)
  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
        if (stored && (stored === "en" || stored === "hi")) {
          setLocaleState(stored);
          document.documentElement.lang = stored;
        }
      } catch {
        // Ignore localStorage errors
      }
    })();
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore storage errors
    }
  };

  const dict = useMemo(() => {
    return dictionaries[locale] ?? dictionaries.en;
  }, [locale]);

  const t = (keyPath: string, fallback?: string): string => {
    const keys = keyPath.split(".");
    let current: unknown = dict;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        // Fallback to English dictionary if key not found
        let fallbackVal: unknown = dictionaries.en;
        for (const k of keys) {
          if (fallbackVal && typeof fallbackVal === "object" && k in fallbackVal) {
            fallbackVal = (fallbackVal as Record<string, unknown>)[k];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        if (typeof fallbackVal === "string") return fallbackVal;
        return fallback ?? keyPath;
      }
    }

    if (typeof current === "string") {
      return current;
    }

    return fallback ?? keyPath;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dict, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      dict: dictionaries.en,
      t: (key: string, fallback?: string) => fallback ?? key,
    };
  }
  return context;
}

export const useLanguage = useTranslation;

export { SUPPORTED_LANGUAGES };
