import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Application } from '../types';
import { ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';

interface AppsListProps {
  onOpenAssignModal: (studentData: Partial<Application>) => void;
}

export const S30_ApplicationsList: React.FC<AppsListProps> = ({ onOpenAssignModal }) => {
  const { applications, reviewApplication } = useDorm();
  const { t, formatDate } = useI18n();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filter, setFilter] = useState<string>('all');

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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('applications.title')}</h1>
          <p className="text-xs text-slate-500">{t('applications.subtitle')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
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
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
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
                    <td className="p-3.5 text-slate-500">{formatDate(app.submittedAt)}</td>
                    <td className="p-3.5">
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
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t('applications.reviewModalTitle')}
                      </button>
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
              title={<span id="app-review-modal-title">{t('applications.reviewModalTitle')}</span>}
              subtitle={t('applications.subtitle')}
              onClose={() => setSelectedApp(null)}
              ariaLabel={t('common.close')}
            />

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
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
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  reviewApplication(selectedApp.id, 'rejected', 'Rejected');
                  setSelectedApp(null);
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-4 h-4" /> {t('applications.reject')}
              </button>

              <button
                onClick={() => {
                  reviewApplication(selectedApp.id, 'approved', 'Approved');
                  onOpenAssignModal(selectedApp);
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
    </div>
  );
};
