import React, { useEffect, useMemo, useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { StaffUser } from '../types';
import {
  generateStrongStaffPassword,
  validateStrongPassword,
} from '../utils/authCrypto';
import { ModalCloseButton } from '../components/ModalCloseButton';
import {
  UserPlus,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Power,
  Search,
  RefreshCw,
  CheckCircle2,
  Circle,
  AlertCircle,
  Lock,
  Sparkles,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';

export const S80_EmployeesList: React.FC = () => {
  const {
    role,
    activeStaffUser,
    staffUsers,
    refreshStaffUsers,
    addStaffUser,
    updateStaffUser,
    toggleStaffUserActive,
    deleteStaffUser,
  } = useDorm();
  const { t } = useI18n();

  const isOwner = role === 'owner' && !activeStaffUser;

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  // Add / Edit Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const rolePresets = useMemo(
    () => [
      t('employees.presetAdmin'),
      t('employees.presetReception'),
      t('employees.presetAccountant'),
      t('employees.presetSecurity'),
      t('employees.presetCleaner'),
    ],
    [t]
  );

  // Refresh staff list from Supabase on mount when Owner opens this section
  useEffect(() => {
    if (isOwner) {
      void refreshStaffUsers();
    }
  }, [isOwner, refreshStaffUsers]);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Close active modals on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteTarget && !isDeleting) setDeleteTarget(null);
        else if (modalMode && !isSubmitting) closeFormModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTarget, isDeleting, modalMode, isSubmitting]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      // Clipboard write unavailable in restricted context
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingStaff(null);
    setFullName('');
    setRoleTitle(rolePresets[0] || 'Administrator');
    setLogin('');
    setPassword('');
    setIsActive(true);
    setShowFormPassword(true);
    setFormError(null);
  };

  const openEditModal = (staff: StaffUser) => {
    setModalMode('edit');
    setEditingStaff(staff);
    setFullName(staff.fullName);
    setRoleTitle(staff.roleTitle);
    setLogin(staff.login);
    setPassword('');
    setIsActive(staff.isActive);
    setShowFormPassword(false);
    setFormError(null);
  };

  const closeFormModal = () => {
    setModalMode(null);
    setEditingStaff(null);
    setPassword('');
    setFormError(null);
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongStaffPassword(12);
    setPassword(generated);
    setShowFormPassword(true);
    setFormError(null);
  };

  const passwordCheck = useMemo(() => validateStrongPassword(password), [password]);
  const shouldCheckPassword = modalMode === 'add' || password.length > 0;

  const mapErrorCodeToMessage = (errorCode?: string, fallback?: string): string => {
    switch (errorCode) {
      case 'missing_fields':
        return t('employees.errMissingFields');
      case 'duplicate_login':
        return t('employees.errDuplicateLogin');
      case 'reserved_login':
        return t('employees.errReservedLogin');
      case 'weak_password':
        return t('employees.errWeakPassword');
      case 'unauthorized':
        return t('employees.ownerOnlyDesc');
      default:
        return fallback ? `${t('employees.errSyncFailed')} (${fallback})` : t('employees.errSyncFailed');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = fullName.trim();
    const trimmedRole = roleTitle.trim();
    const trimmedLogin = login.trim();

    if (!trimmedName || !trimmedRole || !trimmedLogin || (modalMode === 'add' && !password)) {
      setFormError(t('employees.errMissingFields'));
      return;
    }

    if (shouldCheckPassword && !passwordCheck.isValid) {
      setFormError(t('employees.errWeakPassword'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await addStaffUser({
          fullName: trimmedName,
          roleTitle: trimmedRole,
          login: trimmedLogin,
          password,
          isActive,
        });
        if (!res.success) {
          setFormError(mapErrorCodeToMessage(res.errorCode, res.errorMessage));
          return;
        }
        closeFormModal();
        showToast(t('employees.savedToast'));
      } else if (modalMode === 'edit' && editingStaff) {
        const res = await updateStaffUser(editingStaff.id, {
          fullName: trimmedName,
          roleTitle: trimmedRole,
          login: trimmedLogin,
          ...(password ? { password } : {}),
          isActive,
        });
        if (!res.success) {
          setFormError(mapErrorCodeToMessage(res.errorCode, res.errorMessage));
          return;
        }
        closeFormModal();
        showToast(t('employees.updatedToast'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (staff: StaffUser) => {
    setBusyRowId(staff.id);
    try {
      const res = await toggleStaffUserActive(staff.id);
      if (res.success) {
        showToast(t('employees.statusChangedToast'));
      }
    } finally {
      setBusyRowId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteStaffUser(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        showToast(t('employees.deletedToast'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStaffUsers();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return staffUsers;
    return staffUsers.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.roleTitle.toLowerCase().includes(q) ||
        s.login.toLowerCase().includes(q)
    );
  }, [staffUsers, searchQuery]);

  const activeCount = useMemo(
    () => staffUsers.filter((s) => s.isActive).length,
    [staffUsers]
  );
  const inactiveCount = staffUsers.length - activeCount;

  // Owner-only access guard
  if (!isOwner) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#101C32] text-[#C6A15B] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#101C32]">{t('employees.ownerOnlyTitle')}</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">{t('employees.ownerOnlyDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Inline Success Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[80] bg-[#101C32] text-white border border-[#C6A15B]/50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C6A15B] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#101C32] text-[#C6A15B] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#101C32] truncate">
              {t('employees.title')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t('employees.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('employees.refreshBtn')}</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-[#101C32] hover:bg-[#1A2D4F] text-[#E5D5AA] hover:text-white border border-[#C6A15B]/50 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#C6A15B]" />
            <span>{t('employees.addEmployee')}</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('employees.totalCount')}
            </p>
            <p className="text-2xl font-bold text-[#101C32] mt-1 font-mono tabular-nums">
              {staffUsers.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#101C32] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('employees.activeCount')}
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono tabular-nums">
              {activeCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('employees.inactiveCount')}
            </p>
            <p className="text-2xl font-bold text-rose-700 mt-1 font-mono tabular-nums">
              {inactiveCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('employees.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
          />
        </div>
      </div>

      {/* Staff List (Empty State / Desktop Table / Mobile Cards) */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F5F0] text-[#9A7432] border border-[#C6A15B]/30 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#101C32]">{t('employees.emptyTitle')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{t('employees.emptyDesc')}</p>
          {staffUsers.length === 0 && (
            <button
              type="button"
              onClick={openAddModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-[#101C32] hover:bg-[#1A2D4F] text-[#E5D5AA] text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4 text-[#C6A15B]" />
              <span>{t('employees.addEmployee')}</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">{t('employees.name')}</th>
                    <th className="py-3.5 px-4">{t('employees.role')}</th>
                    <th className="py-3.5 px-4">{t('employees.login')}</th>
                    <th className="py-3.5 px-4">{t('employees.password')}</th>
                    <th className="py-3.5 px-4">{t('employees.status')}</th>
                    <th className="py-3.5 px-4">{t('employees.createdAt')}</th>
                    <th className="py-3.5 px-4 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((staff) => {
                    const isPassVisible = Boolean(visiblePasswordIds[staff.id]);
                    const isBusy = busyRowId === staff.id;
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#101C32] text-[#C6A15B] border border-[#C6A15B]/30 flex items-center justify-center font-bold text-xs shrink-0">
                              {(staff.fullName || 'X').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900">{staff.fullName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F7F5F0] text-[#101C32] border border-[#C6A15B]/30 font-semibold text-[11px]">
                            {staff.roleTitle}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <code className="px-2 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px]">
                              {staff.login}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopy(staff.login, `login-${staff.id}`)}
                              title={t('employees.copy')}
                              className="p-1.5 text-slate-400 hover:text-[#101C32] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            >
                              {copiedKey === `login-${staff.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <code className="px-2 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] min-w-[112px]">
                              {isPassVisible ? staff.password : '••••••••••••'}
                            </code>
                            <button
                              type="button"
                              onClick={() =>
                                setVisiblePasswordIds((prev) => ({
                                  ...prev,
                                  [staff.id]: !prev[staff.id],
                                }))
                              }
                              title={
                                isPassVisible
                                  ? t('employees.hidePassword')
                                  : t('employees.showPassword')
                              }
                              className="p-1.5 text-slate-400 hover:text-[#101C32] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            >
                              {isPassVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(staff.password, `pw-${staff.id}`)}
                              title={t('employees.copy')}
                              className="p-1.5 text-slate-400 hover:text-[#101C32] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            >
                              {copiedKey === `pw-${staff.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                              staff.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                staff.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {staff.isActive ? t('employees.active') : t('employees.disabled')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {staff.createdAt}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(staff)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-[#101C32] text-slate-700 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>{t('employees.editAction')}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleActive(staff)}
                              title={
                                staff.isActive
                                  ? t('employees.deactivate')
                                  : t('employees.activate')
                              }
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                                staff.isActive
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(staff)}
                              title={t('employees.deleteAction')}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredStaff.map((staff) => {
              const isPassVisible = Boolean(visiblePasswordIds[staff.id]);
              const isBusy = busyRowId === staff.id;
              return (
                <div
                  key={staff.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#101C32] text-[#C6A15B] flex items-center justify-center font-bold text-xs shrink-0">
                        {(staff.fullName || 'X').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {staff.fullName}
                        </div>
                        <div className="text-[11px] font-semibold text-[#9A7432]">
                          {staff.roleTitle}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                        staff.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {staff.isActive ? t('employees.active') : t('employees.disabled')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">{t('employees.login')}:</span>
                      <div className="flex items-center gap-1">
                        <code className="font-mono text-slate-900 font-semibold">
                          {staff.login}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(staff.login, `m-login-${staff.id}`)}
                          className="p-1 text-slate-500 hover:text-[#101C32] cursor-pointer"
                        >
                          {copiedKey === `m-login-${staff.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">{t('employees.password')}:</span>
                      <div className="flex items-center gap-1">
                        <code className="font-mono text-slate-900 font-semibold">
                          {isPassVisible ? staff.password : '••••••••••••'}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            setVisiblePasswordIds((prev) => ({
                              ...prev,
                              [staff.id]: !prev[staff.id],
                            }))
                          }
                          className="p-1 text-slate-500 hover:text-[#101C32] cursor-pointer"
                        >
                          {isPassVisible ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(staff.password, `m-pw-${staff.id}`)}
                          className="p-1 text-slate-500 hover:text-[#101C32] cursor-pointer"
                        >
                          {copiedKey === `m-pw-${staff.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(staff)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#101C32] text-slate-800 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{t('employees.editAction')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleActive(staff)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-50 ${
                        staff.isActive
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {staff.isActive ? t('employees.deactivate') : t('employees.activate')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(staff)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer"
                      aria-label={t('employees.deleteAction')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Staff Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 bg-[#0A1220]/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => {
            if (!isSubmitting) closeFormModal();
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#C6A15B]/30 overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#101C32] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <KeyRound className="w-5 h-5 text-[#C6A15B] shrink-0" />
                <h2 className="font-bold text-sm sm:text-base truncate">
                  {modalMode === 'add'
                    ? t('employees.modalTitle')
                    : t('employees.editModalTitle')}
                </h2>
              </div>
              <ModalCloseButton
                onClose={closeFormModal}
                variant="dark"
                size="sm"
                ariaLabel={t('common.close')}
              />
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {t('employees.name')} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder={t('employees.namePlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                />
              </div>

              {/* Role / Position with quick presets */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {t('employees.role')} *
                </label>
                <input
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => {
                    setRoleTitle(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder={t('employees.rolePlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {rolePresets.map((preset) => {
                    const isSelected = roleTitle.trim().toLowerCase() === preset.toLowerCase();
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRoleTitle(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#101C32] text-[#E5D5AA] border-[#C6A15B]'
                            : 'bg-slate-50 hover:bg-[#F7F5F0] text-slate-700 border-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Username */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {t('employees.login')} *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={login}
                  onChange={(e) => {
                    setLogin(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder={t('employees.loginPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                />
              </div>

              {/* Strong Password Field + Generate & Copy Helpers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="font-semibold text-slate-700">
                    {modalMode === 'add'
                      ? `${t('employees.password')} *`
                      : t('employees.newPasswordOptional')}
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F5F0] hover:bg-[#EFE9DC] text-[#9A7432] border border-[#C6A15B]/40 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>{t('employees.generatePassword')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      required={modalMode === 'add'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder={
                        modalMode === 'add'
                          ? t('employees.passwordPlaceholder')
                          : t('employees.leaveBlankPassword')
                      }
                      className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword((v) => !v)}
                      aria-label={
                        showFormPassword
                          ? t('employees.hidePassword')
                          : t('employees.showPassword')
                      }
                      className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showFormPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!password}
                    onClick={() => handleCopy(password, 'modal-pw')}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shrink-0 transition-colors"
                  >
                    {copiedKey === 'modal-pw' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{t('employees.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('employees.copy')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Strong Password Checklist */}
                {shouldCheckPassword && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        {t('employees.pwRulesTitle')}
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono ${
                          passwordCheck.isValid ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {passwordCheck.score}/5
                      </span>
                    </div>

                    {/* Strength bar */}
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 rounded-full transition-colors ${
                            passwordCheck.score >= step
                              ? passwordCheck.isValid
                                ? 'bg-emerald-500'
                                : 'bg-amber-400'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {[
                        { ok: passwordCheck.minLength, label: t('employees.pwRuleLength') },
                        { ok: passwordCheck.hasUppercase, label: t('employees.pwRuleUpper') },
                        { ok: passwordCheck.hasLowercase, label: t('employees.pwRuleLower') },
                        { ok: passwordCheck.hasNumber, label: t('employees.pwRuleNumber') },
                        { ok: passwordCheck.hasSymbol, label: t('employees.pwRuleSymbol') },
                      ].map((rule) => (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-1.5 ${
                            rule.ok ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {rule.ok ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span>{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">{t('employees.status')}</div>
                  <div className="text-[11px] text-slate-500">
                    {isActive ? t('employees.active') : t('employees.disabled')}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    isActive ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={closeFormModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (shouldCheckPassword && !passwordCheck.isValid)}
                  className="px-5 py-2.5 bg-[#101C32] hover:bg-[#1A2D4F] text-[#E5D5AA] hover:text-white border border-[#C6A15B]/50 font-bold rounded-xl shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-[#0A1220]/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => {
            if (!isDeleting) setDeleteTarget(null);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>{t('employees.deleteConfirmTitle')}</span>
              </div>
              <ModalCloseButton
                onClose={() => {
                  if (!isDeleting) setDeleteTarget(null);
                }}
                variant="light"
                size="sm"
                ariaLabel={t('common.close')}
              />
            </div>

            <div className="p-6 space-y-5 text-xs">
              <p className="text-slate-700 leading-relaxed">
                {t('employees.deleteConfirmDesc', {
                  name: deleteTarget.fullName,
                  login: deleteTarget.login,
                })}
              </p>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                >
                  {t('employees.deleteAction')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
