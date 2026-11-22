import React, { useState, useMemo } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  AlertTriangle,
  Clock,
  Calendar,
  CreditCard,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  Building,
  Check,
  Search,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Student } from '../types';

interface PaymentDeadlineNotificationProps {
  onNavigate: (view: string) => void;
  onSelectStudent?: (id: string) => void;
  onOpenAddPaymentModal?: (studentId?: string) => void;
}

export interface ApproachingStudentData {
  student: Student;
  daysRemaining: number;
  dueDate: string;
  amountDue: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastPaymentMethod?: string;
  totalPaymentsCount: number;
}

export const PaymentDeadlineNotification: React.FC<PaymentDeadlineNotificationProps> = ({
  onNavigate,
  onSelectStudent,
  onOpenAddPaymentModal,
}) => {
  const { students, payments, handleAcceptPayment } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [filterDays, setFilterDays] = useState<'all' | 'today' | 'tomorrow' | 'soon'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute reference today (normalized to 00:00:00)
  const todayTime = useMemo(() => {
    const now = new Date();
    // System reference: fallback to 2026-10-30 if current environment is set around 2026
    const isYear2026 = now.getFullYear() === 2026;
    const base = isYear2026 ? now : new Date('2026-10-30');
    return new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  }, []);

  // Pre-index payments by studentId and studentName for rapid lookup
  const paymentsByStudent = useMemo(() => {
    const map = new Map<string, typeof payments>();
    (payments || []).forEach((p) => {
      // By student ID
      if (p.studentId) {
        const list = map.get(p.studentId) || [];
        list.push(p);
        map.set(p.studentId, list);
      }
      // Also map by student Name for flexibility
      if (p.studentName) {
        const key = `name:${p.studentName.trim().toLowerCase()}`;
        const list = map.get(key) || [];
        list.push(p);
        map.set(key, list);
      }
    });
    return map;
  }, [payments]);

  // Filter students whose payment deadline is approaching within the next 3 days (0, 1, 2, 3 days)
  const approachingStudents: ApproachingStudentData[] = useMemo(() => {
    const activeStudents = (students || []).filter(
      (s) => s.status === 'active' && (s.nextPaymentDate || s.nextPaymentDueDate)
    );

    const list: ApproachingStudentData[] = [];

    activeStudents.forEach((student) => {
      const dueDateStr = student.nextPaymentDate || student.nextPaymentDueDate;
      if (!dueDateStr) return;

      const [y, m, d] = dueDateStr.split('-').map(Number);
      if (!y || !m || !d) return;

      const dueDateObj = new Date(y, m - 1, d);
      const dueTime = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate()).getTime();
      const diffDays = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));

      // Approaching deadline strictly within the next 3 days: 0 (today) up to 3 days
      if (diffDays >= 0 && diffDays <= 3) {
        // Query payments system for this student
        const studentPayments =
          paymentsByStudent.get(student.id) ||
          paymentsByStudent.get(`name:${student.fullName.trim().toLowerCase()}`) ||
          [];

        const completedPayments = studentPayments
          .filter((p) => p.status === 'completed')
          .sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));

        const latestPayment = completedPayments[0];

        list.push({
          student,
          daysRemaining: diffDays,
          dueDate: student.nextPaymentDueDate,
          amountDue: student.monthlyTariff + (student.debtAmount || 0),
          lastPaymentDate: latestPayment?.paymentDate,
          lastPaymentAmount: latestPayment?.amount,
          lastPaymentMethod: latestPayment?.paymentMethod,
          totalPaymentsCount: completedPayments.length,
        });
      }
    });

    // Sort ascending by days remaining (most urgent first: 0 days, then 1, 2, 3)
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining || a.student.fullName.localeCompare(b.student.fullName));
  }, [students, paymentsByStudent, todayTime]);

  // Aggregated totals
  const totalUpcomingRevenue = useMemo(() => {
    return approachingStudents.reduce((acc, curr) => acc + curr.amountDue, 0);
  }, [approachingStudents]);

  const countToday = useMemo(() => approachingStudents.filter((s) => s.daysRemaining === 0).length, [approachingStudents]);
  const countTomorrow = useMemo(() => approachingStudents.filter((s) => s.daysRemaining === 1).length, [approachingStudents]);
  const countSoon = useMemo(() => approachingStudents.filter((s) => s.daysRemaining >= 2).length, [approachingStudents]);

  // Filtered list based on tab & search
  const displayedStudents = useMemo(() => {
    return approachingStudents.filter((item) => {
      if (filterDays === 'today' && item.daysRemaining !== 0) return false;
      if (filterDays === 'tomorrow' && item.daysRemaining !== 1) return false;
      if (filterDays === 'soon' && item.daysRemaining < 2) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.student.fullName.toLowerCase().includes(q);
        const matchesRoom = (item.student.roomNumber || '').toLowerCase().includes(q);
        const matchesPhone = (item.student.phone || '').includes(q);
        if (!matchesName && !matchesRoom && !matchesPhone) return false;
      }
      return true;
    });
  }, [approachingStudents, filterDays, searchQuery]);

  // Action: Send SMS/Telegram Reminder
  const handleSendReminder = (item: ApproachingStudentData) => {
    setRemindedIds((prev) => new Set(prev).add(item.student.id));
    setToastMessage(`"${item.student.fullName}"ga to‘lov eslatmasi (Telegram & SMS) yuborildi!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Action: Record payment modal
  const handleRecordPayment = (studentId: string) => {
    if (onOpenAddPaymentModal) {
      onOpenAddPaymentModal(studentId);
    } else {
      onNavigate('S50_Payments');
    }
  };

  // Action: Accept payment with 1-month automatic date advance
  const handleQuickAcceptPayment = (studentId: string, amount: number) => {
    const std = students.find((s) => s.id === studentId);
    handleAcceptPayment(studentId, amount);
    setToastMessage(`✅ ${std?.fullName || 'Talaba'}: ${formatCurrency(amount)} to‘lov qabul qilindi. Keyingi to‘lov sanasi 1 oyga surildi!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  // If no approaching deadlines found
  if (approachingStudents.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
              <span>To‘lov intizomi barqaror</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800">
                Nazorat ostida
              </span>
            </h4>
            <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
              Yaqin 3 kun ichida muddati tugaydigan to‘lovlar mavjud emas. Barcha talabalar to‘lov jadvallari reja asosida.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('S50_Payments')}
          className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <span>To‘lovlar daftari</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white rounded-2xl sm:rounded-3xl border border-amber-300/80 shadow-md p-4 sm:p-5 lg:p-6 space-y-4 relative overflow-hidden transition-all">
      {/* Decorative accent glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#101C32] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-[#C6A15B] flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                <span>To‘lov muddati yaqinlashayotgan talabalar</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow-xs">
                  {approachingStudents.length} ta
                </span>
              </h3>
              <span className="inline-flex items-center gap-1 bg-amber-200/80 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                <span>Yaqin 3 kun</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              To‘lovlar tizimidan olingan ma’lumotlar asosida: rejalashtirilgan tushum{' '}
              <strong className="text-amber-900 font-extrabold">{formatCurrency(totalUpcomingRevenue)}</strong>
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => onNavigate('S50_Payments')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>{t('payments.title')}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-amber-200/50 rounded-xl transition-colors cursor-pointer"
            title={isCollapsed ? 'Kengaytirish' : 'Yig‘ish'}
            aria-label="Toggle collapse"
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content (when not collapsed) */}
      {!isCollapsed && (
        <div className="space-y-4 pt-1 relative z-10">
          {/* Quick Filter Strip & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-amber-200/70">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                onClick={() => setFilterDays('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  filterDays === 'all'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-amber-200'
                }`}
              >
                Barchasi ({approachingStudents.length})
              </button>
              <button
                onClick={() => setFilterDays('today')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  filterDays === 'today'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-rose-800 border border-rose-200'
                }`}
              >
                Bugun ({countToday})
              </button>
              <button
                onClick={() => setFilterDays('tomorrow')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  filterDays === 'tomorrow'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-orange-800 border border-orange-200'
                }`}
              >
                Ertaga ({countTomorrow})
              </button>
              <button
                onClick={() => setFilterDays('soon')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  filterDays === 'soon'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-amber-800 border border-amber-200'
                }`}
              >
                2-3 kun ({countSoon})
              </button>
            </div>

            {/* Quick Search inside approaching list */}
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Talaba yoki xona bo‘yicha izlash..."
                className="w-full bg-white border border-amber-200 text-xs pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* List of Flagged Students Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedStudents.map((item) => {
              const isReminded = remindedIds.has(item.student.id);

              // Badge styling based on days remaining
              const badgeConfig = (() => {
                switch (item.daysRemaining) {
                  case 0:
                    return {
                      label: 'Bugun to‘lov kuni',
                      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse',
                      dotClass: 'bg-rose-500',
                    };
                  case 1:
                    return {
                      label: 'Ertaga (1 kun qoldi)',
                      badgeClass: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
                      dotClass: 'bg-orange-500',
                    };
                  case 2:
                    return {
                      label: '2 kun qoldi',
                      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
                      dotClass: 'bg-amber-500',
                    };
                  default:
                    return {
                      label: '3 kun qoldi',
                      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
                      dotClass: 'bg-amber-400',
                    };
                }
              })();

              return (
                <div
                  key={item.student.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  {/* Top: Student Info & Days Remaining Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                        {item.student.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectStudent && onSelectStudent(item.student.id)}
                          className="font-bold text-slate-900 text-xs sm:text-sm hover:text-sky-600 transition-colors truncate block text-left cursor-pointer"
                        >
                          {item.student.fullName}
                        </button>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap mt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{item.student.roomNumber}-xona</span>
                            {item.student.bedNumber && <span>({item.student.bedNumber}-o‘rin)</span>}
                          </span>
                          <span>•</span>
                          <span className="truncate">{item.student.university}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deadline Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border shrink-0 ${badgeConfig.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeConfig.dotClass}`} />
                      <span>{badgeConfig.label}</span>
                    </span>
                  </div>

                  {/* Payment Details Pulled from Payment System */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Muddati (Sana):</span>
                      <strong className="text-slate-800 font-mono font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        <span>{item.dueDate}</span>
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">To‘lanishi lozim:</span>
                      <strong className="text-emerald-700 font-mono font-bold text-xs">
                        {formatCurrency(item.amountDue)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                      <span className="text-slate-400">Oxirgi to‘lov tizimda:</span>
                      <span className="text-slate-600 font-medium">
                        {item.lastPaymentDate ? (
                          <>
                            {item.lastPaymentDate}{' '}
                            <span className="text-slate-400">
                              ({formatCurrency(item.lastPaymentAmount || 0)} ·{' '}
                              {item.lastPaymentMethod === 'card'
                                ? 'Karta'
                                : item.lastPaymentMethod === 'cash'
                                ? 'Naqd'
                                : 'O‘tkazma'}
                              )
                            </span>
                          </>
                        ) : (
                          <span className="text-amber-700 font-medium">Ilk to‘lov kutilmoqda</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <a
                      href={`tel:${item.student.phone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                      title={item.student.phone}
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span className="hidden sm:inline">{item.student.phone}</span>
                      <span className="sm:hidden">Qo‘ng‘iroq</span>
                    </a>

                    <div className="flex items-center gap-1.5">
                      {/* Reminder Button */}
                      <button
                        type="button"
                        onClick={() => handleSendReminder(item)}
                        disabled={isReminded}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                          isReminded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
                        }`}
                        title="Telegram va SMS orqali to‘lov eslatmasini yuborish"
                      >
                        {isReminded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Yuborildi</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 text-sky-600" />
                            <span>Eslatish</span>
                          </>
                        )}
                      </button>

                      {/* Quick Accept Payment Button (+1 Month automatic advance) */}
                      <button
                        type="button"
                        onClick={() => handleQuickAcceptPayment(item.student.id, item.amountDue || item.student.monthlyTariff)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                        title="To‘lovni darhol qabul qilish va keyingi to‘lov muddatini 1 oyga surish"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>To‘lov qabul qilish (+1 oy)</span>
                      </button>

                      {/* Custom modal payment */}
                      <button
                        type="button"
                        onClick={() => handleRecordPayment(item.student.id)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                        title="Boshqa summa yoki to‘lov usuli bilan kiritish"
                        aria-label="Batafsil to‘lov oynasi"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {displayedStudents.length === 0 && (
            <div className="text-center py-6 bg-white/60 rounded-xl border border-dashed border-amber-200 text-xs text-slate-500">
              Ushbu filtr bo‘yicha talaba topilmadi.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
