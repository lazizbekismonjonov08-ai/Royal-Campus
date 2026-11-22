import React from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { History } from 'lucide-react';

export const S140_AuditLog: React.FC = () => {
  const { auditLogs } = useDorm();
  const { t, formatDateTime } = useI18n();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('audit.title')}</h1>
          <p className="text-xs text-slate-500">{t('audit.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">{t('audit.timestamp')}</th>
                <th className="p-3.5">{t('audit.user')}</th>
                <th className="p-3.5">{t('audit.role')}</th>
                <th className="p-3.5">{t('audit.action')}</th>
                <th className="p-3.5">{t('audit.object')}</th>
                <th className="p-3.5">{t('audit.oldValue')}</th>
                <th className="p-3.5">{t('audit.newValue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                    <td className="p-3.5 font-bold text-slate-900">{log.userName}</td>
                    <td className="p-3.5 uppercase text-[10px] font-bold text-sky-700">{log.role}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{log.action}</td>
                    <td className="p-3.5">{log.objectType} ({log.objectId})</td>
                    <td className="p-3.5 text-slate-400">{log.oldValue || '---'}</td>
                    <td className="p-3.5 text-slate-700">{log.newValue || '---'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
