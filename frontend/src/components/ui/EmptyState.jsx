import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', message = '', onRetry, retryLabel = 'Retry', isError = false }) {
  const DisplayIcon = isError ? AlertTriangle : Icon;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <DisplayIcon size={40} className={isError ? 'text-danger mb-4' : 'text-text-muted mb-4'} />
      <h3 className={`text-base font-semibold mb-1 ${isError ? 'text-danger' : 'text-text-primary'}`}>{title}</h3>
      {message && <p className="text-sm text-text-secondary max-w-md">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-4 text-sm">
          {retryLabel}
        </button>
      )}
    </div>
  );
}
