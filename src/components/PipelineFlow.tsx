import React, { useState } from 'react';
import { 
  Database, 
  ArrowRight, 
  FileCode, 
  Zap, 
  Mail,
  ChevronRight,
  Globe,
  Settings,
  X,
  Play,
  FileCheck,
  Terminal
} from 'lucide-react';
import { PipelineStep } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PipelineFlowProps {
  currentStep: PipelineStep;
  subStep?: string;
}

export function PipelineFlow({ currentStep, subStep }: PipelineFlowProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const steps = [
    { 
      id: 'extracting', 
      icon: Database, 
      label: 'EXTRACT', 
      desc: 'extractor.py',
      beginnerDesc: "Ingests raw dataset payload (CSV/JSON) into the memory buffer. In corporate systems, this module establishes connections to raw storage lakes, Azure SQL databases, or Web API streams.",
      inputs: "data/staged_records.csv or uploaded local files",
      outputs: "Pandas DataFrame object containing raw row strings",
      code: `import os
import pandas as pd

def extract_data(file_path):
    # Reads tabular columns from local files
    print(f"[EXTRACTOR] Ingesting: {file_path}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Missing file: {file_path}")
        
    _, ext = os.path.splitext(file_path)
    if ext.lower() == '.csv':
        df = pd.read_csv(file_path)
    elif ext.lower() == '.json':
        df = pd.read_json(file_path)
        
    print(f"[EXTRACTOR] Ingested {len(df)} rows successfully.")
    return df`
    },
    { 
      id: 'transforming', 
      icon: FileCode, 
      label: 'TRANSFORM', 
      desc: 'transformer.py',
      beginnerDesc: "Cleans and standardizes the datasets. It trims outer spaces from text entries, handles null/missing fields (mapping empty metrics to default values), and casts columns matching currency patterns to floating decimals.",
      inputs: "Raw Pandas DataFrame from extract phase",
      outputs: "Normalized DataFrame with sanitized strings and cast numbers",
      code: `import pandas as pd

def transform_data(df):
    # Cleans and standardizes text rows and float decimals
    print("[TRANSFORMER] Standardizing values...")
    transformed = df.copy()
    
    # 1. Trim margins on string values
    for col in transformed.select_dtypes(include=['object']):
        transformed[col] = transformed[col].astype(str).str.strip()
        
    # 2. Fill empty numbers with 0.0 standard
    for col in transformed.columns:
        if any(t in col.lower() for t in ['amount', 'revenue', 'price']):
            transformed[col] = pd.to_numeric(transformed[col], errors='coerce').fillna(0.0)
            
    return transformed`
    },
    { 
      id: 'loading', 
      icon: Settings, 
      label: 'LOAD', 
      desc: 'loader.py / azure_loader.py',
      beginnerDesc: "Stores the processed data. It writes clean rows into a local SQLite transactional database and automatically pushes a cloud backup copy to Azure Blob Storage if cloud storage is configured.",
      inputs: "Clean DataFrame from transform phase",
      outputs: "SQL database entries & Azure Storage Container Blobs",
      code: `# etl/loader.py (SQLite load) & etl/azure_loader.py (Cloud sync)
import sqlite3
from azure.storage.blob import BlobServiceClient

def load_data(df, db_path="data/sqlite.db"):
    conn = sqlite3.connect(db_path)
    df.to_sql("processed_records", conn, if_exists="replace", index=False)
    conn.close()

def upload_to_azure(file_path, connection_string, container_name):
    # Uploads database file to Azure Blob Container
    service_client = BlobServiceClient.from_connection_string(connection_string)
    blob_client = service_client.get_blob_client(container=container_name, blob="backup.db")
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)`
    },
    { 
      id: 'analyzing', 
      icon: FileCheck, 
      label: 'VISUALIZE', 
      desc: 'viz.py',
      beginnerDesc: "Calculates descriptive statistics (count, unique, mean, min, max, percentiles) and exports an interactive HTML summary report page alongside a PNG distribution plot file into the reports folder.",
      inputs: "SQLite database records",
      outputs: "reports/report.html and reports/chart.png metrics graphs",
      code: `import os
import matplotlib.pyplot as plt

def generate_reports(df):
    os.makedirs("reports", exist_ok=True)
    
    # Render description stats to HTML page
    df.describe().to_html("reports/report.html")
    
    # Plot metric frequencies using matplotlib
    plt.figure(figsize=(8, 4.5))
    df.select_dtypes(include=['number']).iloc[:, 0].hist()
    plt.savefig("reports/chart.png")
    plt.close()`
    },
    { 
      id: 'notifying', 
      icon: Mail, 
      label: 'DELIVER', 
      desc: 'emailer.py',
      beginnerDesc: "Dispatches automated alerts. Connects to SMTP email servers using secure TLS protocol, drafts a summary message, binds the HTML report and chart plot as attachments, and delivers them to the user.",
      inputs: "reports/ files + SMTP mail settings",
      outputs: "Delivered SMTP email report with live summaries",
      code: `import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

def send_email_report(subject, recipient, attachment_paths, smtp_config):
    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg.attach(MIMEText("Telemetry summary report attached.", 'html'))
    
    # Secure SMTP server connection
    server = smtplib.SMTP(smtp_config['host'], smtp_config['port'])
    server.starttls()
    server.login(smtp_config['user'], smtp_config['password'])
    server.sendmail(smtp_config['sender'], recipient, msg.as_string())
    server.quit()`
    },
  ];

  const getStatus = (stepId: PipelineStep) => {
    const order = ['extracting', 'transforming', 'loading', 'analyzing', 'notifying', 'completed'];
    const currentIndex = order.indexOf(currentStep === 'idle' ? '' : currentStep);
    const stepIndex = order.indexOf(stepId);

    if (currentStep === 'completed') return 'completed';
    if (currentStep === stepId) return 'active';
    if (stepIndex < currentIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="relative z-10 w-full">
      {/* Horizontal Node Flow Layout */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative">
        {steps.map((step, i) => {
          const status = getStatus(step.id as PipelineStep);
          return (
            <React.Fragment key={step.id}>
              {/* Node Card */}
              <div 
                onClick={() => setSelectedStep(step.id)}
                className="flex flex-col items-center group w-full lg:w-40 relative cursor-pointer"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 shadow-sm relative z-10 select-none group-hover:scale-105",
                  status === 'active' ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.2)]" : 
                  status === 'completed' ? "border-emerald-600 bg-emerald-50 text-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.15)]" : 
                  "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                )}>
                  {status === 'active' && (
                     <motion.div 
                      className="absolute inset-[-6px] rounded-2xl border border-indigo-500/30"
                      animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                     />
                  )}
                  <step.icon className={cn("w-6 h-6", status === 'active' ? "animate-pulse" : "")} />
                </div>
                
                <div className="mt-4 text-center">
                  <p className={cn(
                    "font-bold uppercase tracking-[0.15em] text-[10px]",
                    status === 'active' ? "text-indigo-600" : status === 'completed' ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tighter hover:text-slate-700 transition-colors">
                    {status === 'active' && subStep ? subStep : step.desc}
                  </p>
                </div>

                {status === 'active' && (
                  <div className="absolute -top-7">
                    <div className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[8px] font-bold animate-bounce uppercase tracking-wider">Active</div>
                  </div>
                )}
              </div>

              {/* Interconnecting Line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:flex flex-1 h-[2px] bg-slate-250 relative min-w-[20px] -translate-y-8">
                  <motion.div 
                    className="absolute inset-0 bg-emerald-500 origin-left scale-x-0"
                    animate={{ scaleX: status === 'completed' ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                  />
                  {status === 'active' && (
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div 
                        className="h-full w-20 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                        animate={{ x: [-100, 200] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Slide-out Beginner-Friendly Code Detail Drawer */}
      <AnimatePresence>
        {selectedStep && (() => {
          const detail = steps.find(s => s.id === selectedStep)!;
          return (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStep(null)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
              />

              {/* Drawer Content */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-lg md:max-w-xl bg-white border-l border-slate-200 p-8 shadow-2xl z-50 flex flex-col text-slate-800 overflow-y-auto"
              >
                {/* Header controls */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-650">
                      <detail.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-widest text-slate-900 uppercase">{detail.label} MODULE</h3>
                      <p className="text-[10px] text-indigo-650 font-mono font-bold mt-0.5">{detail.desc}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStep(null)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Beginner Guide Section */}
                <div className="space-y-6 flex-1">
                  <div className="bg-indigo-50/50 border border-indigo-100/60 p-5 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Beginner Concept Guide</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      {detail.beginnerDesc}
                    </p>
                  </div>

                  {/* IO schemas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inbound Input</p>
                      <p className="text-[10px] font-mono text-slate-600 mt-1.5 leading-relaxed">{detail.inputs}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Outbound Output</p>
                      <p className="text-[10px] font-mono text-slate-600 mt-1.5 leading-relaxed">{detail.outputs}</p>
                    </div>
                  </div>

                  {/* Code Block Visualizer */}
                  <div className="space-y-2 flex flex-col">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-indigo-600" /> Python Source Code</span>
                      <span className="font-mono text-[9px] text-indigo-600">ReadOnly IDE View</span>
                    </div>
                    <div className="bg-slate-950 p-5 rounded-2xl font-mono text-[11px] text-emerald-400 border border-slate-900 overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
                      {detail.code}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400 select-none">
                  <span>ETL ENTERPRISE STUDIO v2.0</span>
                  <span className="text-indigo-600 font-mono">NODE_EXPLORER</span>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

