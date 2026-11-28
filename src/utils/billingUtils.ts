import {
  Application,
  BillingEntryStatus,
  BillingPaymentMethod,
  Contract,
  DormSettings,
  MonthlyBillingEntry,
  Payment,
  Room,
  ROOM_TYPE_CAPACITY,
  RoomType,
  Student,
  StudentBillingLedger,
} from '../types';
import { Language } from '../i18n/types';
import { normalizePhoneKey } from './authCrypto';

export interface AcademicMonthMeta {
  period: string;
  uz: string;
  uzCyrl: string;
  ru: string;
  en: string;
}

export const ACADEMIC_BILLING_MONTHS: AcademicMonthMeta[] = [
  { period: '2026-09', uz: '2026-yil sentyabr', uzCyrl: '2026 йил сентябрь', ru: 'Сентябрь 2026', en: 'September 2026' },
  { period: '2026-10', uz: '2026-yil oktyabr', uzCyrl: '2026 йил октябрь', ru: 'Октябрь 2026', en: 'October 2026' },
  { period: '2026-11', uz: '2026-yil noyabr', uzCyrl: '2026 йил ноябрь', ru: 'Ноябрь 2026', en: 'November 2026' },
  { period: '2026-12', uz: '2026-yil dekabr', uzCyrl: '2026 йил декабрь', ru: 'Декабрь 2026', en: 'December 2026' },
  { period: '2027-01', uz: '2027-yil yanvar', uzCyrl: '2027 йил январь', ru: 'Январь 2027', en: 'January 2027' },
  { period: '2027-02', uz: '2027-yil fevral', uzCyrl: '2027 йил февраль', ru: 'Февраль 2027', en: 'February 2027' },
  { period: '2027-03', uz: '2027-yil mart', uzCyrl: '2027 йил март', ru: 'Март 2027', en: 'March 2027' },
  { period: '2027-04', uz: '2027-yil aprel', uzCyrl: '2027 йил апрель', ru: 'Апрель 2027', en: 'April 2027' },
  { period: '2027-05', uz: '2027-yil may', uzCyrl: '2027 йил май', ru: 'Май 2027', en: 'May 2027' },
  { period: '2027-06', uz: '2027-yil iyun', uzCyrl: '2027 йил июнь', ru: 'Июнь 2027', en: 'June 2027' },
  { period: '2027-07', uz: '2027-yil iyul', uzCyrl: '2027 йил июль', ru: 'Июль 2027', en: 'July 2027' },
  { period: '2027-08', uz: '2027-yil avgust', uzCyrl: '2027 йил август', ru: 'Август 2027', en: 'August 2027' },
];

export const safeAmount = (value: unknown, fallback = 0): number => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.round(num);
};

export function isValidBillingPeriod(period?: string): boolean {
  return Boolean(period && /^\d{4}-\d{2}$/.test(period.trim()));
}

export function isValidIsoDate(val?: string): boolean {
  return Boolean(val && /^\d{4}-\d{2}-\d{2}$/.test(val.trim()));
}

export function isMonthlyPaymentRecord(p?: Pick<Payment, 'periodMonth' | 'status'>): boolean {
  return Boolean(p && isValidBillingPeriod(p.periodMonth));
}

export function normalizeBillingMethod(
  method?: string
): BillingPaymentMethod | undefined {
  if (!method) return undefined;
  if (method === 'cash') return 'cash';
  if (method === 'card') return 'card';
  if (method === 'click') return 'click';
  if (method === 'payme') return 'payme';
  if (method === 'bank_transfer') return 'bank_transfer';
  if (method === 'click_payme') return 'click_payme';
  return 'cash';
}

export function normalizeSelectableMethod(
  method?: string
): 'cash' | 'card' | 'click' | 'payme' | 'bank_transfer' {
  if (method === 'cash') return 'cash';
  if (method === 'card') return 'card';
  if (method === 'click' || method === 'click_payme') return 'click';
  if (method === 'payme') return 'payme';
  if (method === 'bank_transfer') return 'bank_transfer';
  return 'cash';
}

