import React from 'react';
import { X, Keyboard } from 'lucide-react';

export default function KeyboardShortcutsModal({ open, onClose }) {
  if (!open) return null;

  const shortcuts = [
    { key: '/', desc: 'Global Search / Command Palette' },
    { key: 'CTRL + K', desc: 'Command Palette' },
    { key: 'G', desc: 'Go to Overview' },
    { key: 'T', desc: 'Open Threat Monitor' },
    { key: 'E', desc: 'Open Security Events' },
    { key: 'A', desc: 'Open AI Detection' },
    { key: 'M', desc: 'Open Model Performance' },
    { key: '?', desc: 'Show Keyboard Shortcuts' },
    { key: 'ESC', desc: 'Close Modals' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-border shadow-2xl rounded-xl overflow-hidden animate-fade-in flex flex-col">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-text-primary" />
            <h2 className="text-base font-bold text-text-primary">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>

        <div className="p-5">
          <div className="space-y-2">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <span className="text-sm text-text-secondary">{s.desc}</span>
                <kbd className="bg-background border border-border rounded px-2 py-1 font-mono text-[10px] text-text-primary font-bold shadow-sm">{s.key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
