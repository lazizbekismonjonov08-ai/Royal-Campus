import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RefreshCw,
  Wrench,
  Clock,
  Zap,
  Droplet,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Cpu,
  History,
  Info,
  HelpCircle,
  X,
  Hammer,
  Layers,
} from 'lucide-react';
import { Issue, Room, MaintenanceAiAnalysisResponse, RankedRepairPriority } from '../types';
import { analyzeMaintenancePriorities, calculateLocalPriorities } from '../services/maintenanceAiService';

interface MaintenanceAiPriorityWidgetProps {
  issues: Issue[];
  rooms: Room[];
  onNavigate: (view: string) => void;
}

export const MaintenanceAiPriorityWidget: React.FC<MaintenanceAiPriorityWidgetProps> = ({
  issues,
  rooms,
  onNavigate,
}) => {
  const [analysis, setAnalysis] = useState<MaintenanceAiAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'recurring'>('all');
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [selectedPriorityDetail, setSelectedPriorityDetail] = useState<RankedRepairPriority | null>(null);

  // Run automated analysis on mount or when issues count changes
  const runAnalysis = async (force: boolean = false) => {
    setIsLoading(true);
    try {
      const result = await analyzeMaintenancePriorities(issues, rooms);
      setAnalysis(result);
    } catch (err) {
      console.error('Failed to run Gemini maintenance analysis', err);
      // Safe fallback
      const fallback = calculateLocalPriorities(issues, rooms);
      setAnalysis(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [issues.length, rooms.length]);

  // Derived filtered priorities
  const filteredPriorities = useMemo(() => {
    if (!analysis) return [];
    if (selectedFilter === 'critical') {
      return analysis.rankedPriorities.filter(
        (p) => p.calculatedPriority === 'critical' || p.calculatedPriority === 'high'
      );
    }
    if (selectedFilter === 'recurring') {
      return analysis.rankedPriorities.filter((p) => p.historicalFailuresCount >= 2);
    }
    return analysis.rankedPriorities;
  }, [analysis, selectedFilter]);

  const criticalCount = useMemo(() => {
    return analysis?.rankedPriorities.filter((p) => p.calculatedPriority === 'critical').length || 0;
  }, [analysis]);

  const recurringCount = useMemo(() => {
    return analysis?.rankedPriorities.filter((p) => p.historicalFailuresCount >= 2).length || 0;
  }, [analysis]);

  const getSpecialtyBadge = (specialty: string) => {
    switch (specialty) {
      case 'electrician':
        return { label: 'Elektr ustasi', icon: Zap, bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'plumber':
        return { label: 'Santexnik', icon: Droplet, bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'carpenter':
        return { label: 'Duradgor/Mebelchi', icon: Hammer, bg: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'cleaning':
        return { label: 'Tozalash xizmati', icon: CheckCircle2, bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      default:
        return { label: 'Bosh texnik', icon: Wrench, bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Widget Header with Gemini AI Gradient */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#101C32] to-[#182848] text-white">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-[#C6A15B]/20 text-[#C6A15B] shrink-0 border border-[#C6A15B]/40">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2 text-white">
              Gemini AI: Xonalar Ta’mirlash Tahlili & Ustuvorlik Reytingi
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C6A15B]/20 text-[#E0C078] border border-[#C6A15B]/40">
              <Cpu className="w-3 h-3" />
              gemini-3.8-flash
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Nosozliklarning jiddiylik darajasi (Severity) va tarixiy takrorlanish chastotasi (Historical Frequency)
            asosida ta’mirlash navbatini avtomatik belgilash
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setShowExplanationModal(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Baholash formulasi va mezonlari"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Algoritm izohi</span>
          </button>

          <button
            type="button"
            onClick={() => runAnalysis(true)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C6A15B] to-[#D8B66E] hover:from-[#B8924B] hover:to-[#C6A15B] text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Tahlil qilinmoqda...' : 'AI orqali yangilash'}</span>
          </button>
        </div>
      </div>

      {/* Dormitory Health Summary Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Health Score Gauge / Meter */}
          <div className="md:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    (analysis?.overallHealthScore || 80) >= 80
                      ? 'text-emerald-500'
                      : (analysis?.overallHealthScore || 80) >= 65
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  }
                  strokeDasharray={`${analysis?.overallHealthScore || 80}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-base font-black text-slate-900 font-mono">
                  {analysis?.overallHealthScore || 80}
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1">%</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Yotoqxona Texnik Holati
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {analysis?.healthStatusText || 'Nazorat talab holat'}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Oxirgi tahlil: {analysis?.analyzedAt || 'Hozir'}</span>
              </div>
            </div>
          </div>

          {/* Executive Summary Rationale */}
          <div className="md:col-span-8 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#C6A15B]" />
                Gemini Bosh Muhandis Xulosasi:
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {analysis?.source === 'gemini_api' ? '✨ Gemini AI tahlili' : '⚙️ Algoritmik tahlil'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {analysis?.executiveSummary ||
                'Xonalardagi joriy nosozliklar va tarixiy buzilishlar solishtirildi. Kritik xavf tug‘diruvchi obyektlar ustuvorlik tartibida ajratildi.'}
            </p>
          </div>
        </div>

        {/* Quick Filter Tab Chips */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'all'
                ? 'bg-[#101C32] text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Barcha navbatdagi ta’mirlar</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {analysis?.rankedPriorities.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('critical')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'critical'
                ? 'bg-rose-600 text-white font-bold shadow-2xs'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Kritik & Yuqori xavf ({criticalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('recurring')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'recurring'
                ? 'bg-amber-600 text-white font-bold shadow-2xs'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Takroriy buzilishlar ({recurringCount})</span>
          </button>
        </div>
      </div>

      {/* Ranked Priorities Feed */}
      <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
        {filteredPriorities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-xs font-semibold text-slate-600">
              Tanlangan filtr bo‘yicha kutilayotgan ta’mirlar yo‘q. Barcha xonalar soz holatda!
            </p>
          </div>
        ) : (
          filteredPriorities.map((item, index) => {
            const specialty = getSpecialtyBadge(item.assignedSpecialty);
            const SpecialtyIcon = specialty.icon;

            const isCritical = item.calculatedPriority === 'critical';
            const isHigh = item.calculatedPriority === 'high';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs ${
                  isCritical
                    ? 'bg-rose-50/50 hover:bg-rose-50/80 border-l-4 border-l-rose-500'
                    : isHigh
                    ? 'bg-amber-50/30 hover:bg-amber-50/60 border-l-4 border-l-amber-500'
                    : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                }`}
              >
                {/* Left: Rank Badge, Room Number, Severity/Frequency Badges */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Rank Index Pill */}
                  <div
                    className={`w-8 h-8 rounded-xl font-black font-mono text-sm flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                      isCritical
                        ? 'bg-rose-600 text-white ring-2 ring-rose-200'
                        : isHigh
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{index + 1}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Top Row: Room, Priority Badge, Recurrence */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {item.roomNumber}-xona ({item.floor}-qavat)
                      </span>

                      {/* Calculated Priority */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isCritical ? (
                          <>
                            <Flame className="w-3 h-3 text-rose-600" />
                            <span>1-Daraja (Kritik)</span>
                          </>
                        ) : isHigh ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>2-Daraja (Yuqori)</span>
                          </>
                        ) : (
                          <span>O‘rtacha daraja</span>
                        )}
                      </span>

                      {/* Historical Recurrence Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.historicalFailuresCount >= 3
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.historicalFailuresCount === 2
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.recurrenceBadge}
                      </span>

                      {/* Specialty Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${specialty.bg}`}
                      >
                        <SpecialtyIcon className="w-3 h-3" />
                        <span>{specialty.label}</span>
                      </span>
                    </div>

                    {/* Problem Description */}
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                      {item.description}
                    </p>

                    {/* AI Urgency Rationale & Technical Root Cause */}
                    <div className="bg-white/80 border border-slate-200/80 rounded-xl p-2.5 space-y-1">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#C6A15B]" />
                        <span>AI Ustuvorlik Asosi:</span>
                        <span className="font-normal text-slate-600">{item.urgencyRationale}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-700">Tavsiya etilgan amaliyot:</span>
                        <span className="text-slate-600">{item.recommendedAction}</span>
                      </div>
                    </div>

                    {/* Scores & Metadata Footer */}
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        Jiddiylik: <strong className="text-slate-800">{item.severityScore}/10</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <History className="w-3.5 h-3.5 text-amber-600" />
                        Tarixiy takrorlanish: <strong className="text-slate-800">{item.frequencyScore}/10</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Kutilmoqda: <strong className="text-amber-700">{item.daysPending} kun</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">{item.occupancyImpact}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Score Pill & Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Reyting Bali</div>
                    <div
                      className={`text-lg font-black font-mono ${
                        item.combinedScore >= 80
                          ? 'text-rose-600'
                          : item.combinedScore >= 60
                          ? 'text-amber-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.combinedScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('S90_IssuesList')}
                    className="px-3.5 py-2 rounded-xl bg-[#101C32] hover:bg-[#1A2D4F] text-[#C6A15B] hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Ustaga biriktirish</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Patterns & Preventative Maintenance Section */}
      {analysis && analysis.recurringPatterns && analysis.recurringPatterns.length > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-amber-50/20 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C6A15B]" />
              Takrorlanuvchi O‘choqlar & Tizimli Profilaktika (Recurring Hotspots)
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              Tarixiy chastota tahlili asosida
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analysis.recurringPatterns.map((pat, idx) => (
              <div
                key={`pat-${idx}`}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">{pat.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pat.riskLevel === 'high'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pat.frequency} marta
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{pat.location}</div>
                <p className="text-[11px] text-slate-600 line-clamp-2">{pat.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Algorithm Explanation Modal */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C6A15B]" />
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Gemini AI Reyting Algoritmi Qanday Ishlaydi?
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Ushbu avtomatlashtirilgan tizim xonalar bo‘yicha texnik nosozliklarni oddiy ro‘yxat shaklida emas, balki
                ikki asosiy ustunga tayanib darajalarga ajratadi:
              </p>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  1. Jiddiylik va Hayot Xavfsizligi (Severity: 1 - 10 ball)
                </div>
                <p className="text-rose-800 text-[11px]">
                  Elektr toki xavfi, tutun/uchqun, suv toshishi kabi holatlarga maksimal 10 ball beriladi va ular har
                  doim birinchi o‘ringa chiqadi.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-600" />
                  2. Tarixiy Takrorlanish Chastotasi (Historical Frequency: 1 - 10 ball)
                </div>
                <p className="text-amber-800 text-[11px]">
                  Bir xonada (masalan, 204-xonada dush yoki kran) avval ham bir necha bor nosozlik yuz bergan bo‘lsa,
                  tizim ildiz sababni (root cause) bartaraf etish uchun ushbu xonaning umumiy ballini oshiradi.
                </p>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
                <div className="font-bold text-sky-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  3. Aholi Ta’siri va Kutish Vaqti (Impact & Days Pending)
                </div>
                <p className="text-sky-800 text-[11px]">
                  Talabalar yashayotgan xonalar bo‘sh xonalarga nisbatan ustun qo‘yiladi, va kunlar soni oshgan sari
                  prioritet avtomatik kuchaytiriladi.
                </p>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl font-mono text-[11px] text-slate-800 border border-slate-200">
                Formula: Ball = (Severity × 5) + (Frequency × 3) + OccupancyBonus + PendingBonus
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
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
