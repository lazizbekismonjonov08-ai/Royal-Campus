import React, { useState, useRef } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { resolveAssetPath } from '../utils/assetPath';
import { normalizePhoneKey } from '../utils/authCrypto';
import {
  Wifi,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Phone,
  MapPin,
  Utensils,
  Laptop,
  WashingMachine,
  CigaretteOff,
  PawPrint,
  Users,
  User,
  Check,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  Building2,
  GraduationCap,
  Sun,
  Moon,
  Send,
  LogIn,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Application, RoomType } from '../types';
import { Language } from '../i18n/types';


// Structured Language Dictionary for all Landing Page components
export interface LandingTranslations {
  nav: {
    brandSubtitle: string;
    rooms: string;
    amenities: string;
    tracker: string;
    contact: string;
    login: string;
    loginShort: string;
    apply: string;
    applyShort: string;
    languageLabel: string;
  };
  location: string;
  locationUrl: string;
  headlinePrefix: string;
  headlineHighlight: string;
  headlineSuffix: string;
  exploreRoomsBtn: string;
  transportText: string;
  phoneText: string;
  utilityBar: {
    callLabel: string;
    telegramLabel: string;
    telegramHandle: string;
    telegramUrl: string;
    receptionLabel: string;
    receptionValue: string;
  };
  carouselControls: {
    categoryLabel: string;
    title: string;
    prevLabel: string;
    nextLabel: string;
  };
  statusSearch: {
    title: string;
    desc: string;
    placeholder: string;
    btn: string;
    coursePrefix: string;
    courseSuffix: string;
    notFoundQuery: string;
    notFoundDesc: string;
    newApplicationBtn: string;
    activateCabinetBtn: string;
    assignedBedPrefix: string;
    statuses: {
      approved: string;
      under_review: string;
      new: string;
      correction_requested: string;
      rejected: string;
    };
    guidance: {
      approvedTitle: string;
      approvedRoomPrefix: string;
      approvedRoomSuffix: string;
      underReviewTitle: string;
      underReviewDesc: string;
      newTitle: string;
      newDatePrefix: string;
      correctionTitle: string;
      correctionFallback: string;
      rejectedTitle: string;
      rejectedFallback: string;
    };
  };
  roomsSection: {
    categoryLabel: string;
    title: string;
    monthSuffix: string;
    monthSuffixLower: string;
    subPriceInfo: string;
    popularBadge: string;
    viewDetails: string;
    closeDetails: string;
    monthlyRateLabel: string;
    currencyLabel: string;
    capacities: Record<RoomType, string>;
    buttonTexts: Record<RoomType, string>;
    features: string[];
  };
  amenitiesSection: {
    categoryLabel: string;
    items: Array<{
      title: string;
    }>;
  };
  locationSection: {
    categoryLabel: string;
    addressTitle: string;
    addressDesc: string;
    transportTitle: string;
    transportDesc: string;
    universitiesTitle: string;
    universities: string[];
    openMapsBtn: string;
    mapOverlayTitle: string;
    mapOverlaySubtitle: string;
  };
  finalCtaSection: {
    categoryLabel: string;
    title: string;
    desc: string;
    primaryBtn: string;
    secondaryBtn: string;
  };
  footerSection: {
    brandDesc: string;
    copyright: string;
    quickLinksTitle: string;
    links: {
      rooms: string;
      amenities: string;
      location: string;
      tracker: string;
    };
    contactTitle: string;
    phoneDisplay: string;
    phoneHref: string;
    telegramHandle: string;
    telegramUrl: string;
    address: string;
    receptionHours: string;
  };
}

export type HeroTranslations = LandingTranslations;

