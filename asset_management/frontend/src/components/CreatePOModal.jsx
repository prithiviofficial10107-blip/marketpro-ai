import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Trash2, Truck, Package, Calendar, DollarSign } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

const CreatePOModal = ({ isOpen, onClose, onRefresh, initialReorder = null }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_date: '',
    items: [{ product_id: '', quantity: 1, cost: 0 }]
  });

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      if (initialReorder) {
        setFormData({
          supplier_id: initialReorder.supplier_id || '',
          expected_date: '',
          items: [{
            product_id: initialReorder.id,
            quantity: initialReorder.suggested_qty,
            cost: 0 // Will be fetched/calculated
          }]
        });
      }
    }
  }, [isOpen, initialReorder]);

  const fetchMetadata = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/admin/suppliers'),
        api.get('/assets/')
      ]);
      setSuppliers(supRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, cost: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_id || formData.items.some(i => !i.product_id)) {
      return toast.error("Please fill all required fields");
    }

    setLoading(true);
    try {
      await api.post('/service/', formData);
      toast.success("Purchase Order created successfully");
      onRefresh();
      onClose();
      setFormData({ supplier_id: '', expected_date: '', items: [{ product_id: '', quantity: 1, cost: 0 }] });
    } catch (err) {
      toast.error("Failed to create PO");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = formData.items.reduce((sum, item) => {
    const prod = products.find(p => p.id === parseInt(item.product_id));
    return sum + ((prod?.cost_price || 0) * item.quantity);
  }, 0);

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
            className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                  <Truck size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Purchase Order</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Select Supplier *</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none dark:text-white"
                    value={formData.supplier_id}
                    onChange={e => setFormData({...formData, supplier_id: e.target.value})}
                    required
                  >
                    <option value="">Choose Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Expected Delivery</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    value={formData.expected_date}
                    onChange={e => setFormData({...formData, expected_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Items</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                    >
                       <Plus size={14} /> ADD LINE ITEM
                    </button>
                 </div>

                 <div className="space-y-3">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 relative group">
                         <div className="flex-1 space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Product</label>
                            <select
                              className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none dark:text-white"
                              value={item.product_id}
                              onChange={e => updateItem(idx, 'product_id', e.target.value)}
                              required
                            >
                               <option value="">Search Product...</option>
                               {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                         </div>
                         <div className="w-24 space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Qty</label>
                            <input
                              type="number"
                              className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none dark:text-white"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', e.target.value)}
                              required
                            />
                         </div>
                         <div className="w-32 space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Estimated Cost</label>
                            <div className="h-8 flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                               {formatCurrency((products.find(p => p.id === parseInt(item.product_id))?.cost_price || 0) * item.quantity)}
                            </div>
                         </div>
                         <button
                           type="button"
                           onClick={() => removeItem(idx)}
                           className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                         >
                            <X size={12} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 mt-10">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Total Cost</p>
                    <h3 className="text-3xl font-black text-blue-600">{formatCurrency(totalCost)}</h3>
                 </div>
                 <button
                   type="submit"
                   disabled={loading}
                   className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 text-xs tracking-widest"
                 >
                   {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={20} /> AUTHORIZE PO</>}
                 </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePOModal;
