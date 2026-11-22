import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Printer, FileSpreadsheet, Download } from 'lucide-react';

export const S110_Reports: React.FC = () => {
  const { stats, rooms, payments, students } = useDorm();
  const { t, formatCurrency, formatNumber } = useI18n();
  const [reportCategory, setReportCategory] = useState<'occupancy' | 'payments' | 'debt'>('occupancy');

  const handleDownloadCSV = () => {
    const BOM = '\uFEFF';
    const rows: (string | number)[][] = [];

    // Header info
    rows.push(['ROYAL CAMPUS - BANDLIK VA TO\'LOV STATISTIKASI HISOBOTI']);
    rows.push(['Hisobot sanasi (Export Date)', new Date().toISOString().slice(0, 10)]);
    rows.push([]);

    // 1. Bandlik statistikasi (Occupancy summary)
    rows.push(['=== 1. BANDLIK STATISTIKASI (OCCUPANCY OVERVIEW) ===']);
    rows.push(['Ko\'rsatkich (Metric)', 'Qiymat (Value)']);
    rows.push(['Jami binolar (Total Buildings)', stats.totalBuildings || 1]);
    rows.push(['Jami qavatlar (Total Floors)', stats.totalFloors]);
    rows.push(['Turar-joy qavatlari (Residential Floors)', stats.residentialFloors || 4]);
    rows.push(['Jami xonalar (Total Rooms)', stats.totalRooms]);
    rows.push(['Jami o\'rinlar (Total Beds)', stats.totalBeds]);
    rows.push(['Band o\'rinlar (Occupied Beds)', stats.occupiedBeds]);
    rows.push(['Bo\'sh o\'rinlar (Vacant Beds)', stats.vacantBeds]);
    rows.push(['Ta\'mirdagi o\'rinlar (Maintenance Beds)', stats.maintenanceBeds]);
    rows.push(['Bandlik darajasi (Occupancy Rate)', `${stats.occupancyPercentage}%`]);
    rows.push(['Band xonalar (Occupied Rooms)', stats.occupiedRooms]);
    rows.push(['To\'liq band xonalar (Full Rooms)', stats.fullRooms]);
    rows.push(['Qisman band xonalar (Partially Occupied Rooms)', stats.partiallyOccupiedRooms]);
    rows.push(['Bo\'sh xonalar (Empty Rooms)', stats.emptyRooms]);
    rows.push(['Ta\'mirdagi xonalar (Maintenance Rooms)', stats.maintenanceRooms]);
    rows.push([]);

    // 2. Qavatlar kesimida bandlik (Floor breakdown)
    rows.push(['=== 2. QAVATLAR KESIMIDA BANDLIK TAQSIMOTI (FLOOR BREAKDOWN) ===']);
    rows.push(['Qavat (Floor)', 'Xonalar (Rooms)', 'Jami o\'rinlar (Total Beds)', 'Band o\'rinlar (Occupied)', 'Bo\'sh o\'rinlar (Available)', 'Bandlik (Occupancy %)']);
    [2, 3, 4, 5].forEach((fl) => {
      const flRooms = rooms.filter((r) => r.floor === fl);
      const flExpectedBeds = fl === 2 || fl === 3 ? 88 : 86;
      const flTotalBeds = flRooms.reduce((acc, r) => acc + r.beds.length, 0) || flExpectedBeds;
      let occ = 0;
      flRooms.forEach((r) => r.beds.forEach((b) => { if (b.status === 'occupied') occ++; }));
      const vac = Math.max(0, flTotalBeds - occ);
      const pct = flTotalBeds > 0 ? Math.round((occ / flTotalBeds) * 100) : 0;
      rows.push([`${fl}-qavat (Floor ${fl})`, flRooms.length, flTotalBeds, occ, vac, `${pct}%`]);
    });
    rows.push([]);

    // 3. To'lovlar va moliyaviy statistika (Payment and Financial statistics)
    rows.push(['=== 3. TO\'LOVLAR VA MOLIYAVIY STATISTIKA (FINANCIAL & PAYMENT METRICS) ===']);
    rows.push(['Moliyaviy ko\'rsatkich (Financial Metric)', 'Summa (Amount in UZS)', 'Izoh (Notes)']);
    rows.push(['Joriy oy tushumi (This Month Revenue)', stats.thisMonthRevenue, 'Haqiqatda qabul qilingan to\'lovlar']);
    rows.push(['Kutilayotgan tushum (Expected Revenue)', stats.expectedRevenue, 'Faol talabalar oylik to\'lovi']);
    rows.push(['Mavjud qarzdorlik (Total Debt)', stats.totalDebtAmount, 'Qarzdor talabalar jami qarzi']);
    rows.push(['Bo\'sh o\'rinlar salohiyati (Potential Revenue)', stats.potentialVacantRevenue, 'Bo\'sh o\'rinlardan boy berilgan oylik daromad']);
    rows.push(['Faol rezidentlar soni (Active Residents)', students.filter((s) => s.status === 'active').length, 'Yotoqxonada yashayotgan talabalar']);
    rows.push(['Qarzdor talabalar soni (Debtor Students)', students.filter((s) => (s.debtAmount || 0) > 0).length, 'To\'lov muddati kechikkan talabalar']);
    rows.push(['Jami qayd etilgan to\'lovlar (Total Payments)', payments.length, 'Tranzaksiyalar soni']);
    rows.push([]);

    // 4. So'nggi to'lovlar jurnali (Recent payment records)
    if (payments && payments.length > 0) {
      rows.push(['=== 4. SO\'NGGI TO\'LOVLAR RO\'YXATI (PAYMENT TRANSACTIONS) ===']);
      rows.push(['ID', 'Talaba F.I.Sh.', 'Xona', 'Summa (UZS)', 'To\'lov sanasi', 'Qaysi oy uchun', 'To\'lov usuli', 'Holati']);
      payments.slice(0, 100).forEach((p) => {
        rows.push([
          p.id,
          p.studentName || '',
          p.roomNumber || '',
          p.amount,
          p.paymentDate || '',
          p.periodMonth || '',
          p.paymentMethod || '',
          p.status || ''
        ]);
      });
    }

    const csvContent = BOM + rows.map((row) =>
      row.map((val) => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `royal_campus_bandlik_va_tolovlar_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXlsx = () => {
    handleDownloadCSV();
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('reports.title')}</h1>
          <p className="text-xs text-slate-500">{t('reports.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Bandlik va to'lov statistikasini CSV formatida yuklab olish"
          >
            <Download className="w-4 h-4" /> {t('reports.downloadCsv')}
          </button>
          <button
            onClick={handleExportXlsx}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> {t('reports.downloadExcel')}
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#C6A15B]" /> {t('reports.downloadPdf')}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold w-fit">
        <button
          onClick={() => setReportCategory('occupancy')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            reportCategory === 'occupancy' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          {t('reports.occupancyReport')}
        </button>
        <button
          onClick={() => setReportCategory('payments')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            reportCategory === 'payments' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          {t('reports.financialReport')}
        </button>
        <button
          onClick={() => setReportCategory('debt')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            reportCategory === 'debt' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          {t('reports.debtorsReport')}
        </button>
      </div>

      {/* Report Summary Data Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <h3 className="font-extrabold text-slate-900 text-sm">
            {reportCategory === 'occupancy'
              ? t('reports.occupancyReport')
              : reportCategory === 'payments'
              ? t('reports.financialReport')
              : t('reports.debtorsReport')}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer transition-colors active:scale-95"
              title="CSV formatida yuklab olish"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <span className="text-[11px] text-slate-500 font-medium">
              1 {t('common.total').toLowerCase()} • 5 {t('common.floor').toLowerCase()}
            </span>
          </div>
        </div>

        {reportCategory === 'occupancy' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('common.building')}</span>
                <strong className="text-sm text-slate-900">1</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('common.floor')}</span>
                <strong className="text-sm text-slate-900">5</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('common.rooms')}</span>
                <strong className="text-sm text-slate-900">56</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('beds.total')}</span>
                <strong className="text-sm text-slate-900">{formatNumber(stats.totalBeds)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('beds.occupied')}</span>
                <strong className="text-sm text-slate-900">{formatNumber(stats.occupiedBeds)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('dashboard.occupancyRate')}</span>
                <strong className="text-sm text-sky-700">{stats.occupancyPercentage}%</strong>
              </div>
            </div>

            {/* Qavatlar kesimida bandlik jadvali */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">{t('common.floor')}</th>
                    <th className="p-3">{t('common.status')}</th>
                    <th className="p-3">{t('rooms.total')}</th>
                    <th className="p-3">{t('beds.total')}</th>
                    <th className="p-3">{t('beds.occupied')}</th>
                    <th className="p-3">{t('beds.available')}</th>
                    <th className="p-3">{t('dashboard.occupancyRate')} (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-amber-50/40">
                    <td className="p-3 font-bold text-slate-900">1-{t('common.floor')}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase">
                        {t('rooms.commonAreas')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">0</td>
                    <td className="p-3 text-slate-500">0</td>
                    <td className="p-3 text-slate-500">—</td>
                    <td className="p-3 text-slate-500">—</td>
                    <td className="p-3 text-slate-500 font-medium">Reception, kitchen</td>
                  </tr>

                  {[2, 3, 4, 5].map((fl) => {
                    const flRooms = rooms.filter((r) => r.floor === fl);
                    const flExpectedBeds = fl === 2 || fl === 3 ? 88 : 86;
                    const flTotalBeds = flRooms.reduce((acc, r) => acc + r.beds.length, 0) || flExpectedBeds;
                    let occ = 0;
                    flRooms.forEach((r) => r.beds.forEach((b) => { if (b.status === 'occupied') occ++; }));
                    const vac = flTotalBeds - occ;
                    const pct = flTotalBeds > 0 ? Math.round((occ / flTotalBeds) * 100) : 0;

                    return (
                      <tr key={fl} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{fl}-{t('common.floor')}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
                            {t('common.rooms')}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">14</td>
                        <td className="p-3 font-semibold text-slate-800">{flTotalBeds}</td>
                        <td className="p-3 font-bold text-slate-900">{occ}</td>
                        <td className="p-3 font-bold text-emerald-600">{vac}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{pct}%</span>
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-sky-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <td className="p-3 text-slate-900" colSpan={2}>
                      {t('common.total').toUpperCase()} (4 {t('common.floor').toLowerCase()})
                    </td>
                    <td className="p-3 text-slate-900">56</td>
                    <td className="p-3 text-slate-900">344</td>
                    <td className="p-3 text-slate-900">{formatNumber(stats.occupiedBeds)}</td>
                    <td className="p-3 text-emerald-600">{formatNumber(stats.vacantBeds)}</td>
                    <td className="p-3 text-sky-700">{stats.occupancyPercentage}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">{t('common.details')}</th>
                <th className="p-3">{t('common.amount')}</th>
                <th className="p-3">{t('common.notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold">{t('dashboard.monthlyRevenue')}</td>
                <td className="p-3 font-bold text-emerald-600">{formatCurrency(stats.thisMonthRevenue)}</td>
                <td className="p-3 text-slate-500">{t('payments.title')}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">{t('dashboard.expectedRevenue')}</td>
                <td className="p-3 font-bold text-slate-900">{formatCurrency(stats.expectedRevenue)}</td>
                <td className="p-3 text-slate-500">{t('students.filterActive')}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">{t('dashboard.totalDebt')}</td>
                <td className="p-3 font-bold text-rose-600">{formatCurrency(stats.totalDebtAmount)}</td>
                <td className="p-3 text-slate-500">{t('students.filterDebtors')}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">{t('dashboard.potentialRevenue')}</td>
                <td className="p-3 font-bold text-amber-600">{formatCurrency(stats.potentialVacantRevenue)}</td>
                <td className="p-3 text-slate-500">{stats.vacantBeds} {t('rooms.bedsAvailable')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
