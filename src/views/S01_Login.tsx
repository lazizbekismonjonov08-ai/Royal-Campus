import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Role } from '../types';
import { ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface LoginProps {
  onLoginSuccess: (selectedRole: Role) => void;
  onGoToPublicApp: () => void;
  onGoToLanding?: () => void;
}

export const S01_Login: React.FC<LoginProps> = ({ onLoginSuccess, onGoToPublicApp, onGoToLanding }) => {
  const { setRole } = useDorm();
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState<Role>('owner');
  const [phone, setPhone] = useState('+998 90 123 45 67');
  const [password, setPassword] = useState('password123');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setRole(selectedRole);
    onLoginSuccess(selectedRole);
  };

  const roles: { key: Role; labelKey: string; descKey: string }[] = [
    { key: 'owner', labelKey: 'role.owner', descKey: 'role.owner.desc' },
    { key: 'manager', labelKey: 'role.manager', descKey: 'role.manager.desc' },
    { key: 'receptionist', labelKey: 'role.receptionist', descKey: 'role.receptionist.desc' },
    { key: 'security', labelKey: 'role.security', descKey: 'role.security.desc' },
    { key: 'cleaner', labelKey: 'role.cleaner', descKey: 'role.cleaner.desc' },
    { key: 'student', labelKey: 'role.student', descKey: 'role.student.desc' },
  ];

  return (
    <div className="min-h-screen bg-[#101C32] flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Background Decorative Crest Aura */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#C6A15B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1A2D4F]/50 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher in Top Right of Screen */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="minimal" className="bg-[#101C32]/90 border-[#C6A15B]/40 shadow-lg text-slate-200" />
      </div>

      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#C6A15B]/30 relative overflow-hidden z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <BrandLogo variant="emblem" size="xl" className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-[#101C32] tracking-wider uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('brand.name')}
          </h1>
          <p className="text-xs text-[#C6A15B] font-semibold mt-1 tracking-wide">
            {t('brand.tagline')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{t('brand.subtitle')}</p>
        </div>

        {/* Quick Demo Role Selector */}
        <div className="mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            {t('login.demoRoleSelect')}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelectedRole(r.key)}
                className={`py-2 px-1 rounded-xl text-[11px] font-semibold text-center transition-all cursor-pointer ${
                  selectedRole === r.key
                    ? 'bg-[#101C32] text-white shadow-md ring-2 ring-[#C6A15B]'
                    : 'bg-white text-slate-700 hover:bg-[#F7F5F0] border border-slate-200'
                }`}
              >
                <div className={`truncate ${selectedRole === r.key ? 'text-white font-bold' : ''}`}>
                  {t(r.labelKey).split(' ')[0]}
                </div>
                <div className={`text-[9px] truncate ${selectedRole === r.key ? 'text-[#C6A15B] font-medium' : 'text-slate-400'}`}>
                  {r.key.toUpperCase()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('login.phoneOrEmail')}</label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:border-[#C6A15B] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('login.password')}</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:border-[#C6A15B] focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span>{t('login.loginBtn', { role: selectedRole.toUpperCase() })}</span>
            <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-500">{t('login.newResident')}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onGoToPublicApp}
              className="text-xs font-bold text-[#101C32] hover:text-[#C6A15B] transition-colors cursor-pointer"
            >
              {t('login.goToApplication')}
            </button>
            {onGoToLanding && (
              <>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={onGoToLanding}
                  className="text-xs font-semibold text-slate-600 hover:text-[#C6A15B] transition-colors cursor-pointer"
                >
                  Bosh sahifa
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
