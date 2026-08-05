import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserPlus, Mail, Phone, Briefcase, ExternalLink } from 'lucide-react';
import DataTable from '../components/DataTable';
import AddStaffModal from '../components/AddStaffModal';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const EmployeesPage = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees/');
      let data = response.data.data;
      if (searchTerm) {
        data = data.filter(e =>
          `${e.first_name} ${e.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Employee',
      accessor: 'first_name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
            {row.first_name[0]}{row.last_name[0]}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white">{row.first_name} {row.last_name}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{row.employee_code}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'designation',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-700 dark:text-slate-300 font-medium">{row.designation}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{row.department}</span>
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: 'email',
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Mail size={12} /> {row.email}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone size={12} /> {row.phone || 'No phone'}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
          row.status === 'active' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-red-50 text-red-600'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  const actions = (row) => (
    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
      <ExternalLink size={18} />
    </button>
  );

  return (
    <div className="p-5 h-full flex flex-col space-y-5">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('staff.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold text-[10px] uppercase tracking-widest">{t('staff.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
        >
          <UserPlus size={20} /> {t('common.add_personnel')}
        </button>
      </header>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          actions={actions}
        />
      </div>

      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onRefresh={fetchEmployees}
      />
    </div>
  );
};

export default EmployeesPage;
