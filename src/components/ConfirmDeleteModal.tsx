import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { ModalCloseButton } from './ModalCloseButton';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  detailNote?: string;
  badgeText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  description,
  detailNote,
  badgeText,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  const { t } = useI18n();
  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose: onCancel,
    closeOnEscape: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-[70] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-rose-200 relative my-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <h3
                id="confirm-delete-modal-title"
                className="text-base font-extrabold text-slate-900 leading-tight"
              >
                {title}
              </h3>
              {badgeText && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                  {badgeText}
                </span>
              )}
            </div>
          </div>
          <ModalCloseButton onClose={handleDismiss} ariaLabel={t('common.close')} />
        </div>

        <div className="space-y-2.5 text-xs text-slate-700 mb-5">
          <p className="leading-relaxed font-medium text-slate-800">{description}</p>
          {detailNote && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold leading-relaxed">
              {detailNote}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {cancelLabel || t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmLabel || t('common.delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
