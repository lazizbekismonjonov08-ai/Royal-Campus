import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, Check } from 'lucide-react';
import { Language } from '../i18n/types';

export interface ContractLiveStudentData {
  fullName: string;
  birthDate: string;
  phone: string;
  passportNumber: string;
  university: string;
  faculty: string;
  course: string;
  group: string;
  roomTypeLabel: string;
  monthlyTariffText: string;
}

interface ResidenceContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  agreedToTerms: boolean;
  onToggleAgreed: (checked: boolean) => void;
  language: Language;
  isLight: boolean;
  studentData: ContractLiveStudentData;
}

const BLANK = '__________';

const ANNEX_1_ITEMS: Record<Language, string[]> = {
  uz: [
    'Кровать',
    'Матрас',
    'Ёстиқ / кўрпа',
    'Шкаф',
    'Стол',
    'Стул',
    'Тумбочка',
    'Кондиционер',
    'Ёритиш жиҳозлари',
    'Калит / карта',
    'Постель',
  ],
  ru: [
    'Кровать',
    'Матрас',
    'Подушка / одеяло',
    'Шкаф',
    'Стол',
    'Стул',
    'Тумбочка',
    'Кондиционер',
    'Осветительные приборы',
    'Ключ / карта доступа',
    'Постельное белье',
  ],
  en: [
    'Bed frame',
    'Mattress',
    'Pillow / blanket',
    'Wardrobe',
    'Study desk',
    'Chair',
    'Nightstand',
    'Air conditioner',
    'Lighting fixtures',
    'Key / access card',
    'Bed linen set',
  ],
};

const ANNEX_2_RULES: Record<Language, { title: string; subtitle: string; rules: string[] }> = {
  uz: {
    title: '2-ИЛОВА',
    subtitle: 'ТАЛАБАЛАР ТУРАР ЖОЙИ ИЧКИ ТАРТИБ-ҚОИДАЛАРИ',
    rules: [
      'Талаба белгиланган хона ва ўриндан фойдаланади; бошқа шахсга бериш тақиқланади.',
      'Тинчлик вақтида бошқа яшовчиларга халақит берувчи баланд овоз, мусиқа ва бошқа ҳаракатларга йўл қўйилмайди.',
      'Умумий жойлардан фойдалангандан сўнг тозалик сақланади.',
      'Ёнғин хавфсизлиги талабларига қатъий риоя қилинади.',
      'Қонунчилик билан тақиқланган моддалар ва буюмларни сақлаш, истеъмол қилиш ёки тарқатишга йўл қўйилмайди.',
      'Бошқа талабаларнинг мол-мулкига, шахсий дахлсизлигига ва тинчлигига ҳурмат билан муносабатда бўлинади.',
      'Мебель, техника ва умумий мол-мулкка эҳтиёткорлик билан муносабатда бўлинади.',
      'Носозлик ва авария ҳолатлари дарҳол Маъмуриятга хабар қилинади.',
      'Меҳмонлар белгиланган тартибда қабул қилинади; рухсатсиз тунги қолишга йўл қўйилмайди.',
      'Ички тартиб-қоидаларни мунтазам бузиш шартномани қонунчиликда белгиланган тартибда бекор қилишга асос бўлиши мумкин.',
    ],
  },
  ru: {
    title: 'ПРИЛОЖЕНИЕ 2',
    subtitle: 'ПРАВИЛА ВНУТРЕННЕГО РАСПОРЯДКА СТУДЕНЧЕСКОЙ РЕЗИДЕНЦИИ',
    rules: [
      'Студент пользуется закрепленной комнатой и койко-местом; передача третьим лицам запрещена.',
      'В тихие часы не допускаются громкий звук, музыка и действия, мешающие другим проживающим.',
      'После пользования общими зонами поддерживается чистота и порядок.',
      'Строго соблюдаются требования пожарной безопасности.',
      'Запрещается хранение, употребление или распространение веществ и предметов, запрещенных законодательством.',
      'Соблюдается уважительное отношение к имуществу, неприкосновенности и покою других студентов.',
      'Мебель, бытовая техника и общее имущество должны использоваться бережно.',
      'О неисправностях и аварийных ситуациях необходимо незамедлительно сообщать Администрации.',
      'Прием гостей осуществляется в установленном порядке; ночевка без разрешения запрещена.',
      'Систематическое нарушение правил внутреннего распорядка может служить основанием для расторжения договора в установленном законом порядке.',
    ],
  },
  en: {
    title: 'ANNEX 2',
    subtitle: 'INTERNAL HOUSE RULES OF THE STUDENT RESIDENCE',
    rules: [
      'The Student shall use only the assigned room and bed; transferring access to third parties is prohibited.',
      'Loud noises, music, or actions disturbing other residents during quiet hours are prohibited.',
      'Cleanliness must be maintained in all common areas after use.',
      'Fire safety regulations must be strictly observed at all times.',
      'Storing, consuming, or distributing substances and items prohibited by law is strictly forbidden.',
      'Residents must respect the property, privacy, and peace of fellow students.',
      'Furniture, appliances, and shared residence property must be treated with care.',
      'Any malfunctions or emergencies must be reported to Administration immediately.',
      'Visitors are permitted strictly under residence rules; unauthorized overnight stays are prohibited.',
      'Repeated violations of the house rules may constitute grounds for termination of this Agreement in accordance with applicable law.',
    ],
  },
};

const ANNEX_3_MONTHS: Record<Language, string[]> = {
  uz: [
    '2026 йил сентябрь',
    '2026 йил октябрь',
    '2026 йил ноябрь',
    '2026 йил декабрь',
    '2027 йил январь',
    '2027 йил февраль',
    '2027 йил март',
    '2027 йил апрель',
    '2027 йил май',
    '2027 йил июнь',
    '2027 йил июль',
    '2027 йил август',
  ],
  ru: [
    'Сентябрь 2026 г.',
    'Октябрь 2026 г.',
    'Ноябрь 2026 г.',
    'Декабрь 2026 г.',
    'Январь 2027 г.',
    'Февраль 2027 г.',
    'Март 2027 г.',
    'Апрель 2027 г.',
    'Май 2027 г.',
    'Июнь 2027 г.',
    'Июль 2027 г.',
    'Август 2027 г.',
  ],
  en: [
    'September 2026',
    'October 2026',
    'November 2026',
    'December 2026',
    'January 2027',
    'February 2027',
    'March 2027',
    'April 2027',
    'May 2027',
    'June 2027',
    'July 2027',
    'August 2027',
  ],
};

const UI_TEXT: Record<
  Language,
  {
    modalBadge: string;
    modalHeaderTitle: string;
    printBtn: string;
    closeBtn: string;
    confirmBtn: string;
    consentLabel: string;
  }
> = {
  uz: {
    modalBadge: 'RASMIY HUJJAT · AVTO-TO‘LDIRILGAN SHARTNOMA',
    modalHeaderTitle: 'Talabalar turar joyidan foydalanish va yashash shartnomasi (18 bo‘lim + 1, 2, 3-ilova)',
    printBtn: 'Chop etish / PDF saqlash',
    closeBtn: 'Yopish',
    confirmBtn: 'Roziman va tasdiqlash',
    consentLabel: 'Turar joy shartnomasi va ichki tartib-qoidalar bilan tanishdim va roziman.',
  },
  ru: {
    modalBadge: 'ОФИЦИАЛЬНЫЙ ДОКУМЕНТ · АВТОЗАПОЛНЕНИЕ',
    modalHeaderTitle: 'Договор пользования и проживания в студенческой резиденции (18 разделов + Приложения 1–3)',
    printBtn: 'Печать / Сохранить PDF',
    closeBtn: 'Закрыть',
    confirmBtn: 'Согласен и подтверждаю',
    consentLabel: 'Я ознакомился с договором проживания и правилами внутреннего распорядка и согласен с ними.',
  },
  en: {
    modalBadge: 'OFFICIAL DOCUMENT · LIVE AUTO-FILL',
    modalHeaderTitle: 'Student Residence Usage & Accommodation Agreement (18 Sections + Annexes 1–3)',
    printBtn: 'Print / Save PDF',
    closeBtn: 'Close',
    confirmBtn: 'Agree & Confirm',
    consentLabel: 'I have read and agree to the residence agreement and internal house rules.',
  },
};