export const HERO_CONTENT: Record<'UZ' | 'RU' | 'EN', LandingTranslations> = {
  UZ: {
    nav: {
      brandSubtitle: 'Talabalar rezidensiyasi',
      rooms: 'Xonalar va narxlar',
      amenities: 'Qulayliklar',
      tracker: 'Ariza holati',
      contact: 'Aloqa uchun',
      login: 'Kabinetga kirish',
      loginShort: 'Kabinet',
      apply: 'Ariza topshirish',
      applyShort: 'Ariza',
      languageLabel: 'Til:',
    },
    location: "Olmazor tumani, Umid 1-tor ko‘chasi, 22/4-uy (TTPU ro‘parasi)",
    locationUrl: 'https://maps.app.goo.gl/2UHJLtbhpgT9tqwn9',
    headlinePrefix: '',
    headlineHighlight: 'Royal Campus’ga',
    headlineSuffix: 'xush kelibsiz',
    exploreRoomsBtn: 'Xonalarni ko‘rish',
    transportText: 'Bizning yotoqxonamiz Toshkent shahridagi Turin Politexnika Universiteti va Olmazor tuman hokimligi ro‘parasida joylashgan. Metro bekatigacha 10 daqiqalik piyoda yo‘l, avtobus bekatlari esa shundoqqina bino ro‘parasida — shaharning istalgan nuqtasiga osongina yetib borish mumkin.',
    phoneText: '+998 (70) 522-20-50',
    utilityBar: {
      callLabel: 'Aloqa:',
      telegramLabel: 'Telegram:',
      telegramHandle: '@campus707',
      telegramUrl: 'https://t.me/campus707',
      receptionLabel: 'Qabul vaqti:',
      receptionValue: '09:00 → 20:00',
    },
    carouselControls: {
      categoryLabel: 'REZIDENSIYA ATMOSFERASI · ROYAL CAMPUS',
      title: 'Bino va interyer bo‘ylab sayohat',
      prevLabel: 'Oldingi',
      nextLabel: 'Keyingi',
    },
    statusSearch: {
      title: 'Ariza holatini tekshirish',
      desc: 'Ariza ID, pasport yoki telefon raqamingiz orqali joriy holatni ko‘ring.',
      placeholder: 'Ariza ID (RC-2026-...), pasport yoki telefon',
      btn: 'Holatni ko‘rish →',
      coursePrefix: '',
      courseSuffix: '-kurs',
      notFoundQuery: 'bo‘yicha ariza topilmadi',
      notFoundDesc: 'Iltimos, kiritilgan ID, pasport yoki telefon raqamini tekshirib qayta urinib ko‘ring yoki yangi ariza yuboring.',
      newApplicationBtn: 'Yangi ariza topshirish',
      activateCabinetBtn: 'Rezident kabinetini faollashtirish / kirish',
      assignedBedPrefix: 'o‘rin:',
      statuses: {
        approved: 'Tasdiqlangan',
        under_review: 'Ko‘rib chiqilmoqda',
        new: 'Kutilmoqda (Navbatda)',
        correction_requested: 'Qo‘shimcha ma’lumot so‘ralgan',
        rejected: 'Rad etilgan',
      },
      guidance: {
        approvedTitle: 'Tabriklaymiz! Arizangiz ma’muriyat tomonidan tasdiqlandi.',
        approvedRoomPrefix: 'Sizga',
        approvedRoomSuffix: 'Xona ajratildi. Shartnoma va to‘lov jadvalini ko‘rish uchun Rezident kabinetiga kiring.',
        underReviewTitle: 'Hujjatlaringiz ayni vaqtda komissiya tomonidan o‘rganilmoqda.',
        underReviewDesc: 'Ko‘rib chiqish muddati: 24–48 soat. Natija haqida SMS yoki Telegram orqali xabar beriladi.',
        newTitle: 'Arizangiz muvaffaqiyatli qabul qilindi va ko‘rib chiqilishini kutmoqda.',
        newDatePrefix: 'Topshirilgan sana:',
        correctionTitle: 'Hujjatlaringizda aniqlashtirish talab etiladi:',
        correctionFallback: 'Iltimos, pasport nusxasi yoki o‘qish ma’lumotnomangizni yangilang.',
        rejectedTitle: 'Afsuski, arizangiz ma’qullanmadi:',
        rejectedFallback: 'Bo‘sh joylar to‘lganligi yoki talablar mos kelmaganligi sababli.',
      },
    },
    roomsSection: {
      categoryLabel: 'XONALAR VA NARXLAR',
      title: 'Xonalarimiz',
      monthSuffix: '/ OYIGA',
      monthSuffixLower: '/ oyiga',
      subPriceInfo: 'Kommunal to‘lovlar va Wi-Fi narx ichida',
      popularBadge: 'ENG OMMABOP TANLOV ★',
      viewDetails: 'Batafsil',
      closeDetails: 'Yopish',
      monthlyRateLabel: 'Oylik tarif',
      currencyLabel: 'UZS',
      capacities: {
        standard: '8 o‘rinli',
        comfort: '6 o‘rinli',
        lux: '4 o‘rinli',
        standard_plus: '8 o‘rinli',
        comfort_plus: '6 o‘rinli',
      },
      buttonTexts: {
        standard: 'Standard uchun ariza topshirish',
        comfort: 'Comfort uchun ariza topshirish',
        lux: 'Lux uchun ariza topshirish',
        standard_plus: 'Standard plus uchun ariza topshirish',
        comfort_plus: 'Comfort plus uchun ariza topshirish',
      },
      features: [
        'Shaxsiy shkaf va o‘quv stoli',
        'Alohida dush va sanuzel',
        'Yuqori tezlikdagi Wi-Fi',
      ],
    },
    amenitiesSection: {
      categoryLabel: 'QULAYLIKLARIMIZ',
      items: [
        { title: 'Tekin Wi-Fi' },
        { title: '24/7 xavfsizlik va Face ID' },
        { title: 'Kutubxona va mutolaa zali' },
        { title: 'Kovorking hududi' },
        { title: 'Zamonaviy oshxona' },
        { title: 'Kir yuvish xonasi' },
        { title: 'Chekish taqiqlangan' },
        { title: 'Uy hayvonlari mumkin emas' },
      ],
    },
    locationSection: {
      categoryLabel: 'JOYLASHUV VA TRANSPORT',
      addressTitle: 'Aniq manzil',
      addressDesc: 'Olmazor tumani, Umid 1-tor ko‘chasi, 22/4-uy (TTPU ro‘parasi)',
      transportTitle: 'Transport va Metro',
      transportDesc: 'Metro bekatigacha 10 daqiqalik yo‘l, avtobus bekatlari bevosita bino ro‘parasida',
      universitiesTitle: 'Yaqin atrofdagi universitetlar',
      universities: [
        'Turin politexnika universiteti',
        'Sarbon universiteti',
        'O‘zbekiston Milliy universiteti (O‘zMU)',
        'Toshkent davlat texnika universiteti (ToshDTU)',
        'Toshkent Metropolitan universiteti (TMU)',
      ],
      openMapsBtn: 'Google Xaritalarda ochish',
      mapOverlayTitle: 'Royal Campus Residence',
      mapOverlaySubtitle: 'Olmazor tumani · Umid 1-tor ko‘chasi, 22/4',
    },
    finalCtaSection: {
      categoryLabel: 'JOYLAR CHEGARALANGAN',
      title: 'O‘zingizga mos xonani bugunoq band qiling',
      desc: 'Onlayn ariza topshirish bor-yo‘g‘i 3 daqiqa vaqt oladi. Arizangiz yuborilganidan so‘ng ma’muriyat 24–48 soat ichida javob beradi.',
      primaryBtn: 'Onlayn ariza topshirish',
      secondaryBtn: 'Ariza holatini tekshirish',
    },
    footerSection: {
      brandDesc: 'Royal Campus — Toshkent shahridagi talabalar turar joyi. Xavfsiz, tartibli va o‘qishga qulay muhit.',
      copyright: '© 2026 Royal Campus. Barcha huquqlar himoyalangan.',
      quickLinksTitle: 'Tezkor havolalar',
      links: {
        rooms: 'Xonalar va narxlar',
        amenities: 'Qulayliklar',
        location: 'Joylashuv',
        tracker: 'Ariza holati',
      },
      contactTitle: 'Bog‘lanish',
      phoneDisplay: '+998 (70) 522-20-50',
      phoneHref: 'tel:+998705222050',
      telegramHandle: '@campus707',
      telegramUrl: 'https://t.me/campus707',
      address: 'Olmazor tumani, Umid 1-tor ko‘chasi, 22/4-uy',
      receptionHours: 'Qabul vaqti: 09:00 → 20:00',
    },
  },
  RU: {
    nav: {
      brandSubtitle: 'Студенческая резиденция',
      rooms: 'Номера и цены',
      amenities: 'Удобства',
      tracker: 'Статус заявки',
      contact: 'Контакты',
      login: 'Войти в кабинет',
      loginShort: 'Кабинет',
      apply: 'Подать заявку',
      applyShort: 'Заявка',
      languageLabel: 'Язык:',
    },
    location: "Алмазарский р-н, 1-й проезд Умид, 22/4 (напротив ТТПУ)",
    locationUrl: 'https://maps.app.goo.gl/2UHJLtbhpgT9tqwn9',
    headlinePrefix: 'Добро пожаловать в',
    headlineHighlight: 'Royal Campus',
    headlineSuffix: '',
    exploreRoomsBtn: 'Смотреть комнаты',
    transportText: 'Наше общежитие расположено в Ташкенте прямо напротив Туринского политехнического университета и хокимията Алмазарского района. До станции метро — 10 минут пешком, а автобусные остановки находятся непосредственно перед зданием, поэтому легко добраться в любую точку города.',
    phoneText: '+998 (70) 522-20-50',
    utilityBar: {
      callLabel: 'Связь:',
      telegramLabel: 'Telegram:',
      telegramHandle: '@campus707',
      telegramUrl: 'https://t.me/campus707',
      receptionLabel: 'Приём:',
      receptionValue: '09:00 → 20:00',
    },
    carouselControls: {
      categoryLabel: 'АТМОСФЕРА РЕЗИДЕНЦИИ · ROYAL CAMPUS',
      title: 'Обзор здания и интерьеров',
      prevLabel: 'Назад',
      nextLabel: 'Вперёд',
    },
    statusSearch: {
      title: 'Проверка статуса заявки',
      desc: 'Узнайте текущий статус по ID заявки, номеру паспорта или телефону.',
      placeholder: 'ID заявки (RC-2026-...), паспорт или телефон',
      btn: 'Проверить статус →',
      coursePrefix: '',
      courseSuffix: '-курс',
      notFoundQuery: '— заявка не найдена',
      notFoundDesc: 'Пожалуйста, проверьте введённый ID, паспорт или номер телефона и попробуйте снова, либо подайте новую заявку.',
      newApplicationBtn: 'Подать новую заявку',
      activateCabinetBtn: 'Войти / активировать личный кабинет',
      assignedBedPrefix: 'место:',
      statuses: {
        approved: 'Одобрено',
        under_review: 'На рассмотрении',
        new: 'В ожидании (В очереди)',
        correction_requested: 'Требуется уточнение',
        rejected: 'Отклонено',
      },
      guidance: {
        approvedTitle: 'Поздравляем! Ваша заявка одобрена администрацией.',
        approvedRoomPrefix: 'Вам выделена комната',
        approvedRoomSuffix: 'Комната выделена. Войдите в личный кабинет, чтобы просмотреть договор и график платежей.',
        underReviewTitle: 'Ваши документы в настоящее время рассматриваются комиссией.',
        underReviewDesc: 'Срок рассмотрения: 24–48 часов. Уведомление поступит по SMS или Telegram.',
        newTitle: 'Заявка успешно зарегистрирована и ожидает рассмотрения.',
        newDatePrefix: 'Дата подачи:',
        correctionTitle: 'В поданных документах требуются исправления:',
        correctionFallback: 'Пожалуйста, обновите копию паспорта или справку с места учебы.',
        rejectedTitle: 'К сожалению, заявка не была одобрена:',
        rejectedFallback: 'В связи с отсутствием свободных мест или несоответствием критериям.',
      },
    },
    roomsSection: {
      categoryLabel: 'НОМЕРА И ТАРИФЫ',
      title: 'Наши комнаты',
      monthSuffix: '/ МЕСЯЦ',
      monthSuffixLower: '/ в месяц',
      subPriceInfo: 'Коммунальные услуги и Wi-Fi включены',
      popularBadge: 'САМЫЙ ПОПУЛЯРНЫЙ ВЫБОР ★',
      viewDetails: 'Подробнее',
      closeDetails: 'Закрыть',
      monthlyRateLabel: 'Ежемесячный тариф',
      currencyLabel: 'сум',
      capacities: {
        standard: '8-местный',
        comfort: '6-местный',
        lux: '4-местный',
        standard_plus: '8-местный',
        comfort_plus: '6-местный',
      },
      buttonTexts: {
        standard: 'Подать заявку на Standard',
        comfort: 'Подать заявку на Comfort',
        lux: 'Подать заявку на Lux',
        standard_plus: 'Подать заявку на Standard plus',
        comfort_plus: 'Подать заявку на Comfort plus',
      },
      features: [
        'Индивидуальный шкаф и учебный стол',
        'Отдельный душ и санузел',
        'Высокоскоростной Wi-Fi',
      ],
    },
    amenitiesSection: {
      categoryLabel: 'НАШИ УДОБСТВА',
      items: [
        { title: 'Бесплатный Wi-Fi' },
        { title: 'Охрана 24/7 и Face ID' },
        { title: 'Библиотека и читальный зал' },
        { title: 'Коворкинг-зона' },
        { title: 'Современная кухня' },
        { title: 'Прачечная' },
        { title: 'Курение запрещено' },
        { title: 'Без домашних животных' },
      ],
    },
    locationSection: {
      categoryLabel: 'РАСПОЛОЖЕНИЕ И ТРАНСПОРТ',
      addressTitle: 'Точный адрес',
      addressDesc: 'Алмазарский р-н, 1-й проезд Умид, 22/4 (напротив ТТПУ)',
      transportTitle: 'Транспорт и метро',
      transportDesc: '10 минут пешком до метро, автобусные остановки прямо перед зданием',
      universitiesTitle: 'Университеты поблизости',
      universities: [
        'Туринский политехнический университет',
        'Университет Сарбон',
        'Национальный университет Узбекистана (НУУз)',
        'Ташкентский государственный технический университет (ТГТУ)',
        'Ташкентский университет Метрополитен (TMU)',
      ],
      openMapsBtn: 'Открыть в Google Картах',
      mapOverlayTitle: 'Royal Campus Residence',
      mapOverlaySubtitle: 'Алмазарский р-н · 1-й проезд Умид, 22/4',
    },
    finalCtaSection: {
      categoryLabel: 'КОЛИЧЕСТВО МЕСТ ОГРАНИЧЕНО',
      title: 'Забронируйте подходящую комнату уже сегодня',
      desc: 'Заполнение онлайн-заявки займет всего 3 минуты. Администрация рассмотрит ваши документы в течение 24–48 часов.',
      primaryBtn: 'Подать онлайн-заявку',
      secondaryBtn: 'Проверить статус заявки',
    },
    footerSection: {
      brandDesc: 'Royal Campus — студенческая резиденция в Ташкенте. Безопасная, организованная и удобная среда для учёбы.',
      copyright: '© 2026 Royal Campus. Все права защищены.',
      quickLinksTitle: 'Быстрые ссылки',
      links: {
        rooms: 'Комнаты и тарифы',
        amenities: 'Удобства',
        location: 'Расположение',
        tracker: 'Статус заявки',
      },
      contactTitle: 'Контакты',
      phoneDisplay: '+998 (70) 522-20-50',
      phoneHref: 'tel:+998705222050',
      telegramHandle: '@campus707',
      telegramUrl: 'https://t.me/campus707',
      address: 'Алмазарский район, 1-й проезд Умид, дом 22/4',
      receptionHours: 'Приём: 09:00 → 20:00',
    },
  },
  EN: {
    nav: {
      brandSubtitle: 'Student Residence',
      rooms: 'Rooms & Pricing',
      amenities: 'Facilities',
      tracker: 'Application Status',
      contact: 'Contact',
      login: 'Resident Cabinet',
      loginShort: 'Login',
      apply: 'Apply Now',
      applyShort: 'Apply',
      languageLabel: 'Language:',
    },
    location: '22/4 Umid 1st Passage, Olmazor Dist. (Opposite TTPU)',
    locationUrl: 'https://maps.app.goo.gl/2UHJLtbhpgT9tqwn9',
    headlinePrefix: 'Welcome to',
    headlineHighlight: 'Royal Campus',
    headlineSuffix: '',
    exploreRoomsBtn: 'Explore Rooms',
    transportText: 'Our dormitory is located in Tashkent directly across from Turin Polytechnic University and the Olmazor District Hokimiyat. The nearest metro station is a 10-minute walk away, with bus stops right in front of the building for easy access to any part of the city.',
    phoneText: '+998 (70) 522-20-50',
    utilityBar: {
      callLabel: 'Call:',
      telegramLabel: 'Telegram:',
      telegramHandle: '@campus707',
      telegramUrl: 'https://t.me/campus707',
      receptionLabel: 'Reception:',
      receptionValue: '09:00 → 20:00',
    },
    carouselControls: {
      categoryLabel: 'RESIDENCE ATMOSPHERE · ROYAL CAMPUS',
      title: 'Explore the Residence & Interiors',
      prevLabel: 'Previous',
      nextLabel: 'Next',
    },
    statusSearch: {
      title: 'Check Application Status',
      desc: 'Track your current status using your Application ID, passport, or phone number.',
      placeholder: 'Application ID (RC-2026-...), passport, or phone',
      btn: 'Check Status →',
      coursePrefix: 'Year ',
      courseSuffix: '',
      notFoundQuery: '— application not found',
      notFoundDesc: 'Please check the entered ID, passport, or phone number and try again, or submit a new application.',
      newApplicationBtn: 'Submit New Application',
      activateCabinetBtn: 'Activate / Enter Resident Cabinet',
      assignedBedPrefix: 'bed:',
      statuses: {
        approved: 'Approved',
        under_review: 'Under Review',
        new: 'Pending (In Queue)',
        correction_requested: 'Action Required',
        rejected: 'Declined',
      },
      guidance: {
        approvedTitle: 'Congratulations! Your application has been approved by administration.',
        approvedRoomPrefix: 'You have been allocated room',
        approvedRoomSuffix: 'Room assigned. Open your Resident Cabinet to view your residency agreement and payment schedule.',
        underReviewTitle: 'Your documents are currently being evaluated by the admissions committee.',
        underReviewDesc: 'Processing timeframe: 24–48 hours. You will be notified via SMS or Telegram.',
        newTitle: 'Your application has been received and is pending review.',
        newDatePrefix: 'Submission date:',
        correctionTitle: 'Additional verification required:',
        correctionFallback: 'Please update your passport scan or official university enrollment certificate.',
        rejectedTitle: 'Unfortunately, your application was not approved:',
        rejectedFallback: 'Due to capacity constraints or non-compliance with admission requirements.',
      },
    },
    roomsSection: {
      categoryLabel: 'ROOMS & RATES',
      title: 'Our Rooms',
      monthSuffix: '/ MONTH',
      monthSuffixLower: '/ month',
      subPriceInfo: 'Utilities & Wi-Fi included',
      popularBadge: 'MOST POPULAR CHOICE ★',
      viewDetails: 'View details',
      closeDetails: 'Close',
      monthlyRateLabel: 'Monthly rate',
      currencyLabel: 'UZS',
      capacities: {
        standard: '8-bed',
        comfort: '6-bed',
        lux: '4-bed',
        standard_plus: '8-bed',
        comfort_plus: '6-bed',
      },
      buttonTexts: {
        standard: 'Apply for Standard',
        comfort: 'Apply for Comfort',
        lux: 'Apply for Lux',
        standard_plus: 'Apply for Standard plus',
        comfort_plus: 'Apply for Comfort plus',
      },
      features: [
        'Personal wardrobe & study desk',
        'Private en-suite bathroom & shower',
        'High-speed Wi-Fi included',
      ],
    },
    amenitiesSection: {
      categoryLabel: 'OUR AMENITIES',
      items: [
        { title: 'Free WiFi' },
        { title: '24/7 Security & Face ID' },
        { title: 'Library & Reading Room' },
        { title: 'Coworking Area' },
        { title: 'Modern Kitchen' },
        { title: 'Laundry Room' },
        { title: 'Non-smoking rooms' },
        { title: 'Pets not allowed' },
      ],
    },
    locationSection: {
      categoryLabel: 'LOCATION AND TRANSPORTATION',
      addressTitle: 'Exact Address',
      addressDesc: '22/4 Umid 1st Passage, Olmazor Dist. (Opposite TTPU)',
      transportTitle: 'Transit & Metro',
      transportDesc: '10-minute walk to metro station, direct bus stops right in front of the building',
      universitiesTitle: 'Nearby Universities',
      universities: [
        'Turin Polytechnic University',
        'Sarbon University',
        'National University of Uzbekistan (NUUz)',
        'Tashkent State Technical University (TSTU)',
        'Tashkent Metropolitan University (TMU)',
      ],
      openMapsBtn: 'Open in Google Maps',
      mapOverlayTitle: 'Royal Campus Residence',
      mapOverlaySubtitle: 'Olmazor District · 22/4 Umid 1st Passage',
    },
    finalCtaSection: {
      categoryLabel: 'LIMITED SPOTS AVAILABLE',
      title: 'Reserve Your Preferred Room Today',
      desc: 'Submitting your online application takes under 3 minutes. Our admissions team reviews applications within 24–48 hours.',
      primaryBtn: 'Submit Application',
      secondaryBtn: 'Check Application Status',
    },
    footerSection: {
      brandDesc: 'Royal Campus — a student residence in Tashkent. A safe, well-organized, and study-friendly environment.',
      copyright: '© 2026 Royal Campus. All rights reserved.',
      quickLinksTitle: 'Quick Links',
      links: {
        rooms: 'Rooms & Rates',
        amenities: 'Amenities',
        location: 'Location',
        tracker: 'Application Status',
      },
      contactTitle: 'Contact',
      phoneDisplay: '+998 (70) 522-20-50',
      phoneHref: 'tel:+998705222050',
      telegramHandle: '@campus707',
      telegramUrl: 'https://t.me/campus707',
      address: '22/4 Umid 1st Passage, Olmazor District',
      receptionHours: 'Reception: 09:00 → 20:00',
    },
  },
};

