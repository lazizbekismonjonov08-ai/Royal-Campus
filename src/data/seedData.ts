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

export const INITIAL_ACCESS_LOGS: AccessLogEvent[] = [
  {
    id: 'evt-sim-101',
    timestamp: '2026-10-15 10:42:15',
    isSimulated: true,
    source: 'simulated_test',
    terminalId: 'term-main-entry',
    terminalName: 'Bosh Kirish Turniketi #1 (Kirish)',
    studentId: 'std-1001',
    studentName: 'Karimov Jasur',
    studentRoom: '201',
    credentialType: 'card',
    credentialValue: 'RFID: RC1001',
    direction: 'entry',
    decision: 'granted',
    reasonCode: 'ACCESS_OK',
    reasonMessage: 'Kirish tasdiqlandi. Xush kelibsiz!',
    relayTriggered: true,
  },
  {
    id: 'evt-sim-102',
    timestamp: '2026-10-15 10:48:30',
    isSimulated: true,
    source: 'simulated_test',
    terminalId: 'term-main-exit',
    terminalName: 'Bosh Kirish Turniketi #2 (Chiqish)',
    studentId: 'std-1002',
    studentName: 'Rahimov Sardor',
    studentRoom: '201',
    credentialType: 'face',
    credentialValue: 'Face Match: 99.2%',
    direction: 'exit',
    decision: 'granted',
    reasonCode: 'ACCESS_OK',
    reasonMessage: 'Chiqish qayd etildi.',
    relayTriggered: true,
  },
  {
    id: 'evt-sim-103',
    timestamp: '2026-10-14 23:24:10',
    isSimulated: true,
    source: 'simulated_test',
    terminalId: 'term-main-entry',
    terminalName: 'Bosh Kirish Turniketi #1 (Kirish)',
    studentId: 'std-1003',
    studentName: 'Tashpulatov Laylo',
    studentRoom: '202',
    credentialType: 'face',
    credentialValue: 'Face Match: 98.7%',
    direction: 'entry',
    decision: 'granted',
    reasonCode: 'ACCESS_OK',
    reasonMessage: 'Kirish tasdiqlandi (Kech qolish qayd etildi)',
    curfewFlagged: true,
    relayTriggered: true,
  },
  {
    id: 'evt-sim-104',
    timestamp: '2026-10-14 18:12:00',
    isSimulated: true,
    source: 'simulated_test',
    terminalId: 'term-main-entry',
    terminalName: 'Bosh Kirish Turniketi #1 (Kirish)',
    studentId: 'std-2001',
    studentName: 'Muhriddin Olimov',
    credentialType: 'card',
    credentialValue: 'RFID: RC9988',
    direction: 'entry',
    decision: 'denied',
    reasonCode: 'NO_ROOM_ASSIGNED',
    reasonMessage: 'Talabaga yotoqxonada xona va o‘rin biriktirilmagan. Qabulxonaga murojaat qiling.',
    relayTriggered: false,
  },
];