export function formatMethodLabel(
  method: string | undefined,
  lang: Language | 'uzCyrl'
): string {
  const norm = normalizeBillingMethod(method);
  if (!norm) return '';
  if (norm === 'cash') {
    if (lang === 'ru') return 'Наличные';
    if (lang === 'en') return 'Cash';
    if (lang === 'uzCyrl') return 'Нақд';
    return 'Naqd';
  }
  if (norm === 'card') {
    if (lang === 'ru') return 'Карта';
    if (lang === 'en') return 'Card';
    if (lang === 'uzCyrl') return 'Карта';
    return 'Karta';
  }
  if (norm === 'click') {
    return 'Click';
  }
  if (norm === 'payme') {
    return 'Payme';
  }
  if (norm === 'bank_transfer') {
    if (lang === 'ru') return 'Перевод';
    if (lang === 'en') return 'Bank Transfer';
    if (lang === 'uzCyrl') return 'Банк ўтказмаси';
    return 'Bank o‘tkazmasi';
  }
  return 'Click / Payme';
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function getCurrentLocalDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function getCurrentLocalTimeStr(): string {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

export function getCurrentLocalDateTime(): string {
  return `${getCurrentLocalDateStr()}T${getCurrentLocalTimeStr()}`;
}

export function extractDatePart(val?: string): string {
  if (!val) return '';
  const match = val.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : val.split(/[T ]/)[0] || '';
}

export function extractTimePart(val?: string, fallbackTime?: string): string {
  if (val) {
    const match = val.trim().match(/^\d{4}-\d{2}-\d{2}[T ](\d{2}:\d{2})/);
    if (match) return match[1];
  }
  if (fallbackTime && /^\d{2}:\d{2}/.test(fallbackTime.trim())) {
    return fallbackTime.trim().slice(0, 5);
  }
  return '';
}

export function ensureDateTimeValue(val?: string, fallbackTime?: string): string {
  if (!val || !val.trim()) return getCurrentLocalDateTime();
  const datePart = extractDatePart(val);
  if (!datePart) return getCurrentLocalDateTime();
  const timePart = extractTimePart(val, fallbackTime) || getCurrentLocalTimeStr();
  return `${datePart}T${timePart}`;
}

export function toDateTimeLocalInputValue(val?: string, fallbackTime?: string): string {
  if (!val || !val.trim()) return '';
  const datePart = extractDatePart(val);
  if (!datePart) return '';
  const timePart = extractTimePart(val, fallbackTime) || '09:00';
  return `${datePart}T${timePart}`;
}

/**
 * Adds a fixed number of calendar days (default 30) to a YYYY-MM-DD or YYYY-MM-DDTHH:mm string
 * using local date arithmetic without timezone drift.
 * Example: addDaysToDateStr('2026-11-09T14:30', 30) -> '2026-12-09'
 */
export function addDaysToDateStr(dateOrDateTimeStr?: string, days = 30): string {
  const datePart = extractDatePart(dateOrDateTimeStr) || getCurrentLocalDateStr();
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const target = new Date(year, month - 1, day + days);
  return `${target.getFullYear()}-${pad2(target.getMonth() + 1)}-${pad2(target.getDate())}`;
}

export function formatShortDateDisplay(val?: string, emptyFallback = '—'): string {
  if (!val || !val.trim()) return emptyFallback;
  const datePart = extractDatePart(val);
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }
  return val;
}

export function formatDateTimeDisplay(
  val?: string,
  fallbackTime?: string,
  emptyFallback = '—'
): string {
  if (!val || !val.trim()) return emptyFallback;
  const match = val
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (match) {
    const [, y, m, d, hh, mm] = match;
    const explicitTime = hh && mm ? `${hh}:${mm}` : extractTimePart(undefined, fallbackTime);
    return explicitTime ? `${d}.${m}.${y} ${explicitTime}` : `${d}.${m}.${y}`;
  }
  const parsed = new Date(val);
  if (!Number.isNaN(parsed.getTime())) {
    const d = pad2(parsed.getDate());
    const m = pad2(parsed.getMonth() + 1);
    const y = parsed.getFullYear();
    const hh = pad2(parsed.getHours());
    const mm = pad2(parsed.getMinutes());
    return `${d}.${m}.${y} ${hh}:${mm}`;
  }
  return val;
}

export function formatDateTimeCommaDisplay(
  val?: string,
  fallbackTime?: string,
  emptyFallback = '—'
): string {
  if (!val || !val.trim()) return emptyFallback;
  const match = val
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (match) {
    const [, y, m, d, hh, mm] = match;
    const explicitTime = hh && mm ? `${hh}:${mm}` : extractTimePart(undefined, fallbackTime);
    return explicitTime ? `${d}.${m}.${y}, ${explicitTime}` : `${d}.${m}.${y}`;
  }
  const parsed = new Date(val);
  if (!Number.isNaN(parsed.getTime())) {
    const d = pad2(parsed.getDate());
    const m = pad2(parsed.getMonth() + 1);
    const y = parsed.getFullYear();
    const hh = pad2(parsed.getHours());
    const mm = pad2(parsed.getMinutes());
    return `${d}.${m}.${y}, ${hh}:${mm}`;
  }
  return val;
}

export type PaymentExpiryStatus = 'none' | 'active' | 'expiring_soon' | 'overdue';

export interface PaymentExpiryInfo {
  status: PaymentExpiryStatus;
  daysRemaining: number | null;
  paidUntilDate: string;
}

/**
 * Computes exact remaining days from today's local date (00:00:00) to the resident's
 * paid-through coverage end date (YYYY-MM-DD). Never truncates to end of calendar month.
 */
export function computePaymentExpiryInfo(
  paidUntilDate?: string,
  referenceDate?: Date
): PaymentExpiryInfo {
  const cleanDate = extractDatePart(paidUntilDate);
  const match = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { status: 'none', daysRemaining: null, paidUntilDate: '' };
  }

  const ref = referenceDate || new Date();
  const todayMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  const targetMidnight = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  ).getTime();

  const diffDays = Math.round((targetMidnight - todayMidnight) / 86400000);

  if (diffDays < 0) {
    return { status: 'overdue', daysRemaining: diffDays, paidUntilDate: cleanDate };
  }
  if (diffDays <= 5) {
    return { status: 'expiring_soon', daysRemaining: diffDays, paidUntilDate: cleanDate };
  }
  return { status: 'active', daysRemaining: diffDays, paidUntilDate: cleanDate };
}