export interface LandingPageProps {
  onApplyNow: (preferredRoomType?: RoomType) => void;
  onLoginClick?: () => void;
  onGoToLogin?: () => void;
}

export const S00_LandingPage: React.FC<LandingPageProps> = ({
  onApplyNow,
  onLoginClick,
  onGoToLogin,
}) => {
  const { settings, applications, rooms } = useDorm();
  const { formatCurrency, language, setLanguage } = useI18n();

  // Functional currentLang state ('UZ' | 'RU' | 'EN')
  const [currentLang, setCurrentLang] = useState<'UZ' | 'RU' | 'EN'>(() => {
    const raw = language?.toUpperCase();
    return (raw === 'RU' || raw === 'EN') ? raw : 'UZ';
  });

  // Sync state whenever external language changes
  React.useEffect(() => {
    const raw = language?.toUpperCase();
    if (raw === 'UZ' || raw === 'RU' || raw === 'EN') {
      setCurrentLang(raw);
    }
  }, [language]);

  const changeLanguage = (newLang: 'UZ' | 'RU' | 'EN') => {
    setCurrentLang(newLang);
    setLanguage(newLang.toLowerCase() as Language);
  };

  const content = HERO_CONTENT[currentLang] || HERO_CONTENT.UZ;
  const t = content;

  // Support both onLoginClick and onGoToLogin
  const handleLogin = onLoginClick || onGoToLogin || (() => {});

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('royal-campus-landing-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const isLight = theme === 'light';

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('royal-campus-landing-theme', next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Landscape Horizontal Gallery photography showcase (6 curated photos)
  const galleryImages = [
    resolveAssetPath('assets/aistudio/photo_2026-11-19_19-13-49_c9cab8ec.jpg'),
    resolveAssetPath('assets/aistudio/photo_2026-11-20_15-27-24_1dd70b85.jpg'),
    resolveAssetPath('assets/aistudio/photo_2026-11-20_15-27-23__2__657810dd.jpg'),
    resolveAssetPath('assets/aistudio/photo_2026-11-20_15-27-23_f9dbedfe.jpg'),
    resolveAssetPath('assets/aistudio/photo_2026-11-19_19-13-50_dc375aa7.jpg'),
    resolveAssetPath('assets/aistudio/photo_2026-11-20_15-35-47_82e8d152.jpg'),
  ];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Preload and decode gallery images on mount for instantaneous, freeze-free transitions
  React.useEffect(() => {
    galleryImages.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {
          // Ignore decode errors for background preloading
        });
      }
    });
  }, []);

  const handleNext = () => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrev = () => {
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const prevImageIndex = (activeImageIndex - 1 + galleryImages.length) % galleryImages.length;
  const nextImageIndex = (activeImageIndex + 1) % galleryImages.length;

  const [detailRoomType, setDetailRoomType] = useState<RoomType | null>(null);
  const roomsCarouselRef = useRef<HTMLDivElement | null>(null);

  const scrollRoomsCarousel = (direction: 'prev' | 'next') => {
    roomsCarouselRef.current?.scrollBy({
      left: direction === 'next' ? 380 : -380,
      behavior: 'smooth',
    });
  };

  const tariffs = settings?.roomTariffs || {
    standard: 1000000,
    standard_plus: 1200000,
    comfort: 1200000,
    comfort_plus: 1400000,
    lux: 1400000,
  };

  const formatRoomPrice = (amount: number) => {
    const formattedNum =
      currentLang === 'EN'
        ? amount.toLocaleString('en-US')
        : amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formattedNum} ${t.roomsSection.currencyLabel}`;
  };

  // Mobile Touch-Swipe Gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
  };

  // Application tracker widget state
  const [trackerQuery, setTrackerQuery] = useState('');
  const [searchedApp, setSearchedApp] = useState<Application | null | 'not_found'>(null);
  const [trackerHasSearched, setTrackerHasSearched] = useState(false);

  // Handle application search (by Application ID RC-2026-XXXX, Passport, or Phone Number)
  const handleSearchApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackerQuery.trim().toUpperCase();
    if (!query) return;

    const queryPhoneKey = normalizePhoneKey(trackerQuery);
    setTrackerHasSearched(true);
    const found = applications.find(
      (app) =>
        app.id.toUpperCase() === query ||
        app.passportNumber.toUpperCase() === query ||
        (queryPhoneKey.length >= 7 && normalizePhoneKey(app.phone) === queryPhoneKey)
    );

    setSearchedApp(found || 'not_found');
  };

  // All 5 distinct room categories synced with settings.roomTariffs
  const roomCards: Array<{
    id: RoomType;
    title: string;
    image: string;
    featured: boolean;
    defaultRate: number;
  }> = [
    {
      id: 'standard',
      title: 'Standard',
      image: resolveAssetPath('images/room-standard.jpg'),
      featured: false,
      defaultRate: 1000000,
    },
    {
      id: 'standard_plus',
      title: 'Standard plus',
      image: resolveAssetPath('assets/aistudio/DSC00095_0f4ba2e0.JPG'),
      featured: false,
      defaultRate: 1200000,
    },
    {
      id: 'comfort',
      title: 'Comfort',
      image: resolveAssetPath('images/room-comfort.jpg'),
      featured: false,
      defaultRate: 1200000,
    },
    {
      id: 'comfort_plus',
      title: 'Comfort plus',
      image: resolveAssetPath('assets/aistudio/DSC00093_68cdaf92.JPG'),
      featured: true,
      defaultRate: 1400000,
    },
    {
      id: 'lux',
      title: 'Lux',
      image: resolveAssetPath('images/room-luxe.jpg'),
      featured: false,
      defaultRate: 1400000,
    },
  ];

  return (
    <div
      className={`min-h-screen font-sans tracking-[-0.01em] flex flex-col selection:bg-[#C6A15B] selection:text-slate-900 overflow-x-hidden w-full max-w-full transition-colors duration-300 ${
        isLight ? 'bg-white text-[#0A101D]' : 'bg-[#0A101D] text-white'
      }`}
    >
      
      {/* ──────────────────────────────────────────────────────────────────────────
          1. STICKY PREMIUM NAVBAR
      ────────────────────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
          isLight
            ? 'bg-white/95 border-slate-200 shadow-2xs'
            : 'bg-[#0A101D]/90 border-slate-800'
        }`}
      >
        {/* 1A. Mobile Header (< 640px) */}
        <div className="flex sm:hidden items-center justify-between px-3.5 py-3 gap-2">
          <BrandLogo
            variant="full"
            size="sm"
            theme={isLight ? 'light' : 'dark'}
            subtitle={t.nav.brandSubtitle}
            badgeClassName="w-9 h-9 rounded-xl p-0.5"
            titleClassName="text-[13px] font-bold tracking-wide"
            subtitleClassName="text-[7.5px] font-bold tracking-[0.06em] min-[390px]:tracking-[0.1em]"
            className="cursor-pointer min-w-0"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1. Language Dropdown (UZ ▾ / RU ▾ / EN ▾) */}
            <div className="relative inline-flex items-center">
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value as 'UZ' | 'RU' | 'EN')}
                aria-label="Tilni tanlash / Select Language"
                className={`h-8 appearance-none border rounded-lg pl-2 pr-5 text-[11px] font-bold focus:outline-none focus:border-[#C6A15B] transition-colors cursor-pointer uppercase ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 hover:border-[#C6A15B] text-[#0A101D]'
                    : 'bg-[#101C32] border-slate-700 hover:border-[#C6A15B]/60 text-white'
                }`}
              >
                <option value="UZ" className={isLight ? 'bg-white text-[#0A101D] font-bold' : 'bg-[#101C32] text-slate-200 font-bold'}>UZ</option>
                <option value="RU" className={isLight ? 'bg-white text-[#0A101D] font-bold' : 'bg-[#101C32] text-slate-200 font-bold'}>RU</option>
                <option value="EN" className={isLight ? 'bg-white text-[#0A101D] font-bold' : 'bg-[#101C32] text-slate-200 font-bold'}>EN</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#C6A15B] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 2. Theme Toggle (Sun / Moon) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              title={isLight ? 'Dark Mode' : 'Light Mode'}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-[#C6A15B] text-[#0A101D] hover:bg-[#C6A15B]/10'
                  : 'bg-[#101C32] border-slate-700 hover:border-[#C6A15B]/70 text-[#C6A15B] hover:bg-[#C6A15B]/10'
              }`}
            >
              {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {/* 3. Cabinet Icon Only */}
            <button
              onClick={handleLogin}
              aria-label={content.nav.login}
              title={content.nav.login}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-[#C6A15B] text-[#0A101D]'
                  : 'bg-[#101C32] border-slate-700 hover:border-[#C6A15B]/70 text-[#C6A15B]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
            </button>

            {/* 4. Hamburger Menu (☰) at Far Right */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-[#C6A15B]/15 border-[#C6A15B]/60 text-[#0A101D] hover:bg-[#C6A15B]/25'
                  : 'bg-[#101C32] border-[#C6A15B]/50 text-[#C6A15B] hover:bg-[#C6A15B]/15'
              }`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 1B. Tablet Header (640px – 1024px) */}
        <div className="hidden sm:flex lg:hidden items-center justify-between px-6 sm:px-8 py-3.5 gap-3">
          <BrandLogo
            variant="full"
            size="md"
            theme={isLight ? 'light' : 'dark'}
            subtitle={t.nav.brandSubtitle}
            titleClassName="text-base tracking-wider"
            subtitleClassName="text-[9px] tracking-widest"
            className="gap-3 cursor-pointer"
          />

          <div className="flex items-center gap-2 shrink-0">
            {/* Compact Language Dropdown (UZ ▾ / RU ▾ / EN ▾) */}
            <div className="relative inline-flex items-center">
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value as 'UZ' | 'RU' | 'EN')}
                aria-label="Tilni tanlash / Select Language"
                className={`h-9 appearance-none border rounded-xl pl-3 pr-7 text-xs focus:outline-none focus:border-[#C6A15B] transition-colors cursor-pointer font-bold uppercase tracking-wider ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 hover:border-[#C6A15B] text-[#0A101D]'
                    : 'bg-[#101C32] border-slate-700/80 hover:border-[#C6A15B]/60 text-slate-200'
                }`}
              >
                <option value="UZ" className={isLight ? 'bg-white text-[#0A101D] font-bold' : 'bg-[#101C32] text-slate-200 font-bold'}>UZ</option>
                <option value="RU" className={isLight ? 'bg-white text-[#0A101D] font-bold' : 'bg-[#101C32] text-slate-200 font-bold'}>RU</option>
                <option value="EN" className={isLight ? 'bg-white text-[#0A101D] font-bold' : 'bg-[#101C32] text-slate-200 font-bold'}>EN</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#C6A15B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Theme Toggle (w-9 h-9 rounded-xl) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              title={isLight ? 'Dark Mode' : 'Light Mode'}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-[#C6A15B] text-[#0A101D] hover:bg-[#C6A15B]/10'
                  : 'bg-[#101C32] border-slate-700/80 hover:border-[#C6A15B]/70 text-[#C6A15B] hover:bg-[#C6A15B]/10'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLogin}
              className={`h-9 px-3.5 rounded-xl border text-xs font-medium tracking-[-0.01em] transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                isLight
                  ? 'border-slate-300 bg-white text-[#0A101D] hover:border-[#C6A15B] hover:text-[#9C7734]'
                  : 'border-slate-700 hover:border-[#C6A15B] text-white hover:text-[#C6A15B]'
              }`}
            >
              {content.nav.login}
            </button>
            <button
              onClick={() => onApplyNow()}
              className="h-9 px-4 rounded-xl bg-[#C6A15B] hover:bg-[#b5904b] text-[#0A101D] text-xs font-semibold tracking-[-0.01em] shadow-md shadow-[#C6A15B]/20 transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-1.5"
            >
              <span>{content.nav.apply}</span>
              <span className="font-semibold">→</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-xl border transition-all cursor-pointer inline-flex items-center justify-center shrink-0 ${
                isLight
                  ? 'bg-[#C6A15B]/15 border-[#C6A15B]/60 text-[#0A101D] hover:bg-[#C6A15B]/25'
                  : 'bg-[#C6A15B]/15 border-[#C6A15B]/50 text-[#C6A15B] hover:bg-[#C6A15B]/25'
              }`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 1C. Desktop Header (>= 1024px) */}
        <div className="hidden lg:flex max-w-7xl mx-auto px-12 py-4 items-center justify-between gap-4">
          {/* Brand Logo */}
          <BrandLogo
            variant="full"
            size="md"
            theme={isLight ? 'light' : 'dark'}
            subtitle={t.nav.brandSubtitle}
            titleClassName="text-lg tracking-wider"
            subtitleClassName="text-[10px] tracking-widest"
            className="gap-3 cursor-pointer"
          />

          {/* Desktop Center Menu */}
          <nav
            className={`flex items-center gap-6 xl:gap-8 text-xs font-medium tracking-[-0.01em] ${
              isLight ? 'text-[#0A101D]/80' : 'text-slate-300'
            }`}
          >
            <a
              href="#rooms"
              className={`relative py-1 transition-colors duration-200 group cursor-pointer whitespace-nowrap shrink-0 ${
                isLight ? 'text-[#0A101D]/80 hover:text-[#0A101D]' : 'text-slate-300 hover:text-[#C6A15B]'
              }`}
            >
              <span>{content.nav.rooms}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C6A15B] to-[#E2BA65] rounded-full transition-all duration-300 ease-out group-hover:w-full" />
            </a>
            <a
              href="#amenities"
              className={`relative py-1 transition-colors duration-200 group cursor-pointer whitespace-nowrap shrink-0 ${
                isLight ? 'text-[#0A101D]/80 hover:text-[#0A101D]' : 'text-slate-300 hover:text-[#C6A15B]'
              }`}
            >
              <span>{content.nav.amenities}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C6A15B] to-[#E2BA65] rounded-full transition-all duration-300 ease-out group-hover:w-full" />
            </a>
            <a
              href="#tracker"
              className={`relative py-1 transition-colors duration-200 group cursor-pointer whitespace-nowrap shrink-0 ${
                isLight ? 'text-[#0A101D]/80 hover:text-[#0A101D]' : 'text-slate-300 hover:text-[#C6A15B]'
              }`}
            >
              <span>{content.nav.tracker}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C6A15B] to-[#E2BA65] rounded-full transition-all duration-300 ease-out group-hover:w-full" />
            </a>
            <a
              href="#contact"
              className={`relative py-1 transition-colors duration-200 group cursor-pointer whitespace-nowrap shrink-0 ${
                isLight ? 'text-[#0A101D]/80 hover:text-[#0A101D]' : 'text-slate-300 hover:text-[#C6A15B]'
              }`}
            >
              <span>{content.nav.contact}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C6A15B] to-[#E2BA65] rounded-full transition-all duration-300 ease-out group-hover:w-full" />
            </a>
          </nav>

          {/* Desktop Right Action Elements: Language Selector, Theme Toggle & Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Clean Language Selector (UZ / RU / EN) */}
            <div className="relative inline-flex items-center">
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value as 'UZ' | 'RU' | 'EN')}
                aria-label="Tilni tanlash / Select Language"
                className={`h-9 appearance-none border rounded-xl pl-3 pr-7 text-xs focus:outline-none focus:border-[#C6A15B] transition-colors cursor-pointer font-semibold uppercase tracking-wider ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 hover:border-[#C6A15B] text-[#0A101D]'
                    : 'bg-[#101C32] border-slate-700/70 hover:border-[#C6A15B]/60 text-slate-200'
                }`}
              >
                <option value="UZ" className={isLight ? 'bg-white text-[#0A101D] font-bold' : 'bg-[#101C32] text-slate-200 font-bold'}>UZ</option>
                <option value="RU" className={isLight ? 'bg-white text-[#0A101D] font-bold' : 'bg-[#101C32] text-slate-200 font-bold'}>RU</option>
                <option value="EN" className={isLight ? 'bg-white text-[#0A101D] font-bold' : 'bg-[#101C32] text-slate-200 font-bold'}>EN</option>
              </select>
              <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-[#0A101D]/60' : 'text-slate-400'}`} />
            </div>

            {/* Theme Toggle (w-9 h-9 rounded-xl) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              title={isLight ? 'Dark Mode' : 'Light Mode'}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-[#C6A15B] text-[#0A101D] hover:bg-[#C6A15B]/10'
                  : 'bg-[#101C32] border-slate-700/70 hover:border-[#C6A15B]/70 text-[#C6A15B] hover:bg-[#C6A15B]/10'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLogin}
              className={`h-9 px-4 border text-xs font-medium tracking-[-0.01em] rounded-xl transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                isLight
                  ? 'border-slate-300 bg-white text-[#0A101D] hover:border-[#C6A15B] hover:text-[#9C7734]'
                  : 'border-slate-700 hover:border-[#C6A15B] text-slate-200 hover:text-[#C6A15B]'
              }`}
            >
              {content.nav.login}
            </button>
            <button
              onClick={() => onApplyNow()}
              className="h-9 px-5 bg-[#C6A15B] hover:bg-[#b5904b] text-[#0A101D] font-semibold tracking-[-0.01em] text-xs rounded-xl shadow-md shadow-[#C6A15B]/20 transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <span>{content.nav.apply}</span>
              <span className="text-sm font-semibold">→</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet dropdown menu */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden backdrop-blur-xl border-t px-5 sm:px-6 py-4 space-y-3 animate-fadeIn ${
              isLight
                ? 'bg-white/98 border-slate-200'
                : 'bg-[#0A101D]/98 border-slate-800/80'
            }`}
          >
            <nav
              className={`flex flex-col gap-1 text-xs font-medium tracking-[-0.01em] ${
                isLight ? 'text-[#0A101D]' : 'text-slate-300'
              }`}
            >
              <a
                href="#rooms"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-2 rounded-lg transition-colors ${
                  isLight ? 'hover:bg-slate-100 hover:text-[#9C7734]' : 'hover:bg-[#101C32] hover:text-[#C6A15B]'
                }`}
              >
                {content.nav.rooms}
              </a>
              <a
                href="#amenities"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-2 rounded-lg transition-colors ${
                  isLight ? 'hover:bg-slate-100 hover:text-[#9C7734]' : 'hover:bg-[#101C32] hover:text-[#C6A15B]'
                }`}
              >
                {content.nav.amenities}
              </a>
              <a
                href="#tracker"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-2 rounded-lg transition-colors ${
                  isLight ? 'hover:bg-slate-100 hover:text-[#9C7734]' : 'hover:bg-[#101C32] hover:text-[#C6A15B]'
                }`}
              >
                {content.nav.tracker}
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-2 rounded-lg transition-colors ${
                  isLight ? 'hover:bg-slate-100 hover:text-[#9C7734]' : 'hover:bg-[#101C32] hover:text-[#C6A15B]'
                }`}
              >
                {content.nav.contact}
              </a>
            </nav>

            {/* Full gold Apply CTA in mobile slide-down menu (< 640px) */}
            <div className={`sm:hidden pt-3 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onApplyNow();
                }}
                className="w-full py-3 rounded-xl bg-[#C6A15B] hover:bg-[#b5904b] text-[#0A101D] text-xs font-semibold shadow-md shadow-[#C6A15B]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{content.nav.apply}</span>
                <span className="font-semibold">→</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. STATIC FULL-BLEED NIGHT ROYAL CAMPUS HERO BANNER
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#070D19] overflow-hidden border-b border-slate-800/80">
        {/* Responsive Full-Bleed Night Architectural Background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-cover bg-[position:68%_center] md:bg-[position:85%_center] lg:bg-right pointer-events-none"
          style={{
            backgroundImage: `url('${resolveAssetPath('assets/aistudio/file_00000000118082468627a3e20b36fd2c_10c5a52b.png')}')`,
          }}
        />

        {/* Smooth Responsive Dark Gradient Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 bg-gradient-to-b from-[#070D19]/75 via-[#070D19]/55 to-[#070D19]/85 md:bg-gradient-to-r md:from-[#070D19]/90 md:via-[#070D19]/55 md:to-transparent pointer-events-none"
        />

        {/* Responsive Hero Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pt-12 pb-20 sm:pt-14 sm:pb-24 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32 flex flex-col justify-end min-h-[64vh] md:min-h-[520px] lg:min-h-[76vh]">
          <div className="max-w-xl py-2 md:py-0 md:mt-auto flex flex-col items-start text-left mx-0">
            {/* Refined Address Pill-Badge */}
            <a
              href={content.locationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start mx-0 text-left inline-flex items-center justify-start gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/15 bg-[#0A101D]/65 backdrop-blur-md text-[9.5px] sm:text-xs font-medium text-slate-200 hover:text-[#EAD096] hover:border-[#C6A15B]/50 max-w-[275px] sm:max-w-fit leading-tight transition-all cursor-pointer"
            >
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#C6A15B]" />
              <span>{content.location}</span>
            </a>

            {/* Crisp, Proportional Hero Headline */}
            <h2 className="font-sans font-bold tracking-tight text-[36px] sm:text-[42px] lg:text-[54px] leading-[1.12] lg:leading-[1.08] text-left text-white max-w-xl mt-3 mb-5 sm:mb-8">
              {content.headlinePrefix && (
                <>
                  <span>{content.headlinePrefix}</span>
                  <br className="md:hidden" />{' '}
                </>
              )}
              <span className="text-[#C6A15B]">{content.headlineHighlight}</span>
              {content.headlineSuffix && (
                <>
                  <br className="md:hidden" />{' '}
                  <span>{content.headlineSuffix}</span>
                </>
              )}
            </h2>

            {/* Sleek Apple/Hilton-Grade CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-2.5 sm:gap-3 w-full max-w-[230px] sm:max-w-none mx-0">
              <button
                type="button"
                onClick={() => onApplyNow()}
                className="w-full sm:w-auto h-10 sm:h-11 px-5 sm:px-7 rounded-lg sm:rounded-xl text-[13px] sm:text-sm font-semibold tracking-normal transition-all duration-200 bg-gradient-to-r from-[#E2C275] to-[#C6A15B] text-[#0A101D] shadow-md hover:brightness-105 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>{content.nav.apply}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#rooms"
                className="w-full sm:w-auto h-10 sm:h-11 px-5 sm:px-7 rounded-lg sm:rounded-xl text-[13px] sm:text-sm font-semibold tracking-normal transition-all duration-200 bg-[#0F1A2E]/80 backdrop-blur-md border border-white/15 text-white hover:border-[#C6A15B]/50 hover:text-[#EAD096] inline-flex items-center justify-center whitespace-nowrap"
              >
                {content.exploreRoomsBtn}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          2A. HILTON-STYLE OVERLAPPING EDITORIAL LOCATION CARD & UTILITY STRIP
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-14">
          <div
            className={`rounded-xl px-4 py-5 sm:px-10 sm:py-8 transition-colors duration-300 ${
              isLight
                ? 'bg-white border border-slate-200/80 shadow-[0_20px_50px_rgba(10,16,29,0.08)]'
                : 'bg-[#0F1A2E] border border-[#C6A15B]/20 shadow-[0_24px_60px_rgba(0,0,0,0.55)]'
            }`}
          >
            <p
              className={`max-w-3xl mx-auto text-center text-[12.5px] sm:text-sm md:text-base leading-[1.6] sm:leading-[1.75] font-normal ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              {content.transportText}
            </p>
          </div>
        </div>

        {/* Sleek Full-Width Responsive 2-Row Mobile / 1-Row Desktop Hilton Utility Strip */}
        <div
          className={`mt-6 border-y transition-colors duration-300 ${
            isLight
              ? 'bg-[#F6F3EE] border-slate-200/70 text-[#0A101D]'
              : 'bg-[#0B1324] border-slate-800/80 text-slate-300'
          }`}
        >
          <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-y-2 sm:gap-x-10 md:gap-x-14 py-3 sm:py-3.5 px-4 sm:px-6 text-xs sm:text-sm tabular-nums">
            {/* Row 1 on Mobile (Phone + Divider + Telegram) / Inline on sm:+ */}
            <div className="flex items-center justify-center gap-x-4 sm:gap-x-10 md:gap-x-14">
              <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                <span className="hidden sm:inline font-semibold mr-1">{content.utilityBar.callLabel}</span>
                <a
                  href={`tel:${content.phoneText.replace(/[^0-9+]/g, '')}`}
                  className={`font-medium underline underline-offset-4 hover:text-[#C6A15B] transition whitespace-nowrap ${
                    isLight ? 'text-[#0A101D]' : 'text-white'
                  }`}
                >
                  {content.phoneText}
                </a>
              </span>

              <span className="sm:hidden text-slate-400/50 select-none">|</span>

              <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                <span className="hidden sm:inline font-semibold mr-1">{content.utilityBar.telegramLabel}</span>
                <a
                  href={content.utilityBar.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium underline underline-offset-4 hover:text-[#C6A15B] transition whitespace-nowrap ${
                    isLight ? 'text-[#0A101D]' : 'text-white'
                  }`}
                >
                  {content.utilityBar.telegramHandle}
                </a>
              </span>
            </div>

            {/* Row 2 on Mobile / Inline on sm:+ (Reception Hours) */}
            <div className="sm:mt-0 inline-flex items-center justify-center whitespace-nowrap shrink-0">
              <span className="font-semibold mr-1">{content.utilityBar.receptionLabel}</span>
              <span className={`font-medium whitespace-nowrap ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                {content.utilityBar.receptionValue}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2B. HILTON-STYLE LANDSCAPE HORIZONTAL IMAGE GALLERY SHOWCASE
      ────────────────────────────────────────────────────────────────────────── */}
      <section
        className={`py-12 sm:py-16 border-b transition-colors duration-300 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0A101D] border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-4">
            <div aria-hidden="true" className="w-8 sm:w-12 h-[1px] bg-[#C6A15B]/45 shrink-0" />
            <span className="font-serif uppercase text-lg sm:text-xl md:text-2xl font-semibold tracking-[0.22em] text-[#C6A15B] leading-none">
              ROYAL CAMPUS
            </span>
            <div aria-hidden="true" className="w-8 sm:w-12 h-[1px] bg-[#C6A15B]/45 shrink-0" />
          </div>
        </div>

        {/* Desktop 3-Card Vertical Portrait Showcase */}
        <div className="hidden lg:grid grid-cols-3 gap-6 items-center max-w-6xl mx-auto px-6">
          {/* Left Portrait Card (Prev) */}
          <div
            onClick={handlePrev}
            role="button"
            tabIndex={0}
            aria-label={t.carouselControls.prevLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePrev();
              }
            }}
            className={`aspect-[4/5] max-h-[460px] w-full rounded-2xl overflow-hidden relative transition-opacity duration-300 border opacity-85 hover:opacity-100 cursor-pointer ${
              isLight ? 'border-slate-200 bg-slate-100 shadow-sm' : 'border-slate-700/70 bg-slate-950'
            }`}
          >
            {galleryImages.map((src, idx) => (
              <img
                key={`desktop-prev-${src}`}
                src={src}
                alt={`Royal Campus residence preview ${idx + 1}`}
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ease-out ${
                  idx === prevImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                referrerPolicy="no-referrer"
              />
            ))}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0A101D]/45 via-transparent to-transparent pointer-events-none" />

            {/* Left Edge Symmetrical Arrow Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label={t.carouselControls.prevLabel}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-[2px] flex items-center justify-center transition cursor-pointer z-20"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Center Active Portrait Card */}
          <div
            className={`aspect-[4/5] max-h-[460px] w-full rounded-2xl overflow-hidden relative scale-[1.03] z-10 border-2 border-[#C6A15B]/80 opacity-100 ${
              isLight ? 'bg-slate-100 shadow-2xl shadow-slate-900/15' : 'bg-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.75)]'
            }`}
          >
            {galleryImages.map((src, idx) => (
              <img
                key={`desktop-active-${src}`}
                src={src}
                alt={`Royal Campus residence view ${idx + 1}`}
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ease-out ${
                  idx === activeImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                referrerPolicy="no-referrer"
              />
            ))}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A101D]/35 via-transparent to-transparent pointer-events-none" />

            {/* Bottom-Right Counter Badge on Active Center Card */}
            <span className="absolute bottom-3.5 right-3.5 px-3 py-1 rounded-full bg-[#101C32]/85 backdrop-blur-md border border-[#C6A15B]/50 text-xs font-semibold text-[#EAD096] tabular-nums select-none z-20">
              {activeImageIndex + 1} / {galleryImages.length}
            </span>
          </div>

          {/* Right Portrait Card (Next) */}
          <div
            onClick={handleNext}
            role="button"
            tabIndex={0}
            aria-label={t.carouselControls.nextLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNext();
              }
            }}
            className={`aspect-[4/5] max-h-[460px] w-full rounded-2xl overflow-hidden relative transition-opacity duration-300 border opacity-85 hover:opacity-100 cursor-pointer ${
              isLight ? 'border-slate-200 bg-slate-100 shadow-sm' : 'border-slate-700/70 bg-slate-950'
            }`}
          >
            {galleryImages.map((src, idx) => (
              <img
                key={`desktop-next-${src}`}
                src={src}
                alt={`Royal Campus next preview ${idx + 1}`}
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ease-out ${
                  idx === nextImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                referrerPolicy="no-referrer"
              />
            ))}
            <div className="absolute inset-0 z-10 bg-gradient-to-l from-[#0A101D]/45 via-transparent to-transparent pointer-events-none" />

            {/* Right Edge Symmetrical Arrow Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label={t.carouselControls.nextLabel}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-[2px] flex items-center justify-center transition cursor-pointer z-20"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Tablet & Mobile Responsive Portrait View */}
        <div
          className="lg:hidden px-5"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Tablet (768px–1024px): 2 Portrait Cards Side-by-Side */}
          <div className="hidden md:grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* Tablet Active Card */}
            <div
              className={`aspect-[4/5] max-h-[460px] w-full rounded-2xl overflow-hidden relative border-2 border-[#C6A15B]/80 shadow-xl ${
                isLight ? 'bg-slate-100' : 'bg-slate-950'
              }`}
            >
              {galleryImages.map((src, idx) => (
                <img
                  key={`tablet-active-${src}`}
                  src={src}
                  alt={`Royal Campus residence view ${idx + 1}`}
                  decoding="async"
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ease-out ${
                    idx === activeImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ))}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A101D]/45 via-transparent to-transparent pointer-events-none" />
              <button
                type="button"
                onClick={handlePrev}
                aria-label={t.carouselControls.prevLabel}
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-[2px] flex items-center justify-center transition cursor-pointer z-20"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
              </button>
              <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-[#101C32]/85 backdrop-blur-md border border-[#C6A15B]/50 text-[11px] font-semibold text-[#EAD096] tabular-nums select-none z-20">
                {activeImageIndex + 1} / {galleryImages.length}
              </span>
            </div>

            {/* Tablet Next Card */}
            <div
              onClick={handleNext}
              role="button"
              tabIndex={0}
              aria-label={t.carouselControls.nextLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNext();
                }
              }}
              className={`aspect-[4/5] max-h-[460px] w-full rounded-2xl overflow-hidden relative transition-opacity duration-300 border opacity-90 hover:opacity-100 cursor-pointer ${
                isLight ? 'border-slate-200 bg-slate-100' : 'border-slate-700/70 bg-slate-950'
              }`}
            >
              {galleryImages.map((src, idx) => (
                <img
                  key={`tablet-next-${src}`}
                  src={src}
                  alt={`Royal Campus residence view ${idx + 1}`}
                  decoding="async"
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ease-out ${
                    idx === nextImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ))}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A101D]/45 via-transparent to-transparent pointer-events-none" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label={t.carouselControls.nextLabel}
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-[2px] flex items-center justify-center transition cursor-pointer z-20"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Mobile (< 768px): Single Centered Portrait Card */}
          <div
            className={`md:hidden aspect-[4/5] max-h-[460px] max-w-[360px] mx-auto rounded-2xl overflow-hidden border border-[#C6A15B]/70 shadow-xl relative ${
              isLight ? 'bg-slate-100' : 'bg-slate-950'
            }`}
          >
            {galleryImages.map((src, idx) => (
              <img
                key={`mobile-${src}`}
                src={src}
                alt={`Royal Campus residence view ${idx + 1}`}
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ease-out ${
                  idx === activeImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                referrerPolicy="no-referrer"
              />
            ))}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A101D]/55 via-transparent to-transparent pointer-events-none" />

            {/* Symmetrical Navigation Buttons */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label={t.carouselControls.prevLabel}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-[2px] flex items-center justify-center transition cursor-pointer z-20"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={t.carouselControls.nextLabel}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-[2px] flex items-center justify-center transition cursor-pointer z-20"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
            </button>

            {/* Bottom-Right Counter Pill */}
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-[#101C32]/85 backdrop-blur-md border border-[#C6A15B]/50 text-[11px] font-semibold text-[#EAD096] tabular-nums select-none z-20">
              {activeImageIndex + 1} / {galleryImages.length}
            </span>
          </div>
        </div>

        {/* Gold Indicator Bars Below */}
        <div className="mt-6 flex items-center justify-center gap-2 px-4">
          {galleryImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              aria-label={`${idx + 1} / ${galleryImages.length}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeImageIndex
                  ? 'w-8 bg-[#C6A15B]'
                  : isLight
                  ? 'w-2.5 bg-slate-300 hover:bg-[#C6A15B]/60'
                  : 'w-2.5 bg-slate-700 hover:bg-[#C6A15B]/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. ROOMS & PRICES (Compact Hilton-Style 6-Card Horizontal Carousel)
      ────────────────────────────────────────────────────────────────────────── */}
      <section
        id="rooms"
        className={`py-16 sm:py-20 border-b transition-colors duration-300 ${
          isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-[#0A101D] border-slate-800'
        }`}
      >
        {/* Left-Aligned Minimalist Header with Right-Aligned Gold Circular Navigation Controls */}
        <div className="flex items-end sm:items-center justify-between gap-4 max-w-7xl mx-auto px-5 sm:px-8 mb-6 sm:mb-8">
          <div className="max-w-2xl">
            <div className="text-[11px] sm:text-xs font-bold text-[#C6A15B] uppercase tracking-[0.16em] mb-1.5">
              <span>{t.roomsSection.categoryLabel}</span>
            </div>
            <h2
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.12] ${
                isLight ? 'text-[#0A101D]' : 'text-white'
              }`}
            >
              {t.roomsSection.title}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => scrollRoomsCarousel('prev')}
              aria-label={t.carouselControls.prevLabel}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-[#0A101D] hover:border-[#C6A15B] hover:bg-[#C6A15B] shadow-sm'
                  : 'bg-[#101C32] border-[#C6A15B]/55 text-[#EAD096] hover:bg-[#C6A15B] hover:text-[#101C32] shadow-md'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRoomsCarousel('next')}
              aria-label={t.carouselControls.nextLabel}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-[#0A101D] hover:border-[#C6A15B] hover:bg-[#C6A15B] shadow-sm'
                  : 'bg-[#101C32] border-[#C6A15B]/55 text-[#EAD096] hover:bg-[#C6A15B] hover:text-[#101C32] shadow-md'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Horizontal Scroll Track with Clean Edge Framing */}
        <div className="relative max-w-7xl mx-auto">
          <div
            ref={roomsCarouselRef}
            className="flex items-stretch gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pt-4 pb-4 px-5 sm:px-8 scroll-pl-5 sm:scroll-pl-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {roomCards.map((room) => {
              const displayRate = tariffs[room.id] ?? room.defaultRate;

              return (
                <div
                  key={room.id}
                  className={`snap-start shrink-0 self-stretch w-[82vw] max-w-[325px] sm:w-[320px] md:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)] md:max-w-none rounded-2xl border transition-colors duration-200 flex flex-col h-auto p-4 relative ${
                    isLight
                      ? room.featured
                        ? 'bg-white border-[#C6A15B] shadow-md shadow-[#C6A15B]/10 hover:border-[#C6A15B]'
                        : 'bg-white border-slate-200 shadow-sm hover:border-[#C6A15B]'
                      : room.featured
                      ? 'bg-[#101C32] border-[#C6A15B] shadow-xl shadow-[#C6A15B]/10'
                      : 'bg-[#101C32] border-slate-800 shadow-lg hover:border-[#C6A15B]/60'
                  }`}
                >
                  {/* Featured Top Badge on Comfort Plus */}
                  {room.featured && (
                    <span className="absolute -top-3 left-4 z-20 bg-[#C6A15B] text-[#0A101D] text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md select-none">
                      {t.roomsSection.popularBadge}
                    </span>
                  )}

                  <div className="flex-1 flex flex-col">
                    {/* Top Image with Corner Badges */}
                    <div className="aspect-[16/10] rounded-xl overflow-hidden relative mb-3.5 bg-slate-900">
                      <img
                        src={room.image}
                        alt={`${room.title} category room`}
                        className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25 pointer-events-none" />

                      {/* Top-Left Capacity Pill */}
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#101C32]/90 backdrop-blur-sm border border-[#C6A15B]/45 text-[11px] font-medium text-[#EAD096] whitespace-nowrap tabular-nums">
                        {t.roomsSection.capacities[room.id]}
                      </span>
                    </div>

                    {/* Header Row: Title Left + Batafsil → Right */}
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-lg font-bold leading-[1.15] tracking-tight truncate ${
                          isLight ? 'text-[#0A101D]' : 'text-white'
                        }`}
                      >
                        {room.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setDetailRoomType(room.id)}
                        className={`text-xs font-medium tracking-[-0.01em] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isLight
                            ? 'text-[#C6A15B] hover:text-[#0A101D]'
                            : 'text-[#C6A15B] hover:text-[#EAD096]'
                        }`}
                      >
                        {t.roomsSection.viewDetails} →
                      </button>
                    </div>

                    {/* Concise Single-Column Feature List (3–4 short items) */}
                    <ul
                      className={`space-y-1.5 text-xs font-normal tracking-[-0.01em] my-3 ${
                        isLight ? 'text-[#475569]' : 'text-slate-300'
                      }`}
                    >
                      {t.roomsSection.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 leading-snug">
                          <span className="text-[#C6A15B] font-semibold shrink-0 select-none">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Equal-Baseline Price & Full-Width Gold CTA Footer */}
                  <div className={`mt-auto pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/90'}`}>
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span
                        className={`text-lg font-bold tabular-nums tracking-tight ${
                          isLight ? 'text-[#C6A15B]' : 'text-white'
                        }`}
                      >
                        {formatRoomPrice(displayRate)}
                      </span>
                      <span
                        className={`text-xs font-normal tracking-[-0.01em] ${
                          isLight ? 'text-[#475569]' : 'text-slate-400'
                        }`}
                      >
                        {t.roomsSection.monthSuffixLower}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onApplyNow(room.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold tracking-[-0.01em] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        room.featured
                          ? 'bg-gradient-to-r from-[#C6A15B] to-[#EAD096] text-[#0A101D] hover:brightness-110 shadow-md shadow-[#C6A15B]/20'
                          : 'bg-[#C6A15B] hover:bg-[#d4af68] text-[#0A101D] shadow-sm shadow-[#C6A15B]/15'
                      }`}
                    >
                      <span>{t.nav.apply}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtle Right-Edge Fade Overlay for Clean Carousel Framing */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-8 z-10 bg-gradient-to-l ${
              isLight ? 'from-[#F8FAFC] to-transparent' : 'from-[#0A101D] to-transparent'
            }`}
          />
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. APPLICATION STATUS TRACKER
      ────────────────────────────────────────────────────────────────────────── */}
      <section
        id="tracker"
        className={`py-16 border-b transition-colors duration-300 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0A101D] border-slate-800'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div
            className={`rounded-2xl sm:rounded-3xl p-5 sm:p-8 border relative overflow-hidden transition-colors duration-300 ${
              isLight
                ? 'bg-white border-slate-200/80 shadow-[0_12px_40px_rgba(10,16,29,0.06)]'
                : 'bg-[#0F1A2E] border-slate-800/80 shadow-2xl'
            }`}
          >
            {/* Header */}
            <div
              className={`mb-5 pb-5 border-b ${
                isLight ? 'border-slate-200/80' : 'border-slate-800/80'
              }`}
            >
              <div>
                <h3
                  className={`text-base sm:text-lg font-bold tracking-tight leading-[1.2] ${
                    isLight ? 'text-[#0A101D]' : 'text-white'
                  }`}
                >
                  {content.statusSearch.title}
                </h3>
                <p
                  className={`text-xs sm:text-[13px] font-normal tracking-[-0.01em] mt-1 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {content.statusSearch.desc}
                </p>
              </div>
            </div>

            {/* Search Input Bar with Left Search Icon, Clear (×) Button, and Matching Gold CTA */}
            <form
              onSubmit={handleSearchApplication}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full"
            >
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={trackerQuery}
                  onChange={(e) => setTrackerQuery(e.target.value)}
                  placeholder={content.statusSearch.placeholder}
                  className={`h-11 sm:h-12 w-full rounded-xl border pl-10 ${
                    trackerQuery ? 'pr-9' : 'pr-4'
                  } text-xs sm:text-sm focus:border-[#C6A15B] focus:outline-none placeholder:normal-case font-normal tracking-[-0.01em] transition-colors ${
                    isLight
                      ? 'bg-[#F8FAFC] border-slate-200 text-[#0A101D] placeholder:text-slate-400'
                      : 'bg-[#182642] border-slate-700/80 text-slate-100 placeholder:text-slate-400'
                  }`}
                />
                {trackerQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setTrackerQuery('');
                      setSearchedApp(null);
                      setTrackerHasSearched(false);
                    }}
                    aria-label="Clear search"
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/70'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#E2C275] to-[#C6A15B] text-[#0A101D] font-semibold text-sm px-6 shadow-sm hover:brightness-105 transition cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0"
              >
                <span>{content.statusSearch.btn}</span>
              </button>
            </form>

            {/* Search Result Box */}
            {trackerHasSearched && (
              <div className={`mt-5 pt-5 border-t animate-fadeIn ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                {searchedApp === 'not_found' ? (
                  <div
                    className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLight
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-rose-950/40 border-rose-800/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
                      <div>
                        <h4 className={`text-xs font-bold ${isLight ? 'text-rose-900' : 'text-rose-200'}`}>
                          "{trackerQuery}" {content.statusSearch.notFoundQuery}
                        </h4>
                        <p className={`text-xs mt-0.5 ${isLight ? 'text-rose-700' : 'text-rose-300/80'}`}>
                          {content.statusSearch.notFoundDesc}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onApplyNow()}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap self-start sm:self-center"
                    >
                      {content.statusSearch.newApplicationBtn}
                    </button>
                  </div>
                ) : searchedApp ? (
                  <div
                    className={`border rounded-2xl p-5 space-y-4 ${
                      isLight
                        ? 'bg-[#F8FAFC] border-slate-200'
                        : 'bg-[#1A2D4F]/70 border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tabular-nums text-[#C6A15B]">
                            {searchedApp.id}
                          </span>
                          <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>·</span>
                          <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                            {searchedApp.fullName}
                          </h4>
                        </div>
                        <p className={`text-xs mt-0.5 ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                          {searchedApp.university} — {searchedApp.faculty} (
                          {typeof searchedApp.course === 'number'
                            ? `${t.statusSearch.coursePrefix}${searchedApp.course}${t.statusSearch.courseSuffix}`
                            : searchedApp.course}
                          )
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="self-start sm:self-center">
                        {searchedApp.status === 'approved' && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
                              isLight
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                            <span>{t.statusSearch.statuses.approved}</span>
                          </span>
                        )}
                        {searchedApp.status === 'under_review' && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
                              isLight
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                            <span>{t.statusSearch.statuses.under_review}</span>
                          </span>
                        )}
                        {searchedApp.status === 'new' && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
                              isLight
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                            <span>{t.statusSearch.statuses.new}</span>
                          </span>
                        )}
                        {searchedApp.status === 'correction_requested' && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
                              isLight
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            }`}
                          >
                            <AlertCircle className={`w-3.5 h-3.5 ${isLight ? 'text-orange-600' : 'text-orange-400'}`} />
                            <span>{t.statusSearch.statuses.correction_requested}</span>
                          </span>
                        )}
                        {searchedApp.status === 'rejected' && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
                              isLight
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            <AlertCircle className={`w-3.5 h-3.5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
                            <span>{t.statusSearch.statuses.rejected}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Informational Guidance */}
                    <div
                      className={`rounded-xl p-3.5 border text-xs flex items-start gap-2.5 ${
                        isLight
                          ? 'bg-white border-slate-200 text-[#475569]'
                          : 'bg-[#101C32] border-slate-700/80 text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        {searchedApp.status === 'approved' && (
                          <div>
                            <p className={`font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                              {t.statusSearch.guidance.approvedTitle}
                            </p>
                            <p className={`mt-1 ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                              {searchedApp.assignedRoomNumber ? (() => {
                                const assignedRm = rooms.find(
                                  (r) => r.roomNumber === searchedApp.assignedRoomNumber
                                );
                                const floorPrefix = assignedRm?.floor
                                  ? currentLang === 'RU'
                                    ? `${assignedRm.floor}-й этаж · `
                                    : currentLang === 'EN'
                                    ? `Floor ${assignedRm.floor} · `
                                    : `${assignedRm.floor}-qavat · `
                                  : '';
                                const capText = assignedRm
                                  ? ` (${t.roomsSection.capacities[assignedRm.type]})`
                                  : searchedApp.preferredRoomType
                                  ? ` (${t.roomsSection.capacities[searchedApp.preferredRoomType]})`
                                  : '';
                                const bedVal = searchedApp.assignedBedIdentifier || searchedApp.assignedBedNumber;
                                const formattedRoomBed = bedVal
                                  ? currentLang === 'RU'
                                    ? `${floorPrefix}Комната ${searchedApp.assignedRoomNumber} · Койка ${bedVal}`
                                    : currentLang === 'EN'
                                    ? `${floorPrefix}Room ${searchedApp.assignedRoomNumber} · Bed ${bedVal}`
                                    : `${floorPrefix}${searchedApp.assignedRoomNumber}-xona · ${bedVal}-yotoq`
                                  : currentLang === 'RU'
                                  ? `${floorPrefix}Комната ${searchedApp.assignedRoomNumber}`
                                  : currentLang === 'EN'
                                  ? `${floorPrefix}Room ${searchedApp.assignedRoomNumber}`
                                  : `${floorPrefix}${searchedApp.assignedRoomNumber}-xona`;
                                return (
                                  <span>
                                    <strong className={isLight ? 'text-[#0A101D]' : 'text-white'}>
                                      {formattedRoomBed}
                                      {capText}
                                    </strong>
                                    {' · '}
                                  </span>
                                );
                              })() : null}
                              {t.statusSearch.guidance.approvedRoomSuffix}
                            </p>
                          </div>
                        )}
                        {searchedApp.status === 'under_review' && (
                          <div>
                            <p className={`font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                              {t.statusSearch.guidance.underReviewTitle}
                            </p>
                            <p className={`mt-1 ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                              {t.statusSearch.guidance.underReviewDesc}
                            </p>
                          </div>
                        )}
                        {searchedApp.status === 'new' && (
                          <div>
                            <p className={`font-semibold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                              {t.statusSearch.guidance.newTitle}
                            </p>
                            <p className={`mt-1 tabular-nums ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                              {t.statusSearch.guidance.newDatePrefix} {searchedApp.submittedAt}.
                            </p>
                          </div>
                        )}
                        {searchedApp.status === 'correction_requested' && (
                          <div>
                            <p className={`font-semibold ${isLight ? 'text-orange-700' : 'text-orange-400'}`}>
                              {t.statusSearch.guidance.correctionTitle}
                            </p>
                            <p className={`mt-1 ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                              {searchedApp.reviewNotes || t.statusSearch.guidance.correctionFallback}
                            </p>
                          </div>
                        )}
                        {searchedApp.status === 'rejected' && (
                          <div>
                            <p className={`font-semibold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                              {t.statusSearch.guidance.rejectedTitle}
                            </p>
                            <p className={`mt-1 ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                              {searchedApp.reviewNotes || t.statusSearch.guidance.rejectedFallback}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleLogin}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#E2C275] to-[#C6A15B] text-[#0A101D] font-bold text-xs inline-flex items-center gap-1.5 hover:brightness-105 transition-all cursor-pointer"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>{t.statusSearch.activateCabinetBtn}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. FACILITIES GRID (Minimalist Hilton-style Amenities)
      ────────────────────────────────────────────────────────────────────────── */}
      <section
        id="amenities"
        className={`py-16 sm:py-20 border-b relative overflow-hidden transition-colors duration-300 ${
          isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-[#0E1729] border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-center gap-3.5 text-center mx-auto mb-8 sm:mb-10">
            <span aria-hidden="true" className="w-8 sm:w-12 h-[1px] bg-[#C6A15B]/40" />
            <span className="uppercase text-xs sm:text-sm font-semibold tracking-[0.22em] text-[#C6A15B]">
              {t.amenitiesSection.categoryLabel}
            </span>
            <span aria-hidden="true" className="w-8 sm:w-12 h-[1px] bg-[#C6A15B]/40" />
          </div>

          {(() => {
            const amenityIcons = [
              Wifi,
              ShieldCheck,
              BookOpen,
              Laptop,
              Utensils,
              WashingMachine,
              CigaretteOff,
              PawPrint,
            ];

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 max-w-6xl mx-auto px-4 sm:px-6">
                {t.amenitiesSection.items.map((item, idx) => {
                  const IconComponent = amenityIcons[idx] || CheckCircle2;
                  return (
                    <div key={idx} className="flex items-center gap-3.5 text-left min-w-0">
                      <IconComponent
                        className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${
                          isLight ? 'text-[#0A101D]' : 'text-[#C6A15B]'
                        }`}
                        strokeWidth={1.5}
                      />
                      <span
                        className={`text-sm sm:text-[15px] font-normal leading-snug min-w-0 ${
                          isLight ? 'text-[#0A101D]' : 'text-slate-200'
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          6. LOCATION SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section
        id="location"
        className={`py-20 border-b transition-colors duration-300 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0A101D] border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3.5 text-center mx-auto mb-8 sm:mb-10">
            <span aria-hidden="true" className="w-8 sm:w-12 h-[1px] bg-[#C6A15B]/40" />
            <span className="uppercase text-xs sm:text-sm font-semibold tracking-[0.22em] text-[#C6A15B]">
              {t.locationSection.categoryLabel}
            </span>
            <span aria-hidden="true" className="w-8 sm:w-12 h-[1px] bg-[#C6A15B]/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Left: Address, Transit & Nearby Universities */}
            <div className="md:col-span-5 flex flex-col justify-between gap-3">
              <a
                href={content.locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors group cursor-pointer ${
                  isLight
                    ? 'bg-[#F8FAFC] hover:bg-white border-slate-200 hover:border-[#C6A15B] shadow-sm'
                    : 'bg-[#101C32] hover:bg-[#162644] border-slate-800 hover:border-[#C6A15B]/50'
                }`}
              >
                <MapPin className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                    <span>{t.locationSection.addressTitle}</span>
                    <span className="text-[10px] text-[#C6A15B]">Google Maps ↗</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-[#475569]' : 'text-slate-300'}`}>
                    {t.locationSection.addressDesc}
                  </p>
                </div>
              </a>

              <div
                className={`flex items-start gap-3 p-4 rounded-2xl border ${
                  isLight
                    ? 'bg-[#F8FAFC] border-slate-200 shadow-sm'
                    : 'bg-[#101C32] border-slate-800'
                }`}
              >
                <Clock className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className={`text-xs font-bold ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                    {t.locationSection.transportTitle}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-[#475569]' : 'text-slate-300'}`}>
                    {t.locationSection.transportDesc}
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isLight
                    ? 'bg-[#F8FAFC] border-slate-200 shadow-sm'
                    : 'bg-[#101C32] border-slate-800'
                }`}
              >
                <h4 className={`text-xs font-bold flex items-center gap-2 ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                  <GraduationCap className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>{t.locationSection.universitiesTitle}</span>
                </h4>
                <ul className={`divide-y ${isLight ? 'divide-slate-200/70' : 'divide-slate-800/70'}`}>
                  {t.locationSection.universities.map((uniName, idx) => (
                    <li
                      key={idx}
                      className={`flex items-center gap-2.5 py-2 first:pt-1 last:pb-0 text-sm leading-snug min-w-0 ${
                        isLight ? 'text-[#475569]' : 'text-slate-300'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-[#C6A15B] shrink-0" />
                      <span className="min-w-0">{uniName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Interactive Embedded Google Map & Floating Action Pill */}
            <div className="md:col-span-7 flex">
              <div
                className={`w-full rounded-2xl overflow-hidden border relative min-h-[380px] sm:min-h-[420px] h-full ${
                  isLight
                    ? 'border-slate-200 shadow-lg bg-slate-100'
                    : 'border-[#C6A15B]/40 shadow-2xl bg-[#101C32]'
                }`}
              >
                <iframe
                  title={t.locationSection.mapOverlayTitle}
                  src="https://maps.google.com/maps?q=86XF%2BPC5%2C%20Tashkent&t=&z=17&ie=UTF8&iwloc=B&output=embed"
                  className="w-full h-full min-h-[380px] sm:min-h-[420px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <div
                  className={`absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto backdrop-blur-md border rounded-xl px-4 py-2.5 flex items-center justify-between sm:justify-start gap-4 shadow-xl z-10 ${
                    isLight
                      ? 'bg-white/95 border-slate-200'
                      : 'bg-[#0A101D]/92 border-[#C6A15B]/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-[#C6A15B] shrink-0" />
                    <span
                      className={`text-xs sm:text-sm font-semibold tracking-tight truncate ${
                        isLight ? 'text-[#0A101D]' : 'text-white'
                      }`}
                    >
                      {t.locationSection.mapOverlayTitle}
                    </span>
                  </div>
                  <a
                    href="https://maps.app.goo.gl/2UHJLtbhpgT9tqwn9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-gradient-to-r from-[#C6A15B] to-[#EAD096] hover:brightness-110 text-[#0A101D] font-semibold tracking-[-0.01em] text-xs rounded-lg shadow-md shadow-[#C6A15B]/20 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>{t.locationSection.openMapsBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          9. FINAL APPLICATION CTA
      ────────────────────────────────────────────────────────────────────────── */}
      <section
        id="apply-cta"
        className={`py-20 transition-colors duration-300 ${
          isLight ? 'bg-[#F8FAFC]' : 'bg-[#0E1729]'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`relative rounded-3xl border-2 p-8 sm:p-12 text-center overflow-hidden transition-colors duration-300 ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-gradient-to-br from-[#1A2D4F] via-[#14233F] to-[#101C32] border-[#C6A15B]/45 shadow-2xl'
            }`}
          >
            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <div className="flex justify-center">
                <BrandLogo variant="emblem" size="lg" badgeClassName="w-14 h-14 rounded-2xl" />
              </div>

              <div className="text-xs font-bold text-[#C6A15B] uppercase tracking-widest">
                {t.finalCtaSection.categoryLabel}
              </div>

              <h2
                className={`text-2xl sm:text-4xl font-bold tracking-tight leading-[1.12] ${
                  isLight ? 'text-[#0A101D]' : 'text-white'
                }`}
              >
                {t.finalCtaSection.title}
              </h2>

              <p
                className={`text-xs sm:text-sm font-normal tracking-[-0.01em] leading-relaxed ${
                  isLight ? 'text-[#475569]' : 'text-slate-300'
                }`}
              >
                {t.finalCtaSection.desc}
              </p>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <button
                  onClick={() => onApplyNow()}
                  className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-[#C6A15B] to-[#EAD096] hover:brightness-110 text-[#0A101D] font-semibold tracking-[-0.01em] text-xs sm:text-sm rounded-xl shadow-lg shadow-[#C6A15B]/25 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>{t.finalCtaSection.primaryBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#tracker"
                  className={`w-full sm:w-auto px-6 py-3.5 border font-medium tracking-[-0.01em] text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center whitespace-nowrap ${
                    isLight
                      ? 'bg-[#F8FAFC] hover:bg-white text-[#0A101D] border-slate-200 hover:border-[#C6A15B]'
                      : 'bg-[#101C32]/80 hover:bg-[#101C32] text-slate-200 hover:text-[#C6A15B] border-slate-700 hover:border-[#C6A15B]/50'
                  }`}
                >
                  {t.finalCtaSection.secondaryBtn}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          10. FOOTER
      ────────────────────────────────────────────────────────────────────────── */}
      <footer
        id="contact"
        className={`border-t pt-14 pb-10 transition-colors duration-300 ${
          isLight
            ? 'bg-white text-[#475569] border-slate-200'
            : 'bg-[#0A101D] text-slate-300 border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-7 lg:gap-10">
            {/* Col 1: Brand */}
            <div className="sm:col-span-2 lg:col-span-5 space-y-4">
              <BrandLogo
                variant="full"
                size="md"
                theme={isLight ? 'light' : 'dark'}
                subtitle={t.nav.brandSubtitle}
                titleClassName="text-lg tracking-wider"
                subtitleClassName="text-[10px] tracking-widest"
                className="gap-3"
              />
              <p className={`text-xs max-w-sm leading-relaxed ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                {t.footerSection.brandDesc}
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                {t.footerSection.quickLinksTitle}
              </h4>
              <ul className={`space-y-2 text-xs ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                <li>
                  <a href="#rooms" className="hover:text-[#C6A15B] transition-colors">
                    {t.footerSection.links.rooms}
                  </a>
                </li>
                <li>
                  <a href="#amenities" className="hover:text-[#C6A15B] transition-colors">
                    {t.footerSection.links.amenities}
                  </a>
                </li>
                <li>
                  <a href="#location" className="hover:text-[#C6A15B] transition-colors">
                    {t.footerSection.links.location}
                  </a>
                </li>
                <li>
                  <a href="#tracker" className="hover:text-[#C6A15B] transition-colors">
                    {t.footerSection.links.tracker}
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact */}
            <div className="lg:col-span-4 space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                {t.footerSection.contactTitle}
              </h4>
              <ul className={`space-y-2.5 text-xs font-normal tracking-[-0.01em] ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                <li className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#C6A15B] shrink-0 mt-0.5" />
                  <a
                    href={t.footerSection.phoneHref}
                    className="tabular-nums hover:text-[#C6A15B] transition-colors"
                  >
                    {t.footerSection.phoneDisplay}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Send className="w-3.5 h-3.5 text-[#C6A15B] shrink-0 mt-0.5" />
                  <a
                    href={t.footerSection.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#C6A15B] transition-colors"
                  >
                    {t.footerSection.telegramHandle}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#C6A15B] shrink-0 mt-0.5" />
                  <a
                    href={t.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#C6A15B] transition-colors"
                  >
                    {t.footerSection.address}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#C6A15B] shrink-0 mt-0.5" />
                  <span className="tabular-nums">{t.footerSection.receptionHours}</span>
                </li>
              </ul>
            </div>
          </div>

          <div
            className={`mt-10 pt-6 border-t text-xs text-center sm:text-left ${
              isLight
                ? 'border-slate-200/80 text-slate-500'
                : 'border-slate-800/80 text-slate-400'
            }`}
          >
            {t.footerSection.copyright}
          </div>
        </div>
      </footer>
      {/* Room Details Quick Modal */}
      {detailRoomType && (() => {
        const selectedCard = roomCards.find((c) => c.id === detailRoomType);
        if (!selectedCard) return null;
        const displayRate = tariffs[selectedCard.id] ?? selectedCard.defaultRate;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDetailRoomType(null)}
          >
            <div
              className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
                isLight
                  ? 'bg-white border-slate-200 text-[#0A101D]'
                  : 'bg-[#101C32] border-[#C6A15B]/50 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-52 relative bg-slate-950">
                <img
                  src={selectedCard.image}
                  alt={selectedCard.title}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent pointer-events-none ${
                    isLight ? 'from-black/50' : 'from-[#101C32]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setDetailRoomType(null)}
                  aria-label={t.roomsSection.closeDetails}
                  className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#101C32]/85 border border-slate-700 text-slate-200 hover:text-[#C6A15B] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-5 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#101C32]/90 border border-[#C6A15B]/40 text-xs font-semibold text-[#C6A15B] tabular-nums">
                    {t.roomsSection.capacities[selectedCard.id]}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`text-2xl font-bold tracking-tight leading-[1.12] ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                      {selectedCard.title}
                    </h3>
                    <p className={`text-xs font-normal tracking-[-0.01em] mt-1 ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                      {t.roomsSection.subPriceInfo}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[11px] block ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                      {t.roomsSection.monthlyRateLabel}
                    </span>
                    <span className="text-lg font-bold text-[#C6A15B] tabular-nums tracking-tight">
                      {formatRoomPrice(displayRate)}
                    </span>
                  </div>
                </div>

                <ul className={`space-y-2 text-xs font-normal tracking-[-0.01em] ${isLight ? 'text-[#475569]' : 'text-slate-300'}`}>
                  {t.roomsSection.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#C6A15B] font-semibold shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDetailRoomType(null)}
                    className={`px-4 py-3 rounded-xl border text-xs font-medium tracking-[-0.01em] cursor-pointer transition-colors ${
                      isLight
                        ? 'border-slate-200 text-[#475569] hover:text-[#0A101D] hover:border-slate-300'
                        : 'border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {t.roomsSection.closeDetails}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailRoomType(null);
                      onApplyNow(selectedCard.id);
                    }}
                    className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#C6A15B] to-[#EAD096] text-[#0A101D] font-semibold tracking-[-0.01em] text-xs hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t.roomsSection.buttonTexts[selectedCard.id]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default S00_LandingPage;
