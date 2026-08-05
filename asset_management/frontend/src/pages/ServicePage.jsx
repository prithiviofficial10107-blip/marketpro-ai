import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Loader2,
  Plus,
  TrendingUp,
  History,
  RefreshCcw,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { formatCurrency, formatDate } from '../lib/format';
import DataTable from '../components/DataTable';
import CreatePOModal from '../components/CreatePOModal';
import { motion, AnimatePresence } from 'framer-motion';

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

const ServicePage = () => {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reorders, setReorders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReorder, setSelectedReorder] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordRes, sumRes, reoRes] = await Promise.all([
        api.get('/service/'),
        api.get('/service/summary'),
        api.get('/service/suggested-reorders')
      ]);
      setOrders(ordRes.data.data);
      setSummary(sumRes.data.data);
      setReorders(reoRes.data.data);
    } catch (err) {
      toast.error("Failed to load procurement data");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (id) => {
    try {
      await api.put(`/service/${id}/receive`);
      toast.success("Inventory restocked successfully");
      fetchAllData();
    } catch (err) {
      toast.error("Failed to update stock");
    }
  };

  const columns = [
    {
      header: 'Order Details',
      accessor: 'po_number',
      cell: (row) => (
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
              <Truck size={20} />
           </div>
           <div>
              <p className="font-bold text-slate-800 dark:text-white uppercase tracking-tighter">{row.po_number}</p>
              <p className="text-[10px] text-slate-400 font-medium">Order Date: {formatDate(row.order_date)}</p>
           </div>
        </div>
      )
    },
    {
      header: 'Supplier',
      accessor: 'supplier_name',
      cell: (row) => (
        <div className="flex flex-col">
           <span className="text-slate-700 dark:text-slate-300 font-bold">{row.supplier_name}</span>
           <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{row.items_count} SKUs INCLUDED</span>
        </div>
      )
    },
    {
      header: 'Budget',
      accessor: 'total_cost',
      cell: (row) => <span className="font-black text-slate-800 dark:text-white">{formatCurrency(row.total_cost)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
          row.status === 'Received' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
          row.status === 'Pending' ? "bg-slate-50 text-slate-500 border-slate-100" :
          "bg-blue-50 text-blue-600 border-blue-100"
        )}>
           {row.status}
        </span>
      )
    }
  ];

  if (loading && !summary) return <div className="p-8"><Loader2 className="animate-spin mx-auto mt-20" /></div>;

  return (
    <div className="p-5 h-full flex flex-col space-y-6 overflow-y-auto pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Procurement</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold italic text-[10px] uppercase tracking-widest">Supply Chain & Restocking</p>
        </div>
        <div className="flex gap-3">
           <button
             onClick={fetchAllData}
             className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
           >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
           </button>
           <button
             onClick={() => { setSelectedReorder(null); setShowCreateModal(true); }}
             className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
           >
             <Plus size={20} /> New Purchase Order
           </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard
            title="Pending Orders"
            value={summary?.pending_orders || 0}
            sub="Awaiting Delivery"
            icon={Clock}
            color="bg-blue-500"
         />
         <StatCard
            title="Monthly Spend"
            value={formatCurrency(summary?.monthly_spend || 0)}
            sub="Authorized Payments"
            icon={TrendingUp}
            color="bg-emerald-500"
         />
         <StatCard
            title="Active Suppliers"
            value={summary?.active_suppliers || 0}
            sub="Partner Network"
            icon={Building}
            color="bg-indigo-500"
         />
         <StatCard
            title="Awaiting Units"
            value={summary?.items_awaiting || 0}
            sub="Expected Stock In"
            icon={Package}
            color="bg-orange-500"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Suggested Reorders */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 flex flex-col h-[450px]">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="text-emerald-500" size={16} /> Smart Restock Suggestions
               </h2>
               <span className="text-[10px] font-bold text-slate-400 italic">Based on current reorder levels</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
               {reorders.length > 0 ? (
                  reorders.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                             <Package size={18} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</p>
                             <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Current: {item.stock_quantity} • Min: {item.reorder_level} • Supplier: {item.supplier_name}</p>
                          </div>
                       </div>
                       <button
                         onClick={() => { setSelectedReorder(item); setShowCreateModal(true); }}
                         className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                       >
                          CREATE PO <ArrowRight size={12} />
                       </button>
                    </div>
                  ))
               ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 grayscale">
                     <CheckCircle size={48} className="text-emerald-500" />
                     <p className="text-xs font-black uppercase tracking-widest text-slate-500">Inventory Levels Optimal</p>
                  </div>
               )}
            </div>
         </div>

         {/* Supplier Spend Summary */}
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 h-[450px] flex flex-col">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Supplier Distribution</h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
               {(summary?.supplier_distribution || []).map((sup, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 truncate pr-4">{sup.name}</span>
                        <span className="text-[11px] font-bold text-blue-600">{formatCurrency(sup.value)}</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                           className="h-full bg-blue-600 rounded-full"
                           style={{ width: `${Math.min((sup.value / summary.monthly_spend) * 100, 100)}%` }}
                        />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="space-y-6">
         <div className="px-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Master Purchase Log</h2>
         </div>
         <div className="h-[600px]">
            <DataTable
               columns={columns}
               data={orders}
               loading={loading}
               actions={(row) => (
                  <div className="flex gap-2">
                     {row.status === 'Ordered' || row.status === 'Shipped' ? (
                        <button
                          onClick={() => handleReceive(row.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                           <CheckCircle size={14} /> MARK RECEIVED
                        </button>
                     ) : null}
                  </div>
               )}
            />
         </div>
      </div>

      <CreatePOModal
         isOpen={showCreateModal}
         onClose={() => setShowCreateModal(false)}
         onRefresh={fetchAllData}
         initialReorder={selectedReorder}
      />
    </div>
  );
};

export default ServicePage;
