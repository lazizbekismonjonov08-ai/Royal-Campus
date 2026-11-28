import { Role, StaffUser } from '../types';

export const SESSION_STORAGE_KEY = 'royal_campus_session';
export const LEGACY_SESSION_STORAGE_KEY = 'ROYAL_CAMPUS_ACTIVE_SESSION_V1';
export const VIEW_STORAGE_KEY = 'royal_campus_view';
export const TAB_STORAGE_KEY = 'royal_campus_tab';

export type SessionKind = 'owner' | 'staff' | 'resident';

export interface PersistedStaffSummary {
  id: string;
  fullName: string;
  roleTitle: string;
  login: string;
  isActive: boolean;
  createdAt: string;
}

export interface PersistedSession {
  version: 1;
  sessionKind: SessionKind;
  role: Role;
  activeView: string;
  studentId?: string;
  staffUser?: PersistedStaffSummary;
  updatedAt: string;
}

const VALID_ROLES = new Set<Role>([
  'owner',
  'manager',
  'receptionist',
  'security',
  'cleaner',
  'student',
]);

const VALID_SESSION_KINDS = new Set<SessionKind>(['owner', 'staff', 'resident']);

export const LANDING_ANCHOR_HASHES = new Set<string>([
  '#rooms',
  '#amenities',
  '#tracker',
  '#location',
  '#contact',
]);

export const PUBLIC_VIEWS = new Set<string>([
  'S00_LandingPage',
  'S01_Login',
  'S01_StaffLogin',
  'S03_OnlineApplication',
]);

export const RESIDENT_VIEWS = new Set<string>([
  'S05_StudentDashboard',
  'S06_StudentProfile',
  'S07_StudentRoom',
  'S08_StudentPayments',
  'S09_StudentContract',
  'S90_Issues',
]);

export const ADMIN_VIEWS = new Set<string>([
  'S10_Dashboard',
  'S20_Students',
  'S30_Applications',
  'S40_Rooms',
  'S50_Payments',
  'S60_Revenue',
  'S70_Contracts',
  'S80_Employees',
  'S90_Issues',
  'S100_Discipline',
  'S110_Reports',
  'S120_Notifications',
  'S130_Settings',
  'S140_AuditLog',
  'S150_AccessControl',
]);

export const OWNER_ONLY_VIEWS = new Set<string>([
  'S80_Employees',
  'S130_Settings',
  'S140_AuditLog',
]);

const ALL_KNOWN_VIEWS = new Set<string>([
  ...PUBLIC_VIEWS,
  ...RESIDENT_VIEWS,
  ...ADMIN_VIEWS,
]);

const ROLE_ALLOWED_ADMIN_VIEWS: Record<Exclude<Role, 'student'>, Set<string>> = {
  owner: ADMIN_VIEWS,
  manager: new Set([
    'S10_Dashboard',
    'S20_Students',
    'S30_Applications',
    'S40_Rooms',
    'S50_Payments',
    'S60_Revenue',
    'S70_Contracts',
    'S90_Issues',
    'S100_Discipline',
    'S110_Reports',
    'S120_Notifications',
    'S150_AccessControl',
  ]),
  receptionist: new Set([
    'S20_Students',
    'S30_Applications',
    'S40_Rooms',
    'S50_Payments',
    'S70_Contracts',
    'S90_Issues',
    'S120_Notifications',
    'S150_AccessControl',
  ]),
  security: new Set([
    'S20_Students',
    'S40_Rooms',
    'S90_Issues',
    'S120_Notifications',
    'S150_AccessControl',
  ]),
  cleaner: new Set([
    'S40_Rooms',
    'S90_Issues',
    'S120_Notifications',
  ]),
};

const ADMIN_VIEW_TO_SLUG: Record<string, string> = {
  S10_Dashboard: 'dashboard',
  S20_Students: 'residents',
  S30_Applications: 'applications',
  S40_Rooms: 'rooms',
  S50_Payments: 'payments',
  S60_Revenue: 'revenue',
  S70_Contracts: 'contracts',
  S80_Employees: 'employees',
  S90_Issues: 'issues',
  S100_Discipline: 'discipline',
  S110_Reports: 'reports',
  S120_Notifications: 'notifications',
  S130_Settings: 'settings',
  S140_AuditLog: 'audit',
  S150_AccessControl: 'access',
};

