import React, { useState, useEffect, useRef } from 'react';
import { DormProvider, useDorm } from './context/DormContext';
import { I18nProvider } from './i18n/I18nContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TelegramBotWidget } from './components/TelegramBotWidget';

// Views
import { Role, RoomType } from './types';
import { normalizePhoneKey, resolveStaffRoleFromTitle } from './utils/authCrypto';
import {
  PUBLIC_VIEWS,
  SessionKind,
  clearPersistedSession,
  consumeProgrammaticHashMatch,
  getDefaultViewForRole,
  loadPersistedSession,
  loadPersistedView,
  parseHashRoute,
  resolveInitialView,
  sanitizeViewForSession,
  savePersistedSession,
  savePersistedView,
  syncUrlHash,
} from './utils/sessionStorage';
import { S00_LandingPage } from './views/S00_LandingPage';
import { LoginSuccessMeta, S01_Login } from './views/S01_Login';
import { S03_OnlineApplication } from './views/S03_OnlineApplication';
import { S05_StudentDashboard } from './views/S05_StudentDashboard';
import { S06_StudentProfile } from './views/S06_StudentProfile';
import { S07_StudentRoom } from './views/S07_StudentRoom';
import { S08_StudentPayments } from './views/S08_StudentPayments';
import { S09_StudentContract } from './views/S09_StudentContract';
import { S10_AdminDashboard } from './views/S10_AdminDashboard';
import { S20_StudentsList } from './views/S20_StudentsList';
import { S21_StudentDetailModal } from './views/S21_StudentDetailModal';
import { S22_AddEditStudentModal } from './views/S22_AddEditStudentModal';
import { S30_ApplicationsList } from './views/S30_ApplicationsList';
import { S40_FloorsAndRooms } from './views/S40_FloorsAndRooms';
import { S41_RoomDetailModal } from './views/S41_RoomDetailModal';
import { S43_AssignTransferBedModal } from './views/S43_AssignTransferBedModal';
import { S50_PaymentsList } from './views/S50_PaymentsList';
import { S52_AddPaymentModal } from './views/S52_AddPaymentModal';
import { S60_RevenueDashboard } from './views/S60_RevenueDashboard';
import { S70_ContractsList } from './views/S70_ContractsList';
import { S80_EmployeesList } from './views/S80_EmployeesList';
import { S90_IssuesList } from './views/S90_IssuesList';
import { S100_DisciplineList } from './views/S100_DisciplineList';
import { S110_Reports } from './views/S110_Reports';
import { S120_NotificationsView } from './views/S120_NotificationsView';
import { S130_Settings } from './views/S130_Settings';
import { S140_AuditLog } from './views/S140_AuditLog';
import { S150_AccessControl } from './views/S150_AccessControl';

