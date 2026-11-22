import React from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';

export const S120_NotificationsView: React.FC = () => {
  const { notifications, markNotificationAsRead } = useDorm();
  const { t, formatDateTime } = useI18n();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-lg font-extrabold text-slate-900">{t('notifications.title')}</h1>
        <p className="text-xs text-slate-500">{t('notifications.subtitle')}</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-slate-400 text-xs">{t('notifications.empty')}</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationAsRead(n.id)}
              className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                !n.isRead ? 'bg-[#F7F5F0] border-[#C6A15B] shadow-xs' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                <span className="text-[10px] text-slate-400">{formatDateTime(n.date)}</span>
              </div>
              <p className="text-slate-700">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
