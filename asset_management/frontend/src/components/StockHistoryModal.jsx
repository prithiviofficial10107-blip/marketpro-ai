import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import Skeleton from './Skeleton';

const StockHistoryModal = ({ asset, onClose }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/assets/${asset.id}/history/`);
      setMovements(response.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                <History size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audit Trail</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{asset.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
           {loading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)
           ) : movements.length > 0 ? (
              movements.map((move, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-lg",
                         move.quantity > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                         {move.quantity > 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tighter">{move.type}</p>
                         <p className="text-[10px] text-slate-400">{new Date(move.created_at).toLocaleString()}</p>
                         {move.notes && <p className="text-[10px] text-slate-500 mt-1 italic">"{move.notes}"</p>}
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={cn("text-lg font-black", move.quantity > 0 ? "text-emerald-500" : "text-red-500")}>
                         {move.quantity > 0 ? `+${move.quantity}` : move.quantity}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{move.reference_id}</p>
                   </div>
                </div>
              ))
           ) : (
              <div className="py-20 text-center opacity-50">
                 <Package size={48} className="mx-auto mb-4" />
                 <p className="text-sm font-medium">No movement history found.</p>
              </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default StockHistoryModal;
