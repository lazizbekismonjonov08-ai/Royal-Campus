import React, { useState, useRef, useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Role } from '../types';
import {
  Search,
  Bell,
  ShieldCheck,
  ChevronDown,
  X,
  Check,
  Menu,
  LogOut,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  onSearchSelect?: (type: 'student' | 'room' | 'issue' | 'application', id: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  isStaffSession?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onSearchSelect,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  isStaffSession = false,
  onLogout,
}) => {
  const { role, setRole, activeStaffUser, notifications, markNotificationAsRead, students, rooms, issues, applications } = useDorm();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    if (showRoleMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRoleMenu]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifs]);

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  // Search results calculation
  const searchResults = (() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();
    const qClean = q.replace(/\s+/g, '');

    const matchedStudents = students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.passportNumber.toLowerCase().includes(q) ||
        s.passportNumber.replace(/\s+/g, '').toLowerCase().includes(qClean) ||
        (s.roomNumber && s.roomNumber.includes(q))
    ).slice(0, 4);

    // 1. Yangi: Arizalar ichidan ham qidirish qo'shildi
    const matchedApplications = applications.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.passportNumber.toLowerCase().includes(q) ||
        a.passportNumber.replace(/\s+/g, '').toLowerCase().includes(qClean) ||
        a.university.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedRooms = rooms.filter((r) => r.roomNumber.includes(q)).slice(0, 3);
    const matchedIssues = issues.filter(
      (i) => i.description.toLowerCase().includes(q) || (i.roomNumber && i.roomNumber.includes(q))
    ).slice(0, 3);

    return { 
      students: matchedStudents, 
      applications: matchedApplications, 
      rooms: matchedRooms, 
      issues: matchedIssues 
    };
  })();

  const rolesList: { key: Role; labelKey: string; descKey: string }[] = [
    { key: 'owner', labelKey: 'role.owner', descKey: 'role.owner.desc' },
    { key: 'manager', labelKey: 'role.manager', descKey: 'role.manager.desc' },
    { key: 'student', labelKey: 'role.student', descKey: 'role.student.desc' },
    { key: 'receptionist', labelKey: 'role.receptionist', descKey: 'role.receptionist.desc' },
    { key: 'security', labelKey: 'role.security', descKey: 'role.security.desc' },
    { key: 'cleaner', labelKey: 'role.cleaner', descKey: 'role.cleaner.desc' },
  ];

  const currentRoleItem = rolesList.find((r) => r.key === role) || rolesList[0];

  const renderSearchResultsDropdown = () => {
    if (!searchResults) return null;
    return (
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs max-h-80 overflow-y-auto">
        {searchResults.students.length === 0 && searchResults.applications.length === 0 && searchResults.rooms.length === 0 && searchResults.issues.length === 0 ? (
          <div className="p-3 text-center text-slate-400">{t('header.noResults')}</div>
        ) : (
          <>
            {searchResults.students.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('nav.students')}
                </div>
                {searchResults.students.map((std) => (
                  <button
                    key={std.id}
                    onClick={() => {
                      if (onSearchSelect) onSearchSelect('student', std.id);
                      setSearchQuery('');
                      setShowMobileSearch(false);
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between group cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-sky-600">{std.fullName}</span>
                    <span className="text-[11px] text-slate-500">
                      {t('common.room')} {std.roomNumber || '---'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searchResults.applications.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('nav.applications') || 'Arizalar'}
                </div>
                {searchResults.applications.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      if (onSearchSelect) onSearchSelect('application', app.id);
                      setActiveView('S30_Applications');
                      setSearchQuery('');
                      setShowMobileSearch(false);
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">{app.fullName}</span>
                    <span className="text-[11px] text-[#C6A15B] font-medium">Ariza ({app.status})</span>
                  </button>
                ))}
              </div>
            )}
            {searchResults.rooms.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('nav.rooms')}
                </div>
                {searchResults.rooms.map((rm) => (
                  <button
                    key={rm.id}
                    onClick={() => {
                      if (onSearchSelect) onSearchSelect('room', rm.id);
                      setSearchQuery('');
                      setShowMobileSearch(false);
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">
                      {t('common.room')} {rm.roomNumber} ({t(`rooms.${rm.type}`)})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {rm.floor}-{t('common.floor')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 px-2.5 sm:px-6 flex items-center justify-between shadow-xs w-full max-w-full">
      {/* Zone 1: Mobile Menu Button, Logo & Title */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label={isMobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
          className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] -ml-1 text-slate-700 hover:text-[#101C32] hover:bg-[#F7F5F0] rounded-xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#C6A15B] transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <BrandLogo theme="light" size="md" responsive={true} />
      </div>

      {/* Zone 2: Global Search Bar (Desktop) - faqat Talaba bo'lmagan foydalanuvchilarga ko'rinadi */}
      {role !== 'student' && (
        <div className="relative hidden md:block w-40 lg:w-72 xl:w-88 mx-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('header.searchPlaceholder')}
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs pl-9 pr-8 py-2 rounded-lg border border-transparent focus:border-slate-300 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Desktop Search Dropdown */}
          {searchResults && (
            <div className="absolute top-11 left-0 right-0 z-50">
              {renderSearchResultsDropdown()}
            </div>
          )}
        </div>
      )}

      {/* Zone 3: Actions & Mobile Search Icon */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Mobile Search Icon Button - faqat Talaba bo'lmagan foydalanuvchilar uchun */}
        {role !== 'student' && (
          <button
            type="button"
            onClick={() => setShowMobileSearch(true)}
            className="md:hidden w-10 h-10 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer"
            aria-label={t('common.search')}
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* Language Selector */}
        <LanguageSwitcher variant="header" />

        {/* Dashboard / Role Selector (Owner can switch roles; logged-in staff see their name & role badge; students see Student badge) */}
        {isStaffSession && activeStaffUser ? (
          <div className="flex items-center gap-2 bg-[#101C32] text-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#C6A15B]/40 shadow-2xs min-h-[36px] max-w-[220px] sm:max-w-[280px]">
            <ShieldCheck className="w-4 h-4 text-[#C6A15B] shrink-0" />
            <div className="min-w-0 leading-tight">
              <div className="font-bold text-[11px] sm:text-xs text-white truncate">
                {activeStaffUser.fullName}
              </div>
              <div className="text-[10px] text-[#E5D5AA] font-semibold truncate">
                {activeStaffUser.roleTitle}
              </div>
            </div>
          </div>
        ) : isStaffSession ? (
          <div ref={roleMenuRef} className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setShowRoleMenu((prev) => !prev)}
              className="flex items-center gap-1 sm:gap-2 bg-white hover:bg-slate-50 text-slate-800 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-slate-200 hover:border-slate-300 shadow-2xs cursor-pointer min-h-[36px]"
            >
              <ShieldCheck className="w-4 h-4 text-[#C6A15B] shrink-0" />
              <span className="font-semibold text-xs text-slate-900">
                {t(currentRoleItem.labelKey)}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ${
                  showRoleMenu ? 'rotate-180 text-slate-600' : ''
                }`}
              />
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-50 text-xs">
                <div className="px-2.5 py-1.5 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>{t('header.roleSelect')}</span>
                  <span className="text-[10px] text-[#C6A15B] bg-[#101C32] px-1.5 py-0.5 rounded font-bold">
                    {t(currentRoleItem.labelKey)}
                  </span>
                </div>
                <div className="py-1 space-y-0.5">
                  {rolesList.map((r) => {
                    const isSelected = role === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => {
                          setRole(r.key);
                          if (r.key === 'student') setActiveView('S05_StudentDashboard');
                          else if (r.key === 'security') setActiveView('S150_AccessControl');
                          else if (r.key === 'cleaner') setActiveView('S40_Rooms');
                          else if (r.key === 'receptionist') setActiveView('S20_Students');
                          else setActiveView('S10_Dashboard');
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#101C32] text-white font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className={`font-medium text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {t(r.labelKey)}
                          </div>
                          <div className={`text-[10px] font-normal ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {t(r.descKey)}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#C6A15B] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#F7F5F0] text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#C6A15B]/30 min-h-[36px]">
            <ShieldCheck className="w-4 h-4 text-[#C6A15B] shrink-0" />
            <span className="font-semibold text-xs text-slate-900">{t('role.student')}</span>
          </div>
        )}

        {/* Notifications Popover */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-10 h-10 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title={t('header.notifications')}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C6A15B] ring-2 ring-white"></span>
            )}
          </button>
          {showNotifs && (
            <div className="fixed inset-x-2.5 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 w-auto sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-1">
                <span className="font-bold text-[#101C32]">{t('header.notifications')}</span>
                <span className="text-[10px] bg-[#101C32] px-2 py-0.5 rounded-full text-[#C6A15B] font-semibold">
                  {t('header.newNotifs', { count: unreadNotifs.length })}
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {notifications.length === 0 ? (
                  <p className="p-3 text-center text-slate-400 text-xs">{t('header.noNotifs')}</p>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-[#F7F5F0] border-l-2 border-[#C6A15B]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-semibold text-slate-900 text-xs flex justify-between">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{n.date.slice(11, 16)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sign Out */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title={t('common.logout')}
            aria-label={t('common.logout')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{t('common.logout')}</span>
          </button>
        )}
      </div>

      {/* Mobile Fullscreen Search Overlay - faqat Talaba bo'lmagan foydalanuvchilarga ko'rinadi */}
      {role !== 'student' && showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col md:hidden animate-in fade-in duration-150">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('header.searchPlaceholder')}
                className="w-full bg-slate-100 text-xs pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setShowMobileSearch(false);
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              {t('common.cancel')}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderSearchResultsDropdown()}
          </div>
        </div>
      )}
    </header>
  );
};
