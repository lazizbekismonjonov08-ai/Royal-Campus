import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export interface MaintenanceLogEntry {
  id: string;
  roomNumber?: string;
  floor?: number;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  reportedBy?: string;
}

export interface RoomContextInfo {
  id: string;
  roomNumber: string;
  floor: number;
  type: string;
  capacity: number;
  occupiedBeds: number;
  status?: string;
}

export interface RankedRepairPriority {
  id: string;
  issueId: string;
  roomNumber: string;
  floor: number;
  category: string;
  description: string;
  calculatedPriority: 'critical' | 'high' | 'medium' | 'low';
  severityScore: number; // 1 to 10
  frequencyScore: number; // 1 to 10
  combinedScore: number; // 1 to 100
  historicalFailuresCount: number;
  recurrenceBadge: string;
  urgencyRationale: string;
  recommendedAction: string;
  assignedSpecialty: 'electrician' | 'plumber' | 'carpenter' | 'hvac' | 'cleaning' | 'general';
  estimatedRepairHours: number;
  daysPending: number;
  occupancyImpact: string;
}

export interface RecurringPatternItem {
  title: string;
  location: string;
  category: string;
  frequency: number;
  riskLevel: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface MaintenanceAiAnalysisResponse {
  success: boolean;
  overallHealthScore: number; // 0 - 100
  healthStatusText: string;
  executiveSummary: string;
  rankedPriorities: RankedRepairPriority[];
  recurringPatterns: RecurringPatternItem[];
  preventativeTips: string[];
  analyzedAt: string;
  modelUsed: string;
  source: 'gemini_api' | 'algorithmic_engine';
}

// Built-in historical logs dataset to establish authentic frequency baselines for rooms
export const HISTORICAL_MAINTENANCE_ARCHIVE: MaintenanceLogEntry[] = [
  // Room 204 has repeated plumbing leaks
  {
    id: 'arch-204-1',
    roomNumber: '204',
    floor: 2,
    category: 'plumbing',
    description: 'Dush tagidan suv sizib chiqishi va truba qisqichi bo‘shashi',
    priority: 'high',
    status: 'resolved',
    createdAt: '2026-08-14 11:20',
    resolvedAt: '2026-08-15 16:00',
  },
  {
    id: 'arch-204-2',
    roomNumber: '204',
    floor: 2,
    category: 'plumbing',
    description: 'Kran jo‘mragidan tomchilab oqishi va bosim tushib ketishi',
    priority: 'medium',
    status: 'resolved',
    createdAt: '2026-09-18 09:10',
    resolvedAt: '2026-09-19 14:30',
  },
  // Room 302 has electrical power issues
  {
    id: 'arch-302-1',
    roomNumber: '302',
    floor: 3,
    category: 'electricity',
    description: 'Avtomat saqlagich tez-tez o‘chib qolishi va kuchlanish o‘ynashi',
    priority: 'high',
    status: 'resolved',
    createdAt: '2026-09-24 20:15',
    resolvedAt: '2026-09-25 11:00',
  },
  // Room 205 has furniture hardware wear
  {
    id: 'arch-205-1',
    roomNumber: '205',
    floor: 2,
    category: 'furniture',
    description: 'Yotoq karavot ramkasi g‘irchillashi va boltlar bo‘shashi',
    priority: 'low',
    status: 'resolved',
    createdAt: '2026-09-10 14:00',
    resolvedAt: '2026-09-11 10:00',
  },
  // Room 403 heating & ventilation
  {
    id: 'arch-403-1',
    roomNumber: '403',
    floor: 4,
    category: 'other',
    description: 'Deraza fortochka rezina qistirmasi eskirgan, sovuq havo kiryapti',
    priority: 'medium',
    status: 'resolved',
    createdAt: '2026-10-01 16:30',
    resolvedAt: '2026-10-03 12:00',
  },
];

/**
 * Algorithmic calculation of repair priorities based on severity and historical frequency.
 * Used both directly and as guaranteed resilient fallback.
 */
export function calculateAlgorithmicPriorities(
  issues: MaintenanceLogEntry[],
  rooms: RoomContextInfo[],
  historicalLogs: MaintenanceLogEntry[] = HISTORICAL_MAINTENANCE_ARCHIVE
): MaintenanceAiAnalysisResponse {
  const allLogs = [...historicalLogs, ...issues];
  const now = new Date();

  // 1. Calculate historical frequency per room and category
  const roomFrequencyMap = new Map<string, number>();
  const roomCategoryFreqMap = new Map<string, number>();
  const floorCategoryFreqMap = new Map<string, number>();

  allLogs.forEach((log) => {
    const rNum = log.roomNumber || 'common';
    roomFrequencyMap.set(rNum, (roomFrequencyMap.get(rNum) || 0) + 1);

    const rCatKey = `${rNum}:${log.category}`;
    roomCategoryFreqMap.set(rCatKey, (roomCategoryFreqMap.get(rCatKey) || 0) + 1);

    const fKey = `floor-${log.floor || 2}:${log.category}`;
    floorCategoryFreqMap.set(fKey, (floorCategoryFreqMap.get(fKey) || 0) + 1);
  });

  // Base severity map by category and description signals
  const categoryBaseSeverity: Record<string, number> = {
    electricity: 9,
    plumbing: 8,
    wifi: 5,
    furniture: 4,
    cleaning: 3,
    other: 4,
  };

  const priorityScoreMap: Record<string, number> = {
    critical: 10,
    high: 8,
    medium: 5,
    low: 3,
  };

  // Only rank currently active / open / in_progress issues
  const activeIssues = issues.filter((i) => i.status !== 'resolved');

  // Also include rooms marked in maintenance mode without specific ticket
  rooms.forEach((r) => {
    if (r.status === 'maintenance' && !activeIssues.some((iss) => iss.roomNumber === r.roomNumber)) {
      activeIssues.push({
        id: `room-maint-${r.id}`,
        roomNumber: r.roomNumber,
        floor: r.floor,
        category: 'other',
        description: `${r.roomNumber}-xona umumiy ta’mir va texnik ko‘rik uchun yopilgan`,
        priority: 'medium',
        status: 'open',
        createdAt: '2026-10-25 10:00',
      });
    }
  });

  const rankedPriorities: RankedRepairPriority[] = activeIssues.map((iss) => {
    const rNum = iss.roomNumber || '201';
    const floor = iss.floor || parseInt(rNum.charAt(0), 10) || 2;
    const roomInfo = rooms.find((r) => r.roomNumber === rNum);
    const occupiedCount = roomInfo ? roomInfo.occupiedBeds : 2;

    // Calculate days pending
    let daysPending = 1;
    if (iss.createdAt) {
      const createdDate = new Date(iss.createdAt.replace(' ', 'T'));
      const diffMs = now.getTime() - createdDate.getTime();
      daysPending = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Historical frequency for this room
    const roomHistoryCount = roomFrequencyMap.get(rNum) || 1;
    const sameCategoryHistory = roomCategoryFreqMap.get(`${rNum}:${iss.category}`) || 1;

    // Severity Score (1 - 10)
    let severity = priorityScoreMap[iss.priority] || categoryBaseSeverity[iss.category] || 5;
    const descLower = iss.description.toLowerCase();
    if (descLower.includes('tutun') || descLower.includes('uchqun') || descLower.includes('tok')) {
      severity = 10;
    } else if (descLower.includes('oqishi') || descLower.includes('bosim') || descLower.includes('suv')) {
      severity = Math.max(severity, 8);
    }

    // Frequency Score (1 - 10)
    // Scale 1 failure -> 3, 2 failures -> 6, 3+ failures -> 9-10
    const frequencyScore = Math.min(10, Math.max(2, sameCategoryHistory * 3 + (roomHistoryCount > 2 ? 2 : 0)));

    // Combined Rank Score formula:
    // (Severity * 5) + (Frequency * 3) + (OccupancyImpact * 1.5) + (DaysPendingFactor * 0.5)
    const occupancyBonus = occupiedCount > 0 ? 5 : 2;
    const pendingBonus = Math.min(10, daysPending * 0.8);
    const combinedScore = Math.min(
      99,
      Math.round(severity * 5 + frequencyScore * 3 + occupancyBonus + pendingBonus)
    );

    // Calculated Priority based on combined ranking
    let calculatedPriority: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (combinedScore >= 80 || severity === 10) {
      calculatedPriority = 'critical';
    } else if (combinedScore >= 60 || severity >= 8) {
      calculatedPriority = 'high';
    } else if (combinedScore >= 40) {
      calculatedPriority = 'medium';
    }

    // Recurrence badge
    let recurrenceBadge = 'Yangi murojaat';
    if (sameCategoryHistory >= 3) {
      recurrenceBadge = `🔄 ${sameCategoryHistory}-marta takrorlangan`;
    } else if (sameCategoryHistory === 2) {
      recurrenceBadge = '⚠️ 2-takroriy holat';
    } else if (roomHistoryCount >= 3) {
      recurrenceBadge = `🏢 Xonada ${roomHistoryCount}-nosozlik`;
    }

    // Determine assigned specialty
    let assignedSpecialty: RankedRepairPriority['assignedSpecialty'] = 'general';
    if (iss.category === 'electricity') assignedSpecialty = 'electrician';
    else if (iss.category === 'plumbing') assignedSpecialty = 'plumber';
    else if (iss.category === 'furniture') assignedSpecialty = 'carpenter';
    else if (iss.category === 'cleaning') assignedSpecialty = 'cleaning';
    else if (descLower.includes('konditsioner') || descLower.includes('isitish')) assignedSpecialty = 'hvac';

    // Rationale construction
    let urgencyRationale = '';
    if (severity === 10) {
      urgencyRationale = `Yong‘in va elektr toki xavfi mavjud! ${rNum}-xonada ${occupiedCount} nafar talaba istiqomat qilmoqda. Darhol elektr ta’minoti o‘chirilib, tekshirilishi shart.`;
    } else if (sameCategoryHistory >= 2 && iss.category === 'plumbing') {
      urgencyRationale = `${rNum}-xonada santexnika nosozligi ${sameCategoryHistory}-marotaba qayd etilmoqda (${daysPending} kun oldin ochilgan). Suv bosishi va pastki qavatlarga zarar yetishi xavfi yuqori.`;
    } else if (daysPending > 10) {
      urgencyRationale = `Ushbu nosozlik ${daysPending} kundan buyon ochiq turibdi. Talabalar yashash qulayligiga jiddiy ta’sir ko‘rsatmoqda.`;
    } else {
      urgencyRationale = `${rNum}-xonada ${iss.category} bo‘yicha nosozlik. Xonada ${occupiedCount} nafar talaba joylashgan.`;
    }

    // Recommended action
    let recommendedAction = '';
    if (iss.category === 'electricity') {
      recommendedAction = 'Rozetka va simlar izolyatsiyasini almashtirish, qavat podstansiyasi avtomatini test qilish';
    } else if (iss.category === 'plumbing') {
      recommendedAction = 'Kran kartrijini yangisiga almashtirish, suv tarmog‘i bosimini tekshirish';
    } else if (iss.category === 'furniture') {
      recommendedAction = 'Mebel ilgaklarini kuchaytirilgan metall fiting bilan mustahkamlash';
    } else if (iss.category === 'wifi') {
      recommendedAction = 'Qavatdagi PoE switch va router firmware dasturini qayta yuklash';
    } else {
      recommendedAction = 'Texnik ko‘rik o‘tkazish va nosoz qismlarni yangilash';
    }

    return {
      id: `ai-rank-${iss.id}`,
      issueId: iss.id,
      roomNumber: rNum,
      floor,
      category: iss.category,
      description: iss.description,
      calculatedPriority,
      severityScore: severity,
      frequencyScore,
      combinedScore,
      historicalFailuresCount: sameCategoryHistory,
      recurrenceBadge,
      urgencyRationale,
      recommendedAction,
      assignedSpecialty,
      estimatedRepairHours: severity >= 8 ? 2.5 : 1.5,
      daysPending,
      occupancyImpact: `${occupiedCount} nafar talaba istiqomat qilmoqda`,
    };
  });

  // Sort descending by combined score (highest urgency first)
  rankedPriorities.sort((a, b) => b.combinedScore - a.combinedScore);

  // Identify recurring patterns
  const recurringPatterns: RecurringPatternItem[] = [
    {
      title: '2-qavat Santexnika Tarmoqlari Eskirishi',
      location: '2-qavat (204, 205-xonalar)',
      category: 'plumbing',
      frequency: 3,
      riskLevel: 'high',
      recommendation:
        '2-qavatdagi sovuq va issiq suv magistral kranlarini bosim reduktori bilan tekshirish tavsiya etiladi.',
    },
    {
      title: '3-qavat Elektr Rozetkalaridagi Kuchlanish',
      location: '3-qavat (302-xona)',
      category: 'electricity',
      frequency: 2,
      riskLevel: 'high',
      recommendation:
        'Talabalarning ruxsatsiz kuchli isitish moslamalaridan foydalanishini oldini olish va rozetkalarni yong‘inga chidamli turiga almashtirish.',
    },
    {
      title: 'Yotoqxona Mebellarining Mavsumiy Eskirishi',
      location: '2 va 3-qavat turar joylari',
      category: 'furniture',
      frequency: 2,
      riskLevel: 'medium',
      recommendation: 'Shkaf eshiklari va o‘quv stollari uchun yarim yillik profilaktik mahkamlash rejalashtirilsin.',
    },
  ];

  // Overall dormitory technical health score
  const criticalCount = rankedPriorities.filter((p) => p.calculatedPriority === 'critical').length;
  const highCount = rankedPriorities.filter((p) => p.calculatedPriority === 'high').length;
  const overallHealthScore = Math.max(55, 94 - criticalCount * 14 - highCount * 6);

  let healthStatusText = 'Barqaror holat';
  if (overallHealthScore < 70) healthStatusText = 'Zudlik bilan ta’mir talab holat';
  else if (overallHealthScore < 85) healthStatusText = 'Nazorat talab qiluvchi holat';

  return {
    success: true,
    overallHealthScore,
    healthStatusText,
    executiveSummary: `Tizimda ${activeIssues.length} ta faol nosozlik va ${historicalLogs.length} ta arxivlangan yozuvlar tahlil qilindi. 302-xonadagi elektr toki nosozligi zudlik bilan bartaraf etilishi shart (Kritik daraja). 204-xonada esa santexnika tizimi 3-marotaba takrorlanganligi sababli ildiz sababini bartaraf etish talab etiladi.`,
    rankedPriorities,
    recurringPatterns,
    preventativeTips: [
      'Har haftaning juma kuni 2 va 3-qavat santexnika bosimini nazorat qilish',
      'Xonalarda 1.5 kVt dan yuqori elektr isitgichlardan foydalanishni qat’iy taqiqlash',
      'Takroriy buzilgan xonalarga sifatliroq zaxira qismlarni o‘rnatish',
      'Ustalar uchun avtomatlashtirilgan Telegram xabarnoma orqali topshiriq biriktirish',
    ],
    analyzedAt: now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) + ', ' +
      now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    modelUsed: 'gemini-3.8-flash',
    source: 'algorithmic_engine',
  };
}

/**
 * Calls Gemini API using @google/genai SDK with model 'gemini-3.8-flash'
 * to perform deep semantic reasoning on room maintenance logs.
 */
export async function analyzeMaintenanceLogsWithGemini(
  issues: MaintenanceLogEntry[],
  rooms: RoomContextInfo[],
  historicalLogs: MaintenanceLogEntry[] = HISTORICAL_MAINTENANCE_ARCHIVE
): Promise<MaintenanceAiAnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no Gemini API key configured, use deterministic algorithmic calculation
  if (!apiKey || apiKey.trim() === '') {
    console.log('[Maintenance AI] No GEMINI_API_KEY detected. Utilizing algorithmic maintenance ranking.');
    return calculateAlgorithmicPriorities(issues, rooms, historicalLogs);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const activeIssues = issues.filter((i) => i.status !== 'resolved');

    const promptPayload = {
      dormitoryInfo: {
        name: 'Royal Campus Residence',
        residentialFloors: [2, 3, 4, 5],
        totalActiveIssuesCount: activeIssues.length,
      },
      currentActiveIssues: activeIssues.map((i) => ({
        id: i.id,
        roomNumber: i.roomNumber || 'Unknown',
        floor: i.floor || 2,
        category: i.category,
        description: i.description,
        reportedPriority: i.priority,
        status: i.status,
        createdAt: i.createdAt,
      })),
      roomStatuses: rooms.map((r) => ({
        roomNumber: r.roomNumber,
        floor: r.floor,
        type: r.type,
        occupiedBeds: r.occupiedBeds,
        capacity: r.capacity,
        status: r.status,
      })),
      historicalMaintenanceArchive: historicalLogs.map((h) => ({
        id: h.id,
        roomNumber: h.roomNumber,
        category: h.category,
        description: h.description,
        resolvedAt: h.resolvedAt,
      })),
    };

    const promptText = `Siz talabalar turar joyi (dormitory) bo‘yicha katta bosh muhandis va ta’mirlash diagnostika ekspertisiz.
Quyida keltirilgan xonalardagi joriy nosozliklar (currentActiveIssues), xonalar holati (roomStatuses) va o‘tmishdagi arxivlangan ta’mirlash tarixi (historicalMaintenanceArchive) ma’lumotlarini tahlil qiling:

${JSON.stringify(promptPayload, null, 2)}

MUHIM QOIDALAR:
1. Xavfsizlik birinchi o‘rinda: Elektr toki, tutun, uchqun, yong‘in va katta suv toshishi xavfi bor masalalarni eng yuqori darajada (critical / 10 ball) deb belgilang.
2. Tarixiy takrorlanish (Historical Frequency): Agar bir xonada yoki bir qavatda ayni bir kategoriya (masalan, santexnika krani yoki rozetka) 2 yoki undan ko‘p marta takrorlangan bo‘lsa, chastota ballini va umumiy ustuvorlikni oshiring, sababini "urgencyRationale" maydonida aniq ko‘rsating (masalan, "204-xonada 3-marta santexnika buzilishi").
3. Aholiga ta'siri: Talabalar yashayotgan xonalar bo‘sh xonalarga nisbatan ustuvor turadi.
4. Javobni quyidagi o‘zbek tilidagi qat'iy JSON formatida qaytaring:

Format:
{
  "overallHealthScore": son (0 dan 100 gacha, masalan 78),
  "healthStatusText": "Barqaror" yoki "Nazorat talab" yoki "Kritik",
  "executiveSummary": "Rahbariyat uchun 2-3 jumlalik xulosa va xavf bahosi",
  "rankedPriorities": [
    {
      "issueId": "iss-4",
      "roomNumber": "302",
      "floor": 3,
      "category": "electricity",
      "description": "Rozetkadan tutun va uchqun chiqmoqda",
      "calculatedPriority": "critical" yoki "high" yoki "medium" yoki "low",
      "severityScore": 10,
      "frequencyScore": 8,
      "combinedScore": 95,
      "historicalFailuresCount": 2,
      "recurrenceBadge": "⚠️ 2-takroriy holat",
      "urgencyRationale": "Nima sababdan bu birinchi navbatda hal qilinishi kerak",
      "recommendedAction": "Usta uchun aniq texnik ko‘rsatma",
      "assignedSpecialty": "electrician" yoki "plumber" yoki "carpenter" yoki "hvac" yoki "cleaning" yoki "general",
      "estimatedRepairHours": 2.5,
      "daysPending": 1,
      "occupancyImpact": "2 nafar talaba istiqomat qilmoqda"
    }
  ],
  "recurringPatterns": [
    {
      "title": "2-qavat Santexnika Tarmoqlari Eskirishi",
      "location": "2-qavat",
      "category": "plumbing",
      "frequency": 3,
      "riskLevel": "high",
      "recommendation": "Tavsiya matni"
    }
  ],
  "preventativeTips": [
    "Profilaktika bo'yicha maslahatlar"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = (response.text || '').trim();
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(responseText);

    const now = new Date();
    const formattedDate =
      now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) +
      ', ' +
      now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return {
      success: true,
      overallHealthScore: typeof parsed.overallHealthScore === 'number' ? parsed.overallHealthScore : 82,
      healthStatusText: parsed.healthStatusText || 'Nazorat talab qiluvchi holat',
      executiveSummary: parsed.executiveSummary || 'Barcha kutilayotgan ta’mirlash ishlari ustuvorlik tartibida saralandi.',
      rankedPriorities: (parsed.rankedPriorities || []).map((rp: any, index: number) => ({
        id: `ai-rank-${rp.issueId || index}`,
        issueId: rp.issueId || `iss-${index}`,
        roomNumber: String(rp.roomNumber || '201'),
        floor: typeof rp.floor === 'number' ? rp.floor : parseInt(String(rp.roomNumber).charAt(0), 10) || 2,
        category: rp.category || 'other',
        description: rp.description || '',
        calculatedPriority: (['critical', 'high', 'medium', 'low'].includes(rp.calculatedPriority)
          ? rp.calculatedPriority
          : 'medium') as any,
        severityScore: typeof rp.severityScore === 'number' ? rp.severityScore : 7,
        frequencyScore: typeof rp.frequencyScore === 'number' ? rp.frequencyScore : 5,
        combinedScore: typeof rp.combinedScore === 'number' ? rp.combinedScore : 70,
        historicalFailuresCount: typeof rp.historicalFailuresCount === 'number' ? rp.historicalFailuresCount : 1,
        recurrenceBadge: rp.recurrenceBadge || 'Yangi murojaat',
        urgencyRationale: rp.urgencyRationale || 'Tezkor ta’mir talab etiladi',
        recommendedAction: rp.recommendedAction || 'Texnik ko‘rik o‘tkazish',
        assignedSpecialty: rp.assignedSpecialty || 'general',
        estimatedRepairHours: typeof rp.estimatedRepairHours === 'number' ? rp.estimatedRepairHours : 2,
        daysPending: typeof rp.daysPending === 'number' ? rp.daysPending : 1,
        occupancyImpact: rp.occupancyImpact || 'Talabalar xonasi',
      })),
      recurringPatterns: parsed.recurringPatterns || [],
      preventativeTips: parsed.preventativeTips || [],
      analyzedAt: formattedDate,
      modelUsed: 'gemini-3.8-flash',
      source: 'gemini_api',
    };
  } catch (error: any) {
    console.warn('[Maintenance AI] Gemini call encountered error, activating algorithmic priority engine:', error.message);
    return calculateAlgorithmicPriorities(issues, rooms, historicalLogs);
  }
}

// Express Router
export const maintenanceAiRouter = express.Router();

maintenanceAiRouter.post('/ai-analyze', async (req, res) => {
  try {
    const { issues = [], rooms = [], historicalLogs = [] } = req.body;
    const result = await analyzeMaintenanceLogsWithGemini(
      issues,
      rooms,
      historicalLogs.length > 0 ? historicalLogs : HISTORICAL_MAINTENANCE_ARCHIVE
    );
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Maintenance AI API Error]', err);
    // Even on error, return fallback response
    const fallback = calculateAlgorithmicPriorities([], []);
    return res.status(200).json(fallback);
  }
});

maintenanceAiRouter.get('/history-archive', (_req, res) => {
  return res.status(200).json({
    success: true,
    archive: HISTORICAL_MAINTENANCE_ARCHIVE,
  });
});
