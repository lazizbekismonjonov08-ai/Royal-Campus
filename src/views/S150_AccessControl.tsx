import React, { useState, useMemo } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import {
  ShieldCheck,
  Radio,
  Cpu,
  ScanFace,
  CreditCard,
  QrCode,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Server,
  Activity,
  Sliders,
  ExternalLink,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Clock,
  Eye,
  Info,
  Layers,
  Filter,
  Check,
  Search,
} from 'lucide-react';
import { AccessTerminal, AccessCredentialType, AccessDeviceVendor, AccessDeviceProtocol, AccessDirection } from '../types';

export const S150_AccessControl: React.FC = () => {
  const {
    accessTerminals,
    accessLogs,
    accessPolicy,
    students,
    role,
    simulateAccessScan,
    updateTerminalConfig,
    addTerminal,
    deleteTerminal,
    testTerminalConnection,
    assignStudentCard,
    toggleStudentFaceEnrolled,
    updateAccessPolicy,
    clearAccessLogs,
    triggerTurnstileRelay,
  } = useDorm();

  const { t, formatCurrency } = useI18n();

  // Active Tab
  type TabKey = 'simulator' | 'terminals' | 'policies' | 'credentials' | 'guide';
  const [activeTab, setActiveTab] = useState<TabKey>('simulator');

  // Simulator Form State
  const [simTerminalId, setSimTerminalId] = useState<string>(accessTerminals[0]?.id || 'term-main-entry');
  const [simStudentId, setSimStudentId] = useState<string>(students[0]?.id || '');
  const [simCredentialType, setSimCredentialType] = useState<AccessCredentialType>('card');
  const [simManualCardUid, setSimManualCardUid] = useState<string>('');
  const [simDirection, setSimDirection] = useState<'entry' | 'exit'>('entry');
  const [simIsCurfewTime, setSimIsCurfewTime] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastSimResult, setLastSimResult] = useState<any>(null);

  // Terminal Testing State
  const [testingTerminalId, setTestingTerminalId] = useState<string | null>(null);
  const [testResultModal, setTestResultModal] = useState<any>(null);

  // Edit / Add Terminal Modal State
  const [editingTerminal, setEditingTerminal] = useState<AccessTerminal | null>(null);
  const [isAddingTerminal, setIsAddingTerminal] = useState<boolean>(false);

  // Log filter state
  const [logFilter, setLogFilter] = useState<'all' | 'granted' | 'denied' | 'simulated' | 'physical'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // Credentials management student search
  const [credSearchQuery, setCredSearchQuery] = useState<string>('');
  const [editingCardStudentId, setEditingCardStudentId] = useState<string | null>(null);
  const [newCardUidInput, setNewCardUidInput] = useState<string>('');

  // Relay Trigger State
  const [relayActiveTerminalId, setRelayActiveTerminalId] = useState<string | null>(null);

  // Current active terminal
  const currentSimTerminal = useMemo(() => {
    return accessTerminals.find((t) => t.id === simTerminalId) || accessTerminals[0];
  }, [accessTerminals, simTerminalId]);

  // Selected student in simulator
  const currentSimStudent = useMemo(() => {
    return students.find((s) => s.id === simStudentId);
  }, [students, simStudentId]);

  // Terminal stats
  const terminalStats = useMemo(() => {
    const total = accessTerminals.length;
    const physicalOnline = accessTerminals.filter((t) => !t.isSimulatedOnly && t.status === 'online').length;
    const simulated = accessTerminals.filter((t) => t.isSimulatedOnly).length;
    const offline = accessTerminals.filter((t) => !t.isSimulatedOnly && t.status !== 'online').length;
    return { total, physicalOnline, simulated, offline };
  }, [accessTerminals]);

  // Log stats today
  const logStats = useMemo(() => {
    const total = accessLogs.length;
    const granted = accessLogs.filter((l) => l.decision === 'granted').length;
    const denied = accessLogs.filter((l) => l.decision === 'denied').length;
    const curfewFlags = accessLogs.filter((l) => l.curfewFlagged).length;
    const simulated = accessLogs.filter((l) => l.isSimulated).length;
    const physical = accessLogs.filter((l) => !l.isSimulated).length;
    return { total, granted, denied, curfewFlags, simulated, physical };
  }, [accessLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return accessLogs.filter((l) => {
      if (logFilter === 'granted' && l.decision !== 'granted') return false;
      if (logFilter === 'denied' && l.decision !== 'denied') return false;
      if (logFilter === 'simulated' && !l.isSimulated) return false;
      if (logFilter === 'physical' && l.isSimulated) return false;

      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const matchName = l.studentName?.toLowerCase().includes(q);
        const matchTerm = l.terminalName.toLowerCase().includes(q);
        const matchCred = l.credentialValue.toLowerCase().includes(q);
        const matchReason = l.reasonMessage.toLowerCase().includes(q);
        if (!matchName && !matchTerm && !matchCred && !matchReason) return false;
      }
      return true;
    });
  }, [accessLogs, logFilter, logSearchQuery]);

  // Filtered Students for credentials tab
  const filteredStudents = useMemo(() => {
    if (!credSearchQuery.trim()) return students.slice(0, 30);
    const q = credSearchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.passportNumber.toLowerCase().includes(q) ||
        (s.rfidCardNumber && s.rfidCardNumber.toLowerCase().includes(q))
    );
  }, [students, credSearchQuery]);

  // Execute Simulated Scan
  const handleExecuteSimulateScan = async () => {
    setIsSimulating(true);
    setLastSimResult(null);

    // Determine credential value
    let credVal = '';
    if (simCredentialType === 'card') {
      credVal = simManualCardUid.trim() || currentSimStudent?.rfidCardNumber || currentSimStudent?.id || 'UNKNOWN_CARD';
    } else if (simCredentialType === 'face') {
      credVal = currentSimStudent?.fullName || currentSimStudent?.id || 'Unknown Face';
    } else {
      credVal = currentSimStudent?.id || 'QR_PASS_TOKEN';
    }

    try {
      const response = await simulateAccessScan({
        terminalId: simTerminalId,
        credentialType: simCredentialType,
        credentialValue: credVal,
        direction: simDirection,
        simulatedTime: simIsCurfewTime ? '23:45' : '14:30',
        isSimulated: true,
      });

      setLastSimResult(response);

      // If granted, show turnstile unlatching animation
      if (response.decision === 'granted') {
        setRelayActiveTerminalId(simTerminalId);
        setTimeout(() => setRelayActiveTerminalId(null), (response.relayOpenSeconds || 4) * 1000);
      }
    } catch (e: any) {
      console.error('Simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Test physical or simulated connection
  const handleTestConnection = async (term: AccessTerminal) => {
    setTestingTerminalId(term.id);
    try {
      const res = await testTerminalConnection(term);
      setTestResultModal({
        terminalName: term.name,
        ipAddress: term.ipAddress,
        port: term.port,
        isSimulatedOnly: term.isSimulatedOnly,
        ...res,
      });
    } finally {
      setTestingTerminalId(null);
    }
  };

  // Manually trigger turnstile relay
  const handleTriggerRelay = async (terminalId: string) => {
    setRelayActiveTerminalId(terminalId);
    await triggerTurnstileRelay(terminalId, 5);
    setTimeout(() => {
      setRelayActiveTerminalId(null);
    }, 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#101C32] text-[#C6A15B] flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Kirish nazorati va Hikvision terminal integratsiyasi
              </h1>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                ISAPI / OpenAPI Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Royal Campus yotoqxonasida Hikvision MinMoe yuz skaneri va RFID kartali turniketlar boshqaruvi
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-[#101C32] text-[#C6A15B] shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Simulyator va jonli monitor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terminals')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'terminals'
                ? 'bg-[#101C32] text-[#C6A15B] shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-sky-500" />
            <span>Terminallar ({accessTerminals.length})</span>
          </button>
        </div>
      </div>

      {/* REQUIREMENT 9 MANDATORY BANNER: Honest Hardware Status Indicator */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-2">
              <span>Hozirda Jismoniy Hikvision Qurilmasi Ulanmagan — Dasturiy Simulyatsiya Rejimi Faol</span>
              <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                DEMO MODE
              </span>
            </div>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Arxitektura to‘liq ISAPI va OpenAPI standartlariga mos tayyorlangan. Jismoniy Hikvision turniketi lokal tarmoqqa (LAN/VPN) ulanganda, IP va port kiritilib, aloqa muvaffaqiyatli sinovdan o‘tkazilgandan keyingina real rejimga o‘tadi. Hozirda barcha kirish qarorlari Royal Campus qoidalar tizimi orqali to‘liq simulyatsiya qilinadi.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className="shrink-0 px-3.5 py-2 bg-amber-900 text-white hover:bg-amber-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Ulash qo‘llanmasi</span>
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Sozlangan terminallar</div>
          <div className="text-xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
            <span>{terminalStats.total} ta</span>
            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              {terminalStats.simulated} simulyator
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Jismoniy online: 0 ta (rejalashtirilgan)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Bugungi Ruxsatlar</div>
          <div className="text-xl font-black text-emerald-600 mt-1 flex items-baseline gap-2">
            <span>{logStats.granted} ta</span>
            <span className="text-[11px] font-semibold text-slate-400">/{logStats.total} jami</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">Turniket ochilgan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Rad Etilgan Kirishlar</div>
          <div className="text-xl font-black text-rose-600 mt-1 flex items-baseline gap-2">
            <span>{logStats.denied} ta</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Qoidabuzarlik yoki qarzdorlik</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Komendantlik Qaydnomalari</div>
          <div className="text-xl font-black text-amber-600 mt-1 flex items-baseline gap-2">
            <span>{logStats.curfewFlags} ta</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">23:00 dan keyingi kirishlar</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto pb-px">
        {[
          { key: 'simulator', label: 'Jonli monitor va simulyator', icon: Radio },
          { key: 'terminals', label: 'Terminallar va qurilmalar', icon: Cpu },
          { key: 'policies', label: 'Kirish qoidalari va siyosat', icon: Sliders },
          { key: 'credentials', label: 'Talabalar kartalari va yuz ID', icon: ScanFace },
          { key: 'guide', label: 'Hikvision ISAPI qo‘llanmasi', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#C6A15B] text-[#101C32] font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#C6A15B]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LIVE MONITOR & SIMULATOR */}
      {/* ======================================================== */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Virtual Turnstile Simulator (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#101C32] text-[#C6A15B] flex items-center justify-center font-bold">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Virtual Turniket Sinovi</h3>
                    <p className="text-[10px] text-slate-500">Turli ssenariylarni simulyatsiya qilish</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                  SIM-ENGINE v2.4
                </span>
              </div>

              {/* Terminal Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">1. Terminalni tanlang:</label>
                <select
                  value={simTerminalId}
                  onChange={(e) => setSimTerminalId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#C6A15B]"
                >
                  {accessTerminals.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.model})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">2. Talabani tanlang:</label>
                <select
                  value={simStudentId}
                  onChange={(e) => {
                    setSimStudentId(e.target.value);
                    const s = students.find((std) => std.id === e.target.value);
                    if (s?.rfidCardNumber) setSimManualCardUid(s.rfidCardNumber);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#C6A15B]"
                >
                  <optgroup label="Rezident talabalar (Joylashtirilgan)">
                    {students
                      .filter((s) => s.roomId)
                      .slice(0, 20)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} (Xona {s.roomNumber || '—'}{s.debtAmount > 0 ? `, Qarzi: ${formatCurrency(s.debtAmount)}` : ''})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Biriktirilmagan talabalar (Joyi yo‘q)">
                    {students
                      .filter((s) => !s.roomId)
                      .slice(0, 10)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} (Xonasiz / Yangi)
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Selected Student Card Preview */}
              {currentSimStudent && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900">{currentSimStudent.fullName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {currentSimStudent.roomId
                        ? `${currentSimStudent.floor}-qavat • Xona ${currentSimStudent.roomNumber} (${currentSimStudent.bedIdentifier || currentSimStudent.bedNumber})`
                        : 'Xona biriktirilmagan'}
                    </div>
                  </div>
                  <div className="text-right">
                    {currentSimStudent.debtAmount > 0 ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 block">
                        Qarz: {formatCurrency(currentSimStudent.debtAmount)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 block">
                        To‘lov qilingan
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Credential Type Toggle */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">3. Identifikatsiya usuli:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimCredentialType('card')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      simCredentialType === 'card'
                        ? 'bg-[#101C32] text-white border-[#101C32] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <CreditCard className={`w-4 h-4 ${simCredentialType === 'card' ? 'text-[#C6A15B]' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-bold">RFID Karta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimCredentialType('face')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      simCredentialType === 'face'
                        ? 'bg-[#101C32] text-white border-[#101C32] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <ScanFace className={`w-4 h-4 ${simCredentialType === 'face' ? 'text-[#C6A15B]' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-bold">Yuz ID (MinMoe)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimCredentialType('qr_code')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      simCredentialType === 'qr_code'
                        ? 'bg-[#101C32] text-white border-[#101C32] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <QrCode className={`w-4 h-4 ${simCredentialType === 'qr_code' ? 'text-[#C6A15B]' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-bold">QR Kod</span>
                  </button>
                </div>
              </div>

              {/* Direction & Time Conditions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Harakat Yo‘nalishi:</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-xl mt-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSimDirection('entry')}
                      className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                        simDirection === 'entry' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      🟢 Kirish
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimDirection('exit')}
                      className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                        simDirection === 'exit' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      🔴 Chiqish
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Vaqt Sinovi (Curfew):</label>
                  <button
                    type="button"
                    onClick={() => setSimIsCurfewTime(!simIsCurfewTime)}
                    className={`w-full mt-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      simIsCurfewTime
                        ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{simIsCurfewTime ? 'Kechki 23:45 (Taqiq)' : 'Kunduzgi 14:30 (Oddiy)'}</span>
                  </button>
                </div>
              </div>

              {/* Action Button: Simulate Scan */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={handleExecuteSimulateScan}
                  className="w-full py-3 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B] text-[#C6A15B] hover:text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>Skan Qilishni Simulyatsiya Qilish</span>
                </button>
              </div>

              {/* Turnstile Relay Visual Graphic */}
              <div className="pt-2">
                <div
                  className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center justify-center ${
                    relayActiveTerminalId === simTerminalId
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 animate-pulse'
                      : lastSimResult?.decision === 'denied'
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
                    {relayActiveTerminalId === simTerminalId ? (
                      <>
                        <Unlock className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-black">TURNIKET OCHIQ (RELE FAOLLASHGAN)</span>
                      </>
                    ) : lastSimResult?.decision === 'denied' ? (
                      <>
                        <Lock className="w-4 h-4 text-rose-600" />
                        <span className="text-rose-700 font-black">TURNIKET QULFLANGAN</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Turniket Kutish Rejimida</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {relayActiveTerminalId === simTerminalId
                      ? `Rele davomiyligi: ${currentSimTerminal.relayHoldSeconds || 5} soniya`
                      : 'Karta yoki yuz tekshiruvi kutilmoqda'}
                  </div>
                </div>
              </div>

              {/* Simulation Result Toast */}
              {lastSimResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 animate-fadeIn ${
                    lastSimResult.decision === 'granted'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-1.5">
                      {lastSimResult.decision === 'granted' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>
                        {lastSimResult.decision === 'granted' ? 'RUXSAT BERILDI (GRANTED)' : 'KIRISH TAQIQLANDI (DENIED)'}
                      </span>
                    </span>
                    <span className="font-mono text-[10px]">{lastSimResult.reasonCode}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{lastSimResult.reasonMessage}</p>
                  {lastSimResult.curfewFlagged && (
                    <div className="mt-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 p-1 rounded-md">
                      ⚠️ Komendantlik soati buzildi. Talabaga avtomatik 10 jarima balli qayd etildi!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Event Feed & Real-time Logs (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col h-full min-h-[540px]">
              {/* Feed Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Jonli Kirish Jurnali (Audit Feed)</h3>
                    <p className="text-[10px] text-slate-500">Real vaqt rejimida barcha kirish va chiqish hodisalari</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={clearAccessLogs}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-bold transition-colors cursor-pointer"
                  >
                    Tozalash
                  </button>
                </div>
              </div>

              {/* Feed Search & Filter Bar */}
              <div className="pt-3 pb-2 flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Talaba ismi, xona yoki terminal bo‘yicha qidirish..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  {(['all', 'granted', 'denied', 'simulated', 'physical'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setLogFilter(mode)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                        logFilter === mode
                          ? 'bg-[#101C32] text-[#C6A15B]'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mode === 'all'
                        ? 'Barchasi'
                        : mode === 'granted'
                        ? 'Ruxsat'
                        : mode === 'denied'
                        ? 'Taqiq'
                        : mode === 'simulated'
                        ? 'Simulyator'
                        : 'Jismoniy'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logs List Table */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[460px]">
                {filteredLogs.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <Activity className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">Mos keluvchi kirish qaydlari topilmadi</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const isGranted = log.decision === 'granted';
                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-2xl border transition-all text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                          isGranted
                            ? 'bg-white hover:bg-slate-50/80 border-slate-200'
                            : 'bg-rose-50/40 hover:bg-rose-50/70 border-rose-200'
                        }`}
                      >
                        {/* Status Icon & Student info */}
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isGranted ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isGranted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-900 truncate">
                                {log.studentName || 'Noma’lum shaxs'}
                              </span>
                              {log.studentRoom && (
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                  Xona {log.studentRoom}
                                </span>
                              )}
                              {/* Requirement 6: Clear separation between simulated and physical device */}
                              {log.isSimulated ? (
                                <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase border border-purple-200">
                                  SIMULYATSIYA
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase border border-emerald-200">
                                  JISMONIY HIKVISION
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span>{log.terminalName}</span>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-slate-600">{log.credentialValue}</span>
                              {log.direction === 'entry' ? (
                                <span className="text-emerald-700 font-bold">🟢 Kirish</span>
                              ) : (
                                <span className="text-sky-700 font-bold">🔴 Chiqish</span>
                              )}
                            </div>

                            <div className="text-[10px] mt-0.5 font-medium text-slate-600">
                              {log.reasonMessage}
                            </div>
                          </div>
                        </div>

                        {/* Right: Timestamp & Badges */}
                        <div className="text-right shrink-0 self-end sm:self-center">
                          <div className="text-[10px] text-slate-400 font-mono">
                            {log.timestamp.slice(11, 19)} • {log.timestamp.slice(0, 10)}
                          </div>
                          {log.curfewFlagged && (
                            <span className="inline-block mt-1 text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                              Komendantlik vaqti
                            </span>
                          )}
                          {log.debtWarning && (
                            <span className="inline-block mt-1 text-[9px] font-bold bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded ml-1">
                              Qarzdor
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TERMINALS & HARDWARE CONFIGURATION */}
      {/* ======================================================== */}
      {activeTab === 'terminals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-black text-slate-900 text-sm">Sozlangan Kirish Terminallari</h3>
              <p className="text-[11px] text-slate-500">
                Hikvision ISAPI / OpenAPI terminallarining IP manzillari va o‘rnatilgan joylari
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingTerminal(true)}
              className="px-3.5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] text-[#C6A15B] font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi terminal qo‘shish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accessTerminals.map((term) => {
              const isSim = term.isSimulatedOnly;
              return (
                <div
                  key={term.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 relative"
                >
                  <div>
                    {/* Top Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#101C32] text-[#C6A15B] flex items-center justify-center font-bold">
                        {term.deviceType === 'face_terminal' ? (
                          <ScanFace className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>

                      {/* Requirement 9: Never claim physical hardware is online without testing */}
                      {isSim ? (
                        <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full border border-purple-200">
                          SIMULYATSIYA REJIMI
                        </span>
                      ) : term.status === 'online' ? (
                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> ONLINE
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                          OFFLINE (ULANMAGAN)
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-slate-900 text-sm">{term.name}</h4>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{term.model}</p>

                    {/* Parameters */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Manzil (IP / Port):</span>
                        <span className="font-mono font-bold text-slate-800">
                          {term.ipAddress}:{term.port}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Protokol:</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                          {term.protocol}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Joylashuvi:</span>
                        <span className="font-medium text-slate-800 text-[11px] truncate max-w-[140px]">
                          {term.location}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Rele Vaqti:</span>
                        <span className="font-bold text-slate-800">{term.relayHoldSeconds || 5} soniya</span>
                      </div>

                      {term.lastErrorMessage && (
                        <div className="p-2 bg-rose-50 text-rose-800 rounded-xl text-[10px] border border-rose-200 mt-2">
                          {term.lastErrorMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={testingTerminalId === term.id}
                      onClick={() => handleTestConnection(term)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingTerminalId === term.id ? 'animate-spin' : ''}`} />
                      <span>Ping / Test</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerRelay(term.id)}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      title="Turniket relesini ochish"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Ochish</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingTerminal(term)}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-[#101C32] hover:text-[#C6A15B] text-slate-700 rounded-xl text-[11px] transition-colors cursor-pointer"
                      title="Sozlamalar"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ACCESS POLICIES & SECURITY SETTINGS */}
      {/* ======================================================== */}
      {activeTab === 'policies' && (
        <div className="max-w-3xl space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-black text-slate-900 text-base">Kirish Qoidalari va Xavfsizlik Siyosati</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Barcha qoidalar server tomonidan avtoritar tarzda tekshiriladi (Server-Authoritative Enforcement)
              </p>
            </div>

            {/* Curfew Policy */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">Komendantlik Soati (Curfew Hours)</div>
                  <div className="text-[11px] text-slate-500">Kechki vaqtda yotoqxonaga kirish tartibi</div>
                </div>
                <input
                  type="checkbox"
                  checked={accessPolicy.curfewEnabled}
                  onChange={(e) => updateAccessPolicy({ curfewEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-[#C6A15B] focus:ring-[#C6A15B]"
                />
              </div>

              {accessPolicy.curfewEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Boshlanish vaqti:</label>
                    <input
                      type="time"
                      value={accessPolicy.curfewStart}
                      onChange={(e) => updateAccessPolicy({ curfewStart: e.target.value })}
                      className="w-full mt-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Tugash vaqti:</label>
                    <input
                      type="time"
                      value={accessPolicy.curfewEnd}
                      onChange={(e) => updateAccessPolicy({ curfewEnd: e.target.value })}
                      className="w-full mt-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-600">Kech qolganlarga chora:</label>
                    <div className="flex bg-slate-200 p-0.5 rounded-xl mt-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => updateAccessPolicy({ curfewAction: 'allow_with_flag' })}
                        className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                          accessPolicy.curfewAction === 'allow_with_flag'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Kirishga ruxsat + Intizom qaydnomasi (10 ball)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAccessPolicy({ curfewAction: 'deny' })}
                        className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                          accessPolicy.curfewAction === 'deny'
                            ? 'bg-white text-rose-700 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Qat’iy taqiqlash (Eshik ochilmaydi)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Overdue Payment Policy */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <div className="font-extrabold text-slate-900 text-xs">To‘lov qarzdorligi siyosati</div>
                <div className="text-[11px] text-slate-500">Qarzdor talabalarning turniketdan o‘tishi</div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    key: 'allow_with_warning',
                    label: 'Kirishga ruxsat berish (Ogohlantirish bildirishnomasi bilan)',
                  },
                  {
                    key: 'deny_if_overdue_3_days',
                    label: 'Qarz 3 kundan oshganda kirishni to‘xtatish',
                  },
                  {
                    key: 'deny_all_debtors',
                    label: 'Har qanday qarzdorlikda kirishni bloklash (Qat’iy rejim)',
                  },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer hover:border-slate-300"
                  >
                    <input
                      type="radio"
                      name="overduePaymentPolicy"
                      checked={accessPolicy.overduePaymentPolicy === opt.key}
                      onChange={() => updateAccessPolicy({ overduePaymentPolicy: opt.key as any })}
                      className="text-[#C6A15B] focus:ring-[#C6A15B]"
                    />
                    <span className="font-semibold text-slate-800">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Room Assignment Policy */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-slate-900 text-xs">Xonasi yo‘q talabalarni cheklash</div>
                <div className="text-[11px] text-slate-500">
                  Faqat yotoqxonada faol xonasi va o‘rni bor talabalarga ruxsat berish
                </div>
              </div>
              <input
                type="checkbox"
                checked={accessPolicy.requireActiveBedAssignment}
                onChange={(e) => updateAccessPolicy({ requireActiveBedAssignment: e.target.checked })}
                className="w-4 h-4 rounded text-[#C6A15B] focus:ring-[#C6A15B]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: STUDENT CREDENTIALS (CARDS & FACE ID) */}
      {/* ======================================================== */}
      {activeTab === 'credentials' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-sm">Talabalar Kartalari va Biometrik Yuz Profillari</h3>
              <p className="text-[11px] text-slate-500">
                Mifare RFID kartalari UID raqami va yuz ma’lumotlarini Hikvision terminaliga biriktirish
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={credSearchQuery}
                onChange={(e) => setCredSearchQuery(e.target.value)}
                placeholder="Talabani qidirish..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#C6A15B]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="pb-2.5 font-bold">Talaba</th>
                  <th className="pb-2.5 font-bold">Xona va o‘rin</th>
                  <th className="pb-2.5 font-bold">RFID Karta (Mifare UID)</th>
                  <th className="pb-2.5 font-bold">Yuz Tanish (Face ID)</th>
                  <th className="pb-2.5 font-bold">Kirish Holati</th>
                  <th className="pb-2.5 font-bold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5">
                      <div className="font-bold text-slate-900">{std.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{std.id}</div>
                    </td>

                    <td className="py-2.5">
                      {std.roomNumber ? (
                        <span className="font-semibold text-slate-800">
                          Xona {std.roomNumber} ({std.bedIdentifier || std.bedNumber})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Biriktirilmagan</span>
                      )}
                    </td>

                    <td className="py-2.5 font-mono">
                      {editingCardStudentId === std.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newCardUidInput}
                            onChange={(e) => setNewCardUidInput(e.target.value)}
                            placeholder="RC1001 yoki E280681A"
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs uppercase font-mono w-28"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              assignStudentCard(std.id, newCardUidInput);
                              setEditingCardStudentId(null);
                            }}
                            className="p-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                          >
                            Saqlash
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800">
                          {std.rfidCardNumber || (
                            <span className="text-slate-400 font-normal italic">Karta yo‘q</span>
                          )}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5">
                      {std.faceEnrolled ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                          ✓ Yuz ro‘yxatga olingan
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Olinmagan</span>
                      )}
                    </td>

                    <td className="py-2.5">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                        Faol
                      </span>
                    </td>

                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCardStudentId(std.id);
                            setNewCardUidInput(std.rfidCardNumber || '');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                        >
                          Karta berish
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStudentFaceEnrolled(std.id, !std.faceEnrolled)}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            std.faceEnrolled
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          }`}
                        >
                          {std.faceEnrolled ? 'Yuzni o‘chirish' : 'Yuzni yuklash'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: HIKVISION INTEGRATION GUIDE & API ARCHITECTURE */}
      {/* ======================================================== */}
      {activeTab === 'guide' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-4xl">
          <div>
            <h3 className="font-black text-slate-900 text-base">Hikvision Uskunalarini Ulash Arxitekturasi</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelgusida jismoniy turniket va yuz skanerlarini o‘rnatishda foydalaniladigan rasmiy ISAPI va OpenAPI texnik qo‘llanmasi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>1. Tarmoq va IP Sozlash (LAN Topology)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Hikvision MinMoe terminaliga statik IP (masalan <code>192.168.1.101</code>) tayinlang. Royal Campus serveri va terminal bitta lokal tarmoqda (yoki xavfsiz VPN orqali) bo‘lishi lozim.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span>2. Jonli Hodisalarni Qabul Qilish (Alert Stream Webhook)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Hikvision terminalining <em>Event & Alarm &gt; HTTP Listening</em> bo‘limiga quyidagi webhook manzilini kiriting:
                <br />
                <code className="text-indigo-800 font-bold">http://&lt;SERVER_IP&gt;:3000/api/access-control/hikvision/event</code>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Unlock className="w-4 h-4 text-amber-600" />
                <span>3. Masofadan Rele Ochish (Remote Door Open)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Server terminalga <code>PUT /ISAPI/AccessControl/RemoteControl/door/1</code> buyrug‘i orqali rele pulsini jo‘natadi. Bu turniket tirgaklarini 5 soniya muddatga bo‘shatadi.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <ScanFace className="w-4 h-4 text-purple-600" />
                <span>4. Biometriya va Kartalarni Sinxronlash</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Talaba yotoqxonaga qabul qilinganda uning yuz fotosurati <code>/ISAPI/Intelligent/FDLib/FaceDataRecord</code> orqali terminal xotirasiga avtomatik yoziladi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Test Result Modal */}
      {testResultModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  testResultModal.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {testResultModal.connected ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  {testResultModal.connected ? 'Aloqa Muvaffaqiyatli' : 'Qurilma Topilmadi'}
                </h4>
                <p className="text-[11px] text-slate-500">{testResultModal.terminalName}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Holat:</span>
                <span className="font-bold text-slate-900 uppercase">{testResultModal.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IP Manzil:</span>
                <span className="font-mono font-bold text-slate-800">
                  {testResultModal.ipAddress}:{testResultModal.port}
                </span>
              </div>
              {testResultModal.deviceModel && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Model:</span>
                  <span className="font-bold text-slate-800">{testResultModal.deviceModel}</span>
                </div>
              )}
              {testResultModal.latencyMs && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Kechikish (Latency):</span>
                  <span className="font-bold text-slate-800">{testResultModal.latencyMs} ms</span>
                </div>
              )}
              {testResultModal.errorMessage && (
                <div className="pt-2 text-rose-800 text-[11px] font-medium leading-relaxed">
                  {testResultModal.errorMessage}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setTestResultModal(null)}
              className="w-full py-2.5 bg-[#101C32] text-white font-bold rounded-xl text-xs hover:bg-[#1A2D4F] transition-colors cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* Edit Terminal Modal */}
      {editingTerminal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-sm">Terminal Sozlamalarini Tahrirlash</h4>
              <button
                type="button"
                onClick={() => setEditingTerminal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-600">Terminal Nomi:</label>
                <input
                  type="text"
                  value={editingTerminal.name}
                  onChange={(e) => setEditingTerminal({ ...editingTerminal, name: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600">IP Manzil:</label>
                  <input
                    type="text"
                    value={editingTerminal.ipAddress}
                    onChange={(e) => setEditingTerminal({ ...editingTerminal, ipAddress: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">HTTP/HTTPS Port:</label>
                  <input
                    type="number"
                    value={editingTerminal.port}
                    onChange={(e) => setEditingTerminal({ ...editingTerminal, port: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Protokol:</label>
                  <select
                    value={editingTerminal.protocol}
                    onChange={(e) =>
                      setEditingTerminal({ ...editingTerminal, protocol: e.target.value as AccessDeviceProtocol })
                    }
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="ISAPI">Hikvision ISAPI</option>
                    <option value="OpenAPI">Hikvision OpenAPI</option>
                    <option value="HikCentral_Gateway">HikCentral Gateway</option>
                    <option value="OSDP">Generic OSDP</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Rele Davomiyligi (soniya):</label>
                  <input
                    type="number"
                    value={editingTerminal.relayHoldSeconds}
                    onChange={(e) =>
                      setEditingTerminal({ ...editingTerminal, relayHoldSeconds: Number(e.target.value) })
                    }
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600">O‘rnatilgan Joyi:</label>
                <input
                  type="text"
                  value={editingTerminal.location}
                  onChange={(e) => setEditingTerminal({ ...editingTerminal, location: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              {/* Simulation Mode Toggle */}
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-purple-900 text-xs">Simulyatsiya Rejimi</div>
                  <div className="text-[10px] text-purple-700">
                    Jismoniy uskuna ulanmagan paytda sinov uchun faollashtiring
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editingTerminal.isSimulatedOnly}
                  onChange={(e) =>
                    setEditingTerminal({
                      ...editingTerminal,
                      isSimulatedOnly: e.target.checked,
                      status: e.target.checked ? 'simulated' : 'offline',
                    })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTerminal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  updateTerminalConfig(editingTerminal);
                  setEditingTerminal(null);
                }}
                className="px-5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] text-[#C6A15B] font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
