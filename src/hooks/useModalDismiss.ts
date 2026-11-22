import { useEffect, useCallback } from 'react';

interface UseModalDismissOptions {
  isOpen?: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  hasUnsavedChanges?: boolean;
  confirmDiscardMessage?: string;
}

export function useModalDismiss({
  isOpen = true,
  onClose,
  closeOnEscape = true,
  hasUnsavedChanges = false,
  confirmDiscardMessage = "Kiritilgan ma'lumotlar saqlanmaydi. Oynani yopishni xohlaysizmi?",
}: UseModalDismissOptions) {
  const handleDismiss = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(confirmDiscardMessage);
      if (!confirmClose) return;
    }
    onClose();
  }, [hasUnsavedChanges, confirmDiscardMessage, onClose]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Listen to Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, handleDismiss]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        e.stopPropagation();
        handleDismiss();
      }
    },
    [handleDismiss]
  );

  return {
    handleDismiss,
    handleBackdropClick,
  };
}
