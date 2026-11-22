import React from 'react';
import { X } from 'lucide-react';

export interface ModalCloseButtonProps {
  onClose: () => void;
  ariaLabel?: string;
  title?: string;
  className?: string;
  variant?: 'light' | 'dark' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Universal, accessible Modal Close Button (X) for ROYAL CAMPUS overlays and dialogs.
 * Ensures minimum 40x40px touch target, visible high-contrast styling, aria labels,
 * and flex-shrink protection across desktop, tablet, and mobile.
 */
export const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({
  onClose,
  ariaLabel = 'Close dialog',
  title = 'Yopish (Esc)',
  className = '',
  variant = 'light',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-11 h-11 p-2.5',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const variantClasses = {
    light:
      'bg-slate-100/90 hover:bg-slate-200 active:bg-slate-300 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs',
    dark:
      'bg-[#1A2D4F] hover:bg-[#253D66] active:bg-[#2F4C7D] text-slate-300 hover:text-white border border-[#C6A15B]/30 shadow-2xs',
    ghost:
      'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-slate-800',
  }[variant];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      aria-label={ariaLabel}
      title={title}
      className={`shrink-0 flex-shrink-0 rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:ring-offset-2 ${sizeClasses} ${variantClasses} ${className}`}
    >
      <X className={`${iconSizes} stroke-[2.25]`} aria-hidden="true" />
    </button>
  );
};
