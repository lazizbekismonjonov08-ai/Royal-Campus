import { supabase } from '../supabaseClient';
import {
  Application,
  ApplicationStatus,
  Bed,
  BedStatus,
  BillingPaymentMethod,
  Contract,
  DormSettings,
  MonthlyBillingEntry,
  Payment,
  Room,
  RoomType,
  StaffUser,
  Student,
  StudentBillingLedger,
} from '../types';
import { generateInitialRooms, INITIAL_SETTINGS } from '../data/seedData';
import {
  ACADEMIC_BILLING_MONTHS,
  addDaysToDateStr,
  comparePaymentsChronoDesc,
  computePaymentExpiryInfo,
  computeStudentBillingSummary,
  ensureDateTimeValue,
  extractDatePart,
  extractTimePart,
  findLinkedApplication,
  getCurrentBillingPeriod,
  getCurrentLocalDateTime,
  isValidBillingPeriod,
  isValidIsoDate,
  safeAmount,
} from '../utils/billingUtils';
import { displayToIsoDate, normalizeToDisplayDate } from '../utils/dateValidation';
import { formatUzPhoneDisplay, normalizePhoneKey, phonesMatch } from '../utils/authCrypto';

// ==========================================
// SUPABASE PUBLIC SCHEMA ROW DEFINITIONS
// ==========================================

export interface SupabaseRoomRow {
  id: string;
  floor: number;
  room_number: string | number;
  capacity: number;
  tier: string;
  monthly_rate: number;
}

export interface SupabaseBedRow {
  id: string;
  room_id: string;
  floor: number;
  room_number: string | number;
  bed_number: number | string;
  status: string;
  resident_id: string | null;
  application_id: string | null;
}

export interface SupabaseApplicationRow {
  id: string;
  full_name: string;
  phone: string;
  birth_date: string | null;
  passport: string;
  university: string;
  faculty: string;
  degree: string | null;
  course: string | number | null;
  group_name: string | null;
  parent_phone: string | null;
  address: string | null;
  tier: string | null;
  status: string;
  assigned_bed_id: string | null;
  created_at: string | null;
}

export interface SupabaseResidentRow {
  id: string;
  application_id: string | null;
  full_name: string;
  phone: string;
  password: string | null;
  birth_date: string | null;
  passport: string;
  university: string;
  faculty: string;
  degree: string | null;
  course: string | number | null;
  group_name: string | null;
  parent_phone: string | null;
  address: string | null;
  tier: string | null;
  monthly_rate: number;
  floor: number | null;
  room_number: string | number | null;
  bed_number: number | string | null;
  bed_id: string | null;
  paid_until: string | null;
  created_at: string | null;
}

export interface SupabasePaymentRow {
  id: string;
  resident_id: string;
  period_label: string;
  amount: number;
  method: string;
  paid_at: string;
  paid_until: string | null;
  note: string | null;
}

export interface SupabaseStaffUserRow {
  id: string;
  full_name: string;
  role_title: string;
  login: string;
  password: string;
  is_active: boolean;
  created_at: string | null;
}

export interface SupabaseHydrationResult {
  rooms: Room[];
  applications: Application[];
  students: Student[];
  payments: Payment[];
  billingLedgers: Record<string, StudentBillingLedger>;
  contracts: Contract[];
  staffUsers: StaffUser[];
}

// ==========================================
// CANONICAL FIELD MAPPERS
// ==========================================

const TIER_DB_LABELS: Record<RoomType, string> = {
  standard: 'Standard',
  standard_plus: 'Standard plus',
  comfort: 'Comfort',
  comfort_plus: 'Comfort plus',
  lux: 'Lux',
};

export function formatTierForDb(type?: RoomType): string {
  if (!type) return 'Comfort';
  return TIER_DB_LABELS[type] || 'Comfort';
}

export function parseTierFromDb(raw?: string | null): RoomType {
  const norm = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (norm === 'standard') return 'standard';
  if (norm === 'standard_plus') return 'standard_plus';
  if (norm === 'comfort') return 'comfort';
  if (norm === 'comfort_plus') return 'comfort_plus';
  if (norm === 'lux') return 'lux';
  return 'comfort';
}

export function formatBedStatusForDb(status?: BedStatus): string {
  switch (status) {
    case 'occupied':
      return 'Occupied';
    case 'maintenance':
      return 'Maintenance';
    case 'reserved':
      return 'Reserved';
    case 'available':
    default:
      return 'Available';
  }
}

export function parseBedStatusFromDb(raw?: string | null): BedStatus {
  const norm = String(raw || '')
    .trim()
    .toLowerCase();
  if (norm === 'occupied') return 'occupied';
  if (norm === 'maintenance') return 'maintenance';
  if (norm === 'reserved') return 'reserved';
  return 'available';
}

export function parseApplicationStatusFromDb(raw?: string | null): ApplicationStatus {
  const norm = String(raw || '')
    .trim()
    .toLowerCase();
  if (norm === 'under_review') return 'under_review';
  if (norm === 'approved') return 'approved';
  if (norm === 'rejected') return 'rejected';
  if (norm === 'correction_requested') return 'correction_requested';
  return 'new';
}

export function parseMethodFromDb(raw?: string | null): BillingPaymentMethod {
  const norm = String(raw || '')
    .trim()
    .toLowerCase();
  if (norm === 'cash' || norm === 'naqd' || norm === 'наличные') return 'cash';
  if (norm === 'card' || norm === 'karta' || norm === 'карта') return 'card';
  if (norm === 'click') return 'click';
  if (norm === 'payme') return 'payme';
  if (
    norm === 'bank_transfer' ||
    norm === 'bank transfer' ||
    norm === 'перевод' ||
    norm.includes('o‘tkaz') ||
    norm.includes("o'tkaz") ||
    norm.includes('transfer')
  ) {
    return 'bank_transfer';
  }
  if (norm === 'click_payme') return 'click';
  return 'cash';
}

export function parsePeriodLabelFromDb(raw?: string | null): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return getCurrentBillingPeriod();
  if (isValidBillingPeriod(trimmed)) return trimmed;

  const isoMatch = trimmed.match(/(\d{4}-\d{2})/);
  if (isoMatch && isValidBillingPeriod(isoMatch[1])) {
    return isoMatch[1];
  }

  const lower = trimmed.toLowerCase();
  const matched = ACADEMIC_BILLING_MONTHS.find(
    (m) =>
      m.uz.toLowerCase() === lower ||
      m.uzCyrl.toLowerCase() === lower ||
      m.ru.toLowerCase() === lower ||
      m.en.toLowerCase() === lower
  );
  if (matched) return matched.period;

  return getCurrentBillingPeriod();
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Converts local 'YYYY-MM-DDTHH:mm' into an ISO-8601 string with local timezone offset
 * so Postgres timestamptz / timestamp / text columns store the exact instant cleanly.
 */
