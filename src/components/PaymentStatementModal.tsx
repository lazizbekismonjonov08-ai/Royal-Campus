import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Receipt, Calendar, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  ACADEMIC_BILLING_MONTHS,
  StudentBillingSummary,
  comparePaymentsChronoDesc,
  formatDateTimeCommaDisplay,
  formatFloorRoomBedDisplay,
  formatMethodLabel,
  formatShortDateDisplay,
  isMonthlyPaymentRecord,
} from '../utils/billingUtils';
import { Payment } from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { PaymentExpiryBadge } from './PaymentExpiryBadge';

export interface PaymentStatementSubject {
  fullName: string;
  phone: string;
  passportNumber: string;
  referenceNumber?: string;
  roomLabel: string;
  floor?: number | string;
  roomTypeLabel?: string;
  capacity?: number;
}

interface PaymentStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: PaymentStatementSubject;
  summary: StudentBillingSummary;
  transactions?: Payment[];
}

export const PaymentStatementModal: React.FC<PaymentStatementModalProps> = ({
  isOpen,
  onClose,
  subject,
  summary,
  transactions = [],
}) => {
  const { t, language, formatCurrency, formatDate } = useI18n();

  useModalDismiss({
    onClose,
    closeOnEscape: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('printing-contract');
    return () => {
      document.body.classList.remove('printing-contract');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-contract');
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const statementRef = `RC-PAY-${(subject.referenceNumber || summary.entityId).slice(-8).toUpperCase()}`;

  const getMonthLabel = (m: StudentBillingSummary['months'][number]) => {
    if (language === 'ru') return m.labelRu;
    if (language === 'en') return m.labelEn;
    return m.labelUz;
  };

  const formatPeriodDisplay = (period: string) => {
    const found = ACADEMIC_BILLING_MONTHS.find((m) => m.period === period);
    if (!found) return period;
    if (language === 'ru') return found.ru;
    if (language === 'en') return found.en;
    return found.uz;
  };

  const sortedTransactions = [...transactions]
    .filter((tx) => isMonthlyPaymentRecord(tx))
    .sort(comparePaymentsChronoDesc);

  return createPortal(
    <div
      className="contract-print-root fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/70 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-statement-modal-title"
    >
      <div
        className="contract-print-modal-card w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (Hidden in Print) */}
        <div className="contract-print-hide flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#101C32] text-[#C6A15B] flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="payment-statement-modal-title" className="text-sm font-extrabold text-slate-900 truncate">
                {t('billing.statementTitle')}
              </h2>
              <p className="text-[11px] text-slate-500 truncate">{statementRef}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#EAD096] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#C6A15B]" />
              <span>{t('billing.printStatement')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="contract-print-scroll flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 bg-white text-xs text-slate-900">
          {/* Official Header */}
          <div className="border-b-2 border-[#101C32] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-block px-2.5 py-0.5 mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] bg-[#101C32] text-[#C6A15B] rounded">
                ROYAL CAMPUS • STUDENT RESIDENCE
              </div>
              <h1 className="text-lg font-extrabold text-[#101C32] uppercase tracking-tight">
                {t('billing.statementTitle')}
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('billing.statementSubtitle')}
              </p>
            </div>
            <div className="text-left sm:text-right text-[11px] space-y-0.5 tabular-nums">
              <p>
                <span className="text-slate-500">{t('billing.statementRef')}:</span>{' '}
                <strong className="font-mono text-slate-900">{statementRef}</strong>
              </p>
              <p>
                <span className="text-slate-500">{t('common.date')}:</span>{' '}
                <strong>{formatDate(todayStr)}</strong>
              </p>
            </div>
          </div>

          {/* Resident & Room Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 print:bg-white">
            <div className="space-y-1">
              <p>
                <span className="text-slate-500">{t('students.fullName')}:</span>{' '}
                <strong className="text-slate-900">{subject.fullName}</strong>
              </p>
              <p>
                <span className="text-slate-500">{t('students.phone')}:</span>{' '}
                <strong className="text-slate-900">{subject.phone || '—'}</strong>
              </p>
              <p>
                <span className="text-slate-500">{t('students.passport')}:</span>{' '}
                <strong className="text-slate-900">{subject.passportNumber || '—'}</strong>
              </p>
            </div>
            <div className="space-y-1">
              <p>
                <span className="text-slate-500">{t('studentContract.assignedRoom')}:</span>{' '}
                <strong className="text-slate-900">
                  {subject.floor ? `${subject.floor}-${t('common.floor')}, ` : ''}
                  {subject.roomLabel}
                </strong>
              </p>
              <p>
                <span className="text-slate-500">{t('students.tariff')}:</span>{' '}
                <strong className="text-slate-900">
                  {subject.roomTypeLabel ? `${subject.roomTypeLabel} • ` : ''}
                  {formatCurrency(summary.monthlyRate)}
                </strong>
              </p>
              {subject.referenceNumber && (
                <p>
                  <span className="text-slate-500">{t('contracts.number')}:</span>{' '}
                  <strong className="font-mono text-slate-900">{subject.referenceNumber}</strong>
                </p>
              )}
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {t('billing.monthlyRate')}
              </span>
              <span className="text-base font-extrabold text-slate-900 tabular-nums mt-1 block">
                {formatCurrency(summary.monthlyRate)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-[#C6A15B]/40 bg-amber-50/40 print:bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" />
                {t('payments.paidUntilLabel')}
              </span>
              <span className="text-base font-extrabold text-[#101C32] tabular-nums mt-1 block">
                {formatShortDateDisplay(summary.paidUntilDate)}
              </span>
              <div className="mt-1">
                <PaymentExpiryBadge paidUntilDate={summary.paidUntilDate} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 print:bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                {t('billing.totalPaid')}
              </span>
              <span className="text-base font-extrabold text-emerald-700 tabular-nums mt-1 block">
                {formatCurrency(summary.totalPaid)}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border print:bg-white ${
                summary.remainingBalance > 0
                  ? 'border-rose-200 bg-rose-50/40'
                  : 'border-emerald-200 bg-emerald-50/40'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  summary.remainingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {t('billing.remainingBalance')}
              </span>
              <span
                className={`text-base font-extrabold tabular-nums mt-1 block ${
                  summary.remainingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(summary.remainingBalance)}
              </span>
            </div>
          </div>

          {/* 12-Month Ledger Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-200">{t('billing.itemLabel')}</th>
                  <th className="p-2.5 border-r border-slate-200 text-right">{t('student.scheduleRate')}</th>
                  <th className="p-2.5 border-r border-slate-200 text-right">{t('billing.amountPaid')}</th>
                  <th className="p-2.5 border-r border-slate-200 text-right">{t('billing.balanceDue')}</th>
                  <th className="p-2.5 border-r border-slate-200">{t('payments.method')}</th>
                  <th className="p-2.5 border-r border-slate-200">{t('payments.paymentDate')}</th>
                  <th className="p-2.5 border-r border-slate-200">{t('student.scheduleStatus')}</th>
                  <th className="p-2.5">{t('billing.notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* 12 Months */}
                {summary.months.map((row) => {
                  const methodText = row.paymentMethod ? formatMethodLabel(row.paymentMethod, language) : '—';
                  return (
                    <tr key={row.period} className="hover:bg-slate-50/70">
                      <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-900">
                        {getMonthLabel(row)}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-right tabular-nums">
                        {formatCurrency(row.rate)}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-right tabular-nums font-bold text-emerald-700">
                        {formatCurrency(row.paidAmount)}
                      </td>
                      <td
                        className={`p-2.5 border-r border-slate-200 text-right tabular-nums font-bold ${
                          row.remainingAmount > 0 ? 'text-rose-700' : 'text-slate-500'
                        }`}
                      >
                        {formatCurrency(row.remainingAmount)}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-slate-700">{methodText}</td>
                      <td className="p-2.5 border-r border-slate-200 tabular-nums text-slate-700 whitespace-nowrap">
                        {formatDateTimeCommaDisplay(row.paymentDate)}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {row.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('billing.status.paid')}
                          </span>
                        ) : row.status === 'partial' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            {t('billing.status.partial')}
                          </span>
                        ) : row.isActiveMonth ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            {t('student.scheduleDue')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {t('billing.status.pending')}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-600">{row.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="p-2.5 border-r border-slate-200 uppercase text-[10px]">
                    {t('billing.totalsRowLabel')}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 text-right tabular-nums">
                    {formatCurrency(summary.totalExpected)}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 text-right tabular-nums text-emerald-700">
                    {formatCurrency(summary.totalPaid)}
                  </td>
                  <td
                    className={`p-2.5 border-r border-slate-200 text-right tabular-nums ${
                      summary.remainingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatCurrency(summary.remainingBalance)}
                  </td>
                  <td colSpan={4} className="p-2.5 text-[10px] font-semibold text-slate-600">
                    {t('billing.totalsFootnote', {
                      months: summary.activeMonthsCount,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Chronological Payment Transactions History */}
          {sortedTransactions.length > 0 && (
            <div className="space-y-2 break-inside-avoid">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#C6A15B]" />
                {t('billing.transactionsHistorySection')}
              </h3>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-200">{t('payments.paymentDate')}</th>
                      <th className="p-2 border-r border-slate-200">{t('billing.floorRoomBed')}</th>
                      <th className="p-2 border-r border-slate-200">{t('billing.itemLabel')}</th>
                      <th className="p-2 border-r border-slate-200 text-right">{t('billing.amountPaid')}</th>
                      <th className="p-2 border-r border-slate-200">{t('payments.paidUntilLabel')}</th>
                      <th className="p-2 border-r border-slate-200">{t('payments.method')}</th>
                      <th className="p-2">{t('billing.notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedTransactions.map((tx) => {
                      const locText = formatFloorRoomBedDisplay({
                        floor: tx.floor ?? (typeof subject.floor === 'number' ? subject.floor : undefined),
                        roomNumber: tx.roomNumber,
                        bedLabel: tx.bedLabel,
                        lang: language,
                      });
                      return (
                        <tr key={tx.id}>
                          <td className="p-2 border-r border-slate-200 tabular-nums whitespace-nowrap font-semibold">
                            {formatDateTimeCommaDisplay(tx.paymentDate, tx.paymentTime)}
                          </td>
                          <td className="p-2 border-r border-slate-200 whitespace-nowrap">{locText}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">
                            {formatPeriodDisplay(tx.periodMonth)}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right tabular-nums font-bold text-emerald-700">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="p-2 border-r border-slate-200 tabular-nums whitespace-nowrap font-medium text-slate-700">
                            {formatShortDateDisplay(tx.paidUntil)}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            {formatMethodLabel(tx.paymentMethod, language)}
                          </td>
                          <td className="p-2 text-slate-600">{tx.notes || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signature Footer */}
          <div className="pt-4 grid grid-cols-2 gap-8 text-[11px] break-inside-avoid">
            <div className="border-t border-slate-300 pt-2">
              <p className="font-bold text-slate-900">{t('billing.accountingOfficer')}: Abdusattorov A.A.</p>
              <p className="text-slate-500 mt-4">____________________________</p>
            </div>
            <div className="border-t border-slate-300 pt-2 text-right">
              <p className="font-bold text-slate-900">{subject.fullName}</p>
              <p className="text-slate-500 mt-4">____________________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
