import React, { useMemo, useState } from 'react';
import {
  BILLING_PAYMENT_METHODS,
  BillingEntryStatus,
  BillingPaymentMethod,
  MonthlyBillingEntry,
} from '../types';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  ACADEMIC_BILLING_MONTHS,
  addMonthsToDateStr,
  computeStudentBillingSummary,
  ensureDateTimeValue,
  findLinkedApplication,
  formatShortDateDisplay,
  getCurrentLocalDateTime,
  normalizeSelectableMethod,
  safeAmount,
} from '../utils/billingUtils';
import { PaymentExpiryBadge } from '../components/PaymentExpiryBadge';
import { DatePickerDDMMYYYY } from '../components/DatePickerDDMMYYYY';
import { ModalHeader } from '../components/ModalHeader';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { CreditCard, Save, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface BillingEditorModalProps {
  entityId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export const S53_BillingEditorModal: React.FC<BillingEditorModalProps> = ({
  entityId,
  onClose,
  onSaved,
}) => {
  const {
    students,
    applications,
    contracts,
    rooms,
    settings,
    payments,
    billingLedgers,
    updateStudentBillingLedger,
  } = useDorm();
  const { t, language, formatCurrency } = useI18n();

  useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  const student = students.find((s) => s.id === entityId);
  const application = student
    ? findLinkedApplication(student, applications)
    : applications.find((a) => a.id === entityId);
  const activeContract = student
    ? contracts.find((c) => c.studentId === student.id && c.status === 'active')
    : undefined;

  const initialSummary = useMemo(
    () =>
      computeStudentBillingSummary({
        entityId,
        student,
        application,
        contract: activeContract,
        rooms,
        settings,
        payments,
        ledger: billingLedgers[entityId],
      }),
    [entityId, student, application, activeContract, rooms, settings, payments, billingLedgers]
  );

  const [monthsState, setMonthsState] = useState<Record<string, MonthlyBillingEntry>>(() => {
    const map: Record<string, MonthlyBillingEntry> = {};
    initialSummary.months.forEach((m) => {
      map[m.period] = {
        period: m.period,
        status: m.status,
        paidAmount: m.paidAmount,
        paymentDate: m.paymentDate,
        paidUntil: m.paidUntil,
        paymentMethod: m.paymentMethod,
        notes: m.notes,
      };
    });
    return map;
  });

  const [monthlyRateOverrideInput, setMonthlyRateOverrideInput] = useState<string>(() => {
    const existing = billingLedgers[entityId]?.monthlyRateOverride;
    return existing && existing > 0 ? String(existing) : '';
  });

  const parsedOverride =
    monthlyRateOverrideInput.trim() !== '' ? safeAmount(monthlyRateOverrideInput, 0) : 0;

  const previewSummary = useMemo(
    () =>
      computeStudentBillingSummary({
        entityId,
        student,
        application,
        contract: activeContract,
        rooms,
        settings,
        payments: [],
        ledger: {
          studentId: entityId,
          ...(parsedOverride > 0 ? { monthlyRateOverride: parsedOverride } : {}),
          months: monthsState,
          updatedAt: new Date().toISOString(),
        },
      }),
    [
      entityId,
      student,
      application,
      activeContract,
      rooms,
      settings,
      parsedOverride,
      monthsState,
    ]
  );

  const displayName = student?.fullName || application?.fullName || 'Rezident';
  const displayRoom = student?.roomNumber
    ? (student.bedIdentifier || student.bedNumber)
      ? t('student.roomBedFormat', {
          room: student.roomNumber,
          bed: String(student.bedIdentifier || student.bedNumber),
        })
      : `${t('common.room')} ${student.roomNumber}`
    : application?.assignedRoomNumber
    ? `${t('common.room')} ${application.assignedRoomNumber}`
    : t('student.awaitingRoom');

  const handleMonthStatusChange = (period: string, status: BillingEntryStatus) => {
    const rate = previewSummary.monthlyRate;
    setMonthsState((prev) => {
      const existing = prev[period] || { period, status: 'pending', paidAmount: 0 };
      const nextPaid =
        status === 'paid'
          ? rate
          : status === 'pending'
          ? 0
          : existing.paidAmount > 0 && existing.paidAmount < rate
          ? existing.paidAmount
          : Math.round(rate / 2);
      const nextPaymentDate =
        status === 'pending' ? undefined : existing.paymentDate || getCurrentLocalDateTime();
      const nextPaidUntil =
        status === 'pending'
          ? undefined
          : existing.paidUntil || (nextPaymentDate ? addMonthsToDateStr(nextPaymentDate, 1) : undefined);

      return {
        ...prev,
        [period]: {
          ...existing,
          status,
          paidAmount: nextPaid,
          paymentDate: nextPaymentDate,
          paidUntil: nextPaidUntil,
          paymentMethod: status === 'pending' ? undefined : normalizeSelectableMethod(existing.paymentMethod),
        },
      };
    });
  };

  const handleMonthPaidAmountChange = (period: string, valueStr: string) => {
    const num = safeAmount(valueStr === '' ? 0 : Number(valueStr), 0);
    const rate = previewSummary.monthlyRate;
    setMonthsState((prev) => {
      const existing = prev[period] || { period, status: 'pending', paidAmount: 0 };
      const nextStatus: BillingEntryStatus =
        num === 0 ? 'pending' : rate > 0 && num >= rate ? 'paid' : 'partial';
      const nextPaymentDate =
        num > 0 ? existing.paymentDate || getCurrentLocalDateTime() : existing.paymentDate;
      const nextPaidUntil =
        num > 0
          ? existing.paidUntil || (nextPaymentDate ? addMonthsToDateStr(nextPaymentDate, 1) : undefined)
          : undefined;
      return {
        ...prev,
        [period]: {
          ...existing,
          paidAmount: num,
          status: nextStatus,
          paymentDate: num > 0 ? nextPaymentDate : undefined,
          paidUntil: nextPaidUntil,
          paymentMethod: num > 0 ? normalizeSelectableMethod(existing.paymentMethod) : undefined,
        },
      };
    });
  };

  const handleMonthFieldChange = (
    period: string,
    field: 'paymentMethod' | 'paymentDate' | 'paidUntil' | 'notes',
    value: string
  ) => {
    setMonthsState((prev) => {
      const existing = prev[period] || { period, status: 'pending' as BillingEntryStatus, paidAmount: 0 };
      if (field === 'paymentDate') {
        const nextDt = value ? ensureDateTimeValue(value) : undefined;
        return {
          ...prev,
          [period]: {
            ...existing,
            paymentDate: nextDt,
            paidUntil: nextDt
              ? existing.paidUntil || addMonthsToDateStr(nextDt, 1)
              : existing.paidUntil,
          },
        };
      }
      if (field === 'paidUntil') {
        return {
          ...prev,
          [period]: {
            ...existing,
            paidUntil: value || undefined,
          },
        };
      }
      return {
        ...prev,
        [period]: {
          ...existing,
          [field]: field === 'paymentMethod' ? (value as BillingPaymentMethod) : value,
        },
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudentBillingLedger(entityId, {
      monthlyRateOverride: parsedOverride > 0 ? parsedOverride : undefined,
      paidUntil: previewSummary.paidUntilDate,
      months: monthsState,
    });
    onSaved?.();
    onClose();
  };

  const getMonthLabel = (m: (typeof ACADEMIC_BILLING_MONTHS)[number]) => {
    if (language === 'ru') return m.ru;
    if (language === 'en') return m.en;
    return m.uz;
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-editor-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
      >
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <ModalHeader
            icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
            title={
              <span id="billing-editor-modal-title">
                {t('billing.editorTitle')} — {displayName}
              </span>
            }
            subtitle={`${displayRoom} • ${
              previewSummary.roomType ? `${t(`rooms.${previewSummary.roomType}`)} · ` : ''
            }${t('billing.monthlyRate')}: ${formatCurrency(previewSummary.monthlyRate)}`}
            onClose={onClose}
            ariaLabel={t('common.close')}
          />
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
            {/* Live Summary Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {t('billing.monthlyRate')}
                </span>
                <span className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                  {formatCurrency(previewSummary.monthlyRate)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                  {t('payments.paidUntilLabel')}
                </span>
                <span className="text-sm font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                  {formatShortDateDisplay(previewSummary.paidUntilDate)}
                </span>
                <div className="mt-1">
                  <PaymentExpiryBadge paidUntilDate={previewSummary.paidUntilDate} compact />
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  {t('billing.totalPaid')}
                </span>
                <span className="text-base font-extrabold text-emerald-700 tabular-nums mt-0.5 block">
                  {formatCurrency(previewSummary.totalPaid)}
                </span>
              </div>
              <div
                className={`p-3.5 rounded-2xl border ${
                  previewSummary.remainingBalance > 0
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    previewSummary.remainingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {t('billing.remainingBalance')}
                </span>
                <span
                  className={`text-base font-extrabold tabular-nums mt-0.5 block ${
                    previewSummary.remainingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(previewSummary.remainingBalance)}
                </span>
              </div>
            </div>

            {/* 12-Month Schedule Table Editor */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold text-slate-800 text-xs">
                  {t('student.scheduleTitle')}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span>{t('billing.rateOverrideLabel')}:</span>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={monthlyRateOverrideInput}
                    onChange={(e) => setMonthlyRateOverrideInput(e.target.value)}
                    placeholder={String(previewSummary.defaultRoomRate)}
                    className="w-28 px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 tabular-nums"
                  />
                  {parsedOverride > 0 && (
                    <button
                      type="button"
                      onClick={() => setMonthlyRateOverrideInput('')}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                    >
                      {t('billing.resetToRoomRate')}
                    </button>
                  )}
                  <span className="ml-1">
                    {t('billing.monthlyRate')}:{' '}
                    <strong className="text-slate-900 tabular-nums">
                      {formatCurrency(previewSummary.monthlyRate)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">{t('student.scheduleMonth')}</th>
                      <th className="p-2.5">{t('student.scheduleStatus')}</th>
                      <th className="p-2.5">{t('billing.amountPaid')} (UZS)</th>
                      <th className="p-2.5">{t('billing.balanceDue')}</th>
                      <th className="p-2.5">{t('payments.method')}</th>
                      <th className="p-2.5">{t('payments.paymentDate')}</th>
                      <th className="p-2.5">{t('payments.paidUntilLabel')}</th>
                      <th className="p-2.5">{t('billing.notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ACADEMIC_BILLING_MONTHS.map((mMeta, idx) => {
                      const entry = monthsState[mMeta.period] || {
                        period: mMeta.period,
                        status: 'pending' as BillingEntryStatus,
                        paidAmount: 0,
                      };
                      const computedRow = previewSummary.months[idx];

                      return (
                        <tr
                          key={mMeta.period}
                          className={computedRow?.isActiveMonth ? 'bg-white' : 'bg-slate-50/40'}
                        >
                          <td className="p-2.5 font-semibold text-slate-900 whitespace-nowrap">
                            <div>{getMonthLabel(mMeta)}</div>
                            {computedRow?.isActiveMonth && (
                              <span className="text-[9px] font-bold uppercase text-sky-700">
                                {t('billing.activePeriodBadge')}
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 whitespace-nowrap">
                            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                              {(['paid', 'partial', 'pending'] as BillingEntryStatus[]).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleMonthStatusChange(mMeta.period, st)}
                                  className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                    entry.status === st
                                      ? st === 'paid'
                                        ? 'bg-emerald-600 text-white'
                                        : st === 'partial'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-700 text-white'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {st === 'paid' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                  {st === 'partial' && <Clock className="w-2.5 h-2.5" />}
                                  {st === 'pending' && <AlertTriangle className="w-2.5 h-2.5" />}
                                  {t(`billing.status.${st}`)}
                                </button>
                              ))}
                            </div>
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min={0}
                              step={50000}
                              value={entry.paidAmount}
                              onChange={(e) => handleMonthPaidAmountChange(mMeta.period, e.target.value)}
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 tabular-nums"
                            />
                          </td>

                          <td
                            className={`p-2.5 font-bold tabular-nums whitespace-nowrap ${
                              (computedRow?.remainingAmount || 0) > 0
                                ? 'text-rose-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {formatCurrency(computedRow?.remainingAmount || 0)}
                          </td>

                          <td className="p-2.5">
                            <select
                              value={normalizeSelectableMethod(entry.paymentMethod)}
                              onChange={(e) =>
                                handleMonthFieldChange(mMeta.period, 'paymentMethod', e.target.value)
                              }
                              className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                            >
                              {BILLING_PAYMENT_METHODS.map((m) => (
                                <option key={m} value={m}>
                                  {t(`payments.method.${m}`)}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2.5">
                            <DatePickerDDMMYYYY
                              mode="datetime"
                              compact
                              allowEmpty
                              value={entry.paymentDate || ''}
                              onChange={(nextVal) =>
                                handleMonthFieldChange(mMeta.period, 'paymentDate', nextVal)
                              }
                            />
                          </td>

                          <td className="p-2.5">
                            <DatePickerDDMMYYYY
                              mode="date"
                              compact
                              allowEmpty
                              value={entry.paidUntil || ''}
                              onChange={(nextVal) =>
                                handleMonthFieldChange(mMeta.period, 'paidUntil', nextVal)
                              }
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="text"
                              value={entry.notes || ''}
                              onChange={(e) =>
                                handleMonthFieldChange(mMeta.period, 'notes', e.target.value)
                              }
                              placeholder={t('billing.notePlaceholder')}
                              className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
              <span>
                {t('billing.totalPaid')}:{' '}
                <strong className="text-emerald-700">{formatCurrency(previewSummary.totalPaid)}</strong>
              </span>
              <span>•</span>
              <span>
                {t('billing.remainingBalance')}:{' '}
                <strong
                  className={
                    previewSummary.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }
                >
                  {formatCurrency(previewSummary.remainingBalance)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {t('common.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
