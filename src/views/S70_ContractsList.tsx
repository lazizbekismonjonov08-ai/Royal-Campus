import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Contract } from '../types';
import { S72_ContractPDFModal } from './S72_ContractPDFModal';
import { Printer } from 'lucide-react';

export const S70_ContractsList: React.FC = () => {
  const { contracts, students } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-lg font-extrabold text-slate-900">{t('contracts.title')}</h1>
        <p className="text-xs text-slate-500">{t('contracts.subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">{t('contracts.number')}</th>
                <th className="p-3.5">{t('contracts.student')}</th>
                <th className="p-3.5">{t('contracts.roomBed')}</th>
                <th className="p-3.5">{t('contracts.tariff')}</th>
                <th className="p-3.5">{t('contracts.period')}</th>
                <th className="p-3.5">{t('common.status')}</th>
                <th className="p-3.5 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {contracts.map((cnt) => (
                <tr key={cnt.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold font-mono text-sky-700">{cnt.contractNumber}</td>
                  <td className="p-3.5 font-extrabold text-slate-900">{cnt.studentName}</td>
                  <td className="p-3.5">
                    {t('common.room')} {cnt.roomNumber} ({cnt.bedNumber}-{t('common.bed')})
                  </td>
                  <td className="p-3.5 font-semibold">{formatCurrency(cnt.tariffMonthly)}</td>
                  <td className="p-3.5">
                    {formatDate(cnt.startDate)} - {formatDate(cnt.endDate)}
                  </td>
                  <td className="p-3.5">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {t(`contracts.status.${cnt.status}`) || cnt.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedContract(cnt)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedContract && (
        <S72_ContractPDFModal
          contract={selectedContract}
          student={students.find((s) => s.id === selectedContract.studentId)}
          onClose={() => setSelectedContract(null)}
        />
      )}
    </div>
  );
};
