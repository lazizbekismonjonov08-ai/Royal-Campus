import React, { useState } from 'react';
import { useDorm } from '../context/DormContext';
import { useI18n } from '../i18n/I18nContext';
import { Role } from '../types';
import { UserCheck, Plus } from 'lucide-react';
import { ModalHeader } from '../components/ModalHeader';

export const S80_EmployeesList: React.FC = () => {
  const { employees, toggleEmployeeStatus, addEmployee, role } = useDorm();
  const { t, formatDate } = useI18n();
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '+998 90 ',
    email: '',
    role: 'receptionist' as Role,
    status: 'active' as const,
  });

  // Handle escape key for add employee modal
  React.useEffect(() => {
    if (!showAddModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;
    addEmployee(formData);
    setShowAddModal(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{t('employees.title')}</h1>
          <p className="text-xs text-slate-500">{t('employees.subtitle')}</p>
        </div>

        {role === 'owner' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('employees.addEmployee')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5">{t('employees.name')}</th>
              <th className="p-3.5">{t('employees.role')}</th>
              <th className="p-3.5">{t('employees.phone')} / {t('employees.email')}</th>
              <th className="p-3.5">{t('employees.lastLogin')}</th>
              <th className="p-3.5">{t('employees.status')}</th>
              <th className="p-3.5 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-extrabold text-slate-900">{emp.fullName}</td>
                <td className="p-3.5">
                  <span className="bg-sky-100 text-sky-900 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                    {t(`role.${emp.role}`) || emp.role}
                  </span>
                </td>
                <td className="p-3.5">
                  <div>{emp.phone}</div>
                  <div className="text-[10px] text-slate-400">{emp.email}</div>
                </td>
                <td className="p-3.5 text-slate-500">{formatDate(emp.lastLogin)}</td>
                <td className="p-3.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      emp.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {emp.status === 'active' ? t('employees.active') : t('employees.disabled')}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  {role === 'owner' && emp.role !== 'owner' && (
                    <button
                      onClick={() => toggleEmployeeStatus(emp.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        emp.status === 'active'
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {emp.status === 'active' ? t('employees.disabled') : t('employees.active')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-employee-modal-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto max-h-[92vh] flex flex-col relative"
          >
            <ModalHeader
              icon={<UserCheck className="w-5 h-5 text-sky-600" />}
              title={<span id="add-employee-modal-title">{t('employees.modalTitle')}</span>}
              subtitle={t('employees.subtitle')}
              onClose={() => setShowAddModal(false)}
              ariaLabel={t('common.close')}
            />

            <form onSubmit={handleAddSubmit} className="space-y-3 overflow-y-auto flex-1 pr-0.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('employees.name')}:</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('employees.phone')}:</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('employees.email')}:</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('employees.role')}:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
                >
                  <option value="manager">{t('role.manager')}</option>
                  <option value="receptionist">{t('role.receptionist')}</option>
                  <option value="security">{t('role.security')}</option>
                  <option value="cleaner">{t('role.cleaner')}</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#101C32] hover:bg-[#1A2D4F] border border-[#C6A15B]/50 text-[#C6A15B] hover:text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
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
