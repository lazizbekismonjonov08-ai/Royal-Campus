import React, { useState, useMemo, useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  UserPlus,
  Save,
  AlertCircle,
  BedDouble,
  CreditCard,
  CheckCircle2,
  KeyRound,
  Copy,
  Check,
  Building2,
  User,
  GraduationCap,
} from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { useModalDismiss } from '../hooks/useModalDismiss';
import {
  formatPassportNumber,
  isValidPassportNumber,
  getPassportValidationError,
} from '../utils/maskUtils';
import { BirthDateInput } from '../components/BirthDateInput';
import { validateCalendarDate } from '../utils/dateValidation';
import { DEGREE_LEVEL_OPTIONS, COURSE_OPTIONS_BY_DEGREE } from './S03_OnlineApplication';
import {
  RoomType,
  ROOM_TYPE_ORDER,
  ROOM_TYPE_CAPACITY,
  BILLING_PAYMENT_METHODS,
  BillingPaymentMethod,
} from '../types';
import {
  ACADEMIC_BILLING_MONTHS,
  addDaysToDateStr,
  ensureDateTimeValue,
  formatShortDateDisplay,
  getCurrentBillingPeriod,
  getCurrentLocalDateTime,
  normalizeSelectableMethod,
  safeAmount,
  toDateTimeLocalInputValue,
} from '../utils/billingUtils';
import { PaymentExpiryBadge } from '../components/PaymentExpiryBadge';
import { formatUzPhoneDisplay, normalizePhoneKey } from '../utils/authCrypto';

interface AddEditProps {
  onClose: () => void;
  onOpenAddPaymentModal?: (studentId: string) => void;
}

type PaymentToggleStatus = 'pending' | 'paid' | 'partial';

interface CreatedResidentResult {
  studentId: string;
  fullName: string;
  tempLogin: string;
  tempPassword: string;
  roomNumber?: string;
  bedLabel?: string;
  floor?: number;
  contractNumber?: string;
  monthlyTariff: number;
  initialPaidTotal: number;
  remainingBalance: number;
  paidUntil?: string;
}

const RESIDENTIAL_FLOORS = [2, 3, 4, 5];