export function getPaymentSortableTimestamp(p: Pick<Payment, 'paymentDate' | 'paymentTime' | 'date'>): string {
  const base = p.paymentDate || p.date || '';
  const datePart = extractDatePart(base) || '0000-00-00';
  const timePart = extractTimePart(base, p.paymentTime) || '00:00';
  return `${datePart}T${timePart}`;
}

export function comparePaymentsChronoDesc(a: Payment, b: Payment): number {
  const ta = getPaymentSortableTimestamp(a);
  const tb = getPaymentSortableTimestamp(b);
  if (tb !== ta) return tb.localeCompare(ta);
  return (b.id || '').localeCompare(a.id || '');
}

export function formatFloorRoomBedDisplay(params: {
  floor?: number;
  roomNumber?: string;
  bedLabel?: string;
  lang: Language | 'uzCyrl';
}): string {
  const { floor, roomNumber, bedLabel, lang } = params;
  const hasRoom = Boolean(roomNumber && roomNumber !== '---');
  if (!hasRoom && !floor && !bedLabel) {
    if (lang === 'ru') return 'Ожидает комнату';
    if (lang === 'en') return 'Awaiting room';
    if (lang === 'uzCyrl') return 'Хона кутилмоқда';
    return 'Xona kutilmoqda';
  }
  const parts: string[] = [];
  if (floor !== undefined && floor > 0) {
    parts.push(
      lang === 'ru'
        ? `${floor}-этаж`
        : lang === 'en'
        ? `Floor ${floor}`
        : lang === 'uzCyrl'
        ? `${floor}-қават`
        : `${floor}-qavat`
    );
  }
  if (hasRoom) {
    parts.push(
      lang === 'ru'
        ? `Комн. ${roomNumber}`
        : lang === 'en'
        ? `Room ${roomNumber}`
        : lang === 'uzCyrl'
        ? `Хона ${roomNumber}`
        : `Xona ${roomNumber}`
    );
  }
  if (bedLabel) {
    parts.push(
      lang === 'ru'
        ? `Место ${bedLabel}`
        : lang === 'en'
        ? `Bed ${bedLabel}`
        : lang === 'uzCyrl'
        ? `Ўрин ${bedLabel}`
        : `Yotoq ${bedLabel}`
    );
  }
  return parts.join(' · ');
}

export function getCurrentBillingPeriod(): string {
  const now = new Date();
  const isoMonth = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  const first = ACADEMIC_BILLING_MONTHS[0].period;
  const last = ACADEMIC_BILLING_MONTHS[ACADEMIC_BILLING_MONTHS.length - 1].period;
  if (isoMonth < first) return first;
  if (isoMonth > last) return last;
  return isoMonth;
}

