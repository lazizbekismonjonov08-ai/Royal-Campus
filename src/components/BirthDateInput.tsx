import React, { useState, useEffect, useId } from 'react';
import { AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import {
  formatDateMask,
  normalizeToDisplayDate,
  DateValidationResult,
  getDaysInMonth,
  isLeapYear,
} from '../utils/dateValidation';

export {
  formatDateMask,
  normalizeToDisplayDate,
  isLeapYear,
  getDaysInMonth,
};
export type { DateValidationResult };

/**
 * Checks if a string in 'DD.MM.YYYY' format represents a real, non-future calendar date,
 * including leap year logic for February.
 *
 * @param dateString String formatted as 'DD.MM.YYYY'
 * @returns boolean true if the date is a valid, real, non-future calendar date
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;

  const trimmed = dateString.trim();
  // Must match exactly DD.MM.YYYY
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) return false;

  const parts = trimmed.split('.');
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900) return false;

  // Leap year calculation:
  // Divisible by 4 AND not divisible by 100, OR divisible by 400
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

  // Determine maximum allowable days for this specific month & year
  let maxDays = 31;
  if (month === 2) {
    maxDays = isLeap ? 29 : 28;
  } else if (month === 4 || month === 6 || month === 9 || month === 11) {
    maxDays = 30;
  }

  if (day < 1 || day > maxDays) return false;

  // Non-future date check
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentDay = now.getDate();

  if (year > currentYear) return false;
  if (year === currentYear) {
    if (month > currentMonth) return false;
    if (month === currentMonth && day > currentDay) return false;
  }

  return true;
}

/**
 * Helper to get a descriptive, localized error message when isValidDate fails.
 */
export function getDateValidationError(dateString: string, minYear = 1920): string | null {
  if (!dateString || !dateString.trim()) {
    return 'Tug‘ilgan sana kiritilishi shart (KK.OO.YYYY)';
  }

  const raw = dateString.trim();
  const parts = raw.split('.');

  if (raw.length < 10 || parts.length !== 3 || parts[2].length !== 4) {
    return 'Sanani to‘liq kiriting (KK.OO.YYYY)';
  }

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return 'Noto‘g‘ri sana formati';
  }

  if (day < 1 || day > 31) {
    return `Noto‘g‘ri kun: ${day}. Kun 01 dan 31 gacha bo‘lishi kerak`;
  }

  if (month < 1 || month > 12) {
    return `Noto‘g‘ri oy: ${month}. Bir yilda faqat 12 oy mavjud`;
  }

  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  let maxDays = 31;
  const monthNames = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  if (month === 2) {
    maxDays = isLeap ? 29 : 28;
    if (day === 29 && !isLeap) {
      return `${year}-yil kabisa yili emas! Fevral oyida faqat 28 kun bor`;
    }
    if (day > maxDays) {
      return `Fevral oyida ko‘pi bilan ${maxDays} kun bor (${day}-kun mavjud emas)`;
    }
  } else if ([4, 6, 9, 11].includes(month)) {
    maxDays = 30;
    if (day > maxDays) {
      return `${monthNames[month]} oyida faqat 30 kun bor (${day}-kun mavjud emas)`;
    }
  }

  if (day > maxDays) {
    return `${monthNames[month]} oyida ko‘pi bilan ${maxDays} kun bor`;
  }

  if (year < minYear) {
    return `Yil ${minYear}-yildan keyin bo‘lishi kerak (${year})`;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  if (year > currentYear || (year === currentYear && (month > currentMonth || (month === currentMonth && day > currentDay)))) {
    return 'Tug‘ilgan sana kelajakda bo‘lishi mumkin emas';
  }

  return null;
}

export interface BirthDateInputProps {
  /** Optional controlled or initial value (accepts "DD.MM.YYYY" or ISO "YYYY-MM-DD") */
  value?: string;
  /** Callback fired whenever the user inputs or updates the date */
  onChange?: (formattedValue: string, isoDate: string, isValid: boolean) => void;
  /** Callback fired when the input loses focus */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>, isValid: boolean) => void;
  /** Custom label text (defaults to "Tug‘ilgan sana") */
  label?: string;
  /** External error override from parent form (optional) */
  error?: string;
  /** Placeholder text (defaults to "31.12.2005") */
  placeholder?: string;
  /** Whether the field is mandatory */
  required?: boolean;
  /** Disable the input field */
  disabled?: boolean;
  /** Additional custom class names for the container */
  className?: string;
  /** Input element id */
  id?: string;
  /** Input element name */
  name?: string;
  /** Minimum allowable year (defaults to 1920) */
  minYear?: number;
  /** Maximum allowable year (defaults to current year) */
  maxYear?: number;
  /** Whether future dates are permitted (defaults to false for birth dates) */
  allowFuture?: boolean;
  /** Whether to show small status icons (green check / red alert) */
  showStatusIcon?: boolean;
  /** Theme surface ('light' | 'dark') */
  theme?: 'light' | 'dark';
  /** Localized date format hint string */
  formatHint?: string;
}

