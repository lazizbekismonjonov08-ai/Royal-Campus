import {
  Room,
  Student,
  Application,
  Payment,
  Contract,
  Employee,
  Issue,
  DisciplineRecord,
  NotificationItem,
  AuditLogEntry,
  DormSettings,
  RoomType,
  Bed,
  CommonArea,
  AccessTerminal,
  AccessLogEvent,
  AccessControlPolicy,
  StudentBillingLedger,
} from '../types';

export const INITIAL_ACCESS_POLICY: AccessControlPolicy = {
  curfewEnabled: true,
  curfewStart: '23:00',
  curfewEnd: '06:00',
  curfewAction: 'allow_with_flag',
  overduePaymentPolicy: 'allow_with_warning',
  requireActiveBedAssignment: true,
  autoSyncHikvisionLibrary: false,
  simulatorEnabled: true,
  relayDefaultDuration: 5,
};

export const INITIAL_ACCESS_TERMINALS: AccessTerminal[] = [
  {
    id: 'term-main-entry',
    name: 'Bosh Kirish Turniketi #1 (Kirish)',
    vendor: 'hikvision',
    model: 'DS-K1T673MW (MinMoe Face & Card)',
    deviceType: 'face_terminal',
    protocol: 'ISAPI',
    ipAddress: '192.168.1.101',
    port: 80,
    username: 'admin',
    location: '1-qavat, Bosh vestibyul (Kirish)',
    direction: 'entry',
    status: 'simulated',
    isSimulatedOnly: true, // Demo simulator active
    relayHoldSeconds: 5,
    enabled: true,
    lastPingAt: '2026-10-15 11:20',
    lastPingSuccess: true,
  },
  {
    id: 'term-main-exit',
    name: 'Bosh Kirish Turniketi #2 (Chiqish)',
    vendor: 'hikvision',
    model: 'DS-K1T502 (Mifare Card Reader)',
    deviceType: 'card_reader',
    protocol: 'ISAPI',
    ipAddress: '192.168.1.102',
    port: 80,
    username: 'admin',
    location: '1-qavat, Bosh vestibyul (Chiqish)',
    direction: 'exit',
    status: 'simulated',
    isSimulatedOnly: true,
    relayHoldSeconds: 4,
    enabled: true,
    lastPingAt: '2026-10-15 11:20',
    lastPingSuccess: true,
  },
  {
    id: 'term-library',
    name: 'Kutubxona & Coworking Eshigi',
    vendor: 'hikvision',
    model: 'DS-K1T804 (Smart Card Terminal)',
    deviceType: 'card_reader',
    protocol: 'ISAPI',
    ipAddress: '192.168.1.105',
    port: 80,
    username: 'admin',
    location: '1-qavat, Kutubxona (F1-LIB)',
    direction: 'bidirectional',
    status: 'simulated',
    isSimulatedOnly: true,
    relayHoldSeconds: 3,
    enabled: true,
    lastPingAt: '2026-10-15 11:15',
    lastPingSuccess: true,
  },
];

export const INITIAL_ACCESS_LOGS: AccessLogEvent[] = [];

export const INITIAL_SETTINGS: DormSettings = {
  roomTariffs: {
    standard: 1000000,      // 1.0M UZS (8-bed)
    standard_plus: 1200000, // 1.2M UZS (8-bed)
    comfort: 1200000,       // 1.2M UZS (6-bed)
    comfort_plus: 1400000,  // 1.4M UZS (6-bed)
    lux: 1400000,           // 1.4M UZS (4-bed)
  },
  autoPaymentRemindersDays: [5, 2, 0],
  retentionMonths: 3,
  notificationChannels: {
    telegram: true,
    sms: false,
  },
};