export function toSupabaseTimestamp(val?: string): string {
  const normalized = ensureDateTimeValue(val);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return new Date().toISOString();

  const localDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    0,
    0
  );
  if (Number.isNaN(localDate.getTime())) return new Date().toISOString();

  const tzOffsetMin = -localDate.getTimezoneOffset();
  const sign = tzOffsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(tzOffsetMin);
  const offH = pad2(Math.floor(absMin / 60));
  const offM = pad2(absMin % 60);

  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00${sign}${offH}:${offM}`;
}

/**
 * Converts a Supabase timestamp string back into local 'YYYY-MM-DDTHH:mm'.
 */
export function fromSupabaseTimestampToLocalDateTime(raw?: string | null): string {
  if (!raw || !raw.trim()) return getCurrentLocalDateTime();
  const trimmed = raw.trim();

  // If timestamp contains timezone offset or Z, convert accurately to local wall time
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}T${pad2(
        parsed.getHours()
      )}:${pad2(parsed.getMinutes())}`;
    }
  }

  return ensureDateTimeValue(trimmed);
}

/**
 * Converts a display date ('DD.MM.YYYY') or ISO date ('YYYY-MM-DD') to ISO 'YYYY-MM-DD' or null.
 * Ensures compatibility with both Postgres DATE and TEXT columns.
 */
export function toSupabaseDateOrNull(val?: string | null): string | null {
  if (!val || !val.trim()) return null;
  const trimmed = val.trim();
  const isoPart = extractDatePart(trimmed);
  if (isValidIsoDate(isoPart)) return isoPart;
  const converted = displayToIsoDate(trimmed);
  if (isValidIsoDate(converted)) return converted;
  return null;
}

function toNumericOrString(val?: string | number | null): string | number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  const trimmed = String(val).trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function formatCreatedAtDisplay(raw?: string | null): string {
  if (!raw) return new Date().toISOString().replace('T', ' ').slice(0, 16);
  const localDt = fromSupabaseTimestampToLocalDateTime(raw);
  return localDt.replace('T', ' ').slice(0, 16);
}

// ==========================================
// DOMAIN -> SUPABASE ROW SERIALIZERS
// ==========================================

export function roomToSupabaseRow(room: Room): SupabaseRoomRow {
  return {
    id: room.id,
    floor: room.floor,
    room_number: toNumericOrString(room.roomNumber) ?? room.roomNumber,
    capacity: room.capacity || room.beds.length || 1,
    tier: formatTierForDb(room.type),
    monthly_rate: safeAmount(room.priceMonthly, INITIAL_SETTINGS.roomTariffs[room.type]),
  };
}

export function bedToSupabaseRow(
  bed: Bed,
  room: Pick<Room, 'id' | 'floor' | 'roomNumber'>,
  applicationId?: string | null
): SupabaseBedRow {
  return {
    id: bed.id,
    room_id: room.id,
    floor: room.floor,
    room_number: toNumericOrString(room.roomNumber) ?? room.roomNumber,
    bed_number: toNumericOrString(bed.bedIdentifier || bed.bedNumber) ?? 1,
    status: formatBedStatusForDb(bed.status),
    resident_id: bed.studentId || null,
    application_id: applicationId || null,
  };
}

export function applicationToSupabaseRow(
  app: Application,
  assignedBedId?: string | null
): SupabaseApplicationRow {
  return {
    id: app.id,
    full_name: app.fullName.trim(),
    phone: app.phone.trim(),
    birth_date: toSupabaseDateOrNull(app.birthDate),
    passport: app.passportNumber.trim().toUpperCase(),
    university: app.university.trim(),
    faculty: app.faculty.trim(),
    degree: app.degreeLevel || 'Bakalavr',
    course: toNumericOrString(app.course) ?? '1',
    group_name: app.group?.trim() || '',
    parent_phone: app.parentPhone?.trim() || '',
    address: app.permanentAddress?.trim() || '',
    tier: formatTierForDb(app.preferredRoomType),
    status: app.status || 'new',
    assigned_bed_id: assignedBedId ?? null,
    created_at: app.submittedAt ? toSupabaseTimestamp(app.submittedAt) : new Date().toISOString(),
  };
}

export function studentToSupabaseRow(student: Student): SupabaseResidentRow {
  return {
    id: student.id,
    application_id: student.applicationId || null,
    full_name: student.fullName.trim(),
    phone: student.phone.trim(),
    password: student.tempPassword?.trim() || null,
    birth_date: toSupabaseDateOrNull(student.birthDate),
    passport: student.passportNumber.trim().toUpperCase(),
    university: student.university.trim(),
    faculty: student.faculty.trim(),
    degree: student.degreeLevel || 'Bakalavr',
    course: toNumericOrString(student.course) ?? '1',
    group_name: student.group?.trim() || '',
    parent_phone: student.parentPhone?.trim() || '',
    address: student.permanentAddress?.trim() || '',
    tier: formatTierForDb(student.roomType),
    monthly_rate: safeAmount(student.monthlyTariff, 0),
    floor: student.floor ?? null,
    room_number: toNumericOrString(student.roomNumber),
    bed_number: toNumericOrString(student.bedIdentifier ?? student.bedNumber),
    bed_id: student.bedId || null,
    paid_until: toSupabaseDateOrNull(student.paidUntil),
    created_at: student.createdAt
      ? toSupabaseTimestamp(student.createdAt)
      : new Date().toISOString(),
  };
}

export function paymentToSupabaseRow(payment: Payment): SupabasePaymentRow {
  const paidAt = toSupabaseTimestamp(payment.paymentDate || payment.date);
  const paidUntil =
    toSupabaseDateOrNull(payment.paidUntil) ||
    toSupabaseDateOrNull(addDaysToDateStr(payment.paymentDate || payment.date, 30));

  return {
    id: payment.id,
    resident_id: payment.studentId,
    period_label: payment.periodMonth || getCurrentBillingPeriod(),
    amount: safeAmount(payment.amount, 0),
    method: payment.paymentMethod || 'cash',
    paid_at: paidAt,
    paid_until: paidUntil,
    note: payment.notes?.trim() || null,
  };
}

export function staffUserToSupabaseRow(staff: StaffUser): SupabaseStaffUserRow {
  return {
    id: staff.id,
    full_name: staff.fullName.trim(),
    role_title: staff.roleTitle.trim(),
    login: staff.login.trim(),
    password: staff.password,
    is_active: Boolean(staff.isActive),
    created_at: staff.createdAt
      ? toSupabaseTimestamp(staff.createdAt)
      : new Date().toISOString(),
  };
}

export function supabaseRowToStaffUser(row: SupabaseStaffUserRow): StaffUser {
  return {
    id: String(row.id),
    fullName: String(row.full_name || '').trim(),
    roleTitle: String(row.role_title || '').trim(),
    login: String(row.login || '').trim(),
    password: String(row.password || ''),
    isActive: row.is_active !== false,
    createdAt: formatCreatedAtDisplay(row.created_at),
  };
}

// ==========================================
// INITIAL LOAD & ONE-TIME SEEDING
// ==========================================

let inFlightHydration: Promise<SupabaseHydrationResult | null> | null = null;

async function upsertInBatches(
  table: string,
  rows: Record<string, unknown>[],
  batchSize = 100
): Promise<boolean> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`[SupabaseSync] Failed to upsert batch into ${table}:`, error.message);
      return false;
    }
  }
  return true;
}

/**
 * Loads rooms, beds, applications, residents, and payments from Supabase.
 * Automatically seeds all 56 rooms (Floors 2–5) and 344 beds (1–86 per floor, Available)
 * once when `rooms` or `beds` are empty in Supabase.
 */
