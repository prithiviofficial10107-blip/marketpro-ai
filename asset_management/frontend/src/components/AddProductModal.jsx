import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Package, Hash, Tag, DollarSign, Layers, Truck, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const AddProductModal = ({ isOpen, onClose, onRefresh }) => {
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    asset_tag: '',
    category_id: '',
    supplier_id: '',
    purchase_cost: '',
    unit_price: '',
    stock_quantity: '0',
    unit_of_measure: 'pc',
    reorder_level: '10'
  });

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen]);

  const fetchMetadata = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        api.get('/assets/categories'),
        api.get('/admin/suppliers/') // Assuming this exists or using a fallback
      ]);
      setCategories(catRes.data.data);
      // Fallback for suppliers if endpoint not ready
      setSuppliers(supRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id || !formData.unit_price) {
      return toast.error("Please fill all required fields");
    }

    setLoading(true);
    try {
      await api.post('/assets/', {
        ...formData,
        purchase_cost: parseFloat(formData.purchase_cost),
        unit_price: parseFloat(formData.unit_price),
        stock_quantity: parseInt(formData.stock_quantity),
        reorder_level: parseInt(formData.reorder_level),
        category_id: parseInt(formData.category_id),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null
      });
      toast.success("New product added successfully");
      onRefresh();
      onClose();
      setFormData({
        name: '', asset_tag: '', category_id: '', supplier_id: '',
        purchase_cost: '', unit_price: '', stock_quantity: '0',
        unit_of_measure: 'pc', reorder_level: '10'
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add product");
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
            className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                  <Package size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register New SKU</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Product Name *</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                    placeholder="e.g. Organic Brown Bread 400g"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Barcode / SKU</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                    placeholder="BAR12345678"
                    value={formData.asset_tag}
                    onChange={e => setFormData({...formData, asset_tag: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Category *</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white appearance-none"
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Financials */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Cost Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                    placeholder="0.00"
                    value={formData.purchase_cost}
                    onChange={e => setFormData({...formData, purchase_cost: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                    placeholder="0.00"
                    value={formData.unit_price}
                    onChange={e => setFormData({...formData, unit_price: e.target.value})}
                    required
                  />
                </div>

                {/* Stock Management */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Initial Stock</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                    value={formData.stock_quantity}
                    onChange={e => setFormData({...formData, stock_quantity: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Unit of Measure</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                    value={formData.unit_of_measure}
                    onChange={e => setFormData({...formData, unit_of_measure: e.target.value})}
                  >
                    <option value="pc">Piece (pc)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="pkt">Packet (pkt)</option>
                    <option value="ltr">Liter (ltr)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="g">Gram (g)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Reorder Level</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                    value={formData.reorder_level}
                    onChange={e => setFormData({...formData, reorder_level: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Preferred Supplier</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                    value={formData.supplier_id}
                    onChange={e => setFormData({...formData, supplier_id: e.target.value})}
                  >
                    <option value="">No Supplier</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-500/30 active:scale-95 transition-all text-xs tracking-widest"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={20} /> REGISTER PRODUCT</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddProductModal;
