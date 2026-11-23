import React from 'react';
import { BrandEmblemImg, BrandLogo } from './BrandLogo';
import { resolveAssetPath } from '../utils/assetPath';

interface RoyalCampusLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  responsive?: boolean;
}

export const RoyalCampusEmblemIcon: React.FC<{
  className?: string;
  withGlow?: boolean;
  withFrame?: boolean;
  idPrefix?: string;
}> = ({ className = 'w-10 h-10' }) => (
  <div
    className={`${className} rounded-xl bg-[#070D19] border border-[#C6A15B]/75 shadow-[0_0_16px_rgba(198,161,91,0.3)] p-1 flex items-center justify-center overflow-hidden relative isolate shrink-0`}
  >
    <BrandEmblemImg />
  </div>
);

export const RoyalCrownIcon = RoyalCampusEmblemIcon;
export const RoyalCampusNavEmblem = RoyalCampusEmblemIcon;

export const RoyalCampusWallLogo: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  withFrame?: boolean;
}> = ({ className = '' }) => (
  <div
    className={`relative rounded-3xl overflow-hidden border border-[#C6A15B]/30 shadow-2xl bg-[#070D19] p-6 text-center flex flex-col items-center justify-center ${className}`}
  >
    <img
      src={resolveAssetPath('images/royal-logo.jpg')}
      alt="Royal Campus"
      className="w-48 h-48 object-contain mix-blend-lighten brightness-110 contrast-105"
    />
  </div>
);

export const RoyalCampusLogo: React.FC<RoyalCampusLogoProps> = ({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  className = '',
  responsive = false,
}) => (
  <BrandLogo
    theme={variant}
    size={size}
    showSubtitle={showSubtitle}
    className={className}
    responsive={responsive}
  />
);
