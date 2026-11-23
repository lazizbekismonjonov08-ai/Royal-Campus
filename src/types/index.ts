export type Role = 'owner' | 'manager' | 'receptionist' | 'security' | 'cleaner' | 'student';

export type RoomType =
  | 'standard'
  | 'standard_plus'
  | 'comfort'
  | 'comfort_plus'
  | 'lux';

export const ROOM_TYPE_ORDER: RoomType[] = [
  'standard',
  'standard_plus',
  'comfort',
  'comfort_plus',
  'lux',
];

export const ROOM_TYPE_CAPACITY: Record<RoomType, number> = {
  standard: 8,
  standard_plus: 8,
  comfort: 6,
  comfort_plus: 6,
  lux: 4,
};

export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

export interface Bed {
  id: string;
  bedNumber: number | string;
  bedIdentifier: string; // Exact manually entered identifier, e.g. "A1", "01", "B-2", "Top-1"
  roomId: string;
  status: BedStatus;
  studentId?: string;
  studentName?: string;
  assignedAt?: string;
}

export interface Room {
  id: string;
  roomNumber: string; // Exact manually entered identifier e.g. "201", "205-A", "002"
  floor: number; // 2, 3, 4, 5
  type: RoomType;
  capacity: number;
  priceMonthly: number;
  beds: Bed[];
  status?: 'available' | 'maintenance' | 'closed';
  isClosedForMaintenance?: boolean;
  notes?: string;
}

export type StudentStatus = 'active' | 'applicant' | 'rejected' | 'former' | 'deleted_pending_purge';

export type PaymentStatus = 'paid' | 'due_soon' | 'overdue';

export interface Student {
  id: string;
  fullName: string;
  phone: string;
  birthDate: string;
  passportNumber: string;
  passportFrontUrl?: string;
  passportBackUrl?: string;
  university: string;
  faculty: string;
  degreeLevel?: string;
  course: number | string;
  group: string;
  parentPhone: string;
  permanentAddress: string;
  status: StudentStatus;
  roomId?: string;
  bedId?: string;
  roomNumber?: string;
  bedNumber?: number | string;
  bedIdentifier?: string;
  floor?: number;
  roomType?: RoomType;
  monthlyTariff: number;
  paidUntil: string; // YYYY-MM-DD
  nextPaymentDueDate: string; // YYYY-MM-DD
  lastPaymentDate?: string; // YYYY-MM-DD
  nextPaymentDate?: string; // YYYY-MM-DD
  paymentStatus?: PaymentStatus;
  debtAmount: number; // UZS
  createdAt: string;
  deletedAt?: string;
  telegramChatId?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  rfidCardNumber?: string; // Mifare / RFID UID e.g. "E280681A"
  faceEnrolled?: boolean;  // Face biometrics enrolled
  facePhotoUrl?: string;   // Face template / photo preview
  accessStatus?: 'active' | 'suspended' | 'blocked';
  lastAccessAt?: string;
  lastAccessDirection?: 'entry' | 'exit';
  lastAccessTerminal?: string;
}

export type ApplicationStatus = 'new' | 'under_review' | 'approved' | 'rejected' | 'correction_requested';

export interface Application {
  id: string;
  fullName: string;
  phone: string;
  birthDate: string;
  passportNumber: string;
  passportFrontUrl?: string;
  passportBackUrl?: string;
  university: string;
  faculty: string;
  degreeLevel?: string;
  course: number | string;
  group: string;
  parentPhone: string;
  permanentAddress: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewNotes?: string;
  reviewedBy?: string;
  assignedRoomNumber?: string;
  assignedBedNumber?: number;
  preferredRoomType?: RoomType;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  amount: number; // UZS
  paymentDate: string; // YYYY-MM-DD
  date?: string; // YYYY-MM-DD
  type?: string; // 'income'
  periodMonth: string; // e.g. "2026-10"
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  recordedBy: string;
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  studentId: string;
  studentName: string;
  passportNumber: string;
  roomNumber: string;
  bedNumber: number | string;
  bedIdentifier?: string;
  roomType: RoomType;
  tariffMonthly: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'terminated' | 'expired';
  createdAt: string;
  pdfGeneratedAt?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: Role;
  status: 'active' | 'disabled';
  lastLogin: string;
}

