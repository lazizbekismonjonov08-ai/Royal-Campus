import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Application } from '../types';
import { ClipboardList, CheckCircle2, XCircle, Copy, Check, KeyRound, BedDouble, Trash2 } from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface AppsListProps {
  onOpenAssignModal: (studentData: Partial<Application>, resolvedStudentId?: string) => void;
}

export const S30_ApplicationsList: React.FC<AppsListProps> = ({ onOpenAssignModal }) => {
  const { applications, reviewApplication, deleteApplication, role } = useDorm();
  const { t, formatDate } = useI18n();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [confirmDeleteApp, setConfirmDeleteApp] = useState<Application | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (value: string, key: string) => {
    if (!value) return;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  // Handle escape key
  React.useEffect(() => {
    if (!selectedApp) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedApp(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApp]);

  const filteredApps = applications.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const handleConfirmDeleteApp = () => {
    if (!confirmDeleteApp) return;
    const deletedId = confirmDeleteApp.id;
    deleteApplication(deletedId);
    if (selectedApp?.id === deletedId) {
      setSelectedApp(null);
    }
    setConfirmDeleteApp(null);
    setDeleteToast(t('applications.deletedToast', { id: deletedId }));
    window.setTimeout(() => setDeleteToast(null), 4000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {deleteToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#101C32] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-[#C6A15B] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{deleteToast}</span>
        </div>
      )}
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('applications.title')}</h1>
          <p className="text-xs text-slate-500">{t('applications.subtitle')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('common.all')} ({applications.length})
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'new' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('applications.status.new')}
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'approved' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('applications.status.approved')}
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'rejected' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('applications.status.rejected')}
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">{t('applications.appIdCol')}</th>
                <th className="p-3.5">{t('students.fullName')}</th>
                <th className="p-3.5">{t('students.university')}</th>
                <th className="p-3.5">{t('students.phone')} / {t('students.passport')}</th>
                <th className="p-3.5">{t('common.date')}</th>
                <th className="p-3.5">{t('common.status')}</th>
                <th className="p-3.5 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-[11px] bg-slate-100 text-[#101C32] px-2 py-1 rounded-lg border border-slate-200">
                        {app.id}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900">{app.fullName}</div>
                      <div className="text-[10px] text-slate-400">{app.permanentAddress}</div>
                    </td>
                    <td className="p-3.5">
                      <div>{app.university}</div>
                      <div className="text-[10px] text-slate-400">
                        {app.degreeLevel ? `${app.degreeLevel} • ` : ''}
                        {typeof app.course === 'number' ? `${app.course}-${t('students.course').toLowerCase()}` : app.course} ({app.group})
                      </div>
                      {app.preferredRoomType && (
                        <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                          {t(`rooms.${app.preferredRoomType}`)}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div>{app.phone}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{app.passportNumber}</div>
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDate(app.submittedAt)}</td>
                    <td className="p-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            app.status === 'new'
                              ? 'bg-amber-100 text-amber-800'
                              : app.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t(`applications.status.${app.status}`) || app.status}
                        </span>
                        {app.assignedRoomNumber && (
                          <span className="text-[10px] font-semibold text-slate-600 inline-flex items-center gap-1">
                            <BedDouble className="w-3 h-3 text-emerald-600" />
                            {(app.assignedBedIdentifier || app.assignedBedNumber)
                              ? t('student.roomBedFormat', {
                                  room: app.assignedRoomNumber,
                                  bed: String(app.assignedBedIdentifier || app.assignedBedNumber),
                                })
                              : `${t('common.room')} ${app.assignedRoomNumber}`}
                          </span>
                        )}
                        {app.tempPassword && (
                          <button
                            type="button"
                            onClick={() => handleCopy(app.tempPassword!, `row-pass-${app.id}`)}
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded cursor-pointer"
                            title={t('applications.tempPasswordLabel')}
                          >
                            <KeyRound className="w-2.5 h-2.5 text-amber-700" />
                            <span>{app.tempPassword}</span>
                            {copiedKey === `row-pass-${app.id}` ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-amber-700" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {t('applications.reviewModalTitle')}
                        </button>
                        {role !== 'security' && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteApp(app)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t('common.delete')}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApp(null);
          }}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-review-modal-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col relative"
          >
            <ModalHeader
              icon={<ClipboardList className="w-5 h-5 text-sky-600" />}
              title={
                <span id="app-review-modal-title" className="flex items-center gap-2 flex-wrap">
                  <span>{t('applications.reviewModalTitle')}</span>
                  <span className="text-[11px] font-mono bg-slate-100 text-[#101C32] px-2 py-0.5 rounded-md border border-slate-200">
                    {selectedApp.id}
                  </span>
                </span>
              }
              subtitle={t('applications.subtitle')}
              onClose={() => setSelectedApp(null)}
              ariaLabel={t('common.close')}
            />

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 overflow-y-auto">
              <p><strong>{t('students.fullName')}:</strong> {selectedApp.fullName}</p>
              <p><strong>{t('students.phone')}:</strong> {selectedApp.phone}</p>
              <p><strong>{t('students.passport')}:</strong> {selectedApp.passportNumber}</p>
              <p>
                <strong>{t('students.university')}:</strong> {selectedApp.university}
                {selectedApp.degreeLevel ? ` • ${selectedApp.degreeLevel}` : ''} ({typeof selectedApp.course === 'number' ? `${selectedApp.course}-${t('students.course').toLowerCase()}` : selectedApp.course}, {selectedApp.group})
              </p>
              <p><strong>{t('students.address')}:</strong> {selectedApp.permanentAddress}</p>
              <p><strong>{t('students.parentPhone')}:</strong> {selectedApp.parentPhone}</p>
              {selectedApp.preferredRoomType && (
                <p>
                  <strong>{t('assign.step2')}:</strong>{' '}
                  <span className={selectedApp.preferredRoomType.endsWith('_plus') ? 'text-amber-700 font-bold' : 'font-semibold'}>
                    {t(`rooms.${selectedApp.preferredRoomType}`)}
                  </span>
                </p>
              )}
              {selectedApp.assignedRoomNumber && (
                <p>
                  <strong>{t('student.residenceRoom')}</strong>{' '}
                  <span className="font-bold text-emerald-700">
                    {(selectedApp.assignedBedIdentifier || selectedApp.assignedBedNumber)
                      ? t('student.roomBedFormat', {
                          room: selectedApp.assignedRoomNumber,
                          bed: String(selectedApp.assignedBedIdentifier || selectedApp.assignedBedNumber),
                        })
                      : `${t('common.room')} ${selectedApp.assignedRoomNumber}`}
                  </span>
                </p>
              )}
            </div>

            {/* Generated Temporary Credentials Box (when approved & assigned) */}
            {selectedApp.tempPassword && (
              <div className="mb-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-2.5">
                <div className="font-bold text-[#101C32] flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#C6A15B]" />
                  <span>{t('applications.tempCredentialsTitle')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500">{t('applications.tempLoginLabel')}</div>
                      <div className="font-mono font-bold text-slate-900 truncate">
                        {selectedApp.tempLogin || selectedApp.phone}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedApp.tempLogin || selectedApp.phone, 'modal-login')}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'modal-login' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'modal-login' ? t('applications.copiedLabel') : t('applications.copyCredentials')}</span>
                    </button>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500">{t('applications.tempPasswordLabel')}</div>
                      <div className="font-mono font-extrabold text-[#101C32] tracking-wider">
                        {selectedApp.tempPassword}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedApp.tempPassword!, 'modal-pass')}
                      className="px-2 py-1 rounded-lg bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'modal-pass' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'modal-pass' ? t('applications.copiedLabel') : t('applications.copyCredentials')}</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-amber-900/80 leading-snug">
                  {t('applications.credentialsNote')}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {role !== 'security' && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteApp(selectedApp)}
                  className="mr-auto px-3.5 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('common.delete')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  reviewApplication(selectedApp.id, 'rejected');
                  setSelectedApp(null);
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-4 h-4" /> {t('applications.reject')}
              </button>

              <button
                type="button"
                onClick={() => {
                  const resolvedStudentId = reviewApplication(selectedApp.id, 'approved');
                  onOpenAssignModal(selectedApp, resolvedStudentId);
                  setSelectedApp(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> {t('applications.approveAndAssign')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(confirmDeleteApp)}
        title={t('applications.confirmDeleteTitle')}
        badgeText={confirmDeleteApp ? `${confirmDeleteApp.fullName} (${confirmDeleteApp.id})` : undefined}
        description={t('applications.confirmDeleteDesc', {
          name: confirmDeleteApp?.fullName || '',
          id: confirmDeleteApp?.id || '',
        })}
        detailNote={
          confirmDeleteApp?.assignedRoomNumber
            ? t('students.confirmDeleteBedRelease', {
                room: confirmDeleteApp.assignedRoomNumber,
                bed: String(
                  confirmDeleteApp.assignedBedIdentifier ||
                    confirmDeleteApp.assignedBedNumber ||
                    '—'
                ),
              })
            : undefined
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDeleteApp}
        onCancel={() => setConfirmDeleteApp(null)}
      />
    </div>
  );
};
