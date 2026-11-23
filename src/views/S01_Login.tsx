import React, { useState, useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Role, Student } from '../types';
import {
  ArrowRight,
  ArrowLeft,
  UserCheck,
  KeyRound,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  User,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  generateSalt,
  hashPassword,
  verifyPasswordHash,
  normalizePhoneKey,
  formatUzPhoneDisplay,
  isValidAnyPhone,
  generateVerificationCode,
} from '../utils/authCrypto';

interface LoginProps {
  portalMode?: 'student' | 'staff';
  onLoginSuccess: (selectedRole: Role) => void;
  onGoToPublicApp: () => void;
  onGoToLanding?: () => void;
}

type AuthMode = 'signin' | 'register' | 'forgot';
type OtpStep = 1 | 2 | 3;

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
    students,
    findUserAccountByIdentifier,
    registerStudentAccount,
    resetUserPassword,
  } = useDorm();
  const { t } = useI18n();

  const isStaffPortal = portalMode === 'staff';

  const [mode, setMode] = useState<AuthMode>('signin');
  const [selectedStaffRole, setSelectedStaffRole] = useState<Exclude<Role, 'student'>>('owner');

  // Sign-In state (always starts empty; examples strictly as placeholders)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signInSuccessBanner, setSignInSuccessBanner] = useState<string | null>(null);
  const [isSubmittingSignIn, setIsSubmittingSignIn] = useState(false);

  // Student Registration 3-step state
  const [regStep, setRegStep] = useState<OtpStep>(1);
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOtpInput, setRegOtpInput] = useState('');
  const [regGeneratedOtp, setRegGeneratedOtp] = useState('');
  const [regResendSec, setRegResendSec] = useState(0);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Forgot Password 3-step state
  const [forgotStep, setForgotStep] = useState<OtpStep>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtpInput, setForgotOtpInput] = useState('');
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState('');
  const [forgotResendSec, setForgotResendSec] = useState(0);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // Reset form state when switching between public student portal and #staff portal
  useEffect(() => {
    setMode('signin');
    setIdentifier('');
    setPassword('');
    setSignInError(null);
    setSignInSuccessBanner(null);
    setRegError(null);
    setForgotError(null);
  }, [portalMode]);

  // Resend countdown timers
  useEffect(() => {
    if (regResendSec <= 0) return;
    const timer = window.setInterval(() => {
      setRegResendSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [regResendSec]);

  useEffect(() => {
    if (forgotResendSec <= 0) return;
    const timer = window.setInterval(() => {
      setForgotResendSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [forgotResendSec]);

  const switchMode = (nextMode: AuthMode) => {
    if (isStaffPortal && nextMode === 'register') return;
    setMode(nextMode);
    setSignInError(null);
    setRegError(null);
    setForgotError(null);
    if (nextMode !== 'signin') {
      setSignInSuccessBanner(null);
    }
    if (nextMode === 'forgot') {
      setForgotStep(1);
      setForgotOtpInput('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    }
  };

  // Sign-In Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setSignInSuccessBanner(null);

    const trimmedId = identifier.trim();
    if (!trimmedId || !password) {
      setSignInError(t('login.errInvalidCredentials'));
      return;
    }

    setIsSubmittingSignIn(true);
    try {
      const matchedAccount = findUserAccountByIdentifier(trimmedId);

      if (!isStaffPortal) {
        // Variant 1: Owner / Admin login via Phone/Login/Email field
        const loweredId = trimmedId.toLowerCase();
        if (loweredId === 'owner' || loweredId === 'admin') {
          setRole('owner');
          onLoginSuccess('owner');
          return;
        }

        // Public Student Authentication (saved local credentials or direct smooth entry)
        if (matchedAccount && matchedAccount.role === 'student') {
          const isMatch = await verifyPasswordHash(
            password,
            matchedAccount.passwordSalt,
            matchedAccount.passwordHash
          );
          if (!isMatch) {
            setSignInError(t('login.errInvalidCredentials'));
            return;
          }
          if (matchedAccount.studentId) {
            setActiveStudentId(matchedAccount.studentId);
          }
          setRole('student');
          onLoginSuccess('student');
          return;
        }

        // Match existing student record by phone or passport when signing in directly
        const phoneKey = normalizePhoneKey(trimmedId);
        const matchedStudent = students.find(
          (s: Student) =>
            s.status !== 'deleted_pending_purge' &&
            ((phoneKey.length >= 7 && normalizePhoneKey(s.phone) === phoneKey) ||
              s.passportNumber.trim().toLowerCase() === loweredId)
        );
        if (matchedStudent) {
          setActiveStudentId(matchedStudent.id);
        }

        setRole('student');
        onLoginSuccess('student');
        return;
      }

      // Dedicated #staff Portal Authentication
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

      setRole(selectedStaffRole);
      onLoginSuccess(selectedStaffRole);
    } finally {
      setIsSubmittingSignIn(false);
    }
  };

  // Registration Step 1: Send OTP
  const handleRegSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!isValidAnyPhone(regPhone)) {
      setRegError(t('login.errInvalidPhone'));
      return;
    }
    const code = generateVerificationCode();
    setRegGeneratedOtp(code);
    setRegOtpInput('');
    setRegResendSec(60);
    setRegStep(2);
  };

  const handleRegResend = () => {
    if (regResendSec > 0) return;
    const code = generateVerificationCode();
    setRegGeneratedOtp(code);
    setRegResendSec(60);
    setRegError(null);
  };

  // Registration Step 2: Verify OTP (accept displayed test code OR any 4-6 digit code)
  const handleRegVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    const cleanedOtp = regOtpInput.trim();
    if (cleanedOtp !== regGeneratedOtp && !/^\d{4,6}$/.test(cleanedOtp)) {
      setRegError(t('login.errInvalidCode'));
      return;
    }
    setRegStep(3);
  };

  // Registration Step 3: Set Password & Enter Student Cabinet
  const handleRegComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (regPassword.length < 6) {
      setRegError(t('login.errPasswordLength'));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError(t('login.errPasswordMismatch'));
      return;
    }

    setIsSubmittingReg(true);
    try {
      const salt = generateSalt();
      const hash = await hashPassword(regPassword, salt);
      registerStudentAccount({
        fullName: regFullName,
        phone: regPhone,
        passwordHash: hash,
        passwordSalt: salt,
      });
      onLoginSuccess('student');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // Forgot Password Step 1: Send OTP
  const handleForgotSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const trimmed = forgotIdentifier.trim();
    if (!trimmed) {
      setForgotError(t('login.errInvalidIdentifier'));
      return;
    }
    const looksLikePhone = /^\+?[\d\s()-]{3,}$/.test(trimmed);
    if (looksLikePhone && !isValidAnyPhone(trimmed)) {
      setForgotError(t('login.errInvalidPhone'));
      return;
    }
    const code = generateVerificationCode();
    setForgotGeneratedOtp(code);
    setForgotOtpInput('');
    setForgotResendSec(60);
    setForgotStep(2);
  };

  const handleForgotResend = () => {
    if (forgotResendSec > 0) return;
    const code = generateVerificationCode();
    setForgotGeneratedOtp(code);
    setForgotResendSec(60);
    setForgotError(null);
  };

  // Forgot Password Step 2: Verify OTP (accept displayed test code OR any 4-6 digit code)
  const handleForgotVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const cleanedOtp = forgotOtpInput.trim();
    if (cleanedOtp !== forgotGeneratedOtp && !/^\d{4,6}$/.test(cleanedOtp)) {
      setForgotError(t('login.errInvalidCode'));
      return;
    }
    setForgotStep(3);
  };

  // Forgot Password Step 3: Save New Password & Enter Cabinet
  const handleForgotResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (forgotNewPassword.length < 6) {
      setForgotError(t('login.errPasswordLength'));
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError(t('login.errPasswordMismatch'));
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const salt = generateSalt();
      const hash = await hashPassword(forgotNewPassword, salt);
      const res = resetUserPassword({
        identifier: forgotIdentifier,
        passwordHash: hash,
        passwordSalt: salt,
        targetRole: isStaffPortal ? selectedStaffRole : 'student',
      });
      if (!isStaffPortal) {
        setRole('student');
        onLoginSuccess('student');
        return;
      }
      if (res.role !== 'student') {
        setSelectedStaffRole(res.role);
      }
      setPassword('');
      setSignInSuccessBanner(t('login.resetSuccess'));
      setMode('signin');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const renderStepPills = (activeStep: OtpStep) => {
    const steps: { num: OtpStep; label: string }[] = [
      { num: 1, label: t('login.stepPhone') },
      { num: 2, label: t('login.stepVerify') },
      { num: 3, label: t('login.stepPassword') },
    ];
    return (
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {steps.map((s) => {
          const isCurrent = activeStep === s.num;
          const isDone = activeStep > s.num;
          return (
            <div
              key={s.num}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-center border transition-colors ${
                isCurrent
                  ? 'bg-[#101C32] text-[#EAD096] border-[#C6A15B]/60'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              {s.label}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTestCodeBanner = (code: string, onFill: () => void) => (
    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-amber-800 leading-snug">
          {t('login.testCodeLabel')}
        </p>
        <p className="text-sm font-mono font-bold tracking-[0.25em] text-[#101C32] mt-0.5">
          {code}
        </p>
      </div>
      <button
        type="button"
        onClick={onFill}
        className="px-2.5 py-1.5 rounded-lg bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] text-[10px] font-bold shrink-0 cursor-pointer transition-colors"
      >
        {t('login.fillTestCode')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#101C32] flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Background Decorative Crest Aura */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#C6A15B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1A2D4F]/50 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher in Top Right of Screen */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher
          variant="minimal"
          className="bg-[#101C32]/90 border-[#C6A15B]/40 shadow-lg text-slate-200"
        />
      </div>

      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#C6A15B]/30 relative overflow-hidden z-10">
        {/* Header Branding */}
        <div className="text-center mb-5">
          <BrandLogo variant="emblem" size="xl" className="mx-auto mb-3" />
          <h1
            className="text-2xl font-bold text-[#101C32] tracking-wider uppercase"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t('brand.name')}
          </h1>

          {/* Portal Context Title */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F5F0] border border-[#C6A15B]/35 text-[11px] font-bold text-[#9A7432]">
            {isStaffPortal ? (
              <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
            ) : (
              <GraduationCap className="w-3.5 h-3.5 text-[#C6A15B]" />
            )}
            <span>
              {isStaffPortal ? t('login.staffPortalTitle') : t('login.studentPortalTitle')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {isStaffPortal ? t('login.staffPortalSubtitle') : t('login.studentPortalSubtitle')}
          </p>
        </div>

        {/* Public Student Portal Mode Tabs (Sign In / Register) */}
        {!isStaffPortal && mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#101C32] text-[#EAD096] shadow-sm'
                  : 'text-slate-600 hover:text-[#101C32]'
              }`}
            >
              {t('login.tabSignIn')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#101C32] text-[#EAD096] shadow-sm'
                  : 'text-slate-600 hover:text-[#101C32]'
              }`}
            >
              {t('login.tabRegister')}
            </button>
          </div>
        )}

        {/* ==================== SIGN IN VIEW ==================== */}
        {mode === 'signin' && (
          <>
            {/* Dedicated #staff Role Selector (ONLY shown on #staff, localized labels only, no DEMO or English role codes) */}
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

            {signInSuccessBanner && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{signInSuccessBanner}</span>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('login.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] font-semibold text-[#9A7432] hover:text-[#101C32] transition-colors cursor-pointer"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>
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
          </>
        )}

        {/* ==================== STUDENT REGISTRATION VIEW (PUBLIC ONLY) ==================== */}
        {!isStaffPortal && mode === 'register' && (
          <div>
            <div className="text-center mb-4">
              <h2 className="text-sm font-bold text-[#101C32]">{t('login.regTitle')}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('login.regSubtitle')}</p>
            </div>

            {renderStepPills(regStep)}

            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {regStep === 1 && (
              <form onSubmit={handleRegSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('login.fullNameLabel')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder={t('login.fullNamePlaceholder')}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('login.phoneLabel')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        if (regError) setRegError(null);
                      }}
                      placeholder={t('login.phonePlaceholder')}
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('login.sendCode')}</span>
                  <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
                </button>
              </form>
            )}

            {regStep === 2 && (
              <form onSubmit={handleRegVerifyCode} className="space-y-4">
                <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <span className="font-mono font-semibold text-[#101C32]">
                    {formatUzPhoneDisplay(regPhone)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRegStep(1);
                      setRegError(null);
                    }}
                    className="text-[11px] font-semibold text-[#9A7432] hover:underline cursor-pointer"
                  >
                    {t('login.changePhone')}
                  </button>
                </div>

                {renderTestCodeBanner(regGeneratedOtp, () => {
                  setRegOtpInput(regGeneratedOtp);
                  setRegError(null);
                })}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('login.codeLabel')}
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={regOtpInput}
                      onChange={(e) => {
                        setRegOtpInput(e.target.value.replace(/\D/g, ''));
                        if (regError) setRegError(null);
                      }}
                      placeholder={t('login.codePlaceholder')}
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleRegResend}
                    disabled={regResendSec > 0}
                    className="text-[11px] font-semibold text-slate-600 hover:text-[#101C32] disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>
                      {regResendSec > 0
                        ? t('login.resendIn', { seconds: regResendSec })
                        : t('login.resendCode')}
                    </span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('login.verifyCode')}</span>
                  <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
                </button>
              </form>
            )}

            {regStep === 3 && (
              <form onSubmit={handleRegComplete} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('login.setPasswordLabel')}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (regError) setRegError(null);
                      }}
                      placeholder={t('login.passwordPlaceholder')}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass((v) => !v)}
                      className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('login.confirmPasswordLabel')}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        if (regError) setRegError(null);
                      }}
                      placeholder={t('login.passwordPlaceholder')}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="w-full py-3 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{t('login.createAccountAndEnter')}</span>
                  <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ==================== PASSWORD RECOVERY VIEW ==================== */}
        {mode === 'forgot' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs font-semibold text-slate-600 hover:text-[#101C32] flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('login.backToSignIn')}</span>
              </button>
            </div>

            <div className="text-center mb-4">
              <h2 className="text-sm font-bold text-[#101C32]">{t('login.resetTitle')}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('login.resetSubtitle')}</p>
            </div>

            {renderStepPills(forgotStep)}

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleForgotSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('login.resetPhoneOrLoginLabel')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => {
                        setForgotIdentifier(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder={t('login.phonePlaceholder')}
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('login.sendCode')}</span>
                  <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotVerifyCode} className="space-y-4">
                <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <span className="font-mono font-semibold text-[#101C32] truncate">
                    {forgotIdentifier}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError(null);
                    }}
                    className="text-[11px] font-semibold text-[#9A7432] hover:underline shrink-0 cursor-pointer"
                  >
                    {t('login.changePhone')}
                  </button>
                </div>

                {renderTestCodeBanner(forgotGeneratedOtp, () => {
                  setForgotOtpInput(forgotGeneratedOtp);
                  setForgotError(null);
                })}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('login.codeLabel')}
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={forgotOtpInput}
                      onChange={(e) => {
                        setForgotOtpInput(e.target.value.replace(/\D/g, ''));
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder={t('login.codePlaceholder')}
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleForgotResend}
                    disabled={forgotResendSec > 0}
                    className="text-[11px] font-semibold text-slate-600 hover:text-[#101C32] disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>
                      {forgotResendSec > 0
                        ? t('login.resendIn', { seconds: forgotResendSec })
                        : t('login.resendCode')}
                    </span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('login.verifyCode')}</span>
                  <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotResetComplete} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('login.setPasswordLabel')}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showForgotPass ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder={t('login.passwordPlaceholder')}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPass((v) => !v)}
                      className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showForgotPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('login.confirmPasswordLabel')}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showForgotPass ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => {
                        setForgotConfirmPassword(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder={t('login.passwordPlaceholder')}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingForgot}
                  className="w-full py-3 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{t('login.saveNewPassword')}</span>
                  <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
                </button>
              </form>
            )}
          </div>
        )}

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
