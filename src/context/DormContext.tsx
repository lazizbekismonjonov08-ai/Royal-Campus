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
} from '../types';
import { formatUzPhoneDisplay, normalizePhoneKey } from '../utils/authCrypto';
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

interface DormContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentUserName: string;
  activeStudentId: string;
  setActiveStudentId: (id: string) => void;
  
  // Data
  rooms: Room[];
  commonAreas: CommonArea[];
  students: Student[];
  applications: Application[];
  payments: Payment[];
  contracts: Contract[];
  employees: Employee[];
  issues: Issue[];
  disciplineRecords: DisciplineRecord[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  settings: DormSettings;
  roomFilter: string;
  setRoomFilter: (filter: string) => void;

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
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  
  submitApplication: (appData: Omit<Application, 'id' | 'submittedAt' | 'status'>) => Application;
  reviewApplication: (id: string, status: ApplicationStatus, notes?: string) => void;

  assignBed: (studentId: string, roomId: string, bedId: string) => void;
  transferBed: (studentId: string, newRoomId: string, newBedId: string) => void;
  releaseBed: (bedId: string) => void;

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
    periodMonth: string;
    paymentMethod: 'cash' | 'card' | 'bank_transfer';
    notes?: string;
  }) => Payment;
  handleAcceptPayment: (studentId: string, amount: number) => Payment;

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
    passwordHash: string;
    passwordSalt: string;
  }) => Student;
  resetUserPassword: (params: {
    identifier: string;
    passwordHash: string;
    passwordSalt: string;
    targetRole?: Role;
  }) => { success: boolean; role: Role; studentId?: string };
}

const STORAGE_KEY = 'SMART_DORM_V1_STATE';

const DormContext = createContext<DormContextType | undefined>(undefined);

