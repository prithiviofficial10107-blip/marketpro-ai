import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Download, TrendingUp, Package, DollarSign, PieChart, Loader2 } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../lib/format';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie } from 'recharts';

const ReportDetailModal = ({ isOpen, onClose, type, title }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    if (isOpen) fetchReportData();
  }, [isOpen, dateRange, type]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let params = {};

      if (type === 'inventory') endpoint = '/reports/inventory-summary';
      else if (type === 'sales') {
        endpoint = '/reports/sales';
        params = { start_date: dateRange.start, end_date: dateRange.end };
      } else if (type === 'wastage') {
        endpoint = '/reports/wastage-procurement';
        params = { start_date: dateRange.start, end_date: dateRange.end };
      }

      const response = await api.get(endpoint, { params });
      setData(response.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Generating Insight...</p>
      </div>
    );

    if (!data) return null;

    if (type === 'inventory') {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Inventory Value</p>
                <h4 className="text-3xl font-black text-blue-600">{formatCurrency(data.total_inventory_value)}</h4>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total SKUs Registered</p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white">{data.total_assets}</h4>
             </div>
          </div>

          <div className="space-y-4">
             <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Stock Health Breakdown</h5>
             <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Well Stocked', val: data.stock_alerts.well_stocked, color: 'text-emerald-500' },
                  { label: 'Low Stock', val: data.stock_alerts.low_stock, color: 'text-amber-500' },
                  { label: 'Out of Stock', val: data.stock_alerts.out_of_stock, color: 'text-red-500' }
                ].map(item => (
                  <div key={item.label} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                     <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{item.label}</p>
                     <p className={cn("text-xl font-black", item.color)}>{item.val}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      );
    }

    if (type === 'sales') {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-6">
             <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
                <p className="text-2xl font-black text-blue-600">{formatCurrency(data.total_revenue)}</p>
             </div>
             <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bills Issued</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{data.total_bills}</p>
             </div>
             <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Ticket</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(data.average_bill_value)}</p>
             </div>
          </div>

          <div className="space-y-4">
             <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Top Selling Products</h5>
             <div className="space-y-2">
                {data.top_products.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{prod.name}</span>
                     </div>
                     <span className="text-xs font-black text-slate-400">{prod.quantity} Units Sold</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      );
    }

    if (type === 'wastage') {
      return (
        <div className="space-y-8">
           <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-red-50/30 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
                 <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Total Wastage Loss</p>
                 <p className="text-3xl font-black text-red-600">{formatCurrency(data.total_wastage)}</p>
              </div>
              <div className="p-6 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                 <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Procurement</p>
                 <p className="text-3xl font-black text-emerald-600">{formatCurrency(data.total_procurement)}</p>
              </div>
           </div>

           <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Wastage Distribution by Category</h5>
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.wastage_by_category}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                    <Bar dataKey="value" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                    {type === 'sales' ? <TrendingUp size={20} /> : type === 'inventory' ? <Package size={20} /> : <DollarSign size={20} />}
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Analytics Report</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-blue-600 transition-colors" title="Download Report">
                    <Download size={20} />
                 </button>
                 <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                   <X size={20} />
                 </button>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
               <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                     <Calendar size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Timeframe</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <input
                       type="date"
                       className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500"
                       value={dateRange.start}
                       onChange={e => setDateRange({...dateRange, start: e.target.value})}
                     />
                     <span className="text-slate-300">to</span>
                     <input
                       type="date"
                       className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500"
                       value={dateRange.end}
                       onChange={e => setDateRange({...dateRange, end: e.target.value})}
                     />
                  </div>
               </div>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {renderContent()}
            </div>

            <div className="p-6 border-t border-slate-50 dark:border-slate-800 text-center">
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Software Powered by MarketPro AI</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportDetailModal;
