import React, { useState, useMemo } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  Search,
  Plus,
  BedDouble,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Student } from '../types';
import { HighlightText } from '../components/HighlightText';

interface StudentsListProps {
  onSelectStudent: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenAssignModal?: (stdId: string) => void;
}

export const S20_StudentsList: React.FC<StudentsListProps> = ({
  onSelectStudent,
  onOpenAddModal,
  onOpenAssignModal,
}) => {
  const { students, payments, role } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'overdue' | 'name'>('deadline');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Configurable 7-day payment warning window
  const WARNING_DAYS = 7;

  // 1. Eligible approved students awaiting bed assignment
  const unassignedStudents = useMemo(() => {
    return students.filter((s) => {
      const isUnassigned =
        (s.status === 'active' || s.status === 'applicant') &&
        (!s.roomId || !s.bedId || !s.roomNumber || s.roomNumber === '---');
      if (!isUnassigned) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const qClean = q.replace(/\s+/g, '');
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchPass =
          s.passportNumber.toLowerCase().includes(q) ||
          s.passportNumber.replace(/\s+/g, '').toLowerCase().includes(qClean);
        const matchPhone = s.phone && (s.phone.includes(q) || s.phone.replace(/\s+/g, '').includes(qClean));
        const matchUniv = s.university && s.university.toLowerCase().includes(q);
        const matchGroup = s.group && s.group.toLowerCase().includes(q);
        return matchName || matchPass || matchPhone || matchUniv || matchGroup;
      }

      return true;
    });
  }, [students, search]);

  // Map total completed payments for each student
  const studentPaidMap = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((p) => {
      if (p.status === 'completed') {
        map.set(p.studentId, (map.get(p.studentId) || 0) + p.amount);
      }
    });
    return map;
  }, [payments]);

  // Payment status & deadline ranking calculation
  const getStudentPaymentInfo = (s: Student) => {
    const now = new Date();
    const deadlineStr = s.nextPaymentDate || s.nextPaymentDueDate || s.paidUntil;

    // Rank 1: Overdue with debt
    if (s.debtAmount > 0) {
      let daysLate = 0;
      let ts = 0;
      if (deadlineStr) {
        const d = new Date(deadlineStr);
        ts = d.getTime();
        daysLate = Math.max(1, Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
      }
      return {
        status: 'overdue' as const,
        deadlineDate: deadlineStr || null,
        daysRemaining: -daysLate,
        sortRank: 1,
        sortTimestamp: ts || 0,
      };
    }

    // Rank 5: No deadline information
    if (!deadlineStr) {
      return {
        status: 'no_deadline' as const,
        deadlineDate: null,
        daysRemaining: null,
        sortRank: 5,
        sortTimestamp: Infinity,
      };
    }

    const dueDate = new Date(deadlineStr);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Rank 2: Passed deadline but no formal debt recorded yet -> Payment Due
    if (diffDays < 0) {
      return {
        status: 'pending' as const,
        deadlineDate: deadlineStr,
        daysRemaining: diffDays,
        sortRank: 2,
        sortTimestamp: dueDate.getTime(),
      };
    }

    // Rank 3: Deadline approaching within warning window (7 days)
    if (diffDays <= WARNING_DAYS) {
      return {
        status: 'due_soon' as const,
        deadlineDate: deadlineStr,
        daysRemaining: diffDays,
        sortRank: 3,
        sortTimestamp: dueDate.getTime(),
      };
    }

    // Rank 4: Settled and paid up
    return {
      status: 'paid' as const,
      deadlineDate: deadlineStr,
      daysRemaining: diffDays,
      sortRank: 4,
      sortTimestamp: dueDate.getTime(),
    };
  };

  // Filtered & sorted student list
  const sortedAndFilteredStudents = useMemo(() => {
    const filtered = students.filter((s) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const qClean = q.replace(/\s+/g, '');
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchPass =
          s.passportNumber.toLowerCase().includes(q) ||
          s.passportNumber.replace(/\s+/g, '').toLowerCase().includes(qClean);
        const matchRoom =
          (s.roomNumber && s.roomNumber.toLowerCase().includes(q)) ||
          (s.bedNumber && String(s.bedNumber).includes(q));
        const matchPhone =
          s.phone &&
          (s.phone.includes(q) || s.phone.replace(/\s+/g, '').includes(qClean));
        const matchUniv = s.university && s.university.toLowerCase().includes(q);
        const matchGroup = s.group && s.group.toLowerCase().includes(q);
        if (!matchName && !matchPass && !matchRoom && !matchPhone && !matchUniv && !matchGroup) return false;
      }

      // Floor filter
      if (floorFilter !== 'all' && s.floor !== floorFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      // Payment filter
      if (paymentFilter === 'overdue' && s.debtAmount === 0) return false;
      if (paymentFilter === 'paid' && s.debtAmount > 0) return false;

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.fullName.localeCompare(b.fullName);
      }
      if (sortBy === 'overdue') {
        if (a.debtAmount !== b.debtAmount) {
          return b.debtAmount - a.debtAmount; // Largest debt first
        }
      }
      // Default: 'deadline' (nearest unpaid deadline first)
      const payA = getStudentPaymentInfo(a);
      const payB = getStudentPaymentInfo(b);

      if (payA.sortRank !== payB.sortRank) {
        return payA.sortRank - payB.sortRank;
      }
      if (payA.sortTimestamp !== payB.sortTimestamp) {
        return payA.sortTimestamp - payB.sortTimestamp;
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }, [students, search, floorFilter, statusFilter, paymentFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedAndFilteredStudents.length / ITEMS_PER_PAGE) || 1;

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredStudents, currentPage]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('students.title')}</h1>
          <p className="text-xs text-slate-500">{t('students.subtitle')}</p>
        </div>
        {role !== 'security' && (
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C6A15B]" />
            {t('students.addStudent')}
          </button>
        )}
      </div>

      {/* Priority Section: Students who need bed assignments */}
      <div className="bg-white rounded-2xl border border-amber-200/90 shadow-2xs overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/70 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <BedDouble className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  {t('students.awaitingCount', { count: unassignedStudents.length })}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  {unassignedStudents.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {unassignedStudents.length > 0
                  ? 'Yotoqxonaga tasdiqlangan, ammo xona va o‘rin biriktirilmagan talabalar'
                  : t('students.noAwaiting')}
              </p>
            </div>
          </div>
        </div>

        {unassignedStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-xs font-semibold text-slate-600">{t('students.noAwaiting')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50/50 text-slate-500 font-bold border-b border-amber-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">{t('students.fullName')}</th>
                  <th className="p-3.5">{t('students.phone')}</th>
                  <th className="p-3.5">{t('students.university')}</th>
                  <th className="p-3.5">{t('students.status')}</th>
                  <th className="p-3.5">{t('rooms.title')}</th>
                  <th className="p-3.5">{t('applications.submittedAt')}</th>
                  <th className="p-3.5 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {unassignedStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900">
                        <HighlightText text={std.fullName} query={search} />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        <HighlightText text={std.passportNumber} query={search} />
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      <HighlightText text={std.phone} query={search} />
                    </td>
                    <td className="p-3.5 max-w-[180px] truncate">
                      <div>
                        <HighlightText text={std.university} query={search} />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {std.course}-{t('common.course')} (<HighlightText text={std.group} query={search} />)
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                        {t(`students.status.${std.status}`) || std.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        {t('beds.available')}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">{formatDate(std.createdAt)}</td>
                    <td className="p-3.5 text-right">
                      {role !== 'security' && onOpenAssignModal && (
                        <button
                          type="button"
                          onClick={() => onOpenAssignModal(std.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t('students.assignBed')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Search, Filters & Sorting Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search bar */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('header.searchPlaceholder')}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Tozalash"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Floor filter */}
          <div>
            <select
              value={floorFilter}
              onChange={(e) => {
                setFloorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white font-medium text-slate-700"
            >
              <option value="all">{t('students.filterAllFloors')}</option>
              <option value={2}>2-{t('common.floor')}</option>
              <option value={3}>3-{t('common.floor')}</option>
              <option value={4}>4-{t('common.floor')}</option>
              <option value={5}>5-{t('common.floor')}</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white font-medium text-slate-700"
            >
              <option value="all">{t('students.filterAllStatuses')}</option>
              <option value="active">{t('students.filterActive')}</option>
              <option value="former">{t('students.status.former')}</option>
              <option value="deleted_pending_purge">{t('students.status.deleted')}</option>
            </select>
          </div>

          {/* Sorting rule */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white font-medium text-slate-700"
            >
              <option value="deadline">{t('students.sortDeadline')}</option>
              <option value="overdue">{t('students.sortOverdue')}</option>
              <option value="name">{t('students.sortName')}</option>
            </select>
          </div>
        </div>

        {search.trim() && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 text-slate-500">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              <span>
                "{search}" qidiruvi bo‘yicha{' '}
                <strong className="text-slate-900 font-bold">
                  {sortedAndFilteredStudents.length}
                </strong>{' '}
                ta talaba topildi (mos kelgan matnlar sariq fonda belgilandi)
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer text-left sm:text-right"
            >
              Qidiruvni tozalash
            </button>
          </div>
        )}
      </div>

      {/* Main Students & Payment Deadline Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">{t('students.fullName')}</th>
                <th className="p-3.5">{t('students.roomBed')}</th>
                <th className="p-3.5">{t('students.monthlyTariff')}</th>
                <th className="p-3.5">{t('students.amountPaid')}</th>
                <th className="p-3.5">{t('students.debt')}</th>
                <th className="p-3.5">{t('students.paymentDeadline')}</th>
                <th className="p-3.5">{t('payments.collectionStatus')}</th>
                <th className="p-3.5 text-right">{t('students.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    {search ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">
                          "{search}" bo‘yicha talaba topilmadi
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setCurrentPage(1);
                          }}
                          className="mt-1 text-xs text-sky-600 hover:text-sky-700 font-bold underline cursor-pointer"
                        >
                          Qidiruvni tozalash
                        </button>
                      </div>
                    ) : (
                      t('students.noStudents')
                    )}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => {
                  const payInfo = getStudentPaymentInfo(std);
                  const totalPaid = studentPaidMap.get(std.id) || 0;
                  const hasDebt = std.debtAmount > 0;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                      {/* Full Name & Passport & Phone */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">
                          <HighlightText text={std.fullName} query={search} />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap mt-0.5">
                          <HighlightText text={std.passportNumber} query={search} />
                          {std.phone && (
                            <>
                              <span>•</span>
                              <HighlightText text={std.phone} query={search} />
                            </>
                          )}
                        </div>
                      </td>

                      {/* Room & Bed */}
                      <td className="p-3.5">
                        {std.roomNumber ? (
                          <div>
                            <span className="font-bold text-sky-700">
                              {t('common.room')}{' '}
                              <HighlightText text={std.roomNumber} query={search} />
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {std.floor}-{t('common.floor')} •{' '}
                              <HighlightText text={std.bedNumber} query={search} />-{t('common.bed')} ({std.roomType?.toUpperCase()})
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold text-[11px]">{t('beds.available')}</span>
                        )}
                      </td>

                      {/* Monthly Tariff */}
                      <td className="p-3.5 font-bold text-slate-700">
                        {formatCurrency(std.monthlyTariff)}
                      </td>

                      {/* Amount Paid */}
                      <td className="p-3.5 font-semibold text-emerald-600">
                        {formatCurrency(totalPaid)}
                      </td>

                      {/* Outstanding Balance / Debt */}
                      <td className="p-3.5">
                        {hasDebt ? (
                          <span className="font-bold text-rose-600">
                            {formatCurrency(std.debtAmount)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">{t('student.noDebt')}</span>
                        )}
                      </td>

                      {/* Payment Deadline ("To‘lov muddati") */}
                      <td className="p-3.5">
                        {payInfo.deadlineDate ? (
                          <div>
                            <div className="font-semibold text-slate-800">
                              {formatDate(payInfo.deadlineDate)}
                            </div>
                            {payInfo.status === 'overdue' && payInfo.daysRemaining !== null && (
                              <span className="text-[10px] font-bold text-rose-600 block">
                                {t('students.daysOverdue', { days: Math.abs(payInfo.daysRemaining) })}
                              </span>
                            )}
                            {payInfo.status === 'due_soon' && payInfo.daysRemaining !== null && (
                              <span className="text-[10px] font-bold text-amber-600 block">
                                {t('students.daysLeft', { days: payInfo.daysRemaining })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">---</span>
                        )}
                      </td>

                      {/* 4 Required Status Indicators */}
                      <td className="p-3.5">
                        {payInfo.status === 'overdue' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            {t('students.status.overdue')}
                          </span>
                        ) : payInfo.status === 'due_soon' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            {t('students.status.dueSoon')}
                          </span>
                        ) : payInfo.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <Clock className="w-3 h-3 text-sky-600 shrink-0" />
                            {t('students.status.pendingPayment')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            {t('students.status.paid')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {role !== 'security' && !std.roomNumber && onOpenAssignModal && (
                            <button
                              type="button"
                              onClick={() => onOpenAssignModal(std.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              + {t('students.assignBed')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectStudent(std.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-[#101C32] hover:text-[#C6A15B] text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {t('common.details')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controller */}
        {sortedAndFilteredStudents.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              {t('common.total')}: <strong className="text-slate-900">{sortedAndFilteredStudents.length}</strong> {t('nav.students').toLowerCase()} (
              {currentPage} / {totalPages} {t('common.next').toLowerCase()})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Previous Page"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    return Math.abs(page - currentPage) <= 1;
                  })
                  .reduce<(number | string)[]>((acc, page, idx, arr) => {
                    if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-2 text-slate-400 font-medium">
                          ...
                        </span>
                      );
                    }
                    const pageNum = item as number;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 px-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#101C32] text-[#C6A15B] border-[#101C32] shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