export const INITIAL_SETTINGS: DormSettings = {
  roomTariffs: {
    standard: 1000000,      // 1.0M UZS (8-bed)
    standard_plus: 1200000, // 1.2M UZS (8-bed Panoramic)
    comfort: 1200000,       // 1.2M UZS (6-bed)
    comfort_plus: 1400000,  // 1.4M UZS (6-bed Panoramic)
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

// Helper to construct all 56 rooms (Floor 2: 14 rooms, 88 beds; Floors 3-5: 14 rooms, 86 beds each)
export function generateInitialRooms(): Room[] {
  const rooms: Room[] = [];
  const floors = [2, 3, 4, 5];

  floors.forEach((floor) => {
    for (let r = 1; r <= 14; r++) {
      const roomNum = `${floor}${r < 10 ? '0' + r : r}`;
      let type: RoomType = 'comfort';
      let capacity = 6;
      let priceMonthly = INITIAL_SETTINGS.roomTariffs.comfort;

      if (floor === 2) {
        // Confirmed second-floor room configuration:
        // Room 12: Lux, 4 beds, 1,400,000 UZS/month
        // Rooms 1–7, 10–11, and 13: Comfort, 6 beds each, 1,200,000 UZS/month
        // Rooms 8, 9, and 14: Standard, 8 beds each, 1,000,000 UZS/month
        if (r === 12) {
          type = 'lux';
          capacity = 4;
          priceMonthly = 1400000;
        } else if (r === 8 || r === 9 || r === 14) {
          type = 'standard';
          capacity = 8;
          priceMonthly = 1000000;
        } else {
          type = 'comfort';
          capacity = 6;
          priceMonthly = 1200000;
        }
      } else if (floor === 3) {
        // Confirmed third-floor room configuration (Rooms 15–28):
        // Room 26 (r === 12, room 312): Lux, 4 beds, 1,400,000 UZS/month
        // Rooms 15–21, 24–25, and 27 (r: 1–7, 10–11, 13; rooms 301–307, 310–311, 313): Comfort, 6 beds each, 1,200,000 UZS/month
        // Rooms 22, 23, and 28 (r === 8, 9, 14; rooms 308, 309, 314): Standard, 8 beds each, 1,000,000 UZS/month
        if (r === 12) {
          type = 'lux';
          capacity = 4;
          priceMonthly = 1400000;
        } else if (r === 8 || r === 9 || r === 14) {
          type = 'standard';
          capacity = 8;
          priceMonthly = 1000000;
        } else {
          type = 'comfort';
          capacity = 6;
          priceMonthly = 1200000;
        }
      } else {
        // Standard template for Floors 4, 5 (1 Lux, 11 Comfort, 2 Standard = 86 beds)
        if (r === 1) {
          type = 'lux';
          capacity = 4;
          priceMonthly = INITIAL_SETTINGS.roomTariffs.lux;
        } else if (r >= 13) {
          type = 'standard';
          capacity = 8;
          priceMonthly = INITIAL_SETTINGS.roomTariffs.standard;
        }
      }

      // Upgrade select front-facing rooms across standard and comfort tiers to _plus (panoramic) variants
      const isFrontPanoramic =
        (floor === 2 && (r === 3 || r === 8 || r === 13)) ||
        (floor === 3 && (r === 3 || r === 9)) ||
        ((floor === 4 || floor === 5) && (r === 4 || r === 13));

      if (isFrontPanoramic && (type === 'standard' || type === 'comfort')) {
        type = `${type}_plus` as RoomType;
      }
      priceMonthly = INITIAL_SETTINGS.roomTariffs[type];

      const beds: Bed[] = [];
      for (let b = 1; b <= capacity; b++) {
        beds.push({
          id: `bed-${roomNum}-${b}`,
          bedNumber: b,
          bedIdentifier: String(b),
          roomId: `room-${roomNum}`,
          status: 'available',
        });
      }

      rooms.push({
        id: `room-${roomNum}`,
        roomNumber: roomNum,
        floor,
        type,
        capacity,
        priceMonthly,
        beds,
      });
    }
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
  const rooms = generateInitialRooms();
  const students: Student[] = [];
  const contracts: Contract[] = [];
  const payments: Payment[] = [];

  let studentCounter = 1;

  // Let's populate approximately 215 beds across rooms
  rooms.forEach((room) => {
    // Fill ~60% to 75% of beds per room
    const fillCount = Math.floor(room.capacity * 0.65);
    for (let b = 0; b < fillCount; b++) {
      const bed = room.beds[b];
      const firstName = FIRST_NAMES[studentCounter % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(studentCounter * 3) % LAST_NAMES.length];
      const fullName = `${lastName} ${firstName}`;
      const studentId = `std-${1000 + studentCounter}`;
      const passportNo = `FA${6000000 + studentCounter}`;
      const uni = UNIVERSITIES[studentCounter % UNIVERSITIES.length];
      const course = (studentCounter % 4) + 1;
      const group = `${course}0${(studentCounter % 3) + 1}-guruh`;

      // Payment status variations
      let paidUntil = '2026-11-15';
      let nextDue = '2026-11-15';
      let debt = 0;

      if (studentCounter % 7 === 0) {
        // Overdue student
        paidUntil = '2026-09-30';
        nextDue = '2026-10-01';
        debt = room.priceMonthly;
      } else if (studentCounter % 11 === 0) {
        // Approaching: Due today (2026-10-30)
        paidUntil = '2026-10-30';
        nextDue = '2026-10-30';
      } else if (studentCounter % 5 === 0) {
        // Approaching: Due tomorrow (2026-10-31)
        paidUntil = '2026-10-31';
        nextDue = '2026-10-31';
      } else if (studentCounter % 4 === 0) {
        // Approaching: Due in 2 days (2026-11-01)
        paidUntil = '2026-10-31';
        nextDue = '2026-11-01';
      } else if (studentCounter % 3 === 0) {
        // Approaching: Due in 3 days (2026-11-02)
        paidUntil = '2026-11-01';
        nextDue = '2026-11-02';
      }

      bed.status = 'occupied';
      bed.studentId = studentId;
      bed.studentName = fullName;
      bed.assignedAt = '2026-09-01';

      const student: Student = {
        id: studentId,
        fullName,
        phone: `+998 97 ${100 + (studentCounter % 899)} ${10 + (studentCounter % 89)} ${10 + (studentCounter % 89)}`,
        birthDate: '2004-05-14',
        passportNumber: passportNo,
        passportFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=60',
        passportBackUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=60',
        university: uni,
        faculty: 'Kompyuter Injiniringi',
        course,
        group,
        parentPhone: `+998 90 ${200 + (studentCounter % 700)} ${10 + (studentCounter % 89)} ${10 + (studentCounter % 89)}`,
        permanentAddress: REGIONS[studentCounter % REGIONS.length],
        status: 'active',
        roomId: room.id,
        bedId: bed.id,
        roomNumber: room.roomNumber,
        bedNumber: bed.bedNumber,
        floor: room.floor,
        roomType: room.type,
        monthlyTariff: room.priceMonthly,
        paidUntil,
        nextPaymentDueDate: nextDue,
        debtAmount: debt,
        createdAt: '2026-08-25',
        telegramChatId: `tg_${7000000 + studentCounter}`,
        emergencyContactName: `${lastName} Botirovi`,
        emergencyContactRelation: 'Ota/Ona',
        rfidCardNumber: `RC${String(1000 + studentCounter).slice(-4)}`,
        faceEnrolled: studentCounter % 2 === 0,
        accessStatus: 'active',
      };

      students.push(student);

      // Distribute realistic upcoming contract renewal dates
      let contractEndDate = '2027-06-30';
      if (studentCounter === 3) contractEndDate = '2026-11-04'; // Expiring in 5 days
      if (studentCounter === 7) contractEndDate = '2026-11-09'; // Expiring in 10 days
      if (studentCounter === 11) contractEndDate = '2026-11-15'; // Expiring in 16 days
      if (studentCounter === 14) contractEndDate = '2026-10-31'; // Expiring tomorrow

      // Create contract
      contracts.push({
        id: `cnt-${202600 + studentCounter}`,
        contractNumber: `RC-2026/${room.roomNumber}-${bed.bedNumber}`,
        studentId: student.id,
        studentName: student.fullName,
        passportNumber: passportNo,
        roomNumber: room.roomNumber,
        bedNumber: bed.bedNumber,
        roomType: room.type,
        tariffMonthly: room.priceMonthly,
        startDate: '2026-09-01',
        endDate: contractEndDate,
        status: 'active',
        createdAt: '2026-08-26',
        pdfGeneratedAt: '2026-08-26 10:00',
      });

      // Create payment history
      payments.push({
        id: `pay-${5000 + studentCounter}`,
        studentId: student.id,
        studentName: student.fullName,
        roomNumber: room.roomNumber,
        amount: room.priceMonthly,
        paymentDate: '2026-09-02',
        periodMonth: '2026-09',
        paymentMethod: studentCounter % 2 === 0 ? 'card' : 'cash',
        recordedBy: 'Dilshod Tursunov (Receptionist)',
        status: 'completed',
        notes: 'Sentyabr oyi to\'lovi to\'liq amalga oshirildi',
      });

      // For students without overdue debt, record October payment across recent days
      if (debt === 0) {
        const day = ((studentCounter * 3) % 27) + 1; // 1 to 27 October
        const dayStr = String(day).padStart(2, '0');
        payments.push({
          id: `pay-${8000 + studentCounter}`,
          studentId: student.id,
          studentName: student.fullName,
          roomNumber: room.roomNumber,
          amount: room.priceMonthly,
          paymentDate: `2026-10-${dayStr}`,
          periodMonth: '2026-10',
          paymentMethod: studentCounter % 3 === 0 ? 'card' : studentCounter % 3 === 1 ? 'bank_transfer' : 'cash',
          recordedBy: 'Shaxnoza Raximova (Manager)',
          status: 'completed',
          notes: 'Oktabr oyi to\'lovi qabul qilindi',
        });
      }

      studentCounter++;
    }
  });

  // Seed Students awaiting bed assignment
  const unassignedSeedStudents: Student[] = [
    {
      id: 'std-2001',
      fullName: 'Muhriddin Olimov',
      phone: '+998 90 888 11 22',
      birthDate: '2005-03-12',
      passportNumber: 'FA8912345',
      university: 'TATU (Muhammad al-Xorazmiy)',
      faculty: 'Dasturiy Injiniring',
      course: 1,
      group: '101-DI',
      parentPhone: '+998 91 555 33 44',
      permanentAddress: 'Buxoro viloyati, Kogon t.',
      status: 'active',
      monthlyTariff: 1200000,
      paidUntil: '2026-10-31',
      nextPaymentDueDate: '2026-11-01',
      debtAmount: 0,
      createdAt: '2026-10-06',
      telegramChatId: 'tg_8912345',
      emergencyContactName: 'Olimov Baxtiyor',
      emergencyContactRelation: 'Ota',
    },
    {
      id: 'std-2002',
      fullName: 'Shahlo Qosimova',
      phone: '+998 93 777 22 33',
      birthDate: '2004-11-08',
      passportNumber: 'FA9928371',
      university: 'O\'zMU (O\'zbekiston Milliy Universiteti)',
      faculty: 'Biologiya va Biotexnologiya',
      course: 2,
      group: '204-BIO',
      parentPhone: '+998 90 222 11 00',
      permanentAddress: 'Samarqand viloyati, Urgut t.',
      status: 'active',
      roomType: 'comfort_plus',
      monthlyTariff: 1400000,
      paidUntil: '2026-10-31',
      nextPaymentDueDate: '2026-11-01',
      debtAmount: 0,
      createdAt: '2026-10-05',
      telegramChatId: 'tg_9928371',
      emergencyContactName: 'Qosimov Shuhrat',
      emergencyContactRelation: 'Ota',
    },
    {
      id: 'std-2003',
      fullName: 'Anvarbek Zokirov',
      phone: '+998 91 345 67 89',
      birthDate: '2005-01-18',
      passportNumber: 'FA7182934',
      university: 'TDTU (Islam Karimov nomidagi TDTU)',
      faculty: 'Mashinasozlik va Mexatronika',
      course: 1,
      group: '105-MM',
      parentPhone: '+998 93 456 78 91',
      permanentAddress: 'Farg‘ona viloyati, Marg‘ilon sh.',
      status: 'active',
      monthlyTariff: 1000000,
      paidUntil: '2026-10-31',
      nextPaymentDueDate: '2026-11-01',
      debtAmount: 0,
      createdAt: '2026-10-07',
      telegramChatId: 'tg_7182934',
      emergencyContactName: 'Zokirova Mastura',
      emergencyContactRelation: 'Ona',
    },
    {
      id: 'std-2004',
      fullName: 'Nilufar Karimova',
      phone: '+998 94 456 78 90',
      birthDate: '2003-09-22',
      passportNumber: 'FA6253412',
      university: 'TSHYU (Toshkent Davlat Yuridik U.)',
      faculty: 'Xalqaro Huquq va Qiyosiy Qonunchilik',
      course: 3,
      group: '302-XH',
      parentPhone: '+998 97 123 45 67',
      permanentAddress: 'Namangan viloyati, Chust t.',
      status: 'active',
      monthlyTariff: 1400000,
      paidUntil: '2026-10-31',
      nextPaymentDueDate: '2026-11-01',
      debtAmount: 0,
      createdAt: '2026-10-08',
      telegramChatId: 'tg_6253412',
      emergencyContactName: 'Karimov Rustam',
      emergencyContactRelation: 'Ota',
    },
    {
      id: 'std-2005',
      fullName: 'Dostonbek Yusupov',
      phone: '+998 99 123 99 88',
      birthDate: '2004-07-30',
      passportNumber: 'FA5544332',
      university: 'WIUT (Westminster International University)',
      faculty: 'Moliya va Xalqaro Biznes',
      course: 2,
      group: '201-EC',
      parentPhone: '+998 90 998 87 76',
      permanentAddress: 'Xorazm viloyati, Urganch sh.',
      status: 'active',
      monthlyTariff: 1200000,
      paidUntil: '2026-10-31',
      nextPaymentDueDate: '2026-11-01',
      debtAmount: 0,
      createdAt: '2026-10-09',
      telegramChatId: 'tg_5544332',
      emergencyContactName: 'Yusupova Saodat',
      emergencyContactRelation: 'Ona',
    },
  ];
  students.push(...unassignedSeedStudents);

  // Seed Applications (includes APP-1001 & APP-1002 for instant Landing Page tracker demo)
  const applications: Application[] = [
    {
      id: 'APP-1001',
      fullName: 'Muhriddin Olimov',
      phone: '+998 90 888 11 22',
      birthDate: '2005-03-12',
      passportNumber: 'FA8912345',
      university: 'TATU',
      faculty: 'Dasturiy Injiniring',
      course: 1,
      group: '101-DI',
      parentPhone: '+998 91 555 33 44',
      permanentAddress: 'Buxoro v., Kogon t.',
      status: 'approved',
      submittedAt: '2026-10-06 15:30',
      assignedRoomNumber: '303',
      assignedBedNumber: 2,
      preferredRoomType: 'comfort_plus',
    },
    {
      id: 'APP-1002',
      fullName: 'Shahlo Qosimova',
      phone: '+998 93 777 22 33',
      birthDate: '2004-11-08',
      passportNumber: 'FA9928371',
      university: 'O\'zMU',
      faculty: 'Biologiya',
      course: 2,
      group: '204-BIO',
      parentPhone: '+998 90 222 11 00',
      permanentAddress: 'Samarqand v., Urgut t.',
      status: 'under_review',
      submittedAt: '2026-10-05 11:20',
      reviewNotes: 'Hujjatlar to\'liq, bo\'sh o\'rin ajratilishi kutilmoqda',
      preferredRoomType: 'lux',
    },
    {
      id: 'app-103',
      fullName: 'Shohruh Nazarov',
      phone: '+998 94 333 44 55',
      birthDate: '2003-08-25',
      passportNumber: 'FA1122334',
      university: 'TDTU',
      faculty: 'Energetika',
      course: 3,
      group: '302-ENG',
      parentPhone: '+998 95 666 77 88',
      permanentAddress: 'Andijon v., Xo\'jaobod t.',
      status: 'new',
      submittedAt: '2026-10-02 09:15',
      preferredRoomType: 'standard',
    },
  ];

  // Seed Issues
  const issues: Issue[] = [
    {
      id: 'iss-1',
      category: 'plumbing',
      location: '2-qavat, 204-xona',
      roomNumber: '204',
      description: 'Rakoinadan suv oqishi kuzatilyapti, kran almashtirish kerak',
      priority: 'high',
      reportedBy: 'Sardor Karimov',
      reporterRole: 'student',
      reporterPhone: '+998 97 123 45 67',
      status: 'open',
      createdAt: '2026-10-07 09:30',
    },
    {
      id: 'iss-2',
      category: 'wifi',
      location: '4-qavat koridor',
      description: '4-qavatdagi Wi-Fi router tez-tez o\'chib qolyapti',
      priority: 'medium',
      reportedBy: 'Dilshod Tursunov',
      reporterRole: 'receptionist',
      assignedTo: 'emp-2',
      assignedEmployeeName: 'Shaxnoza Raximova',
      status: 'in_progress',
      createdAt: '2026-10-06 14:10',
    },
    {
      id: 'iss-3',
      category: 'cleaning',
      location: '3-qavat 308-xona',
      roomNumber: '308',
      description: 'Xonani umumiy dezinfeksiya qilish va gilam tozalash rejalashtirildi',
      priority: 'low',
      reportedBy: 'Gulnora Alimova',
      reporterRole: 'cleaner',
      status: 'resolved',
      createdAt: '2026-10-04 10:00',
      resolvedAt: '2026-10-05 11:30',
    },
    {
      id: 'iss-4',
      category: 'electricity',
      location: '3-qavat 302-xona',
      roomNumber: '302',
      description: 'Rozetkadan tutun va uchqun chiqmoqda, zudlik bilan usta kerak',
      priority: 'critical',
      reportedBy: 'Nodir Zokirov',
      reporterRole: 'student',
      reporterPhone: '+998 90 333 22 11',
      status: 'open',
      createdAt: '2026-10-30 08:15',
    },
    {
      id: 'iss-5',
      category: 'furniture',
      location: '2-qavat 205-xona',
      roomNumber: '205',
      description: 'Shkaf eshigi ilgagi singan va o‘quv stoli oyog‘i qimirlamoqda',
      priority: 'medium',
      reportedBy: 'Gulnora Alimova',
      reporterRole: 'cleaner',
      status: 'open',
      createdAt: '2026-10-29 16:45',
    },
  ];

  // Seed Discipline Records
  const disciplineRecords: DisciplineRecord[] = [
    {
      id: 'disc-1',
      studentId: students[0]?.id || 'std-1001',
      studentName: students[0]?.fullName || 'Karimov Jasur',
      roomNumber: students[0]?.roomNumber || '201',
      violationReason: 'Soat 23:00 dan keyin yotoqxonaga kechikib kelish',
      penaltyPoints: 10,
      recordedBy: 'Jahongir Xoliqov (Security)',
      date: '2026-09-28',
    },
    {
      id: 'disc-2',
      studentId: students[5]?.id || 'std-1006',
      studentName: students[5]?.fullName || 'Boboyev Shahzod',
      roomNumber: students[5]?.roomNumber || '202',
      violationReason: 'Xonada elektr isitgichdan ruxsatsiz foydalanish',
      penaltyPoints: 20,
      recordedBy: 'Shaxnoza Raximova (Manager)',
      date: '2026-10-02',
    },
  ];

  // Seed Notifications
  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      type: 'application',
      title: 'Yangi online ariza',
      message: 'Muhriddin Olimov yotoqxonaga ariza topshirdi',
      date: '2026-10-06 15:30',
      isRead: false,
      recipientRole: 'receptionist',
    },
    {
      id: 'notif-2',
      type: 'issue',
      title: 'Yangi muammo kelib tushdi',
      message: '204-xonada santehnika nosozligi xabar qilindi',
      date: '2026-10-07 09:30',
      isRead: false,
      recipientRole: 'cleaner',
    },
    {
      id: 'notif-3',
      type: 'payment',
      title: 'To\'lov eslatmasi',
      message: 'Oktabr oyi uchun 12 ta talabada qarzdorlik mavjud',
      date: '2026-10-07 08:00',
      isRead: true,
      recipientRole: 'manager',
    },
  ];

  // Seed Audit Logs
  const auditLogs: AuditLogEntry[] = [
    {
      id: 'aud-1',
      userName: 'Alisher Qodirov',
      role: 'owner',
      action: 'Tizimga kirdi',
      objectType: 'Auth',
      objectId: 'emp-1',
      timestamp: '2026-10-07 14:30',
    },
    {
      id: 'aud-2',
      userName: 'Dilshod Tursunov',
      role: 'receptionist',
      action: 'O\'ringa joylashtirdi',
      objectType: 'Bed',
      objectId: 'bed-201-1',
      oldValue: 'AVAILABLE',
      newValue: 'OCCUPIED (Karimov Jasur)',
      timestamp: '2026-10-06 10:15',
    },
    {
      id: 'aud-3',
      userName: 'Shaxnoza Raximova',
      role: 'manager',
      action: 'To\'lov kiritdi',
      objectType: 'Payment',
      objectId: 'pay-5001',
      newValue: '800,000 UZS (Card)',
      timestamp: '2026-10-05 16:20',
    },
  ];

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
  };
}
