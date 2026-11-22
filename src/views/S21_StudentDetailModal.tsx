import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  ArrowRightLeft,
  Trash2,
  PlusCircle,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { ModalCloseButton } from '../components/ModalCloseButton';
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
    deleteStudent,
    payments,
    contracts,
    disciplineRecords,
    addDisciplineRecord,
    role,
    handleAcceptPayment,
  } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'contract' | 'discipline'>('profile');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showViolationInput, setShowViolationInput] = useState(false);
  const [violationReason, setViolationReason] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(10);

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  const student = students.find((s) => s.id === studentId);

  if (!student) return null;

  const stdPayments = payments.filter((p) => p.studentId === student.id);
  const stdContract = contracts.find((c) => c.studentId === student.id);
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
    handleAcceptPayment(student.id, student.monthlyTariff);
    setSuccessToast(`✅ ${student.fullName} uchun ${formatCurrency(student.monthlyTariff)} to‘lov qabul qilindi va keyingi to‘lov sanasi 1 oyga surildi!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleDeleteStudent = () => {
    if (window.confirm(`${t('common.delete')} ${student.fullName}?`)) {
      deleteStudent(student.id);
      onClose();
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
                ? `${t('common.room')} ${student.roomNumber} (${t('rooms.bed', { bedNumber: student.bedNumber || 1 })})`
                : t('beds.available')}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              {t('students.paidUntil')}: {formatDate(student.paidUntil)}
            </span>
          </div>

          {role !== 'security' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleQuickAccept}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                title="To‘lovni darhol qabul qilish va keyingi to‘lov muddatini 1 oyga surish"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> To‘lov qabul qilish (+1 oy)
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
                onClick={handleDeleteStudent}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title={t('common.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
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
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span>{t('students.paidUntil')}: <strong>{formatDate(student.paidUntil)}</strong></span>
                <span>
                  {t('students.debt')}:{' '}
                  <strong className={student.debtAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {formatCurrency(student.debtAmount)}
                  </strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">{t('common.date')}</th>
                      <th className="p-2.5">{t('payments.period')}</th>
                      <th className="p-2.5">{t('common.amount')}</th>
                      <th className="p-2.5">{t('payments.method')}</th>
                      <th className="p-2.5">{t('payments.recordedBy')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stdPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2.5 font-semibold">{formatDate(p.paymentDate)}</td>
                        <td className="p-2.5">{p.periodMonth}</td>
                        <td className="p-2.5 font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                        <td className="p-2.5 capitalize">{t(`payments.method.${p.paymentMethod}`) || p.paymentMethod}</td>
                        <td className="p-2.5">{p.recordedBy}</td>
                      </tr>
                    ))}
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
    </div>
  );
};
