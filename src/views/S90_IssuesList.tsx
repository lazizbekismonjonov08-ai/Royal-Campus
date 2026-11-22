import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { S92_CreateIssueModal } from './S92_CreateIssueModal';
import { Plus } from 'lucide-react';

export const S90_IssuesList: React.FC = () => {
  const { issues, updateIssueStatus, employees } = useDorm();
  const { t, formatDate } = useI18n();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredIssues = issues.filter((i) => {
    if (statusFilter === 'all') return true;
    return i.status === statusFilter;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('issues.title')}</h1>
          <p className="text-xs text-slate-500">{t('issues.subtitle')}</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t('issues.createIssue')}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-fit">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          {t('common.all')} ({issues.length})
        </button>
        <button
          onClick={() => setStatusFilter('open')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            statusFilter === 'open' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          {t('issues.status.open')}
        </button>
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            statusFilter === 'in_progress' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          {t('issues.status.in_progress')}
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            statusFilter === 'resolved' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          {t('issues.status.resolved')}
        </button>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIssues.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            {t('common.noData')}
          </div>
        ) : (
          filteredIssues.map((iss) => (
            <div key={iss.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-slate-900 text-sm">{iss.location}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      iss.priority === 'high' || iss.priority === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t(`issues.priority.${iss.priority}`) || iss.priority}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed font-medium mb-3">{iss.description}</p>

                <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <strong>{t('issues.category')}:</strong>{' '}
                    <span>{t(`issues.category.${iss.category}`) || iss.category}</span>
                  </div>
                  <div>
                    <strong>{t('issues.reportedBy')}:</strong> {iss.reportedBy} ({iss.reporterRole})
                  </div>
                  <div>
                    <strong>{t('issues.assignedTo')}:</strong>{' '}
                    {iss.assignedEmployeeName || t('common.noData')}
                  </div>
                  <div>
                    <strong>{t('common.date')}:</strong> {formatDate(iss.createdAt)}
                  </div>
                </div>
              </div>

              {/* Status Controller */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase ${
                    iss.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : iss.status === 'in_progress'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {t(`issues.status.${iss.status}`) || iss.status}
                </span>

                <div className="flex items-center gap-1">
                  {iss.status === 'open' && (
                    <button
                      onClick={() => updateIssueStatus(iss.id, 'in_progress', employees[1]?.id)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      {t('issues.assign')}
                    </button>
                  )}
                  {iss.status === 'in_progress' && (
                    <button
                      onClick={() => updateIssueStatus(iss.id, 'resolved')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      {t('issues.resolve')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <S92_CreateIssueModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};
