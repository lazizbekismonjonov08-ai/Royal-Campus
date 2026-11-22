import React from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';

export const S100_DisciplineList: React.FC = () => {
  const { disciplineRecords } = useDorm();
  const { t, formatDate } = useI18n();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-lg font-extrabold text-slate-900">{t('discipline.title')}</h1>
        <p className="text-xs text-slate-500">{t('discipline.subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5">{t('discipline.student')}</th>
              <th className="p-3.5">{t('discipline.room')}</th>
              <th className="p-3.5">{t('discipline.reason')}</th>
              <th className="p-3.5">{t('discipline.points')}</th>
              <th className="p-3.5">{t('discipline.date')}</th>
              <th className="p-3.5">{t('discipline.recordedBy')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {disciplineRecords.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-extrabold text-slate-900">{d.studentName}</td>
                <td className="p-3.5 font-bold text-sky-700">{t('common.room')} {d.roomNumber}</td>
                <td className="p-3.5">{d.violationReason}</td>
                <td className="p-3.5">
                  <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    +{d.penaltyPoints}
                  </span>
                </td>
                <td className="p-3.5">{formatDate(d.date)}</td>
                <td className="p-3.5 text-slate-500">{d.recordedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