export const INITIAL_COMMON_AREAS: CommonArea[] = [
  {
    id: 'ca-101',
    name: 'Qabulxona va Ma\'muriyat (Reception)',
    code: 'F1-REC',
    floor: 1,
    category: 'reception',
    areaSizeM2: 65,
    operatingHours: '24/7',
    responsiblePerson: 'Dilshod Tursunov (Receptionist)',
    status: 'active',
    description: 'Mehmonlar va talabalarni ro\'yxatga olish, kalitlarni topshirish va umumiy ma\'lumot berish markazi.',
    amenities: ['Ro\'yxatga olish pulti', 'Kompyuter & CRM', 'Turniket integratsiyasi', 'Mehmonlar kutish hududi', 'Wi-Fi 6'],
  },
  {
    id: 'ca-102',
    name: 'Oshxona va Ovqatlanish Zali (Kitchen & Dining)',
    code: 'F1-KIT',
    floor: 1,
    category: 'kitchen',
    areaSizeM2: 120,
    operatingHours: '06:00 - 23:00',
    responsiblePerson: 'Gulnora Alimova (Cleaner / Mas\'ul)',
    status: 'active',
    description: 'Talabalar taom tayyorlashi va birgalikda ovqatlanishi uchun to\'liq jihozlangan oshxona kompleksi.',
    amenities: ['Elektr plitalar (8 ta)', 'Mikroto\'lqinli pechlar (4 ta)', 'Muzlatgichlar (4 ta)', 'Filtrlangan ichimlik suvi', 'Chiqindilarni saralash'],
  },
  {
    id: 'ca-103',
    name: 'Kutubxona & Coworking Zali (Study Hall)',
    code: 'F1-LIB',
    floor: 1,
    category: 'study',
    areaSizeM2: 90,
    operatingHours: '24/7',
    responsiblePerson: 'Shaxnoza Raximova (Manager)',
    status: 'active',
    description: 'Tinch ilmiy mutolaa, mustaqil dars tayyorlash va individual ishlash uchun ergonomik zallar.',
    amenities: ['Yakkaxon o\'qish partalari', 'Yuqori tezlikdagi optik Wi-Fi', 'Elektr rozetkalar & USB', 'Konditsioner', 'Darsliklar kutubxonasi'],
  },
  {
    id: 'ca-104',
    name: 'Kirxona & Dazmolxona (Laundry & Utility)',
    code: 'F1-LAU',
    floor: 1,
    category: 'laundry',
    areaSizeM2: 45,
    operatingHours: '07:00 - 22:00',
    responsiblePerson: 'Gulnora Alimova',
    status: 'active',
    description: 'Kiyimlarni yuvish, quritish va dazmollash uchun avtomatlashtirilgan kirxona hududi.',
    amenities: ['Avtomat kir yuvish mashinalari (6 ta)', 'Quritish mashinalari (4 ta)', 'Bug\' dazmollari va taxtalari'],
  },
  {
    id: 'ca-105',
    name: 'Tibbiyot Punkti (Medical Station)',
    code: 'F1-MED',
    floor: 1,
    category: 'medical',
    areaSizeM2: 30,
    operatingHours: '08:00 - 20:00 (Navbatchi 24/7)',
    responsiblePerson: 'Navbatchi Hamshira',
    status: 'active',
    description: 'Talabalarga birinchi tibbiy yordam ko\'rsatish, harorat o\'lchash va birlamchi dori vositalari xonasi.',
    amenities: ['Tibbiy krovat', 'Birinchi yordam aptechkasi', 'Elektron tonometr', 'Izolyatsiya bo\'lmasi'],
  },
  {
    id: 'ca-106',
    name: 'Xavfsizlik & CCTV Monitoring Markazi',
    code: 'F1-SEC',
    floor: 1,
    category: 'security',
    areaSizeM2: 25,
    operatingHours: '24/7',
    responsiblePerson: 'Jahongir Xoliqov (Security)',
    status: 'active',
    description: 'Bino perimetri va umumiy hududlarini tun-u kun videokuzatuv hamda yong\'in xavfsizligini nazorat qilish posti.',
    amenities: ['32 ta Full HD kamera monitorlari', 'Yong\'in xabarnomasi', 'Tashqi chaqiruv ratsiyalari'],
  },
  {
    id: 'ca-107',
    name: 'Lounge & Dam Olish Zali (Student Lounge)',
    code: 'F1-LNG',
    floor: 1,
    category: 'lounge',
    areaSizeM2: 80,
    operatingHours: '08:00 - 23:00',
    responsiblePerson: 'Shaxnoza Raximova',
    status: 'active',
    description: 'Madaniy hordiq chiqarish, stol tennisi va shaxmat-shashka o\'yinlari uchun qulay dam olish hududi.',
    amenities: ['Smart TV', 'Yumshoq divanlar', 'Stol tennisi', 'Kofe-mashina', 'Doska o\'yinlari'],
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    fullName: 'Alisher Qodirov',
    phone: '+998 90 123 45 67',
    email: 'owner@royalcampus.uz',
    role: 'owner',
    status: 'active',
    lastLogin: '2026-10-07 14:30',
  },
  {
    id: 'emp-2',
    fullName: 'Shaxnoza Raximova',
    phone: '+998 91 234 56 78',
    email: 'manager@royalcampus.uz',
    role: 'manager',
    status: 'active',
    lastLogin: '2026-10-07 12:15',
  },
  {
    id: 'emp-3',
    fullName: 'Dilshod Tursunov',
    phone: '+998 93 345 67 89',
    email: 'reception@royalcampus.uz',
    role: 'receptionist',
    status: 'active',
    lastLogin: '2026-10-07 09:00',
  },
  {
    id: 'emp-4',
    fullName: 'Jahongir Xoliqov',
    phone: '+998 94 456 78 90',
    email: 'security@royalcampus.uz',
    role: 'security',
    status: 'active',
    lastLogin: '2026-10-07 08:00',
  },
  {
    id: 'emp-5',
    fullName: 'Gulnora Alimova',
    phone: '+998 95 567 89 01',
    email: 'cleaner@royalcampus.uz',
    role: 'cleaner',
    status: 'active',
    lastLogin: '2026-10-06 16:45',
  },
];

