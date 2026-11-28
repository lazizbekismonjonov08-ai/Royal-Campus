import React, { useState, useMemo, useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  BedDouble,
  Search,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  User,
  UserCheck,
  Building,
  Crown,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  Phone,
  GraduationCap,
  Layers,
  DoorOpen,
  RotateCcw,
  Copy,
  KeyRound,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { PaymentExpiryBadge } from '../components/PaymentExpiryBadge';
import { DatePickerDDMMYYYY } from '../components/DatePickerDDMMYYYY';
import { PaymentDurationSelector } from '../components/PaymentDurationSelector';
import {
  Room,
  Bed,
  Student,
  RoomType,
  ROOM_TYPE_ORDER,
  ROOM_TYPE_CAPACITY,
  BILLING_PAYMENT_METHODS,
  BillingPaymentMethod,
  InitialBillingSetup,
} from '../types';
import {
  ACADEMIC_BILLING_MONTHS,
  addMonthsToDateStr,
  ensureDateTimeValue,
  getCurrentBillingPeriod,
  getCurrentLocalDateTime,
  normalizeSelectableMethod,
  safeAmount,
} from '../utils/billingUtils';

interface AssignModalProps {
  initialStudentId?: string;
  initialRoomType?: RoomType;
  initialRoomId?: string;
  initialBedId?: string;
  onClose: () => void;
  onOpenAddPaymentModal?: (studentId: string) => void;
}

// Helper to normalize Uzbek letters and accents for fuzzy, robust search
function normalizeUzbekSearch(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[‘'`ʻʼ]/g, "'")
    .replace(/g['`‘ʻʼ]/g, "g'")
    .replace(/o['`‘ʻʼ]/g, "o'")
    .trim();
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export const S43_AssignTransferBedModal: React.FC<AssignModalProps> = ({
  initialStudentId,
  initialRoomType,
  initialRoomId,
  initialBedId,
  onClose,
  onOpenAddPaymentModal,
}) => {
  const { students, rooms, settings, role, assignBed, transferBed } = useDorm();
  const { t, language, formatCurrency, formatDate } = useI18n();

  // Role permissions: Owner, Manager, Receptionist
  const isAuthorized = role === 'owner' || role === 'manager' || role === 'receptionist';

  // Mode: 'new' (only unassigned students) vs 'transfer' (existing assigned students)
  const [mode, setMode] = useState<'new' | 'transfer'>(() => {
    if (initialStudentId) {
      const initStd = students.find((s) => s.id === initialStudentId);
      if (initStd?.roomId) return 'transfer';
    }
    return 'new';
  });

  // Selected entities across steps
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | ''>(initialRoomType || '');
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId || '');
  const [selectedBedId, setSelectedBedId] = useState<string>(initialBedId || '');
  const [step4TierFilter, setStep4TierFilter] = useState<'all' | RoomType>('all');

  // Initial payment & rate setup (for new placements)
  const [monthlyRateOverrideInput, setMonthlyRateOverrideInput] = useState<string>('');
  const [initialPeriod, setInitialPeriod] = useState<string>(() => getCurrentBillingPeriod());
  const [monthStatus, setMonthStatus] = useState<'pending' | 'paid' | 'partial'>('pending');
  const [monthPartialInput, setMonthPartialInput] = useState<string>('');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(() => getCurrentLocalDateTime());
  const [paidUntilDate, setPaidUntilDate] = useState<string>(() =>
    addMonthsToDateStr(getCurrentLocalDateTime(), 1)
  );
  const [paidUntilManual, setPaidUntilManual] = useState<boolean>(false);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [billingValidationError, setBillingValidationError] = useState<string | null>(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Success state & generated credentials
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [assignedCredentials, setAssignedCredentials] = useState<{
    tempLogin: string;
    tempPassword: string;
    roomNumber: string;
    bedLabel: string;
  } | null>(null);
  const [copiedCred, setCopiedCred] = useState<'login' | 'pass' | null>(null);

  // Active step in sequence (1 to 6)
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    if (initialStudentId && initialRoomId && initialBedId) return 6;
    if (initialStudentId && initialRoomType) return 3; // Approved from application: go straight to Floor (2-5) -> Room (matching tier prioritized) -> Bed
    if (initialStudentId) return 2; // student already selected, go to room type
    return 1;
  });

  // Pre-fill initial room / bed information if modal was opened from a specific bed
  useEffect(() => {
    if (initialRoomId) {
      const room = rooms.find((r) => r.id === initialRoomId);
      if (room) {
        setSelectedRoomType(room.type);
        setSelectedFloor(room.floor);
        setSelectedRoomId(room.id);
      }
    }
    if (initialBedId) {
      setSelectedBedId(initialBedId);
    }
  }, [initialRoomId, initialBedId, rooms]);

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  // Current entity lookups
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  const selectedBed = useMemo(() => {
    return selectedRoom?.beds.find((b) => b.id === selectedBedId);
  }, [selectedRoom, selectedBedId]);

  const isTransfer = Boolean(selectedStudent?.roomId);

  // Keep mode aligned if student changes
  useEffect(() => {
    if (selectedStudent?.roomId && mode !== 'transfer') {
      setMode('transfer');
    }
  }, [selectedStudent, mode]);

  // 1. Student filtering for Step 1
  const filteredStudents = useMemo(() => {
    const query = normalizeUzbekSearch(searchQuery);

    // Filter students by mode (new placement vs transfer)
    let pool = students.filter((s) => {
      if (s.status === 'deleted_pending_purge' || s.status === 'rejected') return false;
      if (mode === 'new') {
        return !s.roomId; // Unassigned students only
      } else {
        return Boolean(s.roomId); // Active residents with rooms only
      }
    });

    if (!query) {
      return pool.slice(0, 50);
    }

    return pool.filter((s) => {
      const normName = normalizeUzbekSearch(s.fullName);
      const normPhone = s.phone ? s.phone.replace(/\D/g, '') : '';
      const cleanQueryDigits = searchQuery.replace(/\D/g, '');
      const normPassport = normalizeUzbekSearch(s.passportNumber);
      const normId = normalizeUzbekSearch(s.id);
      const normUni = normalizeUzbekSearch(s.university || '');
      const normFaculty = normalizeUzbekSearch(s.faculty || '');

      return (
        normName.includes(query) ||
        (cleanQueryDigits.length >= 3 && normPhone.includes(cleanQueryDigits)) ||
        normPassport.includes(query) ||
        normId.includes(query) ||
        normUni.includes(query) ||
        normFaculty.includes(query)
      );
    });
  }, [students, mode, searchQuery]);

  // 2. Room Type statistics & availability for Step 2
  // Only residential rooms (floors 2-5)
  const roomTypesData = useMemo(() => {
    return ROOM_TYPE_ORDER.map((type) => {
      const typeRooms = rooms.filter(
        (r) =>
          r.floor >= 2 &&
          r.floor <= 5 &&
          r.type === type &&
          (!r.status || r.status === 'available') &&
          !r.isClosedForMaintenance
      );

      let totalBeds = 0;
      let availableBeds = 0;
      typeRooms.forEach((r) => {
        totalBeds += r.beds.length;
        availableBeds += r.beds.filter((b) => b.status === 'available').length;
      });

      const sampleCapacity = typeRooms[0]?.capacity || ROOM_TYPE_CAPACITY[type];
      const monthlyPrice = settings.roomTariffs?.[type] ?? typeRooms[0]?.priceMonthly ?? 1200000;

      return {
        type,
        label: t(`rooms.${type}`) || type,
        capacity: sampleCapacity,
        price: monthlyPrice,
        roomsCount: typeRooms.length,
        totalBeds,
        availableBeds,
        isAvailable: availableBeds > 0,
      };
    });
  }, [rooms, settings.roomTariffs, t]);

  const requestedTier = initialRoomType || selectedStudent?.roomType || selectedRoomType || undefined;

  // 3. Residential Floors (2, 3, 4, 5) availability for Step 3
  // Floor 1 is strictly excluded (reception, kitchen, study, medical, laundry)
  const availableFloorsData = useMemo(() => {
    const residentialFloorsList = [2, 3, 4, 5];
    const targetTier = selectedRoomType || requestedTier;

    return residentialFloorsList
      .map((floorNum) => {
        const floorRooms = rooms.filter(
          (r) =>
            r.floor === floorNum &&
            (!r.status || r.status === 'available') &&
            !r.isClosedForMaintenance
        );

        let floorAvailableBeds = 0;
        let matchingTierBeds = 0;
        let matchingRoomsCount = 0;
        let floorTotalBeds = 0;

        floorRooms.forEach((r) => {
          const availInRoom = r.beds.filter((b) => b.status === 'available').length;
          floorTotalBeds += r.beds.length;
          floorAvailableBeds += availInRoom;
          if (targetTier && r.type === targetTier) {
            matchingTierBeds += availInRoom;
            if (availInRoom > 0) matchingRoomsCount++;
          }
        });

        return {
          floor: floorNum,
          roomsCount: floorRooms.length,
          totalBeds: floorTotalBeds,
          availableBeds: floorAvailableBeds,
          matchingTierBeds,
          matchingRoomsCount,
          isAvailable: floorAvailableBeds > 0,
        };
      })
      .filter((fl) => fl.isAvailable);
  }, [rooms, selectedRoomType, requestedTier]);

  // 4. Available Rooms for Step 4 (requested/selected tier prioritized first, with tier filter support)
  const availableRoomsList = useMemo(() => {
    if (selectedFloor === null) return [];
    const priorityTier = selectedRoomType || requestedTier;

    return rooms
      .filter(
        (r) =>
          r.floor === selectedFloor &&
          (!r.status || r.status === 'available') &&
          !r.isClosedForMaintenance &&
          (step4TierFilter === 'all' || r.type === step4TierFilter)
      )
      .map((room) => {
        const avail = room.beds.filter((b) => b.status === 'available').length;
        const occupied = room.beds.filter((b) => b.status === 'occupied').length;
        return {
          ...room,
          availableBedsCount: avail,
          occupiedBedsCount: occupied,
          isRequestedTier: Boolean(priorityTier && room.type === priorityTier),
        };
      })
      .filter((r) => r.availableBedsCount > 0)
      .sort((a, b) => {
        if (a.isRequestedTier !== b.isRequestedTier) {
          return a.isRequestedTier ? -1 : 1;
        }
        const na = parseInt(a.roomNumber, 10);
        const nb = parseInt(b.roomNumber, 10);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.roomNumber.localeCompare(b.roomNumber);
      });
  }, [rooms, selectedFloor, selectedRoomType, requestedTier, step4TierFilter]);

  // 5. Available Beds for Step 5 (strictly only currently Available beds for assignment)
  const bedsInSelectedRoom = useMemo(() => {
    if (!selectedRoom) return [];
    return selectedRoom.beds.filter((b) => b.status === 'available');
  }, [selectedRoom]);

  const occupiedBedsInSelectedRoom = useMemo(() => {
    if (!selectedRoom) return 0;
    return selectedRoom.beds.filter((b) => b.status !== 'available').length;
  }, [selectedRoom]);

  // Handle student selection
  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    setSearchQuery('');
    // Advance to step 2 if room type not selected, or review if all already selected
    if (selectedRoomId && selectedBedId) {
      setCurrentStep(6);
    } else {
      setCurrentStep(2);
    }
  };

  // Handle room type selection
  const handleSelectRoomType = (type: RoomType) => {
    setSelectedRoomType(type);
    // Reset subordinate selections if type changes
    if (selectedRoomType !== type) {
      setSelectedFloor(null);
      setSelectedRoomId('');
      setSelectedBedId('');
    }
    setCurrentStep(3);
  };

  // Handle floor selection
  const handleSelectFloor = (floor: number) => {
    setSelectedFloor(floor);
    setStep4TierFilter('all');
    if (selectedFloor !== floor) {
      setSelectedRoomId('');
      setSelectedBedId('');
    }
    setCurrentStep(4);
  };

  // Handle room selection
  const handleSelectRoom = (room: Room) => {
    setSelectedRoomId(room.id);
    setSelectedRoomType(room.type);
    if (selectedRoomId !== room.id) {
      setSelectedBedId('');
      setMonthlyRateOverrideInput('');
    }
    setCurrentStep(5);
  };

  // Handle bed selection
  const handleSelectBed = (bed: Bed) => {
    if (bed.status !== 'available') return;
    setSelectedBedId(bed.id);
    setCurrentStep(6);
  };

  const defaultRoomTariff = selectedRoom
    ? settings.roomTariffs?.[selectedRoom.type] ?? selectedRoom.priceMonthly
    : 0;
  const parsedOverride =
    monthlyRateOverrideInput.trim() !== '' ? safeAmount(monthlyRateOverrideInput, 0) : 0;
  const effectiveMonthlyRate = parsedOverride > 0 ? parsedOverride : defaultRoomTariff;
  const expectedTotalForDuration = effectiveMonthlyRate * durationMonths;
  const monthPaidPreview =
    monthStatus === 'paid'
      ? expectedTotalForDuration
      : monthStatus === 'partial'
      ? Math.min(expectedTotalForDuration, safeAmount(monthPartialInput, 0))
      : 0;

  // Final confirmation
  const handleConfirmAssignment = async () => {
    if (!selectedStudentId || !selectedRoomId || !selectedBedId) return;
    setBillingValidationError(null);

    if (isTransfer) {
      transferBed(selectedStudentId, selectedRoomId, selectedBedId);
      setIsConfirmed(true);
      window.setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    if (monthStatus === 'partial') {
      const mVal = safeAmount(monthPartialInput, 0);
      if (mVal <= 0 || mVal > expectedTotalForDuration) {
        setBillingValidationError(t('students.modal.errPartialAmount'));
        return;
      }
    }

    const normalizedDateTime = ensureDateTimeValue(paymentDate);
    const resolvedPaidUntil =
      monthStatus !== 'pending'
        ? paidUntilDate && /^\d{4}-\d{2}-\d{2}$/.test(paidUntilDate)
          ? paidUntilDate
          : addMonthsToDateStr(normalizedDateTime, durationMonths)
        : undefined;

    const initialBilling: InitialBillingSetup = {
      monthlyRateOverride: parsedOverride > 0 ? parsedOverride : undefined,
      initialPeriod,
      monthStatus,
      monthAmount: monthPaidPreview,
      durationMonths,
      paymentMethod,
      paymentDate: normalizedDateTime,
      paidUntil: resolvedPaidUntil,
      notes: paymentNotes.trim() || undefined,
    };

    const credResult = await assignBed(
      selectedStudentId,
      selectedRoomId,
      selectedBedId,
      initialBilling
    );
    if (credResult) {
      setAssignedCredentials(credResult);
      setIsConfirmed(true);
    } else {
      setIsConfirmed(true);
    }
  };

  const handleCopyCred = (val: string, kind: 'login' | 'pass') => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(val).catch(() => {});
    }
    setCopiedCred(kind);
    window.setTimeout(() => setCopiedCred(null), 1800);
  };

  // Step definitions for stepper
  const stepsConfig = [
    { num: 1 as Step, label: t('assign.step1') || 'Talaba', isDone: Boolean(selectedStudent) },
    { num: 2 as Step, label: t('assign.step2') || 'Xona turi', isDone: Boolean(selectedRoomType) },
    { num: 3 as Step, label: t('assign.step3') || 'Qavat', isDone: selectedFloor !== null },
    { num: 4 as Step, label: t('assign.step4') || 'Xona', isDone: Boolean(selectedRoom) },
    { num: 5 as Step, label: t('assign.step5') || 'O‘rin', isDone: Boolean(selectedBed) },
    { num: 6 as Step, label: t('assign.step6') || 'Tasdiqlash', isDone: isConfirmed },
  ];

  // If user has no authorization
  if (!isAuthorized) {
    return (
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-60 flex items-center justify-center p-3 sm:p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center"
        >
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">{t('rooms.noPermission')}</h3>
          <p className="text-xs text-slate-600 mb-6">{t('rooms.onlyOwnerOrManager')}</p>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-transfer-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto max-h-[94vh] flex flex-col relative transition-all"
      >
        {/* Header */}
        <ModalHeader
          icon={<BedDouble className="w-5 h-5 text-[#C6A15B]" />}
          title={
            <span id="assign-transfer-modal-title" className="font-black text-slate-900 text-base sm:text-lg">
              {isTransfer ? t('assign.transferTitle') : t('assign.title')}
            </span>
          }
          subtitle={
            isTransfer
              ? t('assign.transferSubtitle') || 'Talabani yangi xona va o‘ringa ko‘chirish'
              : t('assign.subtitle') || 'Talabaga xona va o‘rin biriktirish bosqichma-bosqich jarayoni'
          }
          onClose={handleDismiss}
          ariaLabel={t('common.close')}
        />

        {/* Success Banner */}
        {isConfirmed ? (
          <div className="my-auto py-8 px-4 sm:px-6 text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              {isTransfer ? t('assign.transferSuccess') : t('assign.success')}
            </h3>
            <p className="text-slate-600 text-xs max-w-md mx-auto">
              <strong className="text-slate-800">{selectedStudent?.fullName}</strong> —{' '}
              {selectedRoom?.floor}-{t('common.floor')} •{' '}
              {t('student.roomBedFormat', {
                room: selectedRoom?.roomNumber || '',
                bed: String(selectedBed?.bedIdentifier || selectedBed?.bedNumber || ''),
              })}
              {selectedRoom ? ` (${t('student.capacityBeds', { capacity: selectedRoom.capacity })})` : ''}
            </p>

            {assignedCredentials && (
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-left space-y-3">
                <div className="font-bold text-[#101C32] text-xs flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#C6A15B]" />
                  <span>{t('applications.tempCredentialsTitle')}</span>
                </div>

                <div className="space-y-2">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500">{t('applications.tempLoginLabel')}</div>
                      <div className="font-mono font-bold text-slate-900 truncate">
                        {assignedCredentials.tempLogin}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCred(assignedCredentials.tempLogin, 'login')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedCred === 'login' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCred === 'login' ? t('applications.copiedLabel') : t('applications.copyCredentials')}</span>
                    </button>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500">{t('applications.tempPasswordLabel')}</div>
                      <div className="font-mono text-sm font-black tracking-wider text-[#101C32]">
                        {assignedCredentials.tempPassword}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCred(assignedCredentials.tempPassword, 'pass')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedCred === 'pass' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCred === 'pass' ? t('applications.copiedLabel') : t('applications.copyCredentials')}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-amber-900/80 leading-snug">
                  {t('applications.credentialsNote')}
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              {!isTransfer && selectedStudentId && onOpenAddPaymentModal && (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = selectedStudentId;
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
                onClick={handleDismiss}
                className="px-6 py-2.5 rounded-xl bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                {t('assign.doneBtn')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Workflow Stepper */}
            <div className="pt-1 pb-4 border-b border-slate-100">
              <div className="grid grid-cols-6 gap-1 sm:gap-2">
                {stepsConfig.map((step) => {
                  const isActive = currentStep === step.num;
                  const isDone = step.isDone && currentStep > step.num;
                  const canNavigate = step.num < currentStep || (step.num === 1 && !isConfirmed);

                  return (
                    <button
                      key={step.num}
                      type="button"
                      disabled={!canNavigate}
                      onClick={() => {
                        if (canNavigate) setCurrentStep(step.num);
                      }}
                      className={`flex flex-col items-center text-center p-1.5 sm:p-2 rounded-xl border transition-all text-[10px] sm:text-[11px] ${
                        isActive
                          ? 'bg-[#101C32] text-white border-[#101C32] shadow-sm font-bold'
                          : isDone
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold hover:bg-emerald-100 cursor-pointer'
                          : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded-full mb-1 text-[10px] font-black">
                        {isDone ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className={isActive ? 'text-[#C6A15B]' : ''}>{step.num}</span>
                        )}
                      </div>
                      <span className="truncate w-full font-medium">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Step Content Body */}
            <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-4">
              {/* STEP 1: SELECT STUDENT */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* Mode Selector & Description */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">
                        {t('assign.step1')}: {t('assign.selectStudent')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {mode === 'new'
                          ? `${t('assign.unassignedStatus')} (${t('assign.newStudentsHint')})`
                          : `${t('assign.currentlyAssigned')} (${t('assign.transferHint')})`}
                      </div>
                    </div>

                    {/* Mode Toggle Buttons */}
                    <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('new');
                          setSelectedStudentId('');
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          mode === 'new'
                            ? 'bg-white text-[#101C32] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t('assign.modeNew')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('transfer');
                          setSelectedStudentId('');
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          mode === 'transfer'
                            ? 'bg-white text-[#101C32] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ArrowRightLeft className="w-3 h-3 text-sky-600" />
                        {t('assign.modeTransfer')}
                      </button>
                    </div>
                  </div>

                  {/* Prominent Search Input with EXACT required placeholder */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder={t('assign.searchStudentPlaceholder')}
                      className="w-full pl-10 pr-10 py-3 bg-white border-2 border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#C6A15B] focus:ring-2 focus:ring-[#C6A15B]/20 shadow-xs transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* If student is already selected, show prominent selected card */}
                  {selectedStudent && (
                    <div className="p-4 rounded-2xl bg-[#101C32]/5 border-2 border-[#101C32]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#101C32] text-[#C6A15B] flex items-center justify-center font-black text-sm shadow-sm">
                          {selectedStudent.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">
                              {selectedStudent.fullName}
                            </span>
                            <span className="bg-sky-100 text-sky-800 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
                              {selectedStudent.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {selectedStudent.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-slate-400" />
                              {selectedStudent.university} ({selectedStudent.course}-{t('common.course')})
                            </span>
                          </div>
                          {selectedStudent.roomId && (
                            <div className="mt-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <span>{t('assign.currentlyAssigned')}:</span>
                              <span>
                                {selectedStudent.floor}-{t('common.floor')} • {t('common.room')} {selectedStudent.roomNumber} • {t('common.bed')} {selectedStudent.bedIdentifier || selectedStudent.bedNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentId('');
                            setSearchQuery('');
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          {t('assign.changeStudent')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="px-4 py-1.5 bg-[#101C32] hover:bg-[#1A2D4F] text-[#C6A15B] font-bold rounded-xl text-[11px] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{t('assign.next')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Student Search Results / Candidates List */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
                      <span>
                        {mode === 'new'
                          ? t('assign.unassignedCount', { count: filteredStudents.length })
                          : t('assign.activeResidentsCount', { count: filteredStudents.length })}
                      </span>
                      {searchQuery && (
                        <span className="text-slate-400 font-normal">
                          {t('assign.searchQueryResults', { query: searchQuery })}
                        </span>
                      )}
                    </div>

                    {filteredStudents.length === 0 ? (
                      <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                        <div className="w-10 h-10 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                          <Search className="w-5 h-5" />
                        </div>
                        <div className="font-extrabold text-slate-800 text-xs">
                          {t('assign.noStudentsFound')}
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          {t('assign.noStudentsFoundHint')}
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-2xs">
                        {filteredStudents.map((std) => {
                          const isSelected = selectedStudentId === std.id;
                          return (
                            <div
                              key={std.id}
                              onClick={() => handleSelectStudent(std)}
                              className={`p-3 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#101C32]/5 border-l-4 border-l-[#C6A15B]'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSelected
                                      ? 'bg-[#101C32] text-[#C6A15B]'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {std.fullName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('')}
                                </div>
                                <div className="truncate">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 truncate">
                                      {std.fullName}
                                    </span>
                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                      {std.id}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-2 truncate mt-0.5">
                                    <span>{std.phone}</span>
                                    <span>•</span>
                                    <span className="truncate">{std.university}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 text-right">
                                {std.roomNumber ? (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    {t('common.room')} {std.roomNumber} ({std.bedIdentifier || std.bedNumber})
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    {t('assign.unassignedStatus')}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT ROOM TYPE */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="font-extrabold text-slate-900 text-xs">
                      {t('assign.step2')}: {t('assign.selectRoomTypeDesc')}
                    </div>
                    {selectedStudent && (
                      <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#C6A15B]" />
                        <span>{t('assign.studentLabel')}: <strong>{selectedStudent.fullName}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* 6 Room Type Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {roomTypesData.map((item) => {
                      const isSelected = selectedRoomType === item.type;
                      const hasAvailableBeds = item.availableBeds > 0;
                      const isPlus = item.type.endsWith('_plus');

                      return (
                        <div
                          key={item.type}
                          onClick={() => {
                            if (hasAvailableBeds) handleSelectRoomType(item.type);
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#101C32] text-white border-[#C6A15B] shadow-md'
                              : hasAvailableBeds
                              ? isPlus
                                ? 'bg-amber-50/40 hover:border-[#C6A15B] border-amber-200/80 text-slate-800 cursor-pointer shadow-2xs'
                                : 'bg-white hover:border-[#C6A15B] border-slate-200 text-slate-800 cursor-pointer shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-white/10 text-[#C6A15B]'
                                    : isPlus
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.type.startsWith('lux') ? (
                                  <Crown className="w-5 h-5 text-amber-500" />
                                ) : item.type.startsWith('comfort') ? (
                                  <Sparkles className="w-5 h-5 text-sky-500" />
                                ) : (
                                  <Building className="w-5 h-5 text-indigo-500" />
                                )}
                              </div>

                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-[#C6A15B] text-[#101C32]'
                                    : hasAvailableBeds
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {hasAvailableBeds
                                  ? t('assign.availableBedsCount', { count: item.availableBeds })
                                  : t('assign.fullLabel')}
                              </span>
                            </div>

                            <h4
                              className={`text-sm font-black tracking-wide flex items-center gap-1.5 flex-wrap ${
                                isSelected ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              <span>{item.label}</span>
                              {((initialRoomType || selectedStudent?.roomType) === item.type) && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 normal-case tracking-normal">
                                  {t('assign.requestedTierBadge')}
                                </span>
                              )}
                            </h4>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isSelected ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              {t('rooms.typeCapacitySummary', { capacity: item.capacity })} • {t('assign.roomsCount', { count: item.roomsCount })}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/40">
                            <div className="text-[10px] opacity-75">{t('assign.monthlyTariff')}:</div>
                            <div
                              className={`text-sm font-black ${
                                isSelected ? 'text-[#C6A15B]' : 'text-slate-900'
                              }`}
                            >
                              {formatCurrency(item.price)}
                              <span className="text-[10px] font-normal"> {t('common.perMonth')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: SELECT FLOOR */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">
                        {t('assign.step3')}: {t('assign.selectFloorDesc')}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center flex-wrap gap-1.5">
                        {selectedStudent && (
                          <span>
                            <strong className="text-slate-800">{selectedStudent.fullName}</strong> •
                          </span>
                        )}
                        {(selectedRoomType || requestedTier) && (
                          <span>
                            {t('assign.requestedTierBadge')}:{' '}
                            <strong className="text-[#101C32]">
                              {t(`rooms.${selectedRoomType || requestedTier}`)}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      {t('assign.stepChangeTier')}
                    </button>
                  </div>

                  {availableFloorsData.length === 0 ? (
                    <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                      <div className="font-bold text-amber-900 text-xs">
                        {t('assign.noAvailableBedsForType')}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        {t('assign.back')}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableFloorsData.map((fl) => {
                        const isSelected = selectedFloor === fl.floor;
                        return (
                          <div
                            key={fl.floor}
                            onClick={() => handleSelectFloor(fl.floor)}
                            className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#101C32] text-white border-[#C6A15B] shadow-md'
                                : 'bg-white hover:border-[#C6A15B] border-slate-200 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${
                                  isSelected
                                    ? 'bg-[#C6A15B] text-[#101C32]'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {fl.floor}
                              </div>
                              <div>
                                <h4
                                  className={`font-black text-sm ${
                                    isSelected ? 'text-white' : 'text-slate-900'
                                  }`}
                                >
                                  {fl.floor}-{t('common.floor')}
                                </h4>
                                <p
                                  className={`text-[11px] ${
                                    isSelected ? 'text-slate-300' : 'text-slate-500'
                                  }`}
                                >
                                  {t('assign.roomsCount', { count: fl.roomsCount })}
                                </p>
                              </div>
                            </div>

                            <div className="text-right space-y-1">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full block ${
                                  isSelected
                                    ? 'bg-white/20 text-[#C6A15B]'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {t('assign.availableBedsCount', { count: fl.availableBeds })}
                              </span>
                              {(selectedRoomType || requestedTier) && fl.matchingTierBeds > 0 && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                    isSelected
                                      ? 'bg-[#C6A15B]/25 text-[#EAD096]'
                                      : 'bg-sky-100 text-sky-800'
                                  }`}
                                >
                                  {t(`rooms.${selectedRoomType || requestedTier}`)}: {fl.matchingTierBeds}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: SELECT ROOM */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs">
                          {t('assign.step4')}: {t('assign.selectRoomDesc')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {selectedFloor}-{t('common.floor')}
                          {(selectedRoomType || requestedTier) && (
                            <span>
                              {' '}• {t('assign.matchingTierFirstNote', {
                                tier: t(`rooms.${selectedRoomType || requestedTier}`),
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tier Filter Pills on Step 4 */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setStep4TierFilter('all')}
                        className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          step4TierFilter === 'all'
                            ? 'bg-[#101C32] text-[#C6A15B] border-[#101C32]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {t('assign.allAvailableRooms')}
                      </button>
                      {ROOM_TYPE_ORDER.map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setStep4TierFilter(tier)}
                          className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            step4TierFilter === tier
                              ? 'bg-[#101C32] text-[#C6A15B] border-[#101C32]'
                              : requestedTier === tier
                              ? 'bg-sky-50 text-sky-800 border-sky-200 hover:border-sky-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {t(`rooms.${tier}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {availableRoomsList.length === 0 ? (
                    <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                      <div className="font-bold text-amber-900 text-xs">
                        {t('assign.noAvailableBedsOnFloor')}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {step4TierFilter !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setStep4TierFilter('all')}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-amber-300 text-amber-900 font-bold rounded-xl text-xs cursor-pointer"
                          >
                            {t('assign.allAvailableRooms')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-xl text-xs cursor-pointer"
                        >
                          {t('assign.back')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {availableRoomsList.map((room) => {
                        const isSelected = selectedRoomId === room.id;
                        const roomComputedPrice =
                          settings.roomTariffs?.[room.type] ?? room.priceMonthly;
                        return (
                          <div
                            key={room.id}
                            onClick={() => handleSelectRoom(room)}
                            className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#101C32] text-white border-[#C6A15B] shadow-md'
                                : room.isRequestedTier
                                ? 'bg-amber-50/35 hover:border-[#C6A15B] border-[#C6A15B]/70 text-slate-800 shadow-2xs'
                                : 'bg-white hover:border-[#C6A15B] border-slate-200 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                <span
                                  className={`font-black text-sm ${
                                    isSelected ? 'text-[#C6A15B]' : 'text-slate-900'
                                  }`}
                                >
                                  {t('common.room')} {room.roomNumber}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    isSelected
                                      ? 'bg-emerald-500/30 text-emerald-300'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {t('assign.availableBedsCount', { count: room.availableBedsCount })}
                                </span>
                              </div>
                              <div className="flex items-center flex-wrap gap-1.5 mb-1">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-[#C6A15B] text-[#101C32]'
                                      : room.type.endsWith('_plus')
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {room.type.endsWith('_plus') && <Sparkles className="w-2.5 h-2.5" />}
                                  {t(`rooms.${room.type}`)}
                                </span>
                                {room.isRequestedTier && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                      isSelected
                                        ? 'bg-sky-500/30 text-sky-200'
                                        : 'bg-sky-100 text-sky-800'
                                    }`}
                                  >
                                    {t('assign.requestedTierBadge')}
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-mono font-bold ${
                                    isSelected ? 'text-[#EAD096]' : 'text-slate-700'
                                  }`}
                                >
                                  {formatCurrency(roomComputedPrice)}
                                </span>
                              </div>
                              <p
                                className={`text-[11px] ${
                                  isSelected ? 'text-slate-300' : 'text-slate-500'
                                }`}
                              >
                                {t('assign.capacityLabel', {
                                  capacity: room.capacity,
                                  occupied: room.occupiedBedsCount,
                                })}
                              </p>
                            </div>

                            {/* Numbered bed badges */}
                            <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center flex-wrap gap-1">
                              {room.beds.map((b) => (
                                <span
                                  key={b.id}
                                  title={`${t('common.bed')} ${b.bedIdentifier || b.bedNumber}: ${b.status}`}
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                    b.status === 'available'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : b.status === 'occupied'
                                      ? 'bg-slate-100 text-slate-500 border-slate-300 line-through'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {b.bedIdentifier || b.bedNumber}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: SELECT BED (Only Available Beds Listed) */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">
                        {t('assign.step5')}: {t('assign.selectBedDesc')}
                      </div>
                      {selectedRoom && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          {selectedRoom.floor}-{t('common.floor')} • {t('common.room')}{' '}
                          <strong>{selectedRoom.roomNumber}</strong> ({t(`rooms.${selectedRoom.type}`)} ·{' '}
                          {t('student.capacityBeds', { capacity: selectedRoom.capacity })})
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      {t('rooms.onlyAvailableBeds')}
                      {occupiedBedsInSelectedRoom > 0 && (
                        <span className="text-slate-500 font-normal ml-1">
                          ({t('rooms.occupiedCountNote', { occupied: occupiedBedsInSelectedRoom })})
                        </span>
                      )}
                    </div>
                  </div>

                  {bedsInSelectedRoom.length === 0 ? (
                    <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                      <div className="font-bold text-amber-900 text-xs">
                        {t('assign.noAvailableBedsOnFloor')}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        {t('assign.back')}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {bedsInSelectedRoom.map((b) => {
                        const isSelected = selectedBedId === b.id;
                        const bedLabel = b.bedIdentifier || String(b.bedNumber);

                        return (
                          <div
                            key={b.id}
                            onClick={() => handleSelectBed(b)}
                            className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between text-center cursor-pointer ${
                              isSelected
                                ? 'bg-[#101C32] text-white border-[#C6A15B] shadow-md ring-2 ring-[#C6A15B]/30'
                                : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-300 text-emerald-900 shadow-2xs'
                            }`}
                          >
                            <div>
                              <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center font-black text-xs">
                                <BedDouble
                                  className={`w-5 h-5 ${
                                    isSelected ? 'text-[#C6A15B]' : 'text-emerald-700'
                                  }`}
                                />
                              </div>
                              <div
                                className={`font-mono font-black text-sm ${
                                  isSelected ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {t('common.bed')} {bedLabel}
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-200/50">
                              {isSelected ? (
                                <span className="text-[10px] font-bold text-[#C6A15B] flex items-center justify-center gap-1">
                                  <Check className="w-3 h-3" /> {t('assign.selectedBadge')}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700">
                                  {t('beds.available')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: REVIEW & CONFIRMATION */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="font-extrabold text-slate-900 text-xs">
                      {t('assign.step6')}: {t('assign.reviewSummary')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {t('assign.reviewChecklistNote')}
                    </div>
                  </div>

                  {/* Comprehensive Summary Card */}
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
                    {/* Student Info */}
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-2xl bg-[#101C32] text-[#C6A15B] flex items-center justify-center font-black text-base shadow-sm shrink-0">
                        {selectedStudent?.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm sm:text-base">
                            {selectedStudent?.fullName}
                          </span>
                          <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                            {selectedStudent?.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          <span>{t('common.phone')}: {selectedStudent?.phone}</span>
                          <span>•</span>
                          <span>{t('app.passport')}: {selectedStudent?.passportNumber}</span>
                          <span>•</span>
                          <span>{selectedStudent?.university}</span>
                        </div>
                      </div>
                    </div>

                    {/* Transfer notice if applicable */}
                    {isTransfer && selectedStudent?.roomNumber && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                        <ArrowRightLeft className="w-5 h-5 text-amber-700 shrink-0" />
                        <div className="text-xs">
                          <div className="font-bold text-amber-900">
                            {t('assign.transferFrom')}:
                          </div>
                          <div className="text-amber-800 text-[11px]">
                            {selectedStudent.floor}-{t('common.floor')} • {t('common.room')} {selectedStudent.roomNumber} • {t('common.bed')} {selectedStudent.bedIdentifier || selectedStudent.bedNumber}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Target Room & Bed Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{t('assign.step2')}</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">
                          {selectedRoom ? t(`rooms.${selectedRoom.type}`) : ''}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{t('assign.step3')}</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">
                          {selectedRoom?.floor}-{t('common.floor')}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{t('assign.step4')}</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">
                          {t('common.room')} {selectedRoom?.roomNumber}
                        </div>
                        {selectedRoom && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {t('student.capacityBeds', { capacity: selectedRoom.capacity })}
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div className="text-[10px] text-emerald-700 font-bold uppercase">{t('assign.step5')}</div>
                        <div className="text-xs font-black text-emerald-900 font-mono mt-0.5">
                          {t('common.bed')} {selectedBed?.bedIdentifier || selectedBed?.bedNumber}
                        </div>
                      </div>
                    </div>

                    {/* Financial & Contract Details */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                          <span>{t('assign.summaryTariff')}:</span>
                          {selectedRoom && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                selectedRoom.type.endsWith('_plus')
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {t(`rooms.${selectedRoom.type}`)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-black text-[#101C32] mt-0.5 tabular-nums">
                          {formatCurrency(effectiveMonthlyRate)}
                          <span className="text-[10px] font-normal text-slate-500"> {t('common.perMonth')}</span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-500">
                        <div>{t('assign.contractTermLine')} <strong>{formatDate(new Date().toISOString().slice(0, 10))}</strong> — <strong>30.06.2027</strong></div>
                        <div className="text-[10px] text-slate-400">{t('assign.autoContractCodeNote')}</div>
                      </div>
                    </div>

                    {/* Initial Billing Configuration (New Placements Only) */}
                    {!isTransfer && (
                      <div className="p-3.5 sm:p-4 rounded-2xl border border-[#C6A15B]/40 bg-amber-50/40 space-y-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#C6A15B] shrink-0" />
                            <div>
                              <div className="text-xs font-extrabold text-[#101C32]">
                                {t('assign.initialBillingTitle')}
                              </div>
                              <div className="text-[11px] text-slate-600">
                                {t('assign.initialBillingSubtitle')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {billingValidationError && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{billingValidationError}</span>
                          </div>
                        )}

                        {/* Optional Monthly Rate Override */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white border border-slate-200 items-end">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {t('billing.rateOverrideLabel')}
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={50000}
                              value={monthlyRateOverrideInput}
                              onChange={(e) => setMonthlyRateOverrideInput(e.target.value)}
                              placeholder={String(defaultRoomTariff)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] text-slate-600">
                              {t('billing.monthlyRate')}:{' '}
                              <strong className="text-[#101C32] tabular-nums">
                                {formatCurrency(effectiveMonthlyRate)}
                              </strong>
                            </div>
                            {parsedOverride > 0 && (
                              <button
                                type="button"
                                onClick={() => setMonthlyRateOverrideInput('')}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                              >
                                {t('billing.resetToRoomRate')}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Initial Month Payment */}
                        <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                {t('students.modal.monthPeriodLabel')}
                              </label>
                              <select
                                value={initialPeriod}
                                onChange={(e) => setInitialPeriod(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                              >
                                {ACADEMIC_BILLING_MONTHS.map((m) => (
                                  <option key={m.period} value={m.period}>
                                    {language === 'ru' ? m.ru : language === 'en' ? m.en : m.uz}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                {t('students.modal.initialMonthLabel')} ({formatCurrency(expectedTotalForDuration)})
                              </label>
                              <div className="flex items-center gap-1">
                                {(['pending', 'paid', 'partial'] as const).map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                      setMonthStatus(st);
                                      setBillingValidationError(null);
                                      if (st === 'partial' && !monthPartialInput) {
                                        setMonthPartialInput(
                                          String(Math.round(expectedTotalForDuration / 2))
                                        );
                                      }
                                    }}
                                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
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
                              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                {t('students.modal.partialAmountLabel')}
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={expectedTotalForDuration}
                                step={50000}
                                value={monthPartialInput}
                                onChange={(e) => setMonthPartialInput(e.target.value)}
                                placeholder={String(Math.round(expectedTotalForDuration / 2))}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 tabular-nums"
                              />
                            </div>
                          )}
                        </div>

                        {monthStatus !== 'pending' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                  {t('payments.methodLabel')}
                                </label>
                                <select
                                  value={normalizeSelectableMethod(paymentMethod)}
                                  onChange={(e) =>
                                    setPaymentMethod(e.target.value as BillingPaymentMethod)
                                  }
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                                >
                                  {BILLING_PAYMENT_METHODS.map((m) => (
                                    <option key={m} value={m}>
                                      {t(`payments.method.${m}`)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                  {t('payments.dateLabel')} (DD.MM.YYYY, 24h)
                                </label>
                                <DatePickerDDMMYYYY
                                  mode="datetime"
                                  value={paymentDate}
                                  onChange={(nextVal) => {
                                    setPaymentDate(nextVal);
                                    if (!paidUntilManual && nextVal) {
                                      setPaidUntilDate(addMonthsToDateStr(nextVal, durationMonths));
                                    }
                                  }}
                                />
                              </div>
                            </div>

                            {/* Compact Duration Selector directly below Payment Date */}
                            <PaymentDurationSelector
                              months={durationMonths}
                              monthlyRate={effectiveMonthlyRate}
                              onChange={(months) => {
                                setDurationMonths(months);
                                setPaidUntilDate(addMonthsToDateStr(paymentDate, months));
                                setPaidUntilManual(false);
                              }}
                            />

                            {/* Auto-calculated Paid-Through / Expiration Date (DD.MM.YYYY) */}
                            <div className="px-3 py-2 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-1.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-sky-600" />
                                  <span>{t('payments.paidUntilLabel')}</span>
                                </label>
                                <PaymentExpiryBadge paidUntilDate={paidUntilDate} compact />
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <DatePickerDDMMYYYY
                                  mode="date"
                                  value={paidUntilDate}
                                  onChange={(nextVal) => {
                                    setPaidUntilDate(nextVal);
                                    setPaidUntilManual(true);
                                  }}
                                />
                                {paidUntilManual && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPaidUntilDate(addMonthsToDateStr(paymentDate, durationMonths));
                                      setPaidUntilManual(false);
                                    }}
                                    className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>{t('payments.resetAutoDate')}</span>
                                  </button>
                                )}
                                <span className="text-[10px] text-slate-500">
                                  {t('payments.paidUntilAutoHint')}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                {t('payments.notesLabel')}
                              </label>
                              <input
                                type="text"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder={t('billing.notePlaceholder')}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                          <span className="text-slate-600">
                            {t('students.modal.totalInitialDue')}:{' '}
                            <strong className="text-emerald-700 tabular-nums">
                              {formatCurrency(monthPaidPreview)}
                            </strong>
                          </span>
                          <span className="text-slate-600">
                            {t('students.modal.remainingPreview')}:{' '}
                            <strong className="text-amber-800 tabular-nums">
                              {formatCurrency(
                                Math.max(
                                  0,
                                  (initialPeriod <= getCurrentBillingPeriod() ||
                                  monthStatus !== 'pending'
                                    ? expectedTotalForDuration
                                    : 0) - monthPaidPreview
                                )
                              )}
                            </strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => (prev - 1) as Step)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('assign.back')}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  {t('common.cancel')}
                </button>

                {currentStep < 6 ? (
                  <button
                    type="button"
                    disabled={
                      (currentStep === 1 && !selectedStudentId) ||
                      (currentStep === 2 && !selectedRoomType) ||
                      (currentStep === 3 && selectedFloor === null) ||
                      (currentStep === 4 && !selectedRoomId) ||
                      (currentStep === 5 && !selectedBedId)
                    }
                    onClick={() => setCurrentStep((prev) => (prev + 1) as Step)}
                    className="px-4 py-2 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <span>{t('assign.next')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmAssignment}
                    disabled={!selectedStudentId || !selectedRoomId || !selectedBedId}
                    className="px-5 py-2.5 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B] text-[#C6A15B] hover:text-white font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4 text-[#C6A15B]" />
                    <span>
                      {isTransfer
                        ? t('assign.transferConfirmBtn') || 'Ko‘chirishni tasdiqlash'
                        : t('assign.confirmBtn') || 'Joylashtirishni tasdiqlash'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
