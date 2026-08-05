import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, TrendingUp, TrendingDown, History } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const StockAdjustmentModal = ({ asset, onClose, onRefresh }) => {
  const [type, setType] = useState('PURCHASE');
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity === 0) return toast.error("Quantity cannot be zero");

    // For SALE/WASTAGE/ADJUSTMENT down, quantity should be negative in the movement record
    // but the user inputs a positive number.
    const adjustedQty = (type === 'PURCHASE' || (type === 'ADJUSTMENT' && quantity > 0)) ? quantity : -Math.abs(quantity);

    setLoading(true);
    try {
      await api.post(`/assets/${asset.id}/movement/`, {
        type,
        quantity: adjustedQty,
        notes
      });
      toast.success("Inventory adjusted successfully");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Adjustment failed");
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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inventory Adjustment</h3>
             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{asset.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex gap-2">
            {[
              { id: 'PURCHASE', label: 'Stock In', icon: TrendingUp, color: 'text-emerald-500' },
              { id: 'WASTAGE', label: 'Stock Out', icon: TrendingDown, color: 'text-red-500' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setType(m.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                  type === m.id
                    ? "bg-slate-900 border-slate-900 text-white dark:bg-blue-600 dark:border-blue-600"
                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400"
                )}
              >
                <m.icon size={24} className={type === m.id ? "text-white" : m.color} />
                <span className="text-[10px] font-black uppercase tracking-tighter">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Quantity</label>
             <input
               type="number"
               className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
               value={quantity}
               onChange={e => setQuantity(parseInt(e.target.value) || 0)}
               required
             />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Notes / Reference</label>
             <textarea
               className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white h-24 resize-none"
               placeholder="Why is this change being made?"
               value={notes}
               onChange={e => setNotes(e.target.value)}
             />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> CONFIRM ADJUSTMENT</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default StockAdjustmentModal;
