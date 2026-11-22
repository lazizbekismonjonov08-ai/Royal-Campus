import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, TranslationDictionary } from './types';
import { uz } from './locales/uz';
import { ru } from './locales/ru';
import { en } from './locales/en';

const STORAGE_KEY = 'ROYAL_CAMPUS_LANG';

const dictionaries: Record<Language, TranslationDictionary> = {
  uz,
  ru,
  en,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  formatNumber: (value: number) => string;
  formatPercent: (value: number, decimals?: number) => string;
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: string | Date) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'uz' || saved === 'ru' || saved === 'en') {
        return saved;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return 'uz'; // Uzbek is default for first-time visitors
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch (e) {
      console.error('Failed to save language to localStorage', e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const currentDict = dictionaries[language] || dictionaries.uz;
      let text = currentDict[key];

      // Safe fallback: try Uzbek first, then key itself
      if (!text && language !== 'uz') {
        text = dictionaries.uz[key];
      }
      if (!text) {
        text = key;
      }

      // Parameter interpolation e.g. {name}, {count}
      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return text;
    },
    [language]
  );

  const formatNumber = useCallback(
    (value: number): string => {
      if (isNaN(value)) return '0';
      const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ';
      return new Intl.NumberFormat(locale).format(value);
    },
    [language]
  );

  const formatCurrency = useCallback(
    (amount: number): string => {
      if (isNaN(amount)) return '0 UZS';
      // Format number according to locale, always keep UZS / Uzbekistani so'm currency
      const formattedNum = formatNumber(amount);
      if (language === 'ru') {
        return `${formattedNum} сум`;
      }
      return `${formattedNum} UZS`;
    },
    [language, formatNumber]
  );

  const formatDate = useCallback(
    (dateVal: string | Date, options?: Intl.DateTimeFormatOptions): string => {
      if (!dateVal) return '';
      try {
        const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
        if (isNaN(d.getTime())) return String(dateVal);

        const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ';
        const defaultOptions: Intl.DateTimeFormatOptions = options || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        };
        return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
      } catch {
        return String(dateVal);
      }
    },
    [language]
  );

  const formatDateTime = useCallback(
    (dateVal: string | Date): string => {
      return formatDate(dateVal, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    [formatDate]
  );

  const formatPercent = useCallback(
    (value: number, decimals: number = 2): string => {
      if (isNaN(value)) return '0%';
      const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ';
      return (
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value) + '%'
      );
    },
    [language]
  );

  const contextValue = useMemo<I18nContextType>(
    () => ({
      language,
      setLanguage,
      t,
      formatCurrency,
      formatNumber,
      formatPercent,
      formatDate,
      formatDateTime,
    }),
    [language, setLanguage, t, formatCurrency, formatNumber, formatPercent, formatDate, formatDateTime]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
