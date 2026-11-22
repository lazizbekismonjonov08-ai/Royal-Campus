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
 * Provides real-time validation error message for the passport number field.
 * Returns null if the value strictly matches the pattern.
 */
export function getPassportValidationError(value: string): string | null {
  if (!value || !value.trim()) {
    return "Pasport seriya va raqami kiritilishi shart! (Format: XX1234567)";
  }

  const clean = value.trim().toUpperCase();

  if (PASSPORT_REGEX.test(clean)) {
    return null; // Valid strictly!
  }

  // Real-time progressive diagnostic messages for user guidance
  if (!/^[A-Z]/.test(clean)) {
    return "Pasport 2 ta bosh lotin harfidan boshlanishi kerak (masalan: AA1234567)";
  }

  if (clean.length === 1 || !/^[A-Z]{2}/.test(clean)) {
    return "Pasport seriyasi 2 ta bosh lotin harfi bo'lishi kerak (masalan: FA)";
  }

  if (clean.length < 9) {
    return `Pasport 'XX1234567' formatida 9 ta belgi bo'lishi kerak (${clean.length}/9)`;
  }

  return "Pasport 'XX1234567' formatiga qat'iy mos kelishi shart (masalan: AA1234567)";
}
