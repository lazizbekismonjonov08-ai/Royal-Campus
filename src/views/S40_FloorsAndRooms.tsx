import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Room, Bed, Student, CommonArea, CommonAreaCategory, ROOM_TYPE_ORDER } from '../types';
import {
  Building,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Utensils,
  BookOpen,
  HeartPulse,
  Shield,
  Shirt,
  Info,
  Coffee,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';
import { S42_RoomConfigModal } from './S42_RoomConfigModal';

interface FloorsProps {
  onSelectRoom: (roomId: string) => void;
}

export const S40_FloorsAndRooms: React.FC<FloorsProps> = ({ onSelectRoom }) => {
  const {
    rooms,
    students,
    commonAreas,
    addCommonArea,
    updateCommonArea,
    deleteCommonArea,
    canConfigureRooms,
    deleteRoom,
    resetAllBedsToAvailable,
    role,
    roomFilter,
    setRoomFilter,
  } = useDorm() as any;
  const { t, formatCurrency } = useI18n();
  // 0 = All residential floors (2-5), 1 = Common Areas, 2-5 = specific floor
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [filterType, setFilterType] = useState<string>(roomFilter || 'all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [commonFilter, setCommonFilter] = useState<string>('all');

  // Inline confirmation & feedback states (avoid window.confirm / window.alert)
  const [confirmResetAllBeds, setConfirmResetAllBeds] = useState(false);
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(null);
  const [confirmDeleteAreaId, setConfirmDeleteAreaId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setActionFeedback({ type, text });
    window.setTimeout(() => {
      setActionFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Synchronize with global roomFilter if set from Admin Dashboard
  React.useEffect(() => {
    if (roomFilter) {
      setFilterType(roomFilter);
      if (roomFilter !== 'all' && selectedFloor === 1) {
        setSelectedFloor(0);
      }
    }
  }, [roomFilter]);

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    if (setRoomFilter) {
      setRoomFilter(type);
    }
  };

  // Room Configuration Modal state (Owner & Manager only)
  const [isRoomConfigOpen, setIsRoomConfigOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  // Common Area Modal state for 1st floor configuration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<CommonArea | null>(null);
  const [areaForm, setAreaForm] = useState({
    name: '',
    code: '',
    category: 'reception' as CommonAreaCategory,
    areaSizeM2: 50,
    operatingHours: '24/7',
    responsiblePerson: '',
    status: 'active' as 'active' | 'maintenance' | 'closed',
    description: '',
    amenitiesInput: '',
  });

  // Handle escape key for common area modal
  React.useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const isResidentialView = selectedFloor === 0 || (selectedFloor >= 2 && selectedFloor <= 5);

  // Filter residential rooms on all residential floors (2-5) or selected floor, sorted by room number 1..56
  const floorRooms = (rooms as Room[])
    .filter((r: Room) => (selectedFloor === 0 ? r.floor >= 2 && r.floor <= 5 : r.floor === selectedFloor))
    .slice()
    .sort((a: Room, b: Room) => {
      const na = parseInt(a.roomNumber, 10);
      const nb = parseInt(b.roomNumber, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.roomNumber.localeCompare(b.roomNumber);
    });

  const filteredRooms = floorRooms.filter((room: Room) => {
    if (tierFilter !== 'all' && room.type !== tierFilter) return false;

    const totalBeds = room.beds.length;
    const occupiedBeds = room.beds.filter((b) => b.status === 'occupied').length;
    const maintenanceBeds = room.beds.filter((b) => b.status === 'maintenance').length;

    const currentFilter = filterType || roomFilter;

    if (currentFilter === 'full') return occupiedBeds === totalBeds;
    if (currentFilter === 'empty' || currentFilter === 'vacant') {
      return occupiedBeds === 0 && maintenanceBeds === 0;
    }
    if (currentFilter === 'partial') return occupiedBeds > 0 && occupiedBeds < totalBeds;
    if (currentFilter === 'maintenance') return maintenanceBeds > 0 || room.status === 'maintenance';
    if (currentFilter === 'occupied') return occupiedBeds > 0;

    return true;
  });

  // Aggregate metrics for All Floors (2-5)
  const allResidentialStats = React.useMemo(() => {
    const resRooms = (rooms as Room[]).filter((r) => r.floor >= 2 && r.floor <= 5);
    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;
    let maintenanceBeds = 0;
    resRooms.forEach((r) => {
      r.beds.forEach((b) => {
        totalBeds++;
        if (b.status === 'occupied') occupiedBeds++;
        else if (b.status === 'maintenance') maintenanceBeds++;
        else if (b.status === 'available') availableBeds++;
      });
    });
    return { roomsCount: resRooms.length, totalBeds, occupiedBeds, availableBeds, maintenanceBeds };
  }, [rooms]);

  // Filter 1st floor common areas
  const filteredCommonAreas = commonAreas.filter((ca: CommonArea) => {
    if (commonFilter === 'all') return true;
    return ca.status === commonFilter;
  });

  const handleOpenAddModal = () => {
    setEditingArea(null);
    setAreaForm({
      name: '',
      code: `F1-A${commonAreas.length + 1}`,
      category: 'other',
      areaSizeM2: 40,
      operatingHours: '08:00 - 22:00',
      responsiblePerson: 'Staff',
      status: 'active',
      description: '',
      amenitiesInput: 'Wi-Fi, AC',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (area: CommonArea) => {
    setEditingArea(area);
    setAreaForm({
      name: area.name,
      code: area.code,
      category: area.category,
      areaSizeM2: area.areaSizeM2 || 40,
      operatingHours: area.operatingHours,
      responsiblePerson: area.responsiblePerson,
      status: area.status,
      description: area.description,
      amenitiesInput: area.amenities.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaForm.name.trim() || !areaForm.code.trim()) return;

    const amenities = areaForm.amenitiesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (editingArea) {
      updateCommonArea(editingArea.id, {
        name: areaForm.name,
        code: areaForm.code,
        category: areaForm.category,
        areaSizeM2: Number(areaForm.areaSizeM2) || 0,
        operatingHours: areaForm.operatingHours,
        responsiblePerson: areaForm.responsiblePerson,
        status: areaForm.status,
        description: areaForm.description,
        amenities,
      });
    } else {
      addCommonArea({
        name: areaForm.name,
        code: areaForm.code,
        floor: 1,
        category: areaForm.category,
        areaSizeM2: Number(areaForm.areaSizeM2) || 0,
        operatingHours: areaForm.operatingHours,
        responsiblePerson: areaForm.responsiblePerson,
        status: areaForm.status,
        description: areaForm.description,
        amenities,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDeleteArea = (id: string) => {
    deleteCommonArea(id);
    setConfirmDeleteAreaId(null);
  };

  const getCategoryIcon = (cat: CommonAreaCategory) => {
    switch (cat) {
      case 'reception':
        return <Building className="w-5 h-5 text-sky-600" />;
      case 'kitchen':
        return <Utensils className="w-5 h-5 text-amber-600" />;
      case 'study':
        return <BookOpen className="w-5 h-5 text-indigo-600" />;
      case 'laundry':
        return <Shirt className="w-5 h-5 text-teal-600" />;
      case 'medical':
        return <HeartPulse className="w-5 h-5 text-rose-600" />;
      case 'security':
        return <Shield className="w-5 h-5 text-slate-700" />;
      case 'lounge':
        return <Coffee className="w-5 h-5 text-orange-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-slate-900">{t('rooms.title')}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#101C32] text-[#C6A15B]">
              1 {t('common.total').toLowerCase()} • 5 {t('common.floor').toLowerCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t('rooms.subtitle')}</p>
        </div>

        {/* Dynamic Filter Tabs */}
        {isResidentialView ? (
          <div className="flex flex-col items-end gap-2 max-w-full">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('common.all')}
              </button>
              <button
                onClick={() => handleFilterChange('occupied')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'occupied' ? 'bg-white text-sky-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('rooms.filterOccupied')}
              </button>
              <button
                onClick={() => handleFilterChange('full')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'full' ? 'bg-white text-rose-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('rooms.filterFull')}
              </button>
              <button
                onClick={() => handleFilterChange('partial')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'partial' ? 'bg-white text-indigo-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('rooms.filterPartial')}
              </button>
              <button
                onClick={() => handleFilterChange('empty')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'empty' || filterType === 'vacant' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('rooms.filterEmpty')}
              </button>
              <button
                onClick={() => handleFilterChange('maintenance')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'maintenance' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('rooms.filterMaintenance')}
              </button>
            </div>

            {/* Room Tier Filter Pills */}
            <div className="flex items-center gap-1 flex-wrap justify-end text-[11px] font-semibold">
              <span className="text-slate-400 mr-1">{t('rooms.tierFilterLabel')}</span>
              <button
                type="button"
                onClick={() => setTierFilter('all')}
                className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  tierFilter === 'all'
                    ? 'bg-[#101C32] text-[#C6A15B] border-[#101C32] font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {t('rooms.allTiers')}
              </button>
              {ROOM_TYPE_ORDER.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    tierFilter === tier
                      ? 'bg-[#101C32] text-[#C6A15B] border-[#101C32] font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {t(`rooms.${tier}`)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setCommonFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                commonFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('common.all')} ({commonAreas.length})
            </button>
            <button
              onClick={() => setCommonFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                commonFilter === 'active' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('common.active')}
            </button>
            <button
              onClick={() => setCommonFilter('maintenance')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                commonFilter === 'maintenance' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('rooms.maintenance')}
            </button>
          </div>
        )}
      </div>

      {/* Inline Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-[11px] font-bold opacity-70 hover:opacity-100 cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      )}

      {/* Floor Selector Buttons: All Floors + All 5 Physical Floors Displayed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* All Residential Floors (2-5) */}
        <button
          onClick={() => setSelectedFloor(0)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedFloor === 0
              ? 'bg-[#101C32] text-white border-[#101C32] shadow-lg ring-2 ring-[#C6A15B]'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1 gap-1">
            <span className="font-extrabold text-sm truncate">{t('rooms.allFloors')}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                selectedFloor === 0 ? 'bg-[#C6A15B] text-[#101C32]' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {allResidentialStats.roomsCount} {t('common.room').toLowerCase()}
            </span>
          </div>
          <div className={`text-xs ${selectedFloor === 0 ? 'text-slate-200' : 'text-slate-500'}`}>
            <strong>{allResidentialStats.occupiedBeds}</strong> / {allResidentialStats.totalBeds} {t('common.bed').toLowerCase()}
          </div>
          <div
            className={`text-[10px] mt-2 pt-1 border-t flex items-center justify-between ${
              selectedFloor === 0 ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-400'
            }`}
          >
            <span>{allResidentialStats.availableBeds} {t('beds.available').toLowerCase()}</span>
            <span className="font-mono font-medium">2–5</span>
          </div>
        </button>
        {/* Floor 1: Non-residential / common-use facilities */}
        <button
          onClick={() => setSelectedFloor(1)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedFloor === 1
              ? 'bg-[#101C32] text-white border-[#101C32] shadow-lg ring-2 ring-[#C6A15B]'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-extrabold text-sm flex items-center gap-1.5">
              1-{t('common.floor')}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selectedFloor === 1 ? 'bg-[#C6A15B] text-[#101C32]' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {t('rooms.commonAreas')}
            </span>
          </div>
          <div className={`text-xs ${selectedFloor === 1 ? 'text-[#E5D5AA]' : 'text-slate-600'} font-medium`}>
            Reception, lounge, laundry...
          </div>
          <div
            className={`text-[10px] mt-2 pt-1 border-t ${
              selectedFloor === 1 ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-400'
            }`}
          >
            0 {t('common.bed').toLowerCase()} • {commonAreas.length} {t('common.floor').toLowerCase()}
          </div>
        </button>

        {/* Floors 2, 3, 4, 5: Residential Floors */}
        {[2, 3, 4, 5].map((fl) => {
          const flRooms = rooms.filter((r: Room) => r.floor === fl);
          let totalBeds = 0;
          let occupiedBeds = 0;
          let maintenanceBeds = 0;
          let availableBeds = 0;
          flRooms.forEach((r: Room) => {
            r.beds.forEach((b: Bed) => {
              totalBeds++;
              if (b.status === 'occupied') occupiedBeds++;
              else if (b.status === 'maintenance') maintenanceBeds++;
              else if (b.status === 'available') availableBeds++;
            });
          });

          const isSelected = selectedFloor === fl;
          const occPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

          return (
            <button
              key={fl}
              onClick={() => setSelectedFloor(fl)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#101C32] text-white border-[#101C32] shadow-lg ring-2 ring-[#C6A15B]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-sm">{fl}-{t('common.floor')}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-[#C6A15B] text-[#101C32]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                  title={`${flRooms.length} ${t('common.room').toLowerCase()}, ${totalBeds} ${t('common.bed').toLowerCase()}`}
                >
                  {flRooms.length} {t('common.room').toLowerCase()}
                </span>
              </div>
              <div className={`text-xs ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                <strong>{occupiedBeds}</strong> / {totalBeds} {t('common.bed').toLowerCase()} ({occPct}%)
              </div>
              <div
                className={`text-[10px] mt-2 pt-1 border-t flex items-center justify-between ${
                  isSelected ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-400'
                }`}
              >
                <span>{availableBeds} {t('beds.available').toLowerCase()}</span>
                {maintenanceBeds > 0 ? (
                  <span className="text-amber-500 font-semibold">{maintenanceBeds} {t('rooms.maintenance').toLowerCase()}</span>
                ) : (
                  <span className="font-mono font-medium">{totalBeds} {t('common.bed').toLowerCase()}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Floor 1 Common-Use Management vs Floors 2-5 Residential Rooms */}
      {selectedFloor === 1 ? (
        /* ================= 1st FLOOR COMMON AREAS VIEW ================= */
        <div className="space-y-6">
          {/* Explanatory Banner */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {t('rooms.floor1')}: {t('rooms.commonAreas')}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {t('rooms.subtitle')}
                </p>
              </div>
            </div>

            {role !== 'security' && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 bg-[#101C32] hover:bg-[#1A2D4F] text-[#C6A15B] font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#C6A15B]" />
                {t('rooms.addCommonArea')}
              </button>
            )}
          </div>

          {/* Common Areas Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-[#101C32]" />
                {t('rooms.commonAreas')} ({filteredCommonAreas.length})
              </h3>
            </div>

            {filteredCommonAreas.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                {t('common.noData')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommonAreas.map((area: CommonArea) => (
                  <div
                    key={area.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-[#C6A15B]/50 hover:shadow-md transition-all bg-white flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Icon, Code & Status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            {getCategoryIcon(area.category)}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                              {area.code}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                              {area.name}
                            </h4>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            area.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : area.status === 'maintenance'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {area.status === 'active'
                            ? t('common.active')
                            : area.status === 'maintenance'
                            ? t('rooms.maintenance')
                            : t('common.inactive')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                        {area.description}
                      </p>

                      {/* Details Strip */}
                      <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {t('rooms.operatingHours')}: <strong>{area.operatingHours}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {t('rooms.responsible')}: <strong>{area.responsiblePerson}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Amenities Pills */}
                      {area.amenities && area.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {area.amenities.map((am: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    {role !== 'security' && (
                      <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                        {confirmDeleteAreaId === area.id ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteAreaId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmDeleteArea(area.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(area)}
                              className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title={t('common.edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteAreaId(area.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= FLOORS 2-5 RESIDENTIAL ROOMS VIEW ================= */
        <div className="space-y-4">
          {/* Floor Progress & Configuration Banner */}
          {(() => {
            const currentFloorRooms = (rooms as Room[]).filter((r: Room) =>
              selectedFloor === 0 ? r.floor >= 2 && r.floor <= 5 : r.floor === selectedFloor
            );
            const currentFloorBeds = currentFloorRooms.reduce((acc: number, r: Room) => acc + r.beds.length, 0);
            const expectedFloorRooms = selectedFloor === 0 ? 56 : 14;
            const expectedFloorBeds = selectedFloor === 0 ? 344 : 86;
            const isStandard = currentFloorRooms.length === expectedFloorRooms && currentFloorBeds === expectedFloorBeds;

            return (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {t('rooms.floorProgress')}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {t('rooms.roomsEntered', { count: currentFloorRooms.length, expected: expectedFloorRooms })}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {t('rooms.bedsEntered', { count: currentFloorBeds, expected: expectedFloorBeds })}
                      </span>
                    </div>

                    {!isStandard && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>{t('rooms.expectedWarning', { expectedRooms: expectedFloorRooms, expectedBeds: expectedFloorBeds })}</span>
                      </div>
                    )}
                  </div>

                  {/* Owner/Manager Actions: Reset All Beds + Configure New Room */}
                  {canConfigureRooms && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {resetAllBedsToAvailable && (
                        <button
                          type="button"
                          onClick={() => setConfirmResetAllBeds((prev) => !prev)}
                          className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                          <span>{t('rooms.resetAllBedsBtn')}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setRoomToEdit(null);
                          setIsRoomConfigOpen(true);
                        }}
                        className="px-4 py-2.5 bg-[#101C32] hover:bg-[#1A2D4F] text-[#C6A15B] hover:text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-[#C6A15B]" />
                        {t('rooms.addRoom')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Confirmation Panel for Reset All Beds */}
                {confirmResetAllBeds && resetAllBedsToAvailable && (
                  <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-amber-950 text-xs">
                        {t('rooms.resetAllBedsConfirmTitle')}
                      </div>
                      <p className="text-[11px] text-amber-900/85">
                        {t('rooms.resetAllBedsConfirmDesc')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmResetAllBeds(false)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs cursor-pointer"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetAllBedsToAvailable();
                          setConfirmResetAllBeds(false);
                          showFeedback('success', t('rooms.resetAllBedsSuccess'));
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
                      >
                        {t('rooms.resetAllBedsConfirmBtn')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Rooms Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-5 gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-sky-600" />
                  {selectedFloor === 0 ? t('rooms.allFloors') : `${selectedFloor}-${t('common.floor')}`} ({filteredRooms.length} {t('common.room').toLowerCase()})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedFloor === 0 ? t('rooms.allFloors') : `${selectedFloor}-${t('common.floor')}`} · {filteredRooms.length} {t('common.room').toLowerCase()}
                  {tierFilter !== 'all' ? ` · ${t(`rooms.${tierFilter}`)}` : ''}
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {t('common.total')}: {filteredRooms.length} {t('common.room').toLowerCase()}
              </span>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                {t('common.noData')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRooms.map((room: Room) => {
                  const occupied = room.beds.filter((b: Bed) => b.status === 'occupied').length;
                  const maintenance = room.beds.filter((b: Bed) => b.status === 'maintenance').length;
                  const available = room.beds.filter((b: Bed) => b.status === 'available').length;
                  const isFull = available === 0 && occupied > 0;

                  return (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-[#C6A15B] hover:shadow-md transition-all bg-white flex flex-col justify-between group relative"
                    >
                      <div>
                        {/* Top: Room Number & Type & Config Actions */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div
                            onClick={() => onSelectRoom(room.id)}
                            className="cursor-pointer"
                          >
                            <span className="text-base font-extrabold text-slate-900 group-hover:text-[#101C32] transition-colors block">
                              {t('common.room')} {room.roomNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {room.floor}-{t('common.floor')} • {t('student.capacityBeds', { capacity: room.capacity })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                                room.status === 'maintenance' || room.isClosedForMaintenance
                                  ? 'bg-amber-100 text-amber-800'
                                  : room.type === 'lux'
                                  ? 'bg-amber-100 text-amber-900'
                                  : room.type === 'comfort_plus'
                                  ? 'bg-sky-900 text-[#EAD096] border border-[#C6A15B]/50'
                                  : room.type === 'comfort'
                                  ? 'bg-sky-100 text-sky-900'
                                  : room.type === 'standard_plus'
                                  ? 'bg-slate-800 text-[#EAD096] border border-[#C6A15B]/50'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {room.status === 'maintenance' || room.isClosedForMaintenance
                                ? t('rooms.maintenance')
                                : `${t(`rooms.${room.type}`) || room.type}`}
                            </span>

                            {/* Owner/Manager edit button */}
                            {canConfigureRooms && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRoomToEdit(room);
                                  setIsRoomConfigOpen(true);
                                }}
                                title={t('rooms.editRoom')}
                                className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Owner/Manager delete button (inline confirmation) */}
                            {canConfigureRooms && (
                              confirmDeleteRoomId === room.id ? (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteRoomId(null)}
                                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = deleteRoom(room.id);
                                      setConfirmDeleteRoomId(null);
                                      if (!res.success && res.error) {
                                        showFeedback('error', res.error);
                                      }
                                    }}
                                    className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer"
                                  >
                                    {t('common.delete')}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteRoomId(room.id);
                                  }}
                                  title={t('rooms.deleteRoom')}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 mb-2 flex items-center justify-between gap-2">
                          <span>
                            {t('students.tariff')}: <strong className="text-slate-900 tabular-nums">{formatCurrency(room.priceMonthly)}</strong>
                          </span>
                        </div>

                        {/* Individual Bed Identifiers Badges with Resident Name & App ID when occupied */}
                        <div
                          onClick={() => onSelectRoom(room.id)}
                          className="space-y-1.5 cursor-pointer my-2.5"
                        >
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>{t('rooms.bedIdentifiersSection')}</span>
                            <span className="font-mono text-slate-400">{room.beds.length} {t('common.bed').toLowerCase()}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {room.beds.map((b: Bed) => {
                              const resident = b.studentId
                                ? (students as Student[] | undefined)?.find((s) => s.id === b.studentId)
                                : undefined;
                              const bedNumLabel = b.bedIdentifier || b.bedNumber;
                              const residentName = resident?.fullName || b.studentName;
                              const residentShort = residentName ? residentName.split(' ')[0] : '';
                              const appIdTag = resident?.applicationId ? ` (${resident.applicationId})` : '';

                              return (
                                <span
                                  key={b.id}
                                  title={
                                    b.status === 'occupied' && residentName
                                      ? `${t('common.bed')} ${bedNumLabel} — ${residentName}${appIdTag}`
                                      : `${t('common.bed')} ${bedNumLabel} — ${b.status}`
                                  }
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 max-w-full ${
                                    b.status === 'occupied'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : b.status === 'maintenance'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      b.status === 'occupied'
                                        ? 'bg-rose-500'
                                        : b.status === 'maintenance'
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                  />
                                  <span className="shrink-0">{bedNumLabel}</span>
                                  {b.status === 'occupied' && residentShort && (
                                    <span className="font-sans font-semibold truncate max-w-[115px]">
                                      · {residentShort}{resident?.applicationId ? ` (${resident.applicationId})` : ''}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {room.notes && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-1 mb-2">
                            "{room.notes}"
                          </p>
                        )}
                      </div>

                      <div
                        onClick={() => onSelectRoom(room.id)}
                        className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="text-slate-500">
                          {t('dashboard.occupancyRate')}: <strong>{occupied} / {room.capacity}</strong>
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            isFull
                              ? 'bg-rose-50 text-rose-700'
                              : maintenance > 0 && available === 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isFull
                            ? t('beds.occupied')
                            : maintenance > 0 && available === 0
                            ? t('rooms.maintenance')
                            : `${available} ${t('rooms.bedsAvailable')}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Room Configuration Modal for Owner and Manager */}
      {isRoomConfigOpen && (
        <S42_RoomConfigModal
          roomToEdit={roomToEdit}
          initialFloor={selectedFloor === 0 ? 2 : selectedFloor}
          onClose={() => {
            setIsRoomConfigOpen(false);
            setRoomToEdit(null);
          }}
        />
      )}

      {/* Configuration Modal for 1st Floor Common Area */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="common-area-modal-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto max-h-[92vh] flex flex-col relative"
          >
            {/* Header */}
            <ModalHeader
              icon={<Building className="w-5 h-5 text-[#101C32]" />}
              title={
                <span id="common-area-modal-title">
                  {editingArea ? t('common.edit') : t('rooms.addCommonArea')}
                </span>
              }
              subtitle={t('rooms.commonAreas')}
              onClose={() => setIsModalOpen(false)}
              ariaLabel={t('common.close')}
            />

            <form onSubmit={handleSaveArea} className="space-y-3.5 overflow-y-auto flex-1 pr-0.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('common.details')}:</label>
                  <input
                    type="text"
                    required
                    value={areaForm.name}
                    onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kod:</label>
                  <input
                    type="text"
                    required
                    value={areaForm.code}
                    onChange={(e) => setAreaForm({ ...areaForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('issues.category')}:</label>
                  <select
                    value={areaForm.category}
                    onChange={(e) => setAreaForm({ ...areaForm, category: e.target.value as CommonAreaCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B] capitalize"
                  >
                    <option value="reception">Reception</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="study">Study / Coworking</option>
                    <option value="laundry">Laundry</option>
                    <option value="medical">Medical</option>
                    <option value="security">Security & CCTV</option>
                    <option value="lounge">Lounge</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">m²:</label>
                  <input
                    type="number"
                    min="1"
                    value={areaForm.areaSizeM2}
                    onChange={(e) => setAreaForm({ ...areaForm, areaSizeM2: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('rooms.operatingHours')}:</label>
                  <input
                    type="text"
                    required
                    value={areaForm.operatingHours}
                    onChange={(e) => setAreaForm({ ...areaForm, operatingHours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('common.status')}:</label>
                  <select
                    value={areaForm.status}
                    onChange={(e) => setAreaForm({ ...areaForm, status: e.target.value as 'active' | 'maintenance' | 'closed' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                  >
                    <option value="active">{t('common.active')}</option>
                    <option value="maintenance">{t('rooms.maintenance')}</option>
                    <option value="closed">{t('common.inactive')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('rooms.responsible')}:</label>
                <input
                  type="text"
                  required
                  value={areaForm.responsiblePerson}
                  onChange={(e) => setAreaForm({ ...areaForm, responsiblePerson: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('issues.description')}:</label>
                <textarea
                  rows={2}
                  required
                  value={areaForm.description}
                  onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('common.notes')}:</label>
                <input
                  type="text"
                  value={areaForm.amenitiesInput}
                  onChange={(e) => setAreaForm({ ...areaForm, amenitiesInput: e.target.value })}
                  placeholder="Wi-Fi, AC"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] text-[#C6A15B] font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
