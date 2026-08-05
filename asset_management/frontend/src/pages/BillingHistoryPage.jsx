import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Receipt,
  Search,
  Calendar,
  User,
  CreditCard,
  Filter,
  SlidersHorizontal,
  ArrowLeft,
  DownloadCloud,
  FileBarChart,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const BillingHistoryPage = () => {
  const { t } = useTranslation();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [payMethod, setPayMethod] = useState('ALL');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sales, searchTerm, dateRange, payMethod, amountRange]);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/billing/history/');
      setSales(response.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...sales];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.bill_number.toLowerCase().includes(term) ||
        s.payment_method.toLowerCase().includes(term)
      );
    }

    // Date Range
    if (dateRange.start) {
      result = result.filter(s => new Date(s.sale_date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      result = result.filter(s => new Date(s.sale_date) <= endDate);
    }

    // Payment Method
    if (payMethod !== 'ALL') {
      result = result.filter(s => s.payment_method === payMethod);
    }

    // Amount Range
    if (amountRange.min) {
      result = result.filter(s => s.total_amount >= parseFloat(amountRange.min));
    }
    if (amountRange.max) {
      result = result.filter(s => s.total_amount <= parseFloat(amountRange.max));
    }

    setFilteredSales(result);
  };

  const generateReceipt = (sale) => {
    const doc = new jsPDF({ format: [80, 160] });
    doc.setFontSize(12);
    doc.text("MARKETPRO AI", 40, 10, { align: "center" });
    doc.setFontSize(7);
    doc.text("------------------------------------------", 10, 15);
    doc.text(`Bill No: ${sale.bill_number}`, 10, 22);
    doc.text(`Date: ${formatDate(sale.sale_date)}`, 10, 26);
    doc.text(`Method: ${sale.payment_method}`, 10, 30);
    doc.text("------------------------------------------", 10, 35);

    const body = sale.details.map(d => [
      d.asset_name.substring(0, 15),
      d.quantity,
      d.unit_price.toFixed(2),
      d.total_price.toFixed(2)
    ]);

    doc.autoTable({
      startY: 38,
      head: [['Item', 'Qty', 'Prc', 'Tot']],
      body: body,
      theme: 'plain',
      styles: { fontSize: 6, cellPadding: 1 },
      margin: { left: 5, right: 5 }
    });

    const finalY = doc.lastAutoTable.finalY + 4;
    doc.text("------------------------------------------", 10, finalY);
    doc.text(`Subtotal: ${formatCurrency(sale.subtotal)}`, 40, finalY + 5);
    doc.text(`GST (18%): ${formatCurrency(sale.tax_amount)}`, 40, finalY + 9);
    doc.setFontSize(9);
    doc.text(`TOTAL: ${formatCurrency(sale.total_amount)}`, 40, finalY + 16, { align: "center" });

    doc.setFontSize(6);
    doc.text("Software Powered by MarketPro", 40, finalY + 24, { align: "center" });

    doc.save(`Invoice_${sale.bill_number}.pdf`);
  };

  const columns = [
    {
      header: 'Transaction',
      accessor: 'bill_number',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
            <Receipt size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white uppercase tracking-tighter">{row.bill_number}</p>
            <p className="text-[10px] text-slate-400 font-medium">{formatDate(row.sale_date)}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Revenue',
      accessor: 'total_amount',
      cell: (row) => (
        <div className="space-y-0.5">
           <p className="font-bold text-slate-800 dark:text-white">{formatCurrency(row.total_amount)}</p>
           <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
              row.payment_method === 'CASH' ? "bg-emerald-50 text-emerald-600" :
              row.payment_method === 'UPI' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600")}>
              {row.payment_method}
           </span>
        </div>
      )
    },
    {
      header: 'Volume',
      accessor: 'details',
      cell: (row) => <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[10px] font-bold">{row.details.length} SKUs</span>
    }
  ];

  const actions = (row) => (
    <button
      onClick={() => generateReceipt(row)}
      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
      title="Download Receipt"
    >
      <Receipt size={18} />
    </button>
  );

  return (
    <div className="p-8 space-y-8 flex flex-col h-full overflow-hidden">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Billing History</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 italic">Review past transactions and generate duplicates.</p>
        </div>
        <div className="flex gap-2">
           <button
             onClick={() => setShowFilters(!showFilters)}
             className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border",
                showFilters ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600")}
           >
              <Filter size={18} /> Advanced Filters
           </button>
           <button className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95">
              <FileBarChart size={18} /> Report
           </button>
        </div>
      </header>

      <div className="flex-1 flex gap-8 min-h-0 relative">
        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filteredSales}
            loading={loading}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            actions={actions}
          />
        </div>

        {/* Filter Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col gap-8 h-fit sticky top-0"
            >
               <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">Filter Engine</h3>
                  <button onClick={() => setShowFilters(false)} className="p-1 text-slate-400"><X size={16} /></button>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</label>
                     <input
                        type="date"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white"
                        value={dateRange.start}
                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                     />
                     <input
                        type="date"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white"
                        value={dateRange.end}
                        onChange={e => setDateRange({...dateRange, end: e.target.value})}
                     />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                     <div className="flex flex-wrap gap-2">
                        {['ALL', 'CASH', 'UPI', 'CARD'].map(m => (
                           <button
                             key={m}
                             onClick={() => setPayMethod(m)}
                             className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                                payMethod === m ? "bg-blue-600 border-blue-600 text-white" : "border-slate-100 dark:border-slate-800 text-slate-400")}
                           >
                              {m}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. Amount (₹)</label>
                     <input
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white"
                        value={amountRange.min}
                        onChange={e => setAmountRange({...amountRange, min: e.target.value})}
                     />
                  </div>
               </div>

               <button
                  onClick={() => { setDateRange({start:'', end:''}); setPayMethod('ALL'); setAmountRange({min:'', max:''}); setSearchTerm(''); }}
                  className="mt-4 text-[10px] font-bold text-red-500 hover:underline"
               >
                  Reset all filters
               </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BillingHistoryPage;
