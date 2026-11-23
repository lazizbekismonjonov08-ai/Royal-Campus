import { Language } from '../i18n/types';

/**
 * Utility functions for input masking and validation across the application.
 */

/**
 * Strict regex for passport number: exactly 2 uppercase Latin letters followed by 7 digits.
 * Example format: "XX1234567" (e.g. "AA1234567" or "FA7766554")
 */
export const PASSPORT_REGEX = /^[A-Z]{2}\d{7}$/;

/**
 * Strips whitespace and non-alphanumeric characters, converts to uppercase,
 * and caps at exactly 9 characters to strictly fit the "XX1234567" format.
 */
export function formatPassportNumber(value: string): string {
  if (!value) return '';
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
}

/**
 * Validates whether a passport number strictly follows the "XX1234567" pattern:
 * 2 uppercase Latin letters + 7 numeric digits (length 9).
 */
export function isValidPassportNumber(value: string): boolean {
  if (!value) return false;
  return PASSPORT_REGEX.test(value.trim());
}

/**
 * Provides real-time localized validation error message for the passport number field.
 * Returns null if the value strictly matches the pattern.
 */
export function getPassportValidationError(value: string, language: Language = 'uz'): string | null {
  if (!value || !value.trim()) {
    if (language === 'ru') return 'Серия и номер паспорта обязательны! (Формат: XX1234567)';
    if (language === 'en') return 'Passport series and number are required! (Format: XX1234567)';
    return 'Pasport seriya va raqami kiritilishi shart! (Format: XX1234567)';
  }

  const clean = value.trim().toUpperCase();

  if (PASSPORT_REGEX.test(clean)) {
    return null;
  }

  if (!/^[A-Z]/.test(clean)) {
    if (language === 'ru') return 'Паспорт должен начинаться с 2 заглавных латинских букв (например: AA1234567)';
    if (language === 'en') return 'Passport must start with 2 uppercase Latin letters (e.g. AA1234567)';
    return 'Pasport 2 ta bosh lotin harfidan boshlanishi kerak (masalan: AA1234567)';
  }

  if (clean.length === 1 || !/^[A-Z]{2}/.test(clean)) {
    if (language === 'ru') return 'Серия паспорта должна состоять из 2 заглавных латинских букв (например: FA)';
    if (language === 'en') return 'Passport series must be 2 uppercase Latin letters (e.g. FA)';
    return 'Pasport seriyasi 2 ta bosh lotin harfi bo‘lishi kerak (masalan: FA)';
  }

  if (clean.length < 9) {
    if (language === 'ru') return `Паспорт в формате 'XX1234567' должен содержать 9 символов (${clean.length}/9)`;
    if (language === 'en') return `Passport must be 9 characters in 'XX1234567' format (${clean.length}/9)`;
    return `Pasport 'XX1234567' formatida 9 ta belgi bo‘lishi kerak (${clean.length}/9)`;
  }

  if (language === 'ru') return "Паспорт должен строго соответствовать формату 'XX1234567' (например: AA1234567)";
  if (language === 'en') return "Passport must strictly match the 'XX1234567' format (e.g. AA1234567)";
  return "Pasport 'XX1234567' formatiga qat'iy mos kelishi shart (masalan: AA1234567)";
}