// Exact 56-room, 4-floor residential inventory (Floors 2–5, 14 rooms & 86 beds per floor = 344 beds total, all starting Available)
export function generateInitialRooms(): Room[] {
  const rooms: Room[] = [];
  const floorSpecs: Array<{
    floor: number;
    entries: Array<{ roomNum: number; type: RoomType; capacity: number }>;
  }> = [
    {
      floor: 2,
      entries: [
        { roomNum: 1, type: 'comfort', capacity: 6 },
        { roomNum: 2, type: 'comfort', capacity: 6 },
        { roomNum: 3, type: 'comfort', capacity: 6 },
        { roomNum: 4, type: 'comfort', capacity: 6 },
        { roomNum: 5, type: 'comfort', capacity: 6 },
        { roomNum: 6, type: 'comfort', capacity: 6 },
        { roomNum: 7, type: 'comfort', capacity: 6 },
        { roomNum: 8, type: 'standard_plus', capacity: 8 },
        { roomNum: 9, type: 'comfort_plus', capacity: 6 },
        { roomNum: 10, type: 'comfort_plus', capacity: 6 },
        { roomNum: 11, type: 'comfort_plus', capacity: 6 },
        { roomNum: 12, type: 'lux', capacity: 4 },
        { roomNum: 13, type: 'comfort_plus', capacity: 6 },
        { roomNum: 14, type: 'standard_plus', capacity: 8 },
      ],
    },
    {
      floor: 3,
      entries: [
        { roomNum: 15, type: 'comfort', capacity: 6 },
        { roomNum: 16, type: 'comfort', capacity: 6 },
        { roomNum: 17, type: 'comfort', capacity: 6 },
        { roomNum: 18, type: 'comfort', capacity: 6 },
        { roomNum: 19, type: 'comfort', capacity: 6 },
        { roomNum: 20, type: 'comfort', capacity: 6 },
        { roomNum: 21, type: 'comfort', capacity: 6 },
        { roomNum: 22, type: 'standard_plus', capacity: 8 },
        { roomNum: 23, type: 'comfort_plus', capacity: 6 },
        { roomNum: 24, type: 'comfort_plus', capacity: 6 },
        { roomNum: 25, type: 'comfort_plus', capacity: 6 },
        { roomNum: 26, type: 'lux', capacity: 4 },
        { roomNum: 27, type: 'comfort_plus', capacity: 6 },
        { roomNum: 28, type: 'standard_plus', capacity: 8 },
      ],
    },
    {
      floor: 4,
      entries: [
        { roomNum: 29, type: 'comfort', capacity: 6 },
        { roomNum: 30, type: 'comfort', capacity: 6 },
        { roomNum: 31, type: 'comfort', capacity: 6 },
        { roomNum: 32, type: 'comfort', capacity: 6 },
        { roomNum: 33, type: 'comfort', capacity: 6 },
        { roomNum: 34, type: 'comfort', capacity: 6 },
        { roomNum: 35, type: 'comfort', capacity: 6 },
        { roomNum: 36, type: 'standard_plus', capacity: 8 },
        { roomNum: 37, type: 'comfort_plus', capacity: 6 },
        { roomNum: 38, type: 'comfort_plus', capacity: 6 },
        { roomNum: 39, type: 'comfort_plus', capacity: 6 },
        { roomNum: 40, type: 'lux', capacity: 4 },
        { roomNum: 41, type: 'comfort_plus', capacity: 6 },
        { roomNum: 42, type: 'standard_plus', capacity: 8 },
      ],
    },
    {
      floor: 5,
      entries: [
        { roomNum: 43, type: 'comfort', capacity: 6 },
        { roomNum: 44, type: 'comfort', capacity: 6 },
        { roomNum: 45, type: 'comfort', capacity: 6 },
        { roomNum: 46, type: 'comfort', capacity: 6 },
        { roomNum: 47, type: 'comfort', capacity: 6 },
        { roomNum: 48, type: 'comfort', capacity: 6 },
        { roomNum: 49, type: 'comfort', capacity: 6 },
        { roomNum: 50, type: 'standard', capacity: 8 },
        { roomNum: 51, type: 'comfort_plus', capacity: 6 },
        { roomNum: 52, type: 'comfort_plus', capacity: 6 },
        { roomNum: 53, type: 'comfort_plus', capacity: 6 },
        { roomNum: 54, type: 'lux', capacity: 4 },
        { roomNum: 55, type: 'comfort_plus', capacity: 6 },
        { roomNum: 56, type: 'standard', capacity: 8 },
      ],
    },
  ];

  floorSpecs.forEach(({ floor, entries }) => {
    let floorBedCounter = 0;

    entries.forEach(({ roomNum, type, capacity }) => {
      const roomId = `room-${roomNum}`;
      const roomNumber = String(roomNum);
      const priceMonthly = INITIAL_SETTINGS.roomTariffs[type];
      const beds: Bed[] = [];

      for (let i = 0; i < capacity; i++) {
        floorBedCounter += 1;
        beds.push({
          id: `F${floor}-R${roomNum}-B${floorBedCounter}`,
          bedNumber: floorBedCounter,
          bedIdentifier: String(floorBedCounter),
          roomId,
          status: 'available',
        });
      }

      rooms.push({
        id: roomId,
        roomNumber,
        floor,
        type,
        capacity,
        priceMonthly,
        beds,
        status: 'available',
      });
    });
  });

  return rooms;
}

