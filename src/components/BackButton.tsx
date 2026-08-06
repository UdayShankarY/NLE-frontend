import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconOnly?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({ iconOnly = false, className, children, ...props }) => (
  <button
    type="button"
    {...props}
    className={cn(
      iconOnly
        ? 'flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-black/5 dark:hover:bg-white/10'
        : 'flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink',
      className
    )}
  >
    <ArrowLeft size={iconOnly ? 20 : 16} />
    {!iconOnly && (children || 'Back')}
  </button>
);