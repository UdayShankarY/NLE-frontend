import React from 'react';
import { LayoutDashboard, FolderTree, Gift, Images, Package, Users, FileText, LogOut, PartyPopper } from 'lucide-react';
import type { AdminView, AuthUser } from '../../types';
import { cn } from '../../lib/utils';

const NAV_ITEMS: { view: AdminView; icon: React.ElementType; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'categories', icon: FolderTree, label: 'Categories' },
  { view: 'products', icon: Gift, label: 'Products' },
  { view: 'sliders', icon: Images, label: 'Hero Sliders' },
  { view: 'orders', icon: Package, label: 'Orders' },
  { view: 'users', icon: Users, label: 'Users' },
  { view: 'terms', icon: FileText, label: 'Pages & Legal' },
];

interface SidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  user: AuthUser;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, user, onLogout }) => (
  <div className="flex h-full w-60 flex-shrink-0 flex-col border-r border-border bg-white">
    <div className="flex items-center gap-2 border-b border-border px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-purple/10 text-lg">
        <PartyPopper size={18} className="text-brand-purple" />
      </div>
      <span className="font-bold text-ink">Admin Panel</span>
    </div>
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const active = currentView === item.view;
        return (
          <button
            key={item.view}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-brand-purple/10 text-brand-purple' : 'text-ink-muted hover:bg-black/5 hover:text-ink'
            )}
            onClick={() => onViewChange(item.view)}
          >
            <Icon size={17} />
            <span className="flex-1 text-left">{item.label}</span>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />}
          </button>
        );
      })}
    </div>
    <div className="border-t border-border p-3">
      <div className="mb-2 px-2">
        <div className="truncate text-sm font-semibold text-ink">{user.firstName} {user.lastName}</div>
        <div className="text-xs text-ink-muted">Administrator</div>
      </div>
      <button
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-red-50 hover:text-red-600"
        onClick={onLogout}
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  </div>
);
