import React, { useMemo, useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  computeStudentBillingSummary,
  findLinkedApplication,
  formatShortDateDisplay,
} from '../utils/billingUtils';
import { ResidenceContractModal } from '../components/ResidenceContractModal';
import { PaymentExpiryBadge } from '../components/PaymentExpiryBadge';
import { Printer, CheckCircle2, Clock, Calendar } from 'lucide-react';

export const S09_StudentContract: React.FC = () => {
  const {
    students,
    activeStudentId,
    contracts,
    applications,
    rooms,
    settings,
    payments,
    billingLedgers,
  } = useDorm();
  const { t, language, formatCurrency, formatDate } = useI18n();
  const [showContractModal, setShowContractModal] = useState(false);

  const student = students.find((s) => s.id === activeStudentId) || students[0];
  const contract =
    contracts.find((c) => c.studentId === student?.id && c.status === 'active') ||
    contracts.find((c) => c.studentId === student?.id);

  const linkedApp = useMemo(
    () => findLinkedApplication(student, applications),
    [applications, student]
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

  const effectiveRoomType = billingSummary.roomType;
  const roomTypeLabel = effectiveRoomType ? t(`rooms.${effectiveRoomType}`) : '';
  const roomCapacity = billingSummary.capacity;
  const bedLabel = student.bedIdentifier || (student.bedNumber ? String(student.bedNumber) : '');
  const formattedRoomBed =
    student.roomNumber && bedLabel
      ? t('student.roomBedFormat', { room: student.roomNumber, bed: bedLabel })
      : student.roomNumber
      ? `${t('common.room')} ${student.roomNumber}`
      : t('student.awaitingRoom');
  const effectiveTariff = billingSummary.monthlyRate;
  const monthlyTariffText = effectiveTariff > 0 ? effectiveTariff.toLocaleString('ru-RU') : '';
  const degreeCourseLabel = student.degreeLevel
    ? `${student.degreeLevel}, ${student.course}-${t('common.course')}`
    : `${student.course}-${t('common.course')}`;
  const isActiveResident = Boolean(student.roomNumber) && student.status === 'active';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#101C32] tracking-tight">
              {t('studentContract.title')}
            </h1>
            <p className="text-xs text-slate-500">{t('studentContract.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowContractModal(true)}
            className="px-3.5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#C6A15B]" />
            {t('student.viewFullContractBtn')}
          </button>
        </div>

        {/* Contract Card */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-slate-500 block text-[10px]">{t('studentContract.number')}</span>
              <span className="text-base font-extrabold text-slate-900">
                {contract?.contractNumber || student.applicationId || linkedApp?.id || 'RC-2026/001'}
              </span>
            </div>
            {isActiveResident ? (
              <span className="bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('student.statusActive')}
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {t('student.statusPending')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block">{t('studentContract.tenant')}</span>
              <span className="font-bold text-slate-900">{student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('studentContract.passport')}</span>
              <span className="font-bold text-slate-900">{student.passportNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('studentContract.assignedRoom')}</span>
              <span className="font-bold text-slate-900">
                {formattedRoomBed}
                {roomCapacity ? ` (${t('student.capacityBeds', { capacity: roomCapacity })})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('studentContract.monthlyTariff')}</span>
              <span className="font-bold text-slate-900">
                {roomTypeLabel ? `${roomTypeLabel} • ` : ''}
                {formatCurrency(effectiveTariff)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('studentContract.period')}</span>
              <span className="font-bold text-slate-900">
                {formatDate(contract?.startDate || '2026-09-01')} — {formatDate(contract?.endDate || '2027-06-30')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" />
                {t('studentContract.paidUntil')}
              </span>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatShortDateDisplay(billingSummary.paidUntilDate)}
                </span>
                <PaymentExpiryBadge paidUntilDate={billingSummary.paidUntilDate} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-600">{t('studentContract.rulesNotice')}</p>
            <button
              type="button"
              onClick={() => setShowContractModal(true)}
              className="text-xs font-bold text-[#A3813E] hover:underline cursor-pointer"
            >
              {t('student.viewFullContractBtn')}
            </button>
          </div>
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
