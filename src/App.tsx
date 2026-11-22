import React, { useState } from 'react';
import { DormProvider, useDorm } from './context/DormContext';
import { I18nProvider } from './i18n/I18nContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TelegramBotWidget } from './components/TelegramBotWidget';

// Views
import { RoomType } from './types';
import { S00_LandingPage } from './views/S00_LandingPage';
import { S01_Login } from './views/S01_Login';
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
  const { role, students } = useDorm();
  const [activeView, setActiveView] = useState<string>('S10_Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [applicationPrefillRoomType, setApplicationPrefillRoomType] = useState<RoomType | undefined>(undefined);

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  // Modals state
  const [selectedStudentDetailId, setSelectedStudentDetailId] = useState<string | null>(null);
  const [selectedRoomDetailId, setSelectedRoomDetailId] = useState<string | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignInitialStudentId, setAssignInitialStudentId] = useState<string | undefined>(undefined);
  const [assignInitialRoomId, setAssignInitialRoomId] = useState<string | undefined>(undefined);
  const [assignInitialBedId, setAssignInitialBedId] = useState<string | undefined>(undefined);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [addPaymentInitialStudentId, setAddPaymentInitialStudentId] = useState<string | undefined>(undefined);

  // Unauthenticated screen states
  if (activeView === 'S00_LandingPage') {
    return (
      <S00_LandingPage
        onApplyNow={(roomType) => {
          setApplicationPrefillRoomType(roomType);
          setActiveView('S03_OnlineApplication');
        }}
        onLoginClick={() => setActiveView('S01_Login')}
        onGoToLogin={() => setActiveView('S01_Login')}
      />
    );
  }

  if (activeView === 'S01_Login') {
    return (
      <S01_Login
        onLoginSuccess={(selRole) => {
          if (selRole === 'student') setActiveView('S05_StudentDashboard');
          else setActiveView('S10_Dashboard');
        }}
        onGoToPublicApp={() => {
          setApplicationPrefillRoomType(undefined);
          setActiveView('S03_OnlineApplication');
        }}
        onGoToLanding={() => setActiveView('S00_LandingPage')}
      />
    );
  }

  if (activeView === 'S03_OnlineApplication') {
    return (
      <S03_OnlineApplication
        initialRoomType={applicationPrefillRoomType}
        onSubmitted={() => setActiveView('S00_LandingPage')}
        onBackToLogin={() => setActiveView('S00_LandingPage')}
      />
    );
  }

  // Render view router
  const renderCurrentView = () => {
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
            onOpenAssignModal={(appData) => {
              const matchingStd = students.find(
                (s) => s.passportNumber === appData.passportNumber || s.fullName === appData.fullName
              );
              setAssignInitialStudentId(matchingStd?.id);
              setShowAssignModal(true);
            }}
          />
        );
      case 'S40_Rooms':
        return <S40_FloorsAndRooms onSelectRoom={(rmId) => setSelectedRoomDetailId(rmId)} />;
      case 'S50_Payments':
        return (
          <S50_PaymentsList
            onOpenAddPaymentModal={() => {
              setAddPaymentInitialStudentId(undefined);
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
        return role === 'student' ? (
          <S05_StudentDashboard onNavigate={handleNavigate} />
        ) : (
          <S10_AdminDashboard onNavigate={handleNavigate} />
        );
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
          initialRoomId={assignInitialRoomId}
          initialBedId={assignInitialBedId}
          onClose={() => {
            setShowAssignModal(false);
            setAssignInitialStudentId(undefined);
            setAssignInitialRoomId(undefined);
            setAssignInitialBedId(undefined);
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
        <S22_AddEditStudentModal onClose={() => setShowAddStudentModal(false)} />
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
