import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, UserCheck, RotateCcw, Box, TrendingUp, History, Filter } from 'lucide-react';
import DataTable from '../components/DataTable';
import AssetAssignmentForm from '../components/AssetAssignmentForm';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import StockHistoryModal from '../components/StockHistoryModal';
import AddProductModal from '../components/AddProductModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';
import { useTranslation } from 'react-i18next';

const AssetsPage = () => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchMetadata();
  }, [searchTerm, selectedCategory]);

  const fetchAssets = async () => {
    try {
      const response = await api.get(`/assets/?search=${searchTerm}`);
      let data = response.data.data;
      if (selectedCategory !== 'All') {
        data = data.filter(a => a.category_name === selectedCategory);
      }
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await api.get('/dashboard/analytics/');
      setCategories(['All', ...res.data.data.distributions.categories.map(c => c.name)]);
    } catch (err) {}
  };

  const columns = [
    {
      header: t('inventory.product_detail'),
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
            <Box size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white">{row.name}</p>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-tighter">{row.asset_tag}</p>
          </div>
        </div>
      )
    },
    { header: t('inventory.category'), accessor: 'category_name' },
    {
      header: t('inventory.pricing'),
      accessor: 'unit_price',
      cell: (row) => (
        <div className="space-y-0.5">
           <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(row.unit_price)}</p>
           <p className="text-[9px] text-slate-400 uppercase">Cost: {formatCurrency(row.cost_price)}</p>
        </div>
      )
    },
    {
      header: t('inventory.stock_status'),
      accessor: 'stock_quantity',
      cell: (row) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
             <span className={cn("text-xs font-black",
                row.stock_quantity <= row.low_stock_threshold ? "text-red-500" : "text-slate-700 dark:text-slate-200")}>
                {row.stock_quantity} {row.unit_of_measure}
             </span>
             {row.stock_quantity <= row.low_stock_threshold && (
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
             )}
          </div>
          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <div
               className={cn("h-full transition-all duration-500", row.stock_quantity <= row.low_stock_threshold ? "bg-red-500" : "bg-emerald-500")}
               style={{ width: `${Math.min((row.stock_quantity / 50) * 100, 100)}%` }}
             />
          </div>
        </div>
      )
    }
  ];

  const actions = (row) => (
    <div className="flex gap-1">
      <button
        onClick={() => { setSelectedAsset(row); setShowStockModal(true); }}
        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        title="Restock / Adjust"
      >
        <TrendingUp size={18} />
      </button>
      <button
        onClick={() => { setSelectedAsset(row); setShowHistoryModal(true); }}
        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        title="View Audit Trail"
      >
        <History size={18} />
      </button>
      <button className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
        <Edit size={18} />
      </button>
      <button className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
        <Trash2 size={18} />
      </button>
    </div>
  );

  return (
    <div className="p-5 h-full flex flex-col space-y-5">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('inventory.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold text-[10px] uppercase tracking-widest">{t('inventory.subtitle')}</p>
        </div>
        <div className="flex gap-3 overflow-hidden">
           <div className="flex bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-1 shadow-sm overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap max-w-full md:max-w-md lg:max-w-lg">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all shrink-0",
                     selectedCategory === cat ? "bg-slate-900 text-white dark:bg-blue-600" : "text-slate-400 hover:text-slate-600")}
                >
                   {cat}
                </button>
              ))}
           </div>
           <button
             onClick={() => setShowAddModal(true)}
             className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all shrink-0"
           >
             <Plus size={20} /> {t('common.new_sku')}
           </button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={assets}
          loading={loading}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          actions={actions}
        />
      </div>

      <AnimatePresence>
        {showStockModal && selectedAsset && (
          <StockAdjustmentModal
            asset={selectedAsset}
            onClose={() => setShowStockModal(false)}
            onRefresh={fetchAssets}
          />
        )}
        {showHistoryModal && selectedAsset && (
          <StockHistoryModal
            asset={selectedAsset}
            onClose={() => setShowHistoryModal(false)}
          />
        )}
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onRefresh={fetchAssets}
        />
      </AnimatePresence>
    </div>
  );
};

export default AssetsPage;
