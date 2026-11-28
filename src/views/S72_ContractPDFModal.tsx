import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Contract, Student, ROOM_TYPE_CAPACITY } from '../types';
import { Printer, ShieldCheck } from 'lucide-react';
import { ModalCloseButton } from '../components/ModalCloseButton';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { useI18n } from '../i18n/I18nContext';
import { useDorm } from '../context/DormContext';
import { Language, SUPPORTED_LANGUAGES } from '../i18n/types';
import {
  computeStudentBillingSummary,
  findLinkedApplication,
  formatDateTimeCommaDisplay,
  formatMethodLabel,
} from '../utils/billingUtils';

interface ContractPdfProps {
  contract?: Contract;
  student?: Student;
  onClose: () => void;
}

export const S72_ContractPDFModal: React.FC<ContractPdfProps> = ({ contract, student, onClose }) => {
  const { language: currentAppLang, t, formatCurrency, formatDate } = useI18n();
  const { rooms, settings, payments, applications, billingLedgers } = useDorm();
  const [contractLang, setContractLang] = useState<Language>(currentAppLang);

  const assignedRoom = rooms.find(
    (r) =>
      (student?.roomId && r.id === student.roomId) ||
      (student?.roomNumber && r.roomNumber === student.roomNumber) ||
      (contract?.roomNumber && r.roomNumber === contract.roomNumber)
  );
  const displayRoomNumber = student?.roomNumber || contract?.roomNumber || '---';
  const displayBedNumber =
    student?.bedIdentifier ||
    (student?.bedNumber !== undefined ? String(student.bedNumber) : undefined) ||
    (contract?.bedIdentifier ? contract.bedIdentifier : undefined) ||
    (contract?.bedNumber !== undefined ? String(contract.bedNumber) : undefined) ||
    '---';
  const displayFloor = student?.floor || assignedRoom?.floor;
  const effectiveRoomType = student?.roomType || assignedRoom?.type || contract?.roomType;
  const displayCapacity =
    assignedRoom?.capacity || (effectiveRoomType ? ROOM_TYPE_CAPACITY[effectiveRoomType] : undefined);
  const displayTier = (() => {
    if (!effectiveRoomType) return '---';
    const labels: Record<string, string> = {
      standard: 'Standard',
      standard_plus: 'Standard plus',
      comfort: 'Comfort',
      comfort_plus: 'Comfort plus',
      lux: 'Lux',
    };
    return labels[effectiveRoomType] || t(`rooms.${effectiveRoomType}`);
  })();

  const formatContractAmount = (amount: number) => {
    const unit = contractLang === 'ru' ? 'сум' : contractLang === 'en' ? 'UZS' : 'so‘m';
    return `${amount.toLocaleString('ru-RU')} ${unit}`;
  };

  const linkedApp = useMemo(
    () => findLinkedApplication(student, applications),
    [student, applications]
  );

  const entityId = student?.id || contract?.studentId || linkedApp?.id || '';
  const billingSummary = useMemo(() => {
    if (!entityId) return undefined;
    return computeStudentBillingSummary({
      entityId,
      student,
      application: linkedApp,
      contract,
      rooms,
      settings,
      payments,
      ledger: billingLedgers[entityId],
    });
  }, [entityId, student, linkedApp, contract, rooms, settings, payments, billingLedgers]);

  const effectiveMonthlyRate = billingSummary?.monthlyRate || student?.monthlyTariff || contract?.tariffMonthly || 1200000;

  const { handleDismiss } = useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  useEffect(() => {
    document.body.classList.add('printing-contract');
    return () => {
      document.body.classList.remove('printing-contract');
    };
  }, []);

  const handlePrint = () => {
    document.body.classList.add('printing-contract');
    setTimeout(() => {
      window.print();
    }, 60);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={handleDismiss}
      className="contract-print-root fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-pdf-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="contract-print-modal-card bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
      >
        {/* Header with Language Selector & Action buttons */}
        <div className="contract-print-hide p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
            <h3 id="contract-pdf-modal-title" className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
              {t('contracts.modalTitle')}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Contract Language Switcher */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs">
              {SUPPORTED_LANGUAGES.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setContractLang(opt.code)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    contractLang === opt.code
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                  title={opt.nativeName}
                >
                  <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-[#C6A15B] leading-none shrink-0">
                    {opt.code.toUpperCase()}
                  </span>
                  <span className="hidden sm:inline font-sans text-xs leading-none">
                    {opt.nativeName}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#C6A15B]" />
              <span className="hidden sm:inline">{t('common.print')}</span>
            </button>
            <ModalCloseButton onClose={handleDismiss} ariaLabel={t('common.close')} />
          </div>
        </div>

        {/* Printable Contract Document Body */}
        <div className="contract-print-scroll p-6 sm:p-8 overflow-y-auto font-serif text-slate-900 text-xs leading-relaxed space-y-4">
          {/* Header Seal & Title */}
          <div className="text-center border-b-2 border-slate-800 pb-4">
            <div className="inline-block px-3 py-0.5 mb-1.5 text-[9px] font-bold text-[#C6A15B] uppercase tracking-widest bg-[#101C32] rounded">
              ROYAL CAMPUS • STUDENT RESIDENCE
            </div>
            <h1 className="text-base font-bold tracking-wide uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
              {contractLang === 'ru'
                ? 'СТУДЕНЧЕСКАЯ РЕЗИДЕНЦИЯ ROYAL CAMPUS'
                : contractLang === 'en'
                ? 'ROYAL CAMPUS STUDENT RESIDENCE'
                : 'ROYAL CAMPUS TALABALAR REZIDENSIYASI'}
            </h1>
            <h2 className="text-sm font-bold mt-1 text-slate-800 font-sans tracking-tight">
              {contractLang === 'ru'
                ? 'ОФИЦИАЛЬНЫЙ ДОГОВОР НАЙМА ЖИЛОГО ПОМЕЩЕНИЯ В РЕЗИДЕНЦИИ'
                : contractLang === 'en'
                ? 'OFFICIAL RESIDENTIAL TENANCY & ACCOMMODATION AGREEMENT'
                : 'REZIDENTURA IJARASI BO‘YICHA RASMIY SHARTNOMA'}
            </h2>
            <p className="text-[10px] font-sans text-slate-500 mt-1 tabular-nums">
              №: <span className="font-bold text-slate-900">{contract?.contractNumber || 'RC-2026/---'}</span> • {t('common.date')}: {formatDate(contract?.createdAt || '2026-09-01')}
            </p>
          </div>

          {/* Parties */}
          <div>
            {contractLang === 'ru' ? (
              <>
                <p>
                  Настоящий договор заключён между <strong>Администрацией резиденции «ROYAL CAMPUS»</strong> (далее именуемой «Наймодатель») с одной стороны и студентом:
                </p>
                <div className="my-2 p-3 bg-slate-50 border border-slate-300 font-sans rounded-lg">
                  <p><strong>Ф.И.О.:</strong> {student?.fullName || contract?.studentName || '---'}</p>
                  <p><strong>Паспорт / ID:</strong> {student?.passportNumber || contract?.passportNumber || '---'}</p>
                  <p><strong>Учебное заведение:</strong> {student?.university || '---'}</p>
                  <p><strong>Постоянный адрес:</strong> {student?.permanentAddress || '---'}</p>
                </div>
                <p>(далее именуемым «Наниматель») о нижеследующем:</p>
              </>
            ) : contractLang === 'en' ? (
              <>
                <p>
                  This Agreement is entered into between <strong>"ROYAL CAMPUS" Residence Administration</strong> (hereinafter referred to as the "Lessor") and the student:
                </p>
                <div className="my-2 p-3 bg-slate-50 border border-slate-300 font-sans rounded-lg">
                  <p><strong>Full Name:</strong> {student?.fullName || contract?.studentName || '---'}</p>
                  <p><strong>Passport / National ID:</strong> {student?.passportNumber || contract?.passportNumber || '---'}</p>
                  <p><strong>University / College:</strong> {student?.university || '---'}</p>
                  <p><strong>Permanent Address:</strong> {student?.permanentAddress || '---'}</p>
                </div>
                <p>(hereinafter referred to as the "Resident / Tenant") on the terms and conditions outlined below:</p>
              </>
            ) : (
              <>
                <p>
                  Ushbu shartnoma bir tomondan <strong>"ROYAL CAMPUS" Rezidensiyasi Ma’muriyati</strong> (keyingi o‘rinlarda "Ijaraga beruvchi") hamda ikkinchi tomondan talaba:
                </p>
                <div className="my-2 p-3 bg-slate-50 border border-slate-300 font-sans rounded-lg">
                  <p><strong>F.I.Sh:</strong> {student?.fullName || contract?.studentName || '---'}</p>
                  <p><strong>Pasport / ID:</strong> {student?.passportNumber || contract?.passportNumber || '---'}</p>
                  <p><strong>O‘quv yurti:</strong> {student?.university || '---'}</p>
                  <p><strong>Doimiy manzil:</strong> {student?.permanentAddress || '---'}</p>
                </div>
                <p>(keyingi o‘rinlarda "Ijarachi") o‘rtasida quyidagi shartlar bo‘yicha tuzildi:</p>
              </>
            )}
          </div>

          {/* Clauses */}
          <div className="space-y-2">
            <h4 className="font-bold border-b border-slate-300 pb-1 uppercase tracking-wider text-[11px]">
              {contractLang === 'ru'
                ? '1. ПРЕДМЕТ ДОГОВОРА'
                : contractLang === 'en'
                ? '1. SUBJECT OF THE AGREEMENT'
                : '1. SHARTNOMA MAVZUSI'}
            </h4>
            <p>
              {contractLang === 'ru' ? (
                <>1.1. Наймодатель предоставляет Нанимателю для временного проживания <strong>{displayFloor ? `${displayFloor}-й этаж, ` : ''}комнату {displayRoomNumber}, койко-место {displayBedNumber}</strong> (тариф: {displayTier}{displayCapacity ? `, ${displayCapacity}-местная` : ''}).</>
              ) : contractLang === 'en' ? (
                <>1.1. The Lessor provides the Resident with temporary residential accommodation: <strong>{displayFloor ? `Floor ${displayFloor}, ` : ''}Room {displayRoomNumber}, Bed #{displayBedNumber}</strong> ({displayTier} tier{displayCapacity ? `, ${displayCapacity}-bed` : ''}).</>
              ) : (
                <>1.1. Ijaraga beruvchi Ijarachiga vaqtincha yashash uchun <strong>{displayFloor ? `${displayFloor}-qavat, ` : ''}{displayRoomNumber}-xona, {displayBedNumber}-o‘rinni</strong> ({displayTier} tarif{displayCapacity ? `, ${displayCapacity} o‘rinli` : ''}) ajratadi.</>
              )}
            </p>
            <p>
              {contractLang === 'ru' ? (
                <>1.2. Срок проживания установлен с <strong>{contract?.startDate || '2026-09-01'}</strong> по <strong>{contract?.endDate || '2027-06-30'}</strong>.</>
              ) : contractLang === 'en' ? (
                <>1.2. The term of residency is established from <strong>{contract?.startDate || '2026-09-01'}</strong> to <strong>{contract?.endDate || '2027-06-30'}</strong>.</>
              ) : (
                <>1.2. Yashash muddati: <strong>{contract?.startDate || '2026-09-01'}</strong> dan <strong>{contract?.endDate || '2027-06-30'}</strong> gacha belgilandi.</>
              )}
            </p>

            <h4 className="font-bold border-b border-slate-300 pb-1 uppercase tracking-wider text-[11px] pt-2">
              {contractLang === 'ru'
                ? '2. ПОРЯДОК И СРОКИ ОПЛАТЫ'
                : contractLang === 'en'
                ? '2. PAYMENT TERMS AND SCHEDULE'
                : '2. TO‘LOV MUDDATLARI VA TARTIBI'}
            </h4>
            <p>
              {contractLang === 'ru' ? (
                <>2.1. Ежемесячная плата за проживание составляет <strong>{formatContractAmount(effectiveMonthlyRate)}</strong>.</>
              ) : contractLang === 'en' ? (
                <>2.1. The monthly accommodation fee is <strong>{formatContractAmount(effectiveMonthlyRate)}</strong>.</>
              ) : (
                <>2.1. Oylik ijara to‘lovi <strong>{formatContractAmount(effectiveMonthlyRate)}</strong> ni tashkil etadi.</>
              )}
            </p>
            <p>
              {contractLang === 'ru' ? (
                <>2.2. Оплата производится не позднее 1-го числа каждого расчётного месяца наличными, банковской картой или через Click / Payme.</>
              ) : contractLang === 'en' ? (
                <>2.2. Payment must be rendered no later than the 1st day of each billing month via cash, bank card/transfer, or Click / Payme.</>
              ) : (
                <>2.2. To‘lov har oyning 1-sanasidan kechikmay naqd, bank kartasi/o‘tkazma yoki Click / Payme orqali amalga oshiriladi.</>
              )}
            </p>

            <h4 className="font-bold border-b border-slate-300 pb-1 uppercase tracking-wider text-[11px] pt-2">
              {contractLang === 'ru'
                ? '3. ПРАВА И ОБЯЗАННОСТИ СТОРОН'
                : contractLang === 'en'
                ? '3. RIGHTS AND OBLIGATIONS OF THE PARTIES'
                : '3. TOMONLARNING HUQUQ VA MAJBURIYATLARI'}
            </h4>
            <p>
              {contractLang === 'ru' ? (
                <>3.1. Наниматель обязуется строго соблюдать правила внутреннего распорядка, бережно относиться к имуществу и коммуникациям, экономно расходовать воду и электроэнергию.</>
              ) : contractLang === 'en' ? (
                <>3.1. The Resident undertakes to strictly follow the residence code of conduct, treat facilities with care, and conserve electricity and water utilities.</>
              ) : (
                <>3.1. Ijarachi rezidensiya ichki tartib-qoidalariga qat’iy rioya qilishi, elektr va suv resurslaridan tejamkor foydalanishi hamda mulkka zarar yetkazmasligi shart.</>
              )}
            </p>
            <p>
              {contractLang === 'ru' ? (
                <>3.2. Курение в помещениях и нахождение в резиденции после 23:00 без предварительного согласования категорически запрещены.</>
              ) : contractLang === 'en' ? (
                <>3.2. Smoking on premises and entry after 23:00 without official authorization is strictly prohibited.</>
              ) : (
                <>3.2. Rezidensiyaga kechki soat 23:00 dan keyin ruxsatsiz kirish va chekish qat’iyan man etiladi.</>
              )}
            </p>
          </div>

          {/* Annex 3 — Synchronized Monthly Payment Tracking Sheet */}
          {billingSummary && (
            <div className="contract-page-break pt-4 space-y-2 font-sans">
              <div className="text-center border-t-2 border-slate-800 pt-3">
                <h4 className="font-extrabold uppercase tracking-wider text-xs text-slate-900">
                  {contractLang === 'ru'
                    ? 'ПРИЛОЖЕНИЕ 3 — ВЕДОМОСТЬ ЕЖЕМЕСЯЧНЫХ ПЛАТЕЖЕЙ'
                    : contractLang === 'en'
                    ? 'ANNEX 3 — MONTHLY PAYMENT TRACKING SHEET'
                    : '3-ILOVA — OYLIK TO‘LOVLARNI HISOBGA OLISH VARAG‘I'}
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead className="bg-slate-100 font-bold text-slate-800">
                    <tr>
                      <th className="border border-slate-300 p-1.5 text-left">
                        {contractLang === 'ru' ? 'Месяц' : contractLang === 'en' ? 'Month' : 'Oy'}
                      </th>
                      <th className="border border-slate-300 p-1.5 text-right">
                        {contractLang === 'ru' ? 'Тариф' : contractLang === 'en' ? 'Rate' : 'Tarif'}
                      </th>
                      <th className="border border-slate-300 p-1.5 text-left">
                        {contractLang === 'ru' ? 'Дата оплаты' : contractLang === 'en' ? 'Payment Date' : 'To‘lov sanasi'}
                      </th>
                      <th className="border border-slate-300 p-1.5 text-right">
                        {contractLang === 'ru' ? 'Оплачено' : contractLang === 'en' ? 'Paid' : 'To‘langan'}
                      </th>
                      <th className="border border-slate-300 p-1.5 text-right">
                        {contractLang === 'ru' ? 'Остаток' : contractLang === 'en' ? 'Balance Due' : 'Qoldiq'}
                      </th>
                      <th className="border border-slate-300 p-1.5 text-left">
                        {contractLang === 'ru' ? 'Примечание' : contractLang === 'en' ? 'Notes' : 'Izoh'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingSummary.months.map((row) => {
                      const mLabel =
                        contractLang === 'ru' ? row.labelRu : contractLang === 'en' ? row.labelEn : row.labelUz;
                      const stText =
                        contractLang === 'ru'
                          ? row.status === 'paid'
                            ? 'Оплачено'
                            : row.status === 'partial'
                            ? 'Частично'
                            : row.isActiveMonth
                            ? 'К оплате'
                            : 'По графику'
                          : contractLang === 'en'
                          ? row.status === 'paid'
                            ? 'Paid'
                            : row.status === 'partial'
                            ? 'Partial'
                            : row.isActiveMonth
                            ? 'Due'
                            : 'Scheduled'
                          : row.status === 'paid'
                          ? 'To‘langan'
                          : row.status === 'partial'
                          ? 'Qisman'
                          : row.isActiveMonth
                          ? 'To‘lov kutilmoqda'
                          : 'Rejalashtirilgan';
                      const noteText = [
                        stText,
                        row.paymentMethod ? formatMethodLabel(row.paymentMethod, contractLang) : '',
                        row.notes,
                      ]
                        .filter(Boolean)
                        .join(' · ');

                      return (
                        <tr key={row.period}>
                          <td className="border border-slate-300 p-1.5">{mLabel}</td>
                          <td className="border border-slate-300 p-1.5 text-right tabular-nums">
                            {formatContractAmount(row.rate)}
                          </td>
                          <td className="border border-slate-300 p-1.5 tabular-nums whitespace-nowrap">
                            {formatDateTimeCommaDisplay(row.paymentDate)}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-right tabular-nums font-semibold">
                            {formatContractAmount(row.paidAmount)}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-right tabular-nums font-semibold">
                            {formatContractAmount(row.remainingAmount)}
                          </td>
                          <td className="border border-slate-300 p-1.5">{noteText}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100 font-bold">
                      <td className="border border-slate-300 p-1.5 uppercase">
                        {contractLang === 'ru' ? 'ИТОГО' : contractLang === 'en' ? 'TOTALS' : 'JAMI'}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right tabular-nums">
                        {formatContractAmount(billingSummary.totalExpected)}
                      </td>
                      <td className="border border-slate-300 p-1.5">—</td>
                      <td className="border border-slate-300 p-1.5 text-right tabular-nums">
                        {formatContractAmount(billingSummary.totalPaid)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right tabular-nums">
                        {formatContractAmount(billingSummary.remainingBalance)}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        {contractLang === 'ru'
                          ? `Активных мес.: ${billingSummary.activeMonthsCount}`
                          : contractLang === 'en'
                          ? `Active months: ${billingSummary.activeMonthsCount}`
                          : `Faol oylar: ${billingSummary.activeMonthsCount}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legal Translation Notice */}
          <div className="pt-2 text-[10px] text-slate-500 font-sans italic border-t border-slate-200">
            {contractLang === 'ru'
              ? '* Перевод документа представлен в информационных целях. Официальное юридическое исполнение подлежит институциональному заверению.'
              : contractLang === 'en'
              ? '* Document translation provided for administrative reference. Official legal execution is subject to institutional review.'
              : '* Ushbu shartnoma talabalar shaharchasi rasmiy nizomiga muvofiq tuzilgan.'}
          </div>

          {/* Signature Lines */}
          <div className="pt-6 grid grid-cols-2 gap-8 font-sans text-[11px]">
            <div className="border-t border-slate-800 pt-2 text-center">
              <p className="font-bold">
                {contractLang === 'ru'
                  ? 'НАЙМОДАТЕЛЬ'
                  : contractLang === 'en'
                  ? 'LESSOR / RESIDENCE'
                  : 'IJARAGA BERUVCHI'}
              </p>
              <p className="text-slate-600 font-semibold mt-1">
                {contractLang === 'ru'
                  ? 'Администрация «ROYAL CAMPUS»'
                  : contractLang === 'en'
                  ? '"ROYAL CAMPUS" Administration'
                  : '"ROYAL CAMPUS" Ma’muriyati'}
              </p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              <p className="text-[9px] text-[#C6A15B] font-bold mt-1">
                {contractLang === 'ru' ? 'Подпись и печать' : contractLang === 'en' ? 'Signature & Seal' : 'Imzo va muhr'}
              </p>
            </div>

            <div className="border-t border-slate-800 pt-2 text-center">
              <p className="font-bold">
                {contractLang === 'ru'
                  ? 'НАНИМАТЕЛЬ (РЕЗИДЕНТ)'
                  : contractLang === 'en'
                  ? 'RESIDENT / TENANT'
                  : 'IJARACHI (REZIDENT)'}
              </p>
              <p className="text-slate-500 mt-1">{student?.fullName || contract?.studentName || '---'}</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              <p className="text-[9px] text-slate-400 mt-1">
                {contractLang === 'ru' ? 'Подпись' : contractLang === 'en' ? 'Signature' : 'Imzo'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