const RESIDENT_VIEW_TO_SLUG: Record<string, string> = {
  S05_StudentDashboard: 'dashboard',
  S06_StudentProfile: 'profile',
  S07_StudentRoom: 'room',
  S08_StudentPayments: 'payments',
  S09_StudentContract: 'contract',
  S90_Issues: 'issues',
};

const SLUG_TO_ADMIN_VIEW: Record<string, string> = Object.entries(ADMIN_VIEW_TO_SLUG).reduce(
  (acc, [view, slug]) => {
    acc[slug] = view;
    return acc;
  },
  {} as Record<string, string>
);

const SLUG_TO_RESIDENT_VIEW: Record<string, string> = Object.entries(RESIDENT_VIEW_TO_SLUG).reduce(
  (acc, [view, slug]) => {
    acc[slug] = view;
    return acc;
  },
  {} as Record<string, string>
);

function readStorageValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = window.localStorage?.getItem(key);
    if (val !== null && val !== undefined) return val;
  } catch {
    // fallback to sessionStorage if localStorage is restricted
  }
  try {
    const val = window.sessionStorage?.getItem(key);
    if (val !== null && val !== undefined) return val;
  } catch {
    // ignore storage errors
  }
  return null;
}

function writeStorageValue(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // continue and mirror to sessionStorage even if localStorage hits quota
  }
  try {
    window.sessionStorage?.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

function removeStorageValue(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.removeItem(key);
  } catch {
    // ignore
  }
  try {
    window.sessionStorage?.removeItem(key);
  } catch {
    // ignore
  }
}

export function getDefaultViewForRole(role: Role): string {
  if (role === 'student') return 'S05_StudentDashboard';
  if (role === 'security') return 'S150_AccessControl';
  if (role === 'cleaner') return 'S40_Rooms';
  if (role === 'receptionist') return 'S20_Students';
  return 'S10_Dashboard';
}

export function sanitizeViewForSession(
  view: string | undefined,
  sessionKind: SessionKind,
  role: Role
): string {
  const normalizedView = view === 'S100_Issues' ? 'S90_Issues' : view;

  if (sessionKind === 'resident' || role === 'student') {
    if (normalizedView && RESIDENT_VIEWS.has(normalizedView)) {
      return normalizedView;
    }
    return 'S05_StudentDashboard';
  }

  if (sessionKind === 'staff') {
    const allowedForRole = ROLE_ALLOWED_ADMIN_VIEWS[role] || ROLE_ALLOWED_ADMIN_VIEWS.receptionist;
    if (
      normalizedView &&
      !OWNER_ONLY_VIEWS.has(normalizedView) &&
      allowedForRole.has(normalizedView)
    ) {
      return normalizedView;
    }
    return getDefaultViewForRole(role);
  }

  // Owner session can access all admin views (and resident preview views if owner switches role)
  if (normalizedView && (ADMIN_VIEWS.has(normalizedView) || RESIDENT_VIEWS.has(normalizedView))) {
    return normalizedView;
  }
  return getDefaultViewForRole(role);
}

/**
 * Converts a StaffUser into a non-sensitive summary suitable for local session persistence.
 * Deliberately excludes the staff password.
 */
export function toPersistedStaffSummary(staff: StaffUser): PersistedStaffSummary {
  return {
    id: String(staff.id),
    fullName: String(staff.fullName || ''),
    roleTitle: String(staff.roleTitle || ''),
    login: String(staff.login || ''),
    isActive: Boolean(staff.isActive),
    createdAt: String(staff.createdAt || ''),
  };
}

export function toStaffUserFromSummary(summary: PersistedStaffSummary): StaffUser {
  return {
    id: summary.id,
    fullName: summary.fullName,
    roleTitle: summary.roleTitle,
    login: summary.login,
    password: '',
    isActive: summary.isActive,
    createdAt: summary.createdAt,
  };
}

