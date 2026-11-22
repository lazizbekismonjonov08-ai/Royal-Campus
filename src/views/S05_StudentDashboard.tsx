import React from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { BedDouble, Calendar, CreditCard, FileText, CheckCircle } from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (view: string) => void;
}

export const S05_StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { students, activeStudentId } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();

  const student = students.find((s) => s.id === activeStudentId) || students[0];

  if (!student) {
    return <div className="p-6 text-center text-slate-500">{t('student.notFound')}</div>;
  }

  const isDebt = student.debtAmount > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="bg-[#101C32] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#C6A15B]/30 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block bg-[#C6A15B]/20 text-[#C6A15B] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-[#C6A15B]/40">
            {t('student.portalBadge')}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-[1.15]">
            {t('student.welcome', { name: student.fullName })} 👋
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {student.university} • {student.course}-{t('common.course')} ({student.group})
          </p>
        </div>

        <div className="bg-[#1A2D4F] border border-[#C6A15B]/30 p-4 rounded-2xl flex items-center gap-4 text-xs shadow-xs">
          <div>
            <div className="text-slate-300 text-[10px]">{t('student.residenceRoom')}</div>
            <div className="text-lg font-bold text-[#C6A15B]">
              {student.roomNumber ? `${t('common.room')} ${student.roomNumber}` : t('beds.available')}
            </div>
            <div className="text-[10px] text-slate-400">
              {student.floor}-{t('common.floor')} • {student.bedNumber}-{t('common.bed')}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Room Info */}
        <div
          onClick={() => onNavigate('S07_StudentRoom')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('student.myRoom')}</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {student.roomNumber ? `${t('common.room')} ${student.roomNumber}` : '---'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {student.roomType ? student.roomType.toUpperCase() : '---'} {t('contracts.tariff')} • {formatCurrency(student.monthlyTariff)}
          </div>
        </div>

        {/* Payment Status */}
        <div
          onClick={() => onNavigate('S08_StudentPayments')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('student.paymentStatus')}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDebt ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold ${isDebt ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isDebt ? formatCurrency(student.debtAmount) : t('student.noDebt')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t('student.paidUntil')}: <span className="font-semibold">{formatDate(student.paidUntil)}</span>
          </div>
        </div>

        {/* Next Payment Date */}
        <div
          onClick={() => onNavigate('S08_StudentPayments')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('student.nextPaymentDue')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{formatDate(student.nextPaymentDueDate)}</div>
          <div className="text-xs text-slate-500 mt-1">{t('student.monthlyTariff')}</div>
        </div>

        {/* Contract */}
        <div
          onClick={() => onNavigate('S09_StudentContract')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('nav.contracts')}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> {t('common.active')}
          </div>
          <div className="text-xs text-slate-500 mt-1">{t('student.downloadContract')}</div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('dashboard.quickActions')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <button
            onClick={() => onNavigate('S06_StudentProfile')}
            className="p-3 bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-800 font-semibold rounded-xl border border-slate-200 text-center transition-colors cursor-pointer"
          >
            👤 {t('studentProfile.personalInfo')}
          </button>
          <button
            onClick={() => onNavigate('S07_StudentRoom')}
            className="p-3 bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-800 font-semibold rounded-xl border border-slate-200 text-center transition-colors cursor-pointer"
          >
            🛏 {t('student.myRoom')}
          </button>
          <button
            onClick={() => onNavigate('S08_StudentPayments')}
            className="p-3 bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-800 font-semibold rounded-xl border border-slate-200 text-center transition-colors cursor-pointer"
          >
            💳 {t('studentPayments.history')}
          </button>
          <button
            onClick={() => onNavigate('S90_Issues')}
            className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold rounded-xl border border-amber-200 text-center transition-colors cursor-pointer"
          >
            🛠 {t('student.reportIssue')}
          </button>
        </div>
      </div>
    </div>
  );
};
