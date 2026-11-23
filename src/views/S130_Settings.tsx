import React, { useState, useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { RoomTariff, RoomType, ROOM_TYPE_ORDER } from '../types';
import { Save, RefreshCw } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const S130_Settings: React.FC = () => {
  const { settings, updateSettings, resetToDefaults } = useDorm();
  const { t, formatCurrency } = useI18n();

  const [tariffs, setTariffs] = useState<RoomTariff>({ ...settings.roomTariffs });
  const [retentionMonths, setRetentionMonths] = useState(settings.retentionMonths);

  useEffect(() => {
    setTariffs({ ...settings.roomTariffs });
    setRetentionMonths(settings.retentionMonths);
  }, [settings]);

  const tariffMeta: Record<RoomType, { labelKey: string; isPlus: boolean }> = {
    standard: { labelKey: 'settings.standardTariff', isPlus: false },
    standard_plus: { labelKey: 'settings.standardPlusTariff', isPlus: true },
    comfort: { labelKey: 'settings.comfortTariff', isPlus: false },
    comfort_plus: { labelKey: 'settings.comfortPlusTariff', isPlus: true },
    lux: { labelKey: 'settings.luxTariff', isPlus: false },
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      roomTariffs: { ...tariffs },
      retentionMonths,
    });
    alert(t('settings.saveSuccess'));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('settings.title')}</h1>
          <p className="text-xs text-slate-500">{t('settings.subtitle')}</p>
        </div>
        <button
          onClick={resetToDefaults}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> {t('settings.resetDefaults')}
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-xs">
        {/* System Language Preference */}
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm mb-3 border-b border-slate-100 pb-2">
            1. {t('settings.languagePreference')}
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <LanguageSwitcher variant="segmented" />
            <span className="text-[11px] text-slate-500">
              {t('lang.select')}
            </span>
          </div>
        </div>

        {/* Tariffs (5 Room Categories) */}
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm mb-3 border-b border-slate-100 pb-2">
            2. {t('settings.tariffs')} (UZS)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROOM_TYPE_ORDER.map((type) => {
              const meta = tariffMeta[type];
              const value = tariffs[type] ?? 0;
              return (
                <div
                  key={type}
                  className={`p-3.5 rounded-2xl border ${
                    meta.isPlus
                      ? 'bg-amber-50/50 border-amber-300/80'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <label
                    className={`block font-bold mb-1.5 ${
                      meta.isPlus ? 'text-amber-900' : 'text-slate-700'
                    }`}
                  >
                    {t(meta.labelKey)}:
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={value}
                    onChange={(e) =>
                      setTariffs((prev) => ({
                        ...prev,
                        [type]: Number(e.target.value),
                      }))
                    }
                    className={`w-full px-3 py-2 bg-white border rounded-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#C6A15B] ${
                      meta.isPlus
                        ? 'border-amber-300 text-amber-950'
                        : 'border-slate-200 text-slate-900'
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1.5 block font-semibold ${
                      meta.isPlus ? 'text-amber-700' : 'text-slate-500'
                    }`}
                  >
                    {formatCurrency(value)} {t('common.perMonth')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Retention */}
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm mb-3 border-b border-slate-100 pb-2">
            3. {t('audit.title')} / Retention
          </h3>
          <div className="max-w-xs">
            <label className="block font-bold text-slate-700 mb-1">{t('common.status')}:</label>
            <input
              type="number"
              value={retentionMonths}
              onChange={(e) => setRetentionMonths(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-1">{t('audit.subtitle')}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#C6A15B]" /> {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};
