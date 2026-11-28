import React, { useEffect, useMemo, useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  ACADEMIC_BILLING_MONTHS,
  addDaysToDateStr,
  computeStudentBillingSummary,
  ensureDateTimeValue,
  findLinkedApplication,
  formatShortDateDisplay,
  getCurrentBillingPeriod,
  getCurrentLocalDateTime,
  normalizeSelectableMethod,
  safeAmount,
  toDateTimeLocalInputValue,
} from '../utils/billingUtils';
import { BILLING_PAYMENT_METHODS, BillingPaymentMethod } from '../types';
import { PaymentExpiryBadge } from '../components/PaymentExpiryBadge';
import {
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Save,
  Calendar,
} from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface AddPaymentProps {
  initialStudentId?: string;
  onClose: () => void;
}

export const S52_AddPaymentModal: React.FC<AddPaymentProps> = ({ initialStudentId, onClose }) => {
  const {
    students,
    applications,
    contracts,
    rooms,
    settings,
    payments,
    billingLedgers,
    recordPayment,
  } = useDorm();
  const { t, language, formatCurrency } = useI18n();

  const activeStudents = useMemo(
    () => students.filter((s) => s.status !== 'deleted_pending_purge'),
    [students]
  );

  const payableEntities = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      student?: (typeof students)[number];
      app?: (typeof applications)[number];
    }> = [];
    const coveredAppIds = new Set<string>();

    activeStudents.forEach((s) => {
      const linkedApp = findLinkedApplication(s, applications);
      if (linkedApp) coveredAppIds.add(linkedApp.id);
      const bedLabel = s.bedIdentifier || (s.bedNumber ? String(s.bedNumber) : '');
      const locLabel = s.roomNumber
        ? bedLabel
          ? t('student.roomBedFormat', { room: s.roomNumber, bed: bedLabel })
          : `${t('common.room')} ${s.roomNumber}`
        : t('student.awaitingRoom');
      items.push({
        id: s.id,
        label: `${s.fullName} (${locLabel})`,
        student: s,
        app: linkedApp,
      });
    });

    applications
      .filter(
        (a) =>
          a.status !== 'rejected' &&
          !coveredAppIds.has(a.id) &&
          !(a.studentId && students.some((s) => s.id === a.studentId))
      )
      .forEach((a) => {
        items.push({
          id: a.id,
          label: `${a.fullName} (${a.id} • ${t('student.awaitingRoom')})`,
          app: a,
        });
      });

    return items;
  }, [activeStudents, applications, students, t]);

  const defaultId = initialStudentId || payableEntities[0]?.id || '';

  const [studentId, setStudentId] = useState(defaultId);
  const [periodMonth, setPeriodMonth] = useState<string>(() => getCurrentBillingPeriod());
  const [monthlyRateOverrideInput, setMonthlyRateOverrideInput] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(() => getCurrentLocalDateTime());
  const [paidUntilDate, setPaidUntilDate] = useState<string>(() =>
    addDaysToDateStr(getCurrentLocalDateTime(), 30)
  );
  const [paidUntilManual, setPaidUntilManual] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  const selectedEntity = payableEntities.find((e) => e.id === studentId);
  const selectedStudent = selectedEntity?.student;

  const selectedSummary = useMemo(() => {
    if (!selectedEntity) return undefined;
    const activeCnt = selectedEntity.student
      ? contracts.find((c) => c.studentId === selectedEntity.student!.id && c.status === 'active')
      : undefined;
    return computeStudentBillingSummary({
      entityId: selectedEntity.id,
      student: selectedEntity.student,
      application: selectedEntity.app,
      contract: activeCnt,
      rooms,
      settings,
      payments,
      ledger: billingLedgers[selectedEntity.id],
    });
  }, [selectedEntity, contracts, rooms, settings, payments, billingLedgers]);

  useEffect(() => {
    const existingOverride = studentId ? billingLedgers[studentId]?.monthlyRateOverride : undefined;
    setMonthlyRateOverrideInput(existingOverride && existingOverride > 0 ? String(existingOverride) : '');
  }, [studentId, billingLedgers]);

  const parsedOverride =
    monthlyRateOverrideInput.trim() !== '' ? safeAmount(monthlyRateOverrideInput, 0) : 0;
  const defaultRoomRate = selectedSummary?.defaultRoomRate ?? settings.roomTariffs.comfort;
  const effectiveMonthlyRate =
    parsedOverride > 0 ? parsedOverride : selectedSummary?.monthlyRate ?? defaultRoomRate;

  const currentItemMetrics = useMemo(() => {
    if (!selectedSummary) {
      return { expected: effectiveMonthlyRate, alreadyPaid: 0, remaining: effectiveMonthlyRate };
    }
    const row = selectedSummary.months.find((m) => m.period === periodMonth);
    const alreadyPaid = row ? row.paidAmount : 0;
    const expected = effectiveMonthlyRate;
    const remaining = Math.max(0, expected - alreadyPaid);
    return { expected, alreadyPaid, remaining };
  }, [selectedSummary, periodMonth, effectiveMonthlyRate]);

  // Preload fields when resident or period changes
  useEffect(() => {
    if (!selectedSummary) return;
    setFormError(null);
    const nowDt = getCurrentLocalDateTime();
    setPaymentDate(nowDt);
    setPaidUntilDate(addDaysToDateStr(nowDt, 30));
    setPaidUntilManual(false);
    setNotes('');

    const row = selectedSummary.months.find((m) => m.period === periodMonth);
    const alreadyPaid = row ? row.paidAmount : 0;
    const rem = Math.max(0, effectiveMonthlyRate - alreadyPaid);
    setAmount(rem > 0 ? rem : effectiveMonthlyRate);
    setPaymentMethod(normalizeSelectableMethod(row?.paymentMethod));
  }, [studentId, periodMonth, Boolean(selectedSummary)]);

  const handlePaymentDateChange = (nextDateTime: string) => {
    setPaymentDate(nextDateTime);
    if (!paidUntilManual && nextDateTime) {
      setPaidUntilDate(addDaysToDateStr(nextDateTime, 30));
    }
  };

  const handleOverrideChange = (valStr: string) => {
    setMonthlyRateOverrideInput(valStr);
    const nextOv = valStr.trim() !== '' ? safeAmount(valStr, 0) : 0;
    const nextRate = nextOv > 0 ? nextOv : selectedSummary?.monthlyRate ?? defaultRoomRate;
    const row = selectedSummary?.months.find((m) => m.period === periodMonth);
    const alreadyPaid = row ? row.paidAmount : 0;
    setAmount(Math.max(0, nextRate - alreadyPaid));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    setFormError(null);

    const payAmt = safeAmount(amount, 0);
    if (payAmt <= 0) {
      setFormError(t('students.modal.errPartialAmount'));
      return;
    }

    const normalizedDateTime = ensureDateTimeValue(paymentDate);
    const resolvedPaidUntil =
      paidUntilDate && /^\d{4}-\d{2}-\d{2}$/.test(paidUntilDate)
        ? paidUntilDate
        : addDaysToDateStr(normalizedDateTime, 30);

    recordPayment({
      studentId,
      amount: payAmt,
      periodMonth,
      paymentDate: normalizedDateTime,
      paidUntil: resolvedPaidUntil,
      paymentMethod,
      notes: notes.trim() || undefined,
      monthlyRateOverride: parsedOverride > 0 ? parsedOverride : undefined,
    });
    onClose();
  };

  const getMonthLabel = (m: (typeof ACADEMIC_BILLING_MONTHS)[number]) => {
    if (language === 'ru') return m.ru;
    if (language === 'en') return m.en;
    return m.uz;
  };

  const selectedRoomType =
    selectedSummary?.roomType || selectedStudent?.roomType || selectedEntity?.app?.preferredRoomType;

  const remainingAfterRecord = Math.max(0, currentItemMetrics.remaining - safeAmount(amount, 0));

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-payment-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto max-h-[92vh] flex flex-col relative"
      >
        <ModalHeader
          icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
          title={<span id="add-payment-modal-title">{t('payments.addModalTitle')}</span>}
          subtitle={t('payments.subtitle')}
          onClose={handleDismiss}
          ariaLabel={t('common.close')}
        />

        <div className="overflow-y-auto flex-1 pr-0.5">
          {payableEntities.length === 0 ? (
            <div className="p-8 text-center text-slate-500">{t('common.noData')}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Resident Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('payments.selectStudent')}:
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                >
                  {payableEntities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resident Rate + Current Paid-Through Snapshot */}
              {selectedEntity && selectedSummary && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span>{t('billing.monthlyRate')}:</span>
                      {selectedRoomType && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-200 text-slate-700">
                          {t(`rooms.${selectedRoomType}`)}
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatCurrency(effectiveMonthlyRate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-slate-500">
                      {t('payments.paidUntilLabel')}:{' '}
                      <strong className="text-slate-800 tabular-nums">
                        {formatShortDateDisplay(selectedSummary.paidUntilDate)}
                      </strong>
                    </span>
                    <PaymentExpiryBadge paidUntilDate={selectedSummary.paidUntilDate} compact />
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-[10px] font-bold text-slate-600">
                      {t('billing.rateOverrideLabel')}:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        step={50000}
                        value={monthlyRateOverrideInput}
                        onChange={(e) => handleOverrideChange(e.target.value)}
                        placeholder={String(defaultRoomRate)}
                        className="w-32 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-900 tabular-nums"
                      />
                      {parsedOverride > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOverrideChange('')}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 inline-flex items-center gap-1 cursor-pointer"
                          title={t('billing.resetToRoomRate')}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Period (12 academic months) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('payments.periodLabel')}:
                </label>
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                >
                  {ACADEMIC_BILLING_MONTHS.map((m) => {
                    const rowStatus = selectedSummary?.months.find((r) => r.period === m.period)?.status;
                    return (
                      <option key={m.period} value={m.period}>
                        {getMonthLabel(m)}
                        {rowStatus ? ` — ${t(`billing.status.${rowStatus}`)}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount & Quick Fill */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">{t('billing.currentItemRemaining')}:</span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {formatCurrency(currentItemMetrics.remaining)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">{t('billing.remainingAfterPayment')}:</span>
                  <span
                    className={`font-extrabold tabular-nums ${
                      remainingAfterRecord > 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatCurrency(remainingAfterRecord)}
                  </span>
                </div>
                {currentItemMetrics.remaining > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAmount(currentItemMetrics.remaining)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                    >
                      {t('billing.fillFullRemaining')} ({formatCurrency(currentItemMetrics.remaining)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount(Math.round(currentItemMetrics.remaining / 2))}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                    >
                      {t('billing.halfRemaining')}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('payments.amountLabel')}:
                </label>
                <input
                  type="number"
                  min={1}
                  step={1000}
                  required
                  value={amount}
                  onChange={(e) => {
                    setFormError(null);
                    setAmount(safeAmount(e.target.value === '' ? 0 : Number(e.target.value), 0));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 tabular-nums"
                />
              </div>

              {/* Payment Method & Exact Date + Time (HH:MM) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('payments.methodLabel')}:
                  </label>
                  <select
                    value={normalizeSelectableMethod(paymentMethod)}
                    onChange={(e) => setPaymentMethod(e.target.value as BillingPaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                  >
                    {BILLING_PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {t(`payments.method.${m}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('payments.dateLabel')}:
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={toDateTimeLocalInputValue(paymentDate)}
                    onChange={(e) => handlePaymentDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 tabular-nums"
                  />
                </div>
              </div>

              {/* Paid-Through / Coverage End Date (default = Payment Date + 30 days) */}
              <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t('payments.paidUntilLabel')}:</span>
                  </label>
                  <PaymentExpiryBadge paidUntilDate={paidUntilDate} compact />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    required
                    value={paidUntilDate}
                    onChange={(e) => {
                      setPaidUntilDate(e.target.value);
                      setPaidUntilManual(true);
                    }}
                    className="flex-1 px-3 py-2 bg-white border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900 tabular-nums"
                  />
                  {paidUntilManual && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaidUntilDate(addDaysToDateStr(paymentDate, 30));
                        setPaidUntilManual(false);
                      }}
                      className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer shrink-0"
                      title="+30"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>+30</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  {t('payments.paidUntilAutoHint')}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('payments.notesLabel')}:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('billing.notePlaceholder')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {t('payments.savePayment')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
