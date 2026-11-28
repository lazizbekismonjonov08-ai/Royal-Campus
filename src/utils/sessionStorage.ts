import { Role, StaffUser } from '../types';

export const SESSION_STORAGE_KEY = 'ROYAL_CAMPUS_ACTIVE_SESSION_V1';

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

  // Owner session can view all admin panels (and resident preview views if owner switches role)
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
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
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

    if (params.sessionKind === 'resident' && params.studentId) {
      payload.studentId = params.studentId.trim();
    }

    if (params.sessionKind === 'staff' && params.staffUser) {
      payload.staffUser = {
        id: String(params.staffUser.id),
        fullName: String(params.staffUser.fullName || ''),
        roleTitle: String(params.staffUser.roleTitle || ''),
        login: String(params.staffUser.login || ''),
        isActive: Boolean(params.staffUser.isActive),
        createdAt: String(params.staffUser.createdAt || ''),
      };
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to persist session', err);
  }
}

export function clearPersistedSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export interface ParsedHashRoute {
  scope: 'home' | 'login' | 'staff_login' | 'apply' | 'owner' | 'staff' | 'resident' | 'landing_anchor' | 'unknown';
  view?: string;
}

export function parseHashRoute(rawHash: string): ParsedHashRoute {
  const trimmed = (rawHash || '').trim().toLowerCase();
  if (!trimmed || trimmed === '#' || trimmed === '#home') {
    return { scope: 'home', view: 'S00_LandingPage' };
  }
  if (LANDING_ANCHOR_HASHES.has(trimmed)) {
    return { scope: 'landing_anchor', view: 'S00_LandingPage' };
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

export function syncUrlHash(
  view: string,
  sessionKind: SessionKind | null,
  role: Role
): void {
  if (typeof window === 'undefined') return;
  try {
    const currentHash = window.location.hash.toLowerCase();
    // Preserve in-page landing anchors (#rooms, #amenities, #tracker, #location, #contact)
    if (view === 'S00_LandingPage' && LANDING_ANCHOR_HASHES.has(currentHash)) {
      return;
    }

    const nextHash = buildHashForView(view, sessionKind, role);
    if (window.location.hash === nextHash) return;

    const baseUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', nextHash ? `${baseUrl}${nextHash}` : baseUrl);
  } catch {
    // ignore history errors in sandboxed contexts
  }
}

export function resolveInitialView(
  persisted: PersistedSession | null,
  rawHash: string
): string {
  const parsed = parseHashRoute(rawHash);

  if (persisted) {
    if (parsed.scope === 'apply') {
      return 'S03_OnlineApplication';
    }
    if (
      (parsed.scope === 'owner' && persisted.sessionKind === 'owner') ||
      (parsed.scope === 'staff' && persisted.sessionKind === 'staff') ||
      (parsed.scope === 'resident' && persisted.sessionKind === 'resident')
    ) {
      if (parsed.view) {
        return sanitizeViewForSession(parsed.view, persisted.sessionKind, persisted.role);
      }
    }
    return sanitizeViewForSession(persisted.activeView, persisted.sessionKind, persisted.role);
  }

  // Unauthenticated initial route resolution (URL hashes NEVER bypass login)
  if (parsed.scope === 'apply') return 'S03_OnlineApplication';
  if (parsed.scope === 'login') return 'S01_Login';
  if (parsed.scope === 'staff_login' || parsed.scope === 'staff') return 'S01_StaffLogin';
  if (parsed.scope === 'owner' || parsed.scope === 'resident') return 'S01_Login';
  return 'S00_LandingPage';
}