export const ResidenceContractModal: React.FC<ResidenceContractModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  agreedToTerms,
  onToggleAgreed,
  language,
  isLight,
  studentData,
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

  useEffect(() => {
    const cleanupPrintClass = () => {
      document.body.classList.remove('printing-contract');
    };
    window.addEventListener('afterprint', cleanupPrintClass);
    return () => {
      window.removeEventListener('afterprint', cleanupPrintClass);
      cleanupPrintClass();
    };
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  const ui = UI_TEXT[language] || UI_TEXT.uz;
  const valOrBlank = (val?: string) => (val && val.trim().length > 0 ? val.trim() : BLANK);

  const Field: React.FC<{ value?: string; fallback?: string }> = ({ value, fallback = BLANK }) => {
    const clean = value?.trim();
    if (!clean) {
      return (
        <span
          className={`font-mono font-normal tracking-tight print:text-black ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {fallback}
        </span>
      );
    }
    return (
      <span
        className={`font-bold underline decoration-[#C6A15B]/70 underline-offset-4 px-0.5 print:text-black print:no-underline print:font-bold ${
          isLight ? 'text-[#0A101D]' : 'text-[#EAD096]'
        }`}
      >
        {clean}
      </span>
    );
  };

  const todayFormatted = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  })();

  const handlePrint = () => {
    document.body.classList.add('printing-contract');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-contract');
    }, 1000);
  };

  const paperSectionClass = `rounded-xl border p-4 sm:p-5 space-y-2.5 print:border-0 print:p-0 print:rounded-none print:bg-white ${
    isLight ? 'bg-white border-slate-200/90' : 'bg-[#0E1729]/75 border-slate-800'
  }`;

  const headingClass = `text-xs sm:text-[13px] font-bold uppercase tracking-wide print:text-black print:text-xs ${
    isLight ? 'text-[#101C32]' : 'text-[#EAD096]'
  }`;

  const bodyTextClass = `text-xs leading-relaxed print:text-black print:text-[11px] ${
    isLight ? 'text-slate-700' : 'text-slate-300'
  }`;

  const tableBorderClass = isLight
    ? 'border-slate-300 text-slate-800 print:border-slate-800 print:text-black'
    : 'border-slate-700 text-slate-200 print:border-slate-800 print:text-black';

  const annex1Items = ANNEX_1_ITEMS[language] || ANNEX_1_ITEMS.uz;
  const annex2 = ANNEX_2_RULES[language] || ANNEX_2_RULES.uz;
  const annex3Months = ANNEX_3_MONTHS[language] || ANNEX_3_MONTHS.uz;

  const contractBody = () => {
    if (language === 'ru') {
      return (
        <>
          {/* Document Header */}
          <div className="text-center border-b-2 border-[#C6A15B]/60 pb-4 space-y-1 print:border-black">
            <h2 className={`text-sm sm:text-base font-bold uppercase tracking-wide print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
              ДОГОВОР ПОЛЬЗОВАНИЯ И ПРОЖИВАНИЯ В СТУДЕНЧЕСКОЙ РЕЗИДЕНЦИИ
            </h2>
            <p className={`text-xs font-semibold print:text-black ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              № ____/26
            </p>
            <div className={`flex flex-wrap items-center justify-between gap-2 text-xs pt-1 print:text-black ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>г. Ташкент</span>
              <span>{todayFormatted}</span>
            </div>
          </div>

          {/* Preamble */}
          <p className={bodyTextClass}>
            С одной стороны, от имени администрации студенческой резиденции{' '}
            <strong>Абдусатторов Абдумумин Абдунаби угли</strong> (далее именуемая <strong>«АДМИНИСТРАЦИЯ»</strong>),
            и с другой стороны, студент Ф.И.О.: <Field value={studentData.fullName} />, ID/паспорт:{' '}
            <Field value={studentData.passportNumber} />, дата рождения: <Field value={studentData.birthDate} />,
            телефон: <Field value={studentData.phone} />, учебное заведение: <Field value={studentData.university} />,
            факультет/направление: <Field value={studentData.faculty} />, курс: <Field value={studentData.course} />,
            группа: <Field value={studentData.group} /> (далее именуемый <strong>«СТУДЕНТ»</strong>), совместно
            именуемые «Стороны», заключили настоящий Договор о нижеследующем:
          </p>

          {/* Sections 1 - 17 */}
          <div className={paperSectionClass}>
            <h3 className={headingClass}>1. ПРЕДМЕТ ДОГОВОРА</h3>
            <p className={bodyTextClass}>1.1. Администрация предоставляет Студенту жилое место для временного проживания и пользования в студенческой резиденции.</p>
            <p className={bodyTextClass}>1.2. Адрес резиденции: г. Ташкент, Алмазарский район, МСГ Замондош, 1-й тупик Умид, дом 22/4.</p>
            <p className={bodyTextClass}>
              1.3. Выделенная Студенту категория комнаты: <Field value={studentData.roomTypeLabel} />, комната № __________, койко-место № __________.
            </p>
            <p className={bodyTextClass}>1.4. Студент использует место исключительно для личного проживания и не вправе передавать его третьим лицам, сдавать в субаренду или постоянно размещать других лиц.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>2. СРОК ДЕЙСТВИЯ ДОГОВОРА</h3>
            <p className={bodyTextClass}>2.1. Срок проживания: с «___» __________ 2026 г. по «___» __________ 202__ г.</p>
            <p className={bodyTextClass}>2.2. Продление срока осуществляется по письменному соглашению Сторон либо путем заключения нового договора.</p>
            <p className={bodyTextClass}>2.3. При отчислении, переводе в другое учебное заведение или утрате права пользования общежитием Студент обязан незамедлительно уведомить Администрацию.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>3. ОБЯЗАННОСТИ РЕЗИДЕНЦИИ</h3>
            <p className={bodyTextClass}>3.1. Оснастить выделенную Студенту комнату необходимым инвентарем (стол, стул, кровать, постельные принадлежности, шкаф для одежды);</p>
            <p className={bodyTextClass}>3.2. Обеспечивать необходимый температурный режим в комнате в зимний период через систему отопления;</p>
            <p className={bodyTextClass}>3.3. Обеспечить объект средствами противопожарной защиты;</p>
            <p className={bodyTextClass}>3.4. Обеспечить условия, соответствующие требованиям центра санитарно-эпидемиологического надзора.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>4. ПРАВА РЕЗИДЕНЦИИ</h3>
            <p className={bodyTextClass}>4.1. Требовать от Студента соблюдения правил пользования студенческой резиденцией;</p>
            <p className={bodyTextClass}>4.2. Выселить Студента в качестве дисциплинарной меры (без возврата уплаченных средств) за нарушение внутреннего распорядка;</p>
            <p className={bodyTextClass}>4.3. Выселить Студента в случае несвоевременной оплаты за пользование студенческой резиденцией.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>5. ОПЛАТА ЗА ПРОЖИВАНИЕ</h3>
            <p className={bodyTextClass}>
              5.1. Точный ежемесячный тариф для Студента:{' '}
              <Field value={studentData.monthlyTariffText ? `${studentData.monthlyTariffText} сум` : ''} />{' '}
              (категория комнаты: <Field value={studentData.roomTypeLabel} />).
            </p>
            <p className={bodyTextClass}>5.2. Оплата производится до ___ числа каждого месяца.</p>
            <p className={bodyTextClass}>5.3. Оплата осуществляется банковской картой, на расчетный счет или иным официальным способом, установленным Администрацией.</p>
            <p className={bodyTextClass}>5.4. Факт оплаты подтверждается чеком, квитанцией, банковским переводом или электронной системой учета.</p>
            <p className={bodyTextClass}>5.5. Несвоевременная оплата фиксируется как задолженность Студента.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>6. ДЕПОЗИТ (ГАРАНТИЙНАЯ СУММА)</h3>
            <p className={bodyTextClass}>6.1. Размер гарантийного депозита Студента составляет: 1 000 000 сум.</p>
            <p className={bodyTextClass}>6.2. Депозит может использоваться для возмещения ущерба комнате, мебели, технике, санитарному оборудованию или иному имуществу, а также для погашения задолженности по договору.</p>
            <p className={bodyTextClass}>6.3. При отсутствии ущерба и задолженности депозит возвращается Студенту в полном объеме в течение 3 рабочих дней после сдачи комнаты и окончательного расчета.</p>
            <p className={bodyTextClass}>6.4. Удержание из депозита осуществляется на основании акта или расчета.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>7. ПРАВА СТУДЕНТА</h3>
            <p className={bodyTextClass}>7.1. Безопасно и по назначению пользоваться местом, указанным в договоре.</p>
            <p className={bodyTextClass}>7.2. Пользоваться местами общего пользования в соответствии с установленными правилами.</p>
            <p className={bodyTextClass}>7.3. Сообщать Администрации о неисправностях, проблемах безопасности и иных недостатках.</p>
            <p className={bodyTextClass}>7.4. Получать информацию о платежах и взаиморасчетах.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>8. ОБЯЗАННОСТИ СТУДЕНТА</h3>
            <p className={bodyTextClass}>8.1. Своевременно вносить оплату за проживание.</p>
            <p className={bodyTextClass}>8.2. Бережно хранить комнату и переданный инвентарь.</p>
            <p className={bodyTextClass}>8.3. Соблюдать правила внутреннего распорядка резиденции.</p>
            <p className={bodyTextClass}>8.4. Уважать покой, безопасность и права других студентов.</p>
            <p className={bodyTextClass}>8.5. Не передавать ключ, карту доступа, мебель, бытовую технику и иное оборудование третьим лицам.</p>
            <p className={bodyTextClass}>8.6. Незамедлительно сообщать Администрации об авариях, пожарной опасности, протечках воды, неисправностях электросети и других опасных ситуациях.</p>
            <p className={bodyTextClass}>8.7. Беречь инвентарь в выделенной комнате и поддерживать чистоту; не использовать в комнате обогреватели, электрочайники и иные самодельные электроприборы.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>9. ПРИЧИНЕНИЕ УЩЕРБА И ОТВЕТСТВЕННОСТЬ</h3>
            <p className={bodyTextClass}>9.1. Студент возмещает материальный ущерб, причиненный по его вине, на основании действующего законодательства и настоящего договора.</p>
            <p className={bodyTextClass}>9.2. Размер ущерба определяется актом, сметой на ремонт/замену, чеком, счетом-фактурой или иными подтверждающими документами.</p>
            <p className={bodyTextClass}>9.3. За естественный износ плата со Студента не взимается.</p>
            <p className={bodyTextClass}>9.4. Если лицо, причинившее ущерб в местах общего пользования, не установлено, распределение ущерба между проживающими допускается исключительно в соответствии с законодательством и отдельным письменным соглашением.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>10. ГОСТИ И ТРЕТЬИ ЛИЦА</h3>
            <p className={bodyTextClass}>10.1. Прием гостей осуществляется во время и в порядке, установленном внутренними правилами.</p>
            <p className={bodyTextClass}>10.2. Постоянное или ночное проживание гостей в резиденции без предварительного согласия Администрации запрещено.</p>
            <p className={bodyTextClass}>10.3. За ущерб, причиненный действиями приглашенного гостя, ответственность в установленном законом порядке несет Студент.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>11. ВНУТРЕННИЙ ПОРЯДОК И ЗАПРЕТЫ</h3>
            <p className={bodyTextClass}>11.1. Время последнего входа в резиденцию: 22:00.</p>
            <p className={bodyTextClass}>11.2. Запрещается нарушать требования пожарной безопасности, курить внутри здания, в комнатах, коридорах и санузлах, неосторожно пользоваться открытым огнем и использовать неразрешенные электроприборы.</p>
            <p className={bodyTextClass}>11.3. На территории резиденции категорически запрещается хранение, употребление или распространение запрещенных законодательством веществ.</p>
            <p className={bodyTextClass}>11.4. Не допускаются ссоры, насилие, угрозы, умышленная порча имущества и иные противоправные действия.</p>
            <p className={bodyTextClass}>11.5. В общих помещениях соблюдаются правила чистоты и санитарии.</p>
            <p className={bodyTextClass}>11.6. Нарушение правил внутреннего распорядка влечет предупреждение, дисциплинарное взыскание или выселение.</p>
            <p className={bodyTextClass}>11.7. Несвоевременная оплата проживания может повлечь применение мер ответственности в соответствии с законодательством либо лишение права проживания.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>12. ЗАДОЛЖЕННОСТЬ И ПРОСРОЧКА ПЛАТЕЖА</h3>
            <p className={bodyTextClass}>12.1. Неуплаченная после истечения срока оплаты сумма учитывается как задолженность Студента.</p>
            <p className={bodyTextClass}>12.2. Администрация вправе уведомлять Студента о задолженности через SMS, Telegram, электронную почту или иные средства связи.</p>
            <p className={bodyTextClass}>12.3. При взыскании задолженности не допускается применение методов, запрещенных законодательством.</p>
            <p className={bodyTextClass}>12.4. При применении штрафа или пени их размер четко указывается в отдельном пункте договора и в соответствии с законодательством.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>13. ДОСРОЧНОЕ РАСТОРЖЕНИЕ ДОГОВОРА</h3>
            <p className={bodyTextClass}>13.1. При добровольном выезде Студент направляет Администрации письменное или электронное уведомление не менее чем за 30 календарных дней.</p>
            <p className={bodyTextClass}>13.2. При грубом или повторном нарушении договора и внутренних правил Администрация вправе расторгнуть договор в установленном законодательством порядке.</p>
            <p className={bodyTextClass}>13.3. Перед выездом Студент сдает комнату и инвентарь, а также проводит окончательный расчет по имеющейся задолженности.</p>
            <p className={bodyTextClass}>13.4. Расторжение договора не освобождает Студента от выполнения обязательств, включая погашение долга и возмещение ущерба.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>14. СМЕНА КОМНАТЫ</h3>
            <p className={bodyTextClass}>14.1. Смена комнаты или койко-места допускается исключительно по согласованию с Администрацией.</p>
            <p className={bodyTextClass}>14.2. При переселении может составляться новый акт приема-передачи помещения.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>15. ПЕРСОНАЛЬНЫЕ ДАННЫЕ</h3>
            <p className={bodyTextClass}>15.1. Студент дает согласие на обработку необходимых персональных данных в целях исполнения договора, организации проживания, обеспечения безопасности и ведения расчетов.</p>
            <p className={bodyTextClass}>15.2. Администрация хранит персональные данные в соответствии с требованиями законодательства и не разглашает их третьим лицам без законных оснований.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>16. РАЗРЕШЕНИЕ СПОРОВ</h3>
            <p className={bodyTextClass}>16.1. Споры разрешаются прежде всего путем переговоров и письменных обращений.</p>
            <p className={bodyTextClass}>16.2. При недостижении согласия спор рассматривается уполномоченным органом или судом в соответствии с действующим законодательством Республики Узбекистан.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>17. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</h3>
            <p className={bodyTextClass}>17.1. Стороны подтверждают, что настоящий договор ими прочитан и содержание его понятно.</p>
            <p className={bodyTextClass}>17.2. Изменения и дополнения к договору оформляются в письменной форме.</p>
            <p className={bodyTextClass}>17.3. Неотъемлемыми частями настоящего договора являются: Приложение 1 — Акт приема-передачи и инвентаря; Приложение 2 — Правила внутреннего распорядка; Приложение 3 — Ведомость учета ежемесячных платежей.</p>
            <p className={bodyTextClass}>17.4. Договор составлен в двух экземплярах, оба экземпляра имеют одинаковую юридическую силу.</p>
          </div>

          {/* Section 18 */}
          <div className={paperSectionClass}>
            <h3 className={headingClass}>18. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</h3>
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse border text-xs ${tableBorderClass}`}>
                <thead>
                  <tr>
                    <th className={`border p-2.5 text-left font-bold w-1/2 ${tableBorderClass}`}>АДМИНИСТРАЦИЯ</th>
                    <th className={`border p-2.5 text-left font-bold w-1/2 ${tableBorderClass}`}>СТУДЕНТ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`border p-3 align-top space-y-1.5 ${tableBorderClass}`}>
                      <p><strong>Наименование:</strong> ROYAL CAMPUS</p>
                      <p><strong>Адрес:</strong> г. Ташкент, Алмазарский район, МСГ Замондош, 1-й тупик Умид, дом 22/4.</p>
                      <p><strong>Телефон:</strong> +998 (70) 522-20-50</p>
                      <p><strong>Р/с:</strong> ______________________________</p>
                      <p><strong>Ответственное лицо:</strong> Абдусатторов А.А.</p>
                      <p className="pt-2"><strong>Подпись:</strong> ________________________</p>
                    </td>
                    <td className={`border p-3 align-top space-y-1.5 ${tableBorderClass}`}>
                      <p><strong>Ф.И.О.:</strong> <Field value={studentData.fullName} /></p>
                      <p><strong>ID/паспорт:</strong> <Field value={studentData.passportNumber} /></p>
                      <p><strong>Телефон:</strong> <Field value={studentData.phone} /></p>
                      <p>
                        <strong>Комната:</strong> <Field value={studentData.roomTypeLabel} /> (№ ______)
                      </p>
                      <p><strong>Место:</strong> № ______</p>
                      <p className="pt-2"><strong>Подпись:</strong> ________________________</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Annex 1 */}
          <div className={`${paperSectionClass} contract-page-break`}>
            <div className="text-center space-y-0.5 pb-2">
              <h3 className={headingClass}>ПРИЛОЖЕНИЕ 1</h3>
              <p className={`text-xs font-bold uppercase print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                АКТ ПРИЕМА-ПЕРЕДАЧИ КОМНАТЫ И ИНВЕНТАРЯ
              </p>
            </div>
            <div className={`${bodyTextClass} space-y-1`}>
              <p>
                <strong>Студент:</strong> <Field value={studentData.fullName} /> &nbsp;&nbsp;
                <strong>Категория / Комната №:</strong> <Field value={studentData.roomTypeLabel} /> / ______ &nbsp;&nbsp;
                <strong>Место №:</strong> ______
              </p>
              <p><strong>Дата:</strong> {todayFormatted}</p>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse border text-xs ${tableBorderClass}`}>
                <thead>
                  <tr>
                    <th className={`border p-2 text-center w-10 ${tableBorderClass}`}>№</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Инвентарь / имущество</th>
                    <th className={`border p-2 text-center w-20 ${tableBorderClass}`}>Кол-во</th>
                    <th className={`border p-2 text-left w-36 ${tableBorderClass}`}>Состояние</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Примечание</th>
                  </tr>
                </thead>
                <tbody>
                  {annex1Items.map((item, idx) => (
                    <tr key={idx}>
                      <td className={`border p-1.5 text-center tabular-nums ${tableBorderClass}`}>{idx + 1}</td>
                      <td className={`border p-1.5 ${tableBorderClass}`}>{item}</td>
                      <td className={`border p-1.5 text-center ${tableBorderClass}`}></td>
                      <td className={`border p-1.5 ${tableBorderClass}`}>__________</td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`${bodyTextClass} space-y-1.5 pt-2`}>
              <p><strong>Сдал:</strong> Абдусатторов А.А. &nbsp;&nbsp; <strong>Подпись:</strong> ______________</p>
              <p><strong>Принял (студент):</strong> <Field value={studentData.fullName} /> &nbsp;&nbsp; <strong>Подпись:</strong> ______________</p>
              <p><strong>Замечания / недостатки:</strong> ______________________________________________________</p>
            </div>
          </div>

          {/* Annex 2 */}
          <div className={`${paperSectionClass} contract-page-break`}>
            <div className="text-center space-y-0.5 pb-2">
              <h3 className={headingClass}>{annex2.title}</h3>
              <p className={`text-xs font-bold uppercase print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                {annex2.subtitle}
              </p>
            </div>
            <ol className="space-y-1.5 list-decimal pl-5">
              {annex2.rules.map((rule, idx) => (
                <li key={idx} className={bodyTextClass}>
                  {rule}
                </li>
              ))}
            </ol>
          </div>

          {/* Annex 3 */}
          <div className={`${paperSectionClass} contract-page-break`}>
            <div className="text-center space-y-0.5 pb-2">
              <h3 className={headingClass}>ПРИЛОЖЕНИЕ 3</h3>
              <p className={`text-xs font-bold uppercase print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                ВЕДОМОСТЬ УЧЕТА ЕЖЕМЕСЯЧНЫХ ПЛАТЕЖЕЙ СТУДЕНТА
              </p>
            </div>
            <div className={`${bodyTextClass} space-y-1 pb-1`}>
              <p>
                <strong>Студент:</strong> <Field value={studentData.fullName} /> &nbsp;&nbsp;|&nbsp;&nbsp;
                <strong>ID/паспорт / Договор №:</strong> <Field value={studentData.passportNumber} /> / ____/26
              </p>
              <p>
                <strong>Выбранная комната и тариф:</strong> <Field value={studentData.roomTypeLabel} /> —{' '}
                <Field value={studentData.monthlyTariffText ? `${studentData.monthlyTariffText} сум` : ''} />
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse border text-xs ${tableBorderClass}`}>
                <thead>
                  <tr>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Месяц</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Тариф</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Дата оплаты</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Оплаченная сумма</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Задолженность</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Примечание</th>
                  </tr>
                </thead>
                <tbody>
                  {annex3Months.map((month, idx) => (
                    <tr key={idx}>
                      <td className={`border p-1.5 ${tableBorderClass}`}>{month}</td>
                      <td className={`border p-1.5 tabular-nums ${tableBorderClass}`}>
                        <Field value={studentData.monthlyTariffText ? `${studentData.monthlyTariffText} сум` : ''} />
                      </td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`${bodyTextClass} space-y-1 pt-2`}>
              <p><strong>Студент ID/договор №:</strong> <Field value={studentData.passportNumber} /></p>
              <p><strong>Ответственное лицо по учету:</strong> Абдусатторов А.А.</p>
            </div>
          </div>
        </>
      );
    }

    if (language === 'en') {
      return (
        <>
          {/* Document Header */}
          <div className="text-center border-b-2 border-[#C6A15B]/60 pb-4 space-y-1 print:border-black">
            <h2 className={`text-sm sm:text-base font-bold uppercase tracking-wide print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
              STUDENT RESIDENCE USAGE &amp; ACCOMMODATION AGREEMENT
            </h2>
            <p className={`text-xs font-semibold print:text-black ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              No. ____/26
            </p>
            <div className={`flex flex-wrap items-center justify-between gap-2 text-xs pt-1 print:text-black ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>Tashkent City</span>
              <span>{todayFormatted}</span>
            </div>
          </div>

          {/* Preamble */}
          <p className={bodyTextClass}>
            On the one part, on behalf of the Student Residence Administration{' '}
            <strong>Abdusattorov Abdumumin Abdunabi ugli</strong> (hereinafter referred to as{' '}
            <strong>&ldquo;ADMINISTRATION&rdquo;</strong>), and on the other part, Student Full Name:{' '}
            <Field value={studentData.fullName} />, ID/Passport: <Field value={studentData.passportNumber} />,
            Date of Birth: <Field value={studentData.birthDate} />, Phone: <Field value={studentData.phone} />,
            University: <Field value={studentData.university} />, Faculty/Major:{' '}
            <Field value={studentData.faculty} />, Academic Year/Course: <Field value={studentData.course} />,
            Group: <Field value={studentData.group} /> (hereinafter referred to as{' '}
            <strong>&ldquo;STUDENT&rdquo;</strong>), collectively referred to as the &ldquo;Parties,&rdquo; have
            entered into this Agreement as follows:
          </p>

          {/* Sections 1 - 17 */}
          <div className={paperSectionClass}>
            <h3 className={headingClass}>1. SUBJECT OF THE AGREEMENT</h3>
            <p className={bodyTextClass}>1.1. Administration provides the Student with an assigned residential space for temporary accommodation and use in the student residence.</p>
            <p className={bodyTextClass}>1.2. Residence address: 22/4 Umid 1st Passage, Zamondosh Mahalla, Olmazor District, Tashkent.</p>
            <p className={bodyTextClass}>
              1.3. Assigned room category: <Field value={studentData.roomTypeLabel} />, Room No. __________, Bed No. __________.
            </p>
            <p className={bodyTextClass}>1.4. The Student shall use the space strictly for personal living purposes and may not transfer it to third parties, sublet it, or permanently accommodate other persons.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>2. TERM OF THE AGREEMENT</h3>
            <p className={bodyTextClass}>2.1. Accommodation period: from &ldquo;___&rdquo; __________ 2026 to &ldquo;___&rdquo; __________ 202__.</p>
            <p className={bodyTextClass}>2.2. Any extension shall be executed by written agreement of the Parties or a new contract.</p>
            <p className={bodyTextClass}>2.3. In the event of academic expulsion, transfer to another institution, or loss of eligibility, the Student shall notify Administration immediately.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>3. OBLIGATIONS OF THE RESIDENCE</h3>
            <p className={bodyTextClass}>3.1. Equip the assigned room with all essential furnishings (desk, chair, bed, bedding, wardrobe);</p>
            <p className={bodyTextClass}>3.2. Maintain adequate indoor heating during the winter season;</p>
            <p className={bodyTextClass}>3.3. Provide fire-safety equipment;</p>
            <p className={bodyTextClass}>3.4. Maintain sanitary conditions meeting Sanitary and Epidemiological Supervision standards.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>4. RIGHTS OF THE RESIDENCE</h3>
            <p className={bodyTextClass}>4.1. Require the Student to comply with residence usage rules;</p>
            <p className={bodyTextClass}>4.2. Terminate residence and evict the Student as a disciplinary measure (without refunding paid fees) for breaches of internal house rules;</p>
            <p className={bodyTextClass}>4.3. Evict the Student for failure to pay monthly residence fees on time.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>5. ACCOMMODATION FEE</h3>
            <p className={bodyTextClass}>
              5.1. Exact monthly tariff for the Student:{' '}
              <Field value={studentData.monthlyTariffText ? `${studentData.monthlyTariffText} UZS` : ''} />{' '}
              (room category: <Field value={studentData.roomTypeLabel} />).
            </p>
            <p className={bodyTextClass}>5.2. Payment shall be made by the ___ day of each month.</p>
            <p className={bodyTextClass}>5.3. Payment is made via bank card, bank account transfer, or other official method approved by Administration.</p>
            <p className={bodyTextClass}>5.4. Payment is confirmed by receipt, bank slip, or electronic billing records.</p>
            <p className={bodyTextClass}>5.5. Failure to pay on time is recorded as Student debt.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>6. SECURITY DEPOSIT</h3>
            <p className={bodyTextClass}>6.1. The refundable security deposit amount is 1,000,000 UZS.</p>
            <p className={bodyTextClass}>6.2. The deposit may cover damage to the room, furniture, appliances, plumbing, or property, as well as unpaid contractual balances.</p>
            <p className={bodyTextClass}>6.3. Provided there is no damage or outstanding debt, the deposit is refunded in full to the Student within 3 business days after room handover and final settlement.</p>
            <p className={bodyTextClass}>6.4. Deductions from the deposit are executed strictly based on an inspection act or settlement calculation.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>7. RIGHTS OF THE STUDENT</h3>
            <p className={bodyTextClass}>7.1. Use the assigned residential space safely and in accordance with its intended purpose.</p>
            <p className={bodyTextClass}>7.2. Use common facilities under established house rules.</p>
            <p className={bodyTextClass}>7.3. Report maintenance issues, security concerns, or defects to Administration.</p>
            <p className={bodyTextClass}>7.4. Receive statements regarding payments and account balances.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>8. OBLIGATIONS OF THE STUDENT</h3>
            <p className={bodyTextClass}>8.1. Pay monthly residence fees on time.</p>
            <p className={bodyTextClass}>8.2. Take proper care of the room and issued inventory.</p>
            <p className={bodyTextClass}>8.3. Comply with internal residence house rules.</p>
            <p className={bodyTextClass}>8.4. Respect the peace, safety, and rights of fellow residents.</p>
            <p className={bodyTextClass}>8.5. Never lend keys, access cards, furniture, appliances, or fixtures to third parties.</p>
            <p className={bodyTextClass}>8.6. Immediately notify Administration of leaks, fire hazards, electrical faults, or emergencies.</p>
            <p className={bodyTextClass}>8.7. Preserve room furnishings and maintain cleanliness; refrain from using unauthorized space heaters, electric kettles, or makeshift electrical appliances inside rooms.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>9. PROPERTY DAMAGE &amp; LIABILITY</h3>
            <p className={bodyTextClass}>9.1. The Student shall compensate material damage caused by their fault under applicable law and this Agreement.</p>
            <p className={bodyTextClass}>9.2. Damage amounts are determined by an official act, repair/replacement estimate, receipt, invoice, or supporting documentation.</p>
            <p className={bodyTextClass}>9.3. The Student shall not be charged for normal wear and tear.</p>
            <p className={bodyTextClass}>9.4. Where the responsible party in a shared area cannot be identified, collective allocation among residents may occur strictly in accordance with law and a separate written agreement.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>10. GUESTS &amp; THIRD PARTIES</h3>
            <p className={bodyTextClass}>10.1. Visitors are admitted during hours and procedures set by internal house rules.</p>
            <p className={bodyTextClass}>10.2. Permanent or overnight stays by guests without prior consent of Administration are prohibited.</p>
            <p className={bodyTextClass}>10.3. The Student is legally liable for any damage caused by their invited guests.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>11. INTERNAL ORDER &amp; PROHIBITIONS</h3>
            <p className={bodyTextClass}>11.1. Curfew / last entry time to the residence: 22:00.</p>
            <p className={bodyTextClass}>11.2. Violating fire safety rules, smoking anywhere inside the building (rooms, corridors, bathrooms), unsafe open-flame use, and unapproved electrical appliances are prohibited.</p>
            <p className={bodyTextClass}>11.3. Storing, consuming, or distributing legally prohibited substances on residence premises is strictly forbidden.</p>
            <p className={bodyTextClass}>11.4. Fighting, violence, threats, intentional property destruction, and unlawful conduct are prohibited.</p>
            <p className={bodyTextClass}>11.5. Cleanliness and sanitary norms must be upheld in shared spaces.</p>
            <p className={bodyTextClass}>11.6. Violations may result in formal warnings, disciplinary measures, or termination of residency.</p>
            <p className={bodyTextClass}>11.7. Failure to pay accommodation fees within the due period may result in statutory penalties or loss of residential rights.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>12. DEBT &amp; LATE PAYMENTS</h3>
            <p className={bodyTextClass}>12.1. Unpaid amounts after the due date are recorded as Student debt.</p>
            <p className={bodyTextClass}>12.2. Administration may notify the Student of overdue balances via SMS, Telegram, email, or other channels.</p>
            <p className={bodyTextClass}>12.3. Unlawful methods of debt collection are strictly prohibited.</p>
            <p className={bodyTextClass}>12.4. Any applicable fine or late fee shall be clearly specified in a dedicated clause and comply with applicable law.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>13. EARLY TERMINATION</h3>
            <p className={bodyTextClass}>13.1. For voluntary check-out, the Student must provide written or electronic notice at least 30 calendar days in advance.</p>
            <p className={bodyTextClass}>13.2. In cases of serious or repeated violations of this Agreement and house rules, Administration may initiate termination in accordance with law.</p>
            <p className={bodyTextClass}>13.3. Prior to departure, the Student must hand over the room and inventory and complete final financial settlement.</p>
            <p className={bodyTextClass}>13.4. Termination does not extinguish existing obligations to settle outstanding debt or property damage.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>14. ROOM REASSIGNMENT</h3>
            <p className={bodyTextClass}>14.1. Changing a room or bed is permitted solely with Administration’s prior approval.</p>
            <p className={bodyTextClass}>14.2. A new handover act may be executed upon room reassignment.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>15. PERSONAL DATA</h3>
            <p className={bodyTextClass}>15.1. The Student consents to the processing of necessary personal data for contract performance, accommodation, security, and billing.</p>
            <p className={bodyTextClass}>15.2. Administration safeguards personal data as required by law and will not disclose it to third parties without lawful grounds.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>16. DISPUTE RESOLUTION</h3>
            <p className={bodyTextClass}>16.1. Disputes shall first be resolved through negotiation and written correspondence.</p>
            <p className={bodyTextClass}>16.2. Failing settlement, disputes shall be referred to the competent authority or court under the laws of the Republic of Uzbekistan.</p>
          </div>

          <div className={paperSectionClass}>
            <h3 className={headingClass}>17. FINAL PROVISIONS</h3>
            <p className={bodyTextClass}>17.1. The Parties confirm they have read and fully understood this Agreement.</p>
            <p className={bodyTextClass}>17.2. Amendments and supplements must be executed in writing.</p>
            <p className={bodyTextClass}>17.3. Integral annexes: Annex 1 — Room &amp; Inventory Handover Act; Annex 2 — Internal House Rules; Annex 3 — Monthly Payment Tracking Sheet.</p>
            <p className={bodyTextClass}>17.4. Executed in two counterparts of equal legal force.</p>
          </div>

          {/* Section 18 */}
          <div className={paperSectionClass}>
            <h3 className={headingClass}>18. PARTY DETAILS &amp; SIGNATURES</h3>
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse border text-xs ${tableBorderClass}`}>
                <thead>
                  <tr>
                    <th className={`border p-2.5 text-left font-bold w-1/2 ${tableBorderClass}`}>ADMINISTRATION</th>
                    <th className={`border p-2.5 text-left font-bold w-1/2 ${tableBorderClass}`}>STUDENT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`border p-3 align-top space-y-1.5 ${tableBorderClass}`}>
                      <p><strong>Name:</strong> ROYAL CAMPUS</p>
                      <p><strong>Address:</strong> 22/4 Umid 1st Passage, Zamondosh Mahalla, Olmazor District, Tashkent.</p>
                      <p><strong>Phone:</strong> +998 (70) 522-20-50</p>
                      <p><strong>Account:</strong> ______________________________</p>
                      <p><strong>Authorized Representative:</strong> Abdusattorov A.A.</p>
                      <p className="pt-2"><strong>Signature:</strong> ________________________</p>
                    </td>
                    <td className={`border p-3 align-top space-y-1.5 ${tableBorderClass}`}>
                      <p><strong>Full Name:</strong> <Field value={studentData.fullName} /></p>
                      <p><strong>ID / Passport:</strong> <Field value={studentData.passportNumber} /></p>
                      <p><strong>Phone:</strong> <Field value={studentData.phone} /></p>
                      <p><strong>Room:</strong> <Field value={studentData.roomTypeLabel} /> (No. ______)</p>
                      <p><strong>Bed:</strong> No. ______</p>
                      <p className="pt-2"><strong>Signature:</strong> ________________________</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Annex 1 */}
          <div className={`${paperSectionClass} contract-page-break`}>
            <div className="text-center space-y-0.5 pb-2">
              <h3 className={headingClass}>ANNEX 1</h3>
              <p className={`text-xs font-bold uppercase print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                ROOM &amp; INVENTORY HANDOVER ACT
              </p>
            </div>
            <div className={`${bodyTextClass} space-y-1`}>
              <p>
                <strong>Student:</strong> <Field value={studentData.fullName} /> &nbsp;&nbsp;
                <strong>Category / Room No.:</strong> <Field value={studentData.roomTypeLabel} /> / ______ &nbsp;&nbsp;
                <strong>Bed No.:</strong> ______
              </p>
              <p><strong>Date:</strong> {todayFormatted}</p>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse border text-xs ${tableBorderClass}`}>
                <thead>
                  <tr>
                    <th className={`border p-2 text-center w-10 ${tableBorderClass}`}>No.</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Inventory / Equipment</th>
                    <th className={`border p-2 text-center w-20 ${tableBorderClass}`}>Qty</th>
                    <th className={`border p-2 text-left w-36 ${tableBorderClass}`}>Condition</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {annex1Items.map((item, idx) => (
                    <tr key={idx}>
                      <td className={`border p-1.5 text-center tabular-nums ${tableBorderClass}`}>{idx + 1}</td>
                      <td className={`border p-1.5 ${tableBorderClass}`}>{item}</td>
                      <td className={`border p-1.5 text-center ${tableBorderClass}`}></td>
                      <td className={`border p-1.5 ${tableBorderClass}`}>__________</td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`${bodyTextClass} space-y-1.5 pt-2`}>
              <p><strong>Handed over by:</strong> Abdusattorov A.A. &nbsp;&nbsp; <strong>Signature:</strong> ______________</p>
              <p><strong>Received by (Student):</strong> <Field value={studentData.fullName} /> &nbsp;&nbsp; <strong>Signature:</strong> ______________</p>
              <p><strong>Notes / Defects:</strong> ______________________________________________________</p>
            </div>
          </div>

          {/* Annex 2 */}
          <div className={`${paperSectionClass} contract-page-break`}>
            <div className="text-center space-y-0.5 pb-2">
              <h3 className={headingClass}>{annex2.title}</h3>
              <p className={`text-xs font-bold uppercase print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                {annex2.subtitle}
              </p>
            </div>
            <ol className="space-y-1.5 list-decimal pl-5">
              {annex2.rules.map((rule, idx) => (
                <li key={idx} className={bodyTextClass}>
                  {rule}
                </li>
              ))}
            </ol>
          </div>

          {/* Annex 3 */}
          <div className={`${paperSectionClass} contract-page-break`}>
            <div className="text-center space-y-0.5 pb-2">
              <h3 className={headingClass}>ANNEX 3</h3>
              <p className={`text-xs font-bold uppercase print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
                MONTHLY PAYMENT TRACKING SHEET
              </p>
            </div>
            <div className={`${bodyTextClass} space-y-1 pb-1`}>
              <p>
                <strong>Student:</strong> <Field value={studentData.fullName} /> &nbsp;&nbsp;|&nbsp;&nbsp;
                <strong>ID / Passport / Contract No.:</strong> <Field value={studentData.passportNumber} /> / ____/26
              </p>
              <p>
                <strong>Selected Room &amp; Monthly Rate:</strong> <Field value={studentData.roomTypeLabel} /> —{' '}
                <Field value={studentData.monthlyTariffText ? `${studentData.monthlyTariffText} UZS` : ''} />
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse border text-xs ${tableBorderClass}`}>
                <thead>
                  <tr>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Month</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Rate</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Payment Date</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Amount Paid</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Balance Due</th>
                    <th className={`border p-2 text-left ${tableBorderClass}`}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {annex3Months.map((month, idx) => (
                    <tr key={idx}>
                      <td className={`border p-1.5 ${tableBorderClass}`}>{month}</td>
                      <td className={`border p-1.5 tabular-nums ${tableBorderClass}`}>
                        <Field value={studentData.monthlyTariffText ? `${studentData.monthlyTariffText} UZS` : ''} />
                      </td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                      <td className={`border p-1.5 ${tableBorderClass}`}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`${bodyTextClass} space-y-1 pt-2`}>
              <p><strong>Student ID / Contract No.:</strong> <Field value={studentData.passportNumber} /></p>
              <p><strong>Accounting Officer:</strong> Abdusattorov A.A.</p>
            </div>
          </div>
        </>
      );
    }

    // Default: Official Uzbek (Cyrillic) 18-section contract + 1-, 2-, 3-ilovalar with all spelling/address/officer fixes
    return (
      <>
        {/* Document Header */}
        <div className="text-center border-b-2 border-[#C6A15B]/60 pb-4 space-y-1 print:border-black">
          <h2 className={`text-sm sm:text-base font-bold uppercase tracking-wide print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
            ТАЛАБАЛАР ТУРАР ЖОЙИДАН ФОЙДАЛАНИШ ВА ЯШАШ ШАРТНОМАСИ
          </h2>
          <p className={`text-xs font-semibold print:text-black ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            № ____/26
          </p>
          <div className={`flex flex-wrap items-center justify-between gap-2 text-xs pt-1 print:text-black ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <span>Тошкент шаҳри</span>
            <span>{todayFormatted}</span>
          </div>
        </div>

        {/* Preamble */}
        <p className={bodyTextClass}>
          Бир томондан, талабалар турар жойи маъмурияти номидан{' '}
          <strong>Абдусатторов Абдумўмин Абдунаби ўғли</strong>, бундан буён{' '}
          <strong>“МАЪМУРИЯТ”</strong> деб юритилади, иккинчи томондан, талабанинг Ф.И.Ш.:{' '}
          <Field value={studentData.fullName} />, ID/паспорт:{' '}
          <Field value={studentData.passportNumber} />, туғилган сана:{' '}
          <Field value={studentData.birthDate} />, телефон:{' '}
          <Field value={studentData.phone} />, таълим муассасаси:{' '}
          <Field value={studentData.university} />, факультет/йўналиш:{' '}
          <Field value={studentData.faculty} />, курс:{' '}
          <Field value={studentData.course} />, гуруҳ:{' '}
          <Field value={studentData.group} />, бундан буён{' '}
          <strong>“ТАЛАБА”</strong> деб юритилади, биргаликда “Томонлар” деб аталувчилар ушбу шартномани туздилар.
        </p>

        {/* 1 - 17 Sections */}
        <div className={paperSectionClass}>
          <h3 className={headingClass}>1. ШАРТНОМА ПРЕДМЕТИ</h3>
          <p className={bodyTextClass}>1.1. Маъмурият Талабага талабалар турар жойида вақтинча яшаш ва фойдаланиш учун белгиланган жойни тақдим этади.</p>
          <p className={bodyTextClass}>1.2. Турар жой манзили: Тошкент шаҳри, Олмазор тумани, Замондош МФЙ, Умид 1-тор кўчаси, 22/4-уй.</p>
          <p className={bodyTextClass}>
            1.3. Талабага ажратилган хона тоифаси: <Field value={studentData.roomTypeLabel} />, хона № __________, ўрин/каравот № __________.
          </p>
          <p className={bodyTextClass}>1.4. Талаба жойни фақат шахсий яшаш мақсадида ишлатади ва уни учинчи шахсга бериш, қайта ижарага топшириш ёки доимий равишда бошқа шахсни жойлаштиришга ҳақли эмас.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>2. ШАРТНОМА МУДДАТИ</h3>
          <p className={bodyTextClass}>2.1. Яшаш муддати: “___” __________ 2026 йилдан “___” __________ 202__ йилгача.</p>
          <p className={bodyTextClass}>2.2. Муддатни узайтириш Томонларнинг ёзма келишуви ёки янги шартнома асосида амалга оширилади.</p>
          <p className={bodyTextClass}>2.3. Талаба ўқишдан четлаштирилган, ўқишини бошқа жойга кўчирган ёки турар жойдан фойдаланиш ҳуқуқини йўқотган тақдирда Маъмуриятга зудлик билан хабар беради.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>3. ЁТОҚХОНАНИНГ МАЖБУРИЯТЛАРИ</h3>
          <p className={bodyTextClass}>3.1. “Талаба”га ажратилган хонани барча анжомлар билан жиҳозлаш (стол-стул, кроват, чойшаблар, кийим жавони);</p>
          <p className={bodyTextClass}>3.2. Хонада қишки мавсумда иситиш тизими орқали керакли ҳароратни таъминлаш;</p>
          <p className={bodyTextClass}>3.3. Ёнғинга қарши воситалар билан таъминлаш;</p>
          <p className={bodyTextClass}>3.4. Санитария-эпидемиология назорати маркази талабларига жавоб берадиган шароит яратиш.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>4. ЁТОҚХОНАНИНГ ҲУҚУҚЛАРИ</h3>
          <p className={bodyTextClass}>4.1. “Талаба”дан Талабалар турар жойидан фойдаланиш қоидаларига риоя қилишни талаб қилиш;</p>
          <p className={bodyTextClass}>4.2. Талабалар турар жойи ички тартибини бузганлиги учун “Талаба”ни интизомий чора сифатида (тўланган маблағни қайтармаган ҳолда) талабалар турар жойидан чиқариш;</p>
          <p className={bodyTextClass}>4.3. Талабалар турар жойидан фойдаланганлиги учун тўловларни ўз вақтида тўламаганлик учун “Талаба”ни талабалар турар жойидан чиқариш.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>5. ЯШАШ ТЎЛОВИ</h3>
          <p className={bodyTextClass}>
            5.1. Талаба учун аниқ ойлик тариф:{' '}
            <Field value={studentData.monthlyTariffText ? `${studentData.monthlyTariffText} сўм` : ''} />{' '}
            (хона тоифаси: <Field value={studentData.roomTypeLabel} />).
          </p>
          <p className={bodyTextClass}>5.2. Тўлов ҳар ойнинг ___ санасига қадар амалга оширилади.</p>
          <p className={bodyTextClass}>5.3. Тўлов банк картаси, ҳисоб рақами ёки Маъмурият белгилаган бошқа расмий усулда амалга оширилади.</p>
          <p className={bodyTextClass}>5.4. Тўлов факти чек, квитанция, банк тўлови ёки электрон ҳисоб тизими орқали тасдиқланади.</p>
          <p className={bodyTextClass}>5.5. Талабанинг тўловни ўз вақтида амалга оширмаслиги қарздорлик сифатида қайд этилади.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>6. ДЕПОЗИТ (КАФОЛАТ ПУЛИ)</h3>
          <p className={bodyTextClass}>6.1. Талабадан кафолат депозити миқдори: 1 000 000 сўм.</p>
          <p className={bodyTextClass}>6.2. Депозит хона, мебель, техника, санитария жиҳозлари ёки бошқа мол-мулкка етказилган зарарни, шунингдек шартнома бўйича қарздорликни қоплаш учун ишлатилиши мумкин.</p>
          <p className={bodyTextClass}>6.3. Зарар ёки қарздорлик бўлмаса, депозит хона топширилгандан ва якуний ҳисоб-китоб қилингандан сўнг 3 иш куни ичида Талабага тўлиқ қайтарилади.</p>
          <p className={bodyTextClass}>6.4. Депозитдан ушлаб қолиш далолатнома ёки ҳисоб-китоб асосида амалга оширилади.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>7. ТАЛАБАНИНГ ҲУҚУҚЛАРИ</h3>
          <p className={bodyTextClass}>7.1. Шартномада кўрсатилган жойдан хавфсиз ва мақсадга мувофиқ фойдаланиш.</p>
          <p className={bodyTextClass}>7.2. Умумий фойдаланиш жойларидан белгиланган қоидалар асосида фойдаланиш.</p>
          <p className={bodyTextClass}>7.3. Маъмуриятга носозликлар, хавфсизлик муаммолари ва бошқа камчиликлар ҳақида хабар бериш.</p>
          <p className={bodyTextClass}>7.4. Тўловлар ва ҳисоб-китоблар бўйича маълумот олиш.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>8. ТАЛАБАНИНГ МАЖБУРИЯТЛАРИ</h3>
          <p className={bodyTextClass}>8.1. Яшаш тўловларини ўз вақтида амалга ошириш.</p>
          <p className={bodyTextClass}>8.2. Хона ва берилган инвентарни эҳтиёткорлик билан сақлаш.</p>
          <p className={bodyTextClass}>8.3. Ётоқхона ички тартиб-қоидаларига риоя қилиш.</p>
          <p className={bodyTextClass}>8.4. Бошқа талабаларнинг тинчлиги, хавфсизлиги ва ҳуқуқларини ҳурмат қилиш.</p>
          <p className={bodyTextClass}>8.5. Калит, карта, мебель, маиший техника ва бошқа жиҳозларни учинчи шахсларга бермаслик.</p>
          <p className={bodyTextClass}>8.6. Аниқланган авария, ёнғин хавфи, сув оқиши, электр носозлиги ва бошқа хавфли ҳолатлар ҳақида дарҳол Маъмуриятга хабар бериш.</p>
          <p className={bodyTextClass}>8.7. Ажратилган хонадаги анжомларни асраб-авайлаш, хона тозалигини таъминлаш; хонада иситиш мосламалари, электр чойнак ва бошқа қўлбола электр ускуналаридан фойдаланмаслик.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>9. ЗАРАР ЕТКАЗИШ ВА ЖАВОБГАРЛИК</h3>
          <p className={bodyTextClass}>9.1. Талаба ўз айби билан етказган моддий зарарни амалдаги қонунчилик ва ушбу шартнома асосида қоплайди.</p>
          <p className={bodyTextClass}>9.2. Зарар миқдори далолатнома, таъмирлаш/алмаштириш сметаси, чек, ҳисоб-фактура ёки бошқа тасдиқловчи ҳужжатлар асосида белгиланади.</p>
          <p className={bodyTextClass}>9.3. Табиий эскириш натижасида юзага келган ҳолатлар учун Талабадан ҳақ ундирилмайди.</p>
          <p className={bodyTextClass}>9.4. Биргаликда фойдаланиладиган жойда зарар етказган шахс аниқланмаса, зарарни барча яшовчиларга автоматик равишда тақсимлаш фақат қонунчилик ва алоҳида ёзма келишувга мувофиқ амалга оширилиши мумкин.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>10. МЕҲМОНЛАР ВА УЧИНЧИ ШАХСЛАР</h3>
          <p className={bodyTextClass}>10.1. Меҳмонларни қабул қилиш ётоқхона ички қоидаларида белгиланган вақт ва тартибда амалга оширилади.</p>
          <p className={bodyTextClass}>10.2. Меҳмоннинг ётоқхонада доимий ёки тунги яшаши Маъмуриятнинг олдиндан розилигисиз тақиқланади.</p>
          <p className={bodyTextClass}>10.3. Талаба таклиф қилган меҳмоннинг хатти-ҳаракатлари натижасида етказилган зарар учун Талаба қонунчиликда белгиланган тартибда жавобгар бўлади.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>11. ИЧКИ ТАРТИБ ВА ТАҚИҚЛАР</h3>
          <p className={bodyTextClass}>11.1. Ётоқхонага охирги кириш вақти: 22:00.</p>
          <p className={bodyTextClass}>11.2. Ёнғин хавфсизлиги талабларини бузиш, бино ичкарисида, хоналарда, коридор ва ҳаммомларда сигарет чекиш, очиқ оловдан хавфли фойдаланиш ва рухсат этилмаган электр қурилмаларидан фойдаланиш тақиқланади.</p>
          <p className={bodyTextClass}>11.3. Ётоқхона ҳудудида қонунчилик билан тақиқланган моддаларни сақлаш, истеъмол қилиш ёки тарқатиш қатъиян тақиқланади.</p>
          <p className={bodyTextClass}>11.4. Жанжал, зўравонлик, таҳдид, қасддан мол-мулкни бузиш ва бошқа қонунга хилоф ҳаракатларга йўл қўйилмайди.</p>
          <p className={bodyTextClass}>11.5. Умумий жойларда тозалик ва санитария қоидаларига риоя қилинади.</p>
          <p className={bodyTextClass}>11.6. Ётоқхонанинг ички тартиб-қоидаларини бузган тақдирда, огоҳлантириш, интизомий чора кўриш ёки яшашдан четлаштириш тарзида жавобгарликка тортилади.</p>
          <p className={bodyTextClass}>11.7. Ётоқхона тўловини белгиланган муддатда амалга оширмаган тақдирда, қонунчиликка мувофиқ жарима қўлланилиши ёки яшаш ҳуқуқидан маҳрум этилиши мумкин.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>12. ҚАРЗДОРЛИК ВА ТЎЛОВНИ КЕЧИКТИРИШ</h3>
          <p className={bodyTextClass}>12.1. Тўлов муддати ўтганидан кейин тўланмаган сумма Талабанинг қарздорлиги сифатида ҳисобга олинади.</p>
          <p className={bodyTextClass}>12.2. Маъмурият Талабага қарздорлик ҳақида SMS, Telegram, электрон почта ёки бошқа алоқа воситаси орқали хабар бериши мумкин.</p>
          <p className={bodyTextClass}>12.3. Қарздорликни ундиришда қонунчиликда тақиқланган усуллардан фойдаланишга йўл қўйилмайди.</p>
          <p className={bodyTextClass}>12.4. Жарима ёки пеня қўлланиладиган бўлса, унинг миқдори ушбу шартноманинг алоҳида бандида ва қонунчиликка мувофиқ аниқ кўрсатилади.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>13. ШАРТНОМАНИ МУДДАТИДАН ОЛДИН БЕКОР ҚИЛИШ</h3>
          <p className={bodyTextClass}>13.1. Талаба ўз хоҳиши билан чиқиб кетмоқчи бўлса, камида 30 календарь кун олдин Маъмуриятга ёзма ёки электрон хабар беради.</p>
          <p className={bodyTextClass}>13.2. Талаба шартнома ва ички қоидаларни жиддий ёки такрорий бузган тақдирда, Маъмурият қонунчиликда белгиланган тартибда шартномани бекор қилиш чораларини кўриши мумкин.</p>
          <p className={bodyTextClass}>13.3. Талаба чиқиб кетишдан олдин хона ва инвентарни топширади ҳамда мавжуд қарздорлик бўйича якуний ҳисоб-китоб қилади.</p>
          <p className={bodyTextClass}>13.4. Шартномани бекор қилиш Талабанинг мажбуриятларини, шу жумладан мавжуд қарздорлик ва зарарни қоплаш мажбуриятини бекор қилмайди.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>14. ХОНАНИ АЛМАШТИРИШ</h3>
          <p className={bodyTextClass}>14.1. Хона ёки ўринни алмаштириш фақат Маъмурият билан келишилган ҳолда амалга оширилади.</p>
          <p className={bodyTextClass}>14.2. Хона алмаштирилганда янги жой бўйича қабул қилиш-топшириш далолатномаси тузилиши мумкин.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>15. ШАХСИЙ (ПЕРСОНАЛ) МАЪЛУМОТЛАР</h3>
          <p className={bodyTextClass}>15.1. Талаба шартномани бажариш, яшашни ташкил этиш, хавфсизлик, тўлов ва ҳисоб-китобларни юритиш мақсадида зарур шахсий маълумотларига ишлов берилишига розилик беради.</p>
          <p className={bodyTextClass}>15.2. Маъмурият шахсий маълумотларни қонунчилик талабларига мувофиқ сақлайди ва учинчи шахсларга асоссиз равишда ошкор қилмайди.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>16. НИЗОЛАРНИ ҲАЛ ҚИЛИШ</h3>
          <p className={bodyTextClass}>16.1. Низолар аввало музокара ва ёзма мурожаат орқали ҳал этилади.</p>
          <p className={bodyTextClass}>16.2. Келишувга эришилмаса, низо Ўзбекистон Республикасининг амалдаги қонунчилигига мувофиқ ваколатли орган ёки судда кўриб чиқилади.</p>
        </div>

        <div className={paperSectionClass}>
          <h3 className={headingClass}>17. ЯКУНИЙ ҚОИДАЛАР</h3>
          <p className={bodyTextClass}>17.1. Ушбу шартнома Томонлар томонидан ўқиб чиқилган ва мазмуни тушунарли эканлиги тасдиқланади.</p>
          <p className={bodyTextClass}>17.2. Шартномага ўзгартириш ва қўшимчалар ёзма шаклда расмийлаштирилади.</p>
          <p className={bodyTextClass}>17.3. Ушбу шартноманинг ажралмас қисмлари: 1-илова — қабул қилиш-топшириш ва инвентар далолатномаси; 2-илова — ички тартиб-қоидалар; 3-илова — талабанинг ойлик тўловларини ҳисобга олиш варағи.</p>
          <p className={bodyTextClass}>17.4. Шартнома икки нусхада тузилади, ҳар икки нусха бир хил юридик кучга эга.</p>
        </div>

        {/* Section 18 */}
        <div className={paperSectionClass}>
          <h3 className={headingClass}>18. ТОМОНЛАРНИНГ РЕКВИЗИТЛАРИ ВА ИМЗОЛАРИ</h3>
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse border text-xs ${tableBorderClass}`}>
              <thead>
                <tr>
                  <th className={`border p-2.5 text-left font-bold w-1/2 ${tableBorderClass}`}>МАЪМУРИЯТ</th>
                  <th className={`border p-2.5 text-left font-bold w-1/2 ${tableBorderClass}`}>ТАЛАБА</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`border p-3 align-top space-y-1.5 ${tableBorderClass}`}>
                    <p><strong>Номи:</strong> ROYAL CAMPUS</p>
                    <p><strong>Манзил:</strong> Тошкент шаҳри, Олмазор тумани, Замондош МФЙ, Умид 1-тор кўчаси, 22/4-уй.</p>
                    <p><strong>Телефон:</strong> +998 (70) 522-20-50</p>
                    <p><strong>Ҳ/р:</strong> ______________________________</p>
                    <p><strong>Масъул шахс:</strong> Абдусатторов А.А.</p>
                    <p className="pt-2"><strong>Имзо:</strong> ________________________</p>
                  </td>
                  <td className={`border p-3 align-top space-y-1.5 ${tableBorderClass}`}>
                    <p><strong>Ф.И.Ш.:</strong> <Field value={studentData.fullName} /></p>
                    <p><strong>ID/паспорт:</strong> <Field value={studentData.passportNumber} /></p>
                    <p><strong>Телефон:</strong> <Field value={studentData.phone} /></p>
                    <p>
                      <strong>Турар жой хонаси:</strong> <Field value={studentData.roomTypeLabel} /> (№ ______)
                    </p>
                    <p><strong>Ўрин:</strong> № ______</p>
                    <p className="pt-2"><strong>Имзо:</strong> ________________________</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 1-ILOVA */}
        <div className={`${paperSectionClass} contract-page-break`}>
          <div className="text-center space-y-0.5 pb-2">
            <h3 className={headingClass}>1-ИЛОВА</h3>
            <p className={`text-xs font-bold uppercase print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
              ҚАБУЛ ҚИЛИШ-ТОПШИРИШ ВА ИНВЕНТАР ДАЛОЛАТНОМАСИ
            </p>
          </div>
          <div className={`${bodyTextClass} space-y-1`}>
            <p>
              <strong>Талаба:</strong> <Field value={studentData.fullName} /> &nbsp;&nbsp;
              <strong>Хона тоифаси / №:</strong> <Field value={studentData.roomTypeLabel} /> / ______ &nbsp;&nbsp;
              <strong>Ўрин №:</strong> ______
            </p>
            <p><strong>Сана:</strong> {todayFormatted}</p>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse border text-xs ${tableBorderClass}`}>
              <thead>
                <tr>
                  <th className={`border p-2 text-center w-10 ${tableBorderClass}`}>№</th>
                  <th className={`border p-2 text-left ${tableBorderClass}`}>Инвентар / жиҳоз</th>
                  <th className={`border p-2 text-center w-20 ${tableBorderClass}`}>Сони</th>
                  <th className={`border p-2 text-left w-36 ${tableBorderClass}`}>Ҳолати</th>
                  <th className={`border p-2 text-left ${tableBorderClass}`}>Изоҳ</th>
                </tr>
              </thead>
              <tbody>
                {annex1Items.map((item, idx) => (
                  <tr key={idx}>
                    <td className={`border p-1.5 text-center tabular-nums ${tableBorderClass}`}>{idx + 1}</td>
                    <td className={`border p-1.5 ${tableBorderClass}`}>{item}</td>
                    <td className={`border p-1.5 text-center ${tableBorderClass}`}></td>
                    <td className={`border p-1.5 ${tableBorderClass}`}>__________</td>
                    <td className={`border p-1.5 ${tableBorderClass}`}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`${bodyTextClass} space-y-1.5 pt-2`}>
            <p><strong>Топширувчи:</strong> Абдусатторов А.А. &nbsp;&nbsp; <strong>Имзо:</strong> ______________</p>
            <p><strong>Қабул қилувчи (талаба):</strong> <Field value={studentData.fullName} /> &nbsp;&nbsp; <strong>Имзо:</strong> ______________</p>
            <p><strong>Изоҳ / камчиликлар:</strong> ______________________________________________________</p>
          </div>
        </div>

        {/* 2-ILOVA */}
        <div className={`${paperSectionClass} contract-page-break`}>
          <div className="text-center space-y-0.5 pb-2">
            <h3 className={headingClass}>{annex2.title}</h3>
            <p className={`text-xs font-bold uppercase print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
              {annex2.subtitle}
            </p>
          </div>
          <ol className="space-y-1.5 list-decimal pl-5">
            {annex2.rules.map((rule, idx) => (
              <li key={idx} className={bodyTextClass}>
                {rule}
              </li>
            ))}
          </ol>
        </div>

        {/* 3-ILOVA */}
        <div className={`${paperSectionClass} contract-page-break`}>
          <div className="text-center space-y-0.5 pb-2">
            <h3 className={headingClass}>3-ИЛОВА</h3>
            <p className={`text-xs font-bold uppercase print:text-black ${isLight ? 'text-[#0A101D]' : 'text-white'}`}>
              ТАЛАБАНИНГ ОЙЛИК ТЎЛОВЛАРИНИ ҲИСОБГА ОЛИШ ВАРАҒИ
            </p>
          </div>
          <div className={`${bodyTextClass} space-y-1 pb-1`}>
            <p>
              <strong>Талаба:</strong> <Field value={studentData.fullName} /> &nbsp;&nbsp;|&nbsp;&nbsp;
              <strong>ID/паспорт / Шартнома №:</strong> <Field value={studentData.passportNumber} /> / ____/26
            </p>
            <p>
              <strong>Танланган хона ва ойлик тариф:</strong> <Field value={studentData.roomTypeLabel} /> —{' '}
              <Field value={studentData.monthlyTariffText ? `${studentData.monthlyTariffText} сўм` : ''} />
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse border text-xs ${tableBorderClass}`}>
              <thead>
                <tr>
                  <th className={`border p-2 text-left ${tableBorderClass}`}>Ой</th>
                  <th className={`border p-2 text-left ${tableBorderClass}`}>Тариф</th>
                  <th className={`border p-2 text-left ${tableBorderClass}`}>Тўланган сана</th>
                  <th className={`border p-2 text-left ${tableBorderClass}`}>Тўланган сумма</th>
                  <th className={`border p-2 text-left ${tableBorderClass}`}>Қарздорлик</th>
                  <th className={`border p-2 text-left ${tableBorderClass}`}>Изоҳ</th>
                </tr>
              </thead>
              <tbody>
                {annex3Months.map((month, idx) => (
                  <tr key={idx}>
                    <td className={`border p-1.5 ${tableBorderClass}`}>{month}</td>
                    <td className={`border p-1.5 tabular-nums ${tableBorderClass}`}>
                      <Field value={studentData.monthlyTariffText ? `${studentData.monthlyTariffText} сўм` : ''} />
                    </td>
                    <td className={`border p-1.5 ${tableBorderClass}`}></td>
                    <td className={`border p-1.5 ${tableBorderClass}`}></td>
                    <td className={`border p-1.5 ${tableBorderClass}`}></td>
                    <td className={`border p-1.5 ${tableBorderClass}`}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`${bodyTextClass} space-y-1 pt-2`}>
            <p>
              <strong>Талаба ID / шартнома №:</strong>{' '}
              <Field value={valOrBlank(studentData.passportNumber) === BLANK ? '' : `${studentData.passportNumber} / ____/26`} />
            </p>
            <p><strong>Ҳисоб юритувчи масъул шахс:</strong> Абдусатторов А.А.</p>
          </div>
        </div>
      </>
    );
  };

  return createPortal(
    <div
      className="contract-print-root fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-modal-title"
    >
      <div
        className={`contract-print-modal-card w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-[#0A101D]'
            : 'bg-[#101C32] border-slate-700/80 text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          className={`contract-print-hide flex items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-[#0E1729]'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C6A15B] mb-1">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>{ui.modalBadge}</span>
            </div>
            <h2
              id="contract-modal-title"
              className={`text-xs sm:text-sm font-bold leading-snug ${
                isLight ? 'text-[#0A101D]' : 'text-white'
              }`}
            >
              {ui.modalHeaderTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight
                  ? 'bg-[#101C32] hover:bg-[#1A2D4F] border-[#C6A15B]/50 text-[#EAD096]'
                  : 'bg-[#16233B] hover:bg-[#1E2F4D] border-[#C6A15B]/50 text-[#EAD096]'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span className="hidden sm:inline">{ui.printBtn}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={ui.closeBtn}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-500 hover:text-[#0A101D] hover:border-[#C6A15B]'
                  : 'bg-[#16233B] border-slate-700 text-slate-400 hover:text-white hover:border-[#C6A15B]/60'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Full 18-Section + Annexes 1-3 Body */}
        <div
          className={`contract-print-scroll flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 font-sans ${
            isLight ? 'bg-[#F8FAFC]' : 'bg-[#0B1424]'
          }`}
        >
          {contractBody()}
        </div>

        {/* Sticky Footer with Consent Checkbox, Print PDF, and Confirm */}
        <div
          className={`contract-print-hide px-4 sm:px-6 py-3.5 border-t space-y-3 shrink-0 ${
            isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0E1729]'
          }`}
        >
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => onToggleAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#C6A15B] accent-[#C6A15B] focus:ring-[#C6A15B] shrink-0 cursor-pointer"
            />
            <span className={`text-xs font-medium leading-snug ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {ui.consentLabel}
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#C6A15B] hover:text-[#0A101D]'
                  : 'bg-[#16233B] border-slate-700 text-slate-200 hover:border-[#C6A15B]'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>{ui.printBtn}</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-600 hover:text-[#0A101D]'
                    : 'bg-[#16233B] border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {ui.closeBtn}
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C6A15B] to-[#EAD096] hover:brightness-110 text-[#0A101D] font-bold text-xs shadow-md shadow-[#C6A15B]/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{ui.confirmBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
