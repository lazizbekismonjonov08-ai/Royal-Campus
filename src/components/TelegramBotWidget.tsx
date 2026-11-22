import React, { useState, useRef, useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { MessageSquare, Send, Bot, CheckCheck } from 'lucide-react';
import { ModalCloseButton } from './ModalCloseButton';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

export const TelegramBotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { students, activeStudentId, setActiveStudentId, createIssue, payments, contracts } = useDorm();
  const { t, formatCurrency, formatDate } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [reportingIssueStep, setReportingIssueStep] = useState<'none' | 'category' | 'desc'>('none');
  const [tempCategory, setTempCategory] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const activeStudent = students.find((s) => s.id === activeStudentId) || students[0];

  useEffect(() => {
    if (messages.length === 0 && activeStudent) {
      setMessages([
        {
          id: '1',
          sender: 'bot',
          text: t('telegram.welcome', {
            name: activeStudent.fullName || 'Resident',
            room: activeStudent.roomNumber ? `${t('common.room')} ${activeStudent.roomNumber}` : t('beds.available'),
          }),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [activeStudent, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotReply = (replyText: string) => {
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 400);
  };

  const handleSend = (customText?: string) => {
    const textToSend = customText || inputText.trim();
    if (!textToSend) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');

    // Process Bot commands
    const cmd = textToSend.trim();

    if (reportingIssueStep === 'desc') {
      createIssue({
        category: (tempCategory as any) || 'other',
        location: `${activeStudent?.roomNumber || '---'} ${t('common.room')}`,
        roomNumber: activeStudent?.roomNumber,
        description: textToSend,
        priority: 'medium',
      });
      setReportingIssueStep('none');
      setTempCategory('');
      addBotReply(`${t('telegram.issueSubmitted')} #${Date.now().toString().slice(-4)}`);
      return;
    }

    if (cmd === '/start') {
      addBotReply(
        `👋 ${t('telegram.header')}\n\n` +
        `• ${t('telegram.btn.profile')}\n` +
        `• ${t('telegram.btn.room')}\n` +
        `• ${t('telegram.btn.payments')}\n` +
        `• ${t('telegram.btn.contract')}\n` +
        `• ${t('telegram.btn.notifs')}\n` +
        `• ${t('telegram.btn.issue')}`
      );
    } else if (cmd.includes('Profil') || cmd.includes('Profile') || cmd.includes('Профиль')) {
      addBotReply(
        `👤 ${t('studentProfile.title').toUpperCase()}\n` +
        `--------------------\n` +
        `• ${t('students.fullName')}: ${activeStudent?.fullName}\n` +
        `• ${t('students.phone')}: ${activeStudent?.phone}\n` +
        `• ${t('students.passport')}: ${activeStudent?.passportNumber}\n` +
        `• ${t('students.university')}: ${activeStudent?.university}\n` +
        `• ${t('studentProfile.courseGroup')}: ${activeStudent?.course} (${activeStudent?.group})\n` +
        `• ${t('students.permanentAddress')}: ${activeStudent?.permanentAddress}`
      );
    } else if (cmd.includes('Xonam') || cmd.includes('Room') || cmd.includes('комната')) {
      addBotReply(
        `🛏 ${t('studentRoom.title').toUpperCase()}\n` +
        `--------------------\n` +
        `• ${t('common.floor')}: ${activeStudent?.floor || 2}-${t('common.floor')}\n` +
        `• ${t('common.room')}: ${activeStudent?.roomNumber ? `${t('common.room')} ${activeStudent.roomNumber}` : t('beds.available')}\n` +
        `• ${t('studentRoom.yourBed')}: ${activeStudent?.bedNumber || '-'}-${t('common.bed')}\n` +
        `• ${t('contracts.tariff')}: ${activeStudent?.roomType?.toUpperCase() || 'COMFORT'}\n` +
        `• ${t('student.monthlyTariff')}: ${formatCurrency(activeStudent?.monthlyTariff || 0)}`
      );
    } else if (cmd.includes('To‘lov') || cmd.includes('Payment') || cmd.includes('Платеж')) {
      const studentPayments = payments.filter((p) => p.studentId === activeStudent?.id);
      const lastPayment = studentPayments[0];
      const statusText = (activeStudent?.debtAmount || 0) > 0 ? `⚠️ ${formatCurrency(activeStudent?.debtAmount || 0)}` : `✅ ${t('student.noDebt')}`;

      addBotReply(
        `💳 ${t('studentPayments.title').toUpperCase()}\n` +
        `--------------------\n` +
        `• ${t('common.status')}: ${statusText}\n` +
        `• ${t('student.paidUntil')}: ${formatDate(activeStudent?.paidUntil || '')}\n` +
        `• ${t('student.nextPaymentDue')}: ${formatDate(activeStudent?.nextPaymentDueDate || '')}\n` +
        `• ${t('payments.amount')}: ${lastPayment ? `${formatCurrency(lastPayment.amount)} (${formatDate(lastPayment.paymentDate)})` : t('common.noData')}`
      );
    } else if (cmd.includes('Shartnoma') || cmd.includes('Contract') || cmd.includes('Договор')) {
      const stdContract = contracts.find((c) => c.studentId === activeStudent?.id);
      addBotReply(
        `📄 ${t('studentContract.title').toUpperCase()}\n` +
        `--------------------\n` +
        `• ${t('contracts.number')}: ${stdContract?.contractNumber || 'RC-2026/001'}\n` +
        `• ${t('contracts.period')}: ${formatDate(stdContract?.startDate || '2026-09-01')} - ${formatDate(stdContract?.endDate || '2027-06-30')}\n` +
        `• ${t('common.status')}: ${t('common.active')}\n\n` +
        `${t('student.downloadContract')}`
      );
    } else if (cmd.includes('Bildirishnoma') || cmd.includes('Notif') || cmd.includes('Уведомлен')) {
      addBotReply(
        `🔔 ${t('notifications.title').toUpperCase()}\n` +
        `--------------------\n` +
        `1. [2026-10-01] ${t('payments.status.paid')}: September\n` +
        `2. [2026-09-25] ${t('studentContract.rulesNotice')}`
      );
    } else if (cmd.includes('Muammo') || cmd.includes('Issue') || cmd.includes('Проблем')) {
      setReportingIssueStep('category');
      addBotReply(
        `🛠 ${t('telegram.issuePromptCategory')}\n\n` +
        `1️⃣ ${t('issues.cat.plumbing')}\n` +
        `2️⃣ ${t('issues.cat.electric')}\n` +
        `3️⃣ ${t('issues.cat.wifi')}\n` +
        `4️⃣ ${t('issues.cat.furniture')}\n` +
        `5️⃣ ${t('issues.cat.cleanliness')}`
      );
    } else if (reportingIssueStep === 'category') {
      setTempCategory('plumbing');
      setReportingIssueStep('desc');
      addBotReply(t('telegram.issuePromptDesc'));
    } else {
      addBotReply(t('telegram.placeholder'));
    }
  };

  return (
    <>
      {/* Trigger floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-30 flex items-center gap-1.5 sm:gap-2 bg-[#101C32] text-[#C6A15B] border border-[#C6A15B]/60 p-2.5 sm:px-4 sm:py-2.5 rounded-full shadow-2xl hover:bg-[#1A2D4F] transition-all focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:ring-offset-2 cursor-pointer group active:scale-95 min-h-[44px] min-w-[44px]"
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
          right: 'max(1rem, env(safe-area-inset-right, 1rem))',
        }}
        title={t('telegram.header')}
        aria-label="Royal Bot"
      >
        <Bot className="w-5 h-5 text-[#C6A15B] group-hover:scale-110 transition-transform shrink-0" />
        <span className="text-xs sm:text-sm font-bold whitespace-nowrap hidden min-[400px]:inline text-white">Royal Bot</span>
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A15B] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C6A15B]"></span>
        </span>
      </button>

      {/* Telegram Window Drawer */}
      {isOpen && (
        <>
          {/* Mobile backdrop so tapping outside dismisses the chat */}
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-2xs z-35 sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className="fixed inset-x-2.5 bottom-16 sm:inset-x-auto sm:right-6 sm:bottom-20 sm:w-96 h-[490px] max-h-[calc(100dvh-5.5rem)] bg-white rounded-2xl shadow-2xl border border-[#C6A15B]/30 z-40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{
              bottom: 'max(4.5rem, calc(4rem + env(safe-area-inset-bottom, 0px)))',
            }}
          >
          {/* Header */}
          <div className="bg-[#101C32] border-b border-[#C6A15B]/30 text-white p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0A1220] flex items-center justify-center font-bold text-[#C6A15B] border border-[#C6A15B]/50">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight text-white tracking-tight">
                  {t('telegram.header')}
                </h3>
                <p className="text-xs text-[#C6A15B] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B]"></span>
                  {t('telegram.connected')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <ModalCloseButton
                onClose={() => setIsOpen(false)}
                variant="dark"
                size="sm"
                ariaLabel={t('common.close')}
              />
            </div>
          </div>

          {/* Student Switcher Bar */}
          <div className="bg-[#F7F5F0] px-3 py-1.5 border-b border-[#EDE9DF] flex items-center justify-between text-xs">
            <span className="text-[#101C32] font-semibold truncate text-[11px]">{t('students.studentDetails')}:</span>
            <select
              value={activeStudentId}
              onChange={(e) => setActiveStudentId(e.target.value)}
              className="bg-white border border-[#C6A15B]/40 text-slate-800 text-xs rounded px-2 py-0.5 max-w-[170px] truncate focus:outline-none focus:ring-1 focus:ring-[#C6A15B]"
            >
              {students.slice(0, 15).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.roomNumber ? `${t('common.room')} ${s.roomNumber}` : '---'})
                </option>
              ))}
            </select>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 px-1 flex items-center gap-0.5">
                  {msg.time}
                  {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-sky-500" />}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Command Buttons Grid */}
          <div className="p-2 bg-slate-100 border-t border-slate-200 grid grid-cols-3 gap-1">
            <button
              onClick={() => handleSend(t('telegram.btn.profile'))}
              className="px-2 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-[11px] font-medium rounded border border-slate-200 text-center truncate transition-colors cursor-pointer"
            >
              {t('telegram.btn.profile')}
            </button>
            <button
              onClick={() => handleSend(t('telegram.btn.room'))}
              className="px-2 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-[11px] font-medium rounded border border-slate-200 text-center truncate transition-colors cursor-pointer"
            >
              {t('telegram.btn.room')}
            </button>
            <button
              onClick={() => handleSend(t('telegram.btn.payments'))}
              className="px-2 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-[11px] font-medium rounded border border-slate-200 text-center truncate transition-colors cursor-pointer"
            >
              {t('telegram.btn.payments')}
            </button>
            <button
              onClick={() => handleSend(t('telegram.btn.contract'))}
              className="px-2 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-[11px] font-medium rounded border border-slate-200 text-center truncate transition-colors cursor-pointer"
            >
              {t('telegram.btn.contract')}
            </button>
            <button
              onClick={() => handleSend(t('telegram.btn.notifs'))}
              className="px-2 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-[11px] font-medium rounded border border-slate-200 text-center truncate transition-colors cursor-pointer"
            >
              {t('telegram.btn.notifs')}
            </button>
            <button
              onClick={() => handleSend(t('telegram.btn.issue'))}
              className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-medium rounded border border-amber-200 text-center truncate transition-colors cursor-pointer"
            >
              {t('telegram.btn.issue')}
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('telegram.placeholder')}
              className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={() => handleSend()}
              className="p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors cursor-pointer"
              title={t('telegram.send')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
    )}
  </>
  );
};
