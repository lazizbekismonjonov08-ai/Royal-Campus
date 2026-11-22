import React from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { User, Phone, GraduationCap, FileCheck } from 'lucide-react';

export const S06_StudentProfile: React.FC = () => {
  const { students, activeStudentId } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();
  const student = students.find((s) => s.id === activeStudentId) || students[0];

  if (!student) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#101C32] text-[#C6A15B] border-2 border-[#C6A15B]/50 font-bold text-2xl flex items-center justify-center shadow-md shrink-0">
            {student.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#101C32] tracking-tight">
              {student.fullName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ID: {student.id} • {t('students.passport')}: {student.passportNumber}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Personal Info */}
          <div>
            <h3 className="text-xs font-bold text-[#101C32] uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#C6A15B]" /> {t('studentProfile.personalInfo')}
            </h3>
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">{t('studentProfile.birthDate')}</span>
                <span className="font-semibold text-slate-900">{formatDate(student.birthDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('studentProfile.phone')}</span>
                <span className="font-semibold text-slate-900">{student.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('studentProfile.permanentAddress')}</span>
                <span className="font-semibold text-slate-900">{student.permanentAddress}</span>
              </div>
            </div>
          </div>

          {/* Education Info */}
          <div>
            <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> {t('studentProfile.eduInfo')}
            </h3>
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">{t('studentProfile.university')}</span>
                <span className="font-semibold text-slate-900">{student.university}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('studentProfile.faculty')}</span>
                <span className="font-semibold text-slate-900">{student.faculty}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('studentProfile.courseGroup')}</span>
                <span className="font-semibold text-slate-900">{student.course}-{t('common.course')} ({student.group})</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" /> {t('studentProfile.parentPhone')}
            </h3>
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">{student.emergencyContactName || t('app.parentPhone')}:</span>
                <span className="font-semibold text-slate-900">{student.parentPhone}</span>
              </div>
            </div>
          </div>

          {/* Accommodation info */}
          <div>
            <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4" /> {t('studentProfile.roomResidence')}
            </h3>
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">{t('common.room')}:</span>
                <span className="font-semibold text-slate-900">
                  {student.roomNumber
                    ? `${t('common.room')} ${student.roomNumber} (${student.floor}-${t('common.floor')})`
                    : t('beds.available')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('studentProfile.tariff')}</span>
                <span className="font-semibold text-slate-900">
                  {student.bedNumber}-{t('common.bed')} ({student.roomType?.toUpperCase()}) • {formatCurrency(student.monthlyTariff)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
