import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertCircle,
  Loader2,
  Clock,
  DollarSign,
  Package,
  TrendingDown,
  RefreshCcw,
  Plus,
  ArrowRight,
  Download,
  Filter,
  CheckCircle,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { formatCurrency, formatDate } from '../lib/format';
import Skeleton from '../components/Skeleton';
import DataTable from '../components/DataTable';
import LogWastageModal from '../components/LogWastageModal';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, sub, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-2xl bg-opacity-10 dark:bg-opacity-20", color)}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{value}</h3>
    <p className="text-[10px] text-slate-500 mt-2 font-medium italic">{sub}</p>
  </div>
);

const DamagedAssetsPage = () => {
  const [summary, setSummary] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [initialProduct, setInitialProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter States
  const [filters, setFilters] = useState({
    reason: 'ALL',
    category: 'ALL',
    startDate: '',
    endDate: ''
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyLocalFilters();
  }, [logs, searchTerm, filters]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, expRes, logRes] = await Promise.all([
        api.get('/damaged/summary'),
        api.get('/damaged/expiring-soon'),
        api.get('/damaged/')
      ]);
      setSummary(sumRes.data.data);
      setExpiring(expRes.data.data);
      setLogs(logRes.data.data);

      // Extract unique categories from logs for the filter
      const uniqueCats = ['ALL', ...new Set(logRes.data.data.map(l => l.category_name))];
      setCategories(uniqueCats);
    } catch (err) {
      toast.error("Failed to load wastage data");
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFilters = () => {
    let result = [...logs];

    // 1. Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.product_name.toLowerCase().includes(term) ||
        l.reason.toLowerCase().includes(term)
      );
    }

    // 2. Reason Filter
    if (filters.reason !== 'ALL') {
      result = result.filter(l => l.reason === filters.reason);
    }

    // 3. Category Filter
    if (filters.category !== 'ALL') {
      result = result.filter(l => l.category_name === filters.category);
    }

    // 4. Date Range
    if (filters.startDate) {
      result = result.filter(l => new Date(l.reported_date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59);
      result = result.filter(l => new Date(l.reported_date) <= end);
    }

    setFilteredLogs(result);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this wastage record? This cannot be undone.")) return;

    try {
      await api.delete(`/damaged/${id}`);
      toast.success("Record deleted");
      fetchAllData();
    } catch (err) {
      toast.error("Failed to delete record");
    }
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'product_name',
      cell: (row) => (
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
              <Package size={16} />
           </div>
           <div>
              <p className="font-bold text-slate-800 dark:text-white">{row.product_name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{row.category_name}</p>
           </div>
        </div>
      )
    },
    {
      header: 'Reason',
      accessor: 'reason',
      cell: (row) => (
        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
          row.reason === 'Expired' ? "bg-red-50 text-red-600 border-red-100" :
          row.reason === 'Spoiled/Perished' ? "bg-orange-50 text-orange-600 border-orange-100" :
          "bg-slate-50 text-slate-600 border-slate-100"
        )}>
           {row.reason}
        </span>
      )
    },
    { header: 'Qty', accessor: 'quantity_wasted' },
    {
      header: 'Cost Impact',
      accessor: 'cost_impact',
      cell: (row) => <span className="font-bold text-red-500">{formatCurrency(row.cost_impact)}</span>
    },
    {
      header: 'Reported',
      accessor: 'reported_date',
      cell: (row) => (
        <div className="text-[10px]">
           <p className="font-bold text-slate-700 dark:text-slate-300">{formatDate(row.reported_date)}</p>
           <p className="text-slate-400 uppercase font-medium">By {row.reported_by_name}</p>
        </div>
      )
    }
  ];

  if (loading && !summary) return <div className="p-8"><Loader2 className="animate-spin mx-auto mt-20" /></div>;

  return (
    <div className="p-5 h-full flex flex-col space-y-6 overflow-y-auto pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Wastage Tracker</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold italic text-[10px] uppercase tracking-widest">Spoilage & Damage Monitoring</p>
        </div>
        <div className="flex gap-3">
           <button
             onClick={fetchAllData}
             className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
           >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
           </button>
           <button
             onClick={() => { setInitialProduct(null); setShowLogModal(true); }}
             className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all active:scale-95"
           >
             <Plus size={20} /> Log New Wastage
           </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard
            title="Items Wasted"
            value={summary?.total_items || 0}
            sub="Current Month"
            icon={TrendingDown}
            color="bg-red-500"
         />
         <StatCard
            title="Cost Impact"
            value={formatCurrency(summary?.total_cost || 0)}
            sub="Current Month Loss"
            icon={DollarSign}
            color="bg-rose-500"
         />
         <StatCard
            title="Expiring Soon"
            value={summary?.expiring_soon || 0}
            sub="Next 7 Days"
            icon={Clock}
            color="bg-amber-500"
         />
         <StatCard
            title="Peak Category"
            value={summary?.most_wasted_category || 'N/A'}
            sub="Highest Cost Loss"
            icon={ShieldAlert}
            color="bg-indigo-500"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Expiring Soon Section */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 flex flex-col h-[450px]">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock className="text-amber-500" size={16} /> Attention Required (Expiry)
               </h2>
               <span className="text-[10px] font-bold text-slate-400 italic">Sorted by soonest first</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
               {expiring.length > 0 ? (
                  expiring.map(prod => {
                    const days = Math.ceil((new Date(prod.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={prod.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-amber-200 transition-all">
                         <div className="flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs",
                               days <= 0 ? "bg-red-500 text-white" : days <= 3 ? "bg-orange-500 text-white" : "bg-amber-100 text-amber-600")}>
                               {days <= 0 ? 'EXP' : days}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-800 dark:text-white">{prod.name}</p>
                               <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Stock: {prod.stock_quantity} {prod.unit_of_measure} • Expires: {formatDate(prod.expiry_date)}</p>
                            </div>
                         </div>
                         <button
                           onClick={() => { setInitialProduct(prod); setShowLogModal(true); }}
                           className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black transition-all shadow-lg shadow-red-500/20 active:scale-95"
                         >
                            LOG AS WASTAGE <ArrowRight size={12} />
                         </button>
                      </div>
                    );
                  })
               ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 grayscale">
                     <CheckCircle size={48} className="text-emerald-500" />
                     <p className="text-xs font-black uppercase tracking-widest text-slate-500">No Immediate Expiries Found</p>
                  </div>
               )}
            </div>
         </div>

         {/* Chart Section */}
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 h-[450px]">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Wastage by Category</h2>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary?.category_distribution || []} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={80} />
                     <Tooltip
                        contentStyle={{ borderRadius: '1rem', border: 'none' }}
                        formatter={(val) => `₹${val.toLocaleString()}`}
                     />
                     <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Main Logs Table */}
      <div className="space-y-6">
         <div className="px-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Historical Wastage Log</h2>
         </div>

         <div className="flex gap-8 relative min-h-[600px]">
            <div className="flex-1 min-h-0">
               <DataTable
                  columns={columns}
                  data={filteredLogs}
                  loading={loading}
                  searchTerm={searchTerm}
                  onSearch={setSearchTerm}
                  onFilterClick={() => setShowFilters(!showFilters)}
                  actions={(row) => (
                     <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                     >
                        <Trash2 size={18} />
                     </button>
                  )}
               />
            </div>

            {/* Filter Sidebar */}
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
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</label>
                           <select
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white appearance-none"
                              value={filters.reason}
                              onChange={e => setFilters({...filters, reason: e.target.value})}
                           >
                              <option value="ALL">All Reasons</option>
                              {['Expired', 'Damaged in Transit', 'Spoiled/Perished', 'Customer Return', 'Quality Issue'].map(r => (
                                 <option key={r} value={r}>{r}</option>
                              ))}
                           </select>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                           <select
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white appearance-none"
                              value={filters.category}
                              onChange={e => setFilters({...filters, category: e.target.value})}
                           >
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                        onClick={() => { setFilters({reason:'ALL', category:'ALL', startDate:'', endDate:''}); setSearchTerm(''); }}
                        className="mt-4 text-[10px] font-bold text-red-500 hover:underline"
                     >
                        Reset all filters
                     </button>
                  </motion.aside>
               )}
            </AnimatePresence>
         </div>
      </div>

      <LogWastageModal
         isOpen={showLogModal}
         onClose={() => setShowLogModal(false)}
         onRefresh={fetchAllData}
         initialProduct={initialProduct}
      />
    </div>
  );
};

export default DamagedAssetsPage;
