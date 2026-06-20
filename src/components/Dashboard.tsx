import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ArrowRight, 
  FileCode, 
  ShieldCheck, 
  Send, 
  BarChart3, 
  Play, 
  Settings, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Download,
  Mail,
  Zap,
  Cpu,
  Activity,
  Server,
  Bell,
  X,
  LogOut,
  MessageSquare,
  User,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PipelineStep, DataRecord, PipelineConfig, PipelineStats } from '../types';
import { generateMockData, cn, parseCSV, detectColumns } from '../lib/utils';
import { PipelineFlow } from './PipelineFlow';
import { DataTable } from './DataTable';
import { ConfigPanel } from './ConfigPanel';
import { ReportView } from './ReportView';
import { EmployeeProfile } from './EmployeeProfile';

interface DashboardProps {
  user: {
    email: string;
    name: string;
    role: string;
    dept: string;
    avatar: string;
    permissions: string[];
  };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [step, setStep] = useState<PipelineStep>('idle');
  const [subStep, setSubStep] = useState<string>('');
  const [data, setData] = useState<DataRecord[]>([]);
  const [logs, setLogs] = useState<{msg: string, time: string, type: 'info' | 'success' | 'error'}[]>([]);
  const [config, setConfig] = useState<PipelineConfig>({
    sourceType: 'csv',
    destinationType: 'sqlite',
    sendEmail: true,
    autoSchedule: false,
  });
  const [stats, setStats] = useState<PipelineStats>({
    rowsProcessed: 0,
    errorsCaught: 0,
    durationSeconds: 0,
    lastRun: null,
  });
  const [activeTab, setActiveTab] = useState<'pipeline' | 'data' | 'reports' | 'config' | 'profile'>('pipeline');

  // Interactive Live Features
  const [alertEmail, setAlertEmail] = useState(user.email || 'student@university.edu');
  const [showToast, setShowToast] = useState(false);
  const [runs, setRuns] = useState<{id: string, time: string, duration: string, rows: number, status: 'success' | 'running' | 'error', target: string, triggered_by: string}[]>([
    { id: '#RUN-1002', time: '14:20:10', duration: '6.8s', rows: 250, status: 'success', target: 'SQLite', triggered_by: 'Alex Mercer' },
    { id: '#RUN-1001', time: '11:05:00', duration: '8.2s', rows: 500, status: 'success', target: 'SQLite + Azure', triggered_by: 'Sarah Connor' }
  ]);

