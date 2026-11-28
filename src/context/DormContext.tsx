import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Role,
  Room,
  Student,
  Application,
  Payment,
  Contract,
  Employee,
  Issue,
  DisciplineRecord,
  NotificationItem,
  AuditLogEntry,
  DormSettings,
  IssueStatus,
  ApplicationStatus,
  Bed,
  CommonArea,
  RoomType,
  AccessTerminal,
  AccessLogEvent,
  AccessControlPolicy,
  StoredUserAccount,
  MonthlyBillingEntry,
  StudentBillingLedger,
  BillingPaymentMethod,
  InitialBillingSetup,
  BillingEntryStatus,
  StaffUser,
} from '../types';
import {
  formatUzPhoneDisplay,
  normalizePhoneKey,
  generateSalt,
  hashPassword,
  generateTempPassword,
  validateStrongPassword,
} from '../utils/authCrypto';
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
  formatMethodLabel,
  getCurrentBillingPeriod,
  getCurrentLocalDateTime,
  isValidIsoDate,
  normalizeBillingMethod,
  safeAmount,
} from '../utils/billingUtils';
import {
  generateSeedData,
  INITIAL_SETTINGS,
  INITIAL_COMMON_AREAS,
  INITIAL_ACCESS_TERMINALS,
  INITIAL_ACCESS_LOGS,
  INITIAL_ACCESS_POLICY,
} from '../data/seedData';
import { accessClientService } from '../services/accessControl/accessClientService';
import {
  AccessEvaluationRequest,
  AccessEvaluationResponse,
  ConnectionTestResult,
} from '../services/accessControl/types';
import {
  fetchStaffUsersFromSupabase,
  loadAndSeedSupabaseData,
  syncAssignBedFlow,
  syncCreateResidentWithPlacement,
  syncDeleteApplicationCascade,
  syncDeleteResidentCascade,
  syncDeleteRoomAndBeds,
  syncDeleteStaffUser,
  syncInsertStaffUser,
  syncRecordPaymentFlow,
  syncReleaseBedCascade,
  syncReplaceResidentPayments,
  syncResetAllBeds,
  syncRoomTariffChanges,
  syncUpdateApplication,
  syncUpdateSingleBed,
  syncUpdateStaffUser,
  syncUpsertApplication,
  syncUpsertResident,
  syncUpsertRoomAndBeds,
} from '../services/supabaseSync';

interface DormContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentUserName: string;
  activeStudentId: string;
  setActiveStudentId: (id: string) => void;
  activeStaffUser: StaffUser | null;
  setActiveStaffUser: (staff: StaffUser | null) => void;
  
  // Data
  rooms: Room[];
  commonAreas: CommonArea[];
  students: Student[];
  applications: Application[];
  payments: Payment[];
  contracts: Contract[];
  employees: Employee[];
  staffUsers: StaffUser[];
  issues: Issue[];
  disciplineRecords: DisciplineRecord[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  settings: DormSettings;
  roomFilter: string;
  setRoomFilter: (filter: string) => void;
  isLoadingData: boolean;
  refreshFromSupabase: () => Promise<void>;

  // Key KPI metrics
  stats: {
    totalBuildings: number;
    totalFloors: number;
    residentialFloors: number;
    totalBeds: number;
    usableBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
    availableBeds: number;
    maintenanceBeds: number;
    reservedBeds: number;
    totalRooms: number;
    occupiedRooms: number;
    fullRooms: number;
    partiallyOccupiedRooms: number;
    emptyRooms: number;
    maintenanceRooms: number;
    availableRooms: number;
    totalStudents: number;
    thisMonthRevenue: number;
    expectedRevenue: number;
    totalDebtAmount: number;
    potentialVacantRevenue: number;
    occupancyPercentage: number;
  };

  // Actions
  addStudent: (studentData: Partial<Student>) => Student;
  createResidentWithPlacement: (params: {
    resident: {
      fullName: string;
      phone: string;
      birthDate: string;
      passportNumber: string;
      university: string;
      faculty: string;
      degreeLevel: string;
      course: number | string;
      group: string;
      parentPhone: string;
      permanentAddress: string;
      roomType: RoomType;
      monthlyTariff?: number;
    };
    placement?: { roomId: string; bedId: string } | null;
    initialBilling?: InitialBillingSetup;
  }) => Promise<{
    student: Student;
    tempLogin: string;
    tempPassword: string;
    roomNumber?: string;
    bedLabel?: string;
    floor?: number;
    contractNumber?: string;
  } | null>;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  
  submitApplication: (appData: Omit<Application, 'id' | 'submittedAt' | 'status'>) => Application;
  reviewApplication: (id: string, status: ApplicationStatus, notes?: string) => string | undefined;
  deleteApplication: (id: string) => void;

  assignBed: (
    studentId: string,
    roomId: string,
    bedId: string,
    initialBilling?: InitialBillingSetup
  ) => Promise<{ tempLogin: string; tempPassword: string; roomNumber: string; bedLabel: string } | null>;
  transferBed: (studentId: string, newRoomId: string, newBedId: string) => void;
  releaseBed: (bedId: string) => void;
  resetAllBedsToAvailable: () => void;

  // Manual Room & Bed Configuration (Owner & Manager Only)
  canConfigureRooms: boolean;
  addRoom: (roomData: {
    floor: number;
    roomNumber: string;
    type?: RoomType;
    priceMonthly?: number;
    bedIdentifiers: string[];
    status?: 'available' | 'maintenance' | 'closed';
    notes?: string;
  }) => { success: boolean; error?: string; room?: Room };
  updateRoom: (
    roomId: string,
    updates: {
      floor?: number;
      roomNumber?: string;
      type?: RoomType;
      priceMonthly?: number;
      bedIdentifiers?: string[];
      status?: 'available' | 'maintenance' | 'closed';
      notes?: string;
    }
  ) => { success: boolean; error?: string; room?: Room };
  deleteRoom: (roomId: string) => { success: boolean; error?: string };
  updateBed: (
    roomId: string,
    bedId: string,
    updates: {
      bedIdentifier?: string;
      status?: 'available' | 'maintenance' | 'reserved';
    }
  ) => { success: boolean; error?: string };

  // 1st Floor Common Areas Configuration
  addCommonArea: (areaData: Omit<CommonArea, 'id'>) => void;
  updateCommonArea: (id: string, updates: Partial<CommonArea>) => void;
  deleteCommonArea: (id: string) => void;

  recordPayment: (paymentData: {
    studentId: string;
    amount: number;
    paymentDate: string;
    paidUntil?: string;
    periodMonth: string;
    paymentMethod: BillingPaymentMethod;
    notes?: string;
    monthlyRateOverride?: number;
  }) => Payment;
  handleAcceptPayment: (studentId: string, amount: number) => Payment;
  billingLedgers: Record<string, StudentBillingLedger>;
  updateStudentBillingLedger: (
    entityId: string,
    updates: {
      monthlyRateOverride?: number;
      paidUntil?: string;
      months: Record<string, MonthlyBillingEntry>;
    }
  ) => void;
  upsertBillingEntry: (params: {
    entityId: string;
    periodMonth: string; // 'YYYY-MM'
    paidAmount: number;
    status: BillingEntryStatus;
    paymentMethod: BillingPaymentMethod;
    paymentDate: string;
    paidUntil?: string;
    notes?: string;
    monthlyRateOverride?: number;
  }) => void;

  createIssue: (issueData: {
    category: Issue['category'];
    location: string;
    roomNumber?: string;
    description: string;
    priority: Issue['priority'];
    photoUrl?: string;
  }) => Issue;
  updateIssueStatus: (issueId: string, status: IssueStatus, assignedToId?: string) => void;

  addDisciplineRecord: (record: {
    studentId: string;
    violationReason: string;
    penaltyPoints: number;
  }) => void;

  addEmployee: (empData: Omit<Employee, 'id' | 'lastLogin'>) => void;
  toggleEmployeeStatus: (id: string) => void;

  // Owner Staff & Passwords (Supabase staff_users)
  refreshStaffUsers: () => Promise<void>;
  addStaffUser: (data: {
    fullName: string;
    roleTitle: string;
    login: string;
    password: string;
    isActive?: boolean;
  }) => Promise<{
    success: boolean;
    errorCode?:
      | 'unauthorized'
      | 'missing_fields'
      | 'duplicate_login'
      | 'reserved_login'
      | 'weak_password'
      | 'sync_error';
    errorMessage?: string;
    staffUser?: StaffUser;
  }>;
  updateStaffUser: (
    id: string,
    updates: {
      fullName?: string;
      roleTitle?: string;
      login?: string;
      password?: string;
      isActive?: boolean;
    }
  ) => Promise<{
    success: boolean;
    errorCode?:
      | 'unauthorized'
      | 'not_found'
      | 'missing_fields'
      | 'duplicate_login'
      | 'reserved_login'
      | 'weak_password'
      | 'sync_error';
    errorMessage?: string;
  }>;
  toggleStaffUserActive: (id: string) => Promise<{ success: boolean; errorMessage?: string }>;
  deleteStaffUser: (id: string) => Promise<{ success: boolean; errorMessage?: string }>;

  updateSettings: (newSettings: DormSettings) => void;
  resetToDefaults: () => void;
  markNotificationAsRead: (id: string) => void;

  // Access Control & Hikvision Integration
  accessTerminals: AccessTerminal[];
  accessLogs: AccessLogEvent[];
  accessPolicy: AccessControlPolicy;
  simulateAccessScan: (request: AccessEvaluationRequest) => Promise<AccessEvaluationResponse>;
  updateTerminalConfig: (terminal: AccessTerminal) => void;
  addTerminal: (terminalData: Omit<AccessTerminal, 'id'>) => AccessTerminal;
  deleteTerminal: (terminalId: string) => void;
  testTerminalConnection: (terminal: AccessTerminal) => Promise<ConnectionTestResult>;
  assignStudentCard: (studentId: string, rfidCardNumber: string) => void;
  toggleStudentFaceEnrolled: (studentId: string, enrolled: boolean, photoUrl?: string) => void;
  setStudentAccessStatus: (studentId: string, status: 'active' | 'suspended' | 'blocked') => void;
  updateAccessPolicy: (policyUpdates: Partial<AccessControlPolicy>) => void;
  clearAccessLogs: () => void;
  triggerTurnstileRelay: (terminalId: string, seconds?: number) => Promise<{ success: boolean; message: string }>;

  // Auth Accounts & Recovery
  userAccounts: StoredUserAccount[];
  findUserAccountByIdentifier: (identifier: string) => StoredUserAccount | undefined;
  registerStudentAccount: (params: {
    fullName?: string;
    phone: string;
    login?: string;
    passwordHash: string;
    passwordSalt: string;
  }) => Student;
  resetUserPassword: (params: {
    identifier: string;
    passwordHash: string;
    passwordSalt: string;
    targetRole?: Role;
  }) => { success: boolean; role: Role; studentId?: string };
  ensureStudentForIdentifier: (identifier: string) => string | undefined;
}

const STORAGE_KEY = 'ROYAL_CAMPUS_DORM_V3_STATE';

const DormContext = createContext<DormContextType | undefined>(undefined);

