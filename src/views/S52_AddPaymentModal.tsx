import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { CreditCard, Save } from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface AddPaymentProps {
  initialStudentId?: string;
  onClose: () => void;
}

export const S52_AddPaymentModal: React.FC<AddPaymentProps> = ({ initialStudentId, onClose }) => {
  const { students, rooms, settings, recordPayment } = useDorm();
  const { t, formatCurrency } = useI18n();

  const getStudentCalculatedTariff = (std?: (typeof students)[number]) => {
    if (!std) return settings.roomTariffs.comfort;
    const assignedRoom = std.roomId ? rooms.find((r) => r.id === std.roomId) : undefined;
    const roomType = assignedRoom?.type || std.roomType;
    if (roomType && settings.roomTariffs?.[roomType] !== undefined) {
      return settings.roomTariffs[roomType];
    }
    return std.monthlyTariff;
  };

  const defaultId = initialStudentId || students[0]?.id || '';
  const [studentId, setStudentId] = useState(defaultId);
  const [amount, setAmount] = useState<number>(() =>
    getStudentCalculatedTariff(students.find((s) => s.id === defaultId))
  );
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodMonth, setPeriodMonth] = useState('2026-10');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('card');
  const [notes, setNotes] = useState('');

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  const selectedStudent = students.find((s) => s.id === studentId);
  const selectedStudentRoom = selectedStudent?.roomId
    ? rooms.find((r) => r.id === selectedStudent.roomId)
    : undefined;
  const selectedRoomType = selectedStudentRoom?.type || selectedStudent?.roomType;
  const selectedStudentTariff = getStudentCalculatedTariff(selectedStudent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !amount) return;

    recordPayment({
      studentId,
      amount,
      paymentDate,
      periodMonth,
      paymentMethod,
      notes,
    });

    onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-payment-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto max-h-[92vh] flex flex-col relative"
      >
        <ModalHeader
          icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
          title={<span id="add-payment-modal-title">{t('payments.addModalTitle')}</span>}
          subtitle={t('payments.subtitle')}
          onClose={handleDismiss}
          ariaLabel={t('common.close')}
        />

        <div className="overflow-y-auto flex-1 pr-0.5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('payments.selectStudent')}:</label>
              <select
                value={studentId}
                onChange={(e) => {
                  const id = e.target.value;
                  setStudentId(id);
                  const std = students.find((s) => s.id === id);
                  if (std) setAmount(getStudentCalculatedTariff(std));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.roomNumber ? `${t('common.room')} ${s.roomNumber}` : t('beds.available')})
                  </option>
                ))}
              </select>
            </div>

            {selectedStudent && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span>{t('students.tariff')}:</span>
                    {selectedRoomType && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          selectedRoomType.endsWith('_plus')
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {t(`rooms.${selectedRoomType}`)}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedStudentTariff)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('payments.outstandingDebt')}:</span>
                  <span className={selectedStudent.debtAmount > 0 ? 'font-bold text-rose-600' : 'font-bold text-emerald-600'}>
                    {selectedStudent.debtAmount > 0 ? `${formatCurrency(selectedStudent.debtAmount)}` : t('student.noDebt')}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('payments.amountLabel')}:</label>
              <input
                type="number"
                step="50000"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('payments.methodLabel')}:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="card">{t('payments.card')}</option>
                  <option value="cash">{t('payments.cash')}</option>
                  <option value="bank_transfer">{t('payments.bankTransfer')}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('payments.periodLabel')}:</label>
                <input
                  type="month"
                  required
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('payments.dateLabel')}:</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('payments.notesLabel')}:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tranzaksiya / Kvitansiya"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {t('payments.savePayment')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
