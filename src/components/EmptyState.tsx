import React from 'react';
import { Loader2, PackageSearch } from 'lucide-react';

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading packages...' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
    <Loader2 className="animate-spin text-brand-purple" size={32} />
    <p className="text-sm">{label}</p>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
    <PackageSearch className="mb-1 text-ink-muted" size={40} strokeWidth={1.5} />
    <h3 className="text-base font-semibold text-ink">{title}</h3>
    {description && <p className="max-w-xs text-sm text-ink-muted">{description}</p>}
    {actionLabel && onAction && (
      <button
        className="mt-3 rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white hover:bg-brand-purple-dark"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    )}
  </div>
);