const MainAppContent: React.FC = () => {
  const {
    role,
    setRole,
    activeStudentId,
    setActiveStudentId,
    activeStaffUser,
    setActiveStaffUser,
    students,
    staffUsers,
    isLoadingData,
    hasSyncedSupabase,
  } = useDorm();

  // Synchronously read saved session, view, and URL hash on the very first render (never flashes Home)
  const [initialBoot] = useState(() => {
    const savedSession = loadPersistedSession();
    const savedView = loadPersistedView();
    const initialHash = typeof window !== 'undefined' ? window.location.hash : '';
    const resolvedView = resolveInitialView(savedSession, initialHash, savedView);
    const resolvedLastAuthView = savedSession
      ? sanitizeViewForSession(
          savedView && !PUBLIC_VIEWS.has(savedView) ? savedView : savedSession.activeView,
          savedSession.sessionKind,
          savedSession.role
        )
      : 'S10_Dashboard';
    return {
      savedSession,
      resolvedView,
      resolvedLastAuthView,
    };
  });

  const [sessionKind, setSessionKind] = useState<SessionKind | null>(
    () => initialBoot.savedSession?.sessionKind ?? null
  );
  const [activeView, setActiveView] = useState<string>(() => initialBoot.resolvedView);
  const [lastAuthView, setLastAuthView] = useState<string>(() => initialBoot.resolvedLastAuthView);
  const isStaffSession = sessionKind === 'owner' || sessionKind === 'staff';
  const needsStaffReconcileRef = useRef<boolean>(
    initialBoot.savedSession?.sessionKind === 'staff'
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [applicationPrefillRoomType, setApplicationPrefillRoomType] = useState<RoomType | undefined>(undefined);

  // Keep localStorage (`royal_campus_session`, `royal_campus_view`) and URL hash synced on every state change
  useEffect(() => {
    syncUrlHash(activeView, sessionKind, role);
    savePersistedView(activeView);

    if (sessionKind && !PUBLIC_VIEWS.has(activeView)) {
      const safeView = sanitizeViewForSession(activeView, sessionKind, role);
      setLastAuthView(safeView);
      savePersistedSession({
        sessionKind,
        role,
        activeView: safeView,
        studentId: sessionKind === 'resident' ? activeStudentId : undefined,
        staffUser: sessionKind === 'staff' ? activeStaffUser : null,
      });
    }
  }, [activeView, sessionKind, role, activeStudentId, activeStaffUser]);

  // Refresh restored Staff metadata in place once Supabase finishes loading (never redirects while loading)
  useEffect(() => {
    if (
      isLoadingData ||
      !hasSyncedSupabase ||
      !needsStaffReconcileRef.current ||
      sessionKind !== 'staff' ||
      !activeStaffUser
    ) {
      return;
    }

    needsStaffReconcileRef.current = false;
    if (staffUsers.length === 0) return;

    const freshStaff = staffUsers.find((u) => u.id === activeStaffUser.id);
    if (!freshStaff) return;

    if (!freshStaff.isActive) {
      clearPersistedSession();
      setSessionKind(null);
      setActiveStaffUser(null);
      setRole('student');
      setActiveView('S01_Login');
      syncUrlHash('S01_Login', null, 'student');
      return;
    }

    const freshRole = resolveStaffRoleFromTitle(freshStaff.roleTitle);
    setActiveStaffUser(freshStaff);
    if (role !== freshRole) {
      setRole(freshRole);
    }
  }, [
    isLoadingData,
    hasSyncedSupabase,
    sessionKind,
    activeStaffUser,
    staffUsers,
    role,
    setActiveStaffUser,
    setRole,
  ]);

  // Handle browser Back/Forward & manual hash edits without losing active sessions or bypassing auth
  useEffect(() => {
    const onHashChange = () => {
      const rawHash = window.location.hash;
      if (consumeProgrammaticHashMatch(rawHash)) {
        return;
      }

      const parsed = parseHashRoute(rawHash);

      if (parsed.scope === 'empty') {
        // Never reset an authenticated user back to Home on empty hash
        if (!sessionKind) {
          setActiveView('S00_LandingPage');
        }
        return;
      }

      if (parsed.scope === 'apply') {
        savePersistedView('S03_OnlineApplication');
        setActiveView('S03_OnlineApplication');
        return;
      }

      if (parsed.scope === 'home') {
        savePersistedView('S00_LandingPage');
        setActiveView('S00_LandingPage');
        return;
      }

      if (parsed.scope === 'landing_anchor') {
        if (
          rawHash.trim().toLowerCase() === '#rooms' &&
          sessionKind &&
          sessionKind !== 'resident' &&
          activeView !== 'S00_LandingPage'
        ) {
          const roomView = sanitizeViewForSession('S40_Rooms', sessionKind, role);
          savePersistedView(roomView);
          setActiveView(roomView);
          return;
        }
        if (!sessionKind) {
          setActiveView('S00_LandingPage');
        }
        return;
      }

      if (sessionKind) {
        if (
          (parsed.scope === 'owner' && sessionKind === 'owner') ||
          (parsed.scope === 'staff' && sessionKind === 'staff') ||
          (parsed.scope === 'resident' && sessionKind === 'resident')
        ) {
          const nextView = sanitizeViewForSession(parsed.view || lastAuthView, sessionKind, role);
          savePersistedView(nextView);
          setActiveView(nextView);
        }
        return;
      }

      if (parsed.scope === 'staff' || parsed.scope === 'staff_login') {
        savePersistedView('S01_StaffLogin');
        setActiveView('S01_StaffLogin');
      } else if (parsed.scope === 'login' || parsed.scope === 'owner' || parsed.scope === 'resident') {
        savePersistedView('S01_Login');
        setActiveView('S01_Login');
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [sessionKind, role, lastAuthView, activeView]);

  const handleNavigate = (view: string) => {
    const nextView =
      sessionKind && !PUBLIC_VIEWS.has(view)
        ? sanitizeViewForSession(view, sessionKind, role)
        : view;

    savePersistedView(nextView);
    if (sessionKind && !PUBLIC_VIEWS.has(nextView)) {
      setLastAuthView(nextView);
      savePersistedSession({
        sessionKind,
        role,
        activeView: nextView,
        studentId: sessionKind === 'resident' ? activeStudentId : undefined,
        staffUser: sessionKind === 'staff' ? activeStaffUser : null,
      });
    }
    syncUrlHash(nextView, sessionKind, role);
    setActiveView(nextView);
    setIsMobileMenuOpen(false);
  };

  const handleLoginSuccess = (selRole: Role, meta?: LoginSuccessMeta) => {
    const resolvedKind: SessionKind =
      meta?.sessionKind ?? (selRole === 'student' ? 'resident' : 'owner');
    const resolvedRole: Role =
      resolvedKind === 'resident' ? 'student' : selRole;
    const resolvedStudentId =
      resolvedKind === 'resident' ? meta?.studentId || activeStudentId : undefined;
    const resolvedStaffUser =
      resolvedKind === 'staff' ? meta?.staffUser || activeStaffUser : null;
    const targetView = getDefaultViewForRole(resolvedRole);

    if (resolvedKind === 'resident' && resolvedStudentId) {
      setActiveStudentId(resolvedStudentId);
    }
    if (resolvedKind === 'staff' && resolvedStaffUser) {
      setActiveStaffUser(resolvedStaffUser);
    } else if (resolvedKind !== 'staff') {
      setActiveStaffUser(null);
    }

    savePersistedSession({
      sessionKind: resolvedKind,
      role: resolvedRole,
      activeView: targetView,
      studentId: resolvedStudentId,
      staffUser: resolvedStaffUser,
    });
    savePersistedView(targetView);
    syncUrlHash(targetView, resolvedKind, resolvedRole);

    needsStaffReconcileRef.current = false;
    setSessionKind(resolvedKind);
    setRole(resolvedRole);
    setLastAuthView(targetView);
    setActiveView(targetView);
  };

  const handleLogout = () => {
    needsStaffReconcileRef.current = false;
    clearPersistedSession();
    setIsMobileMenuOpen(false);
    setSelectedStudentDetailId(null);
    setSelectedRoomDetailId(null);
    setShowAddStudentModal(false);
    setShowAssignModal(false);
    setShowAddPaymentModal(false);
    setSessionKind(null);
    setActiveStaffUser(null);
    setActiveStudentId('');
    setRole('student');
    setActiveView('S00_LandingPage');
    syncUrlHash('S00_LandingPage', null, 'student');
  };

  // Modals state
  const [selectedStudentDetailId, setSelectedStudentDetailId] = useState<string | null>(null);
  const [selectedRoomDetailId, setSelectedRoomDetailId] = useState<string | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignInitialStudentId, setAssignInitialStudentId] = useState<string | undefined>(undefined);
  const [assignInitialRoomType, setAssignInitialRoomType] = useState<RoomType | undefined>(undefined);
  const [assignInitialRoomId, setAssignInitialRoomId] = useState<string | undefined>(undefined);
  const [assignInitialBedId, setAssignInitialBedId] = useState<string | undefined>(undefined);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [addPaymentInitialStudentId, setAddPaymentInitialStudentId] = useState<string | undefined>(undefined);

  const handleOpenCabinetOrLogin = () => {
    if (sessionKind) {
      handleNavigate(sanitizeViewForSession(lastAuthView, sessionKind, role));
      return;
    }
    handleNavigate('S01_Login');
  };

  // Unauthenticated / public screen states
  if (activeView === 'S00_LandingPage') {
    return (
      <S00_LandingPage
        onApplyNow={(roomType) => {
          setApplicationPrefillRoomType(roomType);
          handleNavigate('S03_OnlineApplication');
        }}
        onLoginClick={handleOpenCabinetOrLogin}
        onGoToLogin={handleOpenCabinetOrLogin}
      />
    );
  }

  if (activeView === 'S01_Login') {
    return (
      <S01_Login
        portalMode="student"
        onLoginSuccess={handleLoginSuccess}
        onGoToPublicApp={() => {
          setApplicationPrefillRoomType(undefined);
          handleNavigate('S03_OnlineApplication');
        }}
        onGoToLanding={() => {
          handleNavigate('S00_LandingPage');
        }}
      />
    );
  }

  if (activeView === 'S01_StaffLogin') {
    return (
      <S01_Login
        portalMode="staff"
        onLoginSuccess={handleLoginSuccess}
        onGoToPublicApp={() => {
          setApplicationPrefillRoomType(undefined);
          handleNavigate('S03_OnlineApplication');
        }}
        onGoToLanding={() => {
          handleNavigate('S00_LandingPage');
        }}
      />
    );
  }

  if (activeView === 'S03_OnlineApplication') {
    return (
      <S03_OnlineApplication
        initialRoomType={applicationPrefillRoomType}
        onSubmitted={() =>
          handleNavigate(
            sessionKind
              ? sanitizeViewForSession(lastAuthView, sessionKind, role)
              : 'S00_LandingPage'
          )
        }
        onBackToLogin={() =>
          handleNavigate(
            sessionKind
              ? sanitizeViewForSession(lastAuthView, sessionKind, role)
              : 'S00_LandingPage'
          )
        }
        onGoToLogin={handleOpenCabinetOrLogin}
      />
    );
  }

  // Render view router
  const renderCurrentView = () => {
    // Enforce student-only views for public student sessions
    if (!isStaffSession || role === 'student') {
      switch (activeView) {
        case 'S05_StudentDashboard':
          return <S05_StudentDashboard onNavigate={handleNavigate} />;
        case 'S06_StudentProfile':
          return <S06_StudentProfile />;
        case 'S07_StudentRoom':
          return <S07_StudentRoom />;
        case 'S08_StudentPayments':
          return <S08_StudentPayments />;
        case 'S09_StudentContract':
          return <S09_StudentContract />;
        case 'S90_Issues':
        case 'S100_Issues':
          return <S90_IssuesList />;
        default:
          return <S05_StudentDashboard onNavigate={handleNavigate} />;
      }
    }

    switch (activeView) {
      // Student Views
      case 'S05_StudentDashboard':
        return <S05_StudentDashboard onNavigate={handleNavigate} />;
      case 'S06_StudentProfile':
        return <S06_StudentProfile />;
      case 'S07_StudentRoom':
        return <S07_StudentRoom />;
      case 'S08_StudentPayments':
        return <S08_StudentPayments />;
      case 'S09_StudentContract':
        return <S09_StudentContract />;

      // Admin & Staff Views
      case 'S10_Dashboard':
        return (
          <S10_AdminDashboard
            onNavigate={handleNavigate}
            onSelectStudent={(id) => setSelectedStudentDetailId(id)}
            onOpenAddPaymentModal={(stdId) => {
              setAddPaymentInitialStudentId(stdId);
              setShowAddPaymentModal(true);
            }}
          />
        );
      case 'S20_Students':
        return (
          <S20_StudentsList
            onSelectStudent={(id) => setSelectedStudentDetailId(id)}
            onOpenAddModal={() => {
              if (role !== 'security') setShowAddStudentModal(true);
            }}
            onOpenAssignModal={
              role !== 'security'
                ? (stdId) => {
                    setAssignInitialStudentId(stdId);
                    setShowAssignModal(true);
                  }
                : undefined
            }
          />
        );
      case 'S30_Applications':
        return (
          <S30_ApplicationsList
            onOpenAssignModal={(appData, resolvedStudentId) => {
              const appPhoneKey = appData.phone ? normalizePhoneKey(appData.phone) : '';
              const matchingStd = students.find(
                (s) =>
                  (resolvedStudentId && s.id === resolvedStudentId) ||
                  (appData.studentId && s.id === appData.studentId) ||
                  (appData.passportNumber && s.passportNumber === appData.passportNumber) ||
                  (appPhoneKey.length >= 7 && normalizePhoneKey(s.phone) === appPhoneKey) ||
                  s.fullName === appData.fullName
              );
              setAssignInitialStudentId(resolvedStudentId || matchingStd?.id);
              setAssignInitialRoomType(appData.preferredRoomType);
              setShowAssignModal(true);
            }}
          />
        );
      case 'S40_Rooms':
        return <S40_FloorsAndRooms onSelectRoom={(rmId) => setSelectedRoomDetailId(rmId)} />;
      case 'S50_Payments':
        return (
          <S50_PaymentsList
            onOpenAddPaymentModal={(stdId) => {
              setAddPaymentInitialStudentId(stdId);
              setShowAddPaymentModal(true);
            }}
          />
        );
      case 'S60_Revenue':
        return <S60_RevenueDashboard />;
      case 'S70_Contracts':
        return <S70_ContractsList />;
      case 'S80_Employees':
        return <S80_EmployeesList />;
      case 'S90_Issues':
      case 'S100_Issues':
        return <S90_IssuesList />;
      case 'S100_Discipline':
        return <S100_DisciplineList />;
      case 'S110_Reports':
        return <S110_Reports />;
      case 'S120_Notifications':
        return <S120_NotificationsView />;
      case 'S130_Settings':
        return <S130_Settings />;
      case 'S140_AuditLog':
        return <S140_AuditLog />;
      case 'S150_AccessControl':
        return <S150_AccessControl />;
      case 'S00_LandingPage':
        return (
          <S00_LandingPage
            onApplyNow={(roomType) => {
              setApplicationPrefillRoomType(roomType);
              handleNavigate('S03_OnlineApplication');
            }}
            onLoginClick={() => handleNavigate('S01_Login')}
            onGoToLogin={() => handleNavigate('S01_Login')}
          />
        );

      default:
        return <S10_AdminDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col font-sans text-slate-900 antialiased selection:bg-[#C6A15B] selection:text-[#101C32] w-full max-w-full overflow-x-hidden">
      {/* Top Navigation Bar */}
      <Header
        activeView={activeView}
        setActiveView={handleNavigate}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        isStaffSession={isStaffSession}
        onLogout={handleLogout}
        onSearchSelect={(type, id) => {
          if (type === 'student') setSelectedStudentDetailId(id);
          else if (type === 'room') setSelectedRoomDetailId(id);
          else if (type === 'application') handleNavigate('S30_Applications');
        }}
      />

      <div className="flex-1 flex w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Left Sidebar & Responsive Mobile/Tablet Drawer */}
        <Sidebar
          activeView={activeView}
          setActiveView={handleNavigate}
          isMobileDrawerOpen={isMobileMenuOpen}
          onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
          isStaffSession={isStaffSession}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)] pb-32 sm:pb-20 w-full max-w-full min-w-0">
          {renderCurrentView()}
        </main>
      </div>

      {/* Interactive Telegram Bot Simulator Widget */}
      <TelegramBotWidget />

      {/* Global Modals - stacked in logical hierarchy */}
      {selectedRoomDetailId && (
        <S41_RoomDetailModal
          roomId={selectedRoomDetailId}
          onClose={() => setSelectedRoomDetailId(null)}
          onOpenAssignModal={
            role !== 'security'
              ? (rmId, bdId) => {
                  setAssignInitialRoomId(rmId);
                  setAssignInitialBedId(bdId);
                  setShowAssignModal(true);
                }
              : () => {}
          }
          onSelectStudent={(stdId) => {
            setSelectedStudentDetailId(stdId);
          }}
        />
      )}

      {selectedStudentDetailId && (
        <S21_StudentDetailModal
          studentId={selectedStudentDetailId}
          onClose={() => setSelectedStudentDetailId(null)}
          onOpenTransferModal={
            role !== 'security'
              ? (stdId) => {
                  setAssignInitialStudentId(stdId);
                  setShowAssignModal(true);
                }
              : () => {}
          }
          onOpenAddPaymentModal={
            role !== 'security'
              ? (stdId) => {
                  setAddPaymentInitialStudentId(stdId);
                  setShowAddPaymentModal(true);
                }
              : () => {}
          }
        />
      )}

      {role !== 'security' && showAssignModal && (
        <S43_AssignTransferBedModal
          initialStudentId={assignInitialStudentId}
          initialRoomType={assignInitialRoomType}
          initialRoomId={assignInitialRoomId}
          initialBedId={assignInitialBedId}
          onClose={() => {
            setShowAssignModal(false);
            setAssignInitialStudentId(undefined);
            setAssignInitialRoomType(undefined);
            setAssignInitialRoomId(undefined);
            setAssignInitialBedId(undefined);
          }}
          onOpenAddPaymentModal={(stdId) => {
            setAddPaymentInitialStudentId(stdId);
            setShowAddPaymentModal(true);
          }}
        />
      )}

      {role !== 'security' && showAddPaymentModal && (
        <S52_AddPaymentModal
          initialStudentId={addPaymentInitialStudentId}
          onClose={() => {
            setShowAddPaymentModal(false);
            setAddPaymentInitialStudentId(undefined);
          }}
        />
      )}

      {role !== 'security' && showAddStudentModal && (
        <S22_AddEditStudentModal
          onClose={() => setShowAddStudentModal(false)}
          onOpenAddPaymentModal={(stdId) => {
            setAddPaymentInitialStudentId(stdId);
            setShowAddPaymentModal(true);
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <I18nProvider>
      <DormProvider>
        <MainAppContent />
      </DormProvider>
    </I18nProvider>
  );
}

export default App;
