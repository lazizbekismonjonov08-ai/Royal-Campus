import React from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Receipt } from 'lucide-react';

export const S08_StudentPayments: React.FC = () => {
  const { students, activeStudentId, payments } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();
  const student = students.find((s) => s.id === activeStudentId) || students[0];

  if (!student) return null;

  const myPayments = payments.filter((p) => p.studentId === student.id);
  const hasDebt = student.debtAmount > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">{t('studentPayments.title')}</h1>
            <p className="text-xs text-slate-500">{t('studentPayments.subtitle')}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${hasDebt ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {hasDebt ? t('student.hasDebt') : t('payments.status.paid')}
          </span>
        </div>

        {/* Current Status Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block mb-1">{t('studentPayments.paidUntil')}</span>
            <span className="text-base font-extrabold text-slate-900">{formatDate(student.paidUntil)}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block mb-1">{t('studentPayments.nextDueDate')}</span>
            <span className="text-base font-extrabold text-amber-600">{formatDate(student.nextPaymentDueDate)}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block mb-1">{t('studentPayments.debtAmount')}</span>
            <span className={`text-base font-extrabold ${hasDebt ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(student.debtAmount)}
            </span>
          </div>
        </div>

        {/* Payment History Table */}
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-sky-600" /> {t('studentPayments.history')}
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">{t('payments.paymentDate')}</th>
                <th className="p-3">{t('payments.period')}</th>
                <th className="p-3">{t('payments.amount')}</th>
                <th className="p-3">{t('payments.method')}</th>
                <th className="p-3">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {myPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                myPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{formatDate(pay.paymentDate)}</td>
                    <td className="p-3">{pay.periodMonth}</td>
                    <td className="p-3 font-bold text-slate-900">{formatCurrency(pay.amount)}</td>
                    <td className="p-3 capitalize">{t(`payments.method.${pay.paymentMethod}`) || pay.paymentMethod}</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {t('payments.status.paid')}
                      </span>
                    </td>
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
