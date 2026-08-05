import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Package, Hash, Tag, FileText } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const LogWastageModal = ({ isOpen, onClose, onRefresh, initialProduct = null }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity_wasted: '1',
    reason: 'Expired',
    notes: ''
  });

  const reasons = ['Expired', 'Damaged in Transit', 'Spoiled/Perished', 'Customer Return', 'Quality Issue'];

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      if (initialProduct) {
        setFormData(prev => ({ ...prev, product_id: initialProduct.id }));
      }
    }
  }, [isOpen, initialProduct]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/assets/');
      setProducts(res.data.data.filter(p => p.stock_quantity > 0));
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.quantity_wasted || !formData.reason) {
      return toast.error("Please fill required fields");
    }

    setLoading(true);
    try {
      await api.post('/damaged/', formData);
      toast.success("Wastage logged successfully");
      onRefresh();
      onClose();
      setFormData({ product_id: '', quantity_wasted: '1', reason: 'Expired', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log wastage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-600">
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Log Stock Wastage</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Select Product *</label>
                <select
                  disabled={!!initialProduct}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white appearance-none"
                  value={formData.product_id}
                  onChange={e => setFormData({...formData, product_id: e.target.value})}
                  required
                >
                  <option value="">Choose item...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity} left)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                    value={formData.quantity_wasted}
                    onChange={e => setFormData({...formData, quantity_wasted: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Reason *</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white appearance-none"
                    value={formData.reason}
                    onChange={e => setFormData({...formData, reason: e.target.value})}
                    required
                  >
                    {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Notes</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white h-24 resize-none"
                  placeholder="Details about damage or spoilage..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 shadow-xl shadow-red-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> CONFIRM LOSS</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LogWastageModal;