export function resolveMonthlyRateInfo(params: {
  student?: Student;
  application?: Application;
  rooms: Room[];
  settings: DormSettings;
  contract?: Contract;
  ledger?: StudentBillingLedger;
}): {
  monthlyRate: number;
  defaultRoomRate: number;
  hasCustomOverride: boolean;
  roomType?: RoomType;
  capacity?: number;
  room?: Room;
} {
  const { student, application, rooms, settings, contract, ledger } = params;

  const assignedRoom = rooms.find(
    (r) =>
      (student?.roomId && r.id === student.roomId) ||
      (student?.roomNumber && r.roomNumber === student.roomNumber) ||
      (application?.assignedRoomNumber && r.roomNumber === application.assignedRoomNumber) ||
      (contract?.roomNumber && r.roomNumber === contract.roomNumber)
  );

  const rawRoomType =
    assignedRoom?.type ||
    student?.roomType ||
    contract?.roomType ||
    application?.preferredRoomType;

  // Guard against any legacy tier string
  const validTypes: RoomType[] = ['standard', 'standard_plus', 'comfort', 'comfort_plus', 'lux'];
  const roomType: RoomType | undefined =
    rawRoomType && validTypes.includes(rawRoomType as RoomType)
      ? (rawRoomType as RoomType)
      : rawRoomType
      ? 'lux'
      : undefined;

  let defaultRoomRate = 0;
  if (roomType && settings?.roomTariffs?.[roomType] !== undefined) {
    defaultRoomRate = safeAmount(settings.roomTariffs[roomType]);
  } else if (assignedRoom?.priceMonthly) {
    defaultRoomRate = safeAmount(assignedRoom.priceMonthly);
  } else if (student?.monthlyTariff) {
    defaultRoomRate = safeAmount(student.monthlyTariff);
  } else if (application?.monthlyTariff) {
    defaultRoomRate = safeAmount(application.monthlyTariff);
  } else if (contract?.tariffMonthly) {
    defaultRoomRate = safeAmount(contract.tariffMonthly);
  }

  const hasCustomOverride = Boolean(
    ledger?.monthlyRateOverride !== undefined &&
      Number.isFinite(ledger.monthlyRateOverride) &&
      ledger.monthlyRateOverride > 0
  );
  const monthlyRate = hasCustomOverride
    ? safeAmount(ledger!.monthlyRateOverride, defaultRoomRate)
    : defaultRoomRate;

  const capacity =
    assignedRoom?.capacity ||
    (roomType ? ROOM_TYPE_CAPACITY[roomType] : undefined);

  return {
    monthlyRate,
    defaultRoomRate,
    hasCustomOverride,
    roomType,
    capacity,
    room: assignedRoom,
  };
}

export function findLinkedApplication(
  student: Student | undefined,
  applications: Application[]
): Application | undefined {
  if (!student) return undefined;
  const phoneKey = normalizePhoneKey(student.phone || '');
  return applications.find(
    (a) =>
      (student.applicationId && a.id === student.applicationId) ||
      a.studentId === student.id ||
      (phoneKey.length >= 7 && normalizePhoneKey(a.phone) === phoneKey)
  );
}

export function createEmptyLedger(studentId: string): StudentBillingLedger {
  const months: Record<string, MonthlyBillingEntry> = {};
  ACADEMIC_BILLING_MONTHS.forEach((m) => {
    months[m.period] = {
      period: m.period,
      status: 'pending',
      paidAmount: 0,
    };
  });
  return {
    studentId,
    months,
    updatedAt: new Date().toISOString(),
  };
}

export interface ComputedMonthRow {
  period: string;
  labelUz: string;
  labelUzCyrl: string;
  labelRu: string;
  labelEn: string;
  rate: number;
  status: BillingEntryStatus;
  paidAmount: number;
  remainingAmount: number;
  isActiveMonth: boolean;
  paymentDate?: string;
  paidUntil?: string;
  paymentMethod?: BillingPaymentMethod;
  notes?: string;
}

export interface StudentBillingSummary {
  entityId: string;
  monthlyRate: number;
  defaultRoomRate: number;
  hasCustomOverride: boolean;
  roomType?: RoomType;
  capacity?: number;
  room?: Room;
  months: ComputedMonthRow[];
  activeMonthsCount: number;
  totalActiveExpected: number;
  totalMonthlyPaid: number;
  monthlyRemaining: number;
  totalExpected: number;
  totalPaid: number;
  remainingBalance: number;
  paidUntilPeriod?: string;
  paidUntilDate?: string;
  nextDuePeriod?: string;
  lastPaymentDate?: string;
  lastPaymentMethod?: BillingPaymentMethod;
  lastPaymentAmount?: number;
}