export async function loadAndSeedSupabaseData(
  settings: DormSettings = INITIAL_SETTINGS
): Promise<SupabaseHydrationResult | null> {
  if (inFlightHydration) {
    return inFlightHydration;
  }

  inFlightHydration = (async (): Promise<SupabaseHydrationResult | null> => {
    try {
      const [roomsRes, bedsRes, appsRes, residentsRes, paymentsRes, staffRes] = await Promise.all([
        supabase.from('rooms').select('*'),
        supabase.from('beds').select('*'),
        supabase.from('applications').select('*'),
        supabase.from('residents').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('staff_users').select('*'),
      ]);

      const queryError =
        roomsRes.error ||
        bedsRes.error ||
        appsRes.error ||
        residentsRes.error ||
        paymentsRes.error;

      if (queryError) {
        console.warn('[SupabaseSync] Could not load tables from Supabase:', queryError.message);
        return null;
      }

      if (staffRes.error) {
        console.warn('[SupabaseSync] Could not load staff_users from Supabase:', staffRes.error.message);
      }

      let roomRows = (roomsRes.data || []) as SupabaseRoomRow[];
      let bedRows = (bedsRes.data || []) as SupabaseBedRow[];
      const appRows = (appsRes.data || []) as SupabaseApplicationRow[];
      const residentRows = (residentsRes.data || []) as SupabaseResidentRow[];
      const paymentRows = (paymentsRes.data || []) as SupabasePaymentRow[];
      const staffRows = (staffRes.error ? [] : staffRes.data || []) as SupabaseStaffUserRow[];

      const seedRooms = generateInitialRooms();

      // 1. Seed 56 rooms once if `rooms` table is empty
      if (roomRows.length === 0) {
        const rowsToInsert = seedRooms.map(roomToSupabaseRow);
        const ok = await upsertInBatches('rooms', rowsToInsert as unknown as Record<string, unknown>[]);
        if (ok) {
          roomRows = rowsToInsert;
        }
      }

      // 2. Seed all beds (1–86 per floor across Floors 2–5, Available) once if `beds` table is empty
      if (bedRows.length === 0 && roomRows.length > 0) {
        const roomLookupByFloorNum = new Map<string, SupabaseRoomRow>();
        roomRows.forEach((rr) => {
          roomLookupByFloorNum.set(`${rr.floor}-${String(rr.room_number).trim()}`, rr);
        });

        const bedsToInsert: SupabaseBedRow[] = [];
        seedRooms.forEach((seedRoom) => {
          const matchedDbRoom = roomLookupByFloorNum.get(
            `${seedRoom.floor}-${String(seedRoom.roomNumber).trim()}`
          );
          const resolvedRoomId = matchedDbRoom ? matchedDbRoom.id : seedRoom.id;
          seedRoom.beds.forEach((b) => {
            bedsToInsert.push({
              id: b.id,
              room_id: resolvedRoomId,
              floor: seedRoom.floor,
              room_number: toNumericOrString(seedRoom.roomNumber) ?? seedRoom.roomNumber,
              bed_number: toNumericOrString(b.bedNumber) ?? b.bedNumber,
              status: 'Available',
              resident_id: null,
              application_id: null,
            });
          });
        });

        const ok = await upsertInBatches('beds', bedsToInsert as unknown as Record<string, unknown>[]);
        if (ok) {
          bedRows = bedsToInsert;
        }
      }

      // 3. Reconstruct Rooms & Beds
      const bedsByRoomId = new Map<string, SupabaseBedRow[]>();
      const bedsByFloorRoom = new Map<string, SupabaseBedRow[]>();
      const bedRowById = new Map<string, SupabaseBedRow>();

      bedRows.forEach((b) => {
        bedRowById.set(b.id, b);
        const byRoom = bedsByRoomId.get(b.room_id) || [];
        byRoom.push(b);
        bedsByRoomId.set(b.room_id, byRoom);

        const frKey = `${b.floor}-${String(b.room_number).trim()}`;
        const byFr = bedsByFloorRoom.get(frKey) || [];
        byFr.push(b);
        bedsByFloorRoom.set(frKey, byFr);
      });

      const residentRowById = new Map<string, SupabaseResidentRow>();
      const residentRowByBedId = new Map<string, SupabaseResidentRow>();
      const residentRowByAppId = new Map<string, SupabaseResidentRow>();
      residentRows.forEach((r) => {
        residentRowById.set(r.id, r);
        if (r.bed_id) residentRowByBedId.set(r.bed_id, r);
        if (r.application_id) residentRowByAppId.set(r.application_id, r);
      });

      const sortNumericAsc = (a: string | number, b: string | number): number => {
        const na = Number(a);
        const nb = Number(b);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return String(a).localeCompare(String(b));
      };

      const sortedRoomRows = [...roomRows].sort((a, b) => {
        if (a.floor !== b.floor) return a.floor - b.floor;
        return sortNumericAsc(a.room_number, b.room_number);
      });

      const hydratedRooms: Room[] = sortedRoomRows.map((rr) => {
        const roomType = parseTierFromDb(rr.tier);
        const roomNumberStr = String(rr.room_number);
        const matchedBedRows =
          bedsByRoomId.get(rr.id) ||
          bedsByFloorRoom.get(`${rr.floor}-${roomNumberStr.trim()}`) ||
          [];

        const sortedBeds = [...matchedBedRows].sort((a, b) =>
          sortNumericAsc(a.bed_number, b.bed_number)
        );

        const beds: Bed[] = sortedBeds.map((br) => {
          const linkedResident =
            (br.resident_id ? residentRowById.get(br.resident_id) : undefined) ||
            residentRowByBedId.get(br.id);

          let status = parseBedStatusFromDb(br.status);
          if (linkedResident) {
            status = 'occupied';
          } else if (status === 'occupied' && !br.resident_id) {
            status = 'available';
          }

          const bedNumVal = Number(br.bed_number);
          return {
            id: br.id,
            roomId: rr.id,
            bedNumber: Number.isNaN(bedNumVal) ? String(br.bed_number) : bedNumVal,
            bedIdentifier: String(br.bed_number),
            status,
            studentId: linkedResident?.id || (status === 'occupied' ? br.resident_id || undefined : undefined),
            studentName: linkedResident?.full_name || undefined,
          };
        });

        const priceMonthly =
          safeAmount(rr.monthly_rate, 0) > 0
            ? safeAmount(rr.monthly_rate)
            : settings.roomTariffs?.[roomType] ?? INITIAL_SETTINGS.roomTariffs[roomType];

        return {
          id: rr.id,
          roomNumber: roomNumberStr,
          floor: Number(rr.floor) || 2,
          type: roomType,
          capacity: Number(rr.capacity) || beds.length || 6,
          priceMonthly,
          beds,
          status: 'available',
        };
      });

      const roomById = new Map<string, Room>();
      const roomByFloorNum = new Map<string, Room>();
      const bedToRoom = new Map<string, { room: Room; bed: Bed }>();
      hydratedRooms.forEach((rm) => {
        roomById.set(rm.id, rm);
        roomByFloorNum.set(`${rm.floor}-${rm.roomNumber.trim()}`, rm);
        rm.beds.forEach((b) => {
          bedToRoom.set(b.id, { room: rm, bed: b });
        });
      });

      // 4. Reconstruct Applications
      const sortedAppRows = [...appRows].sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || ''))
      );

      const hydratedApplications: Application[] = sortedAppRows.map((ar) => {
        const prefType = parseTierFromDb(ar.tier);
        const linkedRes = residentRowByAppId.get(ar.id);
        const assignedBedInfo = ar.assigned_bed_id
          ? bedToRoom.get(ar.assigned_bed_id)
          : linkedRes?.bed_id
          ? bedToRoom.get(linkedRes.bed_id)
          : undefined;

        const assignedBedRow = ar.assigned_bed_id ? bedRowById.get(ar.assigned_bed_id) : undefined;
        const resolvedRoomNum =
          assignedBedInfo?.room.roomNumber ||
          (assignedBedRow ? String(assignedBedRow.room_number) : undefined) ||
          (linkedRes?.room_number != null ? String(linkedRes.room_number) : undefined);
        const resolvedBedIdent =
          assignedBedInfo?.bed.bedIdentifier ||
          (assignedBedRow ? String(assignedBedRow.bed_number) : undefined) ||
          (linkedRes?.bed_number != null ? String(linkedRes.bed_number) : undefined);
        const resolvedBedNum = resolvedBedIdent ? Number(resolvedBedIdent) : undefined;

        const phoneKey = normalizePhoneKey(ar.phone || '');
        const formattedPhone =
          phoneKey.length >= 9 ? formatUzPhoneDisplay(ar.phone) : ar.phone || '';

        return {
          id: ar.id,
          fullName: ar.full_name || '',
          phone: formattedPhone,
          birthDate: ar.birth_date ? normalizeToDisplayDate(ar.birth_date) : '',
          passportNumber: (ar.passport || '').toUpperCase(),
          university: ar.university || '',
          faculty: ar.faculty || '',
          degreeLevel: ar.degree || 'Bakalavr',
          course:
            ar.course !== null && ar.course !== undefined && /^\d+$/.test(String(ar.course))
              ? Number(ar.course)
              : ar.course || 1,
          group: ar.group_name || '',
          parentPhone: ar.parent_phone || '',
          permanentAddress: ar.address || '',
          status: parseApplicationStatusFromDb(ar.status),
          submittedAt: formatCreatedAtDisplay(ar.created_at),
          preferredRoomType: prefType,
          monthlyTariff:
            linkedRes && safeAmount(linkedRes.monthly_rate, 0) > 0
              ? safeAmount(linkedRes.monthly_rate)
              : settings.roomTariffs?.[prefType] ?? INITIAL_SETTINGS.roomTariffs[prefType],
          studentId: linkedRes?.id,
          assignedRoomNumber: resolvedRoomNum,
          assignedBedNumber:
            resolvedBedNum !== undefined && !Number.isNaN(resolvedBedNum)
              ? resolvedBedNum
              : undefined,
          assignedBedIdentifier: resolvedBedIdent,
          tempLogin: linkedRes ? formattedPhone : undefined,
          tempPassword: linkedRes?.password || undefined,
        };
      });

      // 5. Reconstruct Base Students (Residents)
      const sortedResidentRows = [...residentRows].sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || ''))
      );

      const baseStudents: Student[] = sortedResidentRows.map((rr) => {
        const bedInfo = rr.bed_id ? bedToRoom.get(rr.bed_id) : undefined;
        const matchedRoom =
          bedInfo?.room ||
          (rr.floor != null && rr.room_number != null
            ? roomByFloorNum.get(`${rr.floor}-${String(rr.room_number).trim()}`)
            : undefined);

        const roomType: RoomType = matchedRoom?.type || parseTierFromDb(rr.tier);
        const monthlyTariff =
          safeAmount(rr.monthly_rate, 0) > 0
            ? safeAmount(rr.monthly_rate)
            : matchedRoom?.priceMonthly ??
              settings.roomTariffs?.[roomType] ??
              INITIAL_SETTINGS.roomTariffs[roomType];

        const phoneKey = normalizePhoneKey(rr.phone || '');
        const formattedPhone =
          phoneKey.length >= 9 ? formatUzPhoneDisplay(rr.phone) : rr.phone || '';

        const bedIdent =
          bedInfo?.bed.bedIdentifier ||
          (rr.bed_number !== null && rr.bed_number !== undefined ? String(rr.bed_number) : undefined);
        const bedNumParsed = bedIdent !== undefined ? Number(bedIdent) : undefined;

        const paidUntilIso = toSupabaseDateOrNull(rr.paid_until) || '';
        const createdDateIso =
          extractDatePart(rr.created_at || '') || new Date().toISOString().slice(0, 10);

        return {
          id: rr.id,
          applicationId: rr.application_id || undefined,
          fullName: rr.full_name || '',
          phone: formattedPhone,
          birthDate: rr.birth_date ? normalizeToDisplayDate(rr.birth_date) : '',
          passportNumber: (rr.passport || '').toUpperCase(),
          university: rr.university || '',
          faculty: rr.faculty || '',
          degreeLevel: rr.degree || 'Bakalavr',
          course:
            rr.course !== null && rr.course !== undefined && /^\d+$/.test(String(rr.course))
              ? Number(rr.course)
              : rr.course || 1,
          group: rr.group_name || '',
          parentPhone: rr.parent_phone || '',
          permanentAddress: rr.address || '',
          status: 'active',
          roomId: matchedRoom?.id,
          bedId: rr.bed_id || undefined,
          roomNumber:
            matchedRoom?.roomNumber ||
            (rr.room_number !== null && rr.room_number !== undefined
              ? String(rr.room_number)
              : undefined),
          bedNumber:
            bedNumParsed !== undefined && !Number.isNaN(bedNumParsed) ? bedNumParsed : bedIdent,
          bedIdentifier: bedIdent,
          floor: matchedRoom?.floor ?? (rr.floor !== null ? Number(rr.floor) : undefined),
          roomType,
          monthlyTariff,
          paidUntil: paidUntilIso,
          nextPaymentDueDate: paidUntilIso,
          nextPaymentDate: paidUntilIso,
          debtAmount: 0,
          createdAt: createdDateIso,
          tempLogin: formattedPhone,
          tempPassword: rr.password || undefined,
        };
      });

      const studentById = new Map<string, Student>();
      baseStudents.forEach((s) => studentById.set(s.id, s));

      // 6. Reconstruct Payments
      const hydratedPayments: Payment[] = paymentRows
        .map((pr): Payment => {
          const std = studentById.get(pr.resident_id);
          const localDateTime = fromSupabaseTimestampToLocalDateTime(pr.paid_at);
          const dateOnly = extractDatePart(localDateTime);
          const timeOnly = extractTimePart(localDateTime);
          const periodMonth = parsePeriodLabelFromDb(pr.period_label);
          const method = parseMethodFromDb(pr.method);
          const paidUntilIso =
            toSupabaseDateOrNull(pr.paid_until) || addDaysToDateStr(localDateTime, 30);

          return {
            id: pr.id,
            studentId: pr.resident_id,
            studentName: std?.fullName || 'Rezident',
            floor: std?.floor,
            roomNumber: std?.roomNumber || '---',
            bedLabel:
              std?.bedIdentifier || (std?.bedNumber != null ? String(std.bedNumber) : undefined),
            amount: safeAmount(pr.amount, 0),
            paymentDate: localDateTime,
            paymentTime: timeOnly,
            date: dateOnly,
            paidUntil: paidUntilIso,
            type: 'income',
            periodMonth,
            paymentMethod: method,
            recordedBy: 'Admin',
            status: 'completed',
            notes: pr.note || undefined,
          };
        })
        .sort(comparePaymentsChronoDesc);

      // 7. Reconstruct Contracts for placed residents
      const hydratedContracts: Contract[] = [];
      baseStudents.forEach((s) => {
        if (s.roomNumber && (s.bedIdentifier || s.bedNumber !== undefined)) {
          const bedLabel = s.bedIdentifier || String(s.bedNumber);
          hydratedContracts.push({
            id: `cnt-${s.id}`,
            contractNumber: `RC-2026/${s.roomNumber}-${bedLabel}`,
            studentId: s.id,
            studentName: s.fullName,
            passportNumber: s.passportNumber,
            roomNumber: s.roomNumber,
            bedNumber: s.bedNumber ?? bedLabel,
            bedIdentifier: bedLabel,
            roomType: s.roomType || 'comfort',
            tariffMonthly: s.monthlyTariff,
            startDate: s.createdAt || new Date().toISOString().slice(0, 10),
            endDate: '2027-06-30',
            status: 'active',
            createdAt: s.createdAt || new Date().toISOString().slice(0, 10),
          });
        }
      });

      // 8. Reconstruct Billing Ledgers & sync final Student financial snapshot
      const hydratedLedgers: Record<string, StudentBillingLedger> = {};
      const nowIso = new Date().toISOString();

      const finalStudents: Student[] = baseStudents.map((s) => {
        const stdPayments = hydratedPayments.filter((p) => p.studentId === s.id);
        const room = s.roomId ? roomById.get(s.roomId) : undefined;
        const defaultTierRate =
          (s.roomType ? settings.roomTariffs?.[s.roomType] : undefined) ??
          room?.priceMonthly ??
          s.monthlyTariff;
        const hasRateOverride =
          s.monthlyTariff > 0 && defaultTierRate > 0 && s.monthlyTariff !== defaultTierRate;

        const monthsMap: Record<string, MonthlyBillingEntry> = {};
        ACADEMIC_BILLING_MONTHS.forEach((m) => {
          const monthPayments = stdPayments.filter((p) => p.periodMonth === m.period);
          const totalPaidForMonth = monthPayments.reduce((acc, p) => acc + safeAmount(p.amount), 0);
          if (totalPaidForMonth > 0) {
            const latestForMonth = monthPayments[0];
            monthsMap[m.period] = {
              period: m.period,
              paidAmount: totalPaidForMonth,
              status:
                s.monthlyTariff > 0 && totalPaidForMonth >= s.monthlyTariff ? 'paid' : 'partial',
              paymentDate: latestForMonth?.paymentDate,
              paidUntil:
                latestForMonth?.paidUntil ||
                (latestForMonth?.paymentDate
                  ? addDaysToDateStr(latestForMonth.paymentDate, 30)
                  : undefined),
              paymentMethod: latestForMonth?.paymentMethod || 'cash',
              notes: latestForMonth?.notes,
              updatedAt: nowIso,
            };
          } else {
            monthsMap[m.period] = {
              period: m.period,
              status: 'pending',
              paidAmount: 0,
            };
          }
        });

        const candidatePaidUntil: string[] = [];
        if (isValidIsoDate(s.paidUntil)) {
          candidatePaidUntil.push(s.paidUntil);
        }
        stdPayments.forEach((p) => {
          if (isValidIsoDate(p.paidUntil)) {
            candidatePaidUntil.push(p.paidUntil!);
          }
        });
        candidatePaidUntil.sort();
        const resolvedPaidUntil =
          candidatePaidUntil.length > 0
            ? candidatePaidUntil[candidatePaidUntil.length - 1]
            : undefined;

        const ledger: StudentBillingLedger = {
          studentId: s.id,
          ...(hasRateOverride ? { monthlyRateOverride: s.monthlyTariff } : {}),
          ...(resolvedPaidUntil ? { paidUntil: resolvedPaidUntil } : {}),
          months: monthsMap,
          updatedAt: nowIso,
        };
        hydratedLedgers[s.id] = ledger;

        const linkedApp = findLinkedApplication(s, hydratedApplications);
        const activeCnt = hydratedContracts.find((c) => c.studentId === s.id);
        const summary = computeStudentBillingSummary({
          entityId: s.id,
          student: s,
          application: linkedApp,
          contract: activeCnt,
          rooms: hydratedRooms,
          settings,
          payments: hydratedPayments,
          ledger,
        });

        const finalPaidUntil = resolvedPaidUntil || summary.paidUntilDate || '';
        const expiryInfo = computePaymentExpiryInfo(finalPaidUntil);
        const computedPaymentStatus: 'paid' | 'due_soon' | 'overdue' =
          expiryInfo.status === 'overdue'
            ? 'overdue'
            : expiryInfo.status === 'expiring_soon'
            ? 'due_soon'
            : expiryInfo.status === 'active'
            ? 'paid'
            : summary.remainingBalance > 0
            ? 'overdue'
            : 'paid';

        return {
          ...s,
          monthlyTariff: summary.monthlyRate,
          debtAmount: summary.remainingBalance,
          paymentStatus: computedPaymentStatus,
          paidUntil: finalPaidUntil,
          nextPaymentDueDate: finalPaidUntil,
          nextPaymentDate: finalPaidUntil,
          lastPaymentDate: summary.lastPaymentDate,
        };
      });

      const hydratedStaffUsers: StaffUser[] = [...staffRows]
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
        .map(supabaseRowToStaffUser);

      return {
        rooms: hydratedRooms,
        applications: hydratedApplications,
        students: finalStudents,
        payments: hydratedPayments,
        billingLedgers: hydratedLedgers,
        contracts: hydratedContracts,
        staffUsers: hydratedStaffUsers,
      };
    } catch (err) {
      console.warn(
        '[SupabaseSync] Unexpected error during startup load:',
        err instanceof Error ? err.message : 'Unknown error'
      );
      return null;
    } finally {
      inFlightHydration = null;
    }
  })();

  return inFlightHydration;
}

