import React from 'react';
import { PipelineConfig } from '../types';
import { Shield, Server, Mail, Zap, Database, Cloud, FileJson, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ConfigPanelProps {
  config: PipelineConfig;
  setConfig: React.Dispatch<React.SetStateAction<PipelineConfig>>;
  user: {
    permissions: string[];
  };
}

export function ConfigPanel({ config, setConfig, user }: ConfigPanelProps) {
  const hasAccess = true;

  const updateConfig = (key: keyof PipelineConfig, value: any) => {
    if (!hasAccess) return;
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-3xl mx-auto space-y-12 animate-fadeIn"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Environment Orchestration</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 italic">Control infrastructure & pipeline delivery</p>
      </div>

      {!hasAccess && (
        <div className="bg-amber-50 border border-amber-250 rounded-2xl p-5 flex gap-4 text-amber-800 text-xs font-semibold max-w-xl mx-auto shadow-xs">
          <Shield className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 animate-pulse" />
          <div>
            <p className="font-bold text-amber-900 uppercase">RESTRICTED USER ACCESS PRIVILEGES</p>
            <p className="mt-1 font-medium leading-relaxed">
              Your profile is currently bound to the Data Engineer role. Altering SMTP Relays or cloud targets requires level-2 administrative rights.
            </p>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 ${!hasAccess ? 'opacity-60 pointer-events-none' : ''}`}>
        {/* Source Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="bg-slate-100 p-1.5 rounded-lg">
              <Server className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Inbound Data Layer</h3>
          </div>
          <div className="space-y-4">
            <ConfigOption 
              active={config.sourceType === 'csv'} 
              onClick={() => updateConfig('sourceType', 'csv')}
              label="Local Data Warehouse"
              desc="Read from staged_records.csv via extractor.py"
              icon={FileJson}
              disabled={!hasAccess}
            />
            <ConfigOption 
              active={config.sourceType === 'azure_sql'} 
              onClick={() => updateConfig('sourceType', 'azure_sql')}
              label="Azure SQL Instance"
              desc="Secure connection via azure_sql_reader.py"
              icon={Cloud}
              disabled={!hasAccess}
            />
          </div>
        </section>

        {/* Destination Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="bg-slate-100 p-1.5 rounded-lg">
              <Database className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Persistence Layer</h3>
          </div>
          <div className="space-y-4">
            <ConfigOption 
              active={config.destinationType === 'sqlite'} 
              onClick={() => updateConfig('destinationType', 'sqlite')}
              label="Production SQLite"
              desc="Persistent storage via loader.py"
              icon={Database}
              disabled={!hasAccess}
            />
            <ConfigOption 
              active={config.destinationType === 'azure_blob'} 
              onClick={() => updateConfig('destinationType', 'azure_blob')}
              label="Azure Blob Storage"
              desc="Cloud delivery via azure_loader.py"
              icon={Cloud}
              disabled={!hasAccess}
            />
          </div>
        </section>
      </div>

      {/* Automation Section */}
      <section className={`space-y-8 pt-6 ${!hasAccess ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="bg-slate-100 p-1.5 rounded-lg">
            <Zap className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Automation Controls</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Toggle 
              active={config.sendEmail} 
              onChange={(val) => updateConfig('sendEmail', val)}
              label="Notification Engine"
              desc="Email dispatch using emailer.py"
              icon={Mail}
              disabled={!hasAccess}
            />
            <Toggle 
              active={config.autoSchedule} 
              onChange={(val) => updateConfig('autoSchedule', val)}
              label="CRON Scheduler"
              desc="Automated trigger via run_etl.py"
              icon={Clock}
              disabled={!hasAccess}
            />
        </div>
      </section>

      <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
           <Shield className="w-32 h-32" />
         </div>
         <div className="relative z-10 flex gap-6 items-center">
           <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
             <Shield className="w-8 h-8" />
           </div>
           <div>
             <h4 className="font-bold uppercase tracking-[0.2em] text-[11px] mb-2 opacity-80">Encryption Standards</h4>
             <p className="text-sm leading-relaxed font-medium">
               All Azure connections are encrypted via TLS 1.3 protocol. Secure credentials are managed through environment secrets ensuring zero-trust architecture.
             </p>
           </div>
         </div>
      </div>
    </motion.div>
  );
}

function ConfigOption({ active, onClick, label, desc, icon: Icon, disabled }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-6 border rounded-2xl text-left transition-all relative overflow-hidden flex items-center gap-5 w-full",
        active 
          ? "border-indigo-600 bg-white ring-4 ring-indigo-50" 
          : "border-slate-200 bg-white hover:bg-slate-50",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className={cn(
        "p-3 rounded-xl transition-colors",
        active ? "bg-indigo-650 text-white" : "bg-slate-100 text-slate-400"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-bold text-slate-800 text-[11px] uppercase tracking-widest">{label}</p>
        <p className="text-[10px] text-slate-500 mt-1 font-medium italic">{desc}</p>
      </div>
      {active && (
        <div className="ml-auto">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
        </div>
      )}
    </button>
  );
}

function Toggle({ active, onChange, label, desc, icon: Icon, disabled }: any) {
  return (
    <div className={cn(
      "flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all",
      disabled && "opacity-55"
    )}>
      <div className="flex gap-4 items-center">
        <div className={cn(
          "p-2 rounded-lg",
          active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-widest">{label}</p>
          <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
        </div>
      </div>
      <button 
        disabled={disabled}
        onClick={() => onChange(!active)}
        className={cn(
          "w-12 h-6 rounded-full relative transition-colors duration-300",
          active ? "bg-emerald-500" : "bg-slate-200",
          disabled && "cursor-not-allowed"
        )}
      >
        <motion.div 
          animate={{ x: active ? 24 : 0 }}
          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
        />
      </button>
    </div>
  );
}
