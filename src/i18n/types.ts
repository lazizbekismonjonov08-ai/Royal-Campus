export type Language = 'uz' | 'ru' | 'en';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'uz', name: 'Uzbek', nativeName: 'O‘zbekcha', flag: 'UZ' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: 'RU' },
  { code: 'en', name: 'English', nativeName: 'English', flag: 'EN' },
];

export type TranslationDictionary = Record<string, string>;
