import React from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { ROOM_TYPE_CAPACITY } from '../types';
import { BedDouble, Info } from 'lucide-react';

export const S07_StudentRoom: React.FC = () => {
  const { students, activeStudentId, rooms, applications } = useDorm();
  const { t, formatCurrency } = useI18n();
  const student = students.find((s) => s.id === activeStudentId) || students[0];

  if (!student) {
    return <div className="p-6 text-center text-slate-500">{t('student.notFound')}</div>;
  }

  const linkedApp = applications.find(
    (a) => (student.applicationId && a.id === student.applicationId) || a.studentId === student.id
  );
  const currentRoom = rooms.find(
    (r) =>
      (student.roomId && r.id === student.roomId) ||
      (student.roomNumber && r.roomNumber === student.roomNumber)
  );
  const effectiveRoomType = currentRoom?.type || student.roomType || linkedApp?.preferredRoomType;
  const roomCapacity =
    currentRoom?.capacity ||
    (effectiveRoomType ? ROOM_TYPE_CAPACITY[effectiveRoomType] : undefined);
  const bedLabel = student.bedIdentifier || (student.bedNumber ? String(student.bedNumber) : '');
  const formattedRoomBed =
    student.roomNumber && bedLabel
      ? t('student.roomBedFormat', { room: student.roomNumber, bed: bedLabel })
      : student.roomNumber
      ? `${t('common.room')} ${student.roomNumber}`
      : t('student.awaitingRoom');

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">{t('studentRoom.title')}</h1>
            <p className="text-xs text-slate-500">{t('studentRoom.subtitle')}</p>
          </div>
          <span className="bg-sky-100 text-sky-800 text-xs font-extrabold px-3 py-1 rounded-full">
            {effectiveRoomType ? t(`rooms.${effectiveRoomType}`) : t('student.awaitingRoom')}
          </span>
        </div>

        {/* Room Header Info */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-500 block">{t('common.floor')}:</span>
            <span className="font-bold text-slate-900 text-sm">
              {student.roomNumber && (student.floor || currentRoom?.floor)
                ? `${student.floor || currentRoom?.floor}-${t('common.floor')}`
                : '---'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('common.room')}:</span>
            <span className="font-bold text-slate-900 text-sm">
              {formattedRoomBed}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('student.roomCapacityLabel')}</span>
            <span className="font-bold text-slate-900 text-sm">
              {roomCapacity ? t('student.capacityBeds', { capacity: roomCapacity }) : '---'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('studentRoom.yourBed')}</span>
            <span className="font-bold text-sky-600 text-sm">
              {student.roomNumber && bedLabel ? `${t('common.bed')} ${bedLabel}` : '---'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('student.monthlyTariff')}:</span>
            <span className="font-bold text-slate-900 text-sm">
              {formatCurrency(student.monthlyTariff || linkedApp?.monthlyTariff || 0)}
            </span>
          </div>
        </div>

        {/* Visual Beds Grid in Room */}
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BedDouble className="w-4 h-4 text-sky-600" /> {t('studentRoom.bedsMap')}
        </h3>

        {!currentRoom ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600 mb-6">
            {t('student.awaitingRoom')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {currentRoom.beds.map((bed) => {
              const isMyBed = bed.id === student.bedId;
              const isOccupied = bed.status === 'occupied';
              const slotLabel = bed.bedIdentifier || String(bed.bedNumber);

              return (
                <div
                  key={bed.id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                    isMyBed
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200'
                      : isOccupied
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800">{t('common.bed')} {slotLabel}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        isMyBed
                          ? 'bg-sky-600 text-white'
                          : isOccupied
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isMyBed ? t('studentRoom.yourBed') : isOccupied ? t('beds.occupied') : t('beds.available')}
                    </span>
                  </div>

                  <div className="text-[11px]">
                    {isMyBed ? (
                      <span className="font-bold text-sky-900">{student.fullName}</span>
                    ) : isOccupied ? (
                      <span className="text-slate-700 font-medium">{bed.studentName || t('students.title')}</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">{t('beds.available')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            {t('studentRoom.subtitle')} • {t('telegram.header')}
          </p>
        </div>
      </div>
    </div>
  );
};
