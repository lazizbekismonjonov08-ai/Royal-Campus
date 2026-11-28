import React, { useMemo, useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  ACADEMIC_BILLING_MONTHS,
  StudentBillingSummary,
  comparePaymentsChronoDesc,
  computePaymentExpiryInfo,
  computeStudentBillingSummary,
  findLinkedApplication,
  formatDateTimeCommaDisplay,
  formatFloorRoomBedDisplay,
  formatMethodLabel,
  formatShortDateDisplay,
  isMonthlyPaymentRecord,
} from '../utils/billingUtils';
import { ROOM_TYPE_CAPACITY } from '../types';
import { S53_BillingEditorModal } from './S53_BillingEditorModal';
import {
  PaymentStatementModal,
  PaymentStatementSubject,
} from '../components/PaymentStatementModal';
import { PaymentExpiryBadge } from '../components/PaymentExpiryBadge';
import { loadPersistedTab, savePersistedTab } from '../utils/sessionStorage';
import {
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Printer,
  Wallet,
  Receipt,
  Users,
} from 'lucide-react';

interface PaymentsListProps {
  onOpenAddPaymentModal: (entityId?: string) => void;
}

interface BillingDirectoryRow {
  entityId: string;
  kind: 'student' | 'application';
  fullName: string;
  phone: string;
  passportNumber: string;
  referenceNumber?: string;
  roomLabel: string;
  floor?: number;
  roomTypeLabel?: string;
  capacity?: number;
  summary: StudentBillingSummary;
}

