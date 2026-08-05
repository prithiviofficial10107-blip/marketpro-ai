import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { History, Shield, Package, ShoppingCart, Users, AlertTriangle, Truck, Settings, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatDate } from '../lib/format';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [filters, setFilters] = useState({
    module: 'ALL',
    user: 'ALL',
    startDate: '',
    endDate: ''
  });

  const [users, setUsers] = useState([]);
  const modules = ['ALL', 'Billing', 'Product Stock', 'Staff', 'Wastage', 'Procurement', 'Settings', 'Auth'];

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  useEffect(() => {
    applyLocalFilters();
  }, [logs, searchTerm, filters]);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/admin/activity-logs');
      setLogs(response.data.data);
    } catch (err) {
      console.error('Error fetching logs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(['ALL', ...res.data.data.map(u => u.username)]);
    } catch (err) {}
  };

  const applyLocalFilters = () => {
    let result = [...logs];

    // 1. Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.description?.toLowerCase().includes(term) ||
        l.action?.toLowerCase().includes(term) ||
        l.user?.toLowerCase().includes(term)
      );
    }

    // 2. Module Filter
    if (filters.module !== 'ALL') {
      result = result.filter(l => l.module === filters.module);
    }

    // 3. User Filter
    if (filters.user !== 'ALL') {
      result = result.filter(l => l.user === filters.user);
    }

    // 4. Date Range
    if (filters.startDate) {
      result = result.filter(l => new Date(l.created_at) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59);
      result = result.filter(l => new Date(l.created_at) <= end);
    }

    setFilteredLogs(result);
  };

  const getModuleIcon = (module) => {
    switch (module) {
      case 'Billing': return <ShoppingCart size={16} className="text-emerald-500" />;
      case 'Product Stock': return <Package size={16} className="text-blue-500" />;
      case 'Staff': return <Users size={16} className="text-indigo-500" />;
      case 'Wastage': return <AlertTriangle size={16} className="text-red-500" />;
      case 'Procurement': return <Truck size={16} className="text-orange-500" />;
      case 'Auth': return <Shield size={16} className="text-purple-500" />;
      default: return <Settings size={16} className="text-slate-400" />;
    }
  };

  const columns = [
    {
      header: 'Event',
      accessor: 'action',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            {getModuleIcon(row.module)}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white leading-none">{row.action}</p>
            <p className="text-[10px] text-slate-400 uppercase mt-1 font-black tracking-widest">{row.module}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (row) => <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md line-clamp-2">{row.description}</p>
    },
    {
      header: 'Staff Member',
      accessor: 'user',
      cell: (row) => (
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">
              {row.user[0].toUpperCase()}
           </div>
           <span className="font-bold text-slate-700 dark:text-slate-300">{row.user}</span>
        </div>
      )
    },
    {
      header: 'Timestamp',
      accessor: 'created_at',
      cell: (row) => (
        <div className="text-[10px]">
           <p className="font-bold text-slate-700 dark:text-slate-300">{formatDate(row.created_at)}</p>
           <p className="text-slate-400 uppercase">System Time</p>
        </div>
      )
    }
  ];

  return (
    <div className="p-5 h-full flex flex-col space-y-5">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Audit Trail</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold text-[10px] uppercase tracking-widest">System Integrity Log</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border",
             showFilters ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600")}
        >
           <Filter size={18} /> Advanced Filters
        </button>
      </header>

      <div className="flex-1 flex gap-8 min-h-0 relative">
        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filteredLogs}
            loading={loading}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onFilterClick={() => setShowFilters(!showFilters)}
          />
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col gap-8 h-fit sticky top-0"
            >
               <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">Filter Engine</h3>
                  <button onClick={() => setShowFilters(false)} className="p-1 text-slate-400"><X size={16} /></button>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Module</label>
                     <select
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white appearance-none"
                        value={filters.module}
                        onChange={e => setFilters({...filters, module: e.target.value})}
                     >
                        {modules.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</label>
                     <select
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white appearance-none"
                        value={filters.user}
                        onChange={e => setFilters({...filters, user: e.target.value})}
                     >
                        {users.map(u => <option key={u} value={u}>{u}</option>)}
                     </select>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</label>
                     <input
                        type="date"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white mb-2"
                        value={filters.startDate}
                        onChange={e => setFilters({...filters, startDate: e.target.value})}
                     />
                     <input
                        type="date"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white"
                        value={filters.endDate}
                        onChange={e => setFilters({...filters, endDate: e.target.value})}
                     />
                  </div>
               </div>

               <button
                  onClick={() => { setFilters({module:'ALL', user:'ALL', startDate:'', endDate:''}); setSearchTerm(''); }}
                  className="mt-4 text-[10px] font-bold text-red-500 hover:underline"
               >
                  Reset all filters
               </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityLogPage;
