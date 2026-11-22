/**
 * Date validation and masking utilities for DD.MM.YYYY format.
 * Includes precise Gregorian calendar rules, leap year computation,
 * month-day limit checking, and real-time localized error messaging.
 */

export const MONTH_NAMES_UZ: Record<number, string> = {
  1: 'Yanvar',
  2: 'Fevral',
  3: 'Mart',
  4: 'Aprel',
  5: 'May',
  6: 'Iyun',
  7: 'Iyul',
  8: 'Avgust',
  9: 'Sentabr',
  10: 'Oktabr',
  11: 'Noyabr',
  12: 'Dekabr',
};

/**
 * Checks if a given year is a leap year (kabisa yili).
 * Gregorian calendar leap year rule:
 * - Divisible by 4 AND NOT divisible by 100, OR
 * - Divisible by 400.
 * Examples: 2000 (leap), 2004 (leap), 2024 (leap), 1900 (not leap), 2023 (not leap), 2025 (not leap).
 */
export function isLeapYear(year: number): boolean {
  if (isNaN(year) || year <= 0) return false;
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Returns the exact maximum number of days in a given month of a given year.
 */
export function getDaysInMonth(month: number, year?: number): number {
  if (month < 1 || month > 12) return 31;
  if (month === 2) {
    if (year !== undefined && !isNaN(year) && year > 0) {
      return isLeapYear(year) ? 29 : 28;
    }
    return 29; // While year is not yet typed, allow up to 29
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

/**
 * Strips non-digits and automatically formats input as DD.MM.YYYY mask
 * Max length: 10 chars (2 day + 1 dot + 2 month + 1 dot + 4 year)
 */
export function formatDateMask(value: string): string {
  if (!value) return '';
  // Faqat raqamlarni qoldirish (max 8 ta raqam)
  const cleaned = value.replace(/\D/g, '').slice(0, 8);

  if (cleaned.length <= 2) {
    return cleaned;
  }
  if (cleaned.length <= 4) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  }
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4, 8)}`;
}

/**
 * Converts "YYYY-MM-DD" (ISO) or "DD.MM.YYYY" to "DD.MM.YYYY"
 */
export function normalizeToDisplayDate(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  // Already DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}.${m}.${y}`;
  }
  return formatDateMask(trimmed);
}

/**
 * Converts "DD.MM.YYYY" to "YYYY-MM-DD" (ISO)
 */
export function displayToIsoDate(display: string): string {
  if (!display) return '';
  const parts = display.split('.');
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
}

export interface DateValidationResult {
  isValid: boolean;
  isComplete: boolean;
  isLeapYear?: boolean;
  error: string | null;
  day?: number;
  month?: number;
  year?: number;
  isoDate?: string;
  successMessage?: string;
}

/**
 * Validates a date string in real-time according to Gregorian calendar rules:
 * - Checks day bounds (01-31)
 * - Checks month bounds (01-12)
 * - Checks 30-day months (Apr, Jun, Sep, Nov cannot have 31 days)
 * - Checks February days (28 days normally, 29 days strictly in leap years)
 * - Checks year realism (e.g. 1920 <= year <= currentYear)
 * - Checks against future birth dates
 */
