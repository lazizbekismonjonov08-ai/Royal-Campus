import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { S72_ContractPDFModal } from '../views/S72_ContractPDFModal';
import { Printer, CheckCircle2 } from 'lucide-react';

export const S09_StudentContract: React.FC = () => {
  const { students, activeStudentId, contracts } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();
  const [showPdfModal, setShowPdfModal] = useState(false);

  const student = students.find((s) => s.id === activeStudentId) || students[0];
  const contract = contracts.find((c) => c.studentId === student?.id);

  if (!student) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#101C32] tracking-tight">
              {t('studentContract.title')}
            </h1>
            <p className="text-xs text-slate-500">{t('studentContract.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowPdfModal(true)}
            className="px-3.5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#C6A15B]" />
            {t('studentContract.downloadPdf')}
          </button>
        </div>

        {/* Contract Card */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-slate-500 block text-[10px]">{t('studentContract.number')}</span>
              <span className="text-base font-extrabold text-slate-900">{contract?.contractNumber || 'RC-2026/001'}</span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('common.active')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block">{t('studentContract.tenant')}</span>
              <span className="font-bold text-slate-900">{student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('studentContract.passport')}</span>
              <span className="font-bold text-slate-900">{student.passportNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('studentContract.assignedRoom')}</span>
              <span className="font-bold text-slate-900">
                {student.roomNumber
                  ? `${t('common.room')} ${student.roomNumber} (${student.bedNumber}-${t('common.bed')})`
                  : t('beds.available')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('studentContract.monthlyTariff')}</span>
              <span className="font-bold text-slate-900">{formatCurrency(student.monthlyTariff)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('studentContract.period')}</span>
              <span className="font-bold text-slate-900">
                {formatDate(contract?.startDate || '2026-09-01')} — {formatDate(contract?.endDate || '2027-06-30')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <S72_ContractPDFModal
          contract={contract}
          student={student}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
};
