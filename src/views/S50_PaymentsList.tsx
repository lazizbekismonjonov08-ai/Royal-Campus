import React, { useState, useMemo } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Plus, Search, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface PaymentsListProps {
  onOpenAddPaymentModal: () => void;
}

export const S50_PaymentsList: React.FC<PaymentsListProps> = ({ onOpenAddPaymentModal }) => {
  const { payments, students } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'overdue'>('all');

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const getPaymentStatus = (p: typeof payments[0]) => {
    const student = studentMap.get(p.studentId) || students.find((s) => s.fullName === p.studentName);
    if (student && student.debtAmount > 0) {
      return 'overdue' as const;
    }
    if (
      p.status === 'pending' ||
      (student && student.nextPaymentDueDate && student.nextPaymentDueDate <= '2026-10-15' && student.paidUntil < '2026-10-31')
    ) {
      return 'pending' as const;
    }
    return 'completed' as const;
  };

  const overdueCount = useMemo(
    () => payments.filter((p) => getPaymentStatus(p) === 'overdue').length,
    [payments, students]
  );

  const filteredPayments = payments.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch =
        p.studentName.toLowerCase().includes(q) ||
        p.roomNumber.includes(q) ||
        p.id.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    if (statusFilter !== 'all') {
      const status = getPaymentStatus(p);
      if (status !== statusFilter) return false;
    }

    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('payments.title')}</h1>
          <p className="text-xs text-slate-500">{t('payments.subtitle')}</p>
        </div>
        <button
          onClick={onOpenAddPaymentModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t('payments.recordNew')}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('header.searchPlaceholder')}
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">{t('payments.filterAll')}</option>
            <option value="completed">{t('payments.filterPaid')}</option>
            <option value="pending">{t('payments.filterPending')}</option>
            <option value="overdue">
              {t('payments.filterOverdue')} {overdueCount > 0 ? `(${overdueCount})` : ''}
            </option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">{t('payments.student')}</th>
                <th className="p-3.5">{t('payments.room')}</th>
                <th className="p-3.5">{t('payments.paymentDate')}</th>
                <th className="p-3.5">{t('payments.period')}</th>
                <th className="p-3.5">{t('payments.amount')}</th>
                <th className="p-3.5">{t('payments.method')}</th>
                <th className="p-3.5">{t('payments.collectionStatus')}</th>
                <th className="p-3.5">{t('payments.recordedBy')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const student = studentMap.get(p.studentId) || students.find((s) => s.fullName === p.studentName);
                  const status = getPaymentStatus(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">{p.id}</td>
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">{p.studentName}</div>
                        {student && student.debtAmount > 0 ? (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>{t('payments.debtNotice', { amount: formatCurrency(student.debtAmount) })}</span>
                          </div>
                        ) : status === 'pending' ? (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{t('payments.dueSoonNotice')}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3.5 font-bold text-sky-700">{t('common.room')} {p.roomNumber}</td>
                      <td className="p-3.5">{formatDate(p.paymentDate)}</td>
                      <td className="p-3.5 font-semibold">{p.periodMonth}</td>
                      <td className="p-3.5 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="p-3.5 capitalize">{t(`payments.method.${p.paymentMethod}`) || p.paymentMethod}</td>
                      <td className="p-3.5">
                        {status === 'overdue' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            {t('payments.status.overdue')}
                          </span>
                        ) : status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            {t('payments.status.pending')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            {t('payments.status.completed')}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">{p.recordedBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