export const DormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('owner');
  const [activeStudentId, setActiveStudentId] = useState<string>('');
  const [activeStaffUser, setActiveStaffUser] = useState<StaffUser | null>(null);
  const [roomFilter, setRoomFilter] = useState<string>('all');

  // Load persistent state or generate seed data
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.commonAreas || !Array.isArray(parsed.commonAreas) || parsed.commonAreas.length === 0) {
          parsed.commonAreas = INITIAL_COMMON_AREAS;
        }
        // Ensure all beds have bedIdentifier for backward compatibility and deduplicate rooms
        if (Array.isArray(parsed.rooms)) {
          const seenIds = new Set<string>();
          parsed.rooms = parsed.rooms
            .filter((r: Room) => {
              if (!r || !r.id || seenIds.has(r.id)) return false;
              seenIds.add(r.id);
              return true;
            })
            .map((r: Room) => ({
              ...r,
              beds: Array.isArray(r.beds)
                ? r.beds.map((b: Bed) => ({
                    ...b,
                    bedIdentifier: b.bedIdentifier || String(b.bedNumber || '1'),
                  }))
                : [],
            }));
        }
        // Integrity check: reconcile occupied beds with active student assignments
        if (Array.isArray(parsed.rooms) && Array.isArray(parsed.students)) {
          const activeAssignedMap = new Map<string, Student>();
          parsed.students.forEach((s: Student) => {
            if (s.status === 'active' && s.bedId) {
              activeAssignedMap.set(s.bedId, s);
            }
          });

          parsed.rooms = parsed.rooms.map((r: Room) => ({
            ...r,
            beds: Array.isArray(r.beds)
              ? r.beds.map((b: Bed) => {
                  const assignedStudent = activeAssignedMap.get(b.id);
                  if (assignedStudent) {
                    return {
                      ...b,
                      status: 'occupied' as const,
                      studentId: assignedStudent.id,
                      studentName: assignedStudent.fullName,
                    };
                  }
                  // If bed was occupied but no active student is assigned to it, restore to available
                  if (b.status === 'occupied' && !assignedStudent) {
                    return {
                      ...b,
                      status: 'available' as const,
                      studentId: undefined,
                      studentName: undefined,
                    };
                  }
                  return b;
                })
              : [],
          }));
        }
        // Ensure access control terminals, logs, and policy exist
        if (!parsed.accessTerminals || !Array.isArray(parsed.accessTerminals) || parsed.accessTerminals.length === 0) {
          parsed.accessTerminals = INITIAL_ACCESS_TERMINALS;
        }
        if (!parsed.accessLogs || !Array.isArray(parsed.accessLogs)) {
          parsed.accessLogs = INITIAL_ACCESS_LOGS;
        }
        if (!parsed.accessPolicy) {
          parsed.accessPolicy = INITIAL_ACCESS_POLICY;
        }
        // Migrate legacy 3-tier / 6-tier state into the 5 explicit RoomType categories (removing lux_plus)
        if (!parsed.settings || !parsed.settings.roomTariffs) {
          parsed.settings = INITIAL_SETTINGS;
        } else {
          const rt = parsed.settings.roomTariffs as Record<string, number | undefined>;
          const isLegacyDefaults =
            rt.lux === 1200000 && rt.comfort === 800000 && rt.standard === 600000;
          const hasLegacyLuxPlus = rt.lux_plus !== undefined;
          const needsTierMigration =
            isLegacyDefaults ||
            rt.standard_plus === undefined ||
            rt.comfort_plus === undefined ||
            hasLegacyLuxPlus;

          if (needsTierMigration) {
            parsed.settings = {
              ...parsed.settings,
              roomTariffs: isLegacyDefaults
                ? { ...INITIAL_SETTINGS.roomTariffs }
                : {
                    standard: rt.standard ?? INITIAL_SETTINGS.roomTariffs.standard,
                    standard_plus:
                      rt.standard_plus ?? INITIAL_SETTINGS.roomTariffs.standard_plus,
                    comfort: rt.comfort ?? INITIAL_SETTINGS.roomTariffs.comfort,
                    comfort_plus:
                      rt.comfort_plus ?? INITIAL_SETTINGS.roomTariffs.comfort_plus,
                    lux: rt.lux ?? INITIAL_SETTINGS.roomTariffs.lux,
                  },
            };

            const upgradeRoomType = (rawType: string | undefined): RoomType => {
              const base = (rawType || 'comfort') as string;
              if (base === 'lux_plus') {
                return 'lux';
              }
              if (base === 'standard_plus' || base === 'comfort_plus') {
                return base;
              }
              if (base === 'standard' || base === 'comfort' || base === 'lux') {
                return base;
              }
              return 'comfort';
            };

            if (Array.isArray(parsed.rooms)) {
              const seedFresh = isLegacyDefaults ? generateSeedData() : null;
              const seedRoomMap = seedFresh
                ? new Map<string, Room>(seedFresh.rooms.map((sr) => [sr.id, sr]))
                : null;

              parsed.rooms = parsed.rooms.map((r: Room) => {
                const matchedSeed = seedRoomMap?.get(r.id);
                const nextType = matchedSeed
                  ? matchedSeed.type
                  : upgradeRoomType(r.type);
                return {
                  ...r,
                  type: nextType,
                  priceMonthly:
                    parsed.settings.roomTariffs[nextType] ?? INITIAL_SETTINGS.roomTariffs[nextType],
                };
              });
            }

            if (Array.isArray(parsed.students)) {
              const updatedRoomMap = new Map<string, Room>(
                (parsed.rooms || []).map((ur: Room) => [ur.id, ur])
              );
              parsed.students = parsed.students.map((s: Student) => {
                if (s.roomId && updatedRoomMap.has(s.roomId)) {
                  const rm = updatedRoomMap.get(s.roomId)!;
                  return {
                    ...s,
                    roomType: rm.type,
                    monthlyTariff: rm.priceMonthly,
                  };
                }
                const wasLuxPlus = (s.roomType as string | undefined) === 'lux_plus';
                const nextType = upgradeRoomType(s.roomType);
                return {
                  ...s,
                  roomType: s.roomType ? nextType : undefined,
                  monthlyTariff:
                    isLegacyDefaults || wasLuxPlus
                      ? (parsed.settings.roomTariffs[nextType] ?? INITIAL_SETTINGS.roomTariffs[nextType])
                      : s.monthlyTariff,
                };
              });
            }

            if (Array.isArray(parsed.applications)) {
              parsed.applications = parsed.applications.map((a: Application) => ({
                ...a,
                preferredRoomType: a.preferredRoomType
                  ? upgradeRoomType(a.preferredRoomType)
                  : undefined,
              }));
            }

            if (Array.isArray(parsed.contracts)) {
              parsed.contracts = parsed.contracts.map((c: Contract) => {
                if ((c.roomType as string) === 'lux_plus') {
                  return {
                    ...c,
                    roomType: 'lux',
                    tariffMonthly: parsed.settings.roomTariffs.lux ?? INITIAL_SETTINGS.roomTariffs.lux,
                  };
                }
                return c;
              });
            }
          }
        }
        // Ensure userAccounts, billingLedgers, and staffUsers exist
        if (!Array.isArray(parsed.userAccounts)) {
          parsed.userAccounts = [];
        }
        if (!parsed.billingLedgers || typeof parsed.billingLedgers !== 'object') {
          parsed.billingLedgers = {};
        }
        if (!Array.isArray(parsed.staffUsers)) {
          parsed.staffUsers = [];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse localStorage', e);
    }
    return {
      ...generateSeedData(),
      userAccounts: [] as StoredUserAccount[],
      billingLedgers: {} as Record<string, StudentBillingLedger>,
      staffUsers: [] as StaffUser[],
    };
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Save changes to localStorage as fast client cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [state]);

  const refreshFromSupabase = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const hydrated = await loadAndSeedSupabaseData(state.settings || INITIAL_SETTINGS);
      if (!hydrated) return;

      setState((prev: typeof state) => {
        const nextState = {
          ...prev,
          rooms: hydrated.rooms.length > 0 ? hydrated.rooms : prev.rooms,
          applications: hydrated.applications,
          students: hydrated.students,
          payments: hydrated.payments,
          billingLedgers: hydrated.billingLedgers,
          contracts: hydrated.contracts,
          staffUsers: hydrated.staffUsers,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
        } catch (e) {
          console.error('Failed to cache hydrated Supabase state', e);
        }
        return nextState;
      });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Load rooms, beds, applications, residents, payments, and staff_users from Supabase on startup
  // (automatically seeds 56 rooms & 344 beds once if empty)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const hydrated = await loadAndSeedSupabaseData(INITIAL_SETTINGS);
        if (!active || !hydrated) return;

        setState((prev: typeof state) => {
          const nextState = {
            ...prev,
            rooms: hydrated.rooms.length > 0 ? hydrated.rooms : prev.rooms,
            applications: hydrated.applications,
            students: hydrated.students,
            payments: hydrated.payments,
            billingLedgers: hydrated.billingLedgers,
            contracts: hydrated.contracts,
            staffUsers: hydrated.staffUsers,
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
          } catch (e) {
            console.error('Failed to cache hydrated Supabase state', e);
          }
          return nextState;
        });
      } finally {
        if (active) {
          setIsLoadingData(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const {
    rooms,
    commonAreas = INITIAL_COMMON_AREAS,
    students,
    applications,
    payments,
    contracts,
    employees,
    staffUsers = [] as StaffUser[],
    issues,
    disciplineRecords,
    notifications,
    auditLogs,
    settings,
    accessTerminals = INITIAL_ACCESS_TERMINALS,
    accessLogs = INITIAL_ACCESS_LOGS,
    accessPolicy = INITIAL_ACCESS_POLICY,
    userAccounts = [] as StoredUserAccount[],
    billingLedgers = {} as Record<string, StudentBillingLedger>,
  } = state;

  // Determine current user name
  const currentUserName = useMemo(() => {
    if (activeStaffUser && role !== 'student') {
      return `${activeStaffUser.fullName} (${activeStaffUser.roleTitle})`;
    }
    switch (role) {
      case 'owner': return 'Alisher Qodirov (Owner)';
      case 'manager': return 'Shaxnoza Raximova (Manager)';
      case 'receptionist': return 'Dilshod Tursunov (Receptionist)';
      case 'security': return 'Jahongir Xoliqov (Security)';
      case 'cleaner': return 'Gulnora Alimova (Cleaner)';
      case 'student': {
        const activeStd = students.find((s: Student) => s.id === activeStudentId);
        return activeStd ? `${activeStd.fullName} (Student)` : 'Talaba';
      }
      default: return 'Foydalanuvchi';
    }
  }, [role, students, activeStudentId, activeStaffUser]);

  // OPTIMIZATION: Heavy statistics calculation wrapped in useMemo
  const stats = useMemo(() => {
    // Calculate metrics: 1 building, 5 physical floors, 4 residential floors (2-5)
    // Floor 1 is non-residential (common-use facilities: reception, kitchen, etc.)
    const totalBuildings = 1;
    const totalFloors = 5;
    const residentialFloors = 4;

    // Single authoritative source of truth for all rooms & beds
    // Deduplicate rooms by ID and (floor + roomNumber) to guarantee counting each room only once
    const seenRoomIds = new Set<string>();
    const seenRoomKeys = new Set<string>();
    const uniqueRooms: Room[] = [];

    rooms.forEach((r: Room) => {
      const key = `${r.floor}-${r.roomNumber.toLowerCase().trim()}`;
      if (!seenRoomIds.has(r.id) && !seenRoomKeys.has(key)) {
        seenRoomIds.add(r.id);
        seenRoomKeys.add(key);
        uniqueRooms.push(r);
      }
    });

    const totalRooms = uniqueRooms.length; // Count of all existing rooms

    let totalBeds = 0;
    let occupiedBeds = 0;
    let maintenanceBeds = 0;
    let reservedBeds = 0;
    let availableBeds = 0;
    let potentialVacantRevenue = 0;

    let occupiedRooms = 0;
    let fullRooms = 0;
    let partiallyOccupiedRooms = 0;
    let emptyRooms = 0;
    let maintenanceRooms = 0;
    let availableRooms = 0;

    uniqueRooms.forEach((room: Room) => {
      const isRoomMaintenance =
        room.status === 'maintenance' ||
        room.status === 'closed' ||
        Boolean(room.isClosedForMaintenance);

      if (isRoomMaintenance) {
        maintenanceRooms++;
      }

      let roomOccupiedCount = 0;
      let roomAvailableCount = 0;
      let roomUsableCount = 0;

      // Deduplicate beds within the room by bed identifier / ID
      const seenBedKeys = new Set<string>();
      const validBeds = (room.beds || []).filter((b: Bed) => {
        const bKey = b.id || `bed-${room.id}-${b.bedNumber}`;
        if (seenBedKeys.has(bKey)) return false;
        seenBedKeys.add(bKey);
        return true;
      });

      validBeds.forEach((b: Bed) => {
        totalBeds++;
        const isBedOccupied = b.status === 'occupied' || Boolean(b.studentId);
        const isBedMaintenance = isRoomMaintenance || b.status === 'maintenance';

        if (isBedOccupied) {
          occupiedBeds++;
          roomOccupiedCount++;
          roomUsableCount++;
        } else if (isBedMaintenance) {
          maintenanceBeds++;
        } else if (b.status === 'reserved') {
          reservedBeds++;
          roomUsableCount++;
        } else {
          availableBeds++;
          roomAvailableCount++;
          roomUsableCount++;
          potentialVacantRevenue += (room.priceMonthly || 0);
        }
      });

      if (roomOccupiedCount > 0) {
        occupiedRooms++;
      } else {
        emptyRooms++;
      }

      if (roomUsableCount > 0 && roomOccupiedCount >= roomUsableCount) {
        fullRooms++;
      } else if (roomOccupiedCount > 0 && roomAvailableCount > 0) {
        partiallyOccupiedRooms++;
      }

      if (roomAvailableCount > 0) {
        availableRooms++;
      }
    });

    // Available beds = eligible beds currently available for assignment
    const vacantBeds = availableBeds;

    const activeStudentsList = students.filter((s: Student) => s.status === 'active');
    const totalStudents = activeStudentsList.length;

    const currentMonthStr = getCurrentBillingPeriod();
    const thisMonthPayments = payments.filter((p: Payment) => p.periodMonth === currentMonthStr && p.status === 'completed');
    const thisMonthRevenue = thisMonthPayments.reduce((acc: number, p: Payment) => acc + safeAmount(p.amount), 0);

    let expectedRevenue = 0;
    let totalDebtAmount = 0;
    activeStudentsList.forEach((s: Student) => {
      const linkedApp = findLinkedApplication(s, applications);
      const activeCnt = contracts.find((c: Contract) => c.studentId === s.id && c.status === 'active');
      const summary = computeStudentBillingSummary({
        entityId: s.id,
        student: s,
        application: linkedApp,
        contract: activeCnt,
        rooms,
        settings,
        payments,
        ledger: billingLedgers[s.id],
      });
      expectedRevenue += summary.monthlyRate;
      totalDebtAmount += summary.remainingBalance;
    });

    // Usable residential capacity excludes beds currently out of service / under maintenance
    const usableBeds = Math.max(0, totalBeds - maintenanceBeds);

    // Residential occupancy percentage = (occupied residential beds / total usable residential beds) * 100
    // Rounded consistently to two decimal places
    const occupancyPercentage = usableBeds > 0 ? Number(((occupiedBeds / usableBeds) * 100).toFixed(2)) : 0;

    return {
      totalBuildings,
      totalFloors,
      residentialFloors,
      totalBeds,
      usableBeds,
      occupiedBeds,
      vacantBeds,
      availableBeds,
      maintenanceBeds,
      reservedBeds,
      totalRooms,
      occupiedRooms,
      fullRooms,
      partiallyOccupiedRooms,
      emptyRooms,
      maintenanceRooms,
      availableRooms,
      totalStudents,
      thisMonthRevenue,
      expectedRevenue,
      totalDebtAmount,
      potentialVacantRevenue,
      occupancyPercentage,
    };
  }, [rooms, students, payments, applications, contracts, settings, billingLedgers]);

  // Helper to add audit entry
  const addAudit = (action: string, objectType: string, objectId: string, oldValue?: string, newValue?: string) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      userName: currentUserName,
      role,
      action,
      objectType,
      objectId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setState((prev: typeof state) => ({
      ...prev,
      auditLogs: [entry, ...prev.auditLogs],
    }));
  };

  // Actions
  const addStudent = (data: Partial<Student>): Student => {
    if (role === 'security') {
      console.warn('Security role is not permitted to add students.');
      return {} as Student;
    }

    const newId = `std-${Date.now()}`;
    const validTypes: RoomType[] = ['standard', 'standard_plus', 'comfort', 'comfort_plus', 'lux'];
    const resolvedType: RoomType =
      data.roomType && validTypes.includes(data.roomType) ? data.roomType : 'comfort';
    const newStudent: Student = {
      id: newId,
      fullName: data.fullName?.trim() || '',
      phone: data.phone?.trim() || '',
      birthDate: data.birthDate?.trim() || '',
      passportNumber: data.passportNumber?.trim().toUpperCase() || '',
      university: data.university?.trim() || '',
      faculty: data.faculty?.trim() || '',
      degreeLevel: data.degreeLevel || 'Bakalavr',
      course: data.course ?? 1,
      group: data.group?.trim() || '',
      parentPhone: data.parentPhone?.trim() || '',
      permanentAddress: data.permanentAddress?.trim() || '',
      status: 'active',
      roomType: resolvedType,
      monthlyTariff:
        data.monthlyTariff ||
        (settings.roomTariffs?.[resolvedType] ?? INITIAL_SETTINGS.roomTariffs[resolvedType]),
      paidUntil: '',
      nextPaymentDueDate: '',
      debtAmount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      telegramChatId: `tg_${Date.now()}`,
    };

    setState((prev: typeof state) => ({
      ...prev,
      students: [newStudent, ...prev.students],
    }));

    void syncUpsertResident(newStudent);
    addAudit('Rezident qo\'shildi', 'Student', newStudent.id, undefined, newStudent.fullName);
    return newStudent;
  };

  const createResidentWithPlacement: DormContextType['createResidentWithPlacement'] = async (params) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to add residents.');
      return null;
    }

    const { resident, placement, initialBilling } = params;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);
    const newId = `std-${Date.now()}`;
    const phoneKey = normalizePhoneKey(resident.phone);
    const formattedPhone = phoneKey.length >= 9 ? formatUzPhoneDisplay(resident.phone) : resident.phone.trim();
    const tempLogin = formattedPhone || resident.phone.trim();
    const tempPassword = generateTempPassword();
    const salt = generateSalt();
    const passwordHash = await hashPassword(tempPassword, salt);

    let preRoom: Room | undefined;
    let preBed: Bed | undefined;
    if (placement?.roomId && placement?.bedId) {
      preRoom = rooms.find((r: Room) => r.id === placement.roomId);
      preBed = preRoom?.beds.find((b: Bed) => b.id === placement.bedId);
      if (
        !preRoom ||
        !preBed ||
        preRoom.status === 'maintenance' ||
        preRoom.status === 'closed' ||
        preBed.status !== 'available'
      ) {
        return null;
      }
    }

    const validRoomTypes: RoomType[] = ['standard', 'standard_plus', 'comfort', 'comfort_plus', 'lux'];
    const preRawType: RoomType =
      preRoom?.type ||
      (resident.roomType && validRoomTypes.includes(resident.roomType) ? resident.roomType : 'comfort');
    const preResolvedTariff =
      initialBilling?.monthlyRateOverride && initialBilling.monthlyRateOverride > 0
        ? safeAmount(initialBilling.monthlyRateOverride)
        : settings.roomTariffs?.[preRawType] ??
          preRoom?.priceMonthly ??
          resident.monthlyTariff ??
          INITIAL_SETTINGS.roomTariffs[preRawType];
    const preBedLabel = preBed ? preBed.bedIdentifier || String(preBed.bedNumber) : undefined;
    const preContractNumber =
      preRoom && preBedLabel ? `RC-2026/${preRoom.roomNumber}-${preBedLabel}` : undefined;

    const previewStudent: Student = {
      id: newId,
      fullName: resident.fullName.trim(),
      phone: formattedPhone || resident.phone.trim(),
      birthDate: resident.birthDate.trim(),
      passportNumber: resident.passportNumber.trim().toUpperCase(),
      university: resident.university.trim(),
      faculty: resident.faculty.trim(),
      degreeLevel: resident.degreeLevel,
      course: resident.course,
      group: resident.group.trim(),
      parentPhone: resident.parentPhone.trim(),
      permanentAddress: resident.permanentAddress.trim(),
      status: 'active',
      roomId: preRoom?.id,
      bedId: preBed?.id,
      roomNumber: preRoom?.roomNumber,
      bedNumber: preBed?.bedNumber,
      bedIdentifier: preBedLabel,
      floor: preRoom?.floor,
      roomType: preRawType,
      monthlyTariff: preResolvedTariff,
      paidUntil: '',
      nextPaymentDueDate: '',
      debtAmount: 0,
      createdAt: todayStr,
      telegramChatId: `tg_${Date.now()}`,
      tempLogin,
      tempPassword,
    };

    const billingDateTimeForSync = ensureDateTimeValue(initialBilling?.paymentDate);
    const billingDateOnlyForSync = extractDatePart(billingDateTimeForSync) || todayStr;
    const billingTimeForSync = extractTimePart(billingDateTimeForSync);
    const billingMethodForSync: BillingPaymentMethod =
      normalizeBillingMethod(initialBilling?.paymentMethod) || 'cash';
    const billingNotesForSync = initialBilling?.notes?.trim() || undefined;
    const targetPeriodForSync = initialBilling?.initialPeriod || getCurrentBillingPeriod();
    const rawMonthStatusForSync = initialBilling?.monthStatus || 'pending';
    const monthPaidAmountForSync =
      rawMonthStatusForSync === 'paid'
        ? preResolvedTariff
        : rawMonthStatusForSync === 'partial'
        ? safeAmount(initialBilling?.monthAmount)
        : 0;
    const resolvedPaidUntilForSync =
      monthPaidAmountForSync > 0
        ? isValidIsoDate(initialBilling?.paidUntil)
          ? initialBilling!.paidUntil!.trim()
          : addDaysToDateStr(billingDateTimeForSync, 30)
        : '';

    const initialPaymentId = `PAY-${Date.now() + 1}-MO`;
    const initialPaymentsForSync: Payment[] =
      monthPaidAmountForSync > 0
        ? [
            {
              id: initialPaymentId,
              studentId: newId,
              studentName: resident.fullName.trim(),
              floor: preRoom?.floor,
              roomNumber: preRoom?.roomNumber || '---',
              bedLabel: preBedLabel,
              amount: monthPaidAmountForSync,
              paymentDate: billingDateTimeForSync,
              paymentTime: billingTimeForSync,
              date: billingDateOnlyForSync,
              paidUntil: resolvedPaidUntilForSync || undefined,
              type: 'income',
              periodMonth: targetPeriodForSync,
              itemRemainingAfter: Math.max(0, preResolvedTariff - monthPaidAmountForSync),
              paymentMethod: billingMethodForSync,
              recordedBy: currentUserName,
              status: 'completed',
              notes: billingNotesForSync,
            },
          ]
        : [];

    const studentForSync: Student = {
      ...previewStudent,
      paidUntil: resolvedPaidUntilForSync,
      nextPaymentDueDate: resolvedPaidUntilForSync,
      nextPaymentDate: resolvedPaidUntilForSync,
      lastPaymentDate: monthPaidAmountForSync > 0 ? billingDateTimeForSync : undefined,
    };

    setState((prev: typeof state) => {
      let liveRoom: Room | undefined;
      let liveBed: Bed | undefined;

      if (placement?.roomId && placement?.bedId) {
        liveRoom = prev.rooms.find((r: Room) => r.id === placement.roomId);
        liveBed = liveRoom?.beds.find((b: Bed) => b.id === placement.bedId);
        if (
          !liveRoom ||
          !liveBed ||
          liveRoom.status === 'maintenance' ||
          liveRoom.status === 'closed' ||
          liveBed.status !== 'available'
        ) {
          return prev;
        }
      }

      const rawType: RoomType =
        liveRoom?.type ||
        (resident.roomType && (resident.roomType as string) !== 'lux_plus' ? resident.roomType : 'comfort');
      const baseTierTariff =
        prev.settings.roomTariffs?.[rawType] ??
        liveRoom?.priceMonthly ??
        resident.monthlyTariff ??
        INITIAL_SETTINGS.roomTariffs[rawType];
      const overrideRate =
        initialBilling?.monthlyRateOverride && initialBilling.monthlyRateOverride > 0
          ? safeAmount(initialBilling.monthlyRateOverride)
          : undefined;
      const resolvedTariff = overrideRate ?? baseTierTariff;

      const bedLabel = liveBed ? liveBed.bedIdentifier || String(liveBed.bedNumber) : undefined;
      const contractNumber =
        liveRoom && bedLabel ? `RC-2026/${liveRoom.roomNumber}-${bedLabel}` : undefined;

      const updatedRooms =
        liveRoom && liveBed
          ? prev.rooms.map((r: Room) => {
              if (r.id !== liveRoom!.id) return r;
              return {
                ...r,
                beds: r.beds.map((b: Bed) =>
                  b.id === liveBed!.id
                    ? {
                        ...b,
                        status: 'occupied' as const,
                        studentId: newId,
                        studentName: resident.fullName.trim(),
                        assignedAt: todayStr,
                      }
                    : b
                ),
              };
            })
          : prev.rooms;

      const newContract: Contract | undefined =
        liveRoom && liveBed && bedLabel && contractNumber
          ? {
              id: `cnt-${Date.now()}`,
              contractNumber,
              studentId: newId,
              studentName: resident.fullName.trim(),
              passportNumber: resident.passportNumber.trim().toUpperCase(),
              roomNumber: liveRoom.roomNumber,
              bedNumber: liveBed.bedNumber,
              bedIdentifier: bedLabel,
              roomType: rawType,
              tariffMonthly: resolvedTariff,
              startDate: todayStr,
              endDate: '2027-06-30',
              status: 'active',
              createdAt: todayStr,
              pdfGeneratedAt: nowIso.replace('T', ' ').slice(0, 16),
            }
          : undefined;

      const nextContracts = newContract ? [newContract, ...prev.contracts] : prev.contracts;

      const billingDateTime = billingDateTimeForSync;
      const billingDateOnly = billingDateOnlyForSync;
      const billingTime = billingTimeForSync;
      const billingMethod: BillingPaymentMethod = billingMethodForSync;
      const billingNotes = billingNotesForSync;

      const targetPeriod = targetPeriodForSync;
      const rawMonthStatus = rawMonthStatusForSync;
      const monthPaidAmount =
        rawMonthStatus === 'paid'
          ? resolvedTariff
          : rawMonthStatus === 'partial'
          ? safeAmount(initialBilling?.monthAmount)
          : 0;
      const resolvedPaidUntil =
        monthPaidAmount > 0
          ? isValidIsoDate(initialBilling?.paidUntil)
            ? initialBilling!.paidUntil!.trim()
            : addDaysToDateStr(billingDateTime, 30)
          : undefined;

      const monthsMap: Record<string, MonthlyBillingEntry> = {};
      ACADEMIC_BILLING_MONTHS.forEach((m) => {
        if (m.period === targetPeriod && monthPaidAmount > 0) {
          monthsMap[m.period] = {
            period: m.period,
            paidAmount: monthPaidAmount,
            status:
              resolvedTariff > 0 && monthPaidAmount >= resolvedTariff
                ? 'paid'
                : 'partial',
            paymentDate: billingDateTime,
            paidUntil: resolvedPaidUntil,
            paymentMethod: billingMethod,
            notes: billingNotes,
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

      const newLedger: StudentBillingLedger = {
        studentId: newId,
        ...(overrideRate ? { monthlyRateOverride: overrideRate } : {}),
        ...(resolvedPaidUntil ? { paidUntil: resolvedPaidUntil } : {}),
        months: monthsMap,
        updatedAt: nowIso,
      };
      const nextBillingLedgers: Record<string, StudentBillingLedger> = {
        ...(prev.billingLedgers || {}),
        [newId]: newLedger,
      };

      const initialPayments: Payment[] = [];
      const roomNumDisplay = liveRoom?.roomNumber || '---';
      if (monthPaidAmount > 0) {
        initialPayments.push({
          id: initialPaymentId,
          studentId: newId,
          studentName: resident.fullName.trim(),
          floor: liveRoom?.floor,
          roomNumber: roomNumDisplay,
          bedLabel,
          amount: monthPaidAmount,
          paymentDate: billingDateTime,
          paymentTime: billingTime,
          date: billingDateOnly,
          paidUntil: resolvedPaidUntil,
          type: 'income',
          periodMonth: targetPeriod,
          itemRemainingAfter: Math.max(0, resolvedTariff - monthPaidAmount),
          paymentMethod: billingMethod,
          recordedBy: currentUserName,
          status: 'completed',
          notes: billingNotes,
        });
      }

      const nextPayments = [...initialPayments, ...prev.payments].sort(comparePaymentsChronoDesc);

      const baseStudent: Student = {
        ...previewStudent,
        roomId: liveRoom?.id,
        bedId: liveBed?.id,
        roomNumber: liveRoom?.roomNumber,
        bedNumber: liveBed?.bedNumber,
        bedIdentifier: bedLabel,
        floor: liveRoom?.floor,
        roomType: rawType,
        monthlyTariff: resolvedTariff,
        lastPaymentDate: monthPaidAmount > 0 ? billingDateTime : undefined,
      };

      const summary = computeStudentBillingSummary({
        entityId: baseStudent.id,
        student: baseStudent,
        contract: newContract,
        rooms: updatedRooms,
        settings: prev.settings,
        payments: nextPayments,
        ledger: newLedger,
      });

      const computedPaidUntil = summary.paidUntilDate || '';
      const expiryInfo = computePaymentExpiryInfo(computedPaidUntil);
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

      const finalStudent: Student = {
        ...baseStudent,
        monthlyTariff: summary.monthlyRate,
        debtAmount: summary.remainingBalance,
        paymentStatus: computedPaymentStatus,
        paidUntil: computedPaidUntil,
        nextPaymentDueDate: computedPaidUntil,
        nextPaymentDate: computedPaidUntil,
      };

      const existingAccounts: StoredUserAccount[] = Array.isArray(prev.userAccounts) ? prev.userAccounts : [];
      const existingAccountIdx = existingAccounts.findIndex(
        (acc) =>
          acc.studentId === newId ||
          (phoneKey.length >= 7 && normalizePhoneKey(acc.phone) === phoneKey)
      );
      const nextAccount: StoredUserAccount = {
        id: existingAccountIdx >= 0 ? existingAccounts[existingAccountIdx].id : `acct-${Date.now()}`,
        identifier: phoneKey || tempLogin.toLowerCase(),
        login: existingAccountIdx >= 0 ? existingAccounts[existingAccountIdx].login : undefined,
        phone: tempLogin,
        role: 'student',
        studentId: newId,
        passwordHash,
        passwordSalt: salt,
        updatedAt: nowIso,
      };
      const nextUserAccounts =
        existingAccountIdx >= 0
          ? existingAccounts.map((acc, idx) => (idx === existingAccountIdx ? nextAccount : acc))
          : [nextAccount, ...existingAccounts];

      const notifMessage = liveRoom && bedLabel
        ? `${finalStudent.fullName}: ${liveRoom.roomNumber}-xona, ${bedLabel}-yotoqqa ro‘yxatga olindi.`
        : `${finalStudent.fullName} rezident sifatida ro‘yxatga olindi.`;

      const residentNotif: NotificationItem = {
        id: `notif-resident-${Date.now()}`,
        type: 'application',
        title: 'Yangi rezident qo‘shildi',
        message: notifMessage,
        date: nowIso.replace('T', ' ').slice(0, 16),
        isRead: false,
        recipientRole: 'all',
        studentId: newId,
      };

      return {
        ...prev,
        rooms: updatedRooms,
        students: [finalStudent, ...prev.students],
        contracts: nextContracts,
        payments: nextPayments,
        billingLedgers: nextBillingLedgers,
        userAccounts: nextUserAccounts,
        notifications: [residentNotif, ...prev.notifications],
      };
    });

    await syncCreateResidentWithPlacement({
      student: studentForSync,
      bedId: preBed?.id,
      initialPayments: initialPaymentsForSync,
    });

    addAudit(
      'Yangi rezident qo\'shildi',
      'Student',
      newId,
      undefined,
      `${resident.fullName.trim()}${
        preRoom && preBedLabel ? ` (${preRoom.roomNumber}-xona · ${preBedLabel})` : ''
      }`
    );

    return {
      student: studentForSync,
      tempLogin,
      tempPassword,
      roomNumber: preRoom?.roomNumber,
      bedLabel: preBedLabel,
      floor: preRoom?.floor,
      contractNumber: preContractNumber,
    };
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to update student records.');
      return;
    }

    const existing = students.find((s: Student) => s.id === id);
    setState((prev: typeof state) => {
      const updated = prev.students.map((s: Student) => (s.id === id ? { ...s, ...updates } : s));
      return { ...prev, students: updated };
    });
    if (existing) {
      void syncUpsertResident({ ...existing, ...updates });
    }
    addAudit('Talaba tahrirlandi', 'Student', id, undefined, JSON.stringify(updates));
  };

  const deleteStudent = (id: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to delete students.');
      return;
    }

    const stdForSync = students.find((s: Student) => s.id === id);
    const linkedAppIdsForSync = new Set<string>();
    if (stdForSync?.applicationId) {
      linkedAppIdsForSync.add(stdForSync.applicationId);
    }
    applications.forEach((a: Application) => {
      if (a.studentId === id || (stdForSync?.applicationId && a.id === stdForSync.applicationId)) {
        linkedAppIdsForSync.add(a.id);
      }
    });

    let auditDetail = '';
    setState((prev: typeof state) => {
      const std = prev.students.find((s: Student) => s.id === id);
      const linkedAppIds = new Set<string>();
      if (std?.applicationId) {
        linkedAppIds.add(std.applicationId);
      }
      prev.applications.forEach((a: Application) => {
        if (a.studentId === id || (std?.applicationId && a.id === std.applicationId)) {
          linkedAppIds.add(a.id);
        }
      });

      if (std) {
        auditDetail = std.roomNumber
          ? `${std.fullName} (${std.roomNumber}-xona${std.bedIdentifier || std.bedNumber ? ` · ${std.bedIdentifier || std.bedNumber}` : ''})`
          : std.fullName;
      }

      // 1. Remove resident record cleanly
      const updatedStudents = prev.students.filter((s: Student) => s.id !== id);

      // 2. Automatically release any assigned bed back to Available across Floors 2–5
      const updatedRooms = prev.rooms.map((r: Room) => {
        let changed = false;
        const beds = r.beds.map((b: Bed) => {
          if ((std?.bedId && b.id === std.bedId) || b.studentId === id) {
            changed = true;
            return {
              ...b,
              status: 'available' as const,
              studentId: undefined,
              studentName: undefined,
              assignedAt: undefined,
            };
          }
          return b;
        });
        return changed ? { ...r, beds } : r;
      });

      // 3. Remove linked applications so no orphan applicant/billing entry remains
      const updatedApplications = prev.applications.filter(
        (a: Application) => a.studentId !== id && !linkedAppIds.has(a.id)
      );

      // 4. Clear linked payment entries and billing ledgers
      const updatedPayments = prev.payments.filter(
        (p: Payment) => p.studentId !== id && !linkedAppIds.has(p.studentId)
      );
      const nextBillingLedgers: Record<string, StudentBillingLedger> = {
        ...(prev.billingLedgers || {}),
      };
      delete nextBillingLedgers[id];
      linkedAppIds.forEach((appId) => {
        delete nextBillingLedgers[appId];
      });

      // 5. Remove linked contracts, discipline records, and student portal accounts
      const updatedContracts = prev.contracts.filter((c: Contract) => c.studentId !== id);
      const updatedDiscipline = prev.disciplineRecords.filter((d: DisciplineRecord) => d.studentId !== id);
      const phoneKey = std?.phone ? normalizePhoneKey(std.phone) : '';
      const updatedUserAccounts = (prev.userAccounts || []).filter(
        (u: StoredUserAccount) =>
          !(
            u.role === 'student' &&
            (u.studentId === id ||
              (u.applicationId && linkedAppIds.has(u.applicationId)) ||
              (phoneKey.length >= 7 &&
                (normalizePhoneKey(u.phone) === phoneKey ||
                  (u.login && normalizePhoneKey(u.login) === phoneKey) ||
                  normalizePhoneKey(u.identifier) === phoneKey)))
          )
      );

      const nextState = {
        ...prev,
        students: updatedStudents,
        rooms: updatedRooms,
        applications: updatedApplications,
        payments: updatedPayments,
        billingLedgers: nextBillingLedgers,
        contracts: updatedContracts,
        disciplineRecords: updatedDiscipline,
        userAccounts: updatedUserAccounts,
      };

      // Immediately persist updated state to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch (e) {
        console.error('Failed to persist resident deletion to localStorage', e);
      }

      return nextState;
    });

    void syncDeleteResidentCascade({
      residentId: id,
      bedId: stdForSync?.bedId,
      linkedAppIds: Array.from(linkedAppIdsForSync),
    });

    if (activeStudentId === id) {
      setActiveStudentId('');
    }
    addAudit('Rezident o‘chirildi va o‘rni bo‘shatildi', 'Student', id, auditDetail || id);
  };

  const deleteApplication = (appId: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to delete applications.');
      return;
    }

    const targetAppForSync = applications.find((a: Application) => a.id === appId);
    const linkedStudentsForSync = students.filter(
      (s: Student) =>
        s.applicationId === appId || (targetAppForSync?.studentId && s.id === targetAppForSync.studentId)
    );
    const linkedStudentIdsForSync = Array.from(
      new Set<string>([
        ...linkedStudentsForSync.map((s: Student) => s.id),
        ...(targetAppForSync?.studentId ? [targetAppForSync.studentId] : []),
      ])
    );
    const linkedBedIdsForSync: string[] = linkedStudentsForSync
      .map((s: Student) => s.bedId)
      .filter((bid: string | undefined): bid is string => Boolean(bid));

    let linkedStdIdToClear = '';
    setState((prev: typeof state) => {
      const targetApp = prev.applications.find((a: Application) => a.id === appId);
      const linkedStudents = prev.students.filter(
        (s: Student) => s.applicationId === appId || (targetApp?.studentId && s.id === targetApp.studentId)
      );
      const linkedStudentIds = new Set<string>(linkedStudents.map((s: Student) => s.id));
      if (targetApp?.studentId) {
        linkedStudentIds.add(targetApp.studentId);
      }
      if (linkedStudentIds.has(activeStudentId)) {
        linkedStdIdToClear = activeStudentId;
      }

      const linkedBedIds = new Set<string>();
      linkedStudents.forEach((s: Student) => {
        if (s.bedId) linkedBedIds.add(s.bedId);
      });

      const updatedRooms = prev.rooms.map((r: Room) => {
        let changed = false;
        const beds = r.beds.map((b: Bed) => {
          if (linkedBedIds.has(b.id) || (b.studentId && linkedStudentIds.has(b.studentId))) {
            changed = true;
            return {
              ...b,
              status: 'available' as const,
              studentId: undefined,
              studentName: undefined,
              assignedAt: undefined,
            };
          }
          return b;
        });
        return changed ? { ...r, beds } : r;
      });

      const updatedStudents = prev.students.filter((s: Student) => !linkedStudentIds.has(s.id));
      const updatedApplications = prev.applications.filter((a: Application) => a.id !== appId);
      const updatedPayments = prev.payments.filter(
        (p: Payment) => p.studentId !== appId && !linkedStudentIds.has(p.studentId)
      );
      const nextBillingLedgers: Record<string, StudentBillingLedger> = {
        ...(prev.billingLedgers || {}),
      };
      delete nextBillingLedgers[appId];
      linkedStudentIds.forEach((sid) => {
        delete nextBillingLedgers[sid];
      });
      const updatedContracts = prev.contracts.filter(
        (c: Contract) => !linkedStudentIds.has(c.studentId)
      );
      const updatedDiscipline = prev.disciplineRecords.filter(
        (d: DisciplineRecord) => !linkedStudentIds.has(d.studentId)
      );
      const appPhoneKey = targetApp?.phone ? normalizePhoneKey(targetApp.phone) : '';
      const updatedUserAccounts = (prev.userAccounts || []).filter(
        (u: StoredUserAccount) =>
          !(
            u.role === 'student' &&
            ((u.studentId && linkedStudentIds.has(u.studentId)) ||
              u.applicationId === appId ||
              (appPhoneKey.length >= 7 &&
                (normalizePhoneKey(u.phone) === appPhoneKey ||
                  (u.login && normalizePhoneKey(u.login) === appPhoneKey) ||
                  normalizePhoneKey(u.identifier) === appPhoneKey)))
          )
      );

      const nextState = {
        ...prev,
        students: updatedStudents,
        rooms: updatedRooms,
        applications: updatedApplications,
        payments: updatedPayments,
        billingLedgers: nextBillingLedgers,
        contracts: updatedContracts,
        disciplineRecords: updatedDiscipline,
        userAccounts: updatedUserAccounts,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch (e) {
        console.error('Failed to persist application deletion to localStorage', e);
      }

      return nextState;
    });

    void syncDeleteApplicationCascade({
      applicationId: appId,
      linkedStudentIds: linkedStudentIdsForSync,
      linkedBedIds: linkedBedIdsForSync,
    });

    if (linkedStdIdToClear) {
      setActiveStudentId('');
    }
    addAudit('Ariza o‘chirildi', 'Application', appId);
  };

  const submitApplication = (appData: Omit<Application, 'id' | 'submittedAt' | 'status'>): Application => {
    // Generate unique Application ID in format RC-2026-XXXX
    const existingIds = new Set(applications.map((a: Application) => a.id.toUpperCase()));
    let generatedId = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const candidate = `RC-2026-${randNum}`;
      if (!existingIds.has(candidate)) {
        generatedId = candidate;
        break;
      }
    }
    if (!generatedId) {
      generatedId = `RC-2026-${String(Date.now()).slice(-4)}`;
    }

    const prefType: RoomType | undefined = appData.preferredRoomType;
    const resolvedMonthlyTariff =
      appData.monthlyTariff ??
      (prefType ? settings.roomTariffs?.[prefType] ?? INITIAL_SETTINGS.roomTariffs[prefType] : undefined);

    const newApp: Application = {
      ...appData,
      id: generatedId,
      monthlyTariff: resolvedMonthlyTariff,
      status: 'new',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setState((prev: typeof state) => ({
      ...prev,
      applications: [newApp, ...prev.applications],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          type: 'application',
          title: 'Yangi Ariza kelib tushdi',
          message: `${newApp.fullName} (${newApp.id}) yotoqxonaga a'zo bo'lish uchun ariza topshirdi.`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          isRead: false,
          recipientRole: 'receptionist',
        },
        ...prev.notifications,
      ],
    }));

    void syncUpsertApplication(newApp, null);
    addAudit('Online ariza topshirildi', 'Application', newApp.id, undefined, newApp.fullName);
    return newApp;
  };

  const reviewApplication = (id: string, status: ApplicationStatus, notes?: string): string | undefined => {
    if (role === 'security') {
      console.warn('Security role is not permitted to review applications.');
      return undefined;
    }

    const targetApp = applications.find((app: Application) => app.id === id);
    let linkedStudentId = targetApp?.studentId;
    let newStudentToCreate: Student | null = null;
    let existingStudentMatchId: string | undefined;

    if (status === 'approved' && targetApp) {
      const targetPhoneKey = normalizePhoneKey(targetApp.phone);
      const targetPassportLower = targetApp.passportNumber.trim().toLowerCase();
      const existingStudent = students.find(
        (s: Student) =>
          s.status !== 'deleted_pending_purge' &&
          ((targetApp.studentId && s.id === targetApp.studentId) ||
            (targetPassportLower && s.passportNumber.trim().toLowerCase() === targetPassportLower) ||
            (targetPhoneKey.length >= 7 && normalizePhoneKey(s.phone) === targetPhoneKey) ||
            s.fullName === targetApp.fullName)
      );

      if (existingStudent) {
        linkedStudentId = existingStudent.id;
        existingStudentMatchId = existingStudent.id;
      } else {
        const prefType: RoomType = targetApp.preferredRoomType || 'comfort';
        const resolvedTariff =
          targetApp.monthlyTariff ??
          settings.roomTariffs?.[prefType] ??
          INITIAL_SETTINGS.roomTariffs[prefType] ??
          1200000;
        const newStudentId = `std-${Date.now()}`;
        linkedStudentId = newStudentId;
        newStudentToCreate = {
          id: newStudentId,
          applicationId: targetApp.id,
          fullName: targetApp.fullName,
          phone: targetApp.phone,
          birthDate: targetApp.birthDate,
          passportNumber: targetApp.passportNumber,
          passportFrontUrl: targetApp.passportFrontUrl,
          passportBackUrl: targetApp.passportBackUrl,
          university: targetApp.university,
          faculty: targetApp.faculty,
          degreeLevel: targetApp.degreeLevel,
          course: targetApp.course,
          group: targetApp.group,
          parentPhone: targetApp.parentPhone,
          permanentAddress: targetApp.permanentAddress,
          status: 'active',
          roomType: prefType,
          monthlyTariff: resolvedTariff,
          paidUntil: '',
          nextPaymentDueDate: '',
          debtAmount: 0,
          createdAt: new Date().toISOString().slice(0, 10),
          telegramChatId: `tg_${Date.now()}`,
        };
      }
    }

    setState((prev: typeof state) => {
      let updatedStudents = prev.students;
      let nextBillingLedgers: Record<string, StudentBillingLedger> = {
        ...(prev.billingLedgers || {}),
      };
      let nextPayments = prev.payments;

      if (status === 'approved' && targetApp && linkedStudentId) {
        if (nextBillingLedgers[targetApp.id] && !nextBillingLedgers[linkedStudentId]) {
          nextBillingLedgers = {
            ...nextBillingLedgers,
            [linkedStudentId]: {
              ...nextBillingLedgers[targetApp.id],
              studentId: linkedStudentId,
            },
          };
          delete nextBillingLedgers[targetApp.id];
        }
        nextPayments = prev.payments.map((p: Payment) =>
          p.studentId === targetApp.id ? { ...p, studentId: linkedStudentId! } : p
        );

        const baseStudent: Student = existingStudentMatchId
          ? {
              ...(prev.students.find((s: Student) => s.id === existingStudentMatchId) as Student),
              status: 'active' as const,
              applicationId:
                prev.students.find((s: Student) => s.id === existingStudentMatchId)?.applicationId ||
                targetApp.id,
              degreeLevel:
                prev.students.find((s: Student) => s.id === existingStudentMatchId)?.degreeLevel ||
                targetApp.degreeLevel,
            }
          : (newStudentToCreate as Student);

        const activeCnt = prev.contracts.find(
          (c: Contract) => c.studentId === baseStudent.id && c.status === 'active'
        );
        const approvedAppSnapshot: Application = {
          ...targetApp,
          status: 'approved',
          studentId: linkedStudentId,
        };
        const summary = computeStudentBillingSummary({
          entityId: baseStudent.id,
          student: baseStudent,
          application: approvedAppSnapshot,
          contract: activeCnt,
          rooms: prev.rooms,
          settings: prev.settings,
          payments: nextPayments,
          ledger: nextBillingLedgers[baseStudent.id],
        });
        const computedPaidUntil = summary.paidUntilDate || '';
        const expiryInfo = computePaymentExpiryInfo(computedPaidUntil);
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
        const syncedStudent: Student = {
          ...baseStudent,
          monthlyTariff: summary.monthlyRate,
          debtAmount: summary.remainingBalance,
          paymentStatus: computedPaymentStatus,
          paidUntil: computedPaidUntil,
          nextPaymentDueDate: computedPaidUntil,
          nextPaymentDate: computedPaidUntil,
        };

        if (existingStudentMatchId) {
          updatedStudents = prev.students.map((s: Student) =>
            s.id === existingStudentMatchId ? syncedStudent : s
          );
        } else if (newStudentToCreate) {
          const alreadyExists = prev.students.some((s: Student) => s.id === newStudentToCreate!.id);
          if (!alreadyExists) {
            updatedStudents = [syncedStudent, ...prev.students];
          }
        }
      }

      const updated = prev.applications.map((app: Application) => {
        if (app.id === id) {
          return {
            ...app,
            status,
            studentId: linkedStudentId || app.studentId,
            reviewNotes: notes || app.reviewNotes,
            reviewedBy: currentUserName,
          };
        }
        return app;
      });

      return {
        ...prev,
        applications: updated,
        students: updatedStudents,
        billingLedgers: nextBillingLedgers,
        payments: nextPayments,
      };
    });

    void (async () => {
      await syncUpdateApplication(id, { status });
      if (status === 'approved' && targetApp && linkedStudentId) {
        const existingStd = existingStudentMatchId
          ? students.find((s: Student) => s.id === existingStudentMatchId)
          : undefined;
        const residentToSave: Student | undefined = existingStd
          ? {
              ...existingStd,
              status: 'active',
              applicationId: existingStd.applicationId || targetApp.id,
              degreeLevel: existingStd.degreeLevel || targetApp.degreeLevel,
            }
          : newStudentToCreate || undefined;
        if (residentToSave) {
          await syncUpsertResident(residentToSave);
        }
      }
    })();

    addAudit(`Ariza ko'rib chiqildi (${status})`, 'Application', id, undefined, notes);
    return linkedStudentId;
  };

  const assignBed = async (
    studentId: string,
    roomId: string,
    bedId: string,
    initialBilling?: InitialBillingSetup
  ): Promise<{ tempLogin: string; tempPassword: string; roomNumber: string; bedLabel: string } | null> => {
    if (role === 'security') {
      console.warn('Security role is not permitted to assign beds.');
      return null;
    }

    const targetStudent: Student | undefined = students.find((s: Student) => s.id === studentId);
    const targetRoom: Room | undefined = rooms.find((r: Room) => r.id === roomId);
    if (!targetStudent || !targetRoom) return null;

    const targetBed: Bed | undefined = targetRoom.beds.find((b: Bed) => b.id === bedId);
    if (!targetBed) return null;

    if (targetBed.status === 'occupied' && targetBed.studentId && targetBed.studentId !== studentId) {
      console.warn('Cannot assign student: this bed is already occupied by another student.');
      return null;
    }
    if (targetBed.status === 'maintenance' || targetRoom.status === 'maintenance' || targetRoom.status === 'closed') {
      console.warn('Cannot assign student: bed or room is under maintenance.');
      return null;
    }

    const bedLabel = targetBed.bedIdentifier || String(targetBed.bedNumber);
    const phoneKey = normalizePhoneKey(targetStudent.phone);
    const tempLogin = phoneKey.length >= 9 ? formatUzPhoneDisplay(targetStudent.phone) : targetStudent.phone;
    const tempPassword = generateTempPassword();
    const salt = generateSalt();
    const passwordHash = await hashPassword(tempPassword, salt);
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);

    const assignPaymentId = `PAY-${Date.now() + 1}-MO`;
    const oldBedIdForSync = targetStudent.bedId;
    const baseTierTariffForSync =
      settings.roomTariffs?.[targetRoom.type] ??
      targetRoom.priceMonthly ??
      INITIAL_SETTINGS.roomTariffs[targetRoom.type];
    const overrideRateForSync =
      initialBilling?.monthlyRateOverride && initialBilling.monthlyRateOverride > 0
        ? safeAmount(initialBilling.monthlyRateOverride)
        : undefined;
    const computedMonthlyTariffForSync = overrideRateForSync ?? baseTierTariffForSync;

    const targetPassportLowerForSync = targetStudent.passportNumber.trim().toLowerCase();
    const matchedAppForSync = applications.find(
      (a: Application) =>
        a.id === targetStudent.applicationId ||
        a.studentId === targetStudent.id ||
        (phoneKey.length >= 7 && normalizePhoneKey(a.phone) === phoneKey) ||
        (targetPassportLowerForSync &&
          a.passportNumber.trim().toLowerCase() === targetPassportLowerForSync)
    );

    const initialPaymentsForSync: Payment[] = [];
    let replacedPeriodForSync: string | undefined;
    let resolvedPaidUntilForSync: string | undefined;
    if (initialBilling) {
      const billingDateTime = ensureDateTimeValue(initialBilling.paymentDate);
      const billingDateOnly = extractDatePart(billingDateTime) || todayStr;
      const billingTime = extractTimePart(billingDateTime);
      const billingMethod: BillingPaymentMethod =
        normalizeBillingMethod(initialBilling.paymentMethod) || 'cash';
      const billingNotes = initialBilling.notes?.trim() || undefined;
      const targetPeriod = initialBilling.initialPeriod || getCurrentBillingPeriod();
      replacedPeriodForSync = targetPeriod;
      const rawMonthStatus = initialBilling.monthStatus || 'pending';
      const monthPaid =
        rawMonthStatus === 'paid'
          ? computedMonthlyTariffForSync
          : rawMonthStatus === 'partial'
          ? safeAmount(initialBilling.monthAmount)
          : 0;
      if (monthPaid > 0) {
        resolvedPaidUntilForSync = isValidIsoDate(initialBilling.paidUntil)
          ? initialBilling.paidUntil!.trim()
          : addDaysToDateStr(billingDateTime, 30);
        initialPaymentsForSync.push({
          id: assignPaymentId,
          studentId: targetStudent.id,
          studentName: targetStudent.fullName,
          floor: targetRoom.floor,
          roomNumber: targetRoom.roomNumber,
          bedLabel,
          amount: monthPaid,
          paymentDate: billingDateTime,
          paymentTime: billingTime,
          date: billingDateOnly,
          paidUntil: resolvedPaidUntilForSync,
          type: 'income',
          periodMonth: targetPeriod,
          itemRemainingAfter: Math.max(0, computedMonthlyTariffForSync - monthPaid),
          paymentMethod: billingMethod,
          recordedBy: currentUserName,
          status: 'completed',
          notes: billingNotes,
        });
      }
    }

    const existingPaidUntilCandidates = [
      targetStudent.paidUntil,
      billingLedgers[targetStudent.id]?.paidUntil,
      resolvedPaidUntilForSync,
    ]
      .filter((d): d is string => Boolean(d && isValidIsoDate(d)))
      .sort();
    const finalPaidUntilForSync =
      existingPaidUntilCandidates.length > 0
        ? existingPaidUntilCandidates[existingPaidUntilCandidates.length - 1]
        : '';

    const studentForSync: Student = {
      ...targetStudent,
      status: 'active',
      applicationId: targetStudent.applicationId || matchedAppForSync?.id,
      roomId,
      bedId,
      roomNumber: targetRoom.roomNumber,
      bedNumber: targetBed.bedNumber,
      bedIdentifier: bedLabel,
      floor: targetRoom.floor,
      roomType: targetRoom.type,
      monthlyTariff: computedMonthlyTariffForSync,
      paidUntil: finalPaidUntilForSync,
      nextPaymentDueDate: finalPaidUntilForSync,
      nextPaymentDate: finalPaidUntilForSync,
      tempLogin,
      tempPassword,
    };

    setState((prev: typeof state) => {
      const liveStudent: Student | undefined = prev.students.find((s: Student) => s.id === studentId);
      const liveRoom: Room | undefined = prev.rooms.find((r: Room) => r.id === roomId);
      if (!liveStudent || !liveRoom) return prev;
      const liveBed: Bed | undefined = liveRoom.beds.find((b: Bed) => b.id === bedId);
      if (!liveBed) return prev;

      const oldBedId = liveStudent.bedId;

      // Update room/bed
      const updatedRooms = prev.rooms.map((r: Room) => {
        let roomChanged = false;
        const beds = r.beds.map((b: Bed) => {
          if (oldBedId && b.id === oldBedId && b.id !== bedId) {
            roomChanged = true;
            return {
              ...b,
              status: 'available' as const,
              studentId: undefined,
              studentName: undefined,
              assignedAt: undefined,
            };
          }
          if (r.id === roomId && b.id === bedId) {
            roomChanged = true;
            return {
              ...b,
              status: 'occupied' as const,
              studentId: liveStudent.id,
              studentName: liveStudent.fullName,
              assignedAt: todayStr,
            };
          }
          return b;
        });
        return roomChanged ? { ...r, beds } : r;
      });

      const baseTierTariff =
        prev.settings.roomTariffs?.[liveRoom.type] ??
        liveRoom.priceMonthly ??
        INITIAL_SETTINGS.roomTariffs[liveRoom.type];
      const overrideRate =
        initialBilling?.monthlyRateOverride && initialBilling.monthlyRateOverride > 0
          ? safeAmount(initialBilling.monthlyRateOverride)
          : undefined;
      const computedMonthlyTariff = overrideRate ?? baseTierTariff;

      // Find linked application (by studentId, applicationId, phone, or passport)
      const livePhoneKey = normalizePhoneKey(liveStudent.phone);
      const livePassportLower = liveStudent.passportNumber.trim().toLowerCase();
      const matchedApp = prev.applications.find(
        (a: Application) =>
          a.id === liveStudent.applicationId ||
          a.studentId === liveStudent.id ||
          (livePhoneKey.length >= 7 && normalizePhoneKey(a.phone) === livePhoneKey) ||
          (livePassportLower && a.passportNumber.trim().toLowerCase() === livePassportLower)
      );

      // Migrate any billing ledger & payments recorded under matchedApp.id before student assignment
      const nextBillingLedgers: Record<string, StudentBillingLedger> = {
        ...(prev.billingLedgers || {}),
      };
      let nextPayments = prev.payments;
      if (matchedApp && nextBillingLedgers[matchedApp.id] && !nextBillingLedgers[liveStudent.id]) {
        nextBillingLedgers[liveStudent.id] = {
          ...nextBillingLedgers[matchedApp.id],
          studentId: liveStudent.id,
        };
        delete nextBillingLedgers[matchedApp.id];
      }
      if (matchedApp) {
        nextPayments = prev.payments.map((p: Payment) =>
          p.studentId === matchedApp.id
            ? {
                ...p,
                studentId: liveStudent.id,
                floor: liveRoom.floor,
                roomNumber: liveRoom.roomNumber,
                bedLabel,
              }
            : p
        );
      }

      // Initialize or update 12-month billing ledger if initialBilling provided (or initialize empty ledger)
      const existingLedger = nextBillingLedgers[liveStudent.id];
      if (initialBilling) {
        const billingDateTime = ensureDateTimeValue(initialBilling.paymentDate);
        const billingDateOnly = extractDatePart(billingDateTime) || todayStr;
        const billingTime = extractTimePart(billingDateTime);
        const billingMethod: BillingPaymentMethod =
          normalizeBillingMethod(initialBilling.paymentMethod) || 'cash';
        const billingNotes = initialBilling.notes?.trim() || undefined;

        const targetPeriod = initialBilling.initialPeriod || getCurrentBillingPeriod();
        const rawMonthStatus = initialBilling.monthStatus || 'pending';
        const monthPaid =
          rawMonthStatus === 'paid'
            ? computedMonthlyTariff
            : rawMonthStatus === 'partial'
            ? safeAmount(initialBilling.monthAmount)
            : 0;
        const resolvedPaidUntil =
          monthPaid > 0
            ? isValidIsoDate(initialBilling.paidUntil)
              ? initialBilling.paidUntil!.trim()
              : addDaysToDateStr(billingDateTime, 30)
            : undefined;

        const monthsMap: Record<string, MonthlyBillingEntry> = {};
        ACADEMIC_BILLING_MONTHS.forEach((m) => {
          const prior = existingLedger?.months?.[m.period];
          if (m.period === targetPeriod) {
            monthsMap[m.period] = {
              period: m.period,
              paidAmount: monthPaid,
              status:
                monthPaid === 0
                  ? 'pending'
                  : computedMonthlyTariff > 0 && monthPaid >= computedMonthlyTariff
                  ? 'paid'
                  : 'partial',
              paymentDate: monthPaid > 0 ? billingDateTime : prior?.paymentDate,
              paidUntil: monthPaid > 0 ? resolvedPaidUntil : prior?.paidUntil,
              paymentMethod: monthPaid > 0 ? billingMethod : prior?.paymentMethod,
              notes: monthPaid > 0 ? billingNotes : prior?.notes,
              updatedAt: nowIso,
            };
          } else {
            monthsMap[m.period] = prior || {
              period: m.period,
              status: 'pending',
              paidAmount: 0,
            };
          }
        });

        const nextLedgerPaidUntil =
          resolvedPaidUntil &&
          (!existingLedger?.paidUntil || resolvedPaidUntil >= existingLedger.paidUntil)
            ? resolvedPaidUntil
            : existingLedger?.paidUntil;

        nextBillingLedgers[liveStudent.id] = {
          studentId: liveStudent.id,
          ...(overrideRate
            ? { monthlyRateOverride: overrideRate }
            : existingLedger?.monthlyRateOverride
            ? { monthlyRateOverride: existingLedger.monthlyRateOverride }
            : {}),
          ...(nextLedgerPaidUntil ? { paidUntil: nextLedgerPaidUntil } : {}),
          months: monthsMap,
          updatedAt: nowIso,
        };

        const syncedEntries: Payment[] = [];
        if (monthPaid > 0) {
          syncedEntries.push({
            id: assignPaymentId,
            studentId: liveStudent.id,
            studentName: liveStudent.fullName,
            floor: liveRoom.floor,
            roomNumber: liveRoom.roomNumber,
            bedLabel,
            amount: monthPaid,
            paymentDate: billingDateTime,
            paymentTime: billingTime,
            date: billingDateOnly,
            paidUntil: resolvedPaidUntil,
            type: 'income',
            periodMonth: targetPeriod,
            itemRemainingAfter: Math.max(0, computedMonthlyTariff - monthPaid),
            paymentMethod: billingMethod,
            recordedBy: currentUserName,
            status: 'completed',
            notes: billingNotes,
          });
        }

        const periodsToReplace = new Set<string>([targetPeriod]);
        const keptPayments = nextPayments.filter(
          (p: Payment) => !(p.studentId === liveStudent.id && periodsToReplace.has(p.periodMonth))
        );
        nextPayments = [...syncedEntries, ...keptPayments].sort(comparePaymentsChronoDesc);
      } else if (!existingLedger) {
        const emptyMonths: Record<string, MonthlyBillingEntry> = {};
        ACADEMIC_BILLING_MONTHS.forEach((m) => {
          emptyMonths[m.period] = {
            period: m.period,
            status: 'pending',
            paidAmount: 0,
          };
        });
        nextBillingLedgers[liveStudent.id] = {
          studentId: liveStudent.id,
          months: emptyMonths,
          updatedAt: nowIso,
        };
      }

      // Create contract
      const newContract: Contract = {
        id: `cnt-${Date.now()}`,
        contractNumber: `RC-2026/${liveRoom.roomNumber}-${bedLabel}`,
        studentId: liveStudent.id,
        studentName: liveStudent.fullName,
        passportNumber: liveStudent.passportNumber,
        roomNumber: liveRoom.roomNumber,
        bedNumber: liveBed.bedNumber,
        bedIdentifier: bedLabel,
        roomType: liveRoom.type,
        tariffMonthly: computedMonthlyTariff,
        startDate: todayStr,
        endDate: '2027-06-30',
        status: 'active',
        createdAt: todayStr,
        pdfGeneratedAt: nowIso.replace('T', ' ').slice(0, 16),
      };

      // Update student with computed financial snapshot
      const updatedStudents = prev.students.map((s: Student) => {
        if (s.id === studentId) {
          const baseStudent: Student = {
            ...s,
            status: 'active' as const,
            applicationId: s.applicationId || matchedApp?.id,
            roomId,
            bedId,
            roomNumber: liveRoom.roomNumber,
            bedNumber: liveBed.bedNumber,
            bedIdentifier: bedLabel,
            floor: liveRoom.floor,
            roomType: liveRoom.type,
            monthlyTariff: computedMonthlyTariff,
            tempLogin,
            tempPassword,
          };
          const summary = computeStudentBillingSummary({
            entityId: baseStudent.id,
            student: baseStudent,
            application: matchedApp,
            contract: newContract,
            rooms: updatedRooms,
            settings: prev.settings,
            payments: nextPayments,
            ledger: nextBillingLedgers[baseStudent.id],
          });
          const computedPaidUntil = summary.paidUntilDate || '';
          const expiryInfo = computePaymentExpiryInfo(computedPaidUntil);
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
            ...baseStudent,
            monthlyTariff: summary.monthlyRate,
            debtAmount: summary.remainingBalance,
            paymentStatus: computedPaymentStatus,
            paidUntil: computedPaidUntil,
            nextPaymentDueDate: computedPaidUntil,
            nextPaymentDate: computedPaidUntil,
          };
        }
        return s;
      });

      // Update linked application status + room/bed + credentials
      const updatedApplications = prev.applications.map((a: Application) => {
        if (matchedApp && a.id === matchedApp.id) {
          return {
            ...a,
            status: 'approved' as const,
            studentId: liveStudent.id,
            assignedRoomNumber: liveRoom.roomNumber,
            assignedBedNumber: Number(liveBed.bedNumber) || undefined,
            assignedBedIdentifier: bedLabel,
            preferredRoomType: a.preferredRoomType || liveRoom.type,
            monthlyTariff: computedMonthlyTariff,
            tempLogin,
            tempPassword,
            reviewedBy: a.reviewedBy || currentUserName,
          };
        }
        return a;
      });

      // Upsert hashed student credentials so temporary password works immediately on login
      const existingAccounts: StoredUserAccount[] = Array.isArray(prev.userAccounts) ? prev.userAccounts : [];
      const existingAccountIdx = existingAccounts.findIndex(
        (acc) =>
          acc.studentId === liveStudent.id ||
          (matchedApp && acc.applicationId === matchedApp.id) ||
          (livePhoneKey.length >= 7 && normalizePhoneKey(acc.phone) === livePhoneKey)
      );

      const nextAccount: StoredUserAccount = {
        id: existingAccountIdx >= 0 ? existingAccounts[existingAccountIdx].id : `acct-${Date.now()}`,
        identifier: livePhoneKey || tempLogin.toLowerCase(),
        login: existingAccountIdx >= 0 ? existingAccounts[existingAccountIdx].login : undefined,
        phone: tempLogin,
        role: 'student',
        studentId: liveStudent.id,
        applicationId: liveStudent.applicationId || matchedApp?.id,
        passwordHash,
        passwordSalt: salt,
        updatedAt: nowIso,
      };

      const nextUserAccounts =
        existingAccountIdx >= 0
          ? existingAccounts.map((acc, idx) => (idx === existingAccountIdx ? nextAccount : acc))
          : [nextAccount, ...existingAccounts];

      const studentNotif: NotificationItem = {
        id: `notif-assign-${Date.now()}`,
        type: 'application',
        title: 'Xona va o‘rin biriktirildi',
        message: `${liveStudent.fullName}: ${liveRoom.roomNumber}-xona, ${bedLabel}-o‘rin tasdiqlandi.`,
        date: nowIso.replace('T', ' ').slice(0, 16),
        isRead: false,
        recipientRole: 'student',
        studentId: liveStudent.id,
      };

      return {
        ...prev,
        rooms: updatedRooms,
        students: updatedStudents,
        applications: updatedApplications,
        contracts: [newContract, ...prev.contracts],
        payments: nextPayments,
        billingLedgers: nextBillingLedgers,
        userAccounts: nextUserAccounts,
        notifications: [studentNotif, ...prev.notifications],
      };
    });

    await syncAssignBedFlow({
      student: studentForSync,
      newBedId: bedId,
      oldBedId: oldBedIdForSync,
      applicationId: matchedAppForSync?.id || targetStudent.applicationId,
      initialPayments: initialPaymentsForSync,
      replacedPeriod: replacedPeriodForSync,
    });

    addAudit('Talaba o\'ringa biriktirildi', 'Bed', bedId, undefined, `Student: ${studentId}, Room: ${targetRoom.roomNumber}`);
    return {
      tempLogin,
      tempPassword,
      roomNumber: targetRoom.roomNumber,
      bedLabel,
    };
  };

  const transferBed = (studentId: string, newRoomId: string, newBedId: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to transfer beds.');
      return;
    }

    const std = students.find((s: Student) => s.id === studentId);

    setState((prev: typeof state) => {
      if (!std) return prev;

      const oldBedId = std.bedId;
      const targetRoom: Room | undefined = prev.rooms.find((r: Room) => r.id === newRoomId);
      if (!targetRoom) return prev;
      const targetBed: Bed | undefined = targetRoom.beds.find((b: Bed) => b.id === newBedId);
      if (!targetBed) return prev;

      if (targetBed.status === 'occupied' && targetBed.studentId && targetBed.studentId !== studentId) {
        console.warn('Cannot transfer: target bed is already occupied.');
        return prev;
      }
      if (targetBed.status === 'maintenance' || targetRoom.status === 'maintenance' || targetRoom.status === 'closed') {
        console.warn('Cannot transfer: target bed or room is under maintenance.');
        return prev;
      }

      // Release old bed & occupy new bed
      const updatedRooms = prev.rooms.map((r: Room) => {
        const updatedBeds = r.beds.map((b: Bed) => {
          if (b.id === oldBedId) {
            return { ...b, status: 'available' as const, studentId: undefined, studentName: undefined };
          }
          if (b.id === newBedId) {
            return { ...b, status: 'occupied' as const, studentId: std.id, studentName: std.fullName, assignedAt: new Date().toISOString().slice(0, 10) };
          }
          return b;
        });
        return { ...r, beds: updatedBeds };
      });

      // Calculate authoritative monthly tariff directly from roomTariffs[room.type]
      const computedMonthlyTariff =
        prev.settings.roomTariffs?.[targetRoom.type] ??
        targetRoom.priceMonthly ??
        INITIAL_SETTINGS.roomTariffs[targetRoom.type];

      // Update student's active contract with new room & bed
      const bedLabel = targetBed.bedIdentifier || String(targetBed.bedNumber);
      const updatedContracts = prev.contracts.map((cnt: Contract) => {
        if (cnt.studentId === studentId && cnt.status === 'active') {
          return {
            ...cnt,
            roomNumber: targetRoom.roomNumber,
            bedNumber: targetBed.bedNumber,
            bedIdentifier: bedLabel,
            roomType: targetRoom.type,
            tariffMonthly: computedMonthlyTariff,
            contractNumber: `RC-2026/${targetRoom.roomNumber}-${bedLabel}`,
          };
        }
        return cnt;
      });

      const updatedApplications = prev.applications.map((a: Application) => {
        if (a.studentId === studentId || (std.applicationId && a.id === std.applicationId)) {
          return {
            ...a,
            assignedRoomNumber: targetRoom.roomNumber,
            assignedBedNumber: Number(targetBed.bedNumber) || undefined,
            assignedBedIdentifier: bedLabel,
            monthlyTariff: computedMonthlyTariff,
          };
        }
        return a;
      });

      // Update student
      const updatedStudents = prev.students.map((s: Student) => {
        if (s.id === studentId) {
          const moved: Student = {
            ...s,
            roomId: newRoomId,
            bedId: newBedId,
            roomNumber: targetRoom.roomNumber,
            bedNumber: targetBed.bedNumber,
            bedIdentifier: bedLabel,
            floor: targetRoom.floor,
            roomType: targetRoom.type,
            monthlyTariff: computedMonthlyTariff,
          };
          const summary = computeStudentBillingSummary({
            entityId: moved.id,
            student: moved,
            application: findLinkedApplication(moved, updatedApplications),
            contract: updatedContracts.find((c: Contract) => c.studentId === moved.id && c.status === 'active'),
            rooms: updatedRooms,
            settings: prev.settings,
            payments: prev.payments,
            ledger: (prev.billingLedgers || {})[moved.id],
          });
          return {
            ...moved,
            monthlyTariff: summary.monthlyRate,
            debtAmount: summary.remainingBalance,
            paymentStatus: (summary.remainingBalance > 0 ? 'overdue' : 'paid') as 'overdue' | 'paid',
          };
        }
        return s;
      });

      return {
        ...prev,
        rooms: updatedRooms,
        students: updatedStudents,
        contracts: updatedContracts,
        applications: updatedApplications,
      };
    });

    const targetRoomForSync = rooms.find((r: Room) => r.id === newRoomId);
    const targetBedForSync = targetRoomForSync?.beds.find((b: Bed) => b.id === newBedId);
    const canSyncTransfer = Boolean(
      std &&
        targetRoomForSync &&
        targetBedForSync &&
        !(targetBedForSync.status === 'occupied' && targetBedForSync.studentId && targetBedForSync.studentId !== studentId) &&
        targetBedForSync.status !== 'maintenance' &&
        targetRoomForSync.status !== 'maintenance' &&
        targetRoomForSync.status !== 'closed'
    );
    if (canSyncTransfer && std && targetRoomForSync && targetBedForSync) {
      const roomTypeForSync = targetRoomForSync.type as RoomType;
      const bedLabelForSync = targetBedForSync.bedIdentifier || String(targetBedForSync.bedNumber);
      const tariffForSync =
        settings.roomTariffs?.[roomTypeForSync] ??
        targetRoomForSync.priceMonthly ??
        INITIAL_SETTINGS.roomTariffs[roomTypeForSync];
      const linkedAppForSync = applications.find(
        (a: Application) => a.studentId === studentId || (std.applicationId && a.id === std.applicationId)
      );
      void syncAssignBedFlow({
        student: {
          ...std,
          roomId: newRoomId,
          bedId: newBedId,
          roomNumber: targetRoomForSync.roomNumber,
          bedNumber: targetBedForSync.bedNumber,
          bedIdentifier: bedLabelForSync,
          floor: targetRoomForSync.floor,
          roomType: targetRoomForSync.type,
          monthlyTariff: tariffForSync,
        },
        newBedId,
        oldBedId: std.bedId,
        applicationId: linkedAppForSync?.id || std.applicationId,
      });
    }

    addAudit('Talaba ko\'chirildi (Transfer)', 'Student', studentId, std?.roomNumber, `New Room`);
  };

  const releaseBed = (bedId: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to release beds.');
      return;
    }

    let releasedStudentIdForSync: string | undefined;
    rooms.forEach((r: Room) => {
      r.beds.forEach((b: Bed) => {
        if (b.id === bedId) releasedStudentIdForSync = b.studentId;
      });
    });
    const affectedStudentIdsForSync: string[] = [];
    const affectedAppIdsForSync: string[] = [];
    students.forEach((s: Student) => {
      if (s.bedId === bedId || (releasedStudentIdForSync && s.id === releasedStudentIdForSync)) {
        affectedStudentIdsForSync.push(s.id);
        if (s.applicationId) affectedAppIdsForSync.push(s.applicationId);
      }
    });
    applications.forEach((a: Application) => {
      if (a.studentId && affectedStudentIdsForSync.includes(a.studentId) && !affectedAppIdsForSync.includes(a.id)) {
        affectedAppIdsForSync.push(a.id);
      }
    });

    setState((prev: typeof state) => {
      let releasedStudentId: string | undefined;

      const updatedRooms = prev.rooms.map((r: Room) => {
        const beds = r.beds.map((b: Bed) => {
          if (b.id === bedId) {
            releasedStudentId = b.studentId;
            return {
              ...b,
              status: 'available' as const,
              studentId: undefined,
              studentName: undefined,
              assignedAt: undefined,
            };
          }
          return b;
        });
        return { ...r, beds };
      });

      const affectedStudentIds = new Set<string>();
      const affectedAppIds = new Set<string>();

      const updatedStudents = prev.students.map((s: Student) => {
        if (s.bedId === bedId || (releasedStudentId && s.id === releasedStudentId)) {
          affectedStudentIds.add(s.id);
          if (s.applicationId) affectedAppIds.add(s.applicationId);
          return {
            ...s,
            roomId: undefined,
            bedId: undefined,
            roomNumber: undefined,
            bedNumber: undefined,
            bedIdentifier: undefined,
            floor: undefined,
          };
        }
        return s;
      });

      const updatedApplications = prev.applications.map((a: Application) => {
        if (
          (a.studentId && affectedStudentIds.has(a.studentId)) ||
          affectedAppIds.has(a.id)
        ) {
          return {
            ...a,
            assignedRoomNumber: undefined,
            assignedBedNumber: undefined,
            assignedBedIdentifier: undefined,
          };
        }
        return a;
      });

      const updatedContracts = prev.contracts.map((c: Contract) =>
        affectedStudentIds.has(c.studentId) && c.status === 'active'
          ? { ...c, status: 'terminated' as const }
          : c
      );

      return {
        ...prev,
        rooms: updatedRooms,
        students: updatedStudents,
        applications: updatedApplications,
        contracts: updatedContracts,
      };
    });

    void syncReleaseBedCascade({
      bedId,
      affectedStudentIds: affectedStudentIdsForSync,
      affectedAppIds: affectedAppIdsForSync,
    });

    addAudit('O\'rin bo\'shatildi', 'Bed', bedId);
  };

  const resetAllBedsToAvailable = () => {
    if (role !== 'owner' && role !== 'manager') {
      console.warn('Only Owner or Manager can reset all beds.');
      return;
    }

    setState((prev: typeof state) => {
      const updatedRooms = prev.rooms.map((r: Room) => ({
        ...r,
        status: 'available' as const,
        isClosedForMaintenance: false,
        beds: r.beds.map((b: Bed) => ({
          ...b,
          status: 'available' as const,
          studentId: undefined,
          studentName: undefined,
          assignedAt: undefined,
        })),
      }));

      const updatedStudents = prev.students.map((s: Student) => ({
        ...s,
        roomId: undefined,
        bedId: undefined,
        roomNumber: undefined,
        bedNumber: undefined,
        bedIdentifier: undefined,
        floor: undefined,
      }));

      const updatedApplications = prev.applications.map((a: Application) => ({
        ...a,
        assignedRoomNumber: undefined,
        assignedBedNumber: undefined,
        assignedBedIdentifier: undefined,
      }));

      const updatedContracts = prev.contracts.map((c: Contract) =>
        c.status === 'active' ? { ...c, status: 'terminated' as const } : c
      );

      return {
        ...prev,
        rooms: updatedRooms,
        students: updatedStudents,
        applications: updatedApplications,
        contracts: updatedContracts,
      };
    });

    void syncResetAllBeds();
    addAudit('Barcha o‘rinlar bo‘sh holatga qaytarildi', 'Room', 'all');
  };

  // RBAC Permission check: Only 'owner' and 'manager' can configure rooms & beds
  const canConfigureRooms = role === 'owner' || role === 'manager';

  const addRoom = (roomData: {
    floor: number;
    roomNumber: string;
    type?: RoomType;
    priceMonthly?: number;
    bedIdentifiers: string[];
    status?: 'available' | 'maintenance' | 'closed';
    notes?: string;
  }): { success: boolean; error?: string; room?: Room } => {
    if (!canConfigureRooms) {
      return { success: false, error: 'Access denied: Only Owner or Manager can configure rooms and beds.' };
    }

    const { floor, roomNumber, bedIdentifiers, notes } = roomData;
    if (floor < 2 || floor > 5) {
      return { success: false, error: 'Floor must be a residential floor (2, 3, 4, or 5).' };
    }

    const exactRoomNumber = String(roomNumber || '').trim();
    if (!exactRoomNumber) {
      return { success: false, error: 'Room number / identifier is required.' };
    }

    // Check duplicate room on the same floor
    const exists = rooms.some(
      (r: Room) => r.floor === floor && r.roomNumber.toLowerCase() === exactRoomNumber.toLowerCase()
    );
    if (exists) {
      return { success: false, error: `Room "${exactRoomNumber}" already exists on floor ${floor}.` };
    }

    if (!Array.isArray(bedIdentifiers) || bedIdentifiers.length === 0) {
      return { success: false, error: 'At least one bed identifier must be provided.' };
    }

    // Check empty bed identifiers
    if (bedIdentifiers.some((b) => !String(b || '').trim())) {
      return { success: false, error: 'All bed identifier fields must be filled.' };
    }

    // Check duplicate bed identifiers within the same room
    const normalizedBeds = bedIdentifiers.map((b) => String(b).trim().toLowerCase());
    const uniqueBeds = new Set(normalizedBeds);
    if (uniqueBeds.size !== normalizedBeds.length) {
      return { success: false, error: 'Bed identifiers must be unique within this room.' };
    }

    const roomId = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const capacity = bedIdentifiers.length;
    const roomType: RoomType = roomData.type || (capacity <= 4 ? 'lux' : capacity <= 6 ? 'comfort' : 'standard');
    const defaultTariff =
      settings.roomTariffs?.[roomType] ?? INITIAL_SETTINGS.roomTariffs[roomType];
    const priceMonthly = roomData.priceMonthly || defaultTariff;

    const beds: Bed[] = bedIdentifiers.map((bedIdStr, idx) => ({
      id: `bed-${roomId}-${idx + 1}-${Date.now()}`,
      bedNumber: idx + 1,
      bedIdentifier: String(bedIdStr).trim(),
      roomId,
      status: roomData.status === 'maintenance' || roomData.status === 'closed' ? 'maintenance' : 'available',
    }));

    const newRoom: Room = {
      id: roomId,
      roomNumber: exactRoomNumber,
      floor,
      type: roomType,
      capacity,
      priceMonthly,
      beds,
      status: roomData.status || 'available',
      isClosedForMaintenance: roomData.status === 'maintenance' || roomData.status === 'closed',
      notes: notes?.trim() || undefined,
    };

    // Atomic update
    setState((prev: typeof state) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
    }));

    void syncUpsertRoomAndBeds(newRoom);
    addAudit(
      `Yangi xona qo'shildi (${exactRoomNumber}, ${roomType}, ${capacity} o'rin)`,
      'Room',
      roomId,
      undefined,
      `${floor}-qavat, xona: ${exactRoomNumber}, o'rinlar: ${bedIdentifiers.join(', ')}`
    );

    return { success: true, room: newRoom };
  };

  const updateRoom = (
    roomId: string,
    updates: {
      floor?: number;
      roomNumber?: string;
      type?: RoomType;
      priceMonthly?: number;
      bedIdentifiers?: string[];
      status?: 'available' | 'maintenance' | 'closed';
      notes?: string;
    }
  ): { success: boolean; error?: string; room?: Room } => {
    if (!canConfigureRooms) {
      return { success: false, error: 'Access denied: Only Owner or Manager can configure rooms and beds.' };
    }

    const existingRoom = rooms.find((r: Room) => r.id === roomId);
    if (!existingRoom) {
      return { success: false, error: 'Room not found.' };
    }

    const targetFloor = updates.floor !== undefined ? updates.floor : existingRoom.floor;
    const targetRoomNumber = updates.roomNumber !== undefined ? String(updates.roomNumber).trim() : existingRoom.roomNumber;

    if (!targetRoomNumber) {
      return { success: false, error: 'Room identifier cannot be empty.' };
    }

    // Check duplicate room on the target floor (excluding current room)
    const duplicate = rooms.some(
      (r: Room) => r.id !== roomId && r.floor === targetFloor && r.roomNumber.toLowerCase() === targetRoomNumber.toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: `Room "${targetRoomNumber}" already exists on floor ${targetFloor}.` };
    }

    let updatedBeds: Bed[] = [...existingRoom.beds];

    // If bedIdentifiers is provided, reconcile bed records
    if (updates.bedIdentifiers !== undefined) {
      const newIds = updates.bedIdentifiers.map((b) => String(b || '').trim());
      if (newIds.length === 0) {
        return { success: false, error: 'At least one bed identifier is required.' };
      }
      if (newIds.some((b) => !b)) {
        return { success: false, error: 'All bed identifier fields must be filled.' };
      }

      // Check uniqueness within the room
      const normalizedBeds = newIds.map((b) => b.toLowerCase());
      if (new Set(normalizedBeds).size !== normalizedBeds.length) {
        return { success: false, error: 'Bed identifiers must be unique within this room.' };
      }

      // Check if decreasing bed count would remove an occupied bed or active student
      if (newIds.length < existingRoom.beds.length) {
        const bedsToRemove = existingRoom.beds.slice(newIds.length);
        const hasOccupied = bedsToRemove.some((b: Bed) => b.status === 'occupied' || b.studentId);
        if (hasOccupied) {
          return {
            success: false,
            error: 'Cannot reduce bed count: One or more beds to be removed are currently occupied by active residents.',
          };
        }
      }

      // Build updated beds preserving assignments on existing positions
      updatedBeds = newIds.map((idStr, idx) => {
        const existingBed = existingRoom.beds[idx];
        if (existingBed) {
          return {
            ...existingBed,
            bedNumber: idx + 1,
            bedIdentifier: idStr,
          };
        }
        // New bed addition
        return {
          id: `bed-${roomId}-${idx + 1}-${Date.now()}`,
          bedNumber: idx + 1,
          bedIdentifier: idStr,
          roomId,
          status: updates.status === 'maintenance' || updates.status === 'closed' ? 'maintenance' : 'available',
        };
      });
    }

    const newCapacity = updatedBeds.length;
    const newRoomType: RoomType = (updates.type || existingRoom.type) as RoomType;
    const resolvedTariff =
      settings.roomTariffs?.[newRoomType] ?? INITIAL_SETTINGS.roomTariffs[newRoomType];
    const newPrice =
      updates.priceMonthly !== undefined
        ? updates.priceMonthly
        : resolvedTariff;

    const isMaintenance = updates.status === 'maintenance' || updates.status === 'closed';

    const updatedRoom: Room = {
      ...existingRoom,
      floor: targetFloor,
      roomNumber: targetRoomNumber,
      type: newRoomType,
      capacity: newCapacity,
      priceMonthly: newPrice,
      beds: updatedBeds,
      status: updates.status || existingRoom.status || 'available',
      isClosedForMaintenance: updates.status !== undefined ? isMaintenance : existingRoom.isClosedForMaintenance,
      notes: updates.notes !== undefined ? updates.notes.trim() || undefined : existingRoom.notes,
    };

    // Also update any student reference if roomNumber, floor, type, or price changed
    setState((prev: typeof state) => {
      const nextRooms = prev.rooms.map((r: Room) => (r.id === roomId ? updatedRoom : r));
      const nextStudents = prev.students.map((s: Student) => {
        if (s.roomId === roomId) {
          return {
            ...s,
            roomNumber: targetRoomNumber,
            floor: targetFloor,
            roomType: newRoomType,
            monthlyTariff: newPrice,
          };
        }
        return s;
      });
      return {
        ...prev,
        rooms: nextRooms,
        students: nextStudents,
      };
    });

    const keptBedIds = new Set(updatedBeds.map((b) => b.id));
    const removedBedIdsForSync = existingRoom.beds
      .filter((b: Bed) => !keptBedIds.has(b.id))
      .map((b: Bed) => b.id);
    const affectedStudentsForSync = students
      .filter((s: Student) => s.roomId === roomId)
      .map((s: Student) => ({
        ...s,
        roomNumber: targetRoomNumber,
        floor: targetFloor,
        roomType: newRoomType,
        monthlyTariff: newPrice,
      }));
    void syncUpsertRoomAndBeds(updatedRoom, removedBedIdsForSync, affectedStudentsForSync);

    addAudit(
      `Xona konfiguratsiyasi tahrirlandi (${targetRoomNumber})`,
      'Room',
      roomId,
      existingRoom.roomNumber,
      targetRoomNumber
    );

    return { success: true, room: updatedRoom };
  };

  const deleteRoom = (roomId: string): { success: boolean; error?: string } => {
    if (!canConfigureRooms) {
      return { success: false, error: 'Access denied: Only Owner or Manager can delete rooms.' };
    }

    const room = rooms.find((r: Room) => r.id === roomId);
    if (!room) {
      return { success: false, error: 'Room not found.' };
    }

    // Safety checks: Cannot delete room if any bed is occupied or assigned
    const occupiedBed = room.beds.find((b: Bed) => b.status === 'occupied' || b.studentId);
    if (occupiedBed) {
      return {
        success: false,
        error: `Cannot delete room ${room.roomNumber}: Bed "${occupiedBed.bedIdentifier || occupiedBed.bedNumber}" is currently occupied by a student. Release or transfer student first.`,
      };
    }

    const activeStudentInRoom = students.find((s: Student) => s.roomId === roomId || s.roomNumber === room.roomNumber);
    if (activeStudentInRoom) {
      return {
        success: false,
        error: `Cannot delete room ${room.roomNumber}: Active resident ${activeStudentInRoom.fullName} is registered to this room.`,
      };
    }

    setState((prev: typeof state) => ({
      ...prev,
      rooms: prev.rooms.filter((r: Room) => r.id !== roomId),
    }));

    void syncDeleteRoomAndBeds(roomId);
    addAudit(`Xona o'chirildi (${room.roomNumber})`, 'Room', roomId, room.roomNumber, undefined);

    return { success: true };
  };

  const updateBed = (
    roomId: string,
    bedId: string,
    updates: {
      bedIdentifier?: string;
      status?: 'available' | 'maintenance' | 'reserved';
    }
  ): { success: boolean; error?: string } => {
    if (!canConfigureRooms) {
      return { success: false, error: 'Access denied: Only Owner or Manager can edit beds.' };
    }

    const room = rooms.find((r: Room) => r.id === roomId);
    if (!room) {
      return { success: false, error: 'Room not found.' };
    }

    const bed = room.beds.find((b: Bed) => b.id === bedId);
    if (!bed) {
      return { success: false, error: 'Bed not found.' };
    }

    if (updates.status === 'maintenance') {
      if (bed.status === 'occupied' || bed.studentId) {
        return {
          success: false,
          error: `Cannot place bed "${bed.bedIdentifier || bed.bedNumber}" under maintenance: bed is currently occupied by an active resident. Please release or transfer resident first.`,
        };
      }
    }

    if (updates.bedIdentifier !== undefined) {
      const cleanId = String(updates.bedIdentifier).trim();
      if (!cleanId) {
        return { success: false, error: 'Bed identifier cannot be empty.' };
      }

      // Check duplicate within the same room
      const duplicate = room.beds.some(
        (b: Bed) => b.id !== bedId && b.bedIdentifier.toLowerCase() === cleanId.toLowerCase()
      );
      if (duplicate) {
        return { success: false, error: `Bed identifier "${cleanId}" already exists in room ${room.roomNumber}.` };
      }
    }

    setState((prev: typeof state) => {
      const nextRooms = prev.rooms.map((r: Room) => {
        if (r.id !== roomId) return r;
        return {
          ...r,
          beds: r.beds.map((b) => {
            if (b.id !== bedId) return b;
            return {
              ...b,
              bedIdentifier: updates.bedIdentifier !== undefined ? String(updates.bedIdentifier).trim() : b.bedIdentifier,
              status: updates.status !== undefined ? updates.status : b.status,
            };
          }),
        };
      });

      return {
        ...prev,
        rooms: nextRooms,
      };
    });

    void syncUpdateSingleBed(bedId, updates);
    addAudit(`O'rin ma'lumoti yangilandi`, 'Bed', bedId, bed.bedIdentifier, updates.bedIdentifier);

    return { success: true };
  };

  // 1st Floor Common Areas Configuration
  const addCommonArea = (areaData: Omit<CommonArea, 'id'>) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to configure common areas.');
      return;
    }

    const newArea: CommonArea = {
      ...areaData,
      id: `ca-${Date.now()}`,
      floor: 1,
    };
    setState((prev: typeof state) => ({
      ...prev,
      commonAreas: [...(prev.commonAreas || []), newArea],
    }));
    addAudit('Yangi umumiy hudud qo\'shildi', 'CommonArea', newArea.id, undefined, newArea.name);
  };

  const updateCommonArea = (id: string, updates: Partial<CommonArea>) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to update common areas.');
      return;
    }

    setState((prev: typeof state) => ({
      ...prev,
      commonAreas: (prev.commonAreas || []).map((ca: CommonArea) =>
        ca.id === id ? { ...ca, ...updates, floor: 1 } : ca
      ),
    }));
    addAudit('Umumiy hudud tahrirlandi', 'CommonArea', id, undefined, JSON.stringify(updates));
  };

  const deleteCommonArea = (id: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to delete common areas.');
      return;
    }

    const target = (state.commonAreas || []).find((ca: CommonArea) => ca.id === id);
    setState((prev: typeof state) => ({
      ...prev,
      commonAreas: (prev.commonAreas || []).filter((ca: CommonArea) => ca.id !== id),
    }));
    if (target) {
      addAudit('Umumiy hudud o\'chirildi', 'CommonArea', id, target.name, undefined);
    }
  };

  const recordPayment = (paymentData: {
    studentId: string;
    amount: number;
    paymentDate: string;
    paidUntil?: string;
    periodMonth: string;
    paymentMethod: BillingPaymentMethod;
    notes?: string;
    monthlyRateOverride?: number;
  }): Payment => {
    if (role === 'security') {
      console.warn('Security role is not permitted to record payments.');
      return {} as Payment;
    }

    const std = students.find((s: Student) => s.id === paymentData.studentId);
    const appEntity = !std
      ? applications.find((a: Application) => a.id === paymentData.studentId)
      : undefined;
    const paymentDateTime = ensureDateTimeValue(paymentData.paymentDate);
    const paymentTime = extractTimePart(paymentDateTime);
    const paymentDateOnly = extractDatePart(paymentDateTime);
    const cleanAmount = safeAmount(paymentData.amount);
    const period = paymentData.periodMonth || getCurrentBillingPeriod();
    const normMethod: BillingPaymentMethod =
      normalizeBillingMethod(paymentData.paymentMethod) || 'cash';
    const resolvedPaidUntil = isValidIsoDate(paymentData.paidUntil)
      ? paymentData.paidUntil!.trim()
      : addDaysToDateStr(paymentDateTime, 30);

    const roomNum = std?.roomNumber || appEntity?.assignedRoomNumber || '---';
    const roomObj = rooms.find((r: Room) => r.id === std?.roomId || r.roomNumber === roomNum);
    const floorNum = std?.floor || roomObj?.floor;
    const bedLabel =
      std?.bedIdentifier ||
      (std?.bedNumber ? String(std.bedNumber) : undefined) ||
      appEntity?.assignedBedIdentifier ||
      (appEntity?.assignedBedNumber ? String(appEntity.assignedBedNumber) : undefined);

    const newPaymentId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const baseReturnedPayment: Payment = {
      id: newPaymentId,
      studentId: paymentData.studentId,
      studentName: std ? std.fullName : appEntity ? appEntity.fullName : 'Noma\'lum',
      floor: floorNum,
      roomNumber: roomNum,
      bedLabel,
      amount: cleanAmount,
      paymentDate: paymentDateTime,
      paymentTime,
      date: paymentDateOnly,
      paidUntil: resolvedPaidUntil,
      type: 'income',
      periodMonth: period,
      paymentMethod: normMethod,
      recordedBy: currentUserName,
      status: 'completed',
      notes: paymentData.notes?.trim() || undefined,
    };

    setState((prev: typeof state) => {
      const existingLedgers: Record<string, StudentBillingLedger> = {
        ...(prev.billingLedgers || {}),
      };
      const targetStudent = prev.students.find((s: Student) => s.id === paymentData.studentId);
      const linkedApp = targetStudent
        ? findLinkedApplication(targetStudent, prev.applications)
        : prev.applications.find((a: Application) => a.id === paymentData.studentId);
      const activeCnt = targetStudent
        ? prev.contracts.find((c: Contract) => c.studentId === paymentData.studentId && c.status === 'active')
        : undefined;

      const existingEntityLedger = existingLedgers[paymentData.studentId];
      const nextOverride =
        paymentData.monthlyRateOverride !== undefined
          ? paymentData.monthlyRateOverride > 0
            ? safeAmount(paymentData.monthlyRateOverride)
            : undefined
          : existingEntityLedger?.monthlyRateOverride;

      const ledgerForCalc: StudentBillingLedger | undefined = existingEntityLedger
        ? {
            ...existingEntityLedger,
            ...(nextOverride ? { monthlyRateOverride: nextOverride } : {}),
          }
        : nextOverride
        ? {
            studentId: paymentData.studentId,
            monthlyRateOverride: nextOverride,
            months: {},
            updatedAt: new Date().toISOString(),
          }
        : undefined;

      const priorSummary = computeStudentBillingSummary({
        entityId: paymentData.studentId,
        student: targetStudent,
        application: linkedApp,
        contract: activeCnt,
        rooms: prev.rooms,
        settings: prev.settings,
        payments: prev.payments,
        ledger: ledgerForCalc,
      });

      const baseMonths: Record<string, MonthlyBillingEntry> = {};
      priorSummary.months.forEach((m) => {
        baseMonths[m.period] = {
          period: m.period,
          status: m.status,
          paidAmount: m.paidAmount,
          paymentDate: m.paymentDate,
          paidUntil: m.paidUntil,
          paymentMethod: m.paymentMethod,
          notes: m.notes,
        };
      });

      const currentMonthRow = baseMonths[period] || {
        period,
        status: 'pending' as const,
        paidAmount: 0,
      };
      const nextMonthPaid = safeAmount(currentMonthRow.paidAmount) + cleanAmount;
      const rate = priorSummary.monthlyRate;
      const itemRemainingAfter = Math.max(0, rate - nextMonthPaid);
      baseMonths[period] = {
        period,
        paidAmount: nextMonthPaid,
        status: rate > 0 && nextMonthPaid >= rate ? 'paid' : nextMonthPaid > 0 ? 'partial' : 'pending',
        paymentDate: paymentDateTime,
        paidUntil: resolvedPaidUntil,
        paymentMethod: normMethod,
        notes: paymentData.notes?.trim() || currentMonthRow.notes,
      };

      const persistedPayment: Payment = {
        ...baseReturnedPayment,
        floor: targetStudent?.floor ?? priorSummary.room?.floor ?? baseReturnedPayment.floor,
        roomNumber:
          targetStudent?.roomNumber ||
          priorSummary.room?.roomNumber ||
          linkedApp?.assignedRoomNumber ||
          baseReturnedPayment.roomNumber,
        bedLabel:
          targetStudent?.bedIdentifier ||
          (targetStudent?.bedNumber ? String(targetStudent.bedNumber) : undefined) ||
          baseReturnedPayment.bedLabel,
        itemRemainingAfter,
      };

      const nextPayments = [persistedPayment, ...prev.payments].sort(comparePaymentsChronoDesc);

      const nextLedgerPaidUntil =
        !existingEntityLedger?.paidUntil || resolvedPaidUntil >= existingEntityLedger.paidUntil
          ? resolvedPaidUntil
          : existingEntityLedger.paidUntil;

      const nextLedger: StudentBillingLedger = {
        studentId: paymentData.studentId,
        ...(nextOverride ? { monthlyRateOverride: nextOverride } : {}),
        ...(nextLedgerPaidUntil ? { paidUntil: nextLedgerPaidUntil } : {}),
        months: baseMonths,
        updatedAt: new Date().toISOString(),
      };
      const nextLedgers = {
        ...existingLedgers,
        [paymentData.studentId]: nextLedger,
      };

      const updatedStudents = prev.students.map((s: Student) => {
        if (s.id === paymentData.studentId) {
          const summary = computeStudentBillingSummary({
            entityId: s.id,
            student: s,
            application: linkedApp,
            contract: activeCnt,
            rooms: prev.rooms,
            settings: prev.settings,
            payments: nextPayments,
            ledger: nextLedger,
          });
          const computedPaidUntil = summary.paidUntilDate || '';
          const expiryInfo = computePaymentExpiryInfo(computedPaidUntil);
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
            lastPaymentDate: paymentDateTime,
            nextPaymentDate: computedPaidUntil,
            nextPaymentDueDate: computedPaidUntil,
            paidUntil: computedPaidUntil,
            paymentStatus: computedPaymentStatus,
            debtAmount: summary.remainingBalance,
            monthlyTariff: summary.monthlyRate,
          };
        }
        return s;
      });

      const updatedApplications = prev.applications.map((a: Application) => {
        if (a.id === paymentData.studentId || (targetStudent?.applicationId && a.id === targetStudent.applicationId)) {
          return {
            ...a,
            monthlyTariff: priorSummary.monthlyRate,
          };
        }
        return a;
      });

      const updatedContracts = prev.contracts.map((c: Contract) => {
        if (
          c.status === 'active' &&
          (c.studentId === paymentData.studentId ||
            (linkedApp?.studentId && c.studentId === linkedApp.studentId))
        ) {
          return {
            ...c,
            tariffMonthly: priorSummary.monthlyRate,
          };
        }
        return c;
      });

      return {
        ...prev,
        payments: nextPayments,
        students: updatedStudents,
        applications: updatedApplications,
        contracts: updatedContracts,
        billingLedgers: nextLedgers,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: 'payment',
            title: 'To\'lov muvaffaqiyatli qabul qilindi',
            message: `${std?.fullName || appEntity?.fullName || 'Rezident'} tomonidan ${cleanAmount.toLocaleString()} UZS to'landi (${formatMethodLabel(normMethod, 'uz')}).`,
            date: paymentDateTime.replace('T', ' '),
            isRead: false,
            recipientRole: 'all',
          },
          ...prev.notifications,
        ],
      };
    });

    const existingPaidUntilList = [
      std?.paidUntil,
      billingLedgers[paymentData.studentId]?.paidUntil,
      resolvedPaidUntil,
    ]
      .filter((d): d is string => Boolean(d && isValidIsoDate(d)))
      .sort();
    const syncedResidentPaidUntil =
      existingPaidUntilList.length > 0
        ? existingPaidUntilList[existingPaidUntilList.length - 1]
        : resolvedPaidUntil;

    void syncRecordPaymentFlow({
      payment: baseReturnedPayment,
      residentId: paymentData.studentId,
      paidUntil: syncedResidentPaidUntil,
      monthlyRate:
        paymentData.monthlyRateOverride && paymentData.monthlyRateOverride > 0
          ? safeAmount(paymentData.monthlyRateOverride)
          : undefined,
      hasResidentRecord: Boolean(std),
    });

    addAudit('To\'lov kiritildi', 'Payment', newPaymentId, undefined, `${cleanAmount} UZS`);
    return baseReturnedPayment;
  };

  // Dedicated handleAcceptPayment handler
  const handleAcceptPayment = (studentId: string, amount: number): Payment => {
    const nowDateTime = getCurrentLocalDateTime();
    const targetStudent = students.find((s: Student) => s.id === studentId);
    const linkedApp = targetStudent
      ? findLinkedApplication(targetStudent, applications)
      : applications.find((a: Application) => a.id === studentId);
    const activeCnt = targetStudent
      ? contracts.find((c: Contract) => c.studentId === studentId && c.status === 'active')
      : undefined;
    const summary = computeStudentBillingSummary({
      entityId: studentId,
      student: targetStudent,
      application: linkedApp,
      contract: activeCnt,
      rooms,
      settings,
      payments,
      ledger: billingLedgers[studentId],
    });
    const targetPeriod = summary.nextDuePeriod || getCurrentBillingPeriod();
    return recordPayment({
      studentId,
      amount,
      paymentDate: nowDateTime,
      paidUntil: addDaysToDateStr(nowDateTime, 30),
      periodMonth: targetPeriod,
      paymentMethod: 'cash',
    });
  };

  // Authoritative Billing Ledger Editor Save (12-Month Academic Schedule + Paid-Through Date + Optional Manual Rate Override)
  const updateStudentBillingLedger = (
    entityId: string,
    updates: {
      monthlyRateOverride?: number;
      paidUntil?: string;
      months: Record<string, MonthlyBillingEntry>;
    }
  ) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to update billing ledgers.');
      return;
    }

    const nowIso = new Date().toISOString();
    const nowDateTime = getCurrentLocalDateTime();

    setState((prev: typeof state) => {
      const targetStudent: Student | undefined = prev.students.find((s: Student) => s.id === entityId);
      const targetApp: Application | undefined = targetStudent
        ? findLinkedApplication(targetStudent, prev.applications)
        : prev.applications.find((a: Application) => a.id === entityId);
      const activeCnt: Contract | undefined = targetStudent
        ? prev.contracts.find((c: Contract) => c.studentId === targetStudent.id && c.status === 'active')
        : undefined;

      const displayName = targetStudent?.fullName || targetApp?.fullName || 'Rezident';
      const displayRoom = targetStudent?.roomNumber || targetApp?.assignedRoomNumber || '---';
      const roomObj = prev.rooms.find(
        (r: Room) => r.id === targetStudent?.roomId || r.roomNumber === displayRoom
      );
      const displayFloor = targetStudent?.floor ?? roomObj?.floor;
      const displayBedLabel =
        targetStudent?.bedIdentifier ||
        (targetStudent?.bedNumber ? String(targetStudent.bedNumber) : undefined) ||
        targetApp?.assignedBedIdentifier ||
        (targetApp?.assignedBedNumber ? String(targetApp.assignedBedNumber) : undefined);

      const sanitizedOverride =
        updates.monthlyRateOverride !== undefined &&
        Number.isFinite(updates.monthlyRateOverride) &&
        updates.monthlyRateOverride > 0
          ? safeAmount(updates.monthlyRateOverride)
          : undefined;

      const sanitizedMonths: Record<string, MonthlyBillingEntry> = {};
      ACADEMIC_BILLING_MONTHS.forEach((m) => {
        const raw = updates.months[m.period];
        const status = raw?.status || 'pending';
        const paidAmount = status === 'pending' ? 0 : safeAmount(raw?.paidAmount);
        const pDateTime = status === 'pending' ? undefined : ensureDateTimeValue(raw?.paymentDate);
        const pUntil =
          status === 'pending'
            ? undefined
            : isValidIsoDate(raw?.paidUntil)
            ? raw!.paidUntil!.trim()
            : pDateTime
            ? addDaysToDateStr(pDateTime, 30)
            : undefined;
        sanitizedMonths[m.period] = {
          period: m.period,
          status,
          ...(raw?.scheduledAmount && raw.scheduledAmount > 0
            ? { scheduledAmount: safeAmount(raw.scheduledAmount) }
            : {}),
          paidAmount,
          paymentDate: pDateTime,
          paidUntil: pUntil,
          paymentMethod: status === 'pending' ? undefined : (normalizeBillingMethod(raw?.paymentMethod) || 'cash'),
          notes: raw?.notes?.trim() || undefined,
        };
      });

      const explicitLedgerPaidUntil = isValidIsoDate(updates.paidUntil)
        ? updates.paidUntil!.trim()
        : undefined;

      const nextLedger: StudentBillingLedger = {
        studentId: entityId,
        ...(sanitizedOverride ? { monthlyRateOverride: sanitizedOverride } : {}),
        ...(explicitLedgerPaidUntil ? { paidUntil: explicitLedgerPaidUntil } : {}),
        months: sanitizedMonths,
        updatedAt: nowIso,
      };

      const nextLedgers: Record<string, StudentBillingLedger> = {
        ...(prev.billingLedgers || {}),
        [entityId]: nextLedger,
      };

      const prelimSummary = computeStudentBillingSummary({
        entityId,
        student: targetStudent,
        application: targetApp,
        contract: activeCnt,
        rooms: prev.rooms,
        settings: prev.settings,
        payments: prev.payments,
        ledger: nextLedger,
      });
      const effectiveRate = prelimSummary.monthlyRate;

      const managedPeriods = new Set<string>(ACADEMIC_BILLING_MONTHS.map((m) => m.period));
      const preservedPayments = prev.payments.filter(
        (p: Payment) => !(p.studentId === entityId && managedPeriods.has(p.periodMonth))
      );

      const syncedPayments: Payment[] = [];
      let txCounter = 0;

      const reconcilePeriodTransactions = (params: {
        period: string;
        targetPaid: number;
        targetExpected: number;
        status: string;
        paymentDate?: string;
        paidUntil?: string;
        paymentMethod?: BillingPaymentMethod;
        notes?: string;
      }) => {
        const existingPeriodRows = prev.payments.filter(
          (p: Payment) =>
            p.studentId === entityId &&
            p.periodMonth === params.period &&
            p.status === 'completed'
        );
        const existingSum = existingPeriodRows.reduce((s: number, p: Payment) => s + safeAmount(p.amount), 0);

        if (params.status === 'pending' || params.targetPaid <= 0) {
          return;
        }

        const itemRemAfter = Math.max(0, params.targetExpected - params.targetPaid);
        const pDateTime = ensureDateTimeValue(params.paymentDate || nowDateTime);
        const pTime = extractTimePart(pDateTime);
        const pDateOnly = extractDatePart(pDateTime);
        const pUntil = isValidIsoDate(params.paidUntil)
          ? params.paidUntil!.trim()
          : addDaysToDateStr(pDateTime, 30);

        if (existingPeriodRows.length > 0 && existingSum === params.targetPaid) {
          existingPeriodRows.forEach((p: Payment) => {
            syncedPayments.push({
              ...p,
              floor: p.floor ?? displayFloor,
              roomNumber: p.roomNumber || displayRoom,
              bedLabel: p.bedLabel ?? displayBedLabel,
              paidUntil: isValidIsoDate(params.paidUntil) ? params.paidUntil!.trim() : p.paidUntil || pUntil,
            });
          });
          return;
        }

        if (existingPeriodRows.length > 0 && params.targetPaid > existingSum) {
          existingPeriodRows.forEach((p: Payment) => {
            syncedPayments.push({
              ...p,
              floor: p.floor ?? displayFloor,
              roomNumber: p.roomNumber || displayRoom,
              bedLabel: p.bedLabel ?? displayBedLabel,
            });
          });
          const delta = params.targetPaid - existingSum;
          txCounter += 1;
          syncedPayments.push({
            id: `PAY-${Date.now() + txCounter}-${params.period.slice(-2).toUpperCase()}`,
            studentId: entityId,
            studentName: displayName,
            floor: displayFloor,
            roomNumber: displayRoom,
            bedLabel: displayBedLabel,
            amount: delta,
            paymentDate: pDateTime,
            paymentTime: pTime,
            date: pDateOnly,
            paidUntil: pUntil,
            type: 'income',
            periodMonth: params.period,
            itemRemainingAfter: itemRemAfter,
            paymentMethod: params.paymentMethod || 'cash',
            recordedBy: currentUserName,
            status: 'completed',
            notes: params.notes,
          });
          return;
        }

        txCounter += 1;
        syncedPayments.push({
          id: `PAY-${Date.now() + txCounter}-${params.period.slice(-2).toUpperCase()}`,
          studentId: entityId,
          studentName: displayName,
          floor: displayFloor,
          roomNumber: displayRoom,
          bedLabel: displayBedLabel,
          amount: params.targetPaid,
          paymentDate: pDateTime,
          paymentTime: pTime,
          date: pDateOnly,
          paidUntil: pUntil,
          type: 'income',
          periodMonth: params.period,
          itemRemainingAfter: itemRemAfter,
          paymentMethod: params.paymentMethod || 'cash',
          recordedBy: currentUserName,
          status: 'completed',
          notes: params.notes,
        });
      };

      ACADEMIC_BILLING_MONTHS.forEach((m) => {
        const entry = sanitizedMonths[m.period];
        if (entry) {
          const expectedRate = entry.scheduledAmount && entry.scheduledAmount > 0 ? entry.scheduledAmount : effectiveRate;
          reconcilePeriodTransactions({
            period: m.period,
            targetPaid: entry.paidAmount,
            targetExpected: expectedRate,
            status: entry.status,
            paymentDate: entry.paymentDate,
            paidUntil: entry.paidUntil,
            paymentMethod: entry.paymentMethod,
            notes: entry.notes,
          });
        }
      });

      const nextPayments = [...syncedPayments, ...preservedPayments].sort(comparePaymentsChronoDesc);

      const summary = computeStudentBillingSummary({
        entityId,
        student: targetStudent,
        application: targetApp,
        contract: activeCnt,
        rooms: prev.rooms,
        settings: prev.settings,
        payments: nextPayments,
        ledger: nextLedger,
      });

      const computedPaidUntil = summary.paidUntilDate || '';
      const expiryInfo = computePaymentExpiryInfo(computedPaidUntil);
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

      const datedEntries = Object.values(sanitizedMonths)
        .map((m) => m.paymentDate)
        .filter((d): d is string => Boolean(d))
        .sort();
      const latestPayDate = datedEntries.length > 0 ? datedEntries[datedEntries.length - 1] : undefined;

      const updatedStudents = prev.students.map((s: Student) => {
        if (s.id === entityId || (targetApp?.studentId && s.id === targetApp.studentId)) {
          return {
            ...s,
            monthlyTariff: summary.monthlyRate,
            debtAmount: summary.remainingBalance,
            paymentStatus: computedPaymentStatus,
            paidUntil: computedPaidUntil,
            nextPaymentDueDate: computedPaidUntil,
            nextPaymentDate: computedPaidUntil,
            lastPaymentDate: latestPayDate || s.lastPaymentDate,
          };
        }
        return s;
      });

      const updatedApplications = prev.applications.map((a: Application) => {
        if (a.id === entityId || (targetStudent?.applicationId && a.id === targetStudent.applicationId)) {
          return {
            ...a,
            monthlyTariff: summary.monthlyRate,
          };
        }
        return a;
      });

      const updatedContracts = prev.contracts.map((c: Contract) => {
        if (
          c.status === 'active' &&
          (c.studentId === entityId || (targetApp?.studentId && c.studentId === targetApp.studentId))
        ) {
          return {
            ...c,
            tariffMonthly: summary.monthlyRate,
          };
        }
        return c;
      });

      return {
        ...prev,
        billingLedgers: nextLedgers,
        payments: nextPayments,
        students: updatedStudents,
        applications: updatedApplications,
        contracts: updatedContracts,
      };
    });

    const syncTargetStudent = students.find((s: Student) => s.id === entityId);
    const syncSanitizedOverride =
      updates.monthlyRateOverride !== undefined &&
      Number.isFinite(updates.monthlyRateOverride) &&
      updates.monthlyRateOverride > 0
        ? safeAmount(updates.monthlyRateOverride)
        : undefined;
    const syncPaymentsToPersist: Payment[] = [];
    const syncPaidUntilDates: string[] = [];
    if (isValidIsoDate(updates.paidUntil)) {
      syncPaidUntilDates.push(updates.paidUntil!.trim());
    }
    let syncTxIdx = 0;
    ACADEMIC_BILLING_MONTHS.forEach((m) => {
      const raw = updates.months[m.period];
      const st = raw?.status || 'pending';
      const paidAmt = st === 'pending' ? 0 : safeAmount(raw?.paidAmount);
      if (st === 'pending' || paidAmt <= 0) return;

      const pDt = ensureDateTimeValue(raw?.paymentDate || nowDateTime);
      const pUntil = isValidIsoDate(raw?.paidUntil)
        ? raw!.paidUntil!.trim()
        : addDaysToDateStr(pDt, 30);
      if (isValidIsoDate(pUntil)) syncPaidUntilDates.push(pUntil);

      const existingRows = payments.filter(
        (p: Payment) =>
          p.studentId === entityId && p.periodMonth === m.period && p.status === 'completed'
      );
      const existingSum = existingRows.reduce((acc: number, p: Payment) => acc + safeAmount(p.amount), 0);

      if (existingRows.length > 0 && existingSum === paidAmt) {
        existingRows.forEach((p: Payment) => {
          syncPaymentsToPersist.push({
            ...p,
            paidUntil: isValidIsoDate(raw?.paidUntil) ? raw!.paidUntil!.trim() : p.paidUntil || pUntil,
          });
        });
      } else if (existingRows.length > 0 && paidAmt > existingSum) {
        existingRows.forEach((p: Payment) => syncPaymentsToPersist.push(p));
        syncTxIdx += 1;
        syncPaymentsToPersist.push({
          id: `PAY-${Date.now() + syncTxIdx}-${m.period.slice(-2).toUpperCase()}`,
          studentId: entityId,
          studentName: syncTargetStudent?.fullName || 'Rezident',
          floor: syncTargetStudent?.floor,
          roomNumber: syncTargetStudent?.roomNumber || '---',
          bedLabel: syncTargetStudent?.bedIdentifier,
          amount: paidAmt - existingSum,
          paymentDate: pDt,
          paymentTime: extractTimePart(pDt),
          date: extractDatePart(pDt),
          paidUntil: pUntil,
          type: 'income',
          periodMonth: m.period,
          paymentMethod: normalizeBillingMethod(raw?.paymentMethod) || 'cash',
          recordedBy: currentUserName,
          status: 'completed',
          notes: raw?.notes?.trim() || undefined,
        });
      } else {
        syncTxIdx += 1;
        syncPaymentsToPersist.push({
          id: `PAY-${Date.now() + syncTxIdx}-${m.period.slice(-2).toUpperCase()}`,
          studentId: entityId,
          studentName: syncTargetStudent?.fullName || 'Rezident',
          floor: syncTargetStudent?.floor,
          roomNumber: syncTargetStudent?.roomNumber || '---',
          bedLabel: syncTargetStudent?.bedIdentifier,
          amount: paidAmt,
          paymentDate: pDt,
          paymentTime: extractTimePart(pDt),
          date: extractDatePart(pDt),
          paidUntil: pUntil,
          type: 'income',
          periodMonth: m.period,
          paymentMethod: normalizeBillingMethod(raw?.paymentMethod) || 'cash',
          recordedBy: currentUserName,
          status: 'completed',
          notes: raw?.notes?.trim() || undefined,
        });
      }
    });
    syncPaidUntilDates.sort();
    const resolvedLedgerPaidUntil =
      syncPaidUntilDates.length > 0
        ? syncPaidUntilDates[syncPaidUntilDates.length - 1]
        : '';

    void syncReplaceResidentPayments({
      residentId: entityId,
      payments: syncPaymentsToPersist,
      paidUntil: resolvedLedgerPaidUntil,
      monthlyRate: syncSanitizedOverride,
      hasResidentRecord: Boolean(syncTargetStudent),
    });

    addAudit('To‘lov jadvali yangilandi', 'BillingLedger', entityId);
  };

  // Upsert a single monthly billing entry (YYYY-MM) without duplicating rows
  const upsertBillingEntry: DormContextType['upsertBillingEntry'] = (params) => {
    const {
      entityId,
      periodMonth,
      paidAmount,
      status,
      paymentMethod,
      paymentDate,
      paidUntil,
      notes,
      monthlyRateOverride,
    } = params;
    const targetStudent = students.find((s: Student) => s.id === entityId);
    const targetApp = targetStudent
      ? findLinkedApplication(targetStudent, applications)
      : applications.find((a: Application) => a.id === entityId);
    const activeCnt = targetStudent
      ? contracts.find((c: Contract) => c.studentId === targetStudent.id && c.status === 'active')
      : undefined;

    const currentLedger = billingLedgers[entityId];
    const currentSummary = computeStudentBillingSummary({
      entityId,
      student: targetStudent,
      application: targetApp,
      contract: activeCnt,
      rooms,
      settings,
      payments,
      ledger: currentLedger,
    });

    const nextOverride =
      monthlyRateOverride !== undefined
        ? monthlyRateOverride > 0
          ? safeAmount(monthlyRateOverride)
          : undefined
        : currentLedger?.monthlyRateOverride;

    const nextMonths: Record<string, MonthlyBillingEntry> = {};
    currentSummary.months.forEach((m) => {
      nextMonths[m.period] = {
        period: m.period,
        status: m.status,
        paidAmount: m.paidAmount,
        paymentDate: m.paymentDate,
        paidUntil: m.paidUntil,
        paymentMethod: m.paymentMethod,
        notes: m.notes,
      };
    });

    const cleanAmount = safeAmount(paidAmount, 0);
    const cleanMethod = normalizeBillingMethod(paymentMethod) || 'cash';
    const cleanDateTime = ensureDateTimeValue(paymentDate);
    const cleanPaidUntil = isValidIsoDate(paidUntil)
      ? paidUntil!.trim()
      : addDaysToDateStr(cleanDateTime, 30);
    const cleanNotes = notes?.trim() || undefined;

    const effectiveRate = nextOverride ?? currentSummary.monthlyRate;
    const finalMonthPaid =
      status === 'pending'
        ? 0
        : status === 'paid' && cleanAmount === 0
        ? effectiveRate
        : cleanAmount;

    nextMonths[periodMonth] = {
      period: periodMonth,
      status,
      paidAmount: finalMonthPaid,
      paymentDate: status === 'pending' ? undefined : cleanDateTime,
      paidUntil: status === 'pending' ? undefined : cleanPaidUntil,
      paymentMethod: status === 'pending' ? undefined : cleanMethod,
      notes: cleanNotes,
      updatedAt: new Date().toISOString(),
    };

    updateStudentBillingLedger(entityId, {
      monthlyRateOverride: nextOverride,
      paidUntil: status === 'pending' ? currentLedger?.paidUntil : cleanPaidUntil,
      months: nextMonths,
    });
  };

  const createIssue = (issueData: {
    category: Issue['category'];
    location: string;
    roomNumber?: string;
    description: string;
    priority: Issue['priority'];
    photoUrl?: string;
  }): Issue => {
    const newIssue: Issue = {
      id: `iss-${Date.now()}`,
      ...issueData,
      reportedBy: currentUserName,
      reporterRole: role,
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setState((prev: typeof state) => ({
      ...prev,
      issues: [newIssue, ...prev.issues],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          type: 'issue',
          title: 'Yangi Muammo Bildirildi',
          message: `${issueData.location}: ${issueData.description}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          isRead: false,
          recipientRole: 'cleaner',
        },
        ...prev.notifications,
      ],
    }));

    addAudit('Muammo yaratildi', 'Issue', newIssue.id, undefined, issueData.description);
    return newIssue;
  };

  const updateIssueStatus = (issueId: string, status: IssueStatus, assignedToId?: string) => {
    setState((prev: typeof state) => {
      const assignedEmp = prev.employees.find((e: Employee) => e.id === assignedToId);
      const updated = prev.issues.map((iss: Issue) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status,
            assignedTo: assignedToId || iss.assignedTo,
            assignedEmployeeName: assignedEmp ? assignedEmp.fullName : iss.assignedEmployeeName,
            resolvedAt: status === 'resolved' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : iss.resolvedAt,
          };
        }
        return iss;
      });
      return { ...prev, issues: updated };
    });

    addAudit(`Muammo holati o'zgartirildi (${status})`, 'Issue', issueId);
  };

  const addDisciplineRecord = (record: { studentId: string; violationReason: string; penaltyPoints: number }) => {
    const std = students.find((s: Student) => s.id === record.studentId);
    const newRecord: DisciplineRecord = {
      id: `disc-${Date.now()}`,
      studentId: record.studentId,
      studentName: std ? std.fullName : 'Talaba',
      roomNumber: std?.roomNumber || '---',
      violationReason: record.violationReason,
      penaltyPoints: record.penaltyPoints,
      recordedBy: currentUserName,
      date: new Date().toISOString().slice(0, 10),
    };

    setState((prev: typeof state) => ({
      ...prev,
      disciplineRecords: [newRecord, ...prev.disciplineRecords],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          type: 'discipline',
          title: 'Intizomiy Ogohlantirish',
          message: `${std?.fullName}: ${record.violationReason} (+${record.penaltyPoints} ball)`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          isRead: false,
          recipientRole: 'manager',
        },
        ...prev.notifications,
      ],
    }));

    addAudit('Intizomiy qayd kiritildi', 'Discipline', newRecord.id, undefined, `${record.penaltyPoints} ball`);
  };

  const addEmployee = (empData: Omit<Employee, 'id' | 'lastLogin'>) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to add employees.');
      return;
    }

    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      lastLogin: 'Hali kirmagan',
    };
    setState((prev: typeof state) => ({
      ...prev,
      employees: [...prev.employees, newEmp],
    }));
    addAudit('Xodim qo\'shildi', 'Employee', newEmp.id, undefined, newEmp.fullName);
  };

  const toggleEmployeeStatus = (id: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to modify employee accounts.');
      return;
    }

    setState((prev: typeof state) => {
      const updated = prev.employees.map((e: Employee) => (e.id === id ? { ...e, status: (e.status === 'active' ? 'disabled' : 'active') as 'active' | 'disabled' } : e));
      return { ...prev, employees: updated };
    });
    addAudit('Xodim statusi o\'zgartirildi', 'Employee', id);
  };

  // ==========================================
  // OWNER STAFF & PASSWORDS (Supabase staff_users)
  // ==========================================

  const generateStaffUuid = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  };

  const refreshStaffUsers = useCallback(async () => {
    const remote = await fetchStaffUsersFromSupabase();
    if (remote !== null) {
      setState((prev: typeof state) => ({
        ...prev,
        staffUsers: remote,
      }));
    }
  }, []);

  const addStaffUser: DormContextType['addStaffUser'] = async (data) => {
    if (role !== 'owner' || activeStaffUser) {
      return { success: false, errorCode: 'unauthorized' };
    }

    const fullName = data.fullName.trim();
    const roleTitle = data.roleTitle.trim();
    const login = data.login.trim();
    const password = data.password;

    if (!fullName || !roleTitle || !login || !password) {
      return { success: false, errorCode: 'missing_fields' };
    }

    const loweredLogin = login.toLowerCase();
    if (loweredLogin === 'owner' || loweredLogin === 'admin') {
      return { success: false, errorCode: 'reserved_login' };
    }

    const exists = (staffUsers as StaffUser[]).some(
      (s) => s.login.trim().toLowerCase() === loweredLogin
    );
    if (exists) {
      return { success: false, errorCode: 'duplicate_login' };
    }

    if (!validateStrongPassword(password).isValid) {
      return { success: false, errorCode: 'weak_password' };
    }

    const nowDisplay = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newStaff: StaffUser = {
      id: generateStaffUuid(),
      fullName,
      roleTitle,
      login,
      password,
      isActive: data.isActive !== false,
      createdAt: nowDisplay,
    };

    const syncRes = await syncInsertStaffUser(newStaff);
    if (!syncRes.ok) {
      return { success: false, errorCode: 'sync_error', errorMessage: syncRes.error };
    }

    const savedStaff = syncRes.saved || newStaff;
    setState((prev: typeof state) => ({
      ...prev,
      staffUsers: [savedStaff, ...(Array.isArray(prev.staffUsers) ? prev.staffUsers : [])],
    }));

    addAudit('Xodim akkaunti yaratildi', 'StaffUser', savedStaff.id, undefined, `${savedStaff.fullName} (${savedStaff.roleTitle})`);
    return { success: true, staffUser: savedStaff };
  };

  const updateStaffUser: DormContextType['updateStaffUser'] = async (id, updates) => {
    if (role !== 'owner' || activeStaffUser) {
      return { success: false, errorCode: 'unauthorized' };
    }

    const existing = (staffUsers as StaffUser[]).find((s) => s.id === id);
    if (!existing) {
      return { success: false, errorCode: 'not_found' };
    }

    const nextFullName = updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName;
    const nextRoleTitle = updates.roleTitle !== undefined ? updates.roleTitle.trim() : existing.roleTitle;
    const nextLogin = updates.login !== undefined ? updates.login.trim() : existing.login;
    const nextPassword =
      updates.password !== undefined && updates.password !== ''
        ? updates.password
        : existing.password;
    const nextIsActive = updates.isActive !== undefined ? Boolean(updates.isActive) : existing.isActive;

    if (!nextFullName || !nextRoleTitle || !nextLogin) {
      return { success: false, errorCode: 'missing_fields' };
    }

    const loweredLogin = nextLogin.toLowerCase();
    if (loweredLogin === 'owner' || loweredLogin === 'admin') {
      return { success: false, errorCode: 'reserved_login' };
    }

    const duplicate = (staffUsers as StaffUser[]).some(
      (s) => s.id !== id && s.login.trim().toLowerCase() === loweredLogin
    );
    if (duplicate) {
      return { success: false, errorCode: 'duplicate_login' };
    }

    if (updates.password !== undefined && updates.password !== '') {
      if (!validateStrongPassword(updates.password).isValid) {
        return { success: false, errorCode: 'weak_password' };
      }
    }

    const syncRes = await syncUpdateStaffUser(id, {
      fullName: nextFullName,
      roleTitle: nextRoleTitle,
      login: nextLogin,
      ...(updates.password !== undefined && updates.password !== ''
        ? { password: updates.password }
        : {}),
      isActive: nextIsActive,
    });

    if (!syncRes.ok) {
      return { success: false, errorCode: 'sync_error', errorMessage: syncRes.error };
    }

    setState((prev: typeof state) => ({
      ...prev,
      staffUsers: (Array.isArray(prev.staffUsers) ? prev.staffUsers : []).map((s: StaffUser) =>
        s.id === id
          ? {
              ...s,
              fullName: nextFullName,
              roleTitle: nextRoleTitle,
              login: nextLogin,
              password: nextPassword,
              isActive: nextIsActive,
            }
          : s
      ),
    }));

    addAudit(
      updates.password ? 'Xodim paroli/ma\'lumotlari yangilandi' : 'Xodim ma\'lumotlari yangilandi',
      'StaffUser',
      id,
      existing.login,
      `${nextFullName} (${nextRoleTitle})`
    );
    return { success: true };
  };

  const toggleStaffUserActive: DormContextType['toggleStaffUserActive'] = async (id) => {
    if (role !== 'owner' || activeStaffUser) {
      return { success: false };
    }

    const existing = (staffUsers as StaffUser[]).find((s) => s.id === id);
    if (!existing) return { success: false };

    const nextActive = !existing.isActive;
    const syncRes = await syncUpdateStaffUser(id, { isActive: nextActive });
    if (!syncRes.ok) {
      return { success: false, errorMessage: syncRes.error };
    }

    setState((prev: typeof state) => ({
      ...prev,
      staffUsers: (Array.isArray(prev.staffUsers) ? prev.staffUsers : []).map((s: StaffUser) =>
        s.id === id ? { ...s, isActive: nextActive } : s
      ),
    }));

    addAudit(
      'Xodim holati o\'zgartirildi',
      'StaffUser',
      id,
      existing.isActive ? 'active' : 'inactive',
      nextActive ? 'active' : 'inactive'
    );
    return { success: true };
  };

  const deleteStaffUser: DormContextType['deleteStaffUser'] = async (id) => {
    if (role !== 'owner' || activeStaffUser) {
      return { success: false };
    }

    const existing = (staffUsers as StaffUser[]).find((s) => s.id === id);
    const syncRes = await syncDeleteStaffUser(id);
    if (!syncRes.ok) {
      return { success: false, errorMessage: syncRes.error };
    }

    setState((prev: typeof state) => ({
      ...prev,
      staffUsers: (Array.isArray(prev.staffUsers) ? prev.staffUsers : []).filter(
        (s: StaffUser) => s.id !== id
      ),
    }));

    addAudit('Xodim akkaunti o\'chirildi', 'StaffUser', id, existing?.fullName, undefined);
    return { success: true };
  };

  const updateSettings = (newSettings: DormSettings) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to modify dorm settings.');
      return;
    }

    setState((prev: typeof state) => {
      // Update room prices & active student tariffs when tariffs change
      const updatedRooms = prev.rooms.map((r: Room) => {
        const priceMonthly = newSettings.roomTariffs[r.type] ?? r.priceMonthly;
        return { ...r, priceMonthly };
      });
      const updatedRoomMap = new Map<string, Room>(updatedRooms.map((r: Room) => [r.id, r]));
      const updatedContracts = prev.contracts.map((c: Contract) => {
        if (c.status === 'active' && c.roomType && newSettings.roomTariffs[c.roomType] !== undefined) {
          return { ...c, tariffMonthly: newSettings.roomTariffs[c.roomType] };
        }
        return c;
      });
      const updatedStudents = prev.students.map((s: Student) => {
        const rm = s.roomId ? updatedRoomMap.get(s.roomId) : undefined;
        const resolvedType = rm?.type || s.roomType;
        const nextTariff =
          resolvedType && newSettings.roomTariffs[resolvedType] !== undefined
            ? newSettings.roomTariffs[resolvedType]
            : s.monthlyTariff;
        const nextStudent: Student = {
          ...s,
          roomType: resolvedType,
          monthlyTariff: nextTariff,
        };
        const summary = computeStudentBillingSummary({
          entityId: nextStudent.id,
          student: nextStudent,
          application: findLinkedApplication(nextStudent, prev.applications),
          contract: updatedContracts.find((c: Contract) => c.studentId === nextStudent.id && c.status === 'active'),
          rooms: updatedRooms,
          settings: newSettings,
          payments: prev.payments,
          ledger: (prev.billingLedgers || {})[nextStudent.id],
        });
        return {
          ...nextStudent,
          monthlyTariff: summary.monthlyRate,
          debtAmount: summary.remainingBalance,
          paymentStatus: (summary.remainingBalance > 0 ? 'overdue' : 'paid') as 'overdue' | 'paid',
        };
      });
      return {
        ...prev,
        settings: newSettings,
        rooms: updatedRooms,
        contracts: updatedContracts,
        students: updatedStudents,
      };
    });
    const updatedRoomsForSync: Room[] = rooms.map((r: Room) => ({
      ...r,
      priceMonthly: newSettings.roomTariffs[r.type] ?? r.priceMonthly,
    }));
    const updatedStudentsForSync: Student[] = students.map((s: Student) => {
      const rm: Room | undefined = s.roomId
        ? updatedRoomsForSync.find((r: Room) => r.id === s.roomId)
        : undefined;
      const resolvedType: RoomType | undefined = (rm?.type || s.roomType) as RoomType | undefined;
      const nextTariff =
        resolvedType && newSettings.roomTariffs[resolvedType] !== undefined
          ? newSettings.roomTariffs[resolvedType]
          : s.monthlyTariff;
      return {
        ...s,
        roomType: resolvedType,
        monthlyTariff: nextTariff,
      };
    });
    void syncRoomTariffChanges(updatedRoomsForSync, updatedStudentsForSync);

    addAudit('Tizim sozlamalari yangilandi', 'Settings', 'global');
  };

  const resetToDefaults = () => {
    const fresh = {
      ...generateSeedData(),
      userAccounts: [] as StoredUserAccount[],
      billingLedgers: {} as Record<string, StudentBillingLedger>,
    };
    setState(fresh);
    setActiveStudentId('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  const markNotificationAsRead = (id: string) => {
    setState((prev: typeof state) => ({
      ...prev,
      notifications: prev.notifications.map((n: NotificationItem) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
  };

  // ==========================================
  // ACCESS CONTROL & HIKVISION IMPLEMENTATIONS
  // ==========================================

  const simulateAccessScan = async (request: AccessEvaluationRequest): Promise<AccessEvaluationResponse> => {
    const targetTerminal = accessTerminals.find((t: AccessTerminal) => t.id === request.terminalId) || accessTerminals[0];
    const response = await accessClientService.evaluateAccess(request, targetTerminal, students, accessPolicy);

    // Update state with log event and student access metadata
    setState((prev: typeof state) => {
      const updatedLogs = [response.logEvent, ...prev.accessLogs.slice(0, 199)];

      let updatedStudents = prev.students;
      if (response.student) {
        updatedStudents = prev.students.map((s: Student) => {
          if (s.id === response.student?.id) {
            return {
              ...s,
              lastAccessAt: response.logEvent.timestamp,
              lastAccessDirection: request.direction,
              lastAccessTerminal: targetTerminal.name,
            };
          }
          return s;
        });
      }

      let updatedDiscipline = prev.disciplineRecords;
      let updatedNotifications = prev.notifications;

      // Automatic curfew violation discipline record & notification
      if (response.curfewFlagged && response.student) {
        const newRecord: DisciplineRecord = {
          id: `disc-curfew-${Date.now()}`,
          studentId: response.student.id,
          studentName: response.student.fullName,
          roomNumber: response.student.roomNumber || '—',
          violationReason: `Komendantlik soatidan keyin kechki kirish qayd etildi (${request.simulatedTime || 'Kechki vaqt'})`,
          penaltyPoints: 10,
          recordedBy: 'Hikvision Access Engine',
          date: new Date().toISOString().slice(0, 10),
        };
        updatedDiscipline = [newRecord, ...prev.disciplineRecords];

        const notif: NotificationItem = {
          id: `notif-curfew-${Date.now()}`,
          title: `Kechki kirish qoidabuzarligi: ${response.student.fullName}`,
          message: `Talaba komendantlik soatida (${accessPolicy.curfewStart}-${accessPolicy.curfewEnd}) ${targetTerminal.name} orqali kirdi. 10 jarima balli qayd etildi.`,
          type: 'discipline',
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          isRead: false,
          recipientRole: 'security',
        };
        updatedNotifications = [notif, ...prev.notifications];
      }

      return {
        ...prev,
        accessLogs: updatedLogs,
        students: updatedStudents,
        disciplineRecords: updatedDiscipline,
        notifications: updatedNotifications,
      };
    });

    addAudit(
      `Turniket kirish qarori (${response.decision.toUpperCase()})`,
      'AccessControl',
      targetTerminal.id,
      undefined,
      `${response.student ? response.student.fullName : 'Noma‘lum'}: ${response.reasonCode}`
    );

    return response;
  };

  const updateTerminalConfig = (updatedTerminal: AccessTerminal) => {
    setState((prev: typeof state) => ({
      ...prev,
      accessTerminals: prev.accessTerminals.map((t: AccessTerminal) => (t.id === updatedTerminal.id ? updatedTerminal : t)),
    }));
    addAudit('Terminal sozlamalari yangilandi', 'AccessControl', updatedTerminal.id, undefined, updatedTerminal.name);
  };

  const addTerminal = (terminalData: Omit<AccessTerminal, 'id'>): AccessTerminal => {
    const newTerminal: AccessTerminal = {
      ...terminalData,
      id: `term-${Date.now()}`,
    };
    setState((prev: typeof state) => ({
      ...prev,
      accessTerminals: [...prev.accessTerminals, newTerminal],
    }));
    addAudit('Yangi terminal qo‘shildi', 'AccessControl', newTerminal.id, undefined, newTerminal.name);
    return newTerminal;
  };

  const deleteTerminal = (terminalId: string) => {
    setState((prev: typeof state) => ({
      ...prev,
      accessTerminals: prev.accessTerminals.filter((t: AccessTerminal) => t.id !== terminalId),
    }));
    addAudit('Terminal o‘chirildi', 'AccessControl', terminalId);
  };

  const testTerminalConnection = async (terminal: AccessTerminal): Promise<ConnectionTestResult> => {
    const result = await accessClientService.testConnection(terminal);
    setState((prev: typeof state) => ({
      ...prev,
      accessTerminals: prev.accessTerminals.map((t: AccessTerminal) => {
        if (t.id === terminal.id) {
          return {
            ...t,
            lastPingAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            lastPingSuccess: result.connected,
            status: result.status,
            lastErrorMessage: result.errorMessage,
          };
        }
        return t;
      }),
    }));
    return result;
  };

  const assignStudentCard = (studentId: string, rfidCardNumber: string) => {
    setState((prev: typeof state) => ({
      ...prev,
      students: prev.students.map((s: Student) => (s.id === studentId ? { ...s, rfidCardNumber: rfidCardNumber.trim().toUpperCase() } : s)),
    }));
    addAudit('Talabaga RFID karta biriktirildi', 'Student', studentId, undefined, rfidCardNumber);
  };

  const toggleStudentFaceEnrolled = (studentId: string, enrolled: boolean, photoUrl?: string) => {
    setState((prev: typeof state) => ({
      ...prev,
      students: prev.students.map((s: Student) =>
        s.id === studentId
          ? {
              ...s,
              faceEnrolled: enrolled,
              facePhotoUrl: photoUrl || (enrolled ? s.passportFrontUrl : undefined),
            }
          : s
      ),
    }));
    addAudit('Talaba biometrik yuz profili yangilandi', 'Student', studentId, undefined, enrolled ? 'Enrolled' : 'Removed');
  };

  const setStudentAccessStatus = (studentId: string, status: 'active' | 'suspended' | 'blocked') => {
    setState((prev: typeof state) => ({
      ...prev,
      students: prev.students.map((s: Student) => (s.id === studentId ? { ...s, accessStatus: status } : s)),
    }));
    addAudit('Talaba kirish ruxsati o‘zgartirildi', 'Student', studentId, undefined, status);
  };

  const updateAccessPolicy = (policyUpdates: Partial<AccessControlPolicy>) => {
    setState((prev: typeof state) => ({
      ...prev,
      accessPolicy: {
        ...prev.accessPolicy,
        ...policyUpdates,
      },
    }));
    addAudit('Kirish nazorati siyosati yangilandi', 'AccessControl', 'policy');
  };

  const clearAccessLogs = () => {
    setState((prev: typeof state) => ({
      ...prev,
      accessLogs: [],
    }));
    addAudit('Kirish jurnali tozalandi', 'AccessControl', 'logs');
  };

  const triggerTurnstileRelay = async (terminalId: string, seconds: number = 5): Promise<{ success: boolean; message: string }> => {
    const term = accessTerminals.find((t: AccessTerminal) => t.id === terminalId) || accessTerminals[0];
    return accessClientService.triggerRelay(term, seconds);
  };

  const findUserAccountByIdentifier = useCallback(
    (identifier: string): StoredUserAccount | undefined => {
      const trimmed = identifier.trim().toLowerCase();
      if (!trimmed) return undefined;
      const phoneKey = normalizePhoneKey(identifier);
      const list: StoredUserAccount[] = Array.isArray(userAccounts) ? userAccounts : [];

      // Also resolve via Application ID (e.g. RC-2026-XXXX) or Student Passport/App ID
      const matchedApp = (applications || []).find(
        (a: Application) =>
          a.id.trim().toLowerCase() === trimmed ||
          a.passportNumber.trim().toLowerCase() === trimmed
      );
      const matchedStd = (students || []).find(
        (s: Student) =>
          s.status !== 'deleted_pending_purge' &&
          (s.passportNumber.trim().toLowerCase() === trimmed ||
            (s.applicationId && s.applicationId.trim().toLowerCase() === trimmed))
      );

      const resolvedPhoneKey =
        phoneKey.length >= 7
          ? phoneKey
          : matchedApp
          ? normalizePhoneKey(matchedApp.phone)
          : matchedStd
          ? normalizePhoneKey(matchedStd.phone)
          : '';

      return list.find((acc) => {
        const accId = acc.identifier.trim().toLowerCase();
        const accLogin = acc.login?.trim().toLowerCase();
        const accAppId = acc.applicationId?.trim().toLowerCase();
        const accPhoneKey = normalizePhoneKey(acc.phone);

        if (accId === trimmed || (accLogin && accLogin === trimmed) || (accAppId && accAppId === trimmed)) {
          return true;
        }
        if (matchedApp && (acc.applicationId === matchedApp.id || (matchedApp.studentId && acc.studentId === matchedApp.studentId))) {
          return true;
        }
        if (matchedStd && acc.studentId === matchedStd.id) {
          return true;
        }
        if (resolvedPhoneKey.length >= 7 && (accPhoneKey === resolvedPhoneKey || accId === resolvedPhoneKey)) {
          return true;
        }
        return false;
      });
    },
    [userAccounts, applications, students]
  );

  const registerStudentAccount = (params: {
    fullName?: string;
    phone: string;
    login?: string;
    passwordHash: string;
    passwordSalt: string;
  }): Student => {
    const formattedPhone = formatUzPhoneDisplay(params.phone);
    const phoneKey = normalizePhoneKey(params.phone);
    const cleanedLogin = params.login?.trim() || undefined;
    const nowIso = new Date().toISOString();

    const matchedApp: Application | undefined = applications.find(
      (a: Application) => phoneKey.length >= 7 && normalizePhoneKey(a.phone) === phoneKey
    );

    const existingStudent = students.find(
      (s: Student) =>
        s.status !== 'deleted_pending_purge' &&
        ((matchedApp?.studentId && s.id === matchedApp.studentId) ||
          (phoneKey.length >= 7 && normalizePhoneKey(s.phone) === phoneKey))
    );

    const fallbackPrefType: RoomType = matchedApp?.preferredRoomType || 'standard';
    const fallbackTariff =
      matchedApp?.monthlyTariff ??
      settings.roomTariffs?.[fallbackPrefType] ??
      INITIAL_SETTINGS.roomTariffs[fallbackPrefType];

    const targetStudent: Student = existingStudent
      ? {
          ...existingStudent,
          fullName: params.fullName?.trim() ? params.fullName.trim() : existingStudent.fullName,
          phone: formattedPhone,
          applicationId: existingStudent.applicationId || matchedApp?.id,
        }
      : {
          id: `std-${Date.now()}`,
          applicationId: matchedApp?.id,
          fullName: params.fullName?.trim() || matchedApp?.fullName || formattedPhone,
          phone: formattedPhone,
          birthDate: matchedApp?.birthDate || '',
          passportNumber: matchedApp?.passportNumber || '',
          passportFrontUrl: matchedApp?.passportFrontUrl,
          passportBackUrl: matchedApp?.passportBackUrl,
          university: matchedApp?.university || '',
          faculty: matchedApp?.faculty || '',
          degreeLevel: matchedApp?.degreeLevel,
          course: matchedApp?.course || 1,
          group: matchedApp?.group || '',
          parentPhone: matchedApp?.parentPhone || '',
          permanentAddress: matchedApp?.permanentAddress || '',
          status: matchedApp?.status === 'approved' ? 'active' : matchedApp ? 'applicant' : 'active',
          roomType: matchedApp?.preferredRoomType,
          monthlyTariff: fallbackTariff,
          paidUntil: '',
          nextPaymentDueDate: '',
          debtAmount: 0,
          createdAt: nowIso.slice(0, 10),
        };

    setState((prev: typeof state) => {
      let nextBillingLedgers: Record<string, StudentBillingLedger> = {
        ...(prev.billingLedgers || {}),
      };
      let nextPayments = prev.payments;

      if (matchedApp) {
        if (nextBillingLedgers[matchedApp.id] && !nextBillingLedgers[targetStudent.id]) {
          nextBillingLedgers = {
            ...nextBillingLedgers,
            [targetStudent.id]: {
              ...nextBillingLedgers[matchedApp.id],
              studentId: targetStudent.id,
            },
          };
          delete nextBillingLedgers[matchedApp.id];
        }
        nextPayments = prev.payments.map((p: Payment) =>
          p.studentId === matchedApp.id ? { ...p, studentId: targetStudent.id } : p
        );
      }

      const summary = computeStudentBillingSummary({
        entityId: targetStudent.id,
        student: targetStudent,
        application: matchedApp,
        contract: prev.contracts.find((c: Contract) => c.studentId === targetStudent.id && c.status === 'active'),
        rooms: prev.rooms,
        settings: prev.settings,
        payments: nextPayments,
        ledger: nextBillingLedgers[targetStudent.id],
      });
      const computedPaidUntil = summary.paidUntilDate || '';
      const expiryInfo = computePaymentExpiryInfo(computedPaidUntil);
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
      const syncedTargetStudent: Student = {
        ...targetStudent,
        monthlyTariff: summary.monthlyRate,
        debtAmount: summary.remainingBalance,
        paymentStatus: computedPaymentStatus,
        paidUntil: computedPaidUntil,
        nextPaymentDueDate: computedPaidUntil,
        nextPaymentDate: computedPaidUntil,
      };

      const nextStudents = existingStudent
        ? prev.students.map((s: Student) => (s.id === existingStudent.id ? syncedTargetStudent : s))
        : [syncedTargetStudent, ...prev.students];

      const nextApplications = matchedApp
        ? prev.applications.map((a: Application) =>
            a.id === matchedApp.id ? { ...a, studentId: a.studentId || targetStudent.id } : a
          )
        : prev.applications;

      const existingAccounts: StoredUserAccount[] = Array.isArray(prev.userAccounts)
        ? prev.userAccounts
        : [];
      const matchedAccountIndex = existingAccounts.findIndex(
        (acc) =>
          acc.studentId === targetStudent.id ||
          (matchedApp && acc.applicationId === matchedApp.id) ||
          (phoneKey.length >= 7 && normalizePhoneKey(acc.phone) === phoneKey) ||
          acc.identifier.toLowerCase() === phoneKey
      );

      const newAccount: StoredUserAccount = {
        id:
          matchedAccountIndex >= 0
            ? existingAccounts[matchedAccountIndex].id
            : `acct-${Date.now()}`,
        identifier: phoneKey || formattedPhone.toLowerCase(),
        login: cleanedLogin || (matchedAccountIndex >= 0 ? existingAccounts[matchedAccountIndex].login : undefined),
        phone: formattedPhone,
        role: 'student',
        studentId: targetStudent.id,
        applicationId: targetStudent.applicationId || matchedApp?.id,
        passwordHash: params.passwordHash,
        passwordSalt: params.passwordSalt,
        updatedAt: nowIso,
      };

      const nextAccounts =
        matchedAccountIndex >= 0
          ? existingAccounts.map((acc, idx) => (idx === matchedAccountIndex ? newAccount : acc))
          : [newAccount, ...existingAccounts];

      return {
        ...prev,
        students: nextStudents,
        applications: nextApplications,
        userAccounts: nextAccounts,
        billingLedgers: nextBillingLedgers,
        payments: nextPayments,
      };
    });

    void syncUpsertResident(targetStudent);
    setActiveStudentId(targetStudent.id);
    setRole('student');
    addAudit('Talaba ro‘yxatdan o‘tdi', 'Auth', targetStudent.id, undefined, formattedPhone);
    return targetStudent;
  };

  const resetUserPassword = (params: {
    identifier: string;
    passwordHash: string;
    passwordSalt: string;
    targetRole?: Role;
  }): { success: boolean; role: Role; studentId?: string } => {
    const trimmed = params.identifier.trim();
    const lowered = trimmed.toLowerCase();
    const phoneKey = normalizePhoneKey(trimmed);
    const formattedPhone = phoneKey.length >= 9 ? formatUzPhoneDisplay(trimmed) : trimmed;
    const nowIso = new Date().toISOString();

    const existingAccount = findUserAccountByIdentifier(trimmed);
    const matchedApp: Application | undefined = applications.find(
      (a: Application) =>
        a.id.trim().toLowerCase() === lowered ||
        a.passportNumber.trim().toLowerCase() === lowered ||
        (phoneKey.length >= 7 && normalizePhoneKey(a.phone) === phoneKey)
    );
    const matchedStudent = students.find(
      (s: Student) =>
        s.status !== 'deleted_pending_purge' &&
        ((existingAccount?.studentId && s.id === existingAccount.studentId) ||
          (matchedApp?.studentId && s.id === matchedApp.studentId) ||
          (phoneKey.length >= 7 && normalizePhoneKey(s.phone) === phoneKey) ||
          s.passportNumber.trim().toLowerCase() === lowered ||
          (s.applicationId && s.applicationId.trim().toLowerCase() === lowered))
    );
    const matchedEmployee = employees.find(
      (e: Employee) =>
        (phoneKey.length >= 7 && normalizePhoneKey(e.phone) === phoneKey) ||
        e.email.trim().toLowerCase() === lowered
    );

    const resolvedRole: Role =
      params.targetRole === 'student'
        ? 'student'
        : existingAccount?.role ||
          (matchedEmployee ? matchedEmployee.role : undefined) ||
          (matchedStudent || matchedApp ? 'student' : undefined) ||
          params.targetRole ||
          'student';

    let createdStudentFromApp: Student | undefined;
    if (resolvedRole === 'student' && !matchedStudent && matchedApp) {
      const prefType: RoomType = matchedApp.preferredRoomType || 'standard';
      createdStudentFromApp = {
        id: `std-${Date.now()}`,
        applicationId: matchedApp.id,
        fullName: matchedApp.fullName,
        phone: formatUzPhoneDisplay(matchedApp.phone),
        birthDate: matchedApp.birthDate,
        passportNumber: matchedApp.passportNumber,
        passportFrontUrl: matchedApp.passportFrontUrl,
        passportBackUrl: matchedApp.passportBackUrl,
        university: matchedApp.university,
        faculty: matchedApp.faculty,
        degreeLevel: matchedApp.degreeLevel,
        course: matchedApp.course,
        group: matchedApp.group,
        parentPhone: matchedApp.parentPhone,
        permanentAddress: matchedApp.permanentAddress,
        status: matchedApp.status === 'approved' ? 'active' : 'applicant',
        roomType: matchedApp.preferredRoomType,
        monthlyTariff:
          matchedApp.monthlyTariff ??
          settings.roomTariffs?.[prefType] ??
          INITIAL_SETTINGS.roomTariffs[prefType],
        paidUntil: '',
        nextPaymentDueDate: '',
        debtAmount: 0,
        createdAt: nowIso.slice(0, 10),
      };
    }

    const resolvedStudentId =
      existingAccount?.studentId || matchedStudent?.id || createdStudentFromApp?.id;

    const resolvedPhoneDisplay =
      existingAccount?.phone ||
      matchedStudent?.phone ||
      (matchedApp ? formatUzPhoneDisplay(matchedApp.phone) : formattedPhone);
    const resolvedPhoneKey = normalizePhoneKey(resolvedPhoneDisplay);

    setState((prev: typeof state) => {
      const existingAccounts: StoredUserAccount[] = Array.isArray(prev.userAccounts)
        ? prev.userAccounts
        : [];

      const nextStudents = createdStudentFromApp
        ? [createdStudentFromApp, ...prev.students]
        : prev.students;

      const nextApplications =
        createdStudentFromApp && matchedApp
          ? prev.applications.map((a: Application) =>
              a.id === matchedApp.id ? { ...a, studentId: createdStudentFromApp!.id } : a
            )
          : prev.applications;

      const accountId = existingAccount?.id || `acct-${Date.now()}`;
      const updatedAccount: StoredUserAccount = {
        id: accountId,
        identifier:
          existingAccount?.identifier ||
          (resolvedPhoneKey.length >= 7 ? resolvedPhoneKey : lowered),
        login: existingAccount?.login,
        phone: resolvedPhoneDisplay,
        role: resolvedRole,
        studentId: resolvedStudentId,
        applicationId: existingAccount?.applicationId || matchedApp?.id || matchedStudent?.applicationId,
        passwordHash: params.passwordHash,
        passwordSalt: params.passwordSalt,
        updatedAt: nowIso,
      };

      const nextAccounts = existingAccount
        ? existingAccounts.map((acc) => (acc.id === existingAccount.id ? updatedAccount : acc))
        : [updatedAccount, ...existingAccounts];

      return {
        ...prev,
        students: nextStudents,
        applications: nextApplications,
        userAccounts: nextAccounts,
      };
    });

    if (resolvedRole === 'student' && resolvedStudentId) {
      setActiveStudentId(resolvedStudentId);
    }
    if (resolvedRole === 'student') {
      setRole('student');
    }

    addAudit('Parol tiklandi', 'Auth', trimmed, undefined, resolvedRole);
    return { success: true, role: resolvedRole, studentId: resolvedStudentId };
  };

  const ensureStudentForIdentifier = (identifier: string): string | undefined => {
    const trimmed = identifier.trim();
    if (!trimmed) return undefined;
    const lowered = trimmed.toLowerCase();
    const phoneKey = normalizePhoneKey(trimmed);

    const matchedStd = students.find(
      (s: Student) =>
        s.status !== 'deleted_pending_purge' &&
        ((phoneKey.length >= 7 && normalizePhoneKey(s.phone) === phoneKey) ||
          s.passportNumber.trim().toLowerCase() === lowered ||
          (s.applicationId && s.applicationId.trim().toLowerCase() === lowered))
    );
    if (matchedStd) {
      setActiveStudentId(matchedStd.id);
      return matchedStd.id;
    }

    const matchedApp = applications.find(
      (a: Application) =>
        a.id.trim().toLowerCase() === lowered ||
        a.passportNumber.trim().toLowerCase() === lowered ||
        (phoneKey.length >= 7 && normalizePhoneKey(a.phone) === phoneKey)
    );
    if (!matchedApp) return undefined;

    if (matchedApp.studentId) {
      setActiveStudentId(matchedApp.studentId);
      return matchedApp.studentId;
    }

    const prefType: RoomType = matchedApp.preferredRoomType || 'standard';
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      applicationId: matchedApp.id,
      fullName: matchedApp.fullName,
      phone: formatUzPhoneDisplay(matchedApp.phone),
      birthDate: matchedApp.birthDate,
      passportNumber: matchedApp.passportNumber,
      passportFrontUrl: matchedApp.passportFrontUrl,
      passportBackUrl: matchedApp.passportBackUrl,
      university: matchedApp.university,
      faculty: matchedApp.faculty,
      degreeLevel: matchedApp.degreeLevel,
      course: matchedApp.course,
      group: matchedApp.group,
      parentPhone: matchedApp.parentPhone,
      permanentAddress: matchedApp.permanentAddress,
      status: matchedApp.status === 'approved' ? 'active' : 'applicant',
      roomType: matchedApp.preferredRoomType,
      monthlyTariff:
        matchedApp.monthlyTariff ??
        settings.roomTariffs?.[prefType] ??
        INITIAL_SETTINGS.roomTariffs[prefType],
      paidUntil: '',
      nextPaymentDueDate: '',
      debtAmount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setState((prev: typeof state) => {
      let nextBillingLedgers: Record<string, StudentBillingLedger> = {
        ...(prev.billingLedgers || {}),
      };
      if (nextBillingLedgers[matchedApp.id] && !nextBillingLedgers[newStudent.id]) {
        nextBillingLedgers = {
          ...nextBillingLedgers,
          [newStudent.id]: {
            ...nextBillingLedgers[matchedApp.id],
            studentId: newStudent.id,
          },
        };
        delete nextBillingLedgers[matchedApp.id];
      }
      const nextPayments = prev.payments.map((p: Payment) =>
        p.studentId === matchedApp.id ? { ...p, studentId: newStudent.id } : p
      );

      const summary = computeStudentBillingSummary({
        entityId: newStudent.id,
        student: newStudent,
        application: matchedApp,
        rooms: prev.rooms,
        settings: prev.settings,
        payments: nextPayments,
        ledger: nextBillingLedgers[newStudent.id],
      });
      const computedPaidUntil = summary.paidUntilDate || '';
      const expiryInfo = computePaymentExpiryInfo(computedPaidUntil);
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
      const syncedStudent: Student = {
        ...newStudent,
        monthlyTariff: summary.monthlyRate,
        debtAmount: summary.remainingBalance,
        paymentStatus: computedPaymentStatus,
        paidUntil: computedPaidUntil,
        nextPaymentDueDate: computedPaidUntil,
        nextPaymentDate: computedPaidUntil,
      };

      return {
        ...prev,
        students: [syncedStudent, ...prev.students],
        applications: prev.applications.map((a: Application) =>
          a.id === matchedApp.id ? { ...a, studentId: newStudent.id } : a
        ),
        billingLedgers: nextBillingLedgers,
        payments: nextPayments,
      };
    });
    void syncUpsertResident(newStudent);
    setActiveStudentId(newStudent.id);
    return newStudent.id;
  };

  const contextValue = useMemo(
    () => ({
      role,
      setRole,
      currentUserName,
      activeStudentId,
      setActiveStudentId,
      activeStaffUser,
      setActiveStaffUser,
      rooms,
      commonAreas,
      students,
      applications,
      payments,
      contracts,
      employees,
      staffUsers,
      issues,
      disciplineRecords,
      notifications,
      auditLogs,
      settings,
      stats,
      roomFilter,
      setRoomFilter,
      isLoadingData,
      refreshFromSupabase,
      addStudent,
      createResidentWithPlacement,
      updateStudent,
      deleteStudent,
      submitApplication,
      reviewApplication,
      deleteApplication,
      assignBed,
      transferBed,
      releaseBed,
      resetAllBedsToAvailable,
      canConfigureRooms,
      addRoom,
      updateRoom,
      deleteRoom,
      updateBed,
      addCommonArea,
      updateCommonArea,
      deleteCommonArea,
      recordPayment,
      handleAcceptPayment,
      billingLedgers,
      updateStudentBillingLedger,
      upsertBillingEntry,
      createIssue,
      updateIssueStatus,
      addDisciplineRecord,
      addEmployee,
      toggleEmployeeStatus,
      refreshStaffUsers,
      addStaffUser,
      updateStaffUser,
      toggleStaffUserActive,
      deleteStaffUser,
      updateSettings,
      resetToDefaults,
      markNotificationAsRead,
      accessTerminals,
      accessLogs,
      accessPolicy,
      simulateAccessScan,
      updateTerminalConfig,
      addTerminal,
      deleteTerminal,
      testTerminalConnection,
      assignStudentCard,
      toggleStudentFaceEnrolled,
      setStudentAccessStatus,
      updateAccessPolicy,
      clearAccessLogs,
      triggerTurnstileRelay,
      userAccounts,
      findUserAccountByIdentifier,
      registerStudentAccount,
      resetUserPassword,
      ensureStudentForIdentifier,
    }),
    [
      role,
      currentUserName,
      activeStudentId,
      activeStaffUser,
      rooms,
      commonAreas,
      students,
      applications,
      payments,
      contracts,
      employees,
      staffUsers,
      issues,
      disciplineRecords,
      notifications,
      auditLogs,
      settings,
      stats,
      roomFilter,
      isLoadingData,
      refreshFromSupabase,
      refreshStaffUsers,
      canConfigureRooms,
      billingLedgers,
      accessTerminals,
      accessLogs,
      accessPolicy,
      userAccounts,
      findUserAccountByIdentifier,
    ]
  );

  return (
    <DormContext.Provider value={contextValue}>
      {children}
    </DormContext.Provider>
  );
};

export const useDorm = () => {
  const ctx = useContext(DormContext);
  if (!ctx) {
    throw new Error('useDorm must be used within a DormProvider');
  }
  return ctx;
};
