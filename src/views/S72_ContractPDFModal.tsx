import React, { useState } from 'react';
import { Contract, Student } from '../types';
import { Printer, ShieldCheck } from 'lucide-react';
import { ModalCloseButton } from '../components/ModalCloseButton';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { useI18n } from '../i18n/I18nContext';
import { Language, SUPPORTED_LANGUAGES } from '../i18n/types';

interface ContractPdfProps {
  contract?: Contract;
  student?: Student;
  onClose: () => void;
}

export const S72_ContractPDFModal: React.FC<ContractPdfProps> = ({ contract, student, onClose }) => {
  const { language: currentAppLang, t, formatCurrency, formatDate } = useI18n();
  const [contractLang, setContractLang] = useState<Language>(currentAppLang);

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-pdf-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
      >
        {/* Header with Language Selector & Action buttons */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
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
        <div className="p-8 overflow-y-auto font-serif text-slate-900 text-xs leading-relaxed space-y-4 print:p-0 print:border-none">
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
              №: <span className="font-bold text-slate-900">{contract?.contractNumber || 'RC-2026/301-2'}</span> • {t('common.date')}: {formatDate(contract?.createdAt || '2026-08-26')}
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
                  <p><strong>Ф.И.О.:</strong> {student?.fullName || 'Karimov Jasur'}</p>
                  <p><strong>Паспорт / ID:</strong> {student?.passportNumber || 'FA6000001'}</p>
                  <p><strong>Учебное заведение:</strong> {student?.university || 'TATU'}</p>
                  <p><strong>Постоянный адрес:</strong> {student?.permanentAddress || 'Samarqand v.'}</p>
                </div>
                <p>(далее именуемым «Наниматель») о нижеследующем:</p>
              </>
            ) : contractLang === 'en' ? (
              <>
                <p>
                  This Agreement is entered into between <strong>"ROYAL CAMPUS" Residence Administration</strong> (hereinafter referred to as the "Lessor") and the student:
                </p>
                <div className="my-2 p-3 bg-slate-50 border border-slate-300 font-sans rounded-lg">
                  <p><strong>Full Name:</strong> {student?.fullName || 'Karimov Jasur'}</p>
                  <p><strong>Passport / National ID:</strong> {student?.passportNumber || 'FA6000001'}</p>
                  <p><strong>University / College:</strong> {student?.university || 'TATU'}</p>
                  <p><strong>Permanent Address:</strong> {student?.permanentAddress || 'Samarqand v.'}</p>
                </div>
                <p>(hereinafter referred to as the "Resident / Tenant") on the terms and conditions outlined below:</p>
              </>
            ) : (
              <>
                <p>
                  Ushbu shartnoma bir tomondan <strong>"ROYAL CAMPUS" Rezidensiyasi Ma’muriyati</strong> (keyingi o‘rinlarda "Ijaraga beruvchi") hamda ikkinchi tomondan talaba:
                </p>
                <div className="my-2 p-3 bg-slate-50 border border-slate-300 font-sans rounded-lg">
                  <p><strong>F.I.Sh:</strong> {student?.fullName || 'Karimov Jasur'}</p>
                  <p><strong>Pasport / ID:</strong> {student?.passportNumber || 'FA6000001'}</p>
                  <p><strong>O‘quv yurti:</strong> {student?.university || 'TATU'}</p>
                  <p><strong>Doimiy manzil:</strong> {student?.permanentAddress || 'Samarqand v.'}</p>
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
                <>1.1. Наймодатель предоставляет Нанимателю для временного проживания <strong>комнату {student?.roomNumber || '301'}, место {student?.bedNumber || 2}</strong> (по тарифу {student?.roomType?.toUpperCase() || 'COMFORT'}).</>
              ) : contractLang === 'en' ? (
                <>1.1. The Lessor provides the Resident with temporary residential accommodation: <strong>Room {student?.roomNumber || '301'}, Bed #{student?.bedNumber || 2}</strong> ({student?.roomType?.toUpperCase() || 'COMFORT'} tariff).</>
              ) : (
                <>1.1. Ijaraga beruvchi Ijarachiga vaqtincha yashash uchun <strong>{student?.roomNumber || '301'}-xona, {student?.bedNumber || 2}-o‘rinni</strong> ({student?.roomType?.toUpperCase() || 'COMFORT'} tarifda) ajratadi.</>
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
                <>2.1. Ежемесячная плата за проживание составляет <strong>{formatCurrency(student?.monthlyTariff || 800000)}</strong>.</>
              ) : contractLang === 'en' ? (
                <>2.1. The monthly accommodation fee is <strong>{formatCurrency(student?.monthlyTariff || 800000)}</strong>.</>
              ) : (
                <>2.1. Oylik ijara to‘lovi <strong>{formatCurrency(student?.monthlyTariff || 800000)}</strong> ni tashkil etadi.</>
              )}
            </p>
            <p>
              {contractLang === 'ru' ? (
                <>2.2. Оплата производится не позднее 1-го числа каждого расчётного месяца наличными денежными средствами, банковской картой или безналичным расчётом.</>
              ) : contractLang === 'en' ? (
                <>2.2. Payment must be rendered no later than the 1st day of each billing month via cash, bank card, or bank transfer.</>
              ) : (
                <>2.2. To‘lov har oyning 1-sanasidan kechikmay naqd, bank kartasi yoki pul o‘tkazish yo‘li bilan amalga oshiriladi.</>
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
              <p className="text-slate-500 mt-1">{student?.fullName}</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              <p className="text-[9px] text-slate-400 mt-1">
                {contractLang === 'ru' ? 'Подпись' : contractLang === 'en' ? 'Signature' : 'Imzo'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
