import React, { Component, ErrorInfo, ReactNode } from 'react';
import { trackException } from '../lib/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Unhandled App Error]:', error, errorInfo);
    trackException(`${error.name}: ${error.message} \nStack: ${errorInfo.componentStack}`, true);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-8 shadow-xl max-w-md w-full">
            <h2 className="text-xl font-extrabold text-brand-purple mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              An unexpected error occurred. Our team has been notified automatically.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white px-5 py-2.5 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
