import React from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { RoomType, ROOM_TYPE_ORDER, ROOM_TYPE_CAPACITY } from '../types';

export const S60_RevenueDashboard: React.FC = () => {
  const { stats, settings, students } = useDorm();
  const { t, formatCurrency } = useI18n();

  // Room type revenue breakdown across all 5 categories
  const revenueByType: Record<RoomType, number> = {
    standard: 0,
    standard_plus: 0,
    comfort: 0,
    comfort_plus: 0,
    lux: 0,
  };

  students.filter((s) => s.status === 'active').forEach((s) => {
    if (s.roomType && revenueByType[s.roomType] !== undefined) {
      revenueByType[s.roomType] += s.monthlyTariff;
    }
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-lg font-extrabold text-slate-900">{t('revenue.title')}</h1>
        <p className="text-xs text-slate-500">{t('revenue.subtitle')}</p>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">{t('revenue.collected')}</span>
          <div className="text-2xl font-extrabold text-emerald-600">
            {formatCurrency(stats.thisMonthRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{t('payments.title')}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">{t('revenue.monthlyForecast')}</span>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(stats.expectedRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{t('students.filterActive')}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">{t('revenue.uncollected')}</span>
          <div className="text-2xl font-extrabold text-rose-600">
            {formatCurrency(stats.totalDebtAmount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{t('students.filterDebtors')}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">{t('revenue.lossFromVacant')}</span>
          <div className="text-2xl font-extrabold text-amber-600">
            {formatCurrency(stats.potentialVacantRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{stats.vacantBeds} {t('rooms.bedsAvailable')}</p>
        </div>
      </div>

      {/* Room Type Revenue Split (5 Categories) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="font-extrabold text-slate-900 text-sm mb-4">{t('revenue.byFloors')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {ROOM_TYPE_ORDER.map((type) => {
            const isPlus = type.endsWith('_plus');
            const isLux = type.startsWith('lux');
            const isComfort = type.startsWith('comfort');
            const cardClasses = isPlus
              ? 'bg-[#101C32] border-[#C6A15B]/70 text-white'
              : isLux
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : isComfort
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-slate-100 border-slate-300 text-slate-900';
            const labelClasses = isPlus
              ? 'text-[#EAD096]'
              : isLux
              ? 'text-amber-900'
              : isComfort
              ? 'text-sky-900'
              : 'text-slate-900';
            const subClasses = isPlus
              ? 'text-slate-300'
              : isLux
              ? 'text-amber-800'
              : isComfort
              ? 'text-sky-800'
              : 'text-slate-600';

            return (
              <div key={type} className={`p-4 rounded-2xl border ${cardClasses}`}>
                <span className={`font-extrabold uppercase tracking-wider text-[11px] block mb-1 ${labelClasses}`}>
                  {t(`rooms.${type}`).toUpperCase()}
                </span>
                <div className={`text-xl font-extrabold ${labelClasses}`}>
                  {formatCurrency(revenueByType[type])}
                </div>
                <div className={`text-[10px] mt-1 ${subClasses}`}>
                  {t('students.tariff')}: {formatCurrency(settings.roomTariffs[type])} ({ROOM_TYPE_CAPACITY[type]} {t('rooms.bedsTotal')})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