// ==========================================
// MUTATION PERSISTENCE HELPERS (FK-SAFE ORDER)
// ==========================================

export async function syncUpsertApplication(
  app: Application,
  assignedBedId?: string | null
): Promise<boolean> {
  try {
    const row = applicationToSupabaseRow(app, assignedBedId);
    const { error } = await supabase.from('applications').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[SupabaseSync] Failed to save application:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      '[SupabaseSync] Error saving application:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return false;
  }
}

export async function syncUpdateApplication(
  id: string,
  updates: { status?: ApplicationStatus; assigned_bed_id?: string | null }
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.assigned_bed_id !== undefined) payload.assigned_bed_id = updates.assigned_bed_id;
    if (Object.keys(payload).length === 0) return true;

    const { error } = await supabase.from('applications').update(payload).eq('id', id);
    if (error) {
      console.error('[SupabaseSync] Failed to update application:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      '[SupabaseSync] Error updating application:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return false;
  }
}

export async function syncUpsertResident(student: Student): Promise<boolean> {
  try {
    const row = studentToSupabaseRow(student);
    const { error } = await supabase.from('residents').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[SupabaseSync] Failed to save resident:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      '[SupabaseSync] Error saving resident:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return false;
  }
}

export async function syncUpdateResidentPaidUntil(
  residentId: string,
  paidUntil?: string | null,
  monthlyRate?: number
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      paid_until: toSupabaseDateOrNull(paidUntil),
    };
    if (monthlyRate !== undefined && Number.isFinite(monthlyRate) && monthlyRate > 0) {
      payload.monthly_rate = safeAmount(monthlyRate);
    }
    const { error } = await supabase.from('residents').update(payload).eq('id', residentId);
    if (error) {
      console.error('[SupabaseSync] Failed to update resident paid_until:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      '[SupabaseSync] Error updating resident paid_until:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return false;
  }
}

