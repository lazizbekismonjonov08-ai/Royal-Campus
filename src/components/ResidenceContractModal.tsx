import React, { useEffect } from 'react';
import { X, MapPin, ShieldCheck, Clock, CalendarClock, FileText, Check } from 'lucide-react';
import { Language } from '../i18n/types';

interface ResidenceContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  language: Language;
  isLight: boolean;
}

interface ContractSection {
  title: string;
  points: string[];
}

interface ContractContent {
  badge: string;
  title: string;
  subtitle: string;
  highlights: {
    addressLabel: string;
    addressValue: string;
    depositLabel: string;
    depositValue: string;
    curfewLabel: string;
    curfewValue: string;
    noticeLabel: string;
    noticeValue: string;
  };
  sections: ContractSection[];
  closeLabel: string;
  acceptBtn: string;
}

const CONTRACT_CONTENT: Record<Language, ContractContent> = {
  uz: {
    badge: 'RASMIY HUJJAT · 2026',
    title: 'Talabalar turar joyidan foydalanish va yashash shartnomasi',
    subtitle: 'Royal Campus ma’muriyati hamda rezident talaba o‘rtasidagi asosiy shartlar va ichki tartib-qoidalar',
    highlights: {
      addressLabel: 'Manzil',
      addressValue: 'Olmazor tumani, Umid 1-tor ko‘chasi, 22/4-uy',
      depositLabel: 'Kafolat depoziti',
      depositValue: '1 000 000 so‘m',
      curfewLabel: 'Oxirgi kirish vaqti',
      curfewValue: '22:00',
      noticeLabel: 'Chiqish xabarnomasi',
      noticeValue: '30 kun oldin',
    },
    sections: [
      {
        title: '1. Shartnoma predmeti va manzil',
        points: [
          'Ma’muriyat talabaga Toshkent shahri, Olmazor tumani, Zamondosh MFY, Umid 1-tor ko‘chasi, 22/4-uy manzilida joylashgan Royal Campus talabalar turar joyida vaqtincha yashash va foydalanish uchun belgilangan xona hamda o‘rinni taqdim etadi.',
          'Talaba ajratilgan joydan faqat shaxsiy yashash maqsadida foydalanadi; uni uchinchi shaxslarga berish, qayta ijaraga topshirish yoki boshqa shaxsni doimiy joylashtirish qat’iyan taqiqlanadi.',
        ],
      },
      {
        title: '2. Yashash muddati va muddatidan oldin bekor qilish',
        points: [
          'Shartnoma muddatini uzaytirish tomonlarning yozma kelishuvi yoki yangi shartnoma asosida amalga oshiriladi. Xona yoki o‘rinni almashtirish faqat ma’muriyat bilan kelishilgan holda bajariladi.',
          'Talaba o‘qishdan chetlashtirilgan, o‘qishini boshqa joyga ko‘chirgan yoki turar joydan foydalanish huquqini yo‘qotgan taqdirda ma’muriyatga darhol xabar berishi shart.',
          'Talaba o‘z xohishi bilan chiqib ketmoqchi bo‘lsa, kamida 30 kalendar kun oldin ma’muriyatga yozma yoki elektron xabar beradi, xona va inventarni topshiradi hamda yakuniy hisob-kitobni amalga oshiradi.',
        ],
      },
      {
        title: '3. Oylik to‘lov va kafolat depoziti',
        points: [
          'Oylik yashash to‘lovi belgilangan sanaga qadar bank kartasi, hisob raqami yoki ma’muriyat tasdiqlagan rasmiy usulda amalga oshiriladi; kechikish qarzdorlik sifatida qayd etiladi.',
          'Kafolat depoziti miqdori 1 000 000 so‘mni tashkil etadi. Zarar yoki qarzdorlik bo‘lmaganda, depozit talaba chiqib ketayotganda yakuniy hisob-kitobdan so‘ng to‘liq qaytariladi.',
          'Xona, mebel, texnika, sanitariya jihozlari yoki mol-mulkka yetkazilgan zarar yoxud qarzdorlik mavjud bo‘lsa, depozitdan ushlab qolish faqat rasmiy dalolatnoma, smeta yoki tasdiqlovchi hujjatlar asosida amalga oshiriladi.',
        ],
      },
      {
        title: '4. Tomonlarning huquq va majburiyatlari',
        points: [
          'Turar joy talabani jihozlangan xona (krovat, matras, yostiq-ko‘rpa, shkaf, stol, stul, tumbochka, konditsioner, yoritish jihozlari, kalit/karta va choyshablar), qishki isitish, yong‘inga qarshi vositalar va sanitariya sharoitlari bilan ta’minlaydi.',
          'Talaba xona, mebel, choyshablar, kalit/karta hamda elektr jihozlarini ehtiyotkorlik bilan saqlashi, tozalikka rioya qilishi va jihozlarni uchinchi shaxslarga bermasligi lozim.',
          'Xonada ruxsat etilmagan isitish moslamalari, elektr choynak va qo‘lbola elektr uskunalaridan foydalanish taqiqlanadi. Avariya, suv oqishi, yong‘in xavfi yoki elektr nosozligi aniqlanganda darhol ma’muriyatga xabar berilishi kerak.',
          'Tabiiy eskirish holatlari uchun talabadan haq undirilmaydi.',
        ],
      },
      {
        title: '5. Mehmonlar va ichki tartib-qoidalar',
        points: [
          'Turar joyga oxirgi kirish vaqti: 22:00. Mehmonlarni qabul qilish belgilangan vaqt va tartibda amalga oshiriladi; ma’muriyat roziligisiz mehmonning tungi yoki doimiy qolishi taqiqlanadi. Taklif etilgan mehmon yetkazgan zarar uchun talaba javobgardir.',
          'Bino ichkarisida — xonalarda, koridor va hammomlarda tamaki chekish, ochiq olovdan xavfli foydalanish, qonunchilik bilan taqiqlangan moddalarni saqlash, iste’mol qilish yoki tarqatish qat’iyan taqiqlanadi.',
          'Tinchlik vaqtida baland ovoz va shovqin solish, janjal, zo‘ravonlik yoki mol-mulkka qasddan zarar yetkazishga yo‘l qo‘yilmaydi. Qoidalarni muntazam buzish ogohlantirish, intizomiy chora yoki yashashdan chetlashtirishga sabab bo‘ladi.',
        ],
      },
      {
        title: '6. Shartnomaning ajralmas ilovalari va yakuniy qoidalar',
        points: [
          '1-ilova: Qabul qilish-topshirish va inventar dalolatnomasi (krovat, matras, yostiq/ko‘rpa, shkaf, stol, stul, tumbochka, konditsioner, yoritish jihozlari, kalit/karta va postel holati qayd etiladi).',
          '2-ilova: Talabalar turar joyi ichki tartib-qoidalari (10 bandli majburiy yashash me’yorlari).',
          '3-ilova: Talabaning oylik to‘lovlarini hisobga olish varag‘i.',
          'Talaba shartnomani bajarish, xavfsizlik va hisob-kitoblarni yuritish maqsadida shaxsiy ma’lumotlariga ishlov berilishiga rozilik bildiradi; nizolar muzokara orqali yoki O‘zbekiston Respublikasi qonunchiligi asosida hal etiladi.',
        ],
      },
    ],
    closeLabel: 'Yopish',
    acceptBtn: 'Tushundim va qabul qilaman',
  },
  ru: {
    badge: 'ОФИЦИАЛЬНЫЙ ДОКУМЕНТ · 2026',
    title: 'Договор пользования и проживания в студенческой резиденции',
    subtitle: 'Основные условия проживания и правила внутреннего распорядка Royal Campus',
    highlights: {
      addressLabel: 'Адрес',
      addressValue: 'Алмазарский р-н, 1-й тупик Умид, дом 22/4',
      depositLabel: 'Гарантийный депозит',
      depositValue: '1 000 000 сум',
      curfewLabel: 'Последний вход',
      curfewValue: '22:00',
      noticeLabel: 'Уведомление о выезде',
      noticeValue: 'За 30 дней',
    },
    sections: [
      {
        title: '1. Предмет договора и адрес',
        points: [
          'Администрация предоставляет студенту закрепленное жилое место в студенческой резиденции Royal Campus по адресу: г. Ташкент, Алмазарский район, МСГ Замондош, 1-й тупик Умид, дом 22/4.',
          'Помещение предоставляется исключительно для личного проживания. Передача места третьим лицам, субаренда или постоянное размещение посторонних лиц запрещены.',
        ],
      },
      {
        title: '2. Срок действия и досрочное расторжение',
        points: [
          'Продление срока проживания оформляется письменным соглашением сторон или новым договором. Смена комнаты или места допускается только по согласованию с администрацией.',
          'При отчислении, переводе или утрате права на проживание студент обязан незамедлительно уведомить администрацию.',
          'При добровольном выезде студент обязан письменно или электронно уведомить администрацию не менее чем за 30 календарных дней, сдать комнату с инвентарем и провести окончательный расчет.',
        ],
      },
      {
        title: '3. Ежемесячная оплата и гарантийный депозит',
        points: [
          'Оплата за проживание вносится ежемесячно до установленной даты банковской картой, перечислением или иным официальным способом; просрочка фиксируется как задолженность.',
          'Гарантийный депозит составляет 1 000 000 сум. При отсутствии ущерба и задолженности депозит возвращается в полном объеме при выезде после окончательного расчета.',
          'Удержания из депозита на покрытие ущерба или долга производятся строго на основании акта осмотра, сметы, чека или подтверждающих документов.',
        ],
      },
      {
        title: '4. Права и обязанности сторон',
        points: [
          'Резиденция обеспечивает оснащенную комнату (кровать, матрас, подушка/одеяло, шкаф, стол, стул, тумбочка, кондиционер, освещение, ключ/карта, постельное белье), отопление в зимний сезон, противопожарные средства и санитарные условия.',
          'Студент обязан бережно относиться к комнате, мебели, белью, ключу/карте и бытовым приборам, поддерживать чистоту и не передавать инвентарь третьим лицам.',
          'Запрещено использование несогласованных обогревателей, электрочайников и кустарных электроприборов. О любых поломках, протечках, угрозах пожара или сбоях электрики необходимо немедленно сообщать администрации. Естественный износ не оплачивается.',
        ],
      },
      {
        title: '5. Гости и правила внутреннего распорядка',
        points: [
          'Время последнего входа в резиденцию — 22:00. Прием гостей осуществляется по установленному графику; ночное или постоянное проживание гостей без предварительного согласия администрации запрещено. Студент несет ответственность за ущерб, причиненный приглашенными гостями.',
          'Категорически запрещено курение внутри здания (в комнатах, коридорах и санузлах), неосторожное обращение с открытым огнем, а также хранение, употребление или распространение запрещенных законодательством веществ.',
          'Запрещены шум и громкая музыка в тихие часы, конфликты, насилие и умышленная порча имущества. Нарушение правил влечет предупреждение, дисциплинарные меры или выселение.',
        ],
      },
      {
        title: '6. Приложения к договору и заключительные положения',
        points: [
          'Приложение 1: Акт приема-передачи комнаты и инвентаря (11 позиций оснащения и фиксация состояния).',
          'Приложение 2: Правила внутреннего распорядка студенческой резиденции (10 обязательных норм проживания).',
          'Приложение 3: Ведомость учета ежемесячных платежей студента.',
          'Студент дает согласие на обработку персональных данных для организации проживания, безопасности и расчетов; споры решаются путем переговоров либо в порядке законодательства Республики Узбекистан.',
        ],
      },
    ],
    closeLabel: 'Закрыть',
    acceptBtn: 'Понятно, принимаю',
  },
  en: {
    badge: 'OFFICIAL AGREEMENT · 2026',
    title: 'Student Residence Usage & Accommodation Agreement',
    subtitle: 'Official residence terms and internal house rules of Royal Campus',
    highlights: {
      addressLabel: 'Address',
      addressValue: '22/4 Umid 1st Passage, Olmazor District',
      depositLabel: 'Security Deposit',
      depositValue: '1,000,000 UZS',
      curfewLabel: 'Curfew / Last Entry',
      curfewValue: '22:00',
      noticeLabel: 'Notice Period',
      noticeValue: '30 days prior',
    },
    sections: [
      {
        title: '1. Subject & Residence Address',
        points: [
          'Administration provides the Student with an assigned room and bed at Royal Campus Student Residence located at 22/4 Umid 1st Passage, Zamondosh Mahalla, Olmazor District, Tashkent.',
          'The assigned space is strictly for personal residential use. Transferring access to third parties, subletting, or permanently accommodating other persons is strictly prohibited.',
        ],
      },
      {
        title: '2. Term & Early Termination',
        points: [
          'Extensions require a written agreement or new contract. Room or bed changes require prior approval from Administration.',
          'The Student must promptly notify Administration in case of expulsion, academic transfer, or loss of eligibility.',
          'For voluntary early departure, the Student must submit written or electronic notice at least 30 calendar days in advance, complete room/inventory handover, and settle all outstanding balances.',
        ],
      },
      {
        title: '3. Monthly Payment & Security Deposit',
        points: [
          'Monthly residence fees are paid by the agreed due date via bank card, transfer, or approved official channels; overdue balances are recorded as debt.',
          'A refundable guarantee deposit of 1,000,000 UZS is required. Provided there is no property damage or unpaid balance, the deposit is refunded in full upon check-out settlement.',
          'Any deductions for room, furniture, appliance, or plumbing damage require an official inspection act, repair estimate, or supporting receipt.',
        ],
      },
      {
        title: '4. Rights & Responsibilities',
        points: [
          'The residence provides a fully furnished room (bed, mattress, pillow/blanket, wardrobe, desk, chair, nightstand, air conditioner, lighting, key/card, bed linen), winter heating, fire-safety equipment, and sanitary conditions.',
          'The Student must take proper care of the room, furniture, bed linen, key/card, and electrical appliances, maintain cleanliness, and never lend keys or inventory to third parties.',
          'Unapproved heaters, electric kettles, or makeshift electrical devices are prohibited. Any leaks, malfunctions, electrical faults, or fire hazards must be reported immediately. Normal wear and tear is never charged.',
        ],
      },
      {
        title: '5. Guests & Internal House Rules',
        points: [
          'Last entry to the residence is 22:00. Visitors are allowed only during designated hours; unauthorized overnight or permanent stays are prohibited, and Students are liable for any damage caused by their guests.',
          'Strictly prohibited anywhere indoors (rooms, corridors, and bathrooms): smoking, unsafe use of open flames, and storing, consuming, or distributing prohibited substances.',
          'Loud noise/music during quiet hours, conflicts, violence, threats, or intentional damage are forbidden. Violations may result in warnings, disciplinary action, or termination of residence.',
        ],
      },
      {
        title: '6. Official Annexes & Final Provisions',
        points: [
          'Annex 1: Room & Inventory Handover Act (11-item furniture and equipment condition record).',
          'Annex 2: Internal House Rules (10 core residential conduct rules).',
          'Annex 3: Monthly Payment Tracking Sheet.',
          'The Student consents to personal data processing solely for residence operations, security, and billing. Disputes are settled by negotiation or under the laws of the Republic of Uzbekistan.',
        ],
      },
    ],
    closeLabel: 'Close',
    acceptBtn: 'Understood, I Agree',
  },
};