export const DormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('owner');
  const [activeStudentId, setActiveStudentId] = useState<string>('std-1001');
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
        // Ensure some unassigned students exist so the assign workflow can be tested immediately
        if (Array.isArray(parsed.students)) {
          const hasUnassigned = parsed.students.some((s: Student) => !s.roomId);
          if (!hasUnassigned) {
            const seedFresh = generateSeedData();
            const unassigned = seedFresh.students.filter((s: Student) => !s.roomId);
            parsed.students = [...unassigned, ...parsed.students];
          }
        }
        // Ensure payments contains October payments for accurate revenue metrics
        if (Array.isArray(parsed.payments)) {
          const hasOct = parsed.payments.some((p: Payment) => p.periodMonth === '2026-10');
          if (!hasOct) {
            const seedFresh = generateSeedData();
            parsed.payments = seedFresh.payments;
          }
        }
        // Ensure some upcoming contract renewals exist for automated alert tasks
        if (Array.isArray(parsed.contracts)) {
          const hasUpcoming = parsed.contracts.some((c: Contract) => c.status === 'active' && (c.endDate.startsWith('2026-10') || c.endDate.startsWith('2026-11')));
          if (!hasUpcoming && parsed.contracts.length > 3) {
            parsed.contracts[1].endDate = '2026-11-04';
            parsed.contracts[2].endDate = '2026-11-09';
            parsed.contracts[3].endDate = '2026-11-15';
          }
        }
        // Ensure pending maintenance issues exist
        if (Array.isArray(parsed.issues)) {
          const hasPendingIssues = parsed.issues.some((i: Issue) => i.status === 'open' || i.status === 'in_progress');
          if (!hasPendingIssues) {
            const seedFresh = generateSeedData();
            parsed.issues = seedFresh.issues;
          }
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
            hasLegacyLuxPlus ||
            rt.panoramicSurcharge !== undefined;

          if (needsTierMigration) {
            const legacySurcharge = typeof rt.panoramicSurcharge === 'number' ? rt.panoramicSurcharge : 200000;
            parsed.settings = {
              ...parsed.settings,
              roomTariffs: isLegacyDefaults
                ? { ...INITIAL_SETTINGS.roomTariffs }
                : {
                    standard: rt.standard ?? INITIAL_SETTINGS.roomTariffs.standard,
                    standard_plus:
                      rt.standard_plus ??
                      (typeof rt.standard === 'number'
                        ? rt.standard + legacySurcharge
                        : INITIAL_SETTINGS.roomTariffs.standard_plus),
                    comfort: rt.comfort ?? INITIAL_SETTINGS.roomTariffs.comfort,
                    comfort_plus:
                      rt.comfort_plus ??
                      (typeof rt.comfort === 'number'
                        ? rt.comfort + legacySurcharge
                        : INITIAL_SETTINGS.roomTariffs.comfort_plus),
                    lux: rt.lux ?? INITIAL_SETTINGS.roomTariffs.lux,
                  },
            };

            const upgradeRoomType = (rawType: string | undefined, wasPanoramic?: boolean): RoomType => {
              const base = (rawType || 'comfort') as string;
              if (base === 'lux_plus') {
                return 'lux';
              }
              if (base === 'standard_plus' || base === 'comfort_plus') {
                return base;
              }
              if (wasPanoramic && (base === 'standard' || base === 'comfort')) {
                return `${base}_plus` as RoomType;
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

              parsed.rooms = parsed.rooms.map((r: Room & { isPanoramic?: boolean }) => {
                const matchedSeed = seedRoomMap?.get(r.id);
                const nextType = matchedSeed
                  ? matchedSeed.type
                  : upgradeRoomType(r.type, Boolean(r.isPanoramic));
                const { isPanoramic: _omitPano, ...cleanRoom } = r;
                return {
                  ...cleanRoom,
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
              parsed.students = parsed.students.map((s: Student & { isPanoramic?: boolean }) => {
                const { isPanoramic: _omitPano, ...cleanStudent } = s;
                if (cleanStudent.roomId && updatedRoomMap.has(cleanStudent.roomId)) {
                  const rm = updatedRoomMap.get(cleanStudent.roomId)!;
                  return {
                    ...cleanStudent,
                    roomType: rm.type,
                    monthlyTariff: rm.priceMonthly,
                  };
                }
                const wasLuxPlus = (cleanStudent.roomType as string | undefined) === 'lux_plus';
                const nextType = upgradeRoomType(cleanStudent.roomType, Boolean(s.isPanoramic));
                return {
                  ...cleanStudent,
                  roomType: cleanStudent.roomType ? nextType : undefined,
                  monthlyTariff:
                    s.isPanoramic || isLegacyDefaults || wasLuxPlus
                      ? (parsed.settings.roomTariffs[nextType] ?? INITIAL_SETTINGS.roomTariffs[nextType])
                      : cleanStudent.monthlyTariff,
                };
              });
            }

            if (Array.isArray(parsed.applications)) {
              parsed.applications = parsed.applications.map(
                (a: Application & { isPanoramic?: boolean }) => {
                  const { isPanoramic: _omitPano, ...cleanApp } = a;
                  return {
                    ...cleanApp,
                    preferredRoomType: cleanApp.preferredRoomType
                      ? upgradeRoomType(cleanApp.preferredRoomType, Boolean(a.isPanoramic))
                      : undefined,
                  };
                }
              );
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
        // Ensure APP-1001 & APP-1002 exist for landing page status tracker demos
        if (Array.isArray(parsed.applications)) {
          const hasApp1001 = parsed.applications.some((a: Application) => a.id === 'APP-1001');
          const hasApp1002 = parsed.applications.some((a: Application) => a.id === 'APP-1002');
          if (!hasApp1001 || !hasApp1002) {
            const seedFresh = generateSeedData();
            const demoApps = seedFresh.applications.filter(
              (a) => (a.id === 'APP-1001' && !hasApp1001) || (a.id === 'APP-1002' && !hasApp1002)
            );
            parsed.applications = [...demoApps, ...parsed.applications];
          }
        }
        // Ensure userAccounts array exists
        if (!Array.isArray(parsed.userAccounts)) {
          parsed.userAccounts = [];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse localStorage', e);
    }
    return { ...generateSeedData(), userAccounts: [] as StoredUserAccount[] };
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [state]);

  const {
    rooms,
    commonAreas = INITIAL_COMMON_AREAS,
    students,
    applications,
    payments,
    contracts,
    employees,
    issues,
    disciplineRecords,
    notifications,
    auditLogs,
    settings,
    accessTerminals = INITIAL_ACCESS_TERMINALS,
    accessLogs = INITIAL_ACCESS_LOGS,
    accessPolicy = INITIAL_ACCESS_POLICY,
    userAccounts = [] as StoredUserAccount[],
  } = state;

  // Determine current user name
  const currentUserName = useMemo(() => {
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
  }, [role, students, activeStudentId]);

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

    const currentMonthStr = '2026-10';
    const thisMonthPayments = payments.filter((p: Payment) => p.periodMonth === currentMonthStr && p.status === 'completed');
    const thisMonthRevenue = thisMonthPayments.reduce((acc: number, p: Payment) => acc + p.amount, 0);

    const expectedRevenue = activeStudentsList.reduce((acc: number, s: Student) => acc + s.monthlyTariff, 0);
    const totalDebtAmount = activeStudentsList.reduce((acc: number, s: Student) => acc + (s.debtAmount || 0), 0);

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
  }, [rooms, students, payments]);

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
    const newStudent: Student = {
      id: newId,
      fullName: data.fullName || 'Yangi Talaba',
      phone: data.phone || '+998 90 000 00 00',
      birthDate: data.birthDate || '2004-01-01',
      passportNumber: data.passportNumber || 'FA0000000',
      university: data.university || 'TATU',
      faculty: data.faculty || 'Axborot Texnologiyalari',
      course: data.course || 1,
      group: data.group || '101-guruh',
      parentPhone: data.parentPhone || '+998 90 111 22 33',
      permanentAddress: data.permanentAddress || 'Toshkent v.',
      status: 'active',
      roomType: data.roomType,
      monthlyTariff:
        data.monthlyTariff ||
        (settings.roomTariffs?.[data.roomType || 'comfort'] ?? INITIAL_SETTINGS.roomTariffs[data.roomType || 'comfort']),
      paidUntil: '2026-10-31',
      nextPaymentDueDate: '2026-11-01',
      debtAmount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      telegramChatId: `tg_${Date.now()}`,
    };

    setState((prev: typeof state) => ({
      ...prev,
      students: [newStudent, ...prev.students],
    }));

    addAudit('Talaba qo\'shildi', 'Student', newStudent.id, undefined, newStudent.fullName);
    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to update student records.');
      return;
    }

    setState((prev: typeof state) => {
      const updated = prev.students.map((s: Student) => (s.id === id ? { ...s, ...updates } : s));
      return { ...prev, students: updated };
    });
    addAudit('Talaba tahrirlandi', 'Student', id, undefined, JSON.stringify(updates));
  };

  const deleteStudent = (id: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to delete students.');
      return;
    }

    // 3-month retention logic
    const deletedDate = new Date().toISOString().slice(0, 10);
    setState((prev: typeof state) => {
      const updatedStudents = prev.students.map((s: Student) => {
        if (s.id === id) {
          return {
            ...s,
            status: 'deleted_pending_purge' as const,
            deletedAt: deletedDate,
          };
        }
        return s;
      });

      // Also release their bed if occupied
      const std = prev.students.find((s: Student) => s.id === id);
      let updatedRooms = prev.rooms;
      if (std && std.bedId) {
        updatedRooms = prev.rooms.map((r: Room) => ({
          ...r,
          beds: r.beds.map((b) => (b.id === std.bedId ? { ...b, status: 'available' as const, studentId: undefined, studentName: undefined } : b)),
        }));
      }

      return {
        ...prev,
        students: updatedStudents,
        rooms: updatedRooms,
      };
    });
    addAudit('Talaba o\'chirildi (Retention 3 oy)', 'Student', id);
  };

  const submitApplication = (appData: Omit<Application, 'id' | 'submittedAt' | 'status'>): Application => {
    const newApp: Application = {
      ...appData,
      id: `app-${Date.now()}`,
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
          message: `${newApp.fullName} yotoqxonaga a'zo bo'lish uchun ariza topshirdi.`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          isRead: false,
          recipientRole: 'receptionist',
        },
        ...prev.notifications,
      ],
    }));

    addAudit('Online ariza topshirildi', 'Application', newApp.id, undefined, newApp.fullName);
    return newApp;
  };

  const reviewApplication = (id: string, status: ApplicationStatus, notes?: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to review applications.');
      return;
    }

    setState((prev: typeof state) => {
      const targetApp = prev.applications.find((app: Application) => app.id === id);
      const updated = prev.applications.map((app: Application) => {
        if (app.id === id) {
          return {
            ...app,
            status,
            reviewNotes: notes || app.reviewNotes,
            reviewedBy: currentUserName,
          };
        }
        return app;
      });

      let updatedStudents = prev.students;
      if (status === 'approved' && targetApp) {
        const existingStudent = prev.students.find(
          (s: Student) => s.passportNumber === targetApp.passportNumber || s.fullName === targetApp.fullName
        );
        if (!existingStudent) {
          const prefType: RoomType = targetApp.preferredRoomType || 'comfort';
          const resolvedTariff =
            prev.settings.roomTariffs?.[prefType] ?? INITIAL_SETTINGS.roomTariffs[prefType] ?? 1200000;
          const newStudent: Student = {
            id: `std-${Date.now()}`,
            fullName: targetApp.fullName,
            phone: targetApp.phone,
            birthDate: targetApp.birthDate,
            passportNumber: targetApp.passportNumber,
            passportFrontUrl: targetApp.passportFrontUrl,
            passportBackUrl: targetApp.passportBackUrl,
            university: targetApp.university,
            faculty: targetApp.faculty,
            course: targetApp.course,
            group: targetApp.group,
            parentPhone: targetApp.parentPhone,
            permanentAddress: targetApp.permanentAddress,
            status: 'active',
            roomType: prefType,
            monthlyTariff: resolvedTariff,
            paidUntil: '2026-10-31',
            nextPaymentDueDate: '2026-11-01',
            debtAmount: 0,
            createdAt: new Date().toISOString().slice(0, 10),
            telegramChatId: `tg_${Date.now()}`,
          };
          updatedStudents = [newStudent, ...prev.students];
        }
      }

      return { ...prev, applications: updated, students: updatedStudents };
    });

    addAudit(`Ariza ko'rib chiqildi (${status})`, 'Application', id, undefined, notes);
  };

  const assignBed = (studentId: string, roomId: string, bedId: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to assign beds.');
      return;
    }

    setState((prev: typeof state) => {
      const targetStudent: Student | undefined = prev.students.find((s: Student) => s.id === studentId);
      const targetRoom: Room | undefined = prev.rooms.find((r: Room) => r.id === roomId);
      if (!targetStudent || !targetRoom) return prev;

      const targetBed: Bed | undefined = targetRoom.beds.find((b: Bed) => b.id === bedId);
      if (!targetBed) return prev;

      // Prevent two students from occupying the same bed or assigning to maintenance beds
      if (targetBed.status === 'occupied' && targetBed.studentId && targetBed.studentId !== studentId) {
        console.warn('Cannot assign student: this bed is already occupied by another student.');
        return prev;
      }
      if (targetBed.status === 'maintenance' || targetRoom.status === 'maintenance' || targetRoom.status === 'closed') {
        console.warn('Cannot assign student: bed or room is under maintenance.');
        return prev;
      }

      const oldBedId = targetStudent.bedId;

      // Update room/bed
      const updatedRooms = prev.rooms.map((r: Room) => {
        let roomChanged = false;
        const beds = r.beds.map((b: Bed) => {
          // If student had a previous bed elsewhere, release it to available
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
          // Mark target bed as occupied
          if (r.id === roomId && b.id === bedId) {
            roomChanged = true;
            return {
              ...b,
              status: 'occupied' as const,
              studentId: targetStudent.id,
              studentName: targetStudent.fullName,
              assignedAt: new Date().toISOString().slice(0, 10),
            };
          }
          return b;
        });
        return roomChanged ? { ...r, beds } : r;
      });

      // Calculate authoritative monthly tariff directly from roomTariffs[room.type]
      const computedMonthlyTariff =
        prev.settings.roomTariffs?.[targetRoom.type] ??
        targetRoom.priceMonthly ??
        INITIAL_SETTINGS.roomTariffs[targetRoom.type];

      // Update student
      const updatedStudents = prev.students.map((s: Student) => {
        if (s.id === studentId) {
          return {
            ...s,
            status: 'active' as const,
            roomId,
            bedId,
            roomNumber: targetRoom.roomNumber,
            bedNumber: targetBed.bedNumber,
            bedIdentifier: targetBed.bedIdentifier || String(targetBed.bedNumber),
            floor: targetRoom.floor,
            roomType: targetRoom.type,
            monthlyTariff: computedMonthlyTariff,
          };
        }
        return s;
      });

      // Create contract if not exists
      const bedLabel = targetBed.bedIdentifier || String(targetBed.bedNumber);
      const newContract: Contract = {
        id: `cnt-${Date.now()}`,
        contractNumber: `RC-2026/${targetRoom.roomNumber}-${bedLabel}`,
        studentId: targetStudent.id,
        studentName: targetStudent.fullName,
        passportNumber: targetStudent.passportNumber,
        roomNumber: targetRoom.roomNumber,
        bedNumber: targetBed.bedNumber,
        bedIdentifier: bedLabel,
        roomType: targetRoom.type,
        tariffMonthly: computedMonthlyTariff,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '2027-06-30',
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
        pdfGeneratedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      return {
        ...prev,
        rooms: updatedRooms,
        students: updatedStudents,
        contracts: [newContract, ...prev.contracts],
      };
    });

    addAudit('Talaba o\'ringa biriktirildi', 'Bed', bedId, undefined, `Student: ${studentId}`);
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

      // Update student
      const updatedStudents = prev.students.map((s: Student) => {
        if (s.id === studentId) {
          return {
            ...s,
            roomId: newRoomId,
            bedId: newBedId,
            roomNumber: targetRoom.roomNumber,
            bedNumber: targetBed.bedNumber,
            bedIdentifier: targetBed.bedIdentifier || String(targetBed.bedNumber),
            floor: targetRoom.floor,
            roomType: targetRoom.type,
            monthlyTariff: computedMonthlyTariff,
          };
        }
        return s;
      });

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

      return {
        ...prev,
        rooms: updatedRooms,
        students: updatedStudents,
        contracts: updatedContracts,
      };
    });

    addAudit('Talaba ko\'chirildi (Transfer)', 'Student', studentId, std?.roomNumber, `New Room`);
  };

  const releaseBed = (bedId: string) => {
    if (role === 'security') {
      console.warn('Security role is not permitted to release beds.');
      return;
    }

    setState((prev: typeof state) => {
      let releasedStudentId: string | undefined;

      const updatedRooms = prev.rooms.map((r: Room) => {
        const beds = r.beds.map((b) => {
          if (b.id === bedId) {
            releasedStudentId = b.studentId;
            return { ...b, status: 'available' as const, studentId: undefined, studentName: undefined };
          }
          return b;
        });
        return { ...r, beds };
      });

      const updatedStudents = prev.students.map((s: Student) => {
        if (s.bedId === bedId || (releasedStudentId && s.id === releasedStudentId)) {
          return {
            ...s,
            roomId: undefined,
            bedId: undefined,
            roomNumber: undefined,
            bedNumber: undefined,
            bedIdentifier: undefined,
          };
        }
        return s;
      });

      return {
        ...prev,
        rooms: updatedRooms,
        students: updatedStudents,
      };
    });

    addAudit('O\'rin bo\'shatildi', 'Bed', bedId);
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
    periodMonth: string;
    paymentMethod: 'cash' | 'card' | 'bank_transfer';
    notes?: string;
  }): Payment => {
    if (role === 'security') {
      console.warn('Security role is not permitted to record payments.');
      return {} as Payment;
    }

    const std = students.find((s: Student) => s.id === paymentData.studentId);
    const paymentDateStr = paymentData.paymentDate || new Date().toISOString().split('T')[0];
    const newPayment: Payment = {
      id: `PAY-${Date.now()}`,
      studentId: paymentData.studentId,
      studentName: std ? std.fullName : 'Noma\'lum',
      roomNumber: std?.roomNumber || '---',
      amount: paymentData.amount,
      paymentDate: paymentDateStr,
      date: paymentDateStr,
      type: 'income',
      periodMonth: paymentData.periodMonth || paymentDateStr.slice(0, 7),
      paymentMethod: paymentData.paymentMethod,
      recordedBy: currentUserName,
      status: 'completed',
      notes: paymentData.notes,
    };

    // Calculate extended paid-until date and next payment date (+1 month)
    const baseDate = std?.nextPaymentDueDate || std?.nextPaymentDate || std?.paidUntil
      ? new Date(std.nextPaymentDueDate || std.nextPaymentDate || std.paidUntil)
      : new Date();
    const effectiveDate = !isNaN(baseDate.getTime()) && baseDate > new Date() ? baseDate : new Date();
    const nextDate = new Date(effectiveDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    setState((prev: typeof state) => {
      const updatedStudents = prev.students.map((s: Student) => {
        if (s.id === paymentData.studentId) {
          const newDebt = Math.max(0, s.debtAmount - paymentData.amount);
          return {
            ...s,
            lastPaymentDate: paymentDateStr,
            nextPaymentDate: nextDateStr, // ✅ Yangi sana
            nextPaymentDueDate: nextDateStr,
            paidUntil: nextDateStr,
            paymentStatus: 'paid' as const, // ✅ Status yangilandi
            debtAmount: newDebt,
          };
        }
        return s;
      });

      return {
        ...prev,
        payments: [newPayment, ...prev.payments],
        students: updatedStudents,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: 'payment',
            title: 'To\'lov muvaffaqiyatli qabul qilindi',
            message: `${std?.fullName || 'Talaba'} tomonidan ${paymentData.amount.toLocaleString()} UZS to'landi.`,
            date: new Date().toISOString().replace('T', ' ').slice(0, 16),
            isRead: false,
            recipientRole: 'all',
          },
          ...prev.notifications,
        ],
      };
    });

    addAudit('To\'lov kiritildi', 'Payment', newPayment.id, undefined, `${paymentData.amount} UZS`);
    return newPayment;
  };

  // Dedicated handleAcceptPayment handler
  const handleAcceptPayment = (studentId: string, amount: number): Payment => {
    const std = students.find((s: Student) => s.id === studentId);
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Yangi to'lov tranzaksiyasini qo'shish
    const newPayment: Payment = {
      id: `PAY-${Date.now()}`,
      studentId,
      studentName: std ? std.fullName : 'Noma\'lum',
      roomNumber: std?.roomNumber || '---',
      amount,
      date: todayStr,
      paymentDate: todayStr,
      periodMonth: todayStr.slice(0, 7),
      paymentMethod: 'cash',
      recordedBy: currentUserName,
      type: 'income',
      status: 'completed',
    };

    // 2. Talabaning keyingi to'lov sanasini (masalan, 1 oyga) surish
    const currentDate = new Date();
    // Keyingi to'lov sanasini 1 oy keyinga o'tkazamiz
    currentDate.setMonth(currentDate.getMonth() + 1);
    const nextDateStr = currentDate.toISOString().split('T')[0];

    setState((prev: typeof state) => {
      const updatedStudents = prev.students.map((student: Student) => {
        if (student.id === studentId) {
          const newDebt = Math.max(0, student.debtAmount - amount);
          return {
            ...student,
            lastPaymentDate: todayStr,
            nextPaymentDate: nextDateStr, // ✅ Yangi sana
            nextPaymentDueDate: nextDateStr,
            paidUntil: nextDateStr,
            paymentStatus: 'paid' as const, // ✅ Status yangilandi
            debtAmount: newDebt,
          };
        }
        return student;
      });

      // 3. State/Context'ni yangilash
      return {
        ...prev,
        payments: [newPayment, ...prev.payments],
        students: updatedStudents,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: 'payment',
            title: 'To\'lov qabul qilindi',
            message: `${std?.fullName || 'Talaba'} tomonidan ${amount.toLocaleString()} UZS to'landi. Keyingi to'lov sanasi uzaytirildi.`,
            date: new Date().toISOString().replace('T', ' ').slice(0, 16),
            isRead: false,
            recipientRole: 'all',
          },
          ...prev.notifications,
        ],
      };
    });

    addAudit('To\'lov qabul qilindi', 'Payment', newPayment.id, undefined, `${amount} UZS`);
    return newPayment;
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
      const updatedStudents = prev.students.map((s: Student) => {
        if (s.roomId && updatedRoomMap.has(s.roomId)) {
          const rm = updatedRoomMap.get(s.roomId)!;
          return {
            ...s,
            roomType: rm.type,
            monthlyTariff: rm.priceMonthly,
          };
        }
        return s;
      });
      return {
        ...prev,
        settings: newSettings,
        rooms: updatedRooms,
        students: updatedStudents,
      };
    });
    addAudit('Tizim sozlamalari yangilandi', 'Settings', 'global');
  };

  const resetToDefaults = () => {
    const fresh = generateSeedData();
    setState(fresh);
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
      return list.find((acc) => {
        const accId = acc.identifier.trim().toLowerCase();
        const accPhoneKey = normalizePhoneKey(acc.phone);
        if (accId === trimmed) return true;
        if (phoneKey.length >= 7 && (accPhoneKey === phoneKey || accId === phoneKey)) return true;
        return false;
      });
    },
    [userAccounts]
  );

  const registerStudentAccount = (params: {
    fullName?: string;
    phone: string;
    passwordHash: string;
    passwordSalt: string;
  }): Student => {
    const formattedPhone = formatUzPhoneDisplay(params.phone);
    const phoneKey = normalizePhoneKey(params.phone);
    const nowIso = new Date().toISOString();

    const existingStudent = students.find(
      (s: Student) =>
        s.status !== 'deleted_pending_purge' &&
        normalizePhoneKey(s.phone) === phoneKey
    );

    const targetStudent: Student = existingStudent
      ? {
          ...existingStudent,
          fullName: params.fullName?.trim() ? params.fullName.trim() : existingStudent.fullName,
          phone: formattedPhone,
        }
      : {
          id: `std-${Date.now()}`,
          fullName: params.fullName?.trim() || formattedPhone,
          phone: formattedPhone,
          birthDate: '',
          passportNumber: '',
          university: '',
          faculty: '',
          course: 1,
          group: '',
          parentPhone: '',
          permanentAddress: '',
          status: 'active',
          monthlyTariff: settings.roomTariffs?.standard ?? INITIAL_SETTINGS.roomTariffs.standard,
          paidUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          nextPaymentDueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          debtAmount: 0,
          createdAt: nowIso.slice(0, 10),
        };

    setState((prev: typeof state) => {
      const nextStudents = existingStudent
        ? prev.students.map((s: Student) => (s.id === existingStudent.id ? targetStudent : s))
        : [targetStudent, ...prev.students];

      const existingAccounts: StoredUserAccount[] = Array.isArray(prev.userAccounts)
        ? prev.userAccounts
        : [];
      const matchedAccountIndex = existingAccounts.findIndex(
        (acc) =>
          normalizePhoneKey(acc.phone) === phoneKey ||
          acc.identifier.toLowerCase() === phoneKey
      );

      const newAccount: StoredUserAccount = {
        id:
          matchedAccountIndex >= 0
            ? existingAccounts[matchedAccountIndex].id
            : `acct-${Date.now()}`,
        identifier: phoneKey || formattedPhone.toLowerCase(),
        phone: formattedPhone,
        role: 'student',
        studentId: targetStudent.id,
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
        userAccounts: nextAccounts,
      };
    });

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
    const matchedStudent = students.find(
      (s: Student) =>
        s.status !== 'deleted_pending_purge' &&
        ((phoneKey.length >= 7 && normalizePhoneKey(s.phone) === phoneKey) ||
          s.passportNumber.trim().toLowerCase() === lowered)
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
          (matchedStudent ? 'student' : undefined) ||
          params.targetRole ||
          'student';

    const resolvedStudentId = existingAccount?.studentId || matchedStudent?.id;

    setState((prev: typeof state) => {
      const existingAccounts: StoredUserAccount[] = Array.isArray(prev.userAccounts)
        ? prev.userAccounts
        : [];

      const accountId = existingAccount?.id || `acct-${Date.now()}`;
      const updatedAccount: StoredUserAccount = {
        id: accountId,
        identifier: existingAccount?.identifier || (phoneKey.length >= 7 ? phoneKey : lowered),
        phone: existingAccount?.phone || formattedPhone,
        role: resolvedRole,
        studentId: resolvedStudentId,
        passwordHash: params.passwordHash,
        passwordSalt: params.passwordSalt,
        updatedAt: nowIso,
      };

      const nextAccounts = existingAccount
        ? existingAccounts.map((acc) => (acc.id === existingAccount.id ? updatedAccount : acc))
        : [updatedAccount, ...existingAccounts];

      return {
        ...prev,
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

  const contextValue = useMemo(
    () => ({
      role,
      setRole,
      currentUserName,
      activeStudentId,
      setActiveStudentId,
      rooms,
      commonAreas,
      students,
      applications,
      payments,
      contracts,
      employees,
      issues,
      disciplineRecords,
      notifications,
      auditLogs,
      settings,
      stats,
      roomFilter,
      setRoomFilter,
      addStudent,
      updateStudent,
      deleteStudent,
      submitApplication,
      reviewApplication,
      assignBed,
      transferBed,
      releaseBed,
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
      createIssue,
      updateIssueStatus,
      addDisciplineRecord,
      addEmployee,
      toggleEmployeeStatus,
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
    }),
    [
      role,
      currentUserName,
      activeStudentId,
      rooms,
      commonAreas,
      students,
      applications,
      payments,
      contracts,
      employees,
      issues,
      disciplineRecords,
      notifications,
      auditLogs,
      settings,
      stats,
      roomFilter,
      canConfigureRooms,
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
