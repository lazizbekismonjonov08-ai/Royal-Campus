import { Language } from '../i18n/types';

/**
 * Date validation and masking utilities for DD.MM.YYYY format.
 * Includes precise Gregorian calendar rules, leap year computation,
 * month-day limit checking, and real-time localized error messaging.
 */

export const MONTH_NAMES_BY_LANG: Record<Language, Record<number, string>> = {
  uz: {
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
  },
  ru: {
    1: 'Январь',
    2: 'Февраль',
    3: 'Март',
    4: 'Апрель',
    5: 'Май',
    6: 'Июнь',
    7: 'Июль',
    8: 'Август',
    9: 'Сентябрь',
    10: 'Октябрь',
    11: 'Ноябрь',
    12: 'Декабрь',
  },
  en: {
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December',
  },
};

export const MONTH_NAMES_UZ = MONTH_NAMES_BY_LANG.uz;

/**
 * Checks if a given year is a leap year (kabisa yili).
 */
export function isLeapYear(year: number): boolean {
  if (isNaN(year) || year <= 0) return false;
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
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
    return 29;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

/**
 * Strips non-digits and automatically formats input as DD.MM.YYYY mask.
 */
export function formatDateMask(value: string): string {
  if (!value) return '';
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
 * Converts "YYYY-MM-DD" (ISO) or "DD.MM.YYYY" to "DD.MM.YYYY".
 */
export function normalizeToDisplayDate(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}.${m}.${y}`;
  }
  return formatDateMask(trimmed);
}

/**
 * Converts "DD.MM.YYYY" to "YYYY-MM-DD" (ISO).
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
 * Validates a date string in real-time according to Gregorian calendar rules across UZ, RU, and EN.
 */
export function validateCalendarDate(
  value: string,
  options: {
    minYear?: number;
    maxYear?: number;
    allowFuture?: boolean;
    isTouched?: boolean;
    language?: Language;
  } = {}
): DateValidationResult {
  const {
    minYear = 1920,
    maxYear = new Date().getFullYear(),
    allowFuture = false,
    isTouched = false,
    language = 'uz',
  } = options;

  const msg = {
    required:
      language === 'ru'
        ? 'Дата рождения обязательна (ДД.ММ.ГГГГ)'
        : language === 'en'
        ? 'Date of birth is required (DD.MM.YYYY)'
        : 'Tug‘ilgan sana kiritilishi shart (KK.OO.YYYY)',
    dayZero:
      language === 'ru'
        ? 'День не может быть 00 (введите от 01 до 31)'
        : language === 'en'
        ? 'Day cannot be 00 (enter between 01 and 31)'
        : 'Kun 00 bo‘lishi mumkin emas (01-31 oralig‘ida kiriting)',
    dayOver31: (d: number) =>
      language === 'ru'
        ? `Неверный день: ${d}. В месяце не более 31 дня`
        : language === 'en'
        ? `Invalid day: ${d}. A month has at most 31 days`
        : `Noto‘g‘ri kun: ${d}. Oyda ko‘pi bilan 31 kun bo‘lishi mumkin`,
    monthZero:
      language === 'ru'
        ? 'Месяц не может быть 00 (введите от 01 до 12)'
        : language === 'en'
        ? 'Month cannot be 00 (enter between 01 and 12)'
        : 'Oy 00 bo‘lishi mumkin emas (01-12 oralig‘ida kiriting)',
    monthOver12: (m: number) =>
      language === 'ru'
        ? `Неверный месяц: ${m}. В году только 12 месяцев`
        : language === 'en'
        ? `Invalid month: ${m}. A year only has 12 months`
        : `Noto‘g‘ri oy: ${m}. Bir yilda faqat 12 oy mavjud`,
    month30: (name: string, d: number) =>
      language === 'ru'
        ? `В месяце ${name} только 30 дней (дня ${d} не существует)`
        : language === 'en'
        ? `${name} only has 30 days (day ${d} does not exist)`
        : `${name} oyida faqat 30 kun bor (${d}-kun mavjud emas)`,
    febOver29: (d: number) =>
      language === 'ru'
        ? `В феврале не более 29 дней (дня ${d} не существует)`
        : language === 'en'
        ? `February has at most 29 days (day ${d} does not exist)`
        : `Fevral oyida ko‘pi bilan 29 kun bo‘lishi mumkin (${d}-kun mavjud emas)`,
    incomplete: (v: string) =>
      language === 'ru'
        ? `Введите дату полностью (ДД.ММ.ГГГГ). Сейчас: ${v}`
        : language === 'en'
        ? `Enter full date (DD.MM.YYYY). Current: ${v}`
        : `Sanani to‘liq kiriting (KK.OO.YYYY). Hozir: ${v}`,
    nonLeapFeb: (y: number) =>
      language === 'ru'
        ? `${y} год не является високосным! В феврале только 28 дней`
        : language === 'en'
        ? `${y} is not a leap year! February only has 28 days`
        : `${y}-yil kabisa yili emas! Fevral oyida faqat 28 kun bor`,
    febMax: (y: number, maxD: number) =>
      language === 'ru'
        ? `В феврале ${y} г. не более ${maxD} дней`
        : language === 'en'
        ? `February ${y} has at most ${maxD} days`
        : `Fevral oyida ko‘pi bilan ${maxD} kun bor (${y}-yil)`,
    monthMax: (name: string, maxD: number, d: number) =>
      language === 'ru'
        ? `В месяце ${name} только ${maxD} дней (дня ${d} не существует)`
        : language === 'en'
        ? `${name} has only ${maxD} days (day ${d} does not exist)`
        : `${name} oyida faqat ${maxD} kun bor (${d}-kun mavjud emas)`,
    yearMin: (y: number) =>
      language === 'ru'
        ? `Год рождения должен быть после ${minYear} (${y})`
        : language === 'en'
        ? `Birth year must be after ${minYear} (${y})`
        : `Tug‘ilgan yil ${minYear}-yildan keyin bo‘lishi kerak (${y})`,
    futureYear: (y: number, cy: number) =>
      language === 'ru'
        ? `Дата рождения не может быть в будущем (${y} > ${cy})`
        : language === 'en'
        ? `Date of birth cannot be in the future (${y} > ${cy})`
        : `Tug‘ilgan sana kelajakda bo‘lishi mumkin emas (${y} > ${cy})`,
    futureToday:
      language === 'ru'
        ? 'Дата рождения не может быть позже сегодняшнего дня'
        : language === 'en'
        ? 'Date of birth cannot be later than today'
        : 'Tug‘ilgan sana bugungi kundan keyin bo‘lishi mumkin emas',
    yearMax: (my: number) =>
      language === 'ru'
        ? `Год не может быть больше ${my}`
        : language === 'en'
        ? `Year cannot exceed ${my}`
        : `Yil ko‘pi bilan ${my} bo‘lishi mumkin`,
    leapOk: (y: number) =>
      language === 'ru'
        ? `${y} г. — високосный год (29 февраля подтверждено)`
        : language === 'en'
        ? `${y} is a leap year (February 29 confirmed)`
        : `${y}-yil kabisa yili (29-fevral tasdiqlandi)`,
    validOk:
      language === 'ru'
        ? 'Корректная календарная дата'
        : language === 'en'
        ? 'Valid calendar date'
        : 'To‘g‘ri taqvim sanasi',
  };

  if (!value || !value.trim()) {
    return {
      isValid: false,
      isComplete: false,
      error: isTouched ? msg.required : null,
    };
  }

  const rawDigits = value.replace(/\D/g, '');
  if (rawDigits.length === 0) {
    return { isValid: false, isComplete: false, error: null };
  }

  const monthMap = MONTH_NAMES_BY_LANG[language] || MONTH_NAMES_BY_LANG.uz;

  // 1. Day validation
  const dayStr = rawDigits.slice(0, 2);
  const day = parseInt(dayStr, 10);

  if (dayStr.length === 2) {
    if (day === 0) {
      return { isValid: false, isComplete: false, error: msg.dayZero };
    }
    if (day > 31) {
      return { isValid: false, isComplete: false, error: msg.dayOver31(day) };
    }
  }

  // 2. Month validation
  if (rawDigits.length >= 3) {
    const monthStr = rawDigits.slice(2, 4);
    if (monthStr.length === 2) {
      const month = parseInt(monthStr, 10);
      if (month === 0) {
        return { isValid: false, isComplete: false, error: msg.monthZero };
      }
      if (month > 12) {
        return { isValid: false, isComplete: false, error: msg.monthOver12(month) };
      }

      const monthName = monthMap[month] || `${month}`;

      if ([4, 6, 9, 11].includes(month) && day > 30) {
        return {
          isValid: false,
          isComplete: false,
          error: msg.month30(monthName, day),
        };
      }

      if (month === 2 && day > 29) {
        return {
          isValid: false,
          isComplete: false,
          error: msg.febOver29(day),
        };
      }
    }
  }

  // 3. Incomplete check
  if (rawDigits.length < 8) {
    return {
      isValid: false,
      isComplete: false,
      error: isTouched ? msg.incomplete(value) : null,
      day: dayStr.length === 2 ? day : undefined,
    };
  }

  // 4. Full date validation
  const month = parseInt(rawDigits.slice(2, 4), 10);
  const year = parseInt(rawDigits.slice(4, 8), 10);
  const monthName = monthMap[month] || `${month}`;
  const leap = isLeapYear(year);

  if (month === 2) {
    if (!leap && day === 29) {
      return {
        isValid: false,
        isComplete: true,
        isLeapYear: false,
        error: msg.nonLeapFeb(year),
      };
    }
    if (day > 29) {
      return {
        isValid: false,
        isComplete: true,
        isLeapYear: leap,
        error: msg.febMax(year, leap ? 29 : 28),
      };
    }
  }

  const maxDays = getDaysInMonth(month, year);
  if (day > maxDays) {
    return {
      isValid: false,
      isComplete: true,
      error: msg.monthMax(monthName, maxDays, day),
    };
  }

  if (year < minYear) {
    return {
      isValid: false,
      isComplete: true,
      error: msg.yearMin(year),
    };
  }

  const today = new Date();
  const currentYear = today.getFullYear();

  if (!allowFuture) {
    if (year > currentYear) {
      return {
        isValid: false,
        isComplete: true,
        error: msg.futureYear(year, currentYear),
      };
    }

    if (year === currentYear) {
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      if (month > todayMonth || (month === todayMonth && day > todayDay)) {
        return {
          isValid: false,
          isComplete: true,
          error: msg.futureToday,
        };
      }
    }
  } else if (year > maxYear) {
    return {
      isValid: false,
      isComplete: true,
      error: msg.yearMax(maxYear),
    };
  }

  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const successMessage = month === 2 && day === 29 ? msg.leapOk(year) : msg.validOk;

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
