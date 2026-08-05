import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCcw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Skeleton from '../components/Skeleton';

import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, onClick }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all cursor-pointer group",
      onClick && "hover:border-blue-200 dark:hover:border-blue-900 shadow-md hover:shadow-blue-500/5"
    )}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl bg-opacity-10 dark:bg-opacity-20", color)}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs font-bold", trend === 'up' ? 'text-green-500' : 'text-red-500')}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}%
        </div>
      )}
    </div>
    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</h3>
  </motion.div>
);

const AlertItem = ({ title, count, type, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      "p-4 rounded-xl flex items-center justify-between transition-all",
      onClick && "cursor-pointer hover:scale-[1.02] active:scale-95",
      type === 'danger' ? 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30' :
      type === 'warning' ? 'bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30' :
      'bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30'
    )}
  >
    <div className="flex items-center gap-3">
      <div className={cn("w-2 h-2 rounded-full",
        type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
      )} />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</span>
    </div>
    <span className={cn("text-sm font-bold",
        type === 'danger' ? 'text-red-600' : type === 'warning' ? 'text-orange-600' : 'text-blue-600'
    )}>{count}</span>
  </div>
);

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/analytics/');
      if (response.data && response.data.data) {
         setData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError("We encountered an error while syncing your store data. Please try again.");
      toast.error("Data synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAnalytics();
  }, [user]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Store Analytics Summary', 14, 22);
    doc.save('store_analytics.pdf');
  };

  const exportExcel = () => {
    if (!data || !data.status_counts) return;
    const ws = XLSX.utils.json_to_sheet([{ Metric: 'Total Assets', Value: data.total_assets }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics");
    XLSX.writeFile(wb, "store_data.xlsx");
  };

  if (loading) return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-6">
       <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 shadow-inner">
          <AlertTriangle size={40} />
       </div>
       <div className="max-w-md">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Synchronization Error</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{error}</p>
       </div>
       <button
          onClick={fetchAnalytics}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
       >
          <RefreshCcw size={18} /> Retry Sync
       </button>
    </div>
  );

  if (!data) return null;

  return (
    <div className="p-5 h-full flex flex-col space-y-5 overflow-y-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-glow">{t('dashboard.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-[10px] font-bold uppercase tracking-widest italic">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all disabled:opacity-50"
          >
            <RefreshCcw size={16} className={cn(loading && "animate-spin")} /> {loading ? "Updating..." : "Refresh"}
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
            <FileText size={16} /> PDF
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all">
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard
          title="Available"
          value={data.status_counts?.available || 0}
          icon={CheckCircle}
          color="bg-emerald-500"
          onClick={() => navigate('/assets?status=available')}
        />
        <StatCard
          title="Assigned"
          value={data.status_counts?.assigned || 0}
          icon={Users}
          color="bg-blue-500"
          onClick={() => navigate('/assets?status=assigned')}
        />
        <StatCard
          title="Monthly Sales"
          value={formatCurrency(data.financials?.monthly_revenue || 0)}
          icon={TrendingUp}
          color="bg-indigo-500"
          onClick={() => navigate('/billing/history')}
        />
        <StatCard
          title="Damaged"
          value={data.status_counts?.damaged || 0}
          icon={ShieldAlert}
          color="bg-red-500"
          onClick={() => navigate('/damaged')}
        />
        <StatCard
          title="Staff Count"
          value={data.total_employees || 0}
          icon={Users}
          color="bg-slate-500"
          onClick={() => navigate('/employees')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Performance Chart */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

            <div className="flex justify-between items-start mb-10">
               <div>
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Financial Performance</h2>
                  <p className="text-xs text-slate-500 font-medium italic">Revenue vs Procurement Spend (Last 6 Months)</p>
               </div>
               <div className="flex gap-10">
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Value</p>
                     <p className="text-xl font-black text-blue-600">{formatCurrency(data.financials?.total_inventory_value || 0)}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">30d Spend</p>
                     <p className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(data.financials?.monthly_procurement || 0)}</p>
                  </div>
               </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends?.performance || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fill="url(#colorRev)" name="Revenue" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorExp)" name="Expense" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
             {/* Category Value Pie */}
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 h-[400px]">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Inventory by Category</h2>
                <ResponsiveContainer width="100%" height="85%">
                   <PieChart>
                      <Pie
                        data={data.distributions?.categories || []}
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {(data.distributions?.categories || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                         contentStyle={{ borderRadius: '1rem', border: 'none' }}
                         formatter={(val) => `₹${val.toLocaleString()}`}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                   </PieChart>
                </ResponsiveContainer>
             </div>

             {/* Wastage Trend */}
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 h-[400px]">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Wastage / Loss Trend</h2>
                <ResponsiveContainer width="100%" height="85%">
                   <BarChart data={data.trends?.performance || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                      <Bar dataKey="loss" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Loss (₹)" />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col h-[500px]">
             <div className="absolute bottom-0 left-0 w-40 h-40 bg-red-500/5 rounded-full -ml-20 -mb-20 blur-3xl group-hover:bg-red-500/10 transition-colors" />
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
               <Activity className="text-red-500" size={16} /> Critical Alerts
             </h2>

             <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {data.critical_alerts && data.critical_alerts.length > 0 ? (
                  data.critical_alerts.map((alert, idx) => (
                    <AlertItem
                      key={idx}
                      title={alert.message}
                      count={alert.label}
                      type={alert.type}
                      onClick={() => navigate(alert.link)}
                    />
                  ))
               ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50 grayscale">
                     <CheckCircle size={48} className="text-emerald-500" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">All Stock Levels Healthy</p>
                  </div>
               )}
             </div>

             <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                <button onClick={() => navigate('/assets')} className="w-full text-center text-[10px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest transition-colors">
                   Open Inventory Control →
                </button>
             </div>
           </div>

           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <h3 className="text-xl font-black mb-4 tracking-tight">Smart AI Advisor</h3>
              <p className="text-blue-100 text-xs leading-relaxed mb-8 font-medium">
                 "Inventory value has grown by <strong>12%</strong> this month. Consider checking slow-moving stock in the Bakery category."
              </p>
              <button onClick={() => navigate('/reports')} className="w-full bg-white text-blue-700 font-black py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-lg text-[10px] uppercase tracking-widest">
                 View Forecast
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
