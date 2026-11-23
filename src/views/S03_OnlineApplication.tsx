import React, { useState, useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { RoomType, ROOM_TYPE_ORDER, ROOM_TYPE_CAPACITY } from '../types';
import { CheckCircle2, Upload, Send, ArrowLeft, X, FileText, AlertCircle, Sun, Moon } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { formatPassportNumber, isValidPassportNumber, getPassportValidationError } from '../utils/maskUtils';
import { BirthDateInput } from '../components/BirthDateInput';
import { ResidenceContractModal } from '../components/ResidenceContractModal';
import { validateCalendarDate } from '../utils/dateValidation';

interface PublicAppProps {
  onSubmitted: () => void;
  onBackToLogin: () => void;
  initialRoomType?: RoomType;
}

interface UploadedFileState {
  file: File | null;
  previewUrl: string | null;
  error: string | null;
}

interface FormErrors {
  phone?: string;
  parentPhone?: string;
  passportNumber?: string;
  fullName?: string;
  birthDate?: string;
  preferredRoomType?: string;
  consent?: string;
}

export const DEGREE_LEVEL_OPTIONS = [
  { value: 'Bakalavr', label: 'Bakalavr' },
  { value: 'Magistratura', label: 'Magistratura' },
  { value: 'Doktorantura (PhD / DSc)', label: 'Doktorantura (PhD / DSc)' },
  { value: 'Boshqa / Malaka oshirish', label: 'Boshqa / Malaka oshirish' },
];

export const COURSE_OPTIONS_BY_DEGREE: Record<string, { value: number | string; label: string }[]> = {
  'Bakalavr': [
    { value: 1, label: '1-bosqich' },
    { value: 2, label: '2-bosqich' },
    { value: 3, label: '3-bosqich' },
    { value: 4, label: '4-bosqich' },
  ],
  'Magistratura': [
    { value: 1, label: '1-bosqich (Magistratura 1-kurs)' },
    { value: 2, label: '2-bosqich (Magistratura 2-kurs)' },
  ],
  'Doktorantura (PhD / DSc)': [
    { value: 1, label: '1-bosqich (Tayanch doktorantura)' },
    { value: 2, label: '2-bosqich' },
    { value: 3, label: '3-bosqich' },
  ],
  'Boshqa / Malaka oshirish': [
    { value: 'Tayyorlov kursi', label: 'Tayyorlov kursi' },
    { value: 'Tadqiqotchi / Stajyor', label: 'Tadqiqotchi / Stajyor' },
    { value: 'Malaka oshirish', label: 'Malaka oshirish' },
  ],
};

export const S03_OnlineApplication: React.FC<PublicAppProps> = ({
  onSubmitted,
  onBackToLogin,
  initialRoomType,
}) => {
  const { submitApplication, settings } = useDorm();
  const { t, language } = useI18n();
  const [submitted, setSubmitted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  // Sync theme with Landing Page preference and allow in-view toggling
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('royal-campus-landing-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'light';
    }
  });
  const isLight = theme === 'light';

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('royal-campus-landing-theme', next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Preserve room type from landing CTA or let student pick among the 5 active tiers
  const [preferredRoomType, setPreferredRoomType] = useState<RoomType | ''>(initialRoomType || '');

  useEffect(() => {
    setPreferredRoomType(initialRoomType || '');
  }, [initialRoomType]);

  // Form text inputs
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    birthDate: '',
    passportNumber: '',
    university: '',
    faculty: '',
    degreeLevel: 'Bakalavr',
    course: 1 as number | string,
    group: '',
    parentPhone: '',
    permanentAddress: '',
  });

  const handleDegreeChange = (degree: string) => {
    const courses = COURSE_OPTIONS_BY_DEGREE[degree] || COURSE_OPTIONS_BY_DEGREE['Bakalavr'];
    setFormData((prev) => ({
      ...prev,
      degreeLevel: degree,
      course: courses[0]?.value ?? 1,
    }));
  };

  const getDegreeLabel = (value: string): string => {
    switch (value) {
      case 'Bakalavr':
        return t('app.degreeBachelor');
      case 'Magistratura':
        return t('app.degreeMaster');
      case 'Doktorantura (PhD / DSc)':
        return t('app.degreePhd');
      case 'Boshqa / Malaka oshirish':
        return t('app.degreeOther');
      default:
        return value;
    }
  };

  const getCourseLabel = (degree: string, optValue: number | string): string => {
    if (degree === 'Magistratura') {
      if (optValue === 1) return t('app.courseMaster1');
      if (optValue === 2) return t('app.courseMaster2');
    }
    if (degree === 'Doktorantura (PhD / DSc)' && optValue === 1) {
      return t('app.coursePhd1');
    }
    if (degree === 'Boshqa / Malaka oshirish') {
      if (optValue === 'Tayyorlov kursi') return t('app.coursePrep');
      if (optValue === 'Tadqiqotchi / Stajyor') return t('app.courseResearcher');
      if (optValue === 'Malaka oshirish') return t('app.courseAdvanced');
    }
    if (typeof optValue === 'number') {
      return `${t('app.courseStagePrefix')}${optValue}${t('app.courseStageSuffix')}`;
    }
    return String(optValue);
  };

  const currentCourseOptions = COURSE_OPTIONS_BY_DEGREE[formData.degreeLevel] || COURSE_OPTIONS_BY_DEGREE['Bakalavr'];

  // Form validation errors state
  const [errors, setErrors] = useState<FormErrors>({});

  // File Upload states
  const [frontDoc, setFrontDoc] = useState<UploadedFileState>({ file: null, previewUrl: null, error: null });
  const [backDoc, setBackDoc] = useState<UploadedFileState>({ file: null, previewUrl: null, error: null });

  // Regex patterns
  const phoneRegex = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;

  // Validate form fields before submit
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let hasFileError = false;

    // Validate Full Name (required)
    if (!formData.fullName.trim() || formData.fullName.trim().split(/\s+/).length < 2) {
      newErrors.fullName = t('app.errFullName');
    }

    // Validate Student Phone (required: +998 XX XXX XX XX)
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!phoneRegex.test(formData.phone.trim()) && !/^\+998\d{9}$/.test(cleanPhone)) {
      newErrors.phone = t('app.errPhone');
    }

    // Validate Parent Phone only when provided (optional field)
    if (formData.parentPhone.trim()) {
      const cleanParentPhone = formData.parentPhone.replace(/\s+/g, '');
      if (!phoneRegex.test(formData.parentPhone.trim()) && !/^\+998\d{9}$/.test(cleanParentPhone)) {
        newErrors.parentPhone = t('app.errParentPhone');
      }
    }

    // Validate Passport Series and Number strictly (XX1234567)
    const passportErr = getPassportValidationError(formData.passportNumber, language);
    if (passportErr) {
      newErrors.passportNumber = passportErr;
    }

    // Validate Birth Date calendar rules (format DD.MM.YYYY, leap year, month limit)
    const birthDateValidation = validateCalendarDate(formData.birthDate, {
      isTouched: true,
      language,
    });
    if (!birthDateValidation.isValid) {
      newErrors.birthDate = birthDateValidation.error || t('app.errBirthDate');
    }

    // Validate Room Category selection
    if (!preferredRoomType) {
      newErrors.preferredRoomType = t('app.errRoomType');
    }

    // Validate both required passport documents
    if (!frontDoc.file) {
      setFrontDoc((prev) => ({ ...prev, error: t('app.errFileRequired') }));
      hasFileError = true;
    }
    if (!backDoc.file) {
      setBackDoc((prev) => ({ ...prev, error: t('app.errFileRequired') }));
      hasFileError = true;
    }

    // Validate contract & house rules consent
    if (!agreedToTerms) {
      newErrors.consent = t('app.errConsentRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !hasFileError;
  };

  const handleFileChange = (
    file: File | undefined,
    setDocState: React.Dispatch<React.SetStateAction<UploadedFileState>>
  ) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setDocState({ file: null, previewUrl: null, error: t('app.errFileSize') });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setDocState({ file: null, previewUrl: null, error: t('app.errFileType') });
      return;
    }

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setDocState({ file, previewUrl, error: null });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (
    e: React.DragEvent,
    setDocState: React.Dispatch<React.SetStateAction<UploadedFileState>>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0], setDocState);
    }
  };

  const removeFile = (
    docState: UploadedFileState,
    setDocState: React.Dispatch<React.SetStateAction<UploadedFileState>>
  ) => {
    if (docState.previewUrl) URL.revokeObjectURL(docState.previewUrl);
    setDocState({ file: null, previewUrl: null, error: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !preferredRoomType) return;

    submitApplication({
      ...formData,
      preferredRoomType,
      passportNumber: formData.passportNumber.trim(),
      passportFrontUrl: frontDoc.previewUrl || undefined,
      passportBackUrl: backDoc.previewUrl || undefined,
    });
    setSubmitted(true);
  };

  const formatPlainSpaceNumber = (amount: number) =>
    amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const selectedRoomLabel = preferredRoomType
    ? `${t(`rooms.${preferredRoomType}`)} (${ROOM_TYPE_CAPACITY[preferredRoomType]} ${t('rooms.bedsTotal')}${
        preferredRoomType.endsWith('_plus') ? `, ${t('rooms.panoramic')}` : ''
      })`
    : '';

  const selectedMonthlyTariff = preferredRoomType ? settings.roomTariffs[preferredRoomType] : undefined;
  const selectedMonthlyTariffText =
    typeof selectedMonthlyTariff === 'number' ? formatPlainSpaceNumber(selectedMonthlyTariff) : '';

  const liveContractStudentData = {
    fullName: formData.fullName,
    birthDate: formData.birthDate,
    phone: formData.phone,
    passportNumber: formData.passportNumber,
    university: formData.university,
    faculty: formData.faculty,
    course: getCourseLabel(formData.degreeLevel, formData.course),
    group: formData.group,
    roomTypeLabel: selectedRoomLabel,
    monthlyTariffText: selectedMonthlyTariffText,
  };

  const inputBaseClass = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
    : 'bg-[#0E1729] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:bg-[#132038]';

  const labelClass = `block font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`;
  const requiredStar = <span className="text-rose-500 font-bold ml-0.5">*</span>;

  if (submitted) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
          isLight ? 'bg-[#F8FAFC]' : 'bg-[#0A101D]'
        }`}
      >
        <div
          className={`rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border animate-in zoom-in-95 duration-200 ${
            isLight
              ? 'bg-white border-slate-200 text-[#0A101D]'
              : 'bg-[#101C32] border-[#C6A15B]/35 text-white'
          }`}
        >
          <div
            className={`w-16 h-16 border-2 border-[#C6A15B] text-[#C6A15B] rounded-full flex items-center justify-center mx-auto mb-4 ${
              isLight ? 'bg-[#F7F5F0]' : 'bg-[#0E1729]'
            }`}
          >
            <CheckCircle2 className="w-10 h-10 text-[#C6A15B]" />
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
            {t('app.successTitle')}
          </h2>
          <p className={`text-xs mt-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {t('app.successDesc')}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={onSubmitted}
              className="w-full py-2.5 bg-gradient-to-r from-[#C6A15B] to-[#EAD096] hover:brightness-110 text-[#0A101D] font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {t('app.checkStatus')}
            </button>
            <button
              onClick={onBackToLogin}
              className={`w-full py-2.5 font-semibold text-xs rounded-xl transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-[#16233B] hover:bg-[#1E2F4D] text-slate-200'
              }`}
            >
              {t('app.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderUploadZone = (
    labelKey: string,
    docState: UploadedFileState,
    setDocState: React.Dispatch<React.SetStateAction<UploadedFileState>>,
    inputId: string
  ) => (
    <div className="space-y-1.5 min-w-0">
      <span className={`font-semibold block text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
        {t(labelKey)}
        {requiredStar}
      </span>

      {!docState.file ? (
        <label
          htmlFor={inputId}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, setDocState)}
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
            docState.error
              ? isLight
                ? 'border-rose-400 bg-rose-50/50'
                : 'border-rose-500/70 bg-rose-950/25'
              : isLight
              ? 'border-slate-300 hover:bg-slate-50 hover:border-[#C6A15B]/60'
              : 'border-slate-700 bg-[#0E1729]/60 hover:bg-[#16233B] hover:border-[#C6A15B]/50'
          }`}
        >
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0], setDocState)}
          />
          <Upload className="w-6 h-6 text-[#C6A15B]" />
          <span className={`text-xs font-medium leading-snug ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {t('app.dropzonePrompt')}
          </span>
          <span className="text-[11px] text-slate-400 leading-snug">
            {t('app.dropzoneHint')}
          </span>
        </label>
      ) : (
        <div
          className={`relative border rounded-2xl p-3 flex items-center justify-between gap-3 ${
            isLight
              ? 'border-slate-200 bg-slate-50'
              : 'border-slate-700 bg-[#0E1729]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {docState.previewUrl ? (
              <img
                src={docState.previewUrl}
                alt="Preview"
                className={`w-12 h-12 object-cover rounded-lg border shrink-0 ${
                  isLight ? 'border-slate-200' : 'border-slate-700'
                }`}
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-sky-500/15 text-[#C6A15B] flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                {docState.file.name}
              </p>
              <p className="text-[10px] text-slate-400">
                {(docState.file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeFile(docState, setDocState)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {docState.error && (
        <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{docState.error}</span>
        </p>
      )}
    </div>
  );

  return (
    <div
      className={`min-h-screen py-5 sm:py-8 px-3 sm:px-4 flex justify-center items-start font-sans relative overflow-x-hidden transition-colors duration-300 ${
        isLight ? 'bg-[#F8FAFC]' : 'bg-[#0A101D]'
      }`}
    >
      {/* Background Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#C6A15B]/10 rounded-full blur-3xl pointer-events-none" />
      <div
        className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isLight ? 'bg-[#C6A15B]/10' : 'bg-[#1A2D4F]/50'
        }`}
      />

      <div
        className={`w-full max-w-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-9 border relative z-10 transition-colors duration-300 ${
          isLight
            ? 'bg-white border-slate-200 shadow-xl'
            : 'bg-[#101C32] border-slate-800 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-start sm:items-center justify-between border-b pb-5 mb-6 gap-2.5 sm:gap-4 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <BrandLogo variant="emblem" size="lg" className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                <h1
                  className={`text-base sm:text-lg font-bold tracking-wider uppercase leading-tight ${
                    isLight ? 'text-[#0A101D]' : 'text-white'
                  }`}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {t('brand.name')}
                </h1>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border whitespace-nowrap ${
                    isLight
                      ? 'bg-[#C6A15B]/12 text-[#9A7432] border-[#C6A15B]/35'
                      : 'bg-[#162644] text-[#C6A15B] border-[#C6A15B]/40'
                  }`}
                >
                  {t('app.title')}
                </span>
              </div>
              <p className={`text-xs mt-1 leading-snug tracking-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('app.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSwitcher variant={isLight ? 'light' : 'dark'} />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              title={isLight ? 'Dark Mode' : 'Light Mode'}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-[#C6A15B] text-[#0A101D] hover:bg-[#C6A15B]/10'
                  : 'bg-[#16233B]/80 border-slate-700/80 hover:border-[#C6A15B]/70 text-[#C6A15B] hover:bg-[#C6A15B]/10'
              }`}
            >
              {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'text-slate-500 hover:text-[#0A101D] hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t('common.back')}</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Info */}
          <div>
            <h3
              className={`text-xs font-bold uppercase tracking-wider mb-3.5 ${
                isLight ? 'text-[#0A101D]' : 'text-white'
              }`}
            >
              {t('app.personalSection')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  {t('app.fullName')}
                  {requiredStar}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('app.fullNamePlaceholder')}
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${
                    errors.fullName
                      ? isLight
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900'
                        : 'border-rose-500/70 bg-rose-950/30 text-rose-100'
                      : inputBaseClass
                  }`}
                />
                {errors.fullName && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {t('app.phone')}
                  {requiredStar}
                </label>
                <input
                  type="text"
                  required
                  placeholder="+998 90 999 88 77"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${
                    errors.phone
                      ? isLight
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900'
                        : 'border-rose-500/70 bg-rose-950/30 text-rose-100'
                      : inputBaseClass
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.phone}
                  </p>
                )}
              </div>

              <BirthDateInput
                label={t('app.birthDate')}
                required
                theme={isLight ? 'light' : 'dark'}
                language={language}
                formatHint={t('app.dateFormatHint')}
                value={formData.birthDate}
                error={errors.birthDate}
                onChange={(formatted, _isoDate, isValid) => {
                  setFormData((prev) => ({ ...prev, birthDate: formatted }));
                  if (errors.birthDate && isValid) {
                    setErrors((prev) => ({ ...prev, birthDate: undefined }));
                  }
                }}
              />

              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label className={`block font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {t('app.passport')}
                    {requiredStar}
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {t('app.passportFormatHint')}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="AA1234567"
                  maxLength={9}
                  value={formData.passportNumber}
                  onChange={(e) => {
                    const formatted = formatPassportNumber(e.target.value);
                    setFormData((prev) => ({ ...prev, passportNumber: formatted }));
                    const validationErr = getPassportValidationError(formatted, language);
                    setErrors((prev) => ({
                      ...prev,
                      passportNumber: validationErr || undefined,
                    }));
                  }}
                  onBlur={() => {
                    const validationErr = getPassportValidationError(formData.passportNumber, language);
                    setErrors((prev) => ({
                      ...prev,
                      passportNumber: validationErr || undefined,
                    }));
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 font-mono tracking-wider uppercase transition-colors ${
                    errors.passportNumber
                      ? isLight
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-200 focus:border-rose-500'
                        : 'border-rose-500/70 bg-rose-950/30 text-rose-100 focus:ring-rose-500/30 focus:border-rose-500'
                      : isValidPassportNumber(formData.passportNumber)
                      ? isLight
                        ? 'border-emerald-400 bg-emerald-50/30 text-slate-900 focus:ring-emerald-200 focus:border-emerald-500'
                        : 'border-emerald-500/70 bg-emerald-950/25 text-slate-100 focus:ring-emerald-500/30 focus:border-emerald-500'
                      : `${inputBaseClass} focus:ring-[#C6A15B]`
                  }`}
                />
                {errors.passportNumber && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.passportNumber}</span>
                  </p>
                )}
                {!errors.passportNumber && isValidPassportNumber(formData.passportNumber) && (
                  <p className="text-[11px] font-semibold text-emerald-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span>{t('app.passportValidMsg')}</span>
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t('app.parentPhone')}</label>
                <input
                  type="text"
                  placeholder="+998 91 333 22 11"
                  value={formData.parentPhone}
                  onChange={(e) => {
                    setFormData({ ...formData, parentPhone: e.target.value });
                    if (errors.parentPhone) setErrors({ ...errors, parentPhone: undefined });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${
                    errors.parentPhone
                      ? isLight
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900'
                        : 'border-rose-500/70 bg-rose-950/30 text-rose-100'
                      : inputBaseClass
                  }`}
                />
                {errors.parentPhone && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.parentPhone}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  {t('app.address')}
                  {requiredStar}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('app.addressPlaceholder')}
                  value={formData.permanentAddress}
                  onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${inputBaseClass}`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Education Info */}
          <div>
            <h3
              className={`text-xs font-bold uppercase tracking-wider mb-3.5 ${
                isLight ? 'text-[#0A101D]' : 'text-white'
              }`}
            >
              {t('app.eduSection')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  {t('app.university')}
                  {requiredStar}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('app.universityPlaceholder')}
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${inputBaseClass}`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t('app.faculty')}
                  {requiredStar}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('app.facultyPlaceholder')}
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${inputBaseClass}`}
                />
              </div>

              {/* 1. Ta’lim darajasi (Degree Level) */}
              <div>
                <label className={labelClass}>
                  {t('app.degreeLevel')}
                  {requiredStar}
                </label>
                <select
                  required
                  value={formData.degreeLevel}
                  onChange={(e) => handleDegreeChange(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${inputBaseClass}`}
                >
                  {DEGREE_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {getDegreeLabel(opt.value)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Dinamik va kengaytirilgan Bosqich (Kurs) ro‘yxati */}
              <div>
                <label className={labelClass}>
                  {t('app.course')}
                  {requiredStar}
                </label>
                <select
                  required
                  value={String(formData.course)}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = Number(val);
                    setFormData({
                      ...formData,
                      course: !isNaN(num) && val.trim() !== '' && !val.includes(' ') ? num : val,
                    });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${inputBaseClass}`}
                >
                  {currentCourseOptions.map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>
                      {getCourseLabel(formData.degreeLevel, opt.value)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>{t('app.group')}</label>
                <input
                  type="text"
                  placeholder={t('app.groupPlaceholder')}
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${inputBaseClass}`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  {t('app.roomLabel')}
                  {requiredStar}
                </label>
                <select
                  required
                  value={preferredRoomType}
                  onChange={(e) => {
                    setPreferredRoomType(e.target.value as RoomType | '');
                    if (errors.preferredRoomType) {
                      setErrors((prev) => ({ ...prev, preferredRoomType: undefined }));
                    }
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${
                    errors.preferredRoomType
                      ? isLight
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900'
                        : 'border-rose-500/70 bg-rose-950/30 text-rose-100'
                      : inputBaseClass
                  }`}
                >
                  <option value="">{t('app.roomSelectPlaceholder')}</option>
                  {ROOM_TYPE_ORDER.map((typeOption) => {
                    const price = settings.roomTariffs[typeOption];
                    return (
                      <option key={typeOption} value={typeOption}>
                        {t(`rooms.${typeOption}`)} ({ROOM_TYPE_CAPACITY[typeOption]} {t('rooms.bedsTotal')}
                        {typeOption.endsWith('_plus') ? ` · ${t('rooms.panoramic')}` : ''}) —{' '}
                        {formatPlainSpaceNumber(price)} UZS {t('common.perMonth')}
                      </option>
                    );
                  })}
                </select>
                {errors.preferredRoomType && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.preferredRoomType}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Document Uploads */}
          <div>
            <h3
              className={`text-xs font-bold uppercase tracking-wider mb-3.5 ${
                isLight ? 'text-[#0A101D]' : 'text-white'
              }`}
            >
              {t('app.passportDocs')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderUploadZone('app.frontPassport', frontDoc, setFrontDoc, 'front-doc-input')}
              {renderUploadZone('app.backPassport', backDoc, setBackDoc, 'back-doc-input')}
            </div>
          </div>

          {/* Contract & House Rules Consent */}
          <div className="space-y-1.5">
            <div
              className={`rounded-xl border p-3.5 transition-colors ${
                errors.consent
                  ? isLight
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-rose-500/70 bg-rose-950/25'
                  : isLight
                  ? 'border-slate-200 bg-slate-50/80'
                  : 'border-slate-800 bg-[#0E1729]/80'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAgreedToTerms(checked);
                    if (checked && errors.consent) {
                      setErrors((prev) => ({ ...prev, consent: undefined }));
                    }
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#C6A15B] accent-[#C6A15B] focus:ring-[#C6A15B] shrink-0 cursor-pointer"
                />
                <span className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {t('app.consentPrefix')}{' '}
                  <button
                    type="button"
                    onClick={() => setShowContractModal(true)}
                    className="font-semibold text-[#C6A15B] hover:underline underline-offset-4 cursor-pointer inline"
                  >
                    {t('app.consentLink')}
                  </button>
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </span>
              </label>
            </div>
            {errors.consent && (
              <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.consent}</span>
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!agreedToTerms}
            className={`w-full py-3.5 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              isLight
                ? 'bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#EAD096] hover:text-white'
                : 'bg-gradient-to-r from-[#C6A15B] to-[#EAD096] hover:brightness-110 text-[#0A101D] shadow-[#C6A15B]/20'
            }`}
          >
            <Send className={`w-4 h-4 ${isLight ? 'text-[#C6A15B]' : 'text-[#0A101D]'}`} />
            <span>{t('app.submitBtn')}</span>
          </button>
        </form>
      </div>

      {/* Residence Contract & Internal Rules Modal */}
      <ResidenceContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        onAccept={() => {
          setAgreedToTerms(true);
          setErrors((prev) => ({ ...prev, consent: undefined }));
          setShowContractModal(false);
        }}
        agreedToTerms={agreedToTerms}
        onToggleAgreed={(checked) => {
          setAgreedToTerms(checked);
          if (checked && errors.consent) {
            setErrors((prev) => ({ ...prev, consent: undefined }));
          }
        }}
        language={language}
        isLight={isLight}
        studentData={liveContractStudentData}
      />
    </div>
  );
};