export function validateCalendarDate(
  value: string,
  options: {
    minYear?: number;
    maxYear?: number;
    allowFuture?: boolean;
    isTouched?: boolean;
  } = {}
): DateValidationResult {
  const {
    minYear = 1920,
    maxYear = new Date().getFullYear(),
    allowFuture = false,
    isTouched = false,
  } = options;

  if (!value || !value.trim()) {
    return {
      isValid: false,
      isComplete: false,
      error: isTouched ? 'Tug‘ilgan sana kiritilishi shart (KK.OO.YYYY)' : null,
    };
  }

  const rawDigits = value.replace(/\D/g, '');
  if (rawDigits.length === 0) {
    return { isValid: false, isComplete: false, error: null };
  }

  // 1. Day validation (first 2 digits)
  const dayStr = rawDigits.slice(0, 2);
  const day = parseInt(dayStr, 10);

  if (dayStr.length === 2) {
    if (day === 0) {
      return { isValid: false, isComplete: false, error: 'Kun 00 bo‘lishi mumkin emas (01-31 oralig‘ida kiriting)' };
    }
    if (day > 31) {
      return { isValid: false, isComplete: false, error: `Noto‘g‘ri kun: ${day}. Oyda ko‘pi bilan 31 kun bo‘lishi mumkin` };
    }
  }

  // 2. Month validation (digits 3-4)
  if (rawDigits.length >= 3) {
    const monthStr = rawDigits.slice(2, 4);
    if (monthStr.length === 2) {
      const month = parseInt(monthStr, 10);
      if (month === 0) {
        return { isValid: false, isComplete: false, error: 'Oy 00 bo‘lishi mumkin emas (01-12 oralig‘ida kiriting)' };
      }
      if (month > 12) {
        return { isValid: false, isComplete: false, error: `Noto‘g‘ri oy: ${month}. Bir yilda faqat 12 oy mavjud` };
      }

      const monthName = MONTH_NAMES_UZ[month] || `${month}-oy`;

      // 30-day month checks
      if ([4, 6, 9, 11].includes(month) && day > 30) {
        return {
          isValid: false,
          isComplete: false,
          error: `${monthName} oyida faqat 30 kun bor (${day}-kun mavjud emas)`,
        };
      }

      // February check before year is fully entered
      if (month === 2 && day > 29) {
        return {
          isValid: false,
          isComplete: false,
          error: `Fevral oyida ko‘pi bilan 29 kun bo‘lishi mumkin (${day}-kun mavjud emas)`,
        };
      }
    }
  }

  // 3. Incomplete date check
  if (rawDigits.length < 8) {
    return {
      isValid: false,
      isComplete: false,
      error: isTouched ? `Sanani to‘liq kiriting (KK.OO.YYYY). Hozir: ${value}` : null,
      day: dayStr.length === 2 ? day : undefined,
    };
  }

  // 4. Full date validation with Year (all 8 digits: DDMMYYYY)
  const month = parseInt(rawDigits.slice(2, 4), 10);
  const year = parseInt(rawDigits.slice(4, 8), 10);
  const monthName = MONTH_NAMES_UZ[month] || `${month}-oy`;
  const leap = isLeapYear(year);

  // February leap year validation
  if (month === 2) {
    if (!leap && day === 29) {
      return {
        isValid: false,
        isComplete: true,
        isLeapYear: false,
        error: `${year}-yil kabisa yili emas! Fevral oyida faqat 28 kun bor`,
      };
    }
    if (day > 29) {
      return {
        isValid: false,
        isComplete: true,
        isLeapYear: leap,
        error: `Fevral oyida ko‘pi bilan ${leap ? 29 : 28} kun bor (${year}-yil)`,
      };
    }
  }

  // Standard month limit check
  const maxDays = getDaysInMonth(month, year);
  if (day > maxDays) {
    return {
      isValid: false,
      isComplete: true,
      error: `${monthName} oyida faqat ${maxDays} kun bor (${day}-kun mavjud emas)`,
    };
  }

  // Year range constraints
  if (year < minYear) {
    return {
      isValid: false,
      isComplete: true,
      error: `Tug‘ilgan yil ${minYear}-yildan keyin bo‘lishi kerak (${year})`,
    };
  }

  const today = new Date();
  const currentYear = today.getFullYear();

  if (!allowFuture) {
    if (year > currentYear) {
      return {
        isValid: false,
        isComplete: true,
        error: `Tug‘ilgan sana kelajakda bo‘lishi mumkin emas (${year} > ${currentYear})`,
      };
    }

    if (year === currentYear) {
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      if (month > todayMonth || (month === todayMonth && day > todayDay)) {
        return {
          isValid: false,
          isComplete: true,
          error: 'Tug‘ilgan sana bugungi kundan keyin bo‘lishi mumkin emas',
        };
      }
    }
  } else if (year > maxYear) {
    return {
      isValid: false,
      isComplete: true,
      error: `Yil ko‘pi bilan ${maxYear} bo‘lishi mumkin`,
    };
  }

  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const successMessage = (month === 2 && day === 29)
    ? `${year}-yil kabisa yili (29-fevral tasdiqlandi)`
    : 'To‘g‘ri taqvim sanasi';

  return {
    isValid: true,
    isComplete: true,
    isLeapYear: leap,
    error: null,
    day,
    month,
    year,
    isoDate,
    successMessage,
  };
}
