import React, { useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Building,
  CreditCard,
  TrendingUp,
  FileText,
  UserCheck,
  Wrench,
  AlertTriangle,
  BarChart3,
  Bell,
  Settings,
  History,
  ExternalLink,
  User,
  BedDouble,
  Receipt,
  FileCheck2,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { ModalCloseButton } from './ModalCloseButton';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Role } from '../types';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  isStaffSession?: boolean;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
  isStaffSession = false,
  onLogout,
}) => {
  const { role, setRole, currentUserName } = useDorm();
  const { t } = useI18n();

  const isStudent = role === 'student';

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileDrawerOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        onCloseMobileDrawer?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen, onCloseMobileDrawer]);

  // Admin Navigation Links filtered by Role
  const navItems = [
    {
      id: 'S10_Dashboard',
      labelKey: 'nav.dashboard',
      icon: LayoutDashboard,
      roles: ['owner', 'manager'],
    },
    {
      id: 'S20_Students',
      labelKey: 'nav.students',
      icon: Users,
      roles: ['owner', 'manager', 'receptionist', 'security'],
    },
    {
      id: 'S30_Applications',
      labelKey: 'nav.applications',
      icon: ClipboardList,
      roles: ['owner', 'manager', 'receptionist'],
    },
    {
      id: 'S40_Rooms',
      labelKey: 'nav.rooms',
      icon: Building,
      roles: ['owner', 'manager', 'receptionist', 'security', 'cleaner'],
    },
    {
      id: 'S50_Payments',
      labelKey: 'nav.payments',
      icon: CreditCard,
      roles: ['owner', 'manager', 'receptionist'],
    },
    {
      id: 'S60_Revenue',
      labelKey: 'nav.revenue',
      icon: TrendingUp,
      roles: ['owner', 'manager'],
    },
    {
      id: 'S70_Contracts',
      labelKey: 'nav.contracts',
      icon: FileText,
      roles: ['owner', 'manager', 'receptionist'],
    },
    {
      id: 'S80_Employees',
      labelKey: 'nav.employees',
      icon: UserCheck,
      roles: ['owner', 'manager'],
    },
    {
      id: 'S90_Issues',
      labelKey: 'nav.issues',
      icon: Wrench,
      roles: ['owner', 'manager', 'receptionist', 'security', 'cleaner'],
    },
    {
      id: 'S100_Discipline',
      labelKey: 'nav.discipline',
      icon: AlertTriangle,
      roles: ['owner', 'manager'],
    },
    {
      id: 'S110_Reports',
      labelKey: 'nav.reports',
      icon: BarChart3,
      roles: ['owner', 'manager'],
    },
    {
      id: 'S120_Notifications',
      labelKey: 'nav.notifications',
      icon: Bell,
      roles: ['owner', 'manager', 'receptionist', 'security', 'cleaner'],
    },
    {
      id: 'S150_AccessControl',
      labelKey: 'nav.accessControl',
      icon: ShieldCheck,
      roles: ['owner', 'manager', 'security', 'receptionist'],
    },
    {
      id: 'S130_Settings',
      labelKey: 'nav.settings',
      icon: Settings,
      roles: ['owner'],
    },
    {
      id: 'S140_AuditLog',
      labelKey: 'nav.auditLog',
      icon: History,
      roles: ['owner'],
    },
  ];

  // Student Navigation Links
  const studentNavItems = [
    {
      id: 'S05_StudentDashboard',
      labelKey: 'nav.student.home',
      icon: LayoutDashboard,
    },
    {
      id: 'S06_StudentProfile',
      labelKey: 'nav.student.profile',
      icon: User,
    },
    {
      id: 'S07_StudentRoom',
      labelKey: 'nav.student.room',
      icon: BedDouble,
    },
    {
      id: 'S08_StudentPayments',
      labelKey: 'nav.student.payments',
      icon: Receipt,
    },
    {
      id: 'S09_StudentContract',
      labelKey: 'nav.student.contract',
      icon: FileCheck2,
    },
    {
      id: 'S90_Issues',
      labelKey: 'nav.student.issues',
      icon: Wrench,
    },
  ];

  const visibleItems = isStudent
    ? studentNavItems
    : navItems.filter((item) => item.roles.includes(role));

  const renderNavList = (isDrawer = false) => (
    <div className="p-3 space-y-1">
      <div className="px-3 py-2 text-[10px] font-bold text-[#C6A15B] uppercase tracking-wider">
        {isStudent ? t('nav.studentPortal') : t('nav.adminPortal')}
      </div>

      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id);
              if (isDrawer && onCloseMobileDrawer) {
                onCloseMobileDrawer();
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? 'bg-[#C6A15B] text-[#101C32] shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#1A2D4F]'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#101C32]' : 'text-[#C6A15B]'}`} />
            <span className="truncate">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );

  const renderBottomBanner = (isDrawer = false) => (
    <div className="p-3 border-t border-[#1A2D4F] space-y-2.5">
      {isDrawer && (
        <>
          {/* Mobile Drawer Language Switcher */}
          <div className="pb-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">{t('common.language')}:</span>
            <LanguageSwitcher variant="minimal" dropdownDirection="up" />
          </div>

          {/* Mobile Drawer Role Switcher (Staff session only) */}
          {isStaffSession && (
            <div className="py-2 border-t border-[#1A2D4F] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('header.roleSelect')}:</span>
                <span className="text-[10px] font-bold text-[#C6A15B] bg-[#0A1220] px-2 py-0.5 rounded border border-[#C6A15B]/30">
                  {t(`role.${role}`)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {(['owner', 'manager', 'receptionist', 'security', 'cleaner', 'student'] as Role[]).map((rKey) => (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => {
                      setRole(rKey);
                      if (rKey === 'student') {
                        setActiveView('S05_StudentDashboard');
                      } else if (rKey === 'security') {
                        setActiveView('S150_AccessControl');
                      } else if (rKey === 'cleaner') {
                        setActiveView('S40_Rooms');
                      } else if (rKey === 'receptionist') {
                        setActiveView('S20_Students');
                      } else {
                        setActiveView('S10_Dashboard');
                      }
                      if (onCloseMobileDrawer) onCloseMobileDrawer();
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center transition-colors cursor-pointer border leading-tight ${
                      role === rKey
                        ? 'bg-[#C6A15B] text-[#101C32] font-bold border-[#C6A15B]'
                        : 'bg-[#1A2D4F] text-slate-300 border-[#C6A15B]/20 hover:bg-[#223963]'
                    }`}
                  >
                    {t(`role.${rKey}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="space-y-1.5">
        <button
          onClick={() => {
            setActiveView('S00_LandingPage');
            if (isDrawer && onCloseMobileDrawer) {
              onCloseMobileDrawer();
            }
          }}
          className="w-full bg-[#1A2D4F] hover:bg-[#223963] text-slate-200 hover:text-white p-2.5 rounded-xl border border-[#C6A15B]/30 flex items-center justify-between text-xs font-medium transition-colors group shadow-xs cursor-pointer"
        >
          <div className="text-left">
            <div className="font-semibold text-[#C6A15B] text-[11px]">{t('login.homeLink')}</div>
            <div className="text-[10px] text-slate-400">{t('login.homeDesc')}</div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#C6A15B] group-hover:text-white shrink-0" />
        </button>

        <button
          onClick={() => {
            setActiveView('S03_OnlineApplication');
            if (isDrawer && onCloseMobileDrawer) {
              onCloseMobileDrawer();
            }
          }}
          className="w-full bg-[#1A2D4F]/50 hover:bg-[#1A2D4F] text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs transition-colors group cursor-pointer"
        >
          <span className="text-[11px] font-medium">{t('app.title')}</span>
          <span className="text-[10px] text-[#C6A15B]">→</span>
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={() => {
              if (isDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
              onLogout();
            }}
            className="w-full bg-[#0A1220]/70 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 p-2 rounded-xl border border-slate-700/60 hover:border-rose-500/40 flex items-center justify-between text-xs transition-colors cursor-pointer"
          >
            <span className="text-[11px] font-medium">{t('common.logout')}</span>
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {isDrawer && (
        <div className="pt-2 border-t border-[#1A2D4F] flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-[#0A1220] text-[#C6A15B] border border-[#C6A15B]/40 flex items-center justify-center font-bold text-xs shrink-0">
            {currentUserName ? currentUserName.charAt(0) : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">{currentUserName}</div>
            <div className="text-[10px] text-[#C6A15B] font-semibold">{t(`role.${role}`)}</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside className="w-60 shrink-0 bg-[#101C32] border-r border-[#C6A15B]/15 text-slate-300 hidden lg:flex flex-col justify-between min-h-[calc(100vh-4rem)]">
        {renderNavList(false)}
        {renderBottomBanner(false)}
      </aside>

      {/* Mobile & Tablet Navigation Drawer (< 1024px) */}
      {isMobileDrawerOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.adminPortal')}
          className="fixed inset-0 z-[70] lg:hidden flex"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-[#0A1220]/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="relative w-72 max-w-[85vw] bg-[#101C32] border-r border-[#C6A15B]/20 text-slate-300 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header with Title and Close Button */}
            <div className="h-16 px-4 border-b border-[#1A2D4F] flex items-center justify-between shrink-0">
              <BrandLogo theme="dark" size="sm" showSubtitle={false} />

              <ModalCloseButton
                onClose={onCloseMobileDrawer || (() => {})}
                variant="dark"
                size="sm"
                ariaLabel={t('common.close')}
                title={`${t('common.close')} (Esc)`}
              />
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto">
              {renderNavList(true)}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="shrink-0">
              {renderBottomBanner(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
