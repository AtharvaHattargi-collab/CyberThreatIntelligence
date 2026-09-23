import React from 'react';

export default function LoadingSkeleton({ rows = 4, cards = 0, chart = false }) {
  return (
    <div className="animate-pulse space-y-5">
      {cards > 0 && (
        <div className={`grid grid-cols-2 md:grid-cols-${cards} gap-4`}>
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-xl border border-border" />
          ))}
        </div>
      )}
      {chart && (
        <div className="h-80 bg-surface rounded-xl border border-border" />
      )}
      {rows > 0 && (
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-12 bg-surface rounded-lg border border-border" style={{ width: `${100 - i * 5}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
