import React, { useState, useMemo } from 'react';
import {
  Wrench,
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Settings,
  Mail,
  MessageSquare,
  Sparkles,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react';
import { Issue, Contract, Room } from '../types';
import {
  extractStaffTasks,
  triggerDailyStaffAlerts,
  MaintenanceTaskItem,
  ContractRenewalTaskItem,
  AlertDispatchResult,
} from '../services/alertTaskService';
import { useI18n } from '../i18n/I18nContext';

interface DashboardTasksWidgetProps {
  issues: Issue[];
  contracts: Contract[];
  rooms: Room[];
  onNavigate: (view: string) => void;
  onSelectStudent?: (id: string) => void;
}

export const DashboardTasksWidget: React.FC<DashboardTasksWidgetProps> = ({
  issues,
  contracts,
  rooms,
  onNavigate,
  onSelectStudent,
}) => {
  const { formatCurrency } = useI18n();
  const [activeTab, setActiveTab] = useState<'all' | 'maintenance' | 'renewals'>('all');
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<AlertDispatchResult | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Extract all pending tasks
  const { maintenanceTasks, contractTasks, allTasks } = useMemo(() => {
    return extractStaffTasks(issues, contracts, rooms, 20);
  }, [issues, contracts, rooms]);

  const displayedTasks = useMemo(() => {
    if (activeTab === 'maintenance') return maintenanceTasks;
    if (activeTab === 'renewals') return contractTasks;
    return allTasks;
  }, [activeTab, maintenanceTasks, contractTasks, allTasks]);

  // Trigger automated dispatch
  const handleSendDailyAlert = async () => {
    setIsSending(true);
    setDispatchResult(null);
    try {
      const res = await triggerDailyStaffAlerts(maintenanceTasks, contractTasks, 'manual_admin');
      setDispatchResult(res);
      // Auto-hide success badge after 8 seconds
      setTimeout(() => {
        setDispatchResult((prev) => (prev ? { ...prev, message: '' } : null));
      }, 8000);
    } catch (e: any) {
      console.error('Failed to trigger staff alerts', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Widget Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-amber-50/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-[#101C32] text-[#C6A15B] shrink-0">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              ⚡ Kunlik vazifalar & Xabarnomalar
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Telegram & Email
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Kutilayotgan ta’mirlash va muddati yaqinlashayotgan shartnomalar bo‘yicha xodimlar uchun tezkor nazorat
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Xabarnoma sozlamalari va kanallari"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Kanal sozlamalari</span>
          </button>

          <button
            type="button"
            onClick={handleSendDailyAlert}
            disabled={isSending}
            className="px-3.5 py-2 rounded-xl bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs transition-all disabled:opacity-50"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Yuborilmoqda...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Xabarni hoziroq yuborish</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instant Dispatch Feedback Alert Banner */}
      {dispatchResult && dispatchResult.message && (
        <div className="bg-emerald-50/90 border-b border-emerald-200 p-3.5 px-5 flex items-center justify-between gap-3 text-xs text-emerald-900 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">{dispatchResult.message}</span>
              <span className="text-emerald-700 ml-2 text-[11px]">
                ({dispatchResult.timestamp} • Telegram: {dispatchResult.channels.telegram.chatId} • Email:{' '}
                {dispatchResult.channels.email.recipients.join(', ')})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer shrink-0"
          >
            Xabarni ko‘rish →
          </button>
        </div>
      )}

      {/* Overview Counters & Tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Card 1: Pending Maintenance */}
          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'maintenance'
                ? 'bg-rose-50/80 border-rose-300 shadow-2xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-rose-600" />
                Ta’mirlash topshiriqlari
              </div>
              <div className="text-xl font-black text-rose-950 font-mono mt-1">
                {maintenanceTasks.length} ta
              </div>
              <div className="text-[10px] text-rose-600 mt-0.5">
                Kutilayotgan texnik nosozliklar
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
          </button>

          {/* Card 2: Upcoming Renewals */}
          <button
            type="button"
            onClick={() => setActiveTab('renewals')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'renewals'
                ? 'bg-sky-50/80 border-sky-300 shadow-2xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                Shartnoma yangilash
              </div>
              <div className="text-xl font-black text-sky-950 font-mono mt-1">
                {contractTasks.length} ta
              </div>
              <div className="text-[10px] text-sky-600 mt-0.5">
                Muddati 20 kun ichida tugaydi
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-sky-400 shrink-0" />
          </button>

          {/* Card 3: Total Pending Staff Actions */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'all'
                ? 'bg-[#101C32]/5 border-[#101C32]/30 shadow-2xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
                Jami vazifalar
              </div>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                {allTasks.length} ta
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Navbatchi xodimlar ro‘yxatida
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Filter Tab Chips */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#101C32] text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Barchasi ({allTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'maintenance'
                ? 'bg-rose-600 text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Ta’mirlash ({maintenanceTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('renewals')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'renewals'
                ? 'bg-sky-600 text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Shartnomalar ({contractTasks.length})
          </button>
        </div>
      </div>

      {/* Task Items List */}
      <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
        {displayedTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-xs font-semibold text-slate-600">
              Ushbu toifada kutilayotgan vazifalar yo‘q. Barchasi bajarilgan!
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => {
            if (task.type === 'maintenance') {
              const m = task as MaintenanceTaskItem;
              return (
                <div
                  key={`task-${m.id}`}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        m.priority === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : m.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {m.location || `${m.roomNumber}-xona`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.priority === 'critical'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : m.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {m.priority === 'critical'
                            ? '🔴 Zudlik bilan'
                            : m.priority === 'high'
                            ? '🟠 Yuqori daraja'
                            : '🟡 O‘rtacha'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {m.category}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs line-clamp-1">{m.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-amber-700">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {m.daysPending} kun kutilmoqda
                        </span>
                        {m.assignedStaff ? (
                          <span>Mas’ul: {m.assignedStaff}</span>
                        ) : (
                          <span className="text-rose-600 font-semibold">Ustaga biriktirilmagan</span>
                        )}
                        <span>Xabar beruvchi: {m.reporter}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate('S100_Issues')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#101C32] hover:text-[#C6A15B] text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Hal qilish</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // Contract renewal task
            const c = task as ContractRenewalTaskItem;
            return (
              <div
                key={`task-${c.id}`}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      c.isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {c.studentName}
                      </span>
                      <span className="text-sky-700 font-bold bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md text-[11px]">
                        {c.roomNumber}-xona • {c.bedNumber}-o‘rin
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isOverdue
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : c.daysRemaining <= 7
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}
                      >
                        {c.isOverdue
                          ? `⚠️ Muddati o‘tgan (${Math.abs(c.daysRemaining)} kun)`
                          : `⏳ ${c.daysRemaining} kun qoldi`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span>Shartnoma: <strong className="font-mono text-slate-700">{c.contractNumber}</strong></span>
                      <span>Tugash sanasi: <strong className="text-slate-800">{c.endDate}</strong></span>
                      <span>Tarif: <strong className="text-emerald-600 font-bold">{formatCurrency(c.tariffMonthly)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigate('S80_Contracts')}
                    className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-800 border border-sky-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Uzaytirish</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Widget Footer: Alert Channels & Schedule Status */}
      <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
            Telegram: <span className="font-mono text-sky-700">@royalcampus_staff</span>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            Email: <span className="font-mono text-amber-800">staff@royalcampus.uz</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400">Har kuni soat 09:00 da avtomatik yuboriladi</span>
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="text-sky-600 hover:text-sky-700 font-bold underline cursor-pointer"
          >
            Namuna ko‘rish
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#101C32]" />
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Avtomatik Xabarnomalar Sozlamalari
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sky-800">
                <span className="font-bold">Backend Cron & Bot Integratsiyasi:</span> Tizim har kuni ertalab soat 09:00 da bazani to‘liq tekshirib, kutilayotgan ta’mirlash va shartnoma uzaytirishlarini xodimlar guruhiga yo‘llaydi.
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Telegram Kanal / Guruh ID</label>
                <input
                  type="text"
                  readOnly
                  value="@royalcampus_staff"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-700 text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  .env fayli orqali: <code>TELEGRAM_STAFF_CHAT_ID</code>
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Xodimlar Email Manzillari</label>
                <input
                  type="text"
                  readOnly
                  value="staff@royalcampus.uz, manager@royalcampus.uz"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-700 text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  .env fayli orqali: <code>STAFF_ALERT_EMAILS</code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Avtomatik vaqt</div>
                  <div className="text-base font-extrabold text-slate-800 font-mono mt-0.5">Har kuni 09:00</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Ogohlantirish oynasi</div>
                  <div className="text-base font-extrabold text-slate-800 font-mono mt-0.5">20 kun oldin</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfigModal(false);
                  handleSendDailyAlert();
                }}
                className="px-4 py-2 bg-[#101C32] hover:bg-[#1A2D4F] text-[#C6A15B] rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test xabarini yuborish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Telegram & Email Xabarnomasi Namunasi
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3.5 text-xs flex-1 pr-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Xodimlarga yuboriladigan Telegram xabari formati:
              </div>
              <div className="bg-[#101C32] text-slate-100 p-4 rounded-xl font-mono text-[11px] whitespace-pre-wrap border border-[#C6A15B]/30 leading-relaxed">
                {`🏢 Royal Campus — XODIMLAR UCHUN KUNLIK HISOBOT\n📅 Sana: 30.10.2026 09:00\n━━━━━━━━━━━━━━━━━━━━━\n\n🔧 KUTILAYOTGAN TA’MIRLASH ISHLARI (${maintenanceTasks.length} ta):\n`}
                {maintenanceTasks.map((m, i) => `${i + 1}. ${m.location || `${m.roomNumber}-xona`} [${m.priority.toUpperCase()}]\n   • Muammo: ${m.description}\n   • Kategoriya: ${m.category} | Kutish: ${m.daysPending} kun\n`).join('\n')}
                {`\n📄 MUDDATI YA QINLASHAYOTGAN SHARTNOMALAR (${contractTasks.length} ta):\n`}
                {contractTasks.map((c, i) => `${i + 1}. ${c.studentName} — ${c.roomNumber}-xona\n   • Shartnoma: ${c.contractNumber} (${c.daysRemaining} kun qoldi)\n   • Tarif: ${c.tariffMonthly.toLocaleString('uz-UZ')} so'm\n`).join('\n')}
                {`\n━━━━━━━━━━━━━━━━━━━━━\nTizimga kirish: https://royalcampus.uz/dashboard`}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Kanal: @royalcampus_staff • Email: staff@royalcampus.uz
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-[#101C32] text-[#C6A15B] rounded-xl font-bold text-xs cursor-pointer"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
