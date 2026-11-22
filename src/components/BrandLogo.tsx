import React from 'react';
import { useI18n } from '../i18n/I18nContext';

export interface BrandEmblemProps {
  className?: string;
}

/**
 * Exact 3D metallic gold Royal Campus R + graduation cap emblem image
 * rendered with mix-blend-lighten so pure black dissolves into #070D19.
 */
export const BrandEmblemImg: React.FC<BrandEmblemProps> = ({
  className = '',
}) => (
  <img
    src="/images/royal-logo.jpg"
    alt="Royal Campus"
    className={`w-full h-full object-contain mix-blend-lighten brightness-110 contrast-105 pointer-events-none select-none ${className}`}
  />
);

export const BrandEmblemSvg = BrandEmblemImg;

const DEFAULT_SUBTITLES: Record<'uz' | 'ru' | 'en', string> = {
  uz: 'Talabalar rezidensiyasi',
  ru: 'Студенческая резиденция',
  en: 'Student Residence',
};

export interface BrandLogoProps {
  variant?: 'full' | 'emblem';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  badgeClassName?: string;
  className?: string;
  responsive?: boolean;
}

/**
 * Unified Royal Campus BrandLogo Component:
 * Renders the exact attached 3D metallic gold R emblem inside a clean gold-bordered
 * #070D19 square badge, paired with localized ROYAL CAMPUS typography.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  showSubtitle = true,
  subtitle,
  titleClassName,
  subtitleClassName,
  badgeClassName,
  className = '',
  responsive = false,
}) => {
  const { language } = useI18n();
  const isDark = theme === 'dark';
  const resolvedSubtitle = subtitle ?? DEFAULT_SUBTITLES[language] ?? DEFAULT_SUBTITLES.uz;

  const defaultBadgeClasses = {
    sm: 'w-9 h-9 rounded-xl p-1',
    md: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-1',
    lg: 'w-12 h-12 rounded-2xl p-1.5',
    xl: 'w-16 h-16 rounded-2xl p-1.5',
  }[size];

  const defaultTitleClasses = responsive
    ? 'text-xs sm:text-sm md:text-base tracking-wide sm:tracking-wider'
    : {
        sm: 'text-sm tracking-wide',
        md: 'text-sm sm:text-base lg:text-lg tracking-wider',
        lg: 'text-lg sm:text-xl tracking-wider',
        xl: 'text-2xl tracking-widest',
      }[size];

  const defaultSubtitleClasses = {
    sm: 'text-[8px] tracking-[0.14em]',
    md: 'text-[8px] sm:text-[9px] lg:text-[10px] tracking-widest',
    lg: 'text-[10px] tracking-widest',
    xl: 'text-xs tracking-widest',
  }[size];

  const emblemBadge = (
    <div
      className={`${badgeClassName ?? defaultBadgeClasses} bg-[#070D19] border border-[#C6A15B]/75 shadow-[0_0_16px_rgba(198,161,91,0.3)] flex items-center justify-center overflow-hidden relative isolate shrink-0 select-none`}
    >
      <BrandEmblemImg />
    </div>
  );

  if (variant === 'emblem') {
    return <div className={`inline-flex shrink-0 ${className}`}>{emblemBadge}</div>;
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 ${className}`}>
      {emblemBadge}
      <div className="flex flex-col justify-center min-w-0">
        <span
          className={`font-bold uppercase leading-none whitespace-nowrap ${
            isDark ? 'text-white' : 'text-[#101C32]'
          } ${titleClassName ?? defaultTitleClasses}`}
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          ROYAL CAMPUS
        </span>
        {showSubtitle && (
          <span
            className={`font-extrabold uppercase mt-1 leading-none whitespace-nowrap truncate ${
              isDark ? 'text-[#C6A15B]' : 'text-[#9C7734]'
            } ${subtitleClassName ?? defaultSubtitleClasses} ${
              responsive ? 'hidden sm:block' : ''
            }`}
          >
            {resolvedSubtitle}
          </span>
        )}
      </div>
    </div>
  );
};