export const BirthDateInput: React.FC<BirthDateInputProps> = ({
  value,
  onChange,
  onBlur,
  label = 'Tug‘ilgan sana',
  error: externalError,
  placeholder = '31.12.2005',
  required = false,
  disabled = false,
  className = '',
  id: customId,
  name = 'birthDate',
  minYear = 1920,
  showStatusIcon = true,
  theme = 'light',
  formatHint = 'Format: KK.OO.YYYY',
}) => {
  const isDarkTheme = theme === 'dark';
  const generatedId = useId();
  const inputId = customId || generatedId;

  // Internal state when component is used uncontrolled or for immediate typing
  const [internalDate, setInternalDate] = useState<string>(() => {
    return value ? normalizeToDisplayDate(value) : '';
  });
  const [isTouched, setIsTouched] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Synchronize internal state if controlled value prop changes from outside
  useEffect(() => {
    if (value !== undefined) {
      const normalized = normalizeToDisplayDate(value);
      if (normalized !== internalDate) {
        setInternalDate(normalized);
        if (normalized.length === 10) {
          const valid = isValidDate(normalized);
          setInternalError(valid ? null : (getDateValidationError(normalized, minYear) || 'Noto‘g‘ri sana'));
        } else if (isTouched && normalized.length > 0) {
          setInternalError(getDateValidationError(normalized, minYear));
        } else {
          setInternalError(null);
        }
      }
    }
  }, [value, minYear, isTouched, internalDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateMask(e.target.value);
    setInternalDate(formatted);

    let err: string | null = null;
    let valid = false;

    // Real-time calendar validation
    if (formatted.length === 10) {
      valid = isValidDate(formatted);
      if (!valid) {
        err = getDateValidationError(formatted, minYear) || 'Noto‘g‘ri taqvim sanasi kiritildi';
      }
    } else if (formatted.length >= 2) {
      // Check for immediately impossible days or months while typing
      const rawDigits = formatted.replace(/\D/g, '');
      const day = parseInt(rawDigits.slice(0, 2), 10);
      if (day === 0 || day > 31) {
        err = `Noto‘g‘ri kun: ${day}. Kun 01 dan 31 gacha bo‘lishi kerak`;
      } else if (rawDigits.length >= 4) {
        const month = parseInt(rawDigits.slice(2, 4), 10);
        if (month === 0 || month > 12) {
          err = `Noto‘g‘ri oy: ${month}. Bir yilda faqat 12 oy mavjud`;
        } else if ([4, 6, 9, 11].includes(month) && day > 30) {
          err = `Tanlangan oyda faqat 30 kun bor (${day}-kun mavjud emas)`;
        } else if (month === 2 && day > 29) {
          err = `Fevral oyida ko‘pi bilan 29 kun bo‘lishi mumkin`;
        }
      }
    }

    setInternalError(err);

    // Prepare ISO string if complete & valid
    let isoDate = '';
    if (valid && formatted.length === 10) {
      const [d, m, y] = formatted.split('.');
      isoDate = `${y}-${m}-${d}`;
    }

    if (onChange) {
      onChange(formatted, isoDate, valid);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsTouched(true);
    let err: string | null = null;
    const valid = isValidDate(internalDate);

    if (!valid) {
      err = getDateValidationError(internalDate, minYear) || 'Noto‘g‘ri taqvim sanasi kiritildi';
    }

    setInternalError(err);

    if (onBlur) {
      onBlur(e, valid);
    }
  };

  // Determine active error: external form error takes precedence, then internal real-time validation error
  const displayError = externalError || internalError;
  const isCompleteAndValid = internalDate.length === 10 && isValidDate(internalDate) && !displayError;
  const hasError = Boolean(displayError);

  // Success message (including special leap year acknowledgement)
  const isLeapDay = internalDate.startsWith('29.02.');
  const successMessage = isLeapDay
    ? `${internalDate.slice(6)}-yil kabisa yili (29-fevral tasdiqlandi)`
    : 'To‘g‘ri taqvim sanasi';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={inputId}
            className={`text-xs font-semibold flex items-center gap-1 ${
              isDarkTheme ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
          </label>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {formatHint}
          </span>
        </div>
      )}

      <div className="relative">
        <input
          id={inputId}
          name={name}
          type="text"
          value={internalDate}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={10} // 2 kun + 1 nuqta + 2 oy + 1 nuqta + 4 yil = 10 belgi
          disabled={disabled}
          required={required}
          autoComplete="bday"
          inputMode="numeric"
          className={`w-full border rounded-xl px-3 py-2.5 pr-10 text-xs tracking-wider font-mono transition-all focus:outline-none focus:ring-2 ${
            hasError
              ? isDarkTheme
                ? 'border-rose-500/70 bg-rose-950/30 text-rose-100 focus:ring-rose-500/30 focus:border-rose-500'
                : 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-rose-200 focus:border-rose-500'
              : isCompleteAndValid
              ? isDarkTheme
                ? 'border-emerald-500/70 bg-emerald-950/25 text-slate-100 focus:ring-emerald-500/30 focus:border-emerald-500'
                : 'border-emerald-400 bg-emerald-50/30 text-slate-900 focus:ring-emerald-200 focus:border-emerald-500'
              : isDarkTheme
              ? 'bg-[#0E1729] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-[#C6A15B] focus:border-[#C6A15B] focus:bg-[#132038]'
              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-[#C6A15B] focus:border-[#C6A15B] focus:bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        {/* Status indicator icon */}
        {showStatusIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            {hasError ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : isCompleteAndValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <span className="text-[10px] font-mono text-slate-400">
                {internalDate.length}/10
              </span>
            )}
          </div>
        )}
      </div>

      {/* Small red error message below the input if validation fails */}
      {hasError && (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 mt-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </p>
      )}

      {/* Success feedback when valid */}
      {!hasError && isCompleteAndValid && (
        <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMessage}</span>
        </p>
      )}
    </div>
  );
};

export default BirthDateInput;
