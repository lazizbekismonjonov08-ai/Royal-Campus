import React from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { BedDouble, Plus, Check, Wrench } from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface RoomDetailProps {
  roomId: string;
  onClose: () => void;
  onOpenAssignModal: (roomId: string, bedId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const S41_RoomDetailModal: React.FC<RoomDetailProps> = ({
  roomId,
  onClose,
  onOpenAssignModal,
  onSelectStudent,
}) => {
  const { rooms, students, releaseBed, updateBed, role } = useDorm() as any;
  const { t, formatCurrency, formatDate } = useI18n();
  const room = rooms.find((r: any) => r.id === roomId);

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  if (!room) return null;

  const isRoomMaintenance = room.status === 'maintenance' || room.status === 'closed' || Boolean(room.isClosedForMaintenance);
  const occupiedCount = room.beds.filter((b: any) => b.status === 'occupied' || Boolean(b.studentId)).length;
  const maintenanceCount = room.beds.filter((b: any) => isRoomMaintenance || b.status === 'maintenance').length;
  const vacantCount = room.beds.filter((b: any) => !isRoomMaintenance && b.status !== 'occupied' && !b.studentId && b.status !== 'maintenance' && b.status !== 'reserved').length;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-detail-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] flex flex-col relative"
      >
        {/* Visible Header with guaranteed top-right close X button */}
        <ModalHeader
          icon={<BedDouble className="w-5 h-5 text-sky-600" />}
          title={
            <span id="room-detail-modal-title">
              {t('rooms.bedMapModalTitle')} — {t('common.room')} {room.roomNumber}
            </span>
          }
          badge={
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                String(room.type).endsWith('_plus')
                  ? 'bg-[#101C32] text-[#EAD096] border border-[#C6A15B]/60'
                  : 'bg-sky-100 text-sky-900'
              }`}
            >
              {t(`rooms.${room.type}`) || room.type} ({t('student.capacityBeds', { capacity: room.capacity })})
            </span>
          }
          subtitle={
            <span>
              {room.floor}-{t('common.floor')} • {t('students.tariff')}: {formatCurrency(room.priceMonthly)} • {t('student.roomCapacityLabel')}: {t('student.capacityBeds', { capacity: room.capacity })}
            </span>
          }
          onClose={handleDismiss}
          ariaLabel={t('common.close')}
        />

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 pr-0.5 space-y-4">
          {/* Occupancy summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <span>
              {t('beds.occupied')}: <strong className="text-slate-900">{occupiedCount}</strong>
            </span>
            <span>
              {t('beds.available')}: <strong className="text-emerald-600">{vacantCount}</strong>
            </span>
            {maintenanceCount > 0 && (
              <span>
                {t('rooms.maintenance')}: <strong className="text-amber-600">{maintenanceCount}</strong>
              </span>
            )}
            <span>
              {t('rooms.capacity')}: <strong className="text-slate-900">{room.capacity}</strong>
            </span>
          </div>

          {/* Beds Map Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-sky-600" /> {t('rooms.bedMapModalTitle')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              {room.beds.map((bed: any) => {
                const isOccupied = bed.status === 'occupied' || Boolean(bed.studentId);
                const isMaintenance = isRoomMaintenance || bed.status === 'maintenance';

                return (
                  <div
                    key={bed.id}
                    className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between transition-all ${
                      isOccupied
                        ? 'bg-rose-50/50 border-rose-200'
                        : isMaintenance
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-emerald-50/50 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-900 font-mono text-sm flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">
                          {t('common.bed')}:
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {bed.bedIdentifier || bed.bedNumber}
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          isOccupied
                            ? 'bg-rose-600 text-white'
                            : isMaintenance
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isOccupied
                          ? t('beds.occupied')
                          : isMaintenance
                          ? t('rooms.maintenance')
                          : t('beds.available')}
                      </span>
                    </div>

                    <div className="mb-3">
                      {isOccupied ? (
                        (() => {
                          const assignedStd = (students || []).find((s: any) => s.id === bed.studentId);
                          return (
                            <div>
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span
                                  onClick={() => {
                                    if (bed.studentId) onSelectStudent(bed.studentId);
                                  }}
                                  className="font-bold text-slate-900 hover:text-sky-600 cursor-pointer underline decoration-sky-300 transition-colors"
                                  title={t('students.studentDetails')}
                                >
                                  {assignedStd?.fullName || bed.studentName || t('common.user')}
                                </span>
                                {assignedStd?.applicationId && (
                                  <span className="font-mono text-[10px] font-bold bg-white/80 text-[#101C32] px-1.5 py-0.5 rounded border border-rose-200">
                                    {assignedStd.applicationId}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {t('common.date')}: {formatDate(bed.assignedAt || '')}
                              </div>
                            </div>
                          );
                        })()
                      ) : isMaintenance ? (
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          {t('rooms.bedUnderMaintenance')}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">{t('rooms.bedVacant')}</span>
                      )}
                    </div>

                    {role !== 'security' && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2 flex-wrap">
                        {isOccupied ? (
                          <button
                            type="button"
                            onClick={() => releaseBed(bed.id)}
                            className="px-2.5 py-1.5 bg-white hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 text-[11px] transition-colors cursor-pointer"
                          >
                            {t('rooms.releaseBedBtn')}
                          </button>
                        ) : isMaintenance ? (
                          <button
                            type="button"
                            onClick={() => updateBed(room.id, bed.id, { status: 'available' })}
                            className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {t('rooms.markReady')}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => updateBed(room.id, bed.id, { status: 'maintenance' })}
                              className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              title={t('rooms.markMaintenance')}
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              {t('rooms.markMaintenance')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenAssignModal(room.id, bed.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {t('rooms.assignStudentBtn')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
