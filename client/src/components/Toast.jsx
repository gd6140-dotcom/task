import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast, closeToast } = useAuth();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-400" color="#34d399" />,
    error: <AlertCircle size={18} className="text-rose-400" color="#f87171" />,
    info: <Info size={18} className="text-indigo-400" color="#818cf8" />
  };

  const bgStyles = {
    success: 'border-emerald-500/40 bg-slate-900/95 text-emerald-100',
    error: 'border-rose-500/40 bg-slate-900/95 text-rose-100',
    info: 'border-indigo-500/40 bg-slate-900/95 text-indigo-100'
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        minWidth: '320px',
        maxWidth: '450px',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        background: '#0f172a',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icons[toast.type] || icons.info}
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f1f5f9' }}>{toast.message}</span>
      </div>
      <button
        onClick={closeToast}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