export const ResidenceContractModal: React.FC<ResidenceContractModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  language,
  isLight,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const doc = CONTRACT_CONTENT[language] || CONTRACT_CONTENT.uz;

  const highlightItems = [
    { icon: MapPin, label: doc.highlights.addressLabel, value: doc.highlights.addressValue },
    { icon: ShieldCheck, label: doc.highlights.depositLabel, value: doc.highlights.depositValue },
    { icon: Clock, label: doc.highlights.curfewLabel, value: doc.highlights.curfewValue },
    { icon: CalendarClock, label: doc.highlights.noticeLabel, value: doc.highlights.noticeValue },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-modal-title"
    >
      <div
        className={`w-full max-w-2xl max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-[#0A101D]'
            : 'bg-[#101C32] border-slate-700/80 text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          className={`flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-[#0E1729]'
          }`}
        >
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C6A15B] mb-1">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>{doc.badge}</span>
            </div>
            <h2
              id="contract-modal-title"
              className={`text-sm sm:text-base font-bold leading-snug ${
                isLight ? 'text-[#0A101D]' : 'text-white'
              }`}
            >
              {doc.title}
            </h2>
            <p className={`text-[11px] sm:text-xs mt-0.5 leading-snug ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {doc.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={doc.closeLabel}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-500 hover:text-[#0A101D] hover:border-[#C6A15B]'
                : 'bg-[#16233B] border-slate-700 text-slate-400 hover:text-white hover:border-[#C6A15B]/60'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Key Highlights Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {highlightItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                    isLight
                      ? 'bg-[#F8FAFC] border-slate-200/90'
                      : 'bg-[#0E1729] border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#C6A15B]">
                      {item.label}
                    </span>
                    <span
                      className={`block text-xs font-semibold leading-snug mt-0.5 ${
                        isLight ? 'text-[#0A101D]' : 'text-slate-100'
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Structured Clauses */}
          <div className="space-y-4">
            {doc.sections.map((section, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 space-y-2 ${
                  isLight
                    ? 'bg-white border-slate-200/80'
                    : 'bg-[#0E1729]/60 border-slate-800/90'
                }`}
              >
                <h3
                  className={`text-xs sm:text-[13px] font-bold tracking-tight ${
                    isLight ? 'text-[#0A101D]' : 'text-[#EAD096]'
                  }`}
                >
                  {section.title}
                </h3>
                <ul className="space-y-1.5">
                  {section.points.map((point, pIdx) => (
                    <li
                      key={pIdx}
                      className={`text-xs leading-relaxed flex items-start gap-2 ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B]/80 shrink-0 mt-1.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Footer CTA */}
        <div
          className={`px-5 sm:px-6 py-3.5 border-t flex items-center justify-end gap-2.5 shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-[#0E1729]'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 text-slate-600 hover:text-[#0A101D]'
                : 'bg-[#16233B] border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {doc.closeLabel}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C6A15B] to-[#EAD096] hover:brightness-110 text-[#0A101D] font-bold text-xs shadow-md shadow-[#C6A15B]/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{doc.acceptBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
