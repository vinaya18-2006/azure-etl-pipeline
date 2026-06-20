import React from 'react';
import { User, Shield, Briefcase, Key, CheckSquare, Settings } from 'lucide-react';

interface EmployeeProfileProps {
  user: {
    email: string;
    name: string;
    role: string;
    dept: string;
    avatar: string;
    permissions: string[];
  };
  onClose?: () => void;
}

export function EmployeeProfile({ user, onClose }: EmployeeProfileProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs max-w-2xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
        />
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-650" />
            {user.role} • {user.dept}
          </p>
          <p className="text-[11px] font-mono text-slate-450 mt-1.5">{user.email}</p>
        </div>
      </div>

      {/* Profile Detail Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Access Status</span>
          <span className="text-[11px] font-bold text-slate-700 mt-1.5 block flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVE SESSION
          </span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Security Clearance</span>
          <span className="text-[11px] font-mono font-bold text-slate-700 mt-1.5 block uppercase">
            Level-2 Dataops
          </span>
        </div>
      </div>

      {/* Permissions List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active System Permissions</h3>
        </div>
        
        <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/65 font-mono text-[11px] text-slate-650">
          {[
            { key: 'run_pipeline', label: 'Execute run_etl.py workflows' },
            { key: 'view_reports', label: 'View generated telemetry profiling tables' },
            { key: 'view_data', label: 'Access staged dataset records' },
            { key: 'edit_config', label: 'Alter SMTP / Azure Cloud credentials' },
            { key: 'manage_roles', label: 'Modify workspace team privileges' },
          ].map((perm) => {
            const hasAccess = user.permissions.includes(perm.key);
            return (
              <div key={perm.key} className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2">
                  <CheckSquare className={`w-4 h-4 ${hasAccess ? 'text-indigo-650' : 'text-slate-300'}`} />
                  <span className={hasAccess ? 'text-slate-800 font-semibold' : 'text-slate-400 font-normal line-through'}>
                    {perm.key}
                  </span>
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                  hasAccess 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  {hasAccess ? 'GRANTED' : 'RESTRICTED'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {onClose && (
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