export function loadPersistedSession(): PersistedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      readStorageValue(SESSION_STORAGE_KEY) || readStorageValue(LEGACY_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
      return null;
    }

    const sessionKind = parsed.sessionKind as SessionKind;
    const role = parsed.role as Role;
    if (!VALID_SESSION_KINDS.has(sessionKind) || !VALID_ROLES.has(role)) {
      return null;
    }

    if (sessionKind === 'resident') {
      const studentId = typeof parsed.studentId === 'string' ? parsed.studentId.trim() : '';
      if (!studentId) return null;
      return {
        version: 1,
        sessionKind: 'resident',
        role: 'student',
        activeView: sanitizeViewForSession(parsed.activeView, 'resident', 'student'),
        studentId,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
    }

    if (sessionKind === 'staff') {
      const staff = parsed.staffUser;
      if (!staff || typeof staff !== 'object' || typeof staff.id !== 'string' || !staff.id.trim()) {
        return null;
      }
      const staffRole: Role = role === 'student' ? 'receptionist' : role;
      const summary: PersistedStaffSummary = {
        id: staff.id.trim(),
        fullName: typeof staff.fullName === 'string' ? staff.fullName : '',
        roleTitle: typeof staff.roleTitle === 'string' ? staff.roleTitle : '',
        login: typeof staff.login === 'string' ? staff.login : '',
        isActive: staff.isActive !== false,
        createdAt: typeof staff.createdAt === 'string' ? staff.createdAt : '',
      };
      if (!summary.isActive) return null;
      return {
        version: 1,
        sessionKind: 'staff',
        role: staffRole,
        activeView: sanitizeViewForSession(parsed.activeView, 'staff', staffRole),
        staffUser: summary,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
    }

    // Owner session
    return {
      version: 1,
      sessionKind: 'owner',
      role,
      activeView: sanitizeViewForSession(parsed.activeView, 'owner', role),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function savePersistedSession(params: {
  sessionKind: SessionKind;
  role: Role;
  activeView: string;
  studentId?: string;
  staffUser?: StaffUser | PersistedStaffSummary | null;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadPersistedSession();
    const safeRole: Role =
      params.sessionKind === 'resident'
        ? 'student'
        : params.sessionKind === 'staff' && params.role === 'student'
        ? 'receptionist'
        : params.role;

    const safeView = sanitizeViewForSession(params.activeView, params.sessionKind, safeRole);

    const payload: PersistedSession = {
      version: 1,
      sessionKind: params.sessionKind,
      role: safeRole,
      activeView: safeView,
      updatedAt: new Date().toISOString(),
    };

    if (params.sessionKind === 'resident') {
      const resolvedStudentId =
        params.studentId?.trim() ||
        (existing?.sessionKind === 'resident' ? existing.studentId : undefined);
      if (!resolvedStudentId) return;
      payload.studentId = resolvedStudentId;
    }

    if (params.sessionKind === 'staff') {
      const sourceStaff =
        params.staffUser ||
        (existing?.sessionKind === 'staff' ? existing.staffUser : null);
      if (!sourceStaff || !sourceStaff.id) return;
      payload.staffUser = {
        id: String(sourceStaff.id),
        fullName: String(sourceStaff.fullName || ''),
        roleTitle: String(sourceStaff.roleTitle || ''),
        login: String(sourceStaff.login || ''),
        isActive: Boolean(sourceStaff.isActive),
        createdAt: String(sourceStaff.createdAt || ''),
      };
    }

    writeStorageValue(SESSION_STORAGE_KEY, JSON.stringify(payload));
    writeStorageValue(VIEW_STORAGE_KEY, safeView);
  } catch (err) {
    console.error('Failed to persist session', err);
  }
}

export function loadPersistedView(): string | null {
  const raw = readStorageValue(VIEW_STORAGE_KEY);
  if (!raw) return null;
  const trimmed = raw.trim();
  const normalized = trimmed === 'S100_Issues' ? 'S90_Issues' : trimmed;
  return ALL_KNOWN_VIEWS.has(normalized) ? normalized : null;
}

export function savePersistedView(view: string): void {
  const normalized = view === 'S100_Issues' ? 'S90_Issues' : view;
  if (!ALL_KNOWN_VIEWS.has(normalized)) return;
  writeStorageValue(VIEW_STORAGE_KEY, normalized);
}

export function loadPersistedTab<T extends string>(
  viewKey: string,
  allowedTabs: readonly T[],
  fallback: T
): T {
  try {
    const raw = readStorageValue(TAB_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const candidate = parsed[viewKey];
      if (typeof candidate === 'string' && (allowedTabs as readonly string[]).includes(candidate)) {
        return candidate as T;
      }
    }
  } catch {
    // ignore malformed tab state
  }
  return fallback;
}

export function savePersistedTab(viewKey: string, tab: string): void {
  try {
    const raw = readStorageValue(TAB_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : {};
    const next = current && typeof current === 'object' ? { ...current, [viewKey]: tab } : { [viewKey]: tab };
    writeStorageValue(TAB_STORAGE_KEY, JSON.stringify(next));
  } catch {
    writeStorageValue(TAB_STORAGE_KEY, JSON.stringify({ [viewKey]: tab }));
  }
}

export function clearPersistedSession(): void {
  removeStorageValue(SESSION_STORAGE_KEY);
  removeStorageValue(LEGACY_SESSION_STORAGE_KEY);
  removeStorageValue(VIEW_STORAGE_KEY);
  removeStorageValue(TAB_STORAGE_KEY);
}

export interface ParsedHashRoute {
  scope:
    | 'empty'
    | 'home'
    | 'login'
    | 'staff_login'
    | 'apply'
    | 'owner'
    | 'staff'
    | 'resident'
    | 'landing_anchor'
    | 'unknown';
  view?: string;
}

export function parseHashRoute(rawHash: string): ParsedHashRoute {
  const trimmed = (rawHash || '').trim().toLowerCase();
  if (!trimmed || trimmed === '#') {
    return { scope: 'empty' };
  }
  if (trimmed === '#home') {
    return { scope: 'home', view: 'S00_LandingPage' };
  }
  if (LANDING_ANCHOR_HASHES.has(trimmed)) {
    return { scope: 'landing_anchor', view: trimmed === '#rooms' ? 'S40_Rooms' : 'S00_LandingPage' };
  }

  const clean = trimmed.replace(/^#\/?/, '').replace(/\/+$/, '');
  const [segment, subSegment] = clean.split('/');

  if (segment === 'home') return { scope: 'home', view: 'S00_LandingPage' };
  if (segment === 'login') return { scope: 'login', view: 'S01_Login' };
  if (segment === 'apply') return { scope: 'apply', view: 'S03_OnlineApplication' };
  if (segment === 'staff-login') return { scope: 'staff_login', view: 'S01_StaffLogin' };

  if (segment === 'owner') {
    if (!subSegment) return { scope: 'owner' };
    const matchedView = SLUG_TO_ADMIN_VIEW[subSegment] || SLUG_TO_RESIDENT_VIEW[subSegment];
    return { scope: 'owner', view: matchedView };
  }

  if (segment === 'staff') {
    if (!subSegment) return { scope: 'staff' };
    const matchedView = SLUG_TO_ADMIN_VIEW[subSegment];
    return { scope: 'staff', view: matchedView };
  }

  if (segment === 'resident') {
    if (!subSegment) return { scope: 'resident' };
    const matchedView = SLUG_TO_RESIDENT_VIEW[subSegment];
    return { scope: 'resident', view: matchedView };
  }

  return { scope: 'unknown' };
}

export function buildHashForView(
  view: string,
  sessionKind: SessionKind | null,
  role: Role
): string {
  if (view === 'S00_LandingPage') return '';
  if (view === 'S01_Login') return '#login';
  if (view === 'S01_StaffLogin') return '#staff';
  if (view === 'S03_OnlineApplication') return '#apply';

  if (!sessionKind) return '';

  const safeView = sanitizeViewForSession(view, sessionKind, role);
  const defaultView = getDefaultViewForRole(role);

  if (sessionKind === 'resident') {
    const slug = RESIDENT_VIEW_TO_SLUG[safeView];
    if (!slug || safeView === 'S05_StudentDashboard') return '#resident';
    return `#resident/${slug}`;
  }

  const prefix = sessionKind === 'staff' ? '#staff' : '#owner';
  const slug = ADMIN_VIEW_TO_SLUG[safeView] || RESIDENT_VIEW_TO_SLUG[safeView];
  if (!slug || safeView === defaultView) return prefix;
  return `${prefix}/${slug}`;
}

let lastProgrammaticHash: string | null = null;

export function consumeProgrammaticHashMatch(currentHash: string): boolean {
  if (lastProgrammaticHash !== null && currentHash === lastProgrammaticHash) {
    lastProgrammaticHash = null;
    return true;
  }
  return false;
}

export function syncUrlHash(
  view: string,
  sessionKind: SessionKind | null,
  role: Role
): string {
  if (typeof window === 'undefined') return '';
  const currentHash = window.location.hash;
  const currentLower = currentHash.toLowerCase();

  // Preserve in-page landing anchors (#rooms, #amenities, #tracker, #location, #contact)
  if (view === 'S00_LandingPage' && LANDING_ANCHOR_HASHES.has(currentLower)) {
    return currentHash;
  }

  const nextHash = buildHashForView(view, sessionKind, role);
  if (currentHash === nextHash) return nextHash;

  try {
    const baseUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', nextHash ? `${baseUrl}${nextHash}` : baseUrl);
    if (window.location.hash === nextHash) {
      return nextHash;
    }
  } catch {
    // fall through to direct hash assignment when replaceState is restricted
  }

  try {
    if (nextHash) {
      lastProgrammaticHash = nextHash;
      window.location.hash = nextHash;
    }
  } catch {
    // ignore in fully restricted contexts
  }

  return nextHash;
}

export function resolveInitialView(
  persistedSession: PersistedSession | null,
  rawHash: string,
  persistedView: string | null = loadPersistedView()
): string {
  const parsed = parseHashRoute(rawHash);

  if (persistedSession) {
    // Respect explicit #apply hash or persisted Apply view while keeping session intact
    if (parsed.scope === 'apply') {
      return 'S03_OnlineApplication';
    }

    // Respect explicit portal hash matching the authenticated user's session kind
    if (
      (parsed.scope === 'owner' && persistedSession.sessionKind === 'owner') ||
      (parsed.scope === 'staff' && persistedSession.sessionKind === 'staff') ||
      (parsed.scope === 'resident' && persistedSession.sessionKind === 'resident')
    ) {
      if (parsed.view) {
        return sanitizeViewForSession(
          parsed.view,
          persistedSession.sessionKind,
          persistedSession.role
        );
      }
    }

    // Allow direct #rooms hash for authenticated Owner/Staff unless they were on Home
    if (
      parsed.scope === 'landing_anchor' &&
      rawHash.trim().toLowerCase() === '#rooms' &&
      persistedSession.sessionKind !== 'resident' &&
      persistedView !== 'S00_LandingPage'
    ) {
      return sanitizeViewForSession(
        'S40_Rooms',
        persistedSession.sessionKind,
        persistedSession.role
      );
    }

    // If user intentionally navigated to Apply while logged in and reloaded without hash
    if (parsed.scope === 'empty' && persistedView === 'S03_OnlineApplication') {
      return 'S03_OnlineApplication';
    }

    // Restore exact authenticated panel/view from royal_campus_view or royal_campus_session
    const candidateView =
      persistedView && !PUBLIC_VIEWS.has(persistedView)
        ? persistedView
        : persistedSession.activeView;

    return sanitizeViewForSession(
      candidateView,
      persistedSession.sessionKind,
      persistedSession.role
    );
  }

  // Unauthenticated route resolution (URL hashes NEVER bypass authentication)
  if (parsed.scope === 'apply') return 'S03_OnlineApplication';
  if (parsed.scope === 'login') return 'S01_Login';
  if (parsed.scope === 'staff_login' || parsed.scope === 'staff') return 'S01_StaffLogin';
  if (parsed.scope === 'owner' || parsed.scope === 'resident') return 'S01_Login';
  if (parsed.scope === 'home' || parsed.scope === 'landing_anchor') return 'S00_LandingPage';

  // When hash is empty (e.g. preview iframe reload), restore last public view if any
  if (parsed.scope === 'empty' && persistedView && PUBLIC_VIEWS.has(persistedView)) {
    return persistedView;
  }

  return 'S00_LandingPage';
}
