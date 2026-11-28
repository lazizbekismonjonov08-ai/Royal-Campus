import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, CalendarX } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  computePaymentExpiryInfo,
  formatShortDateDisplay,
} from '../utils/billingUtils';

interface PaymentExpiryBadgeProps {
  paidUntilDate?: string;
  showDate?: boolean;
  size?: 'sm' | 'md';
  compact?: boolean;
  className?: string;
}

export const PaymentExpiryBadge: React.FC<PaymentExpiryBadgeProps> = ({
  paidUntilDate,
  showDate = false,
  size = 'sm',
  compact = false,
  className = '',
}) => {
  const { t } = useI18n();
  const info = computePaymentExpiryInfo(paidUntilDate);

  const sizeClasses = compact
    ? 'px-2 py-0.5 text-[10px] gap-1'
    : size === 'md'
    ? 'px-3 py-1 text-xs gap-1.5'
    : 'px-2 py-0.5 text-[11px] gap-1';
  const iconClass = compact ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  let badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
  let label = t('payments.expiry.none');
  let Icon = CalendarX;

  if (info.status === 'active' && info.daysRemaining !== null) {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = t('payments.expiry.active', { days: info.daysRemaining });
    Icon = CheckCircle2;
  } else if (info.status === 'expiring_soon' && info.daysRemaining !== null) {
    if (info.daysRemaining === 0) {
      badgeStyle = 'bg-amber-100 text-amber-900 border-amber-400';
      label = t('payments.expiry.today');
    } else {
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
      label = t('payments.expiry.expiringSoon', { days: info.daysRemaining });
    }
    Icon = Clock;
  } else if (info.status === 'overdue' && info.daysRemaining !== null) {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    label = t('payments.expiry.overdue', { days: Math.abs(info.daysRemaining) });
    Icon = AlertTriangle;
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border font-semibold whitespace-nowrap ${sizeClasses} ${badgeStyle} ${className}`}
    >
      <Icon className={`${iconClass} shrink-0`} />
      <span>{label}</span>
      {showDate && info.paidUntilDate && (
        <span className="opacity-75 font-mono text-[10px]">
          ({formatShortDateDisplay(info.paidUntilDate)})
        </span>
      )}
    </span>
  );
};
