import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  extractDatePart,
  extractTimePart,
  getCurrentLocalTimeStr,
} from '../utils/billingUtils';

interface DatePickerDDMMYYYYProps {
  /** 'date' emits YYYY-MM-DD; 'datetime' emits YYYY-MM-DDTHH:mm */
  mode?: 'date' | 'datetime';
  value: string;
  onChange: (nextIsoValue: string) => void;
  compact?: boolean;
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

function isoDateToDmy(iso?: string): string {
  const datePart = extractDatePart(iso);
  const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function formatDmyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function parseValidDmyToIso(dmy: string): string | null {
  const m = dmy.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function parseValidTime(hhmm: string): string | null {
  const m = hhmm.trim().match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${pad2(hh)}:${pad2(mm)}`;
}

export const DatePickerDDMMYYYY: React.FC<DatePickerDDMMYYYYProps> = ({
  mode = 'date',
  value,
  onChange,
  compact = false,
  allowEmpty = false,
  disabled = false,
  className = '',
}) => {
  const { t } = useI18n();

  const [dateText, setDateText] = useState<string>(() => isoDateToDmy(value));
  const [timeText, setTimeText] = useState<string>(() =>
    extractTimePart(value) || (value ? getCurrentLocalTimeStr() : '')
  );

  // Sync local inputs whenever external `value` changes (e.g., auto-calculated expiration date)
  useEffect(() => {
    const incomingDmy = isoDateToDmy(value);
    setDateText((prev) => {
      if (!value && allowEmpty) return '';
      if (!incomingDmy) return prev;
      return incomingDmy;
    });

    if (mode === 'datetime') {
      const incomingTime = extractTimePart(value);
      setTimeText((prev) => {
        if (!value && allowEmpty) return '';
        if (incomingTime) return incomingTime;
        return prev;
      });
    }
  }, [value, mode, allowEmpty]);

  const dateInvalid =
    dateText.length > 0 && dateText.length === 10 && parseValidDmyToIso(dateText) === null;
  const timeInvalid =
    mode === 'datetime' &&
    timeText.length > 0 &&
    timeText.length === 5 &&
    parseValidTime(timeText) === null;

  const handleDateChange = (raw: string) => {
    const formatted = formatDmyInput(raw);
    setDateText(formatted);

    if (formatted === '') {
      if (allowEmpty) {
        onChange('');
      }
      return;
    }

    const parsedIso = parseValidDmyToIso(formatted);
    if (parsedIso) {
      if (mode === 'datetime') {
        const validTime =
          parseValidTime(timeText) || extractTimePart(value) || getCurrentLocalTimeStr();
        if (!timeText) setTimeText(validTime);
        onChange(`${parsedIso}T${validTime}`);
      } else {
        onChange(parsedIso);
      }
    }
  };

  const handleDateBlur = () => {
    if (dateText === '' && allowEmpty) {
      if (value) onChange('');
      return;
    }
    const parsedIso = parseValidDmyToIso(dateText);
    if (!parsedIso) {
      // Restore last valid external value so the field never stays stuck in a broken state
      const fallback = isoDateToDmy(value);
      if (fallback) {
        setDateText(fallback);
      }
    }
  };

  const handleTimeChange = (raw: string) => {
    const formatted = formatTimeInput(raw);
    setTimeText(formatted);

    const validTime = parseValidTime(formatted);
    if (validTime) {
      const validIsoDate = parseValidDmyToIso(dateText) || extractDatePart(value);
      if (validIsoDate) {
        onChange(`${validIsoDate}T${validTime}`);
      }
    }
  };

  const handleTimeBlur = () => {
    if (timeText === '' && allowEmpty && !dateText) {
      return;
    }
    const validTime = parseValidTime(timeText);
    if (!validTime) {
      const fallbackTime = extractTimePart(value) || getCurrentLocalTimeStr();
      setTimeText(fallbackTime);
    }
  };

  const dateInputClass = compact
    ? `w-[106px] pl-6 pr-2 py-1 border rounded-lg text-xs font-semibold text-slate-900 bg-white tabular-nums focus:outline-none focus:ring-2 ${
        dateInvalid
          ? 'border-rose-400 focus:ring-rose-500/20'
          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
      } disabled:bg-slate-50 disabled:text-slate-400`
    : `w-[132px] pl-7 pr-2.5 py-1.5 border rounded-lg text-xs font-bold text-slate-900 bg-white tabular-nums focus:outline-none focus:ring-2 ${
        dateInvalid
          ? 'border-rose-400 focus:ring-rose-500/20'
          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
      } disabled:bg-slate-50 disabled:text-slate-400`;

  const timeInputClass = compact
    ? `w-[72px] pl-6 pr-1.5 py-1 border rounded-lg text-xs font-semibold text-slate-900 bg-white tabular-nums focus:outline-none focus:ring-2 ${
        timeInvalid
          ? 'border-rose-400 focus:ring-rose-500/20'
          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
      } disabled:bg-slate-50 disabled:text-slate-400`
    : `w-[84px] pl-7 pr-2 py-1.5 border rounded-lg text-xs font-bold text-slate-900 bg-white tabular-nums focus:outline-none focus:ring-2 ${
        timeInvalid
          ? 'border-rose-400 focus:ring-rose-500/20'
          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
      } disabled:bg-slate-50 disabled:text-slate-400`;

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <div className="relative inline-flex items-center">
        <Calendar
          className={`pointer-events-none absolute text-slate-400 ${
            compact ? 'left-1.5 w-3 h-3' : 'left-2 w-3.5 h-3.5'
          }`}
        />
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder="DD.MM.YYYY"
          aria-label={`${t('date.day')}.${t('date.month')}.${t('date.year')}`}
          value={dateText}
          onChange={(e) => handleDateChange(e.target.value)}
          onBlur={handleDateBlur}
          disabled={disabled}
          className={dateInputClass}
        />
      </div>

      {mode === 'datetime' && (
        <div className="relative inline-flex items-center">
          <Clock
            className={`pointer-events-none absolute text-slate-400 ${
              compact ? 'left-1.5 w-3 h-3' : 'left-2 w-3.5 h-3.5'
            }`}
          />
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={5}
            placeholder="HH:MM"
            aria-label={`${t('date.hour')}:${t('date.minute')}`}
            value={timeText}
            onChange={(e) => handleTimeChange(e.target.value)}
            onBlur={handleTimeBlur}
            disabled={disabled}
            className={timeInputClass}
          />
        </div>
      )}
    </div>
  );
};

export default DatePickerDDMMYYYY;
