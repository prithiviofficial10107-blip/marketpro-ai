import React, { useState, useEffect } from 'react';
import { FileText, Download, PieChart, TrendingUp, Loader2, Package, ShoppingCart, TrendingDown } from 'lucide-react';
import api from '../services/api';
import ReportDetailModal from '../components/ReportDetailModal';
import { formatCurrency } from '../lib/format';
import toast from 'react-hot-toast';

const ReportCard = ({ title, description, icon: Icon, onClick, onDownload }) => (
  <div
    onClick={onClick}
    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
  >
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
        <Icon className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600" size={28} />
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDownload(); }}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
      >
        <Download size={22} />
      </button>
    </div>
    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{description}</p>

    <div className="mt-8 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
       View Detailed Analysis →
    </div>
  </div>
);

const ReportsPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveTab] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get('/reports/inventory-summary');
        setSummary(response.data.data);
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const openAIChat = () => {
    const trigger = document.querySelector('.ai-trigger-btn');
    if (trigger) trigger.click();
  };

  const handleDownload = (type) => {
    // Basic CSV export logic
    toast.success(`Generating ${type} report...`);
  };

  return (
    <div className="p-5 h-full flex flex-col space-y-6 overflow-y-auto pb-10">
      <header className="shrink-0">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Analytics & Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-[10px] font-bold uppercase tracking-widest">Business Intelligence Hub</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ReportCard
            title="Inventory Summary"
            description={`Total Value: ${formatCurrency(summary?.total_inventory_value || 0)}. Stock health and category distribution analysis.`}
            icon={Package}
            onClick={() => setActiveTab({ type: 'inventory', title: 'Inventory Summary' })}
            onDownload={() => handleDownload('Inventory')}
          />
          <ReportCard
            title="Sales Performance"
            description="Historical revenue trends, average bill value, and top-selling product analysis."
            icon={ShoppingCart}
            onClick={() => setActiveTab({ type: 'sales', title: 'Sales Performance' })}
            onDownload={() => handleDownload('Sales')}
          />
          <ReportCard
            title="Loss & Cost Analysis"
            description="Comparative view of wastage cost vs procurement spend to track efficiency."
            icon={TrendingDown}
            onClick={() => setActiveTab({ type: 'wastage', title: 'Loss & Cost Analysis' })}
            onDownload={() => handleDownload('Wastage')}
          />
        </div>
      )}

      <div className="mt-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tighter">Need a Custom Report?</h2>
          <p className="text-blue-100 text-lg font-medium">Ask our Smart AI Agent to generate real-time data analysis in natural language.</p>
        </div>
        <button
          onClick={openAIChat}
          className="relative z-10 bg-white text-blue-600 px-10 py-5 rounded-[1.5rem] font-black hover:bg-blue-50 transition-all shadow-xl active:scale-95 whitespace-nowrap text-xs uppercase tracking-widest"
        >
          Open AI Chat Assistant
        </button>
      </div>

      {activeReport && (
        <ReportDetailModal
          isOpen={!!activeReport}
          onClose={() => setActiveTab(null)}
          type={activeReport.type}
          title={activeReport.title}
        />
      )}
    </div>
  );
};

export default ReportsPage;
