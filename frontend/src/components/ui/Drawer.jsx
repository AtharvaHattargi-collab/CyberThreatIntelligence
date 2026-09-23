import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ open, onClose, title, subtitle, children, width = 'max-w-2xl' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} h-full bg-surface border-l border-border shadow-2xl flex flex-col animate-slide-in-right`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
