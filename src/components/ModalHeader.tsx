import React from 'react';
import { ModalCloseButton } from './ModalCloseButton';

export interface ModalHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  ariaLabel?: string;
  actions?: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
}

/**
 * Shared Modal Header component for ROYAL CAMPUS modals.
 * Standardizes layout, typography, responsive overflow, actions, and top-right close button.
 */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon,
  onClose,
  ariaLabel = 'Close dialog',
  actions,
  className = '',
  variant = 'light',
}) => {
  return (
    <div
      className={`flex items-start justify-between gap-3 pb-4 mb-4 border-b ${
        variant === 'dark' ? 'border-[#1A2D4F]' : 'border-slate-100'
      } ${className}`}
    >
      {/* Title & Context */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className={`text-base sm:text-lg font-extrabold truncate ${
                variant === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              {title}
            </h2>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <div
              className={`text-xs mt-1 leading-snug ${
                variant === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions & Close Button */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {actions}
        <ModalCloseButton
          onClose={onClose}
          ariaLabel={ariaLabel}
          variant={variant === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </div>
  );
};
