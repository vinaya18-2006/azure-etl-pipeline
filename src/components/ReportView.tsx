import React, { useState, useMemo, useEffect } from 'react';
import { DataRecord } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ZAxis
} from 'recharts';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Activity, 
  TrendingUp, 
  Layers, 
  Sliders, 
  ChevronDown, 
  RefreshCw,
  Percent,
  Plus
} from 'lucide-react';
import { detectColumns, cn } from '../lib/utils';

export function ReportView({ data }: { data: DataRecord[] }) {
  const columnsMeta = useMemo(() => detectColumns(data), [data]);
  
  const numericColumns = useMemo(() => columnsMeta.filter(c => c.type === 'numeric'), [columnsMeta]);
  const categoricalColumns = useMemo(() => columnsMeta.filter(c => c.type === 'categorical' || c.type === 'date' || c.type === 'string'), [columnsMeta]);

  // Chart builder states
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');
  const [aggregation, setAggregation] = useState<'sum' | 'avg' | 'count'>('sum');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie' | 'scatter'>('bar');

  // Sync default options when columns change
  useEffect(() => {
    if (columnsMeta.length > 0) {
      const xDefault = categoricalColumns[0]?.key || columnsMeta[0]?.key || '';
      const yDefault = numericColumns[0]?.key || '';
      
      setXAxisKey(xDefault);
      setYAxisKey(yDefault);
      setAggregation(numericColumns[0] ? 'sum' : 'count');
    }
  }, [data, columnsMeta, numericColumns, categoricalColumns]);

  if (data.length === 0) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-3xl m-8 bg-white shadow-sm">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
          <FileText className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Analytics Engine Offline</h3>
        <p className="text-[11px] text-slate-400 mt-2 font-medium">Charts will materialize following a successful pipeline commit.</p>
      </div>
    );
  }

  // 1. Compute Descriptive Statistics dynamically (Pandas df.describe() style)
  const statsProfile = useMemo(() => {
    return columnsMeta.map(col => {
      const rawValues = data.map(d => d[col.key]);
      const nonNullValues = rawValues.filter(v => v !== undefined && v !== null && v !== '');
      const count = nonNullValues.length;
      
      if (col.type === 'numeric') {
        const numericValues = nonNullValues.map(v => Number(v)).filter(v => !isNaN(v));
        
        if (numericValues.length === 0) {
          return {
            key: col.key,
            type: 'numeric',
            count: count.toString(),
            unique: 'NaN',
            top: 'NaN',
            freq: 'NaN',
            mean: 'NaN',
            std: 'NaN',
            min: 'NaN',
            p25: 'NaN',
            p50: 'NaN',
            p75: 'NaN',
            max: 'NaN'
          };
        }

        const sorted = [...numericValues].sort((a, b) => a - b);
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const mean = sum / numericValues.length;
        const variance = numericValues.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / numericValues.length;
        const std = Math.sqrt(variance);

        return {
          key: col.key,
          type: 'numeric',
          count: count.toString(),
          unique: 'NaN',
          top: 'NaN',
          freq: 'NaN',
          mean: mean.toFixed(4),
          std: std.toFixed(4),
          min: sorted[0].toString(),
          p25: sorted[Math.floor(sorted.length * 0.25)].toString(),
          p50: sorted[Math.floor(sorted.length * 0.50)].toString(),
          p75: sorted[Math.floor(sorted.length * 0.75)].toString(),
          max: sorted[sorted.length - 1].toString()
        };
      } else {
        // Categorical / String / Date columns
        const uniqueVals = new Set(nonNullValues);
        const unique = uniqueVals.size;

        // Top value analysis
        const counts: Record<string, number> = {};
        let topVal: any = 'N/A';
        let topFreq = 0;

        nonNullValues.forEach(val => {
          const sVal = String(val);
          counts[sVal] = (counts[sVal] || 0) + 1;
          if (counts[sVal] > topFreq) {
            topFreq = counts[sVal];
            topVal = val;
          }
        });

        return {
          key: col.key,
          type: col.type,
          count: count.toString(),
          unique: unique.toString(),
          top: String(topVal),
          freq: topFreq.toString(),
          mean: 'NaN',
          std: 'NaN',
          min: 'NaN',
          p25: 'NaN',
          p50: 'NaN',
          p75: 'NaN',
          max: 'NaN'
        };
      }
    });
  }, [data, columnsMeta]);

  // 2. Perform Dynamic Aggregation for Recharts
  const chartData = useMemo(() => {
    if (!xAxisKey) return [];

    // Group items by X-Axis key
    const groups: Record<string, any[]> = {};
    data.forEach(item => {
      const rawXVal = item[xAxisKey];
      const xKey = rawXVal === undefined || rawXVal === null || rawXVal === '' ? 'N/A' : String(rawXVal);
      if (!groups[xKey]) {
        groups[xKey] = [];
      }
      groups[xKey].push(item);
    });

    // Form data groups
    return Object.keys(groups).map(gKey => {
      const items = groups[gKey];
      let val = 0;

      if (yAxisKey && aggregation !== 'count') {
        const validValues = items
          .map(item => Number(item[yAxisKey]))
          .filter(v => !isNaN(v));

        if (aggregation === 'sum') {
          val = validValues.reduce((a, b) => a + b, 0);
        } else if (aggregation === 'avg') {
          val = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
        }
      } else {
        val = items.length; // Count aggregation
      }

      return {
        name: gKey,
        value: parseFloat(val.toFixed(2)),
        count: items.length
      };
    }).sort((a, b) => {
      // Sort keys alphabetically or numerically if possible
      if (!isNaN(Number(a.name)) && !isNaN(Number(b.name))) {
        return Number(a.name) - Number(b.name);
      }
      return a.name.localeCompare(b.name);
    }).slice(0, 50); // Keep max 50 coordinates for UI clean rendering
  }, [data, xAxisKey, yAxisKey, aggregation]);

  // 3. Dynamic metric stats cards
  const metricKPIs = useMemo(() => {
    if (!yAxisKey || data.length === 0) {
      return { sum: 0, avg: 0, min: 0, max: 0, count: data.length };
    }
    const values = data.map(d => Number(d[yAxisKey])).filter(v => !isNaN(v));
    if (values.length === 0) {
      return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    return {
      sum: sum,
      avg: avg,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: values.length
    };
  }, [data, yAxisKey]);

  const COLORS = ['#1e293b', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const formatHeader = (str: string) => {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8 bg-slate-50/20"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ETL Profiling Studio</h1>
          <p className="font-mono text-[9px] font-bold uppercase text-slate-400 mt-1 italic">
            Computed descriptive telemetry across {data.length} records
          </p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Print Report PDF
        </button>
      </div>

      {/* Profiler Table */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata descriptive statistics</h2>
          <p className="text-[11px] text-slate-500 font-medium">Automatic profiling summary inspired by pandas.DataFrame.describe()</p>
        </div>
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="p-3.5 pl-5">Feature</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Count</th>
                <th className="p-3.5">Unique</th>
                <th className="p-3.5">Top</th>
                <th className="p-3.5">Freq</th>
                <th className="p-3.5">Mean</th>
                <th className="p-3.5">Std</th>
                <th className="p-3.5">Min</th>
                <th className="p-3.5">25%</th>
                <th className="p-3.5">50%</th>
                <th className="p-3.5">75%</th>
                <th className="p-3.5 pr-5">Max</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 font-mono text-[10px] divide-y divide-slate-50">
              {statsProfile.map(stat => (
                <tr key={stat.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5 pl-5 font-bold text-slate-900">{stat.key}</td>
                  <td className="p-3.5 font-bold"><span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 uppercase tracking-wider text-slate-500">{stat.type}</span></td>
                  <td className="p-3.5 font-bold">{stat.count}</td>
                  <td className={cn("p-3.5", stat.unique === 'NaN' ? "opacity-30" : "font-semibold")}>{stat.unique}</td>
                  <td className={cn("p-3.5 truncate max-w-[120px] font-bold uppercase", stat.top === 'N/A' || stat.top === 'NaN' ? "opacity-30 font-normal" : "")} title={stat.top}>{stat.top}</td>
                  <td className={cn("p-3.5", stat.freq === 'NaN' ? "opacity-30" : "font-semibold")}>{stat.freq}</td>
                  <td className={cn("p-3.5", stat.mean === 'NaN' ? "opacity-30" : "font-bold text-slate-800")}>{stat.mean}</td>
                  <td className={cn("p-3.5", stat.std === 'NaN' ? "opacity-30" : "")}>{stat.std}</td>
                  <td className={cn("p-3.5", stat.min === 'NaN' ? "opacity-30" : "")}>{stat.min}</td>
                  <td className={cn("p-3.5", stat.p25 === 'NaN' ? "opacity-30" : "")}>{stat.p25}</td>
                  <td className={cn("p-3.5", stat.p50 === 'NaN' ? "opacity-30" : "")}>{stat.p50}</td>
                  <td className={cn("p-3.5", stat.p75 === 'NaN' ? "opacity-30" : "")}>{stat.p75}</td>
                  <td className={cn("p-3.5 pr-5", stat.max === 'NaN' ? "opacity-30" : "")}>{stat.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Chart Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Builder Controls */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-start">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Chart designer</h3>
          </div>

          <div className="space-y-4 flex-1">
            {/* Chart Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualization Style</label>
              <select 
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="bar">📊 Bar Chart</option>
                <option value="line">📈 Line Chart</option>
                <option value="area">🏔️ Area Chart</option>
                <option value="pie">🍕 Pie Chart</option>
                <option value="scatter">🌐 Scatter Matrix</option>
              </select>
            </div>

            {/* X Axis Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dimension (X-Axis)</label>
              <select 
                value={xAxisKey}
                onChange={(e) => setXAxisKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {columnsMeta.map(col => (
                  <option key={col.key} value={col.key}>
                    {col.key} ({col.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Y Axis Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metric (Y-Axis)</label>
              <select 
                value={yAxisKey}
                onChange={(e) => setYAxisKey(e.target.value)}
                disabled={aggregation === 'count'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">(Row Count Only)</option>
                {numericColumns.map(col => (
                  <option key={col.key} value={col.key}>
                    {col.key} (numeric)
                  </option>
                ))}
              </select>
            </div>

            {/* Aggregation Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rollup Rule</label>
              <select 
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="sum">➕ Sum</option>
                <option value="avg">🧮 Average</option>
                <option value="count">🔢 Record Count</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-relaxed font-medium">
            Aggregated metric values grouped by dimension. Limit set to top 50 categories for performance.
          </div>
        </section>

        {/* Right Side: Charts and KPI dashboard */}
        <section className="lg:col-span-3 space-y-6 flex flex-col">
          {/* KPI Mini Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard label="Metrics Evaluated" value={metricKPIs.count} icon={Layers} />
            <StatsCard 
              label="Selected Sum" 
              value={yAxisKey ? metricKPIs.sum.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '--'} 
              icon={TrendingUp} 
            />
            <StatsCard 
              label="Selected Avg" 
              value={yAxisKey ? metricKPIs.avg.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--'} 
              icon={Activity} 
            />
            <StatsCard 
              label="Min / Max Range" 
              value={yAxisKey ? `${metricKPIs.min.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${metricKPIs.max.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'} 
              icon={Percent} 
            />
          </div>

          {/* Visual viewport */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">
                  {formatHeader(aggregation)} of {yAxisKey ? formatHeader(yAxisKey) : 'Records'} vs {formatHeader(xAxisKey)}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Aggregated Result Set</p>
              </div>
              <div className="text-[10px] font-mono bg-slate-50 border border-slate-100 rounded px-2.5 py-1 text-slate-400">
                ACTIVE_QUERY
              </div>
            </div>

            <div className="flex-1 w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip yAxisKey={yAxisKey} aggregation={aggregation} />} />
                    <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip yAxisKey={yAxisKey} aggregation={aggregation} />} />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ bottom: 30 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip yAxisKey={yAxisKey} aggregation={aggregation} />} />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#areaGradient)" />
                  </AreaChart>
                ) : chartType === 'pie' ? (
                  <PieChart>
                    <Tooltip content={<CustomTooltip yAxisKey={yAxisKey} aggregation={aggregation} />} />
                    <Pie
                      data={chartData.slice(0, 15)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.slice(0, 15).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : (
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} angle={-25} textAnchor="end" />
                    <YAxis dataKey="value" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip yAxisKey={yAxisKey} aggregation={aggregation} />} />
                    <Scatter name="DataPoints" data={chartData} fill="#2563eb" />
                  </ScatterChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function StatsCard({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4">
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <h4 className="text-sm font-bold tracking-tight text-slate-800 mt-1 truncate">{value}</h4>
      </div>
      <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, yAxisKey, aggregation }: any) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl text-white text-[11px] font-mono leading-relaxed">
        <p className="font-bold border-b border-slate-800 pb-1 mb-1.5 text-blue-400">{dataPoint.name}</p>
        <p className="opacity-90">
          <span className="text-slate-400 uppercase tracking-wider text-[9px] mr-1">{aggregation}:</span> 
          <span className="font-bold text-slate-200">{dataPoint.value}</span>
        </p>
        <p className="opacity-90">
          <span className="text-slate-400 uppercase tracking-wider text-[9px] mr-1">Count:</span> 
          <span className="font-bold text-slate-200">{dataPoint.count} records</span>
        </p>
      </div>
    );
  }
  return null;
}

