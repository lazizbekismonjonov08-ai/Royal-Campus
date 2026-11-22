import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { IssueCategory, IssuePriority } from '../types';
import { Wrench, Send } from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface CreateIssueProps {
  onClose: () => void;
}

export const S92_CreateIssueModal: React.FC<CreateIssueProps> = ({ onClose }) => {
  const { createIssue } = useDorm();
  const { t } = useI18n();

  const [category, setCategory] = useState<IssueCategory>('plumbing');
  const [location, setLocation] = useState('3-qavat 302-xona');
  const [roomNumber, setRoomNumber] = useState('302');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('medium');

  const hasUnsavedChanges = description.trim().length > 0;

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
    hasUnsavedChanges,
    confirmDiscardMessage: `${t('common.cancel')}?`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    createIssue({
      category,
      location,
      roomNumber,
      description,
      priority,
    });

    onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-issue-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto max-h-[92vh] flex flex-col relative"
      >
        <ModalHeader
          icon={<Wrench className="w-5 h-5 text-amber-600" />}
          title={<span id="create-issue-modal-title">{t('issues.modalTitle')}</span>}
          subtitle={t('issues.subtitle')}
          onClose={handleDismiss}
          ariaLabel={t('common.close')}
        />

        <div className="overflow-y-auto flex-1 pr-0.5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('issues.category')}:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none capitalize"
              >
                <option value="plumbing">{t('issues.category.plumbing')}</option>
                <option value="electricity">{t('issues.category.electricity')}</option>
                <option value="cleaning">{t('issues.category.cleaning')}</option>
                <option value="furniture">{t('issues.category.furniture')}</option>
                <option value="wifi">{t('issues.category.wifi')}</option>
                <option value="other">{t('issues.category.other')}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('common.room')}:</label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => {
                    const r = e.target.value;
                    setRoomNumber(r);
                    setLocation(`${r.charAt(0)}-qavat ${r}-xona`);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('issues.priority')}:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none capitalize"
                >
                  <option value="low">{t('issues.priority.low')}</option>
                  <option value="medium">{t('issues.priority.medium')}</option>
                  <option value="high">{t('issues.priority.high')}</option>
                  <option value="critical">{t('issues.priority.critical')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('issues.location')}:</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('issues.description')}:</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" /> {t('common.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