export type IssueCategory = 'plumbing' | 'electricity' | 'cleaning' | 'furniture' | 'wifi' | 'other';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'resolved';

export interface Issue {
  id: string;
  category: IssueCategory;
  location: string;
  roomNumber?: string;
  description: string;
  priority: IssuePriority;
  reportedBy: string;
  reporterRole: string;
  reporterPhone?: string;
  assignedTo?: string;
  assignedEmployeeName?: string;
  status: IssueStatus;
  photoUrl?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  violationReason: string;
  penaltyPoints: number;
  recordedBy: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  type: 'payment' | 'application' | 'issue' | 'system' | 'discipline';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  recipientRole?: Role | 'all';
  studentId?: string;
}

export interface AuditLogEntry {
  id: string;
  userName: string;
  role: string;
  action: string;
  objectType: string;
  objectId: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface RoomTariff {
  standard: number;      // e.g. 1,000,000 UZS (8-bed)
  standard_plus: number; // e.g. 1,200,000 UZS (8-bed Panoramic)
  comfort: number;       // e.g. 1,200,000 UZS (6-bed)
  comfort_plus: number;  // e.g. 1,400,000 UZS (6-bed Panoramic)
  lux: number;           // e.g. 1,400,000 UZS (4-bed)
}

export interface DormSettings {
  roomTariffs: RoomTariff;
  autoPaymentRemindersDays: number[];
  retentionMonths: number;
  notificationChannels: {
    telegram: boolean;
    sms: boolean;
  };
}

export type CommonAreaCategory =
  | 'reception'
  | 'kitchen'
  | 'laundry'
  | 'study'
  | 'medical'
  | 'security'
  | 'lounge'
  | 'other';

export interface CommonArea {
  id: string;
  name: string;
  code: string;
  floor: 1;
  category: CommonAreaCategory;
  areaSizeM2?: number;
  operatingHours: string;
  responsiblePerson: string;
  status: 'active' | 'maintenance' | 'closed';
  description: string;
  amenities: string[];
}

// ==========================================
// ACCESS CONTROL & HIKVISION INTEGRATION TYPES
// ==========================================

export type AccessDeviceVendor = 'hikvision' | 'generic_wiegand' | 'other';
export type AccessDeviceProtocol = 'ISAPI' | 'OpenAPI' | 'HikCentral_Gateway' | 'OSDP' | 'Simulated';
export type AccessDeviceType = 'face_terminal' | 'card_reader' | 'turnstile_controller' | 'smart_barrier';
export type AccessDeviceStatus = 'simulated' | 'offline' | 'connecting' | 'online' | 'error';
export type AccessCredentialType = 'card' | 'face' | 'qr_code' | 'pin';
export type AccessDirection = 'entry' | 'exit' | 'bidirectional';
export type AccessDecisionType = 'granted' | 'denied';

export type AccessReasonCode =
  | 'ACCESS_OK'
  | 'STUDENT_INACTIVE'
  | 'NO_ROOM_ASSIGNED'
  | 'PAYMENT_OVERDUE_BLOCKED'
  | 'CURFEW_HOURS_VIOLATION'
  | 'CREDENTIAL_NOT_FOUND'
  | 'STUDENT_SUSPENDED'
  | 'DEVICE_DISABLED'
  | 'MANUAL_OVERRIDE_GRANTED'
  | 'MANUAL_OVERRIDE_DENIED';

export interface AccessTerminal {
  id: string;
  name: string;
  vendor: AccessDeviceVendor;
  model: string;              // e.g. "DS-K1T673MW", "DS-K1T502", "DS-K2604"
  deviceType: AccessDeviceType;
  protocol: AccessDeviceProtocol;
  ipAddress: string;
  port: number;
  username: string;
  password?: string;
  apiKey?: string;
  macAddress?: string;
  serialNumber?: string;
  location: string;           // e.g. "Bosh kirish turniketi #1", "Kutubxona eshigi"
  direction: AccessDirection;
  status: AccessDeviceStatus;
  isSimulatedOnly: boolean;   // True when in demo mode, false when physical hardware is configured
  lastPingAt?: string;
  lastPingSuccess?: boolean;
  lastErrorMessage?: string;
  relayHoldSeconds: number;   // Duration to trigger relay (e.g. 5 seconds)
  enabled: boolean;
}

export interface AccessLogEvent {
  id: string;
  timestamp: string;
  isSimulated: boolean;       // Clear distinction between simulated demo events and physical terminal events
  source: 'simulated_test' | 'hikvision_device' | 'manual_security';
  terminalId: string;
  terminalName: string;
  studentId?: string;
  studentName?: string;
  studentRoom?: string;
  studentPhoto?: string;
  credentialType: AccessCredentialType;
  credentialValue: string;    // e.g. "Card UID: E280681A" or "Face: 99.4% confidence"
  direction: 'entry' | 'exit';
  decision: AccessDecisionType;
  reasonCode: AccessReasonCode;
  reasonMessage: string;
  curfewFlagged?: boolean;    // Marked if student arrived during curfew hours
  debtWarning?: boolean;      // Marked if student has pending debt
  relayTriggered?: boolean;   // True if the gate relay was actually unlatched
}

export interface AccessControlPolicy {
  curfewEnabled: boolean;
  curfewStart: string;        // e.g. "23:00"
  curfewEnd: string;          // e.g. "06:00"
  curfewAction: 'deny' | 'allow_with_flag'; // If allow_with_flag, creates auto discipline record
  overduePaymentPolicy: 'allow_with_warning' | 'deny_if_overdue_3_days' | 'deny_all_debtors';
  requireActiveBedAssignment: boolean; // Must have roomId and bedId
  autoSyncHikvisionLibrary: boolean;
  simulatorEnabled: boolean;
  relayDefaultDuration: number;
}

// ==========================================
// GEMINI MAINTENANCE AI ANALYSIS & PRIORITY
// ==========================================

export interface RankedRepairPriority {
  id: string;
  issueId: string;
  roomNumber: string;
  floor: number;
  category: IssueCategory | string;
  description: string;
  calculatedPriority: 'critical' | 'high' | 'medium' | 'low';
  severityScore: number; // 1 to 10
  frequencyScore: number; // 1 to 10
  combinedScore: number; // 1 to 100
  historicalFailuresCount: number;
  recurrenceBadge: string;
  urgencyRationale: string;
  recommendedAction: string;
  assignedSpecialty: 'electrician' | 'plumber' | 'carpenter' | 'hvac' | 'cleaning' | 'general';
  estimatedRepairHours: number;
  daysPending: number;
  occupancyImpact: string;
}

export interface RecurringPatternItem {
  title: string;
  location: string;
  category: string;
  frequency: number;
  riskLevel: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface MaintenanceAiAnalysisResponse {
  success: boolean;
  overallHealthScore: number; // 0 - 100
  healthStatusText: string;
  executiveSummary: string;
  rankedPriorities: RankedRepairPriority[];
  recurringPatterns: RecurringPatternItem[];
  preventativeTips: string[];
  analyzedAt: string;
  modelUsed: string;
  source: 'gemini_api' | 'algorithmic_engine';
}

export interface StoredUserAccount {
  id: string;
  identifier: string;
  phone: string;
  role: Role;
  studentId?: string;
  passwordHash: string;
  passwordSalt: string;
  updatedAt: string;
}
