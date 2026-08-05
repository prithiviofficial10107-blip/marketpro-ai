import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  ShieldAlert,
  Wrench,
  CheckCircle,
  Clock,
  ExternalLink,
  Laptop,
  Smartphone,
  Info
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, detail }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none transition-all flex flex-col gap-6"
  >
    <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center text-${color.split('-')[1]}-600 dark:bg-opacity-20`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{value}</h3>
      <p className="text-xs text-slate-500 mt-2 font-medium">{detail}</p>
    </div>
  </motion.div>
);

const EmployeeDashboard = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async () => {
    try {
      const response = await api.get('/assets/');
      // Demo: show top 3
      setAssets(response.data.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reportDamage = (assetName) => {
    toast.success(`Success! IT team notified about ${assetName}.`, {
       icon: '🛠️',
       style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-12 pb-20"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Workspace</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg font-medium">Verified staff access • Secure cloud infrastructure</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black">AD</div>
              <div className="pr-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Employee</p>
                 <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">Administrator</p>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Assigned Tools" value={assets.length} icon={Package} color="bg-indigo-500" detail="Hardware in your custody" />
        <StatCard title="Active Alerts" value="0" icon={ShieldAlert} color="bg-rose-500" detail="Security or health warnings" />
        <StatCard title="Service Health" value="100%" icon={CheckCircle} color="bg-emerald-500" detail="Uptime of your equipment" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
           <section>
              <div className="flex items-center justify-between mb-8 px-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Asset List</h2>
                <button className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-2 transition-all">
                   Full Log <ExternalLink size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {loading ? (
                   [1,2].map(i => <div key={i} className="h-40 bg-white dark:bg-slate-900 animate-pulse rounded-[2.5rem] border border-slate-100 dark:border-slate-800" />)
                ) : assets.length > 0 ? (
                  assets.map(asset => (
                    <motion.div
                      key={asset.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/10 dark:shadow-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400">
                          {asset.type?.toLowerCase().includes('laptop') ? <Laptop size={32} /> : <Package size={32} />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{asset.name}</h3>
                          <div className="flex items-center gap-3 mt-2">
                             <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest">{asset.serial_number}</span>
                             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{asset.category_name}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => reportDamage(asset.name)}
                        className="w-full sm:w-auto px-8 py-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-xs font-black rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                      >
                        Report Issue
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-24 text-center">
                     <p className="text-slate-400 font-medium italic">No assets assigned yet.</p>
                  </div>
                )}
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <section className="bg-slate-900 dark:bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <h3 className="text-2xl font-black mb-4 tracking-tighter">Support</h3>
              <p className="text-slate-400 dark:text-indigo-100 text-sm leading-relaxed mb-10 font-medium">
                 Need a hardware upgrade or experiencing technical difficulties?
              </p>
              <button className="w-full bg-white text-slate-900 dark:text-indigo-700 font-black py-4.5 rounded-2xl hover:bg-slate-50 transition-all shadow-xl text-xs uppercase tracking-widest">
                 Open Ticket
              </button>
           </section>

           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-500 mb-6 font-black text-[10px] uppercase tracking-widest">
                 <Info size={14} /> Quick Guidelines
              </div>
              <ul className="space-y-6">
                 {[
                   "Always lock your device when away.",
                   "Keep liquid away from hardware.",
                   "Report minor faults instantly."
                 ].map((text, i) => (
                   <li key={i} className="flex gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                      {text}
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeDashboard;
