import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Language, SUPPORTED_LANGUAGES } from '../i18n/types';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'header' | 'minimal' | 'dropdown' | 'segmented' | 'dark' | 'light';
  className?: string;
  dropdownDirection?: 'down' | 'up';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
  dropdownDirection = 'down',
}) => {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = SUPPORTED_LANGUAGES.find((opt) => opt.code === language) || SUPPORTED_LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Segmented Pill Variant (e.g. for Contract Modal, Login, Settings)
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 ${className}`}>
        {SUPPORTED_LANGUAGES.map((opt) => {
          const isSelected = language === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLanguage(opt.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-[#101C32] shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
              }`}
              title={opt.nativeName}
            >
              <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-[#C6A15B] leading-none shrink-0 w-6 text-center">
                {opt.code.toUpperCase()}
              </span>
              <span className="text-slate-300 font-light select-none">·</span>
              <span className="font-sans text-xs tracking-normal leading-none font-semibold">
                {opt.nativeName}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const isDark = variant === 'dark' || variant === 'minimal';

  // Header, Dark Glassmorphism, Light Pill, and Dropdown Variants
  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Tilni tanlash / Выбор языка / Select Language"
        className={`flex items-center gap-1.5 sm:gap-2 rounded-xl text-xs transition-all cursor-pointer ${
          variant === 'dark'
            ? 'bg-[#16233B]/80 hover:bg-[#1B2C4A] border border-slate-700/80 hover:border-[#C6A15B]/60 text-slate-200 h-8 sm:h-9 px-2.5 sm:px-3'
            : variant === 'minimal'
            ? 'bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-[#C6A15B]/50 text-slate-200 backdrop-blur-md px-3 py-1.5 shadow-sm'
            : variant === 'light'
            ? 'bg-slate-50 hover:bg-white text-[#0A101D] border border-slate-200 hover:border-[#C6A15B]/70 h-8 sm:h-9 px-2.5 sm:px-3'
            : variant === 'header'
            ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 shadow-2xs px-2.5 py-1.5 min-h-[40px]'
            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1.5'
        }`}
      >
        <span
          className={`font-mono text-[11px] font-bold tracking-wider uppercase rounded leading-none shrink-0 ${
            variant === 'light'
              ? 'text-[#A07A33] font-extrabold'
              : variant === 'dark'
              ? 'text-[#C6A15B] font-extrabold'
              : isDark
              ? 'bg-[#101C32] text-[#C6A15B] border border-[#C6A15B]/30 px-1.5 py-0.5'
              : 'bg-[#101C32] text-[#C6A15B] px-1.5 py-0.5'
          }`}
        >
          {currentOption.code.toUpperCase()}
        </span>
        <span className={`hidden sm:inline font-sans text-xs font-semibold leading-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {currentOption.nativeName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 shrink-0 ${
            variant === 'light' || variant === 'dark' ? 'text-[#C6A15B]' : 'text-slate-400'
          } ${isOpen ? 'rotate-180 text-[#C6A15B]' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Tillarning ro‘yxati"
          className={`absolute ${
            dropdownDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } right-0 w-48 sm:w-52 max-w-[calc(100vw-1.5rem)] rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100 ${
            isDark
              ? 'bg-[#101C32]/95 border border-slate-700/80 backdrop-blur-md text-slate-200'
              : 'bg-white border border-slate-200 text-slate-800'
          }`}
        >
          <div
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-1 ${
              isDark ? 'text-slate-400 border-b border-slate-800' : 'text-slate-400 border-b border-slate-100'
            }`}
          >
            Til / Язык / Language
          </div>
          {SUPPORTED_LANGUAGES.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer group ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1A2D4F] text-[#C6A15B] font-semibold'
                      : 'bg-[#F7F5F0] text-[#101C32] font-semibold'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Language code badge: strictly identical across UZ, RU, EN */}
                  <span
                    className={`font-mono text-[11px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded leading-none shrink-0 w-7 text-center transition-colors ${
                      isSelected
                        ? 'bg-[#101C32] text-[#C6A15B] border border-[#C6A15B]/40'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 group-hover:text-white border border-slate-700'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-800'
                    }`}
                  >
                    {opt.code.toUpperCase()}
                  </span>

                  {/* Language name & English subtitle: identical typography across all locales */}
                  <div className="flex flex-col min-w-0">
                    <span className={`font-sans text-xs font-semibold leading-tight truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {opt.nativeName}
                    </span>
                    <span className={`font-sans text-[10px] font-normal leading-tight ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                      {opt.name}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-[#C6A15B] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
