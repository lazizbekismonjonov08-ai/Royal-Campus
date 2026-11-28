import React, { useMemo, useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  ACADEMIC_BILLING_MONTHS,
  comparePaymentsChronoDesc,
  computeStudentBillingSummary,
  findLinkedApplication,
  formatDateTimeCommaDisplay,
  formatFloorRoomBedDisplay,
  formatMethodLabel,
  formatShortDateDisplay,
  isMonthlyPaymentRecord,
} from '../utils/billingUtils';
import { PaymentStatementModal } from '../components/PaymentStatementModal';
import { PaymentExpiryBadge } from '../components/PaymentExpiryBadge';
import {
  Receipt,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Wallet,
  CreditCard,
} from 'lucide-react';

export const S08_StudentPayments: React.FC = () => {
  const {
    students,
    activeStudentId,
    payments,
    applications,
    contracts,
    rooms,
    settings,
    billingLedgers,
  } = useDorm();
  const { t, language, formatCurrency } = useI18n();
  const [showStatementModal, setShowStatementModal] = useState(false);

  const student = students.find((s) => s.id === activeStudentId) || students[0];

  const linkedApp = useMemo(
    () => findLinkedApplication(student, applications),
    [applications, student]
  );

  const activeContract = useMemo(
    () =>
      student
        ? contracts.find((c) => c.studentId === student.id && c.status === 'active') ||
          contracts.find((c) => c.studentId === student.id)
        : undefined,
    [contracts, student]
  );

  const summary = useMemo(() => {
    if (!student) return undefined;
    return computeStudentBillingSummary({
      entityId: student.id,
      student,
      application: linkedApp,
      contract: activeContract,
      rooms,
      settings,
      payments,
      ledger: billingLedgers[student.id],
    });
  }, [student, linkedApp, activeContract, rooms, settings, payments, billingLedgers]);

  if (!student || !summary) {
    return <div className="p-6 text-center text-slate-500">{t('student.notFound')}</div>;
  }

  const myPayments = [
    ...payments.filter((p) => p.studentId === student.id && isMonthlyPaymentRecord(p)),
  ].sort(comparePaymentsChronoDesc);
  const hasBalance = summary.remainingBalance > 0;
  const roomTypeLabel = summary.roomType ? t(`rooms.${summary.roomType}`) : undefined;
  const bedLabel = student.bedIdentifier || (student.bedNumber ? String(student.bedNumber) : '');
  const roomLabel =
    student.roomNumber && bedLabel
      ? t('student.roomBedFormat', { room: student.roomNumber, bed: bedLabel })
      : student.roomNumber
      ? `${t('common.room')} ${student.roomNumber}`
      : t('student.awaitingRoom');

  const getMonthLabel = (m: (typeof summary.months)[number]) => {
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">{t('studentPayments.title')}</h1>
            <p className="text-xs text-slate-500">{t('studentPayments.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PaymentExpiryBadge paidUntilDate={summary.paidUntilDate} />
            <button
              type="button"
              onClick={() => setShowStatementModal(true)}
              className="px-3.5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#EAD096] font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#C6A15B]" />
              <span>{t('billing.printStatement')}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 flex items-center gap-1 mb-1 font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              {t('billing.monthlyRate')}
            </span>
            <span className="text-base font-extrabold text-slate-900 tabular-nums block">
              {formatCurrency(summary.monthlyRate)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {roomTypeLabel || '—'}
              {summary.capacity ? ` · ${t('student.capacityBeds', { capacity: summary.capacity })}` : ''}
            </span>
          </div>

          <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200">
            <span className="text-sky-800 flex items-center gap-1 mb-1 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              {t('payments.paidUntilLabel')}
            </span>
            <span className="text-base font-extrabold text-[#101C32] tabular-nums block">
              {formatShortDateDisplay(summary.paidUntilDate)}
            </span>
            <div className="mt-1.5">
              <PaymentExpiryBadge paidUntilDate={summary.paidUntilDate} compact />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 flex items-center gap-1 mb-1 font-semibold">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              {t('billing.totalPaid')}
            </span>
            <span className="text-base font-extrabold text-emerald-700 tabular-nums block">
              {formatCurrency(summary.totalPaid)}
            </span>
            <span className="text-[10px] text-emerald-700/80 block mt-0.5">
              {t('billing.monthlyCollectionsHint')}
            </span>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              hasBalance ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <span
              className={`block mb-1 font-semibold ${
                hasBalance ? 'text-rose-800' : 'text-emerald-800'
              }`}
            >
              {t('billing.remainingBalance')}
            </span>
            <span
              className={`text-base font-extrabold tabular-nums block ${
                hasBalance ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {hasBalance ? formatCurrency(summary.remainingBalance) : t('student.noDebt')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {t('studentPayments.paidUntil')}{' '}
              <strong className="tabular-nums">{formatShortDateDisplay(summary.paidUntilDate)}</strong>
            </span>
          </div>
        </div>

        {/* 12-Month Payment Schedule */}
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#C6A15B]" /> {t('student.scheduleTitle')}
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">{t('student.scheduleMonth')}</th>
                <th className="p-3 text-right">{t('student.scheduleRate')}</th>
                <th className="p-3 text-right">{t('billing.amountPaid')}</th>
                <th className="p-3 text-right">{t('billing.balanceDue')}</th>
                <th className="p-3">{t('payments.method')}</th>
                <th className="p-3">{t('payments.paymentDate')}</th>
                <th className="p-3">{t('payments.paidUntilLabel')}</th>
                <th className="p-3">{t('student.scheduleStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {summary.months.map((row) => (
                <tr key={row.period} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold whitespace-nowrap">{getMonthLabel(row)}</td>
                  <td className="p-3 text-right font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                    {formatCurrency(row.rate)}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                    {formatCurrency(row.paidAmount)}
                  </td>
                  <td
                    className={`p-3 text-right font-bold tabular-nums whitespace-nowrap ${
                      row.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {formatCurrency(row.remainingAmount)}
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {row.paymentMethod ? formatMethodLabel(row.paymentMethod, language) : '—'}
                  </td>
                  <td className="p-3 text-slate-600 tabular-nums whitespace-nowrap">
                    {formatDateTimeCommaDisplay(row.paymentDate)}
                  </td>
                  <td className="p-3 text-slate-700 tabular-nums whitespace-nowrap font-semibold">
                    {formatShortDateDisplay(row.paidUntil)}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {row.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('billing.status.paid')}
                      </span>
                    ) : row.status === 'partial' ? (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        <Clock className="w-3 h-3" />
                        {t('billing.status.partial')}
                      </span>
                    ) : row.isActiveMonth ? (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        <AlertTriangle className="w-3 h-3" />
                        {t('student.scheduleDue')}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 font-semibold px-2.5 py-0.5 rounded-full text-[10px]">
                        {t('student.scheduleUpcoming')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-extrabold text-slate-900 border-t border-slate-200">
              <tr>
                <td className="p-3 uppercase text-[10px]">{t('billing.totalsRowLabel')}</td>
                <td className="p-3 text-right tabular-nums">{formatCurrency(summary.totalExpected)}</td>
                <td className="p-3 text-right tabular-nums text-emerald-700">{formatCurrency(summary.totalPaid)}</td>
                <td
                  className={`p-3 text-right tabular-nums ${
                    summary.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(summary.remainingBalance)}
                </td>
                <td colSpan={4} className="p-3 text-[10px] font-medium text-slate-500">
                  {t('billing.totalsFootnote', {
                    months: summary.activeMonthsCount,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment History Table */}
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-sky-600" /> {t('studentPayments.history')}
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">{t('payments.paymentDate')}</th>
                <th className="p-3">{t('billing.floorRoomBed')}</th>
                <th className="p-3">{t('billing.itemLabel')}</th>
                <th className="p-3 text-right">{t('billing.amountPaid')}</th>
                <th className="p-3">{t('payments.method')}</th>
                <th className="p-3">{t('payments.paidUntilLabel')}</th>
                <th className="p-3">{t('billing.notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {myPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                myPayments.map((pay) => {
                  const locText = formatFloorRoomBedDisplay({
                    floor: pay.floor ?? student.floor ?? summary.room?.floor,
                    roomNumber:
                      pay.roomNumber && pay.roomNumber !== '---'
                        ? pay.roomNumber
                        : student.roomNumber,
                    bedLabel: pay.bedLabel || bedLabel || undefined,
                    lang: language,
                  });

                  return (
                    <tr key={pay.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold tabular-nums whitespace-nowrap">
                        {formatDateTimeCommaDisplay(pay.paymentDate, pay.paymentTime)}
                      </td>
                      <td className="p-3 whitespace-nowrap text-sky-700 font-semibold">{locText}</td>
                      <td className="p-3 font-semibold whitespace-nowrap">
                        {formatPeriodDisplay(pay.periodMonth)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {formatMethodLabel(pay.paymentMethod, language)}
                      </td>
                      <td className="p-3 whitespace-nowrap tabular-nums text-slate-700 font-semibold">
                        {formatShortDateDisplay(pay.paidUntil)}
                      </td>
                      <td className="p-3 text-slate-500">{pay.notes || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt / Statement Modal */}
      <PaymentStatementModal
        isOpen={showStatementModal}
        onClose={() => setShowStatementModal(false)}
        subject={{
          fullName: student.fullName,
          phone: student.phone,
          passportNumber: student.passportNumber,
          referenceNumber: activeContract?.contractNumber || student.applicationId || linkedApp?.id,
          roomLabel,
          floor: student.floor || summary.room?.floor,
          roomTypeLabel,
          capacity: summary.capacity,
        }}
        summary={summary}
        transactions={myPayments}
      />
    </div>
  );
};