export const S50_PaymentsList: React.FC<PaymentsListProps> = ({ onOpenAddPaymentModal }) => {
  const {
    payments,
    students,
    applications,
    contracts,
    rooms,
    settings,
    billingLedgers,
    role,
  } = useDorm();
  const { t, language, formatCurrency } = useI18n();

  const [activeTab, setActiveTabState] = useState<'residents' | 'transactions'>(() =>
    loadPersistedTab('S50_Payments', ['residents', 'transactions'] as const, 'residents')
  );
  const setActiveTab = (tab: 'residents' | 'transactions') => {
    setActiveTabState(tab);
    savePersistedTab('S50_Payments', tab);
  };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_balance' | 'up_to_date'>('all');
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [statementRow, setStatementRow] = useState<BillingDirectoryRow | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const canEditBilling = role !== 'security';

  const monthlyPayments = useMemo(
    () => payments.filter(isMonthlyPaymentRecord),
    [payments]
  );

  // Build unified directory of active/applicant students + unassigned pending/approved applications
  const billingRows = useMemo<BillingDirectoryRow[]>(() => {
    const rows: BillingDirectoryRow[] = [];
    const coveredAppIds = new Set<string>();

    students
      .filter((s) => s.status !== 'deleted_pending_purge')
      .forEach((student) => {
        const linkedApp = findLinkedApplication(student, applications);
        if (linkedApp) coveredAppIds.add(linkedApp.id);
        const activeContract = contracts.find(
          (c) => c.studentId === student.id && c.status === 'active'
        );
        const summary = computeStudentBillingSummary({
          entityId: student.id,
          student,
          application: linkedApp,
          contract: activeContract,
          rooms,
          settings,
          payments: monthlyPayments,
          ledger: billingLedgers[student.id],
        });

        const bedLabel =
          student.bedIdentifier || (student.bedNumber ? String(student.bedNumber) : '');
        const roomLabel =
          student.roomNumber && bedLabel
            ? t('student.roomBedFormat', { room: student.roomNumber, bed: bedLabel })
            : student.roomNumber
            ? `${t('common.room')} ${student.roomNumber}`
            : t('student.awaitingRoom');

        rows.push({
          entityId: student.id,
          kind: 'student',
          fullName: student.fullName,
          phone: student.phone,
          passportNumber: student.passportNumber,
          referenceNumber: activeContract?.contractNumber || linkedApp?.id,
          roomLabel,
          floor: student.floor || summary.room?.floor,
          roomTypeLabel: summary.roomType ? t(`rooms.${summary.roomType}`) : undefined,
          capacity: summary.capacity,
          summary,
        });
      });

    applications
      .filter(
        (app) =>
          app.status !== 'rejected' &&
          !coveredAppIds.has(app.id) &&
          !(app.studentId && students.some((s) => s.id === app.studentId))
      )
      .forEach((app) => {
        const summary = computeStudentBillingSummary({
          entityId: app.id,
          application: app,
          rooms,
          settings,
          payments: monthlyPayments,
          ledger: billingLedgers[app.id],
        });
        const bedLabel =
          app.assignedBedIdentifier ||
          (app.assignedBedNumber ? String(app.assignedBedNumber) : '');
        const roomLabel =
          app.assignedRoomNumber && bedLabel
            ? t('student.roomBedFormat', { room: app.assignedRoomNumber, bed: bedLabel })
            : app.assignedRoomNumber
            ? `${t('common.room')} ${app.assignedRoomNumber}`
            : t('student.awaitingRoom');

        rows.push({
          entityId: app.id,
          kind: 'application',
          fullName: app.fullName,
          phone: app.phone,
          passportNumber: app.passportNumber,
          referenceNumber: app.id,
          roomLabel,
          floor: summary.room?.floor,
          roomTypeLabel: summary.roomType
            ? t(`rooms.${summary.roomType}`)
            : app.preferredRoomType
            ? t(`rooms.${app.preferredRoomType}`)
            : undefined,
          capacity:
            summary.capacity ||
            (app.preferredRoomType ? ROOM_TYPE_CAPACITY[app.preferredRoomType] : undefined),
          summary,
        });
      });

    return rows;
  }, [students, applications, contracts, rooms, settings, monthlyPayments, billingLedgers, t]);

  const isRowPendingOrExpired = (summary: StudentBillingSummary) => {
    const expiry = computePaymentExpiryInfo(summary.paidUntilDate);
    return (
      summary.remainingBalance > 0 ||
      expiry.status === 'overdue' ||
      expiry.status === 'none'
    );
  };

  const kpiTotals = useMemo(() => {
    let totalPaid = 0;
    let totalBalance = 0;
    let upToDateCount = 0;
    let pendingCount = 0;

    billingRows.forEach((row) => {
      totalPaid += row.summary.totalPaid;
      totalBalance += row.summary.remainingBalance;
      if (isRowPendingOrExpired(row.summary)) {
        pendingCount += 1;
      } else {
        upToDateCount += 1;
      }
    });

    return {
      totalPaid,
      totalBalance,
      upToDateCount,
      pendingCount,
    };
  }, [billingRows]);

  const filteredRows = useMemo(() => {
    return billingRows.filter((row) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          row.fullName.toLowerCase().includes(q) ||
          row.phone.toLowerCase().includes(q) ||
          row.passportNumber.toLowerCase().includes(q) ||
          row.roomLabel.toLowerCase().includes(q) ||
          (row.referenceNumber && row.referenceNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (statusFilter === 'pending_balance') {
        return isRowPendingOrExpired(row.summary);
      }
      if (statusFilter === 'up_to_date') {
        return !isRowPendingOrExpired(row.summary);
      }
      return true;
    });
  }, [billingRows, search, statusFilter]);

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const billingSummaryMap = useMemo(
    () => new Map(billingRows.map((r) => [r.entityId, r.summary])),
    [billingRows]
  );

  const filteredPayments = useMemo(() => {
    return [...monthlyPayments]
      .filter((p) => {
        if (search.trim()) {
          const q = search.toLowerCase();
          const methodText = formatMethodLabel(p.paymentMethod, language).toLowerCase();
          const matchesSearch =
            p.studentName.toLowerCase().includes(q) ||
            p.roomNumber.toLowerCase().includes(q) ||
            (p.bedLabel && p.bedLabel.toLowerCase().includes(q)) ||
            (p.floor !== undefined && `${p.floor}`.includes(q)) ||
            p.id.toLowerCase().includes(q) ||
            p.periodMonth.toLowerCase().includes(q) ||
            methodText.includes(q) ||
            (p.notes && p.notes.toLowerCase().includes(q));
          if (!matchesSearch) return false;
        }

        if (statusFilter === 'pending_balance') {
          const summary = billingSummaryMap.get(p.studentId);
          return summary ? isRowPendingOrExpired(summary) : false;
        }
        if (statusFilter === 'up_to_date') {
          const summary = billingSummaryMap.get(p.studentId);
          return summary ? !isRowPendingOrExpired(summary) : true;
        }

        return true;
      })
      .sort(comparePaymentsChronoDesc);
  }, [monthlyPayments, search, statusFilter, billingSummaryMap, language]);

  const formatPeriodDisplay = (period: string) => {
    const found = ACADEMIC_BILLING_MONTHS.find((m) => m.period === period);
    if (!found) return period;
    if (language === 'ru') return found.ru;
    if (language === 'en') return found.en;
    return found.uz;
  };

  const statementSubject: PaymentStatementSubject | null = statementRow
    ? {
        fullName: statementRow.fullName,
        phone: statementRow.phone,
        passportNumber: statementRow.passportNumber,
        referenceNumber: statementRow.referenceNumber,
        roomLabel: statementRow.roomLabel,
        floor: statementRow.floor,
        roomTypeLabel: statementRow.roomTypeLabel,
        capacity: statementRow.capacity,
      }
    : null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {saveToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#101C32] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-[#C6A15B] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{saveToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('payments.title')}</h1>
          <p className="text-xs text-slate-500">{t('payments.subtitle')}</p>
        </div>
        {canEditBilling && (
          <button
            type="button"
            onClick={() => onOpenAddPaymentModal(undefined)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('payments.recordNew')}
          </button>
        )}
      </div>

      {/* Billing KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">{t('billing.totalPaid')}</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 tabular-nums">
            {formatCurrency(kpiTotals.totalPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t('billing.monthlyCollectionsHint')}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">{t('billing.activeArrears')}</span>
            <AlertTriangle className={`w-4 h-4 ${kpiTotals.totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`text-xl font-extrabold tabular-nums ${kpiTotals.totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(kpiTotals.totalBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpiTotals.pendingCount} {t('billing.residentsWithBalance').toLowerCase()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600">{t('billing.upToDateCount')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-700 tabular-nums">
            {kpiTotals.upToDateCount} / {billingRows.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {t('payments.filterUpToDate')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">{t('billing.residentsWithBalance')}</span>
            <Users className={`w-4 h-4 ${kpiTotals.pendingCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`text-xl font-extrabold tabular-nums ${kpiTotals.pendingCount > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
            {kpiTotals.pendingCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {billingRows.length} {t('billing.residentsCountLabel')}
          </p>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setActiveTab('residents')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'residents'
                ? 'bg-white text-[#101C32] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>{t('billing.tabResidentSchedules')} ({billingRows.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-white text-[#101C32] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-sky-600" />
            <span>{t('billing.tabTransactions')} ({monthlyPayments.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 justify-end">
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending_balance' | 'up_to_date')}
            className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">{t('payments.filterAll')} ({billingRows.length})</option>
            <option value="pending_balance">
              {t('payments.filterPendingBalance')} ({kpiTotals.pendingCount})
            </option>
            <option value="up_to_date">
              {t('payments.filterUpToDate')} ({kpiTotals.upToDateCount})
            </option>
          </select>
        </div>
      </div>

      {/* Tab 1: Resident Billing & 12-Month Schedules */}
      {activeTab === 'residents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">{t('payments.student')}</th>
                  <th className="p-3.5">{t('payments.room')}</th>
                  <th className="p-3.5">{t('billing.monthlyRate')}</th>
                  <th className="p-3.5">{t('billing.totalPaid')}</th>
                  <th className="p-3.5">{t('billing.remainingBalance')}</th>
                  <th className="p-3.5">{t('payments.daysRemainingCol')}</th>
                  <th className="p-3.5 text-right">{t('billing.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.entityId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">{row.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {row.phone}
                          {row.referenceNumber ? ` • ${row.referenceNumber}` : ''}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-sky-700">{row.roomLabel}</div>
                        {row.roomTypeLabel && (
                          <div className="text-[10px] text-slate-500">
                            {row.roomTypeLabel}
                            {row.capacity ? ` (${t('student.capacityBeds', { capacity: row.capacity })})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(row.summary.monthlyRate)}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600 tabular-nums whitespace-nowrap">
                        {formatCurrency(row.summary.totalPaid)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`font-extrabold tabular-nums ${
                            row.summary.remainingBalance > 0
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {row.summary.remainingBalance > 0
                            ? formatCurrency(row.summary.remainingBalance)
                            : t('student.noDebt')}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          {row.summary.paidUntilDate && (
                            <div className="text-[11px] font-semibold text-slate-700 tabular-nums">
                              {formatShortDateDisplay(row.summary.paidUntilDate)}
                            </div>
                          )}
                          <PaymentExpiryBadge paidUntilDate={row.summary.paidUntilDate} compact />
                        </div>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {canEditBilling && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenAddPaymentModal(row.entityId)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {t('billing.editPaymentBtn')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingEntityId(row.entityId)}
                                className="px-2.5 py-1.5 bg-[#101C32] hover:bg-[#1A2D4F] text-[#EAD096] font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#C6A15B]" />
                                {t('billing.scheduleBtn')}
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setStatementRow(row)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title={t('billing.printStatement')}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Transactions Log */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">{t('payments.paymentDate')}</th>
                  <th className="p-3.5">{t('payments.student')}</th>
                  <th className="p-3.5">{t('billing.floorRoomBed')}</th>
                  <th className="p-3.5">{t('billing.itemLabel')}</th>
                  <th className="p-3.5 text-right">{t('billing.amountPaid')}</th>
                  <th className="p-3.5">{t('payments.method')}</th>
                  <th className="p-3.5">{t('payments.paidUntilLabel')}</th>
                  <th className="p-3.5">{t('billing.notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const student = studentMap.get(p.studentId);
                    const resolvedRoom = rooms.find(
                      (r) =>
                        (student?.roomId && r.id === student.roomId) ||
                        (p.roomNumber && p.roomNumber !== '---' && r.roomNumber === p.roomNumber)
                    );
                    const resolvedFloor = p.floor ?? student?.floor ?? resolvedRoom?.floor;
                    const resolvedRoomNum =
                      p.roomNumber && p.roomNumber !== '---'
                        ? p.roomNumber
                        : student?.roomNumber;
                    const resolvedBed =
                      p.bedLabel ||
                      student?.bedIdentifier ||
                      (student?.bedNumber ? String(student.bedNumber) : undefined);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 whitespace-nowrap tabular-nums">
                          <div className="font-bold text-slate-900">
                            {formatDateTimeCommaDisplay(p.paymentDate, p.paymentTime)}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">{p.id}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900">{p.studentName}</div>
                          <div className="text-[10px] text-slate-400">{p.recordedBy}</div>
                        </td>
                        <td className="p-3.5 font-bold text-sky-700 whitespace-nowrap">
                          {formatFloorRoomBedDisplay({
                            floor: resolvedFloor,
                            roomNumber: resolvedRoomNum,
                            bedLabel: resolvedBed,
                            lang: language,
                          })}
                        </td>
                        <td className="p-3.5 font-semibold whitespace-nowrap">
                          {formatPeriodDisplay(p.periodMonth)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-600 tabular-nums whitespace-nowrap">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700">
                          {formatMethodLabel(p.paymentMethod, language)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {p.paidUntil ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 tabular-nums text-[11px]">
                                {formatShortDateDisplay(p.paidUntil)}
                              </div>
                              <PaymentExpiryBadge paidUntilDate={p.paidUntil} compact />
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600 max-w-[180px] truncate" title={p.notes || ''}>
                          {p.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Owner Per-Resident Billing Editor Modal */}
      {editingEntityId && (
        <S53_BillingEditorModal
          entityId={editingEntityId}
          onClose={() => setEditingEntityId(null)}
          onSaved={() => {
            setSaveToast(t('billing.savedToast'));
            setTimeout(() => setSaveToast(null), 4000);
          }}
        />
      )}

      {/* Printable Payment Statement / Receipt Modal */}
      {statementRow && statementSubject && (
        <PaymentStatementModal
          isOpen={Boolean(statementRow)}
          onClose={() => setStatementRow(null)}
          subject={statementSubject}
          summary={statementRow.summary}
          transactions={monthlyPayments.filter((p) => p.studentId === statementRow.entityId)}
        />
      )}
    </div>
  );
};
