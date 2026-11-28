import React, { useMemo, useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  computeStudentBillingSummary,
  findLinkedApplication,
  formatDateTimeCommaDisplay,
  formatMethodLabel,
  formatShortDateDisplay,
} from '../utils/billingUtils';
import { ResidenceContractModal } from '../components/ResidenceContractModal';
import { PaymentExpiryBadge } from '../components/PaymentExpiryBadge';
import {
  BedDouble,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle,
  Printer,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (view: string) => void;
}

export const S05_StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const {
    students,
    activeStudentId,
    applications,
    contracts,
    payments,
    rooms,
    settings,
    billingLedgers,
  } = useDorm();
  const { t, language, formatCurrency } = useI18n();
  const [showContractModal, setShowContractModal] = useState(false);

  const student = students.find((s) => s.id === activeStudentId) || students[0];

  const linkedApp = useMemo(
    () => findLinkedApplication(student, applications),
    [applications, student]
  );

  const contract = useMemo(
    () =>
      student
        ? contracts.find((c) => c.studentId === student.id && c.status === 'active') ||
          contracts.find((c) => c.studentId === student.id)
        : undefined,
    [contracts, student]
  );

  const billingSummary = useMemo(() => {
    if (!student) return undefined;
    return computeStudentBillingSummary({
      entityId: student.id,
      student,
      application: linkedApp,
      contract,
      rooms,
      settings,
      payments,
      ledger: billingLedgers[student.id],
    });
  }, [student, linkedApp, contract, rooms, settings, payments, billingLedgers]);

  if (!student || !billingSummary) {
    return <div className="p-6 text-center text-slate-500">{t('student.notFound')}</div>;
  }

  const isDebt = billingSummary.remainingBalance > 0;
  const applicationIdDisplay = student.applicationId || linkedApp?.id || '';
  const effectiveRoomType = billingSummary.roomType;
  const roomTypeLabel = effectiveRoomType ? t(`rooms.${effectiveRoomType}`) : '';
  const roomCapacity = billingSummary.capacity;
  const assignedBedLabel = student.bedIdentifier || (student.bedNumber ? String(student.bedNumber) : '');
  const formattedRoomBed =
    student.roomNumber && assignedBedLabel
      ? t('student.roomBedFormat', { room: student.roomNumber, bed: assignedBedLabel })
      : student.roomNumber
      ? `${t('common.room')} ${student.roomNumber}`
      : t('student.awaitingRoom');
  const effectiveTariff = billingSummary.monthlyRate;
  const monthlyTariffText = effectiveTariff > 0 ? effectiveTariff.toLocaleString('ru-RU') : '';

  const statusBadge = (() => {
    if (student.status === 'active' && student.roomNumber) {
      return {
        label: t('student.statusActive'),
        cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      };
    }
    if (linkedApp?.status === 'approved') {
      return {
        label: t('student.statusApproved'),
        cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      };
    }
    if (linkedApp?.status === 'rejected' || student.status === 'rejected') {
      return {
        label: t('student.statusRejected'),
        cls: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
        icon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
    return {
      label: t('student.statusPending'),
      cls: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      icon: <Clock className="w-3.5 h-3.5" />,
    };
  })();

  const degreeCourseLabel = student.degreeLevel
    ? `${student.degreeLevel}, ${student.course}-${t('common.course')}`
    : `${student.course}-${t('common.course')}`;

  const getMonthLabel = (m: (typeof billingSummary.months)[number]) => {
    if (language === 'ru') return m.labelRu;
    if (language === 'en') return m.labelEn;
    return m.labelUz;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="bg-[#101C32] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#C6A15B]/30 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block bg-[#C6A15B]/20 text-[#C6A15B] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#C6A15B]/40">
              {t('student.portalBadge')}
            </span>
            {applicationIdDisplay && (
              <span className="inline-block bg-white/10 text-slate-200 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/15">
                {t('student.appIdLabel')}: {applicationIdDisplay}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBadge.cls}`}>
              {statusBadge.icon}
              <span>{statusBadge.label}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-[1.15]">
            {t('student.welcome', { name: student.fullName })}
          </h1>
          <p className="text-xs text-slate-300">
            {student.university} • {degreeCourseLabel} ({student.group})
          </p>
        </div>

        <div className="bg-[#1A2D4F] border border-[#C6A15B]/30 p-4 rounded-2xl flex items-center gap-4 text-xs shadow-xs shrink-0">
          <div>
            <div className="text-slate-300 text-[10px]">{t('student.residenceRoom')}</div>
            <div className="text-base sm:text-lg font-bold text-[#C6A15B]">
              {formattedRoomBed}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {student.roomNumber
                ? `${student.floor || billingSummary.room?.floor || '-'}-${t('common.floor')}${roomCapacity ? ` • ${t('student.capacityBeds', { capacity: roomCapacity })}` : ''}`
                : `${roomTypeLabel || 'Royal Campus'}${roomCapacity ? ` · ${t('student.capacityBeds', { capacity: roomCapacity })}` : ''}`}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Room Info */}
        <div
          onClick={() => onNavigate('S07_StudentRoom')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-[#C6A15B] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('student.myRoom')}</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {formattedRoomBed}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {roomTypeLabel || '---'}
            {roomCapacity ? ` (${t('student.capacityBeds', { capacity: roomCapacity })})` : ''} •{' '}
            {formatCurrency(effectiveTariff)}
          </div>
        </div>

        {/* Payment Status */}
        <div
          onClick={() => onNavigate('S08_StudentPayments')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-[#C6A15B] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('billing.remainingBalance')}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDebt ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-lg font-bold tabular-nums ${isDebt ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isDebt ? formatCurrency(billingSummary.remainingBalance) : t('student.noDebt')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t('billing.totalPaid')}: <span className="font-semibold text-emerald-700">{formatCurrency(billingSummary.totalPaid)}</span>
          </div>
        </div>

        {/* Paid-Through / Coverage Countdown */}
        <div
          onClick={() => onNavigate('S08_StudentPayments')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-[#C6A15B] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('payments.paidUntilLabel')}</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 tabular-nums">
            {formatShortDateDisplay(billingSummary.paidUntilDate)}
          </div>
          <div className="mt-1.5">
            <PaymentExpiryBadge paidUntilDate={billingSummary.paidUntilDate} compact />
          </div>
        </div>

        {/* Official Contract Trigger */}
        <div
          onClick={() => setShowContractModal(true)}
          className="bg-white p-4 rounded-2xl border border-[#C6A15B]/40 shadow-2xs hover:border-[#C6A15B] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('nav.contracts')}</span>
            <div className="w-8 h-8 rounded-xl bg-[#101C32] text-[#C6A15B] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-[#101C32] flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-[#C6A15B]" />
            <span>{contract?.contractNumber || (applicationIdDisplay || t('student.viewContract'))}</span>
          </div>
          <div className="text-xs text-[#A3813E] font-semibold mt-1 group-hover:underline">
            {t('student.viewFullContractBtn')}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3.5">
          {t('dashboard.quickActions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('S06_StudentProfile')}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl border border-slate-200 text-center transition-colors cursor-pointer"
          >
            {t('studentProfile.personalInfo')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('S07_StudentRoom')}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl border border-slate-200 text-center transition-colors cursor-pointer"
          >
            {t('student.myRoom')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('S08_StudentPayments')}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl border border-slate-200 text-center transition-colors cursor-pointer"
          >
            {t('studentPayments.history')}
          </button>
          <button
            type="button"
            onClick={() => setShowContractModal(true)}
            className="p-3 bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] font-bold rounded-xl border border-[#C6A15B]/50 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
            <span className="truncate">{t('student.viewContract')}</span>
          </button>
        </div>
      </div>

      {/* 12-Month Payment Schedule (Sept 2026 - Aug 2027) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C6A15B]" />
            <h2 className="text-sm font-bold text-[#101C32]">{t('student.scheduleTitle')}</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {t('student.monthlyTariff')}: <strong className="text-slate-900">{formatCurrency(effectiveTariff)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">{t('student.scheduleMonth')}</th>
                <th className="p-3 text-right">{t('student.scheduleRate')}</th>
                <th className="p-3 text-right">{t('billing.amountPaid')}</th>
                <th className="p-3 text-right">{t('billing.balanceDue')}</th>
                <th className="p-3">{t('payments.method')}</th>
                <th className="p-3">{t('payments.paymentDate')}</th>
                <th className="p-3">{t('student.scheduleStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {billingSummary.months.map((row) => (
                <tr key={row.period} className="hover:bg-slate-50/80">
                  <td className="p-3 font-semibold">{getMonthLabel(row)}</td>
                  <td className="p-3 text-right tabular-nums font-semibold text-slate-700">
                    {formatCurrency(row.rate)}
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold text-emerald-700">
                    {formatCurrency(row.paidAmount)}
                  </td>
                  <td
                    className={`p-3 text-right tabular-nums font-bold ${
                      row.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {formatCurrency(row.remainingAmount)}
                  </td>
                  <td className="p-3 text-slate-600">
                    {row.paymentMethod ? formatMethodLabel(row.paymentMethod, language) : '—'}
                  </td>
                  <td className="p-3 text-slate-600 tabular-nums whitespace-nowrap">
                    {formatDateTimeCommaDisplay(row.paymentDate)}
                  </td>
                  <td className="p-3">
                    {row.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        {t('billing.status.paid')}
                      </span>
                    ) : row.status === 'partial' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" />
                        {t('billing.status.partial')}
                      </span>
                    ) : row.isActiveMonth ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        <AlertTriangle className="w-3 h-3" />
                        {t('student.scheduleDue')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
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
                <td className="p-3 text-right tabular-nums">{formatCurrency(billingSummary.totalExpected)}</td>
                <td className="p-3 text-right tabular-nums text-emerald-700">{formatCurrency(billingSummary.totalPaid)}</td>
                <td
                  className={`p-3 text-right tabular-nums ${
                    billingSummary.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(billingSummary.remainingBalance)}
                </td>
                <td colSpan={3} className="p-3 text-[10px] font-medium text-slate-500">
                  {t('billing.totalsFootnote', {
                    months: billingSummary.activeMonthsCount,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Full Auto-Filled 18-Section + 3-Annex Contract Modal */}
      <ResidenceContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        isResidentMode={true}
        language={language}
        isLight={true}
        studentData={{
          fullName: student.fullName || '',
          birthDate: student.birthDate || '',
          phone: student.phone || '',
          passportNumber: student.passportNumber || '',
          university: student.university || '',
          faculty: student.faculty || '',
          course: degreeCourseLabel,
          group: student.group || '',
          roomTypeLabel,
          monthlyTariffText,
          floor: student.floor || billingSummary.room?.floor,
          roomCapacity,
          roomNumber: student.roomNumber || undefined,
          bedNumber: student.bedIdentifier || (student.bedNumber ? String(student.bedNumber) : undefined),
          contractNumber: contract?.contractNumber || undefined,
          billingSummary,
        }}
      />
    </div>
  );
};