  // Smart notifications & warnings
  const [notifications, setNotifications] = useState<{id: number, text: string, type: 'warning' | 'info' | 'success', time: string}[]>([
    { id: 1, text: 'Metadata standard alignment validated: TLS 1.3 Active', type: 'success', time: '10m ago' },
    { id: 2, text: 'Azure target sync warning: Missing cloud account key connection', type: 'warning', time: '1h ago' },
    { id: 3, text: 'SMTP Relay connection check completed', type: 'info', time: '2h ago' }
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // AI Assistant Widget states
  const [chatMessages, setChatMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([
    { sender: 'ai', text: 'Hello! I am your DataOps AI Assistant. Ask me about the pipeline nodes, schema, or error resolution.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showAIChat, setShowAIChat] = useState(false);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    // Simulated responses matching Smart DataOps knowledge
    setTimeout(() => {
      let aiResponse = "I can help configure your pipeline. Try asking about 'how to fix SMTP connection' or 'view active logs'.";
      const lowerMsg = userMsg.toLowerCase();
      if (lowerMsg.includes('smtp') || lowerMsg.includes('email') || lowerMsg.includes('mail')) {
        aiResponse = "To resolve SMTP connection issues, ensure you specify 'sender_email', 'smtp_user', and 'smtp_password' inside your local `.env` configuration file.";
      } else if (lowerMsg.includes('azure') || lowerMsg.includes('cloud') || lowerMsg.includes('blob')) {
        aiResponse = "To sync with Azure, append your 'AZURE_STORAGE_CONNECTION_STRING' and 'AZURE_CONTAINER_NAME' keys to your environment file. The pipeline will automatically route backups to Azure.";
      } else if (lowerMsg.includes('sqlite') || lowerMsg.includes('db') || lowerMsg.includes('database')) {
        aiResponse = "The pipeline persists cleansed data into a local SQLite database at `data/sqlite.db` inside the `processed_records` table.";
      } else if (lowerMsg.includes('error') || lowerMsg.includes('logs') || lowerMsg.includes('fail')) {
        aiResponse = "You can view detailed debug steps by reading the `logs/etl.log` file, or viewing the Ingestion Terminal Logs below the pipeline map.";
      } else if (lowerMsg.includes('nodes') || lowerMsg.includes('steps') || lowerMsg.includes('pipeline')) {
        aiResponse = "The pipeline nodes are: 1. Extract (extractor.py), 2. Transform (transformer.py), 3. Load (loader.py), 4. Profile & Visualize (viz.py), 5. Cloud Backup (azure_loader.py), and 6. Notify (emailer.py).";
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 600);
  };

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ msg, time: new Date().toLocaleTimeString(), type }, ...prev].slice(0, 50));
  };

  const runEtl = async () => {
    if (step !== 'idle' && step !== 'completed' && step !== 'error') return;
    
    const nextRunId = `#RUN-${Math.floor(Math.random() * 9000 + 1000)}`;
    const startTime = new Date().toLocaleTimeString();

    setStep('extracting');
    setSubStep('Reading Source...');
    addLog(`Initiating orchestrator run_etl.py for run: ${nextRunId}`);
    addLog(`Executing run_etl.py: Calling extractor.py...`);
    
    // Choose dataset
    let activePayload = data.length > 0 ? [...data] : generateMockData(250);
    
    // Simulate Extraction
    await new Promise(r => setTimeout(r, 850));
    setSubStep('Parsing Schema...');
    addLog("extractor.py: Parsing records and mapping column data types...");
    await new Promise(r => setTimeout(r, 700));
    setSubStep('Validating IO...');
    addLog("extractor.py: Verifying data stream schema integrity...");
    await new Promise(r => setTimeout(r, 550));
    
    const colsMeta = detectColumns(activePayload);
    const colKeys = colsMeta.map(c => c.key);
    
    setData(activePayload.map(d => ({ ...d, status: 'raw' as const })));
    addLog(`extractor.py: Extracted ${activePayload.length} rows. Discovered keys: [${colKeys.slice(0, 5).join(', ')}${colKeys.length > 5 ? '...' : ''}]`, 'success');
    
    // Simulate Transformation
    setStep('transforming');
    setSubStep('Cleaning Schema...');
    addLog("Executing transformer.py: Commencing text trimming and handling missing values...");
    await new Promise(r => setTimeout(r, 1000));
    setSubStep('Normalizing...');
    addLog("transformer.py: Standardizing floating decimals on numeric metrics...");
    await new Promise(r => setTimeout(r, 900));
    
    const cleanedData = activePayload.map(row => {
      const sanitized = { ...row, status: 'cleaned' as const };
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = sanitized[key].trim();
        }
      });
      return sanitized;
    });
    setData(cleanedData);
    addLog("transformer.py: Standardized columns and sanitized text successfully.", 'success');
    
    // Simulate Loading
    setStep('loading');
    setSubStep('Connecting DB...');
    const loaderScript = config.destinationType === 'azure_blob' ? 'azure_loader.py' : 'loader.py';
    addLog(`Executing ${loaderScript}: Connecting to SQLite database table...`);
    await new Promise(r => setTimeout(r, 850));
    setSubStep('Streaming Data...');
    addLog(`${loaderScript}: Loading data to database target...`);
    await new Promise(r => setTimeout(r, 850));
    
    const loadedData = cleanedData.map(row => ({ ...row, status: 'transformed' as const }));
    setData(loadedData);
    addLog(`${loaderScript}: Transaction complete. Loaded records into SQLite database.`, 'success');
    
    // Simulate Analysis/Viz
    setStep('analyzing');
    setSubStep('Computing Stats...');
    addLog("Executing viz.py: Computing descriptive aggregates (describe profile)...");
    await new Promise(r => setTimeout(r, 800));
    setSubStep('Exporting Summary...');
    addLog("viz.py: Generated reports/report.html and reports/chart.png charts.", 'success');
    
    // Simulate Emailing if enabled
    if (config.sendEmail) {
      setStep('notifying');
      setSubStep('Composing SMTP...');
      addLog(`Executing emailer.py: Establishing connection to host: smtp.gmail.com...`);
      await new Promise(r => setTimeout(r, 900));
      addLog(`emailer.py: Authorizing TLS credentials for recipient email: ${alertEmail}`);
      await new Promise(r => setTimeout(r, 800));
      addLog(`emailer.py: Summary report successfully dispatched to: ${alertEmail} ✓`, 'success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
    
    setStep('completed');
    setSubStep('Complete');
    setStats({
      rowsProcessed: activePayload.length,
      errorsCaught: 0,
      durationSeconds: config.sendEmail ? 8.2 : 6.8,
      lastRun: new Date().toLocaleTimeString(),
    });
    
    // Append to Runs History Matrix
    setRuns(prev => [
      {
        id: nextRunId,
        time: startTime,
        duration: `${config.sendEmail ? '8.2' : '6.8'}s`,
        rows: activePayload.length,
        status: 'success',
        target: config.destinationType === 'azure_blob' ? 'SQLite + Azure' : 'SQLite',
        triggered_by: user.name
      },
      ...prev
    ]);
    
    // Add success notification
    setNotifications(prev => [
      { id: Date.now(), text: `Pipeline run ${nextRunId} completed successfully`, type: 'success', time: 'Just now' },
      ...prev
    ]);
    addLog("ETL Enterprise Studio Ingestion completed successfully ✓", 'success');
  };

  const handleManualUpload = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    addLog(`Ingesting raw payload: ${file.name}...`, 'info');
    setStep('extracting');
    setSubStep('Parsing Upload...');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        let parsed: any[] = [];
        if (file.name.endsWith('.csv')) {
          parsed = parseCSV(text);
        } else if (file.name.endsWith('.json')) {
          parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) {
            parsed = [parsed];
          }
        } else {
          throw new Error("Unsupported format. Please upload a .csv or .json file.");
        }

        if (parsed.length === 0) {
          throw new Error("Target file was parsed but contains 0 records.");
        }

        // Map data records
        const sanitized = parsed.map((item, idx) => ({
          id: item.id || `UL-${(idx + 1).toString().padStart(6, '0')}`,
          status: 'raw' as const,
          ...item
        }));

        const colsMeta = detectColumns(sanitized);
        const colKeys = colsMeta.map(c => c.key);

        await new Promise(r => setTimeout(r, 900));
        addLog(`Successfully parsed ${sanitized.length} rows from ${file.name}.`, 'success');
        addLog(`Columns found: ${colKeys.slice(0, 5).join(', ')}${colKeys.length > 5 ? ` (+${colKeys.length - 5} more)` : ''}`, 'info');
        
        setData(sanitized);
        setStep('idle');
        setSubStep('');
      } catch (err: any) {
        addLog(`Upload Parsing Failed: ${err.message}`, 'error');
        setStep('error');
        setSubStep('Parse Error');
      }
    };
    reader.readAsText(file);
  };

  // Dynamically calculate metrics based on columns of dataset
  const columnsMeta = detectColumns(data);
  const numericCols = columnsMeta.filter(c => c.type === 'numeric');
  
  const metricColKey = numericCols.find(c => 
    /amount|revenue|sales|price|cost|total|val/i.test(c.key)
  )?.key || numericCols[0]?.key;

  const totalValueSum = metricColKey 
    ? data.reduce((acc, curr) => {
        const val = Number(curr[metricColKey]);
        return acc + (isNaN(val) ? 0 : val);
      }, 0)
    : 0;

  const metricLabel = metricColKey ? metricColKey.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Metrics';

  return (
    <div className="flex flex-col h-screen max-w-[1600px] mx-auto bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden select-none">
      
      {/* Header Panel */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.25)]">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Azure Data Ingestion Studio 
              <span className="text-[9px] bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest font-bold">V2.0 PRO</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Enterprise Orchestrator & Analytics Studio</p>
          </div>
        </div>
        
        {/* Email Alert Dispatcher Input */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-1.5 px-3.5 flex items-center gap-2.5 min-w-[220px]">
            <Mail className="w-4 h-4 text-indigo-600" />
            <div className="flex-1 flex flex-col">
              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Mail Ingress Alert</label>
              <input 
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-transparent border-0 text-[10px] font-semibold text-slate-700 placeholder-slate-400 p-0 focus:outline-none focus:ring-0 focus:border-0 w-full"
              />
            </div>
            {config.sendEmail ? (
              <span className="text-[8px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">SMTP ACTIVE</span>
            ) : (
              <span className="text-[8px] font-bold bg-slate-200 text-slate-400 px-1.5 py-0.5 rounded">OFF</span>
            )}
          </div>

          <div className="flex gap-2">
            <span className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-full border transition-all flex items-center gap-1.5",
              step === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
              step === 'error' ? "bg-red-50 text-red-700 border-red-200" :
              step !== 'idle' ? "bg-indigo-50 text-indigo-650 border-indigo-200" : "bg-slate-100 text-slate-500 border-slate-200"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", step === 'completed' ? "bg-emerald-500" : step === 'error' ? "bg-red-500" : step !== 'idle' ? "bg-indigo-500 animate-pulse" : "bg-slate-400")} />
              {step.toUpperCase()}
            </span>
          </div>

          <button 
            onClick={runEtl}
            disabled={step !== 'idle' && step !== 'completed' && step !== 'error'}
            className={cn(
              "px-6 py-2.5 rounded-xl text-white flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-bold uppercase tracking-widest text-xs border border-transparent",
              step !== 'idle' && step !== 'completed' ? "bg-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.3)] text-indigo-100" : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            {step === 'idle' || step === 'completed' || step === 'error' ? <Play className="w-4 h-4 fill-current" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>
              {step === 'idle' || step === 'completed' || step === 'error' ? 'Run Pipeline' : 'Processing...'}
            </span>
          </button>

          {/* Smart Alerts dropdown bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl relative transition-all"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white animate-ping" />
              )}
            </button>
            <AnimatePresence>
              {showNotificationDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Smart Warnings</span>
                    <button 
                      onClick={() => setNotifications([])} 
                      className="text-[8px] font-bold text-indigo-600 hover:underline uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">No active pipeline warnings.</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                              notif.type === 'warning' ? "bg-amber-50 text-amber-700 border border-amber-100" :
                              notif.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              "bg-slate-100 text-slate-655 border border-slate-200"
                            )}>
                              {notif.type}
                            </span>
                            <span className="text-[8px] text-slate-400 font-semibold">{notif.time}</span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-700 leading-snug">{notif.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile avatar info dropdown */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity"
            >
              <img src={user.avatar} className="w-8.5 h-8.5 rounded-full object-cover border border-indigo-200 shadow-xs" alt={user.name} />
              <div className="hidden xl:block">
                <p className="text-[10px] font-bold text-slate-800">{user.name}</p>
                <p className="text-[8px] font-semibold text-slate-450 uppercase tracking-wider">{user.role}</p>
              </div>
            </button>
            <button
              onClick={onLogout}
              title="Logout Session"
              className="p-2 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="w-20 md:w-64 bg-white border-r border-slate-200/80 flex flex-col z-0">
          <div className="flex-1 py-8 px-4 space-y-2">
            {[
              { id: 'pipeline', label: 'Flow Monitor', icon: Layers },
              { id: 'data', label: 'Source Explorer', icon: Database },
              { id: 'reports', label: 'Report Engine', icon: BarChart3 },
              { id: 'config', label: 'Infrastructure', icon: Settings },
              { id: 'profile', label: 'Employee Profile', icon: User },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative overflow-hidden group font-bold tracking-wider text-xs",
                  activeTab === item.id 
                    ? "bg-indigo-50 text-indigo-600 shadow-xs border border-indigo-100/50" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden md:block">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                  />
                )}
              </button>
            ))}
          </div>
          
          <div className="p-6 border-t border-slate-200/80">
            <div className="hidden md:block bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                Cloud Cluster <span>ONLINE</span>
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.3)]" />
                AZURE-NODE-CENTRAL
              </div>
            </div>
          </div>
        </nav>

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-auto relative bg-slate-50/50">
          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'pipeline' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="pipeline"
                  className="space-y-8"
                >
                  
                  {/* Top KPIs + Cluster Health Gauges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard label="Staging Volume" value={data.length} sub="Loaded records" icon={Database} />
                    <StatsCard 
                      label={metricColKey ? `Telemetry Sum (${metricLabel})` : 'Data Sum'} 
                      value={metricColKey ? totalValueSum.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '--'} 
                      sub="Aggregated total value" 
                      icon={Zap} 
                    />
                    
                    {/* SVG Gauge - Ingestion Throughput */}
                    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl flex items-center justify-between shadow-xs relative group hover:border-indigo-400/30 hover:shadow-sm transition-all duration-300">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ingestion Speed</p>
                        <h4 className="text-xl font-bold tracking-tight text-slate-850 mt-1">2,450 <span className="text-[10px] text-slate-400 font-semibold">rows/s</span></h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1 opacity-70">Spark Ingress Pipeline</p>
                      </div>
                      <div className="relative flex items-center justify-center">
                        <CircularProgress percent={68} />
                        <div className="absolute text-[9px] font-bold text-indigo-600 font-mono">68%</div>
                      </div>
                    </div>

                    {/* SVG Gauge - Compute Nodes Memory */}
                    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl flex items-center justify-between shadow-xs relative group hover:border-indigo-400/30 hover:shadow-sm transition-all duration-300">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Memory Allocation</p>
                        <h4 className="text-xl font-bold tracking-tight text-slate-850 mt-1">4.2 GB <span className="text-[10px] text-slate-400 font-semibold">/ 16GB</span></h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1 opacity-70">Nodes memory usage</p>
                      </div>
                      <div className="relative flex items-center justify-center">
                        <CircularProgress percent={26} />
                        <div className="absolute text-[9px] font-bold text-indigo-600 font-mono">26%</div>
                      </div>
                    </div>
                  </div>

                  {/* Airflow Horizontal Flow Visualizer */}
                  <section className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-center mb-10">
                      <div>
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pipeline Orchestration Map</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">Click any stage node to check concept explanations and Python source codes</p>
                      </div>
                      <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded text-[9px] font-mono text-slate-500">
                        AIRFLOW_DAG_VISUALIZER
                      </span>
                    </div>
                    <PipelineFlow currentStep={step} subStep={subStep} />
                  </section>

                  {/* Logs & Runs History Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* Execution Logs */}
                    <section className="xl:col-span-2 bg-slate-900 rounded-2xl border border-slate-950 shadow-sm flex flex-col h-[400px] overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-950 bg-[#0e1726] flex justify-between items-center">
                        <span className="font-bold uppercase tracking-widest text-[9px] text-slate-400 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400 animate-pulse" /> Ingestion Terminal Logs</span>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-slate-800" />
                          <div className="w-2 h-2 rounded-full bg-slate-800" />
                          <div className="w-2 h-2 rounded-full bg-slate-800" />
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto p-6 font-mono text-[11px] space-y-1.5 bg-slate-950 text-slate-350">
                        {logs.length === 0 && <div className="opacity-30 italic font-sans text-slate-400">Wait for pipeline dispatch or upload a dataset...</div>}
                        {logs.map((log, i) => (
                          <div key={i} className="flex gap-4 mb-1 border-b border-white/[0.04] pb-1">
                            <span className="opacity-25 text-slate-500 shrink-0">[{log.time}]</span>
                            <span className={cn(
                              log.type === 'success' ? 'text-emerald-400' : 
                              log.type === 'error' ? 'text-rose-400' : 'text-sky-400'
                            )}>
                              <span className="opacity-45 tracking-tighter mr-2">{">>>"}</span> {log.msg}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Phased architecture checklist panel */}
                    <section className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col h-[400px] overflow-y-auto space-y-6 shadow-xs">
                       <div>
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Environment Setup</h3>
                         <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <DetailRow label="Source Ingress" value={config.sourceType.toUpperCase()} />
                           <DetailRow label="Cloud Storage Target" value={config.destinationType.toUpperCase()} />
                           <DetailRow label="Profiling Summary" value={data.length > 0 ? `${columnsMeta.length} Features` : 'Pending'} />
                           <DetailRow label="Security Cert" value="TLS 1.3" success />
                         </div>
                       </div>
                       
                       <div className="flex flex-col space-y-3">
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Pipeline Phase Execution checklist</p>
                         <div className="space-y-2 text-[10px] font-mono text-slate-600">
                           <div className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", step === 'completed' ? "bg-emerald-500" : "bg-slate-200")} /> Phase 1 (Core Ingress Engine)</div>
                           <div className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", step === 'completed' && config.destinationType === 'azure_blob' ? "bg-indigo-500" : "bg-slate-200")} /> Phase 2 (Azure Sync Backup)</div>
                           <div className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", step === 'completed' && config.sendEmail ? "bg-purple-500" : "bg-slate-200")} /> Phase 3 (SMTP Report Dispatch)</div>
                         </div>
                       </div>
                    </section>
                  </div>

                  {/* Runs History Matrix */}
                  <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Runs History Matrix</h3>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Historical logs database of processed ETL runs</p>
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50">
                      <table className="w-full text-left border-collapse text-xs font-semibold text-slate-500">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            <th className="p-3.5 pl-5">Run ID</th>
                            <th className="p-3.5">Trigger Timestamp</th>
                            <th className="p-3.5">Operator</th>
                            <th className="p-3.5">Duration</th>
                            <th className="p-3.5">Rows Ingested</th>
                            <th className="p-3.5">Target Destination</th>
                            <th className="p-3.5 pr-5 text-right">Run Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 font-mono text-[10px] text-slate-700">
                          {runs.map(run => (
                            <tr key={run.id} className="hover:bg-slate-100/50 transition-colors">
                              <td className="p-3.5 pl-5 font-bold text-slate-900">{run.id}</td>
                              <td className="p-3.5 text-slate-500">{run.time}</td>
                              <td className="p-3.5 text-indigo-650 font-bold">{run.triggered_by}</td>
                              <td className="p-3.5">{run.duration}</td>
                              <td className="p-3.5 text-slate-800 font-bold">{run.rows}</td>
                              <td className="p-3.5 text-slate-500">{run.target}</td>
                              <td className="p-3.5 pr-5 text-right">
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-250 text-[8px] uppercase tracking-wider font-bold">
                                  SUCCESS
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'data' && <DataTable data={data} onUpload={handleManualUpload} />}
              {activeTab === 'reports' && <ReportView data={data} />}
              {activeTab === 'config' && <ConfigPanel config={config} setConfig={setConfig} user={user} />}
              {activeTab === 'profile' && <EmployeeProfile user={user} onClose={() => setActiveTab('pipeline')} />}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Floating Alert Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-white border border-slate-200 p-4 rounded-xl shadow-xl flex items-start gap-3.5 max-w-sm z-50 animate-fadeIn"
          >
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-700 mt-0.5">
              <Mail className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-xs text-slate-905">Live Results Emailed!</h5>
              <p className="text-[10px] text-slate-550 mt-1 leading-relaxed">
                Ingestion telemetry reports and distribution graphs delivered to: <strong className="text-indigo-600">{alertEmail}</strong>. Check your inbox!
              </p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant Chat Widget */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setShowAIChat(!showAIChat)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-full shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all border border-indigo-650"
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          <span className="text-xs font-bold uppercase tracking-wider pr-1">AI Assistant</span>
        </button>
        <AnimatePresence>
          {showAIChat && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 left-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 flex flex-col h-96 z-50 space-y-3"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Dataops AI Copilot</span>
                </div>
                <button onClick={() => setShowAIChat(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 p-1">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-2.5 rounded-2xl text-[10.5px] max-w-[85%] leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-650 text-white rounded-tr-none font-semibold' 
                        : 'bg-slate-100 text-slate-750 rounded-tl-none font-medium'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-150">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about pipeline configs..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-slate-900 text-white px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
                >
                  Send
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer Status Bar */}
      <footer className="bg-white border-t border-slate-200 px-8 py-3 flex justify-between items-center text-[10px] font-bold text-slate-405 select-none">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(79,70,229,0.3)]" />
            <span className="uppercase tracking-widest text-slate-500">Azure Service Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
            <span className="uppercase tracking-widest text-slate-500">Python 3.11 Agent Core Active</span>
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest text-slate-555">TLS 1.3 Certified</span>
          </div>
        </div>
        <div className="font-mono opacity-50 tracking-tight text-slate-500">
          NODE: INSTANCE-AZ-99B
        </div>
      </footer>
    </div>
  );
}

function CircularProgress({ percent, size = 48 }: { percent: number; size?: number }) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const strokePct = ((100 - percent) * circ) / 100;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} className="stroke-slate-100" strokeWidth="3" fill="transparent" />
      <circle 
        cx={size/2} 
        cy={size/2} 
        r={radius} 
        className="stroke-indigo-600 transition-all duration-700" 
        strokeWidth="3" 
        fill="transparent" 
        strokeDasharray={circ} 
        strokeDashoffset={strokePct} 
        strokeLinecap="round" 
      />
    </svg>
  );
}

function StatsCard({ label, value, sub, icon: Icon }: any) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs group hover:border-indigo-500/30 transition-all duration-305">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <h4 className="text-xl font-bold tracking-tight text-slate-800 mt-1 truncate">{value}</h4>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-1 opacity-70">{sub}</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-650 group-hover:border-indigo-200 transition-all">
          <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, success }: any) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={cn(
        "text-[10px] font-mono font-bold", 
        success ? "text-emerald-600" : "text-slate-700"
      )}>
        {value}
      </span>
    </div>
  );
}
