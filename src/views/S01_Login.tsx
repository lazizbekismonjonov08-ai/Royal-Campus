import React, { useState, useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Role, StaffUser } from '../types';
import { SessionKind } from '../utils/sessionStorage';
import {
  ArrowRight,
  UserCheck,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import {
  verifyPasswordHash,
  resolveStaffRoleFromTitle,
} from '../utils/authCrypto';
import {
  verifyResidentLoginWithSupabase,
  verifyStaffLoginWithSupabase,
} from '../services/supabaseSync';

export interface LoginSuccessMeta {
  sessionKind: SessionKind;
  studentId?: string;
  staffUser?: StaffUser | null;
}

interface LoginProps {
  portalMode?: 'student' | 'staff';
  onLoginSuccess: (selectedRole: Role, meta?: LoginSuccessMeta) => void;
  onGoToPublicApp: () => void;
  onGoToLanding?: () => void;
}

const STAFF_ROLES: { key: Exclude<Role, 'student'>; labelKey: string }[] = [
  { key: 'owner', labelKey: 'role.owner' },
  { key: 'manager', labelKey: 'role.manager' },
  { key: 'receptionist', labelKey: 'role.receptionist' },
  { key: 'security', labelKey: 'role.security' },
  { key: 'cleaner', labelKey: 'role.cleaner' },
];

export const S01_Login: React.FC<LoginProps> = ({
  portalMode = 'student',
  onLoginSuccess,
  onGoToPublicApp,
  onGoToLanding,
}) => {
  const {
    setRole,
    setActiveStudentId,
    setActiveStaffUser,
    students,
    staffUsers,
    findUserAccountByIdentifier,
    ensureStudentForIdentifier,
    syncLoggedInResidentToState,
    refreshFromSupabase,
  } = useDorm();
  const { t } = useI18n();

  const isStaffPortal = portalMode === 'staff';

  const [selectedStaffRole, setSelectedStaffRole] = useState<Exclude<Role, 'student'>>('owner');

  // Sign-In state (always starts empty; examples strictly as placeholders)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSubmittingSignIn, setIsSubmittingSignIn] = useState(false);

  // Reset form state when switching between public portal and #staff portal
  useEffect(() => {
    setIdentifier('');
    setPassword('');
    setSignInError(null);
  }, [portalMode]);

  // Sign-In Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    const trimmedId = identifier.trim();
    const trimmedPassword = password.trim();
    if (!trimmedId || !trimmedPassword) {
      setSignInError(t('login.errInvalidCredentials'));
      return;
    }

    setIsSubmittingSignIn(true);
    try {
      const loweredId = trimmedId.toLowerCase();
      const matchedAccount = findUserAccountByIdentifier(trimmedId);

      if (!isStaffPortal) {
        // 1. Owner / Admin direct sign-in
        if (loweredId === 'owner' || loweredId === 'admin') {
          setActiveStaffUser(null);
          setRole('owner');
          onLoginSuccess('owner', { sessionKind: 'owner' });
          return;
        }

        // 2. Staff user verification against Supabase `staff_users`
        const staffAuth = await verifyStaffLoginWithSupabase(trimmedId, password, staffUsers);
        if (staffAuth.status === 'ok') {
          const resolvedRole = resolveStaffRoleFromTitle(staffAuth.staffUser.roleTitle);
          setActiveStaffUser(staffAuth.staffUser);
          setRole(resolvedRole);
          onLoginSuccess(resolvedRole, {
            sessionKind: 'staff',
            staffUser: staffAuth.staffUser,
          });
          return;
        }
        if (staffAuth.status === 'inactive') {
          setSignInError(t('login.errStaffInactive'));
          return;
        }
        if (staffAuth.status === 'invalid_password') {
          setSignInError(t('login.errStaffWrongPassword'));
          return;
        }

        // 3. Direct Resident Authentication against Supabase `residents` table
        // (normalizes +998/spaces/dashes/parentheses and matches last 9 digits + trimmed password)
        const residentAuth = await verifyResidentLoginWithSupabase(
          trimmedId,
          trimmedPassword,
          students
        );
        if (residentAuth.status === 'ok') {
          syncLoggedInResidentToState(residentAuth.resident);
          setActiveStaffUser(null);
          setActiveStudentId(residentAuth.resident.id);
          setRole('student');
          onLoginSuccess('student', {
            sessionKind: 'resident',
            studentId: residentAuth.resident.id,
          });
          void refreshFromSupabase();
          return;
        }
        if (residentAuth.status === 'invalid_password') {
          setSignInError(t('login.errInvalidCredentials'));
          return;
        }

        // Fallback for resident accounts with locally hashed password when DB password is not yet set
        if (matchedAccount && matchedAccount.role === 'student') {
          const isMatch = await verifyPasswordHash(
            trimmedPassword,
            matchedAccount.passwordSalt,
            matchedAccount.passwordHash
          );
          if (!isMatch) {
            setSignInError(t('login.errInvalidCredentials'));
            return;
          }
          setActiveStaffUser(null);
          let resolvedResidentId: string | undefined;
          if (residentAuth.status === 'no_password') {
            syncLoggedInResidentToState(residentAuth.resident);
            resolvedResidentId = residentAuth.resident.id;
            setActiveStudentId(resolvedResidentId);
          } else if (matchedAccount.studentId) {
            resolvedResidentId = matchedAccount.studentId;
            setActiveStudentId(resolvedResidentId);
          } else {
            resolvedResidentId = ensureStudentForIdentifier(trimmedId);
          }
          setRole('student');
          onLoginSuccess('student', {
            sessionKind: 'resident',
            studentId: resolvedResidentId,
          });
          void refreshFromSupabase();
          return;
        }

        setSignInError(t('login.errInvalidCredentials'));
        return;
      }

      // Dedicated #staff Portal Authentication
      if (loweredId !== 'owner' && loweredId !== 'admin') {
        const staffAuth = await verifyStaffLoginWithSupabase(trimmedId, password, staffUsers);
        if (staffAuth.status === 'ok') {
          const resolvedRole = resolveStaffRoleFromTitle(staffAuth.staffUser.roleTitle);
          setActiveStaffUser(staffAuth.staffUser);
          setRole(resolvedRole);
          onLoginSuccess(resolvedRole, {
            sessionKind: 'staff',
            staffUser: staffAuth.staffUser,
          });
          return;
        }
        if (staffAuth.status === 'inactive') {
          setSignInError(t('login.errStaffInactive'));
          return;
        }
        if (staffAuth.status === 'invalid_password') {
          setSignInError(t('login.errStaffWrongPassword'));
          return;
        }
      }

      if (matchedAccount && matchedAccount.role !== 'student') {
        const isMatch = await verifyPasswordHash(
          password,
          matchedAccount.passwordSalt,
          matchedAccount.passwordHash
        );
        if (!isMatch) {
          setSignInError(t('login.errInvalidCredentials'));
          return;
        }
      }

      setActiveStaffUser(null);
      setRole(selectedStaffRole);
      onLoginSuccess(selectedStaffRole, { sessionKind: 'owner' });
    } finally {
      setIsSubmittingSignIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101C32] flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Background Decorative Crest Aura */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#C6A15B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1A2D4F]/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#C6A15B]/30 relative overflow-hidden z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <BrandLogo variant="emblem" size="xl" className="mx-auto mb-3" />
          <h1
            className="text-2xl font-bold text-[#101C32] tracking-wider uppercase"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t('brand.name')}
          </h1>

          {/* Inclusive Cabinet Context Badge */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F5F0] border border-[#C6A15B]/35 text-[11px] font-bold text-[#9A7432]">
            {isStaffPortal ? (
              <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
            )}
            <span>
              {isStaffPortal ? t('login.staffPortalTitle') : t('login.studentPortalTitle')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {isStaffPortal ? t('login.staffPortalSubtitle') : t('login.studentPortalSubtitle')}
          </p>
        </div>

        {/* Dedicated #staff Role Selector (ONLY shown on #staff) */}
        {isStaffPortal && (
          <div className="mb-5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              {t('login.roleSelect')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {STAFF_ROLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedStaffRole(r.key)}
                  className={`min-h-[44px] py-2 px-2 rounded-xl text-[11px] font-semibold text-center transition-all cursor-pointer flex items-center justify-center leading-tight ${
                    selectedStaffRole === r.key
                      ? 'bg-[#101C32] text-white font-bold shadow-md ring-2 ring-[#C6A15B]'
                      : 'bg-white text-slate-700 hover:bg-[#F7F5F0] border border-slate-200'
                  }`}
                >
                  <span>{t(r.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {signInError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{signInError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('login.phoneOrEmail')}
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (signInError) setSignInError(null);
                }}
                placeholder={t('login.phonePlaceholder')}
                required
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:border-[#C6A15B] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('login.password')}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showSignInPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (signInError) setSignInError(null);
                }}
                placeholder={t('login.passwordPlaceholder')}
                required
                autoComplete="current-password"
                className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:border-[#C6A15B] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowSignInPass((v) => !v)}
                aria-label={showSignInPass ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showSignInPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmittingSignIn}
            className="w-full py-3 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
          >
            <span>
              {isStaffPortal
                ? t('login.loginBtn', { role: t(`role.${selectedStaffRole}`) })
                : t('login.studentLoginBtn')}
            </span>
            <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
          </button>
        </form>

        {/* Bottom Public Links */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center space-y-2">
          {!isStaffPortal && (
            <p className="text-xs text-slate-500">{t('login.newResident')}</p>
          )}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {!isStaffPortal && (
              <button
                type="button"
                onClick={onGoToPublicApp}
                className="text-xs font-bold text-[#101C32] hover:text-[#C6A15B] transition-colors cursor-pointer"
              >
                {t('login.goToApplication')}
              </button>
            )}
            {onGoToLanding && (
              <>
                {!isStaffPortal && <span className="text-slate-300">·</span>}
                <button
                  type="button"
                  onClick={onGoToLanding}
                  className="text-xs font-semibold text-slate-600 hover:text-[#C6A15B] transition-colors cursor-pointer"
                >
                  {t('login.homeLink')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
