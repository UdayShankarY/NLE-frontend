import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Modal: React.FC<{ 
  title: string; 
  onClose: () => void; 
  children: React.ReactNode;
  large?: boolean;
  className?: string;
}> = ({ title, onClose, children, large, className }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" 
      onClick={onClose}
    >
      <div 
        className={cn(
          "w-[95%] max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transition-all duration-200 animate-in zoom-in-95 overflow-hidden",
          large ? "max-w-4xl" : "max-w-xl",
          className
        )} 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white truncate pr-2">{title}</h3>
          <button 
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-900 dark:text-white">
          {children}
        </div>
      </div>
    </div>
  );
};