const FIRST_NAMES = [
  'Jasur', 'Sardor', 'Laylo', 'Malika', 'Shahzod', 'Nigora', 'Bobur', 'Aziza',
  'Sanjar', 'Diyora', 'Umida', 'Farrux', 'Kamola', 'Otabek', 'Gulchehra', 'Sherzod',
  'Madina', 'Bekzod', 'Zuxra', 'Javohir', 'Sevinch', 'Rustam', 'Dilnoza', 'Shohruh'
];

const LAST_NAMES = [
  'Alimov', 'Karimov', 'Rahimov', 'Tashpulatov', 'Boboyev', 'Yuldashova', 'Tursunov',
  'Ismoilov', 'Abdullayev', 'Murodov', 'Solihov', 'Normatova', 'Mirzayev', 'Usmonov',
  'Ergashev', 'Qosimov', 'Xasanov', 'Jurayev', 'Sodiqov', 'Nazarov'
];

const UNIVERSITIES = [
  'TATU (Muhammad al-Xorazmiy nomidagi TATU)',
  'O\'zMU (O\'zbekiston Milliy Universiteti)',
  'TDTU (Islam Karimov nomidagi TDTU)',
  'TDAU (Toshkent Davlat Agrotexnologiya U.)',
  'WIUT (Westminster International University)',
  'TSHYU (Toshkent Davlat Yuridik U.)',
  'YJU (Yeoju / Yoju Technologiya U.)',
  'TDIU (Toshkent Davlat Iqtisodiyot U.)'
];

const REGIONS = [
  'Samarqand viloyati, Kattaqo\'rg\'on t.',
  'Farg\'ona viloyati, Marg\'ilon sh.',
  'Andijon viloyati, Asaka t.',
  'Buxoro viloyati, G\'ijduvon t.',
  'Qashqadaryo viloyati, Qarshi sh.',
  'Surxondaryo viloyati, Denov t.',
  'Xorazm viloyati, Urganch sh.',
  'Namangan viloyati, Chust t.',
  'Navoiy viloyati, Zarafshon sh.',
  'Qoraqalpog\'iston R., Nukus sh.'
];

export function generateSeedData() {
  // All 56 rooms across residential floors 2-5 start completely Available (unassigned / empty)
  const rooms = generateInitialRooms();
  const students: Student[] = [];
  const applications: Application[] = [];
  const contracts: Contract[] = [];
  const payments: Payment[] = [];
  const issues: Issue[] = [];
  const disciplineRecords: DisciplineRecord[] = [];
  const notifications: NotificationItem[] = [];
  const auditLogs: AuditLogEntry[] = [];

  return {
    rooms,
    students,
    applications,
    payments,
    contracts,
    employees: INITIAL_EMPLOYEES,
    issues,
    disciplineRecords,
    notifications,
    auditLogs,
    settings: INITIAL_SETTINGS,
    commonAreas: INITIAL_COMMON_AREAS,
    accessTerminals: INITIAL_ACCESS_TERMINALS,
    accessLogs: INITIAL_ACCESS_LOGS,
    accessPolicy: INITIAL_ACCESS_POLICY,
    billingLedgers: {} as Record<string, StudentBillingLedger>,
  };
}
