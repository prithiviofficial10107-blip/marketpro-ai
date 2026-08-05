import React, { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

const DataTable = ({
  columns,
  data = [],
  loading,
  onSearch,
  searchTerm = '',
  onRowClick,
  onFilterClick,
  actions
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const itemsPerPage = 10;

  // Client-side filtering and sorting
  const processedData = React.useMemo(() => {
    let result = [...data];

    // 1. Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(term)
        )
      );
    }

    // 2. Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = columns.map(col => col.header).join(',');
    const rows = processedData.map(row =>
      columns.map(col => {
        const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
        return `"${val}"`;
      }).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header / Toolbar */}
      <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={t('common.search_placeholder')}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
            value={searchTerm}
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={onFilterClick}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors"
          >
            <Filter size={16} /> {t('common.filters')}
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors"
          >
            <Download size={16} /> {t('common.export')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div
                    onClick={() => requestSort(col.accessor)}
                    className={cn(
                      "flex items-center gap-1 cursor-pointer transition-colors",
                      sortConfig.key === col.accessor ? "text-blue-600" : "hover:text-slate-600 dark:hover:text-slate-200"
                    )}
                  >
                    {col.header} <ArrowUpDown size={12} className={cn(sortConfig.key === col.accessor && "scale-110")} />
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            <AnimatePresence mode="popLayout">
              {paginatedData.map((row, rowIdx) => (
                <motion.tr
                  key={row.id || rowIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onRowClick?.(row)}
                  className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {col.cell ? col.cell(row) : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {processedData.length === 0 && !loading && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Search size={32} />
            </div>
            <p className="text-slate-400 text-sm italic">No records found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/50">
        <span className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-700 dark:text-slate-300">{processedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> of <span className="font-bold text-slate-700 dark:text-slate-300">{processedData.length}</span> results
        </span>

        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                  currentPage === i + 1
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
