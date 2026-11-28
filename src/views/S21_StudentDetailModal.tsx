import React, { useMemo, useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  ACADEMIC_BILLING_MONTHS,
  comparePaymentsChronoDesc,
  computeStudentBillingSummary,
  findLinkedApplication,
  formatDateTimeCommaDisplay,
  formatMethodLabel,
  formatShortDateDisplay,
  isMonthlyPaymentRecord,
} from '../utils/billingUtils';
import { S53_BillingEditorModal } from './S53_BillingEditorModal';
import { PaymentStatementModal } from '../components/PaymentStatementModal';
import { PaymentExpiryBadge } from '../components/PaymentExpiryBadge';
import {
  ArrowRightLeft,
  Trash2,
  PlusCircle,
  Plus,
  CheckCircle2,
  Edit3,
  Printer,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { ModalCloseButton } from '../components/ModalCloseButton';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface StudentDetailProps {
  studentId: string;
  onClose: () => void;
  onOpenTransferModal: (stdId: string) => void;
  onOpenAddPaymentModal: (stdId: string) => void;
}

export const S21_StudentDetailModal: React.FC<StudentDetailProps> = ({
  studentId,
  onClose,
  onOpenTransferModal,
  onOpenAddPaymentModal,
}) => {
  const {
    students,
    applications,
    rooms,
    settings,
    billingLedgers,
    deleteStudent,
    payments,
    contracts,
    disciplineRecords,
    addDisciplineRecord,
    role,
    handleAcceptPayment,
    resetResidentTempPassword,
  } = useDorm();
  const { t, language, formatCurrency, formatDate } = useI18n();
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'contract' | 'discipline'>('profile');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showViolationInput, setShowViolationInput] = useState(false);
  const [violationReason, setViolationReason] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(10);
  const [showBillingEditor, setShowBillingEditor] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const canManageCredentials = role !== 'security' && role !== 'student';

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  const student = students.find((s) => s.id === studentId);

  const linkedApp = useMemo(
    () => findLinkedApplication(student, applications),
    [student, applications]
  );

  const stdContract = useMemo(
    () => (student ? contracts.find((c) => c.studentId === student.id && c.status === 'active') || contracts.find((c) => c.studentId === student.id) : undefined),
    [contracts, student]
  );

  const billingSummary = useMemo(() => {
    if (!student) return undefined;
    return computeStudentBillingSummary({
      entityId: student.id,
      student,
      application: linkedApp,
      contract: stdContract,
      rooms,
      settings,
      payments,
      ledger: billingLedgers[student.id],
    });
  }, [student, linkedApp, stdContract, rooms, settings, payments, billingLedgers]);

  if (!student || !billingSummary) return null;

  const stdPayments = [
    ...payments.filter((p) => p.studentId === student.id && isMonthlyPaymentRecord(p)),
  ].sort(comparePaymentsChronoDesc);
  const formatPeriodLabel = (period: string) => {
    const found = ACADEMIC_BILLING_MONTHS.find((m) => m.period === period);
    if (!found) return period;
    if (language === 'ru') return found.ru;
    if (language === 'en') return found.en;
    return found.uz;
  };
  const stdDiscipline = disciplineRecords.filter((d) => d.studentId === student.id);
  const totalPenaltyPoints = stdDiscipline.reduce((acc, d) => acc + d.penaltyPoints, 0);

  const handleAddViolation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationReason.trim()) return;
    addDisciplineRecord({
      studentId: student.id,
      violationReason,
      penaltyPoints,
    });
    setViolationReason('');
    setShowViolationInput(false);
  };

  const handleQuickAccept = () => {
    handleAcceptPayment(student.id, billingSummary.monthlyRate);
    setSuccessToast(`${student.fullName}: ${formatCurrency(billingSummary.monthlyRate)}`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleConfirmDelete = () => {
    deleteStudent(student.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleCopyCred = (value: string, key: string) => {
    if (!value) return;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value);
    }
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const handleResetPassword = async () => {
    if (!canManageCredentials || isResettingPassword) return;
    setIsResettingPassword(true);
    try {
      const res = await resetResidentTempPassword(student.id);
      if (res.success && res.tempPassword) {
        setSuccessToast(t('students.passwordResetToast', { password: res.tempPassword }));
        window.setTimeout(() => setSuccessToast(null), 4500);
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-detail-modal-title"
    >
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-5 right-5 z-60 bg-[#101C32] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-[#C6A15B] flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#101C32] text-[#C6A15B] font-extrabold text-xl flex items-center justify-center shadow-md shrink-0 border border-[#C6A15B]/30">
              {student.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 id="student-detail-modal-title" className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                {student.fullName}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {student.university} • {t('students.passport')}: {student.passportNumber}
              </p>
            </div>
          </div>

          <ModalCloseButton onClose={handleDismiss} ariaLabel={t('common.close')} />
        </div>

        {/* Quick Action Bar */}
        <div className="bg-sky-50 px-5 py-2.5 border-b border-sky-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-900">
              {student.roomNumber
                ? (student.bedIdentifier || student.bedNumber)
                  ? t('student.roomBedFormat', {
                      room: student.roomNumber,
                      bed: String(student.bedIdentifier || student.bedNumber),
                    })
                  : `${t('common.room')} ${student.roomNumber}`
                : t('student.awaitingRoom')}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              {t('payments.paidUntilLabel')}:{' '}
              <strong className="text-slate-900 tabular-nums">
                {formatShortDateDisplay(billingSummary.paidUntilDate)}
              </strong>
            </span>
            <PaymentExpiryBadge paidUntilDate={billingSummary.paidUntilDate} compact />
          </div>

          {role !== 'security' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowBillingEditor(true)}
                className="px-3 py-1.5 bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#C6A15B]" /> {t('billing.managePayments')}
              </button>
              <button
                type="button"
                onClick={handleQuickAccept}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> +1 {t('billing.monthShort')}
              </button>
              <button
                type="button"
                onClick={() => onOpenAddPaymentModal(student.id)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" /> {t('students.addPayment')}
              </button>
              <button
                type="button"
                onClick={() => onOpenTransferModal(student.id)}
                className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />{' '}
                {student.roomId ? t('students.transferBed') : t('students.assignBed')}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title={t('students.deleteResident')}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('common.delete')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Navigation Tabs */}
        <div className="border-b border-slate-200 bg-white px-5 flex gap-4 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile' ? 'border-[#C6A15B] text-[#101C32]' : 'border-transparent hover:text-slate-900'
            }`}
          >
            👤 {t('students.profileInfo')}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'payments' ? 'border-[#C6A15B] text-[#101C32]' : 'border-transparent hover:text-slate-900'
            }`}
          >
            💳 {t('students.paymentHistory')} ({stdPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'contract' ? 'border-[#C6A15B] text-[#101C32]' : 'border-transparent hover:text-slate-900'
            }`}
          >
            📄 {t('nav.contracts')}
          </button>
          <button
            onClick={() => setActiveTab('discipline')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'discipline' ? 'border-[#C6A15B] text-[#101C32]' : 'border-transparent hover:text-slate-900'
            }`}
          >
            ⚠ {t('discipline.title')} ({totalPenaltyPoints})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider text-[10px]">
                  {t('students.modal.personal')}
                </h4>
                <p><strong>{t('students.fullName')}:</strong> {student.fullName}</p>
                <p><strong>{t('students.phone')}:</strong> {student.phone}</p>
                <p><strong>{t('students.modal.birthDate')}:</strong> {formatDate(student.birthDate)}</p>
                <p><strong>{t('students.passport')}:</strong> {student.passportNumber}</p>
                <p><strong>{t('students.address')}:</strong> {student.permanentAddress}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider text-[10px]">
                  {t('students.modal.education')}
                </h4>
                <p><strong>{t('students.university')}:</strong> {student.university}</p>
                <p><strong>{t('students.faculty')}:</strong> {student.faculty}</p>
                {student.degreeLevel && <p><strong>{t('app.degreeLevel') || 'Ta’lim darajasi'}:</strong> {student.degreeLevel}</p>}
                <p><strong>{t('students.course')}:</strong> {typeof student.course === 'number' ? `${student.course}-${t('students.course').toLowerCase()}` : student.course} ({student.group})</p>
                <p><strong>{t('students.parentPhone')}:</strong> {student.parentPhone}</p>
              </div>

              {canManageCredentials && (
                <div className="sm:col-span-2 bg-[#101C32]/5 p-4 rounded-xl border border-[#C6A15B]/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C6A15B]/25 pb-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#B5893F]" />
                      <h4 className="font-extrabold text-[#101C32] uppercase tracking-wider text-[10px]">
                        {t('students.cabinetCredentials')}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleResetPassword()}
                      disabled={isResettingPassword}
                      className="px-2.5 py-1.5 bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#C6A15B] ${isResettingPassword ? 'animate-spin' : ''}`} />
                      <span>
                        {student.tempPassword ? t('students.resetPassword') : t('students.generatePassword')}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold text-slate-500">
                          {t('applications.tempLoginLabel')}
                        </div>
                        <div className="font-mono font-bold text-slate-900 text-xs truncate mt-0.5">
                          {student.tempLogin || student.phone}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCred(student.tempLogin || student.phone, 'detail-login')}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedKey === 'detail-login' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t('applications.copiedLabel')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{t('applications.copyCredentials')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold text-slate-500">
                          {t('applications.tempPasswordLabel')}
                        </div>
                        <div
                          className={`mt-0.5 text-xs truncate ${
                            student.tempPassword
                              ? 'font-mono font-extrabold text-[#101C32] tracking-wider'
                              : 'text-slate-400 font-medium'
                          }`}
                        >
                          {student.tempPassword || t('students.passwordNotSet')}
                        </div>
                      </div>
                      {student.tempPassword && (
                        <button
                          type="button"
                          onClick={() => handleCopyCred(student.tempPassword!, 'detail-pass')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedKey === 'detail-pass' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{t('applications.copiedLabel')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{t('applications.copyCredentials')}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span>
                  {t('billing.totalPaid')}: <strong className="text-emerald-600">{formatCurrency(billingSummary.totalPaid)}</strong>
                </span>
                <span>
                  {t('billing.remainingBalance')}:{' '}
                  <strong className={billingSummary.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {formatCurrency(billingSummary.remainingBalance)}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowStatementModal(true)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C6A15B]" />
                  {t('billing.printStatement')}
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200 text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="p-2.5">{t('payments.paymentDate')}</th>
                      <th className="p-2.5">{t('billing.itemLabel')}</th>
                      <th className="p-2.5 text-right">{t('billing.amountPaid')}</th>
                      <th className="p-2.5">{t('payments.method')}</th>
                      <th className="p-2.5">{t('payments.paidUntilLabel')}</th>
                      <th className="p-2.5">{t('billing.notes')}</th>
                      <th className="p-2.5">{t('payments.recordedBy')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stdPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400">
                          {t('common.noData')}
                        </td>
                      </tr>
                    ) : (
                      stdPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-semibold tabular-nums whitespace-nowrap">
                            {formatDateTimeCommaDisplay(p.paymentDate, p.paymentTime)}
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-semibold">
                            {formatPeriodLabel(p.periodMonth)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {formatMethodLabel(p.paymentMethod, language)}
                          </td>
                          <td className="p-2.5 whitespace-nowrap tabular-nums text-slate-700 font-semibold">
                            {formatShortDateDisplay(p.paidUntil)}
                          </td>
                          <td className="p-2.5 text-slate-500">{p.notes || '—'}</td>
                          <td className="p-2.5">{p.recordedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <p><strong>{t('contracts.number')}:</strong> {stdContract?.contractNumber || 'RC-2026/001'}</p>
              <p><strong>{t('contracts.createdAt')}:</strong> {formatDate(stdContract?.startDate || '2026-09-01')}</p>
              <p><strong>{t('contracts.period')}:</strong> {formatDate(stdContract?.endDate || '2027-06-30')}</p>
              <p>
                <strong>{t('common.status')}:</strong>{' '}
                <span className="text-emerald-600 font-bold uppercase">{t('contracts.status.active')}</span>
              </p>
            </div>
          )}

          {activeTab === 'discipline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {t('discipline.points')}:{' '}
                  <span className={totalPenaltyPoints > 20 ? 'text-rose-600' : 'text-amber-600'}>
                    {totalPenaltyPoints}
                  </span>
                </span>
                {role !== 'security' && (
                  <button
                    onClick={() => setShowViolationInput(!showViolationInput)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('discipline.addRecord')}
                  </button>
                )}
              </div>

              {role !== 'security' && showViolationInput && (
                <form onSubmit={handleAddViolation} className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-3">
                  <div>
                    <label className="block font-semibold text-rose-900 mb-1">{t('discipline.reason')}</label>
                    <input
                      type="text"
                      required
                      value={violationReason}
                      onChange={(e) => setViolationReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-rose-900 mb-1">{t('discipline.points')}</label>
                    <input
                      type="number"
                      required
                      value={penaltyPoints}
                      onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                      className="w-24 px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs"
                    />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-rose-700 text-white font-bold rounded-lg cursor-pointer">
                    {t('common.save')}
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {stdDiscipline.map((d) => (
                  <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{d.violationReason}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(d.date)} • {d.recordedBy}
                      </div>
                    </div>
                    <span className="font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded text-xs">
                      +{d.penaltyPoints}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showBillingEditor && (
        <S53_BillingEditorModal
          entityId={student.id}
          onClose={() => setShowBillingEditor(false)}
          onSaved={() => {
            setSuccessToast(t('billing.savedToast'));
            setTimeout(() => setSuccessToast(null), 4000);
          }}
        />
      )}

      {showStatementModal && (
        <PaymentStatementModal
          isOpen={showStatementModal}
          onClose={() => setShowStatementModal(false)}
          subject={{
            fullName: student.fullName,
            phone: student.phone,
            passportNumber: student.passportNumber,
            referenceNumber: stdContract?.contractNumber || student.applicationId,
            roomLabel:
              student.roomNumber && (student.bedIdentifier || student.bedNumber)
                ? t('student.roomBedFormat', {
                    room: student.roomNumber,
                    bed: String(student.bedIdentifier || student.bedNumber),
                  })
                : student.roomNumber
                ? `${t('common.room')} ${student.roomNumber}`
                : t('student.awaitingRoom'),
            floor: student.floor,
            roomTypeLabel: billingSummary.roomType ? t(`rooms.${billingSummary.roomType}`) : undefined,
            capacity: billingSummary.capacity,
          }}
          summary={billingSummary}
          transactions={stdPayments}
        />
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        title={t('students.confirmDeleteTitle')}
        badgeText={student.fullName}
        description={t('students.confirmDeleteDesc', { name: student.fullName })}
        detailNote={
          student.roomNumber
            ? t('students.confirmDeleteBedRelease', {
                room: student.roomNumber,
                bed: String(student.bedIdentifier || student.bedNumber || '—'),
              })
            : t('students.confirmDeleteNoBed')
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