export const S22_AddEditStudentModal: React.FC<AddEditProps> = ({
  onClose,
  onOpenAddPaymentModal,
}) => {
  const { rooms, settings, createResidentWithPlacement } = useDorm();
  const { t, language, formatCurrency } = useI18n();

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
    roomType: 'comfort' as RoomType,
  });

  // Placement state
  const [assignmentMode, setAssignmentMode] = useState<'now' | 'later'>(() => {
    const hasAnyFree = rooms.some(
      (r) =>
        r.status !== 'maintenance' &&
        r.status !== 'closed' &&
        (r.type as string) !== 'lux_plus' &&
        r.beds.some((b) => b.status === 'available')
    );
    return hasAnyFree ? 'now' : 'later';
  });

  const [selectedFloor, setSelectedFloor] = useState<number>(() => {
    const floorWithBed = RESIDENTIAL_FLOORS.find((fl) =>
      rooms.some(
        (r) =>
          r.floor === fl &&
          r.status !== 'maintenance' &&
          r.status !== 'closed' &&
          (r.type as string) !== 'lux_plus' &&
          r.beds.some((b) => b.status === 'available')
      )
    );
    return floorWithBed ?? 2;
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedBedId, setSelectedBedId] = useState<string>('');

  // Initial Billing state
  const [monthlyRateOverrideInput, setMonthlyRateOverrideInput] = useState<string>('');
  const [initialPeriod, setInitialPeriod] = useState<string>(() => getCurrentBillingPeriod());
  const [monthStatus, setMonthStatus] = useState<PaymentToggleStatus>('pending');
  const [monthPartialInput, setMonthPartialInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(() => getCurrentLocalDateTime());
  const [paidUntilDate, setPaidUntilDate] = useState<string>(() =>
    addDaysToDateStr(getCurrentLocalDateTime(), 30)
  );
  const [paidUntilManual, setPaidUntilManual] = useState<boolean>(false);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Validation & Submission state
  const [formError, setFormError] = useState<string | null>(null);
  const [passportError, setPassportError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [parentPhoneError, setParentPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createdResult, setCreatedResult] = useState<CreatedResidentResult | null>(null);
  const [copiedCred, setCopiedCred] = useState<'login' | 'pass' | null>(null);

  // Clean rooms helper (excluding legacy lux_plus or closed/maintenance)
  const activeRooms = useMemo(
    () =>
      rooms.filter(
        (r) =>
          r.status !== 'maintenance' &&
          r.status !== 'closed' &&
          (r.type as string) !== 'lux_plus'
      ),
    [rooms]
  );

  const floorAvailability = useMemo(() => {
    const map: Record<number, number> = { 2: 0, 3: 0, 4: 0, 5: 0 };
    activeRooms.forEach((r) => {
      if (map[r.floor] !== undefined) {
        map[r.floor] += r.beds.filter((b) => b.status === 'available').length;
      }
    });
    return map;
  }, [activeRooms]);

  const roomsOnFloor = useMemo(() => {
    return activeRooms
      .filter((r) => r.floor === selectedFloor)
      .sort((a, b) => {
        const na = Number(a.roomNumber);
        const nb = Number(b.roomNumber);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return a.roomNumber.localeCompare(b.roomNumber);
      });
  }, [activeRooms, selectedFloor]);

  // Keep selectedRoomId valid for chosen floor
  useEffect(() => {
    if (assignmentMode !== 'now') return;
    const currentRoomValid = roomsOnFloor.find(
      (r) => r.id === selectedRoomId && r.beds.some((b) => b.status === 'available')
    );
    if (!currentRoomValid) {
      const firstAvailRoom = roomsOnFloor.find((r) =>
        r.beds.some((b) => b.status === 'available')
      );
      setSelectedRoomId(firstAvailRoom?.id || '');
    }
  }, [assignmentMode, roomsOnFloor, selectedRoomId]);

  const selectedRoom = useMemo(
    () => activeRooms.find((r) => r.id === selectedRoomId),
    [activeRooms, selectedRoomId]
  );

  const availableBedsInRoom = useMemo(
    () => (selectedRoom ? selectedRoom.beds.filter((b) => b.status === 'available') : []),
    [selectedRoom]
  );

  // Keep selectedBedId valid for chosen room
  useEffect(() => {
    if (assignmentMode !== 'now') return;
    const stillValid = availableBedsInRoom.some((b) => b.id === selectedBedId);
    if (!stillValid) {
      setSelectedBedId(availableBedsInRoom[0]?.id || '');
    }
  }, [assignmentMode, availableBedsInRoom, selectedBedId]);

  const resolvedRoomType: RoomType = useMemo(() => {
    if (assignmentMode === 'now' && selectedRoom) {
      return selectedRoom.type;
    }
    return formData.roomType;
  }, [assignmentMode, selectedRoom, formData.roomType]);

  const defaultResolvedTariff = useMemo(() => {
    return (
      settings.roomTariffs?.[resolvedRoomType] ??
      selectedRoom?.priceMonthly ??
      1200000
    );
  }, [settings, resolvedRoomType, selectedRoom]);

  const parsedOverride =
    monthlyRateOverrideInput.trim() !== '' ? safeAmount(monthlyRateOverrideInput, 0) : 0;
  const resolvedMonthlyTariff = parsedOverride > 0 ? parsedOverride : defaultResolvedTariff;

  // Localized option helpers matching S03_OnlineApplication
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
    if (degree === 'Doktorantura (PhD / DSc)') {
      if (optValue === 1) return t('app.coursePhd1');
      if (optValue === 2) return t('app.coursePhd2');
      if (optValue === 3) return t('app.coursePhd3');
    }
    if (degree === 'Boshqa / Malaka oshirish') {
      if (optValue === 'Tayyorlov kursi') return t('app.coursePrep');
      if (optValue === 'Tadqiqotchi / Stajyor') return t('app.courseResearcher');
      if (optValue === 'Malaka oshirish') return t('app.courseAdvanced');
    }
    if (typeof optValue === 'number') {
      if (optValue >= 1 && optValue <= 5) {
        return t(`app.course${optValue}`);
      }
      return t('app.courseNth', { n: optValue });
    }
    return String(optValue);
  };

  const getMonthLabel = (period: string) => {
    const meta = ACADEMIC_BILLING_MONTHS.find((m) => m.period === period);
    if (!meta) return period;
    if (language === 'ru') return meta.ru;
    if (language === 'en') return meta.en;
    return meta.uz;
  };

  const monthPaidPreview = useMemo(() => {
    if (monthStatus === 'paid') return resolvedMonthlyTariff;
    if (monthStatus === 'partial') {
      return Math.min(resolvedMonthlyTariff, safeAmount(monthPartialInput));
    }
    return 0;
  }, [monthStatus, monthPartialInput, resolvedMonthlyTariff]);

  const initialPaidTotalPreview = monthPaidPreview;
  const activePeriodDuePreview =
    initialPeriod <= getCurrentBillingPeriod() || monthStatus !== 'pending'
      ? resolvedMonthlyTariff
      : 0;
  const remainingPreview = Math.max(0, activePeriodDuePreview - initialPaidTotalPreview);

  const hasUnsavedChanges =
    !createdResult &&
    (formData.fullName.trim().length > 0 ||
      formData.phone.trim().length > 0 ||
      formData.passportNumber.trim().length > 0 ||
      formData.university.trim().length > 0);

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
    hasUnsavedChanges,
    confirmDiscardMessage: `${t('common.cancel')}?`,
  });

  const handleCopyCred = (val: string, kind: 'login' | 'pass') => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(val).catch(() => {});
    }
    setCopiedCred(kind);
    window.setTimeout(() => setCopiedCred(null), 2000);
  };

  const isPhoneValid = (raw: string): boolean => {
    const digits = raw.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 15;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.fullName.trim() || formData.fullName.trim().split(/\s+/).length < 2) {
      setFormError(t('app.errFullName'));
      return;
    }

    if (!isPhoneValid(formData.phone)) {
      setPhoneError(t('app.errPhone'));
      return;
    }

    const bRes = validateCalendarDate(formData.birthDate, { isTouched: true, language });
    if (!bRes.isValid) {
      setBirthDateError(bRes.error || t('app.errBirthDate'));
      return;
    }

    const pErr = getPassportValidationError(formData.passportNumber, language);
    if (pErr) {
      setPassportError(pErr);
      return;
    }

    if (formData.parentPhone.trim() && !isPhoneValid(formData.parentPhone)) {
      setParentPhoneError(t('app.errParentPhone'));
      return;
    }

    if (assignmentMode === 'now' && (!selectedRoomId || !selectedBedId)) {
      setFormError(t('students.modal.errSelectBed'));
      return;
    }

    if (monthStatus === 'partial') {
      const mVal = safeAmount(monthPartialInput);
      if (mVal <= 0 || mVal > resolvedMonthlyTariff) {
        setFormError(t('students.modal.errPartialAmount'));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const phoneKey = normalizePhoneKey(formData.phone);
      const formattedPhone =
        phoneKey.length >= 9 ? formatUzPhoneDisplay(formData.phone) : formData.phone.trim();
      const parentPhoneKey = normalizePhoneKey(formData.parentPhone);
      const formattedParentPhone = formData.parentPhone.trim()
        ? parentPhoneKey.length >= 9
          ? formatUzPhoneDisplay(formData.parentPhone)
          : formData.parentPhone.trim()
        : '';

      const normalizedDateTime = ensureDateTimeValue(paymentDate);
      const resolvedPaidUntil =
        monthStatus !== 'pending'
          ? paidUntilDate && /^\d{4}-\d{2}-\d{2}$/.test(paidUntilDate)
            ? paidUntilDate
            : addDaysToDateStr(normalizedDateTime, 30)
          : undefined;

      const res = await createResidentWithPlacement({
        resident: {
          fullName: formData.fullName.trim(),
          phone: formattedPhone,
          birthDate: formData.birthDate.trim(),
          passportNumber: formData.passportNumber.trim().toUpperCase(),
          university: formData.university.trim(),
          faculty: formData.faculty.trim(),
          degreeLevel: formData.degreeLevel,
          course: formData.course,
          group: formData.group.trim(),
          parentPhone: formattedParentPhone,
          permanentAddress: formData.permanentAddress.trim(),
          roomType: resolvedRoomType,
          monthlyTariff: resolvedMonthlyTariff,
        },
        placement:
          assignmentMode === 'now' && selectedRoomId && selectedBedId
            ? { roomId: selectedRoomId, bedId: selectedBedId }
            : null,
        initialBilling: {
          monthlyRateOverride: parsedOverride > 0 ? parsedOverride : undefined,
          initialPeriod,
          monthStatus,
          monthAmount: monthPaidPreview,
          paymentMethod,
          paymentDate: normalizedDateTime,
          paidUntil: resolvedPaidUntil,
          notes: paymentNotes.trim() || undefined,
        },
      });

      if (!res) {
        setFormError(t('students.modal.errSelectBed'));
        return;
      }

      setCreatedResult({
        studentId: res.student.id,
        fullName: formData.fullName.trim(),
        tempLogin: res.tempLogin,
        tempPassword: res.tempPassword,
        roomNumber: res.roomNumber,
        bedLabel: res.bedLabel,
        floor: res.floor,
        contractNumber: res.contractNumber,
        monthlyTariff: resolvedMonthlyTariff,
        initialPaidTotal: initialPaidTotalPreview,
        remainingBalance: remainingPreview,
        paidUntil: resolvedPaidUntil,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const anyAvailableBedsAnywhere = useMemo(
    () => activeRooms.some((r) => r.beds.some((b) => b.status === 'available')),
    [activeRooms]
  );

  const showPaymentDetails = monthStatus !== 'pending';
  const inputBaseClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:border-[#C6A15B] focus:bg-white transition-colors';

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-resident-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[93vh] flex flex-col relative"
      >
        <ModalHeader
          icon={<UserPlus className="w-5 h-5 text-[#C6A15B]" />}
          title={
            <span id="add-resident-modal-title" className="font-extrabold text-slate-900">
              {t('students.modal.addTitle')}
            </span>
          }
          subtitle={t('students.modal.addSubtitle')}
          onClose={createdResult ? onClose : handleDismiss}
          ariaLabel={t('common.close')}
        />

        {createdResult ? (
          <div className="overflow-y-auto flex-1 py-4 px-2 sm:px-4 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">
                {t('students.modal.createdTitle')}
              </h3>
              <p className="text-xs text-slate-600">
                <strong className="text-slate-900">{createdResult.fullName}</strong>
                {createdResult.roomNumber && createdResult.bedLabel ? (
                  <>
                    {' — '}
                    {createdResult.floor}-{t('common.floor')} •{' '}
                    {t('student.roomBedFormat', {
                      room: createdResult.roomNumber,
                      bed: createdResult.bedLabel,
                    })}
                  </>
                ) : (
                  <> — {t('students.modal.createdAwaitingBed')}</>
                )}
              </p>
              {createdResult.contractNumber && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                  <span>{t('students.modal.contractIssued')}</span>
                  <span className="font-mono font-bold text-[#101C32]">
                    {createdResult.contractNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Financial Snapshot */}
            <div className="max-w-md mx-auto grid grid-cols-3 gap-2 text-left">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500">{t('billing.monthlyRate')}</div>
                <div className="font-extrabold text-slate-900 text-xs mt-0.5">
                  {formatCurrency(createdResult.monthlyTariff)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[10px] text-emerald-700">
                  {t('students.modal.totalInitialDue')}
                </div>
                <div className="font-extrabold text-emerald-800 text-xs mt-0.5">
                  {formatCurrency(createdResult.initialPaidTotal)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] text-amber-800">
                  {t('students.modal.remainingPreview')}
                </div>
                <div className="font-extrabold text-amber-900 text-xs mt-0.5">
                  {formatCurrency(createdResult.remainingBalance)}
                </div>
              </div>
            </div>

            {/* Generated Resident Cabinet Credentials */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-left space-y-3">
              <div className="font-bold text-[#101C32] text-xs flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#C6A15B]" />
                <span>{t('applications.tempCredentialsTitle')}</span>
              </div>

              <div className="space-y-2">
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500">
                      {t('applications.tempLoginLabel')}
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs truncate">
                      {createdResult.tempLogin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCred(createdResult.tempLogin, 'login')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedCred === 'login' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>
                      {copiedCred === 'login'
                        ? t('applications.copiedLabel')
                        : t('applications.copyCredentials')}
                    </span>
                  </button>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500">
                      {t('applications.tempPasswordLabel')}
                    </div>
                    <div className="font-mono text-sm font-black tracking-wider text-[#101C32]">
                      {createdResult.tempPassword}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCred(createdResult.tempPassword, 'pass')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedCred === 'pass' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>
                      {copiedCred === 'pass'
                        ? t('applications.copiedLabel')
                        : t('applications.copyCredentials')}
                    </span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-amber-900/80 leading-snug">
                {t('applications.credentialsNote')}
              </p>
            </div>

            <div className="max-w-md mx-auto flex items-center justify-center gap-2 flex-wrap">
              {createdResult.paidUntil && (
                <span className="text-[11px] text-slate-600">
                  {t('payments.paidUntilLabel')}:{' '}
                  <strong className="text-slate-900 tabular-nums">
                    {formatShortDateDisplay(createdResult.paidUntil)}
                  </strong>
                </span>
              )}
              <PaymentExpiryBadge paidUntilDate={createdResult.paidUntil} compact />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              {onOpenAddPaymentModal && (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = createdResult.studentId;
                    onClose();
                    onOpenAddPaymentModal(targetId);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{t('students.modal.recordPaymentNow')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                {t('assign.doneBtn')}
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 pr-1">
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Personal Information */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#101C32] uppercase tracking-wide">
                  <User className="w-4 h-4 text-[#C6A15B]" />
                  <span>{t('students.modal.personal')}</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('students.fullName')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('app.fullNamePlaceholder')}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={inputBaseClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.phone')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder={t('students.modal.phonePlaceholder')}
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (phoneError) setPhoneError(null);
                      }}
                      className={`${inputBaseClass} ${
                        phoneError ? 'border-rose-400 bg-rose-50/40' : ''
                      }`}
                    />
                    {phoneError && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{phoneError}</span>
                      </p>
                    )}
                  </div>

                  <BirthDateInput
                    label={t('students.modal.birthDate')}
                    placeholder="31.12.2005"
                    formatHint={t('app.dateFormatHint')}
                    language={language}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.passport')} (XX1234567) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AA1234567"
                      maxLength={9}
                      value={formData.passportNumber}
                      onChange={(e) => {
                        const formatted = formatPassportNumber(e.target.value);
                        setFormData({ ...formData, passportNumber: formatted });
                        setPassportError(getPassportValidationError(formatted, language));
                      }}
                      onBlur={() => {
                        setPassportError(
                          getPassportValidationError(formData.passportNumber, language)
                        );
                      }}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-2 uppercase font-mono tracking-wider transition-colors ${
                        passportError
                          ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-200 focus:border-rose-500'
                          : isValidPassportNumber(formData.passportNumber)
                          ? 'border-emerald-400 bg-emerald-50/30 text-slate-900 focus:ring-emerald-200 focus:border-emerald-500'
                          : 'border-slate-200 focus:ring-[#C6A15B] focus:bg-white'
                      }`}
                    />
                    {passportError && (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{passportError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.parentPhone')}{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        ({t('students.modal.optionalHint')})
                      </span>
                    </label>
                    <input
                      type="tel"
                      placeholder={t('students.modal.phonePlaceholder')}
                      value={formData.parentPhone}
                      onChange={(e) => {
                        setFormData({ ...formData, parentPhone: e.target.value });
                        if (parentPhoneError) setParentPhoneError(null);
                      }}
                      className={`${inputBaseClass} ${
                        parentPhoneError ? 'border-rose-400 bg-rose-50/40' : ''
                      }`}
                    />
                    {parentPhoneError && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{parentPhoneError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('students.address')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('app.addressPlaceholder')}
                    value={formData.permanentAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, permanentAddress: e.target.value })
                    }
                    className={inputBaseClass}
                  />
                </div>
              </div>

              {/* Section 2: Academic Information (Spacious 2-Column Layout) */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#101C32] uppercase tracking-wide">
                  <GraduationCap className="w-4 h-4 text-[#C6A15B]" />
                  <span>{t('students.modal.education')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.university')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('app.universityPlaceholder')}
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      className={inputBaseClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.faculty')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('app.facultyPlaceholder')}
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                      className={inputBaseClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('app.degreeLevel')}
                    </label>
                    <select
                      value={formData.degreeLevel}
                      onChange={(e) => {
                        const dl = e.target.value;
                        const courses =
                          COURSE_OPTIONS_BY_DEGREE[dl] || COURSE_OPTIONS_BY_DEGREE['Bakalavr'];
                        setFormData({
                          ...formData,
                          degreeLevel: dl,
                          course: courses[0]?.value ?? 1,
                        });
                      }}
                      className={inputBaseClass}
                    >
                      {DEGREE_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {getDegreeLabel(opt.value)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.course')}
                    </label>
                    <select
                      value={String(formData.course)}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = Number(val);
                        setFormData({
                          ...formData,
                          course:
                            !Number.isNaN(num) && val.trim() !== '' && !val.includes(' ')
                              ? num
                              : val,
                        });
                      }}
                      className={inputBaseClass}
                    >
                      {(
                        COURSE_OPTIONS_BY_DEGREE[formData.degreeLevel] ||
                        COURSE_OPTIONS_BY_DEGREE['Bakalavr']
                      ).map((opt) => (
                        <option key={String(opt.value)} value={String(opt.value)}>
                          {getCourseLabel(formData.degreeLevel, opt.value)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.group')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('app.groupPlaceholder')}
                      value={formData.group}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                      className={inputBaseClass}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Room, Bed & Auto-Resolved Monthly Rate */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#101C32] uppercase tracking-wide">
                    <BedDouble className="w-4 h-4 text-[#C6A15B]" />
                    <span>{t('students.modal.placement')}</span>
                  </div>
                </div>

                {/* Assign Now vs Assign Later */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!anyAvailableBedsAnywhere}
                    onClick={() => setAssignmentMode('now')}
                    className={`px-3 py-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                      assignmentMode === 'now'
                        ? 'bg-[#101C32] text-[#EAD096] border-[#101C32] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>{t('students.modal.assignNow')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('later')}
                    className={`px-3 py-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      assignmentMode === 'later'
                        ? 'bg-[#101C32] text-[#EAD096] border-[#101C32] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <BedDouble className="w-4 h-4 shrink-0" />
                    <span>{t('students.modal.assignLater')}</span>
                  </button>
                </div>

                {assignmentMode === 'now' ? (
                  !anyAvailableBedsAnywhere ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                      {t('students.modal.noRoomsAvailable')}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Floor Selector */}
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {t('students.modal.floorSelect')}
                          </label>
                          <select
                            value={selectedFloor}
                            onChange={(e) => setSelectedFloor(Number(e.target.value))}
                            className={inputBaseClass}
                          >
                            {RESIDENTIAL_FLOORS.map((fl) => (
                              <option key={fl} value={fl} disabled={floorAvailability[fl] === 0}>
                                {t(`rooms.floor${fl}`)} —{' '}
                                {t('assign.availableBedsCount', {
                                  count: floorAvailability[fl] || 0,
                                })}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Room Selector */}
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {t('students.modal.roomSelect')}
                          </label>
                          <select
                            value={selectedRoomId}
                            onChange={(e) => setSelectedRoomId(e.target.value)}
                            className={inputBaseClass}
                          >
                            {roomsOnFloor.length === 0 && (
                              <option value="">{t('students.modal.noBedsOnFloor')}</option>
                            )}
                            {roomsOnFloor.map((room) => {
                              const availCount = room.beds.filter(
                                (b) => b.status === 'available'
                              ).length;
                              return (
                                <option
                                  key={room.id}
                                  value={room.id}
                                  disabled={availCount === 0}
                                >
                                  {room.roomNumber} ({t(`rooms.${room.type}`)} ·{' '}
                                  {t('student.capacityBeds', { capacity: room.capacity })}) —{' '}
                                  {t('rooms.availableBedsSummary', {
                                    available: availCount,
                                    total: room.beds.length,
                                  })}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Available Bed Selector */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1.5">
                          {t('students.modal.bedSelect')} <span className="text-rose-500">*</span>
                        </label>
                        {availableBedsInRoom.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                            {t('students.modal.noBedsOnFloor')}
                          </div>
                        ) : (
                          <select
                            value={selectedBedId}
                            onChange={(e) => setSelectedBedId(e.target.value)}
                            className={inputBaseClass}
                          >
                            {availableBedsInRoom.map((bed) => {
                              const bedLabel = bed.bedIdentifier || String(bed.bedNumber);
                              return (
                                <option key={bed.id} value={bed.id}>
                                  {selectedRoom
                                    ? `${t('student.roomBedFormat', {
                                        room: selectedRoom.roomNumber,
                                        bed: bedLabel,
                                      })} (${bed.id})`
                                    : bedLabel}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.tariff')}
                    </label>
                    <select
                      value={formData.roomType}
                      onChange={(e) =>
                        setFormData({ ...formData, roomType: e.target.value as RoomType })
                      }
                      className={inputBaseClass}
                    >
                      {ROOM_TYPE_ORDER.map((typeOption) => (
                        <option key={typeOption} value={typeOption}>
                          {t(`rooms.${typeOption}`)} (
                          {t('student.capacityBeds', {
                            capacity: ROOM_TYPE_CAPACITY[typeOption],
                          })}
                          ) — {formatCurrency(settings.roomTariffs[typeOption])}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Auto-Resolved Monthly Rate Display Card + Optional Override */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500">
                        {t('students.modal.resolvedRate')}
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {t(`rooms.${resolvedRoomType}`)} (
                        {t('student.capacityBeds', {
                          capacity:
                            selectedRoom?.capacity || ROOM_TYPE_CAPACITY[resolvedRoomType],
                        })}
                        )
                      </div>
                    </div>
                    <div className="text-sm font-black text-[#101C32] bg-[#F7F5F0] border border-[#C6A15B]/40 px-3 py-1.5 rounded-xl tabular-nums">
                      {formatCurrency(resolvedMonthlyTariff)} / {t('billing.monthShort')}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-[11px] font-semibold text-slate-600 shrink-0">
                      {t('billing.rateOverrideLabel')}:
                    </label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        min={0}
                        step={50000}
                        value={monthlyRateOverrideInput}
                        onChange={(e) => setMonthlyRateOverrideInput(e.target.value)}
                        placeholder={String(defaultResolvedTariff)}
                        className="w-full sm:w-44 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                      />
                      {parsedOverride > 0 && (
                        <button
                          type="button"
                          onClick={() => setMonthlyRateOverrideInput('')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer shrink-0"
                        >
                          {t('billing.resetToRoomRate')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Initial Monthly Payment */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#101C32] uppercase tracking-wide">
                  <CreditCard className="w-4 h-4 text-[#C6A15B]" />
                  <span>{t('students.modal.initialBilling')}</span>
                </div>

                {/* Initial Monthly Payment */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t('students.modal.monthPeriodLabel')}
                      </label>
                      <select
                        value={initialPeriod}
                        onChange={(e) => setInitialPeriod(e.target.value)}
                        className={inputBaseClass}
                      >
                        {ACADEMIC_BILLING_MONTHS.map((m) => (
                          <option key={m.period} value={m.period}>
                            {getMonthLabel(m.period)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t('students.modal.initialMonthLabel')} (
                        {formatCurrency(resolvedMonthlyTariff)})
                      </label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {(['pending', 'paid', 'partial'] as PaymentToggleStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setMonthStatus(st);
                              if (st === 'partial' && !monthPartialInput) {
                                setMonthPartialInput(
                                  String(Math.round(resolvedMonthlyTariff / 2))
                                );
                              }
                            }}
                            className={`flex-1 px-2.5 py-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              monthStatus === st
                                ? st === 'paid'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : st === 'partial'
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-slate-800 text-white border-slate-800'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {t(`billing.status.${st}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {monthStatus === 'partial' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t('students.modal.partialAmountLabel')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={resolvedMonthlyTariff}
                        step={1000}
                        value={monthPartialInput}
                        onChange={(e) => setMonthPartialInput(e.target.value)}
                        placeholder={String(Math.round(resolvedMonthlyTariff / 2))}
                        className={inputBaseClass}
                      />
                    </div>
                  )}
                </div>

                {/* Payment Method, Date, Paid-Through Date & Notes when any amount paid */}
                {showPaymentDetails && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {t('payments.methodLabel')}
                        </label>
                        <select
                          value={normalizeSelectableMethod(paymentMethod)}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as BillingPaymentMethod)
                          }
                          className={inputBaseClass}
                        >
                          {BILLING_PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {t(`payments.method.${m}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {t('payments.dateLabel')}
                        </label>
                        <input
                          type="datetime-local"
                          value={toDateTimeLocalInputValue(paymentDate)}
                          onChange={(e) => {
                            setPaymentDate(e.target.value);
                            if (!paidUntilManual && e.target.value) {
                              setPaidUntilDate(addDaysToDateStr(e.target.value, 30));
                            }
                          }}
                          className={inputBaseClass}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <label className="font-semibold text-slate-800">
                          {t('payments.paidUntilLabel')}
                        </label>
                        <PaymentExpiryBadge paidUntilDate={paidUntilDate} compact />
                      </div>
                      <input
                        type="date"
                        value={paidUntilDate}
                        onChange={(e) => {
                          setPaidUntilDate(e.target.value);
                          setPaidUntilManual(true);
                        }}
                        className={inputBaseClass}
                      />
                      <p className="text-[10px] text-slate-500">
                        {t('payments.paidUntilAutoHint')}
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {t('payments.notesLabel')}{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          ({t('students.modal.optionalHint')})
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder={t('billing.notePlaceholder')}
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className={inputBaseClass}
                      />
                    </div>
                  </div>
                )}

                {/* Live Financial Summary Bar */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-emerald-800">
                      {t('students.modal.totalInitialDue')}
                    </span>
                    <span className="font-extrabold text-emerald-900">
                      {formatCurrency(initialPaidTotalPreview)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-amber-800">
                      {t('students.modal.remainingPreview')}
                    </span>
                    <span className="font-extrabold text-amber-900">
                      {formatCurrency(remainingPreview)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 pb-1 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4 text-[#C6A15B]" />
                  <span>
                    {isSubmitting
                      ? t('common.saving')
                      : t('students.modal.saveAndCreate')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
