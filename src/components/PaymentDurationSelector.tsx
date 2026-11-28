import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { DURATION_MONTH_OPTIONS } from '../utils/billingUtils';

interface PaymentDurationSelectorProps {
  months: number;
  monthlyRate: number;
  onChange: (nextMonths: number) => void;
  accent?: 'navy' | 'emerald';
  className?: string;
}

export const PaymentDurationSelector: React.FC<PaymentDurationSelectorProps> = ({
  months,
  monthlyRate,
  onChange,
  accent = 'navy',
  className = '',
}) => {
  const { t, formatCurrency } = useI18n();
  const safeMonths = Math.max(1, Math.min(36, Math.round(Number(months) || 1)));
  const expectedTotal = monthlyRate * safeMonths;
  const isCustomValue = !(DURATION_MONTH_OPTIONS as readonly number[]).includes(safeMonths);

  const [customText, setCustomText] = useState<string>(String(safeMonths));

  useEffect(() => {
    setCustomText(String(safeMonths));
  }, [safeMonths]);

  const activePillClass =
    accent === 'emerald'
      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
      : 'bg-[#101C32] text-[#C6A15B] border-[#C6A15B] shadow-xs';

  return (
    <div
      className={`px-3 py-2 rounded-xl bg-white border border-slate-200 space-y-1.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-slate-700">
          {t('payments.durationLabel')}
        </span>
        <span className="text-[11px] font-extrabold text-[#101C32] tabular-nums">
          {t('payments.durationExpectedTotal', {
            months: safeMonths,
            rate: formatCurrency(monthlyRate),
            total: formatCurrency(expectedTotal),
          })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {DURATION_MONTH_OPTIONS.map((opt) => {
          const active = safeMonths === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                active
                  ? activePillClass
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t('payments.durationOption', { n: opt })}
            </button>
          );
        })}

        {/* Compact custom months numeric input */}
        <div
          className={`inline-flex items-center rounded-lg border px-2 py-0.5 transition-colors ${
            isCustomValue
              ? accent === 'emerald'
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-[#C6A15B] bg-[#F7F5F0]'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            aria-label={t('payments.customMonthsAria')}
            value={customText}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
              setCustomText(digits);
              if (digits !== '') {
                const num = Math.max(1, Math.min(36, Number(digits)));
                if (Number.isFinite(num) && num >= 1) {
                  onChange(num);
                }
              }
            }}
            onBlur={() => {
              if (customText === '' || Number(customText) < 1) {
                setCustomText(String(safeMonths));
              } else {
                const clamped = Math.max(1, Math.min(36, Number(customText)));
                setCustomText(String(clamped));
                if (clamped !== safeMonths) onChange(clamped);
              }
            }}
            className="w-7 bg-transparent text-center text-[11px] font-extrabold text-slate-900 tabular-nums focus:outline-none"
          />
          <span className="text-[10px] font-semibold text-slate-500 select-none">
            {t('payments.monthsUnit')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentDurationSelector;
