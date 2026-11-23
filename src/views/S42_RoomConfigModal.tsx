import React, { useState, useEffect } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Room, RoomType, ROOM_TYPE_ORDER, ROOM_TYPE_CAPACITY } from '../types';
import { BedDouble, AlertTriangle, Layers, Hash, FileText, Check, Sparkles } from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface RoomConfigModalProps {
  roomToEdit?: Room | null;
  initialFloor?: number;
  onClose: () => void;
  onSaved?: (room: Room) => void;
}

export const S42_RoomConfigModal: React.FC<RoomConfigModalProps> = ({
  roomToEdit,
  initialFloor = 2,
  onClose,
  onSaved,
}) => {
  const { role, canConfigureRooms, addRoom, updateRoom, settings, rooms = [] } = useDorm();
  const { t, formatCurrency } = useI18n();

  const { handleDismiss, handleBackdropClick } = useModalDismiss({
    onClose,
    closeOnEscape: true,
  });

  const isEditing = Boolean(roomToEdit);

  // Room type standard capacity and pricing tariffs from DormContext settings
  const TYPE_CAPACITY = ROOM_TYPE_CAPACITY;

  // Form states
  const [floor, setFloor] = useState<number>(roomToEdit ? roomToEdit.floor : Math.max(2, Math.min(5, initialFloor)));
  const [roomNumber, setRoomNumber] = useState<string>(roomToEdit ? roomToEdit.roomNumber : '');
  const [roomType, setRoomType] = useState<RoomType>(roomToEdit?.type || 'comfort');
  const [bedCount, setBedCount] = useState<number>(() => {
    if (roomToEdit) return roomToEdit.beds.length;
    return TYPE_CAPACITY['comfort'] || 6;
  });
  const [bedIdentifiers, setBedIdentifiers] = useState<string[]>(() => {
    if (roomToEdit && roomToEdit.beds.length > 0) {
      return roomToEdit.beds.map((b) => b.bedIdentifier || String(b.bedNumber || ''));
    }
    const count = TYPE_CAPACITY['comfort'] || 6;
    return Array.from({ length: count }, (_, i) => String(i + 1));
  });
  const [status, setStatus] = useState<'available' | 'maintenance' | 'closed'>(
    roomToEdit?.status || (roomToEdit?.isClosedForMaintenance ? 'maintenance' : 'available')
  );
  const [notes, setNotes] = useState<string>(roomToEdit?.notes || '');

  const fallbackTariffs: Record<RoomType, number> = {
    standard: 1000000,
    standard_plus: 1200000,
    comfort: 1200000,
    comfort_plus: 1400000,
    lux: 1400000,
  };
  const calculatedPriceMonthly = settings.roomTariffs?.[roomType] ?? fallbackTariffs[roomType];

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Safety check: find occupied beds in the current room
  const occupiedBeds = roomToEdit
    ? roomToEdit.beds.filter((b) => b.status === 'occupied' || Boolean(b.studentId))
    : [];
  const occupiedCount = occupiedBeds.length;

  const checkCapacityConflict = (targetCount: number): string | null => {
    if (!roomToEdit) return null;
    if (occupiedCount > targetCount) {
      const occupiedList = occupiedBeds
        .map((b) => (b.studentName ? `${b.bedIdentifier || b.bedNumber} (${b.studentName})` : (b.bedIdentifier || String(b.bedNumber))))
        .join(', ');
      return `Cannot reduce room capacity to ${targetCount} beds: ${occupiedCount} bed(s) are currently occupied by residents [${occupiedList}]. Please transfer or release residents before reducing capacity.`;
    }
    const removedBeds = roomToEdit.beds.slice(targetCount);
    const removedOccupied = removedBeds.filter((b) => b.status === 'occupied' || Boolean(b.studentId));
    if (removedOccupied.length > 0) {
      const occupiedList = removedOccupied
        .map((b) => (b.studentName ? `${b.bedIdentifier || b.bedNumber} (${b.studentName})` : (b.bedIdentifier || String(b.bedNumber))))
        .join(', ');
      return `Cannot reduce room capacity to ${targetCount} beds: Bed(s) ${occupiedList} are currently occupied. Reassign residents before reducing capacity.`;
    }
    return null;
  };

  const hasOccupiedConflict = Boolean(checkCapacityConflict(bedCount));

  // Automatically update bed capacity and bed identifiers when room type changes
  const handleRoomTypeChange = (newType: RoomType) => {
    setRoomType(newType);
    const targetCapacity = TYPE_CAPACITY[newType] || 6;

    // Check data protection rule: verify if target capacity conflicts with occupied beds
    const conflictMsg = checkCapacityConflict(targetCapacity);
    if (conflictMsg) {
      setErrorMessage(conflictMsg);
      setBedCount(targetCapacity);
      // Data safety: do not delete occupied beds while in conflict
      return;
    }

    setErrorMessage(null);
    setBedCount(targetCapacity);

    // Dynamically adjust bed identifiers to target count while preserving existing identifiers
    setBedIdentifiers((prev) => {
      const updated = [...prev];
      if (targetCapacity > updated.length) {
        // Expand: preserve user-defined identifiers, fill new slots sequentially (e.g., 1, 2, 3...)
        for (let i = updated.length; i < targetCapacity; i++) {
          const existingBedId = roomToEdit?.beds[i]?.bedIdentifier;
          updated.push(existingBedId || String(i + 1));
        }
      } else if (targetCapacity < updated.length) {
        // Shrink safely: keep first targetCapacity identifiers
        updated.length = targetCapacity;
      }
      return updated;
    });
  };

  // Synchronize bed identifier input count dynamically whenever bedCount changes manually
  const handleBedCountChange = (newCount: number) => {
    const validCount = Math.max(1, Math.min(16, newCount));

    const conflictMsg = checkCapacityConflict(validCount);
    if (conflictMsg) {
      setErrorMessage(conflictMsg);
      setBedCount(validCount);
      return;
    }

    setErrorMessage(null);
    setBedCount(validCount);
    setBedIdentifiers((prev) => {
      const updated = [...prev];
      if (validCount > updated.length) {
        for (let i = updated.length; i < validCount; i++) {
          const existingBedId = roomToEdit?.beds[i]?.bedIdentifier;
          updated.push(existingBedId || String(i + 1));
        }
      } else if (validCount < updated.length) {
        updated.length = validCount;
      }
      return updated;
    });
  };

  const handleBedIdChange = (index: number, val: string) => {
    setBedIdentifiers((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
    if (errorMessage && !hasOccupiedConflict) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!canConfigureRooms) {
      setErrorMessage(t('rooms.onlyOwnerOrManager'));
      return;
    }

    const cleanRoomNumber = roomNumber.trim();
    if (!cleanRoomNumber) {
      setErrorMessage(t('rooms.roomNumberLabel') + ' is required.');
      return;
    }

    // Safety check against removing occupied beds
    const conflictMsg = checkCapacityConflict(bedCount);
    if (conflictMsg) {
      setErrorMessage(conflictMsg);
      return;
    }

    if (bedIdentifiers.length !== bedCount) {
      setErrorMessage(`Bed count mismatch: ${bedCount} beds expected, but ${bedIdentifiers.length} inputs present.`);
      return;
    }

    // Check for empty bed identifiers
    const emptyIndex = bedIdentifiers.findIndex((id) => !id.trim());
    if (emptyIndex !== -1) {
      setErrorMessage(`${t('rooms.bedIdentifierLabel', { index: emptyIndex + 1 })} cannot be empty.`);
      return;
    }

    // Check for duplicates within this room
    const normalized = bedIdentifiers.map((id) => id.trim().toLowerCase());
    const seen = new Set<string>();
    for (let i = 0; i < normalized.length; i++) {
      if (seen.has(normalized[i])) {
        setErrorMessage(`Duplicate bed identifier: "${bedIdentifiers[i].trim()}". Each bed in this room must have a unique identifier.`);
        return;
      }
      seen.add(normalized[i]);
    }

    setSubmitting(true);

    try {
      // Backend validation request (enforcing server-side RBAC)
      try {
        const resp = await fetch('/api/rooms/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': role,
          },
          body: JSON.stringify({
            floor,
            roomNumber: cleanRoomNumber,
            bedIdentifiers,
            roomId: roomToEdit?.id,
            existingRooms: rooms,
          }),
        });

        if (!resp.ok) {
          const resData = await resp.json().catch(() => null);
          if (resData?.message) {
            setErrorMessage(resData.message);
            setSubmitting(false);
            return;
          }
        }
      } catch (err) {
        // Fallback to local validation if server endpoint unavailable in development
        console.warn('Backend validation route fallback:', err);
      }

      const targetPrice = calculatedPriceMonthly;

      // Persist in state via context actions
      if (isEditing && roomToEdit) {
        const result = updateRoom(roomToEdit.id, {
          floor,
          roomNumber: cleanRoomNumber,
          bedIdentifiers,
          type: roomType,
          priceMonthly: targetPrice,
          status,
          notes,
        });

        if (!result.success) {
          setErrorMessage(result.error || 'Failed to update room.');
          setSubmitting(false);
          return;
        }

        if (onSaved && result.room) onSaved(result.room);
      } else {
        const result = addRoom({
          floor,
          roomNumber: cleanRoomNumber,
          bedIdentifiers,
          type: roomType,
          priceMonthly: targetPrice,
          status,
          notes,
        });

        if (!result.success) {
          setErrorMessage(result.error || 'Failed to create room.');
          setSubmitting(false);
          return;
        }

        if (onSaved && result.room) onSaved(result.room);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-config-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto max-h-[92vh] flex flex-col relative"
      >
        <ModalHeader
          icon={<BedDouble className="w-5 h-5 text-[#C6A15B]" />}
          title={
            <span id="room-config-modal-title">
              {isEditing ? t('rooms.editRoom') : t('rooms.addRoom')}
            </span>
          }
          badge={
            <span className="bg-[#101C32] text-[#C6A15B] text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold">
              {role.toUpperCase()}
            </span>
          }
          onClose={handleDismiss}
          ariaLabel={t('common.close')}
        />

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2 animate-in fade-in-50">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Floor Selection & Room Identifier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                {t('rooms.floorLabel')} *
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              >
                <option value={2}>2-{t('common.floor')} ({t('rooms.floor2')})</option>
                <option value={3}>3-{t('common.floor')} ({t('rooms.floor3')})</option>
                <option value={4}>4-{t('common.floor')} ({t('rooms.floor4')})</option>
                <option value={5}>5-{t('common.floor')} ({t('rooms.floor5')})</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                {t('rooms.roomNumberLabel')} *
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => {
                  setRoomNumber(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={t('rooms.roomNumberPlaceholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              />
            </div>
          </div>

          {/* Bed Count & Room Category/Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                {t('rooms.bedCountLabel')} *
              </label>
              <input
                type="number"
                min={1}
                max={16}
                required
                value={bedCount}
                onChange={(e) => handleBedCountChange(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {t('assign.step2')}
              </label>
              <select
                value={roomType}
                onChange={(e) => handleRoomTypeChange(e.target.value as RoomType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              >
                {ROOM_TYPE_ORDER.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {t(`rooms.${typeOption}`)} ({TYPE_CAPACITY[typeOption]} {t('rooms.bedsTotal')}) — {formatCurrency(settings.roomTariffs?.[typeOption] ?? fallbackTariffs[typeOption])}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Room Category & Live Tariff Summary */}
          <div
            className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 transition-all ${
              roomType.endsWith('_plus')
                ? 'bg-[#101C32] border-[#C6A15B] text-white shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {roomType.endsWith('_plus') && (
                <Sparkles className="w-4 h-4 text-[#C6A15B] shrink-0" />
              )}
              <div>
                <div className={`font-extrabold text-xs ${roomType.endsWith('_plus') ? 'text-[#C6A15B]' : 'text-slate-900'}`}>
                  {t(`rooms.${roomType}`)} · {TYPE_CAPACITY[roomType]} {t('rooms.bedsTotal')}
                </div>
                <div className={`text-[11px] mt-0.5 ${roomType.endsWith('_plus') ? 'text-slate-300' : 'text-slate-500'}`}>
                  {roomType.endsWith('_plus') ? t('rooms.panoramicBadge') : t('rooms.regular')}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-[10px] uppercase font-bold ${roomType.endsWith('_plus') ? 'text-slate-300' : 'text-slate-400'}`}>
                {t('students.tariff')}
              </div>
              <div className={`text-sm font-black font-mono ${roomType.endsWith('_plus') ? 'text-[#EAD096]' : 'text-slate-900'}`}>
                {formatCurrency(calculatedPriceMonthly)}
              </div>
            </div>
          </div>

          {/* Dynamic Bed Identifiers Section */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="border-b border-slate-200/80 pb-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-[#C6A15B]" />
                {t('rooms.bedIdentifiersSection')}
              </h4>
            </div>

            {/* Grid of Bed Identifier Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {bedIdentifiers.map((bedId, index) => {
                const existingBed = roomToEdit?.beds[index];
                const isOccupied = existingBed && (existingBed.status === 'occupied' || Boolean(existingBed.studentId));
                return (
                  <div
                    key={index}
                    className={`bg-white p-2.5 rounded-xl border transition-colors ${
                      isOccupied ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200 focus-within:border-[#C6A15B]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600">
                        {t('rooms.bedIdentifierLabel', { index: index + 1 })} *
                      </label>
                      {isOccupied && (
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                          {existingBed.studentName ? existingBed.studentName : 'Occupied'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={bedId}
                      onChange={(e) => handleBedIdChange(index, e.target.value)}
                      placeholder={t('rooms.bedIdentifierPlaceholder')}
                      className="w-full font-mono text-xs font-bold text-slate-900 focus:outline-none placeholder:text-slate-300 placeholder:font-normal"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Status & Optional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {t('common.status')}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              >
                <option value="available">{t('rooms.statusAvailable')}</option>
                <option value="maintenance">{t('rooms.statusMaintenance')}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                {t('rooms.roomNotes')}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('rooms.roomNotesPlaceholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={submitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || hasOccupiedConflict}
              className="px-5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] text-[#C6A15B] hover:text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 text-[#C6A15B]" />
              {submitting ? '...' : isEditing ? t('common.save') : t('rooms.addRoom')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