export async function syncUpdateBedAssignment(params: {
  bedId: string;
  status: BedStatus;
  residentId: string | null;
  applicationId?: string | null;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('beds')
      .update({
        status: formatBedStatusForDb(params.status),
        resident_id: params.residentId,
        application_id: params.applicationId ?? null,
      })
      .eq('id', params.bedId);

    if (error) {
      console.error('[SupabaseSync] Failed to update bed assignment:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      '[SupabaseSync] Error updating bed assignment:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return false;
  }
}

export async function syncUpsertPayments(paymentsToSave: Payment[]): Promise<boolean> {
  if (!paymentsToSave.length) return true;
  try {
    const rows = paymentsToSave.map(paymentToSupabaseRow);
    const { error } = await supabase.from('payments').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('[SupabaseSync] Failed to save payments:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      '[SupabaseSync] Error saving payments:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return false;
  }
}

export async function syncCreateResidentWithPlacement(params: {
  student: Student;
  bedId?: string;
  initialPayments?: Payment[];
}): Promise<void> {
  // 1. Insert resident first (satisfies beds.resident_id and payments.resident_id FKs)
  await syncUpsertResident(params.student);

  // 2. Mark selected bed as Occupied
  if (params.bedId) {
    await syncUpdateBedAssignment({
      bedId: params.bedId,
      status: 'occupied',
      residentId: params.student.id,
      applicationId: params.student.applicationId || null,
    });
  }

  // 3. Insert initial payment(s) if entered and ensure paid_until is updated
  if (params.initialPayments && params.initialPayments.length > 0) {
    await syncUpsertPayments(params.initialPayments);
    if (params.student.paidUntil) {
      await syncUpdateResidentPaidUntil(
        params.student.id,
        params.student.paidUntil,
        params.student.monthlyTariff
      );
    }
  }
}

export async function syncAssignBedFlow(params: {
  student: Student;
  newBedId: string;
  oldBedId?: string;
  applicationId?: string;
  initialPayments?: Payment[];
  replacedPeriod?: string;
}): Promise<void> {
  // 1. Upsert resident with room/bed placement, password, and paid_until
  await syncUpsertResident(params.student);

  // 2. Release previous bed if changing beds
  if (params.oldBedId && params.oldBedId !== params.newBedId) {
    await syncUpdateBedAssignment({
      bedId: params.oldBedId,
      status: 'available',
      residentId: null,
      applicationId: null,
    });
  }

  // 3. Occupy new bed
  await syncUpdateBedAssignment({
    bedId: params.newBedId,
    status: 'occupied',
    residentId: params.student.id,
    applicationId: params.applicationId || null,
  });

  // 4. Update linked application status + assigned_bed_id
  if (params.applicationId) {
    await syncUpdateApplication(params.applicationId, {
      status: 'approved',
      assigned_bed_id: params.newBedId,
    });
  }

  // 5. Persist initial payment(s) if provided during assignment
  if (params.initialPayments && params.initialPayments.length > 0) {
    if (params.replacedPeriod) {
      await supabase
        .from('payments')
        .delete()
        .eq('resident_id', params.student.id)
        .eq('period_label', params.replacedPeriod);
    }
    await syncUpsertPayments(params.initialPayments);
    if (params.student.paidUntil) {
      await syncUpdateResidentPaidUntil(
        params.student.id,
        params.student.paidUntil,
        params.student.monthlyTariff
      );
    }
  }
}

export async function syncRecordPaymentFlow(params: {
  payment: Payment;
  residentId: string;
  paidUntil?: string;
  monthlyRate?: number;
  hasResidentRecord: boolean;
}): Promise<void> {
  await syncUpsertPayments([params.payment]);
  if (params.hasResidentRecord) {
    await syncUpdateResidentPaidUntil(params.residentId, params.paidUntil, params.monthlyRate);
  }
}

export async function syncReplaceResidentPayments(params: {
  residentId: string;
  payments: Payment[];
  paidUntil?: string;
  monthlyRate?: number;
  hasResidentRecord: boolean;
}): Promise<void> {
  try {
    const { error: delErr } = await supabase
      .from('payments')
      .delete()
      .eq('resident_id', params.residentId);
    if (delErr) {
      console.error('[SupabaseSync] Failed to clear resident payments before sync:', delErr.message);
    }
    if (params.payments.length > 0) {
      await syncUpsertPayments(params.payments);
    }
    if (params.hasResidentRecord) {
      await syncUpdateResidentPaidUntil(params.residentId, params.paidUntil, params.monthlyRate);
    }
  } catch (err) {
    console.error(
      '[SupabaseSync] Error syncing resident billing ledger:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

export async function syncDeleteResidentCascade(params: {
  residentId: string;
  bedId?: string;
  linkedAppIds?: string[];
}): Promise<void> {
  try {
    // 1. Release assigned bed(s) back to Available first (clears beds.resident_id FK)
    if (params.bedId) {
      await syncUpdateBedAssignment({
        bedId: params.bedId,
        status: 'available',
        residentId: null,
        applicationId: null,
      });
    }
    await supabase
      .from('beds')
      .update({ status: 'Available', resident_id: null, application_id: null })
      .eq('resident_id', params.residentId);

    // 2. Delete resident's payments (clears payments.resident_id FK)
    await supabase.from('payments').delete().eq('resident_id', params.residentId);

    // 3. Delete resident row
    const { error: resDelErr } = await supabase
      .from('residents')
      .delete()
      .eq('id', params.residentId);
    if (resDelErr) {
      console.error('[SupabaseSync] Failed to delete resident:', resDelErr.message);
    }

    // 4. Delete linked application(s) if any
    if (params.linkedAppIds && params.linkedAppIds.length > 0) {
      await supabase.from('payments').delete().in('resident_id', params.linkedAppIds);
      await supabase
        .from('beds')
        .update({ status: 'Available', resident_id: null, application_id: null })
        .in('application_id', params.linkedAppIds);
      await supabase.from('applications').delete().in('id', params.linkedAppIds);
    }
  } catch (err) {
    console.error(
      '[SupabaseSync] Error deleting resident cascade:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

export async function syncDeleteApplicationCascade(params: {
  applicationId: string;
  linkedStudentIds?: string[];
  linkedBedIds?: string[];
}): Promise<void> {
  try {
    const studentIds = params.linkedStudentIds || [];
    const bedIds = params.linkedBedIds || [];

    if (bedIds.length > 0) {
      await supabase
        .from('beds')
        .update({ status: 'Available', resident_id: null, application_id: null })
        .in('id', bedIds);
    }
    await supabase
      .from('beds')
      .update({ status: 'Available', resident_id: null, application_id: null })
      .eq('application_id', params.applicationId);

    if (studentIds.length > 0) {
      await supabase
        .from('beds')
        .update({ status: 'Available', resident_id: null, application_id: null })
        .in('resident_id', studentIds);
      await supabase.from('payments').delete().in('resident_id', studentIds);
      await supabase.from('residents').delete().in('id', studentIds);
    }

    await supabase.from('payments').delete().eq('resident_id', params.applicationId);
    await supabase.from('applications').delete().eq('id', params.applicationId);
  } catch (err) {
    console.error(
      '[SupabaseSync] Error deleting application cascade:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

export async function syncReleaseBedCascade(params: {
  bedId: string;
  affectedStudentIds: string[];
  affectedAppIds: string[];
}): Promise<void> {
  try {
    await syncUpdateBedAssignment({
      bedId: params.bedId,
      status: 'available',
      residentId: null,
      applicationId: null,
    });

    if (params.affectedStudentIds.length > 0) {
      await supabase
        .from('residents')
        .update({ bed_id: null, floor: null, room_number: null, bed_number: null })
        .in('id', params.affectedStudentIds);
    }

    if (params.affectedAppIds.length > 0) {
      await supabase
        .from('applications')
        .update({ assigned_bed_id: null })
        .in('id', params.affectedAppIds);
    }
  } catch (err) {
    console.error(
      '[SupabaseSync] Error releasing bed cascade:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

export async function syncResetAllBeds(): Promise<void> {
  try {
    await supabase
      .from('beds')
      .update({ status: 'Available', resident_id: null, application_id: null })
      .neq('id', '');
    await supabase
      .from('residents')
      .update({ bed_id: null, floor: null, room_number: null, bed_number: null })
      .neq('id', '');
    await supabase
      .from('applications')
      .update({ assigned_bed_id: null })
      .neq('id', '');
  } catch (err) {
    console.error(
      '[SupabaseSync] Error resetting all beds:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

export async function syncUpsertRoomAndBeds(
  room: Room,
  removedBedIds: string[] = [],
  affectedStudents: Student[] = []
): Promise<void> {
  try {
    const roomRow = roomToSupabaseRow(room);
    await supabase.from('rooms').upsert(roomRow, { onConflict: 'id' });

    if (removedBedIds.length > 0) {
      await supabase.from('beds').delete().in('id', removedBedIds);
    }

    const bedRows = room.beds.map((b) => bedToSupabaseRow(b, room, null));
    if (bedRows.length > 0) {
      await supabase.from('beds').upsert(bedRows, { onConflict: 'id' });
    }

    if (affectedStudents.length > 0) {
      await Promise.all(affectedStudents.map((s) => syncUpsertResident(s)));
    }
  } catch (err) {
    console.error(
      '[SupabaseSync] Error saving room/beds:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

export async function syncDeleteRoomAndBeds(roomId: string): Promise<void> {
  try {
    await supabase.from('beds').delete().eq('room_id', roomId);
    await supabase.from('rooms').delete().eq('id', roomId);
  } catch (err) {
    console.error(
      '[SupabaseSync] Error deleting room:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

export async function syncUpdateSingleBed(
  bedId: string,
  updates: { bedIdentifier?: string; status?: BedStatus }
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {};
    if (updates.bedIdentifier !== undefined) {
      payload.bed_number = toNumericOrString(updates.bedIdentifier) ?? updates.bedIdentifier;
    }
    if (updates.status !== undefined) {
      payload.status = formatBedStatusForDb(updates.status);
    }
    if (Object.keys(payload).length === 0) return;

    await supabase.from('beds').update(payload).eq('id', bedId);
  } catch (err) {
    console.error(
      '[SupabaseSync] Error updating bed:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

export async function syncRoomTariffChanges(
  updatedRooms: Room[],
  updatedStudents: Student[]
): Promise<void> {
  try {
    if (updatedRooms.length > 0) {
      const rows = updatedRooms.map(roomToSupabaseRow);
      await upsertInBatches('rooms', rows as unknown as Record<string, unknown>[]);
    }
    if (updatedStudents.length > 0) {
      const resRows = updatedStudents.map(studentToSupabaseRow);
      await upsertInBatches('residents', resRows as unknown as Record<string, unknown>[]);
    }
  } catch (err) {
    console.error(
      '[SupabaseSync] Error syncing tariff changes:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

// ==========================================
// STAFF_USERS TABLE SYNC & LOGIN VERIFICATION
// ==========================================

export async function fetchStaffUsersFromSupabase(): Promise<StaffUser[] | null> {
  try {
    const { data, error } = await supabase.from('staff_users').select('*');
    if (error) {
      console.warn('[SupabaseSync] Failed to fetch staff_users:', error.message);
      return null;
    }
    const rows = (data || []) as SupabaseStaffUserRow[];
    return [...rows]
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
      .map(supabaseRowToStaffUser);
  } catch (err) {
    console.warn(
      '[SupabaseSync] Error fetching staff_users:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return null;
  }
}

export async function syncInsertStaffUser(
  staff: StaffUser
): Promise<{ ok: boolean; error?: string; saved?: StaffUser }> {
  try {
    const row = staffUserToSupabaseRow(staff);
    const { data, error } = await supabase
      .from('staff_users')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[SupabaseSync] Failed to insert staff user:', error.message);
      return { ok: false, error: error.message };
    }
    return {
      ok: true,
      saved: data ? supabaseRowToStaffUser(data as SupabaseStaffUserRow) : staff,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SupabaseSync] Error inserting staff user:', msg);
    return { ok: false, error: msg };
  }
}

export async function syncUpdateStaffUser(
  id: string,
  updates: {
    fullName?: string;
    roleTitle?: string;
    login?: string;
    password?: string;
    isActive?: boolean;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const payload: Record<string, unknown> = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName.trim();
    if (updates.roleTitle !== undefined) payload.role_title = updates.roleTitle.trim();
    if (updates.login !== undefined) payload.login = updates.login.trim();
    if (updates.password !== undefined) payload.password = updates.password;
    if (updates.isActive !== undefined) payload.is_active = Boolean(updates.isActive);

    if (Object.keys(payload).length === 0) return { ok: true };

    const { error } = await supabase.from('staff_users').update(payload).eq('id', id);
    if (error) {
      console.error('[SupabaseSync] Failed to update staff user:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SupabaseSync] Error updating staff user:', msg);
    return { ok: false, error: msg };
  }
}

export async function syncDeleteStaffUser(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('staff_users').delete().eq('id', id);
    if (error) {
      console.error('[SupabaseSync] Failed to delete staff user:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SupabaseSync] Error deleting staff user:', msg);
    return { ok: false, error: msg };
  }
}

export type StaffLoginVerificationResult =
  | { status: 'ok'; staffUser: StaffUser }
  | { status: 'inactive'; staffUser: StaffUser }
  | { status: 'invalid_password' }
  | { status: 'not_found' };

/**
 * Verifies staff credentials against Supabase `staff_users` (falling back to cached records if offline).
 * Exact case-insensitive login matching in TypeScript avoids wildcard injection from SQL ILIKE.
 */
export async function verifyStaffLoginWithSupabase(
  loginInput: string,
  passwordInput: string,
  cachedStaffUsers: StaffUser[] = []
): Promise<StaffLoginVerificationResult> {
  const normalizedLogin = loginInput.trim().toLowerCase();
  if (!normalizedLogin || !passwordInput) {
    return { status: 'not_found' };
  }

  const remoteList = await fetchStaffUsersFromSupabase();
  const sourceList = remoteList !== null ? remoteList : cachedStaffUsers;

  const matched = sourceList.find(
    (u) => u.login.trim().toLowerCase() === normalizedLogin
  );
  if (!matched) {
    return { status: 'not_found' };
  }

  if (!matched.isActive) {
    return { status: 'inactive', staffUser: matched };
  }

  if (matched.password !== passwordInput) {
    return { status: 'invalid_password' };
  }

  return { status: 'ok', staffUser: matched };
}

// ==========================================
// RESIDENT LOGIN VERIFICATION & PASSWORD SYNC
// ==========================================

export function supabaseRowToBasicStudent(rr: SupabaseResidentRow): Student {
  const roomType: RoomType = parseTierFromDb(rr.tier);
  const phoneKey = normalizePhoneKey(rr.phone || '');
  const formattedPhone =
    phoneKey.length >= 9 ? formatUzPhoneDisplay(rr.phone) : String(rr.phone || '').trim();
  const bedIdent =
    rr.bed_number !== null && rr.bed_number !== undefined ? String(rr.bed_number) : undefined;
  const bedNumParsed = bedIdent !== undefined ? Number(bedIdent) : undefined;
  const paidUntilIso = toSupabaseDateOrNull(rr.paid_until) || '';
  const createdDateIso =
    extractDatePart(rr.created_at || '') || new Date().toISOString().slice(0, 10);

  return {
    id: String(rr.id),
    applicationId: rr.application_id || undefined,
    fullName: String(rr.full_name || '').trim(),
    phone: formattedPhone,
    birthDate: rr.birth_date ? normalizeToDisplayDate(rr.birth_date) : '',
    passportNumber: String(rr.passport || '').trim().toUpperCase(),
    university: String(rr.university || '').trim(),
    faculty: String(rr.faculty || '').trim(),
    degreeLevel: rr.degree || 'Bakalavr',
    course:
      rr.course !== null && rr.course !== undefined && /^\d+$/.test(String(rr.course))
        ? Number(rr.course)
        : rr.course || 1,
    group: String(rr.group_name || '').trim(),
    parentPhone: String(rr.parent_phone || '').trim(),
    permanentAddress: String(rr.address || '').trim(),
    status: 'active',
    bedId: rr.bed_id || undefined,
    roomNumber:
      rr.room_number !== null && rr.room_number !== undefined
        ? String(rr.room_number)
        : undefined,
    bedNumber:
      bedNumParsed !== undefined && !Number.isNaN(bedNumParsed) ? bedNumParsed : bedIdent,
    bedIdentifier: bedIdent,
    floor: rr.floor !== null && rr.floor !== undefined ? Number(rr.floor) : undefined,
    roomType,
    monthlyTariff:
      safeAmount(rr.monthly_rate, 0) > 0
        ? safeAmount(rr.monthly_rate)
        : INITIAL_SETTINGS.roomTariffs[roomType],
    paidUntil: paidUntilIso,
    nextPaymentDueDate: paidUntilIso,
    nextPaymentDate: paidUntilIso,
    debtAmount: 0,
    createdAt: createdDateIso,
    tempLogin: formattedPhone,
    tempPassword: rr.password ? String(rr.password).trim() : undefined,
  };
}

export async function syncUpdateResidentPassword(
  residentId: string,
  newPassword: string,
  fallbackStudent?: Student
): Promise<{ ok: boolean; error?: string }> {
  const trimmedPw = newPassword.trim();
  if (!trimmedPw) {
    return { ok: false, error: 'Empty password' };
  }
  try {
    const { data, error } = await supabase
      .from('residents')
      .update({ password: trimmedPw })
      .eq('id', residentId)
      .select('id');

    if (error) {
      console.error('[SupabaseSync] Failed to update resident password:', error.message);
      return { ok: false, error: error.message };
    }

    if ((!data || data.length === 0) && fallbackStudent) {
      const upserted = await syncUpsertResident({
        ...fallbackStudent,
        tempPassword: trimmedPw,
      });
      return { ok: upserted };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SupabaseSync] Error updating resident password:', msg);
    return { ok: false, error: msg };
  }
}

export type ResidentLoginVerificationResult =
  | { status: 'ok'; resident: Student }
  | { status: 'invalid_password' }
  | { status: 'no_password'; resident: Student }
  | { status: 'not_found' };

/**
 * Queries Supabase `residents` directly during login and matches residents by
 * normalized phone (last 9 digits, stripped +, 998, spaces, dashes, parentheses, or exact),
 * passport, or application ID, then verifies the trimmed password against `residents.password`.
 */
export async function verifyResidentLoginWithSupabase(
  identifierInput: string,
  passwordInput: string,
  cachedStudents: Student[] = []
): Promise<ResidentLoginVerificationResult> {
  const trimmedId = identifierInput.trim();
  const trimmedPassword = passwordInput.trim();
  if (!trimmedId || !trimmedPassword) {
    return { status: 'not_found' };
  }

  const loweredId = trimmedId.toLowerCase();
  let sourceStudents: Student[] = [];

  try {
    const { data, error } = await supabase.from('residents').select('*');
    if (!error && Array.isArray(data)) {
      const rows = [...(data as SupabaseResidentRow[])].sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || ''))
      );
      sourceStudents = rows.map(supabaseRowToBasicStudent);
    } else {
      if (error) {
        console.warn('[SupabaseSync] Could not query residents during login:', error.message);
      }
      sourceStudents = cachedStudents.filter((s) => s.status !== 'deleted_pending_purge');
    }
  } catch (err) {
    console.warn(
      '[SupabaseSync] Error querying residents during login:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    sourceStudents = cachedStudents.filter((s) => s.status !== 'deleted_pending_purge');
  }

  const matchingResidents = sourceStudents.filter((s) => {
    const phoneMatched = phonesMatch(s.phone, trimmedId);
    const passportMatched =
      Boolean(s.passportNumber) && s.passportNumber.trim().toLowerCase() === loweredId;
    const appIdMatched =
      Boolean(s.applicationId) && s.applicationId!.trim().toLowerCase() === loweredId;
    return phoneMatched || passportMatched || appIdMatched;
  });

  if (matchingResidents.length === 0) {
    return { status: 'not_found' };
  }

  // Prefer an exact password match among any matching resident rows
  const passwordMatched = matchingResidents.find(
    (s) => Boolean(s.tempPassword && s.tempPassword.trim()) && s.tempPassword!.trim() === trimmedPassword
  );
  if (passwordMatched) {
    return { status: 'ok', resident: passwordMatched };
  }

  // If any matching resident has a saved password in Supabase, reject wrong password
  const hasSavedPassword = matchingResidents.some((s) => Boolean(s.tempPassword && s.tempPassword.trim()));
  if (hasSavedPassword) {
    return { status: 'invalid_password' };
  }

  return { status: 'no_password', resident: matchingResidents[0] };
}
