import React from 'react';
import { LayoutDashboard, FolderTree, Gift, Images, Package, Users, FileText, PartyPopper, Sparkles, LogOut, ChevronRight } from 'lucide-react';
import type { AdminView, AuthUser } from '../../types';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS: { view: AdminView; icon: React.ElementType; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'categories', icon: FolderTree, label: 'Categories' },
  { view: 'products', icon: Gift, label: 'Products' },
  { view: 'addons', icon: Sparkles, label: 'Add-ons' },
  { view: 'activities', icon: PartyPopper, label: 'Activities' },
  { view: 'sliders', icon: Images, label: 'Hero Sliders' },
  { view: 'orders', icon: Package, label: 'Orders' },
  { view: 'users', icon: Users, label: 'Users' },
  { view: 'terms', icon: FileText, label: 'Pages & Legal' },
];

interface SidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  user: AuthUser;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, user, onCloseMobile }) => {
  const navigate = useNavigate();

  const handleSelect = (view: AdminView) => {
    onViewChange(view);
    onCloseMobile?.();
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      {/* Brand Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-brand-purple dark:text-purple-300 font-extrabold shadow-2xs group-hover:scale-105 transition-transform">
            <PartyPopper size={18} />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">Admin Portal</div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">TheDecorParty</div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-[0.98]',
                active 
                  ? 'bg-brand-purple text-white shadow-md shadow-purple-600/20' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              )}
              onClick={() => handleSelect(item.view)}
            >
              <Icon size={18} className={cn('shrink-0', active ? 'text-white' : 'text-slate-400 dark:text-slate-500')} />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {active ? (
                <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 opacity-0 hover:opacity-100 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Profile & Back to Site */}
      <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="min-w-0 pr-2">
            <div className="truncate text-xs font-black text-slate-900 dark:text-white">{user.name || `${user.firstName || ''} ${user.lastName || ''}`}</div>
            <div className="truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500">{user.email}</div>
          </div>
          <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            ADMIN
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <LogOut size={14} /> Back to Website
        </button>
      </div>
    </div>
  );
};
