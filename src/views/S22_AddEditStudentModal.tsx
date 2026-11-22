import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { UserPlus, Save, AlertCircle } from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { formatPassportNumber, isValidPassportNumber, getPassportValidationError } from '../utils/maskUtils';
import { BirthDateInput } from '../components/BirthDateInput';
import { validateCalendarDate } from '../utils/dateValidation';
import { DEGREE_LEVEL_OPTIONS, COURSE_OPTIONS_BY_DEGREE } from './S03_OnlineApplication';
import { RoomType, ROOM_TYPE_ORDER } from '../types';

interface AddEditProps {
  onClose: () => void;
}

export const S22_AddEditStudentModal: React.FC<AddEditProps> = ({ onClose }) => {
  const { addStudent, settings } = useDorm();
  const { t, formatCurrency } = useI18n();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '+998 90 ',
    birthDate: '2004-05-10',
    passportNumber: 'FA',
    university: 'TATU',
    faculty: 'Axborot Xavfsizligi',
    degreeLevel: 'Bakalavr',
    course: 1 as number | string,
    group: '101-AX',
    parentPhone: '+998 91 ',
    permanentAddress: 'Samarqand v., Urgut t.',
    roomType: 'comfort' as RoomType,
    monthlyTariff: settings.roomTariffs.comfort,
  });

  const [passportError, setPassportError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const hasUnsavedChanges = formData.fullName.trim().length > 0;

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
    hasUnsavedChanges,
    confirmDiscardMessage: `${t('common.cancel')}?`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    const pErr = getPassportValidationError(formData.passportNumber);
    if (pErr) {
      setPassportError(pErr);
      return;
    }

    const bRes = validateCalendarDate(formData.birthDate, { isTouched: true });
    if (!bRes.isValid) {
      setBirthDateError(bRes.error || 'Tug‘ilgan sana noto‘g‘ri kiritildi');
      return;
    }

    addStudent({
      ...formData,
      passportNumber: formData.passportNumber.trim().toUpperCase(),
    });
    onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-student-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col relative"
      >
        <ModalHeader
          icon={<UserPlus className="w-5 h-5 text-sky-600" />}
          title={<span id="add-student-modal-title">{t('students.modal.addTitle')}</span>}
          subtitle={t('students.subtitle')}
          onClose={handleDismiss}
          ariaLabel={t('common.close')}
        />

        <div className="overflow-y-auto flex-1 pr-0.5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('students.fullName')}</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('students.phone')}</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                />
              </div>
              <BirthDateInput
                label="Tug‘ilgan sana"
                required
                value={formData.birthDate}
                error={birthDateError || undefined}
                onChange={(formatted, _iso, isValid) => {
                  setFormData({ ...formData, birthDate: formatted });
                  if (birthDateError && isValid) {
                    setBirthDateError(null);
                  }
                }}
              />
            </div>

            <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('students.passport')} (XX1234567)</label>
                <input
                  type="text"
                  required
                  placeholder="AA1234567"
                  maxLength={9}
                  value={formData.passportNumber}
                  onChange={(e) => {
                    const formatted = formatPassportNumber(e.target.value);
                    setFormData({ ...formData, passportNumber: formatted });
                    setPassportError(getPassportValidationError(formatted));
                  }}
                  onBlur={() => {
                    setPassportError(getPassportValidationError(formData.passportNumber));
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 uppercase font-mono tracking-wider transition-colors ${
                    passportError
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-200 focus:border-rose-500'
                      : isValidPassportNumber(formData.passportNumber)
                      ? 'border-emerald-400 bg-emerald-50/30 text-slate-900 focus:ring-emerald-200 focus:border-emerald-500'
                      : 'border-slate-200 focus:ring-[#C6A15B]'
                  }`}
                />
                {passportError && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                    <span>{passportError}</span>
                  </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('students.university')}</label>
                <input
                  type="text"
                  required
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('students.faculty')}</label>
                <input
                  type="text"
                  required
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('app.degreeLevel') || 'Ta’lim darajasi'}</label>
                <select
                  value={formData.degreeLevel}
                  onChange={(e) => {
                    const dl = e.target.value;
                    const courses = COURSE_OPTIONS_BY_DEGREE[dl] || COURSE_OPTIONS_BY_DEGREE['Bakalavr'];
                    setFormData({ ...formData, degreeLevel: dl, course: courses[0]?.value ?? 1 });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {DEGREE_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('students.course')}</label>
                <select
                  value={String(formData.course)}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = Number(val);
                    setFormData({ ...formData, course: !isNaN(num) && val.trim() !== '' && !val.includes(' ') ? num : val });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {(COURSE_OPTIONS_BY_DEGREE[formData.degreeLevel] || COURSE_OPTIONS_BY_DEGREE['Bakalavr']).map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('students.group')}</label>
                <input
                  type="text"
                  required
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('students.tariff')}</label>
                <select
                  value={formData.roomType}
                  onChange={(e) => {
                    const nextType = e.target.value as RoomType;
                    setFormData({
                      ...formData,
                      roomType: nextType,
                      monthlyTariff: settings.roomTariffs[nextType] ?? 1200000,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {ROOM_TYPE_ORDER.map((typeOption) => (
                    <option key={typeOption} value={typeOption}>
                      {t(`rooms.${typeOption}`)} ({formatCurrency(settings.roomTariffs[typeOption])})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('students.parentPhone')}</label>
              <input
                type="text"
                required
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('students.address')}</label>
              <input
                type="text"
                required
                value={formData.permanentAddress}
                onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white font-bold rounded-xl flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#C6A15B]" /> {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