export function computeStudentBillingSummary(params: {
  entityId: string;
  student?: Student;
  application?: Application;
  contract?: Contract;
  rooms: Room[];
  settings: DormSettings;
  payments: Payment[];
  ledger?: StudentBillingLedger;
}): StudentBillingSummary {
  const {
    entityId,
    student,
    application,
    contract,
    rooms,
    settings,
    payments,
    ledger,
  } = params;

  const rateInfo = resolveMonthlyRateInfo({
    student,
    application,
    rooms,
    settings,
    contract,
    ledger,
  });
  const monthlyRate = rateInfo.monthlyRate;
  const currentPeriod = getCurrentBillingPeriod();

  // Determine residency start month within 2026-09 .. 2027-08
  const rawStartDate =
    contract?.startDate ||
    (student?.roomNumber ? student.createdAt : undefined) ||
    application?.submittedAt;
  const rawStartPeriod = rawStartDate ? rawStartDate.slice(0, 7) : currentPeriod;
  const firstAcademic = ACADEMIC_BILLING_MONTHS[0].period;
  const lastAcademic = ACADEMIC_BILLING_MONTHS[ACADEMIC_BILLING_MONTHS.length - 1].period;
  const startPeriod =
    rawStartPeriod < firstAcademic
      ? firstAcademic
      : rawStartPeriod > lastAcademic
      ? lastAcademic
      : rawStartPeriod;

  // Strictly include completed monthly payments (valid YYYY-MM periods only)
  const completedStudentPayments = payments
    .filter(
      (p) =>
        p.studentId === entityId &&
        p.status === 'completed' &&
        isValidBillingPeriod(p.periodMonth)
    )
    .sort(comparePaymentsChronoDesc);

  const combinePaymentDateTime = (p?: Payment): string | undefined => {
    if (!p?.paymentDate) return undefined;
    const d = extractDatePart(p.paymentDate);
    const t = extractTimePart(p.paymentDate, p.paymentTime);
    if (d && t) return `${d}T${t}`;
    return p.paymentDate;
  };

  const hasStartedResidency = Boolean(
    student?.status === 'active' ||
      student?.roomNumber ||
      application?.status === 'approved'
  );

  // Build 12-month rows (2026-09 through 2027-08)
  const months: ComputedMonthRow[] = ACADEMIC_BILLING_MONTHS.map((meta) => {
    const ledgerEntry = ledger?.months?.[meta.period];
    const matchedPayments = completedStudentPayments.filter(
      (p) => p.periodMonth === meta.period
    );
    const paymentsSum = matchedPayments.reduce(
      (sum, p) => sum + safeAmount(p.amount),
      0
    );

    const rowRate =
      ledgerEntry?.scheduledAmount !== undefined && ledgerEntry.scheduledAmount > 0
        ? safeAmount(ledgerEntry.scheduledAmount)
        : monthlyRate;

    let status: BillingEntryStatus = ledgerEntry?.status || 'pending';
    let paidAmount = ledgerEntry ? safeAmount(ledgerEntry.paidAmount) : 0;
    let paymentDate =
      ledgerEntry?.paymentDate ||
      (paidAmount > 0 ? combinePaymentDateTime(matchedPayments[0]) : undefined);
    let paymentMethod =
      normalizeBillingMethod(ledgerEntry?.paymentMethod) ||
      (paidAmount > 0 ? normalizeBillingMethod(matchedPayments[0]?.paymentMethod) : undefined);
    let notes = ledgerEntry?.notes;

    if (!ledgerEntry && paymentsSum > 0) {
      paidAmount = paymentsSum;
      status = rowRate > 0 && paymentsSum >= rowRate ? 'paid' : 'partial';
      paymentDate = combinePaymentDateTime(matchedPayments[0]);
      paymentMethod = normalizeBillingMethod(matchedPayments[0]?.paymentMethod);
      notes = matchedPayments[0]?.notes;
    } else if (status === 'paid' && paidAmount === 0 && rowRate > 0) {
      paidAmount = rowRate;
    } else if (status === 'pending') {
      paidAmount = 0;
    }

    // Resolve coverage end date for this month row (explicit paidUntil or paymentDate + 30 days)
    const explicitRowPaidUntil =
      (isValidIsoDate(ledgerEntry?.paidUntil) ? ledgerEntry!.paidUntil!.trim() : '') ||
      (isValidIsoDate(matchedPayments[0]?.paidUntil) ? matchedPayments[0]!.paidUntil!.trim() : '');
    const paidUntil =
      paidAmount > 0
        ? explicitRowPaidUntil || (paymentDate ? addDaysToDateStr(paymentDate, 30) : undefined)
        : undefined;

    const isElapsedOrCurrent =
      hasStartedResidency &&
      meta.period >= startPeriod &&
      meta.period <= currentPeriod;
    const isActiveMonth = isElapsedOrCurrent;

    const remainingAmount =
      status === 'paid'
        ? 0
        : Math.max(0, rowRate - paidAmount);

    return {
      period: meta.period,
      labelUz: meta.uz,
      labelUzCyrl: meta.uzCyrl,
      labelRu: meta.ru,
      labelEn: meta.en,
      rate: rowRate,
      status,
      paidAmount,
      remainingAmount,
      isActiveMonth,
      paymentDate,
      paidUntil,
      paymentMethod,
      notes,
    };
  });

  const activeMonths = months.filter((m) => m.isActiveMonth);
  const activeMonthsCount = activeMonths.length;
  const totalActiveExpected = activeMonths.reduce((sum, m) => sum + m.rate, 0);
  const totalMonthlyPaid = months.reduce((sum, m) => sum + m.paidAmount, 0);
  const monthlyRemaining = activeMonths.reduce(
    (sum, m) => sum + (m.status === 'paid' ? 0 : Math.max(0, m.rate - m.paidAmount)),
    0
  );

  const totalExpected = totalActiveExpected;
  const totalPaid = totalMonthlyPaid;
  const remainingBalance = monthlyRemaining;

  const paidMonths = months.filter((m) => m.status === 'paid');
  const paidUntilPeriod =
    paidMonths.length > 0 ? paidMonths[paidMonths.length - 1].period : undefined;
  const firstUnpaidActive = months.find(
    (m) => m.status !== 'paid' && m.period >= startPeriod
  );

  // Resolve authoritative active paidUntilDate (YYYY-MM-DD) from actual payment coverage dates
  // (never truncated to end of calendar month).
  const candidatePaidUntilDates: string[] = [];
  if (totalMonthlyPaid > 0 || completedStudentPayments.length > 0) {
    completedStudentPayments.forEach((p) => {
      if (isValidIsoDate(p.paidUntil)) {
        candidatePaidUntilDates.push(p.paidUntil!.trim());
      } else if (extractDatePart(p.paymentDate)) {
        const computed = addDaysToDateStr(p.paymentDate, 30);
        if (isValidIsoDate(computed)) candidatePaidUntilDates.push(computed);
      }
    });
    months.forEach((m) => {
      if (m.paidAmount > 0 && isValidIsoDate(m.paidUntil)) {
        candidatePaidUntilDates.push(m.paidUntil!.trim());
      }
    });
    if (isValidIsoDate(ledger?.paidUntil)) {
      candidatePaidUntilDates.push(ledger!.paidUntil!.trim());
    }
  }
  candidatePaidUntilDates.sort();
  const paidUntilDate =
    candidatePaidUntilDates.length > 0
      ? candidatePaidUntilDates[candidatePaidUntilDates.length - 1]
      : undefined;

  const latestPayment = completedStudentPayments[0];

  return {
    entityId,
    monthlyRate,
    defaultRoomRate: rateInfo.defaultRoomRate,
    hasCustomOverride: rateInfo.hasCustomOverride,
    roomType: rateInfo.roomType,
    capacity: rateInfo.capacity,
    room: rateInfo.room,
    months,
    activeMonthsCount,
    totalActiveExpected,
    totalMonthlyPaid,
    monthlyRemaining,
    totalExpected,
    totalPaid,
    remainingBalance,
    paidUntilPeriod,
    paidUntilDate,
    nextDuePeriod: firstUnpaidActive?.period,
    lastPaymentDate: combinePaymentDateTime(latestPayment),
    lastPaymentMethod: normalizeBillingMethod(latestPayment?.paymentMethod),
    lastPaymentAmount: latestPayment ? safeAmount(latestPayment.amount) : undefined,
  };
}
