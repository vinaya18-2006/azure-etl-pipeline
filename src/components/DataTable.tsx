import React, { useRef, useState, useMemo } from 'react';
import { DataRecord } from '../types';
import { Download, Upload, FileUp, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DataTableProps {
  data: DataRecord[];
  onUpload?: (files: FileList) => void;
}

export function DataTable({ data, onUpload }: DataTableProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onUpload) {
      onUpload(e.target.files);
    }
  };

  // Dynamically extract column keys (except system fields like id and status)
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => key !== 'id' && key !== 'status');
  }, [data]);

  // Export internal buffer to CSV
  const handleExport = () => {
    if (data.length === 0) return;
    const headers = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const val = row[col];
        if (val === undefined || val === null) return '';
        const strVal = String(val);
        return strVal.includes(',') || strVal.includes('"') ? `"${strVal.replace(/"/g, '""')}"` : strVal;
      }).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `etl_data_buffer_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort buffer data
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Text Search Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(row => 
        columns.some(col => {
          const val = row[col];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        })
      );
    }

    // 2. Column Sorting
    if (sortField) {
      result.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc' 
          ? strA.localeCompare(strB) 
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, columns, searchQuery, sortField, sortDirection]);

  // Paginated subslice of processed data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / rowsPerPage));

  // Reset pagination on search or data size shift
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, data.length]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatHeader = (str: string) => {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (data.length === 0) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-3xl m-8 bg-white group hover:border-blue-400 transition-all duration-500 shadow-sm">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".csv,.json"
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-50 p-10 rounded-full mb-6 cursor-pointer group-hover:bg-blue-50 group-hover:scale-105 transition-all duration-500 shadow-sm border border-slate-100"
        >
          <Upload className="w-12 h-12 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </div>
        <h3 className="font-bold uppercase tracking-widest text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">Pipeline Buffer Empty</h3>
        <p className="text-[12px] text-slate-400 mt-2 max-w-xs text-center leading-relaxed">
          The staging area is currently vacant. <br/>
          <span className="font-bold text-slate-500">Manually upload</span> a local dataset to verify throughput or trigger the automated extraction cycle.
        </p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.25)] hover:bg-blue-600 transition-all duration-300 active:scale-95"
        >
          Select Data Payload
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Source Explorer</h2>
          <p className="font-mono text-[9px] font-bold uppercase opacity-40 mt-1 italic">
            V2 Ingestion Buffer: {processedData.length !== data.length ? `${processedData.length} / ` : ''}{data.length} records • {columns.length} columns detected
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search data buffer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 bg-white text-slate-800 placeholder-slate-400 rounded-xl text-[11px] font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all w-full"
            />
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv,.json"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300 shadow-sm"
          >
            <FileUp className="w-3.5 h-3.5 text-blue-500" /> Upload Custom Dataset
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Export Buffer
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-[9px] text-slate-400 uppercase tracking-widest">Index ID</th>
                {columns.map(col => (
                  <th 
                    key={col} 
                    onClick={() => handleSort(col)}
                    className="px-6 py-4 font-bold text-[9px] text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      {formatHeader(col)}
                      {sortField === col ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 border-l border-slate-100 font-bold text-[9px] text-slate-400 uppercase tracking-widest text-right">Pipeline Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-blue-50/20 transition-colors group cursor-default"
                >
                  <td className="px-6 py-3.5 font-mono text-[10px] text-slate-400">{row.id}</td>
                  {columns.map(col => {
                    const value = row[col];
                    const isNumeric = typeof value === 'number';
                    
                    return (
                      <td 
                        key={col} 
                        className={cn(
                          "px-6 py-3.5 text-[11px] font-semibold text-slate-700",
                          isNumeric ? "font-mono text-slate-800" : ""
                        )}
                      >
                        {value === null || value === undefined ? (
                          <span className="text-slate-300 font-normal italic">NULL</span>
                        ) : typeof value === 'boolean' ? (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", 
                            value ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                          )}>
                            {String(value)}
                          </span>
                        ) : isNumeric ? (
                          value.toLocaleString(undefined, { maximumFractionDigits: 4 })
                        ) : (
                          String(value)
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-3.5 text-right border-l border-slate-50">
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded transition-colors",
                      row.status === 'transformed' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : 
                      row.status === 'cleaned' ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                    )}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} className="px-6 py-10 text-center text-xs text-slate-400 italic">
                    No records matched the current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 select-none">
          <div className="flex items-center gap-3">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-blue-500 font-semibold"
            >
              {[10, 25, 50, 100].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {processedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(processedData.length, currentPage * rowsPerPage)} of {processedData.length} records
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="px-3 text-slate-700">
              Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

