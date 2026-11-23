import React, { useState, useEffect, useId } from 'react';
import { AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { Language } from '../i18n/types';
import {
  formatDateMask,
  normalizeToDisplayDate,
  validateCalendarDate,
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
 * Checks if a string in 'DD.MM.YYYY' format represents a real, non-future calendar date.
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  return validateCalendarDate(dateString, { isTouched: true }).isValid;
}

/**
 * Helper to get a descriptive, localized error message when isValidDate fails.
 */
export function getDateValidationError(
  dateString: string,
  minYear = 1920,
  language: Language = 'uz'
): string | null {
  return validateCalendarDate(dateString, { minYear, isTouched: true, language }).error;
}

export interface BirthDateInputProps {
  value?: string;
  onChange?: (formattedValue: string, isoDate: string, isValid: boolean) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>, isValid: boolean) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  minYear?: number;
  maxYear?: number;
  allowFuture?: boolean;
  showStatusIcon?: boolean;
  theme?: 'light' | 'dark';
  formatHint?: string;
  language?: Language;
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
  language = 'uz',
}) => {
  const isDarkTheme = theme === 'dark';
  const generatedId = useId();
  const inputId = customId || generatedId;

  const [internalDate, setInternalDate] = useState<string>(() => {
    return value ? normalizeToDisplayDate(value) : '';
  });
  const [isTouched, setIsTouched] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  useEffect(() => {
    if (value !== undefined) {
      const normalized = normalizeToDisplayDate(value);
      if (normalized !== internalDate) {
        setInternalDate(normalized);
        if (normalized.length === 10) {
          const res = validateCalendarDate(normalized, { minYear, isTouched: true, language });
          setInternalError(res.isValid ? null : res.error);
        } else if (isTouched && normalized.length > 0) {
          setInternalError(validateCalendarDate(normalized, { minYear, isTouched: true, language }).error);
        } else {
          setInternalError(null);
        }
      }
    }
  }, [value, minYear, isTouched, internalDate, language]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateMask(e.target.value);
    setInternalDate(formatted);

    const validation = validateCalendarDate(formatted, {
      minYear,
      isTouched: formatted.length === 10,
      language,
    });
    setInternalError(validation.error);

    if (onChange) {
      onChange(formatted, validation.isoDate || '', validation.isValid);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsTouched(true);
    const validation = validateCalendarDate(internalDate, {
      minYear,
      isTouched: true,
      language,
    });
    setInternalError(validation.error);

    if (onBlur) {
      onBlur(e, validation.isValid);
    }
  };

  const displayError = externalError || internalError;
  const fullValidation =
    internalDate.length === 10
      ? validateCalendarDate(internalDate, { minYear, isTouched: true, language })
      : null;
  const isCompleteAndValid = Boolean(fullValidation?.isValid && !displayError);
  const hasError = Boolean(displayError);
  const successMessage = fullValidation?.successMessage || '';

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
          maxLength={10}
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

      {hasError && (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 mt-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </p>
      )}

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
