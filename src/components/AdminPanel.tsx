import React, { useEffect, useState } from 'react';
import { Menu, Crown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AdminView, AuthUser } from '../types';
import { Sidebar, DashboardView, CategoriesView, ProductsView, SlidersView, UsersView, TermsView } from './admin';

interface AdminPanelProps {
  user: AuthUser;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const view = React.useMemo<AdminView>(() => {
    const path = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'dashboard';
    switch (path) {
      case 'categories':
        return 'categories';
      case 'products':
        return 'products';
      case 'sliders':
        return 'sliders';
      case 'orders':
        return 'orders';
      case 'bookings':
        return 'orders';
      case 'users':
        return 'users';
      case 'terms':
        return 'terms';
      default:
        return 'dashboard';
    }
  }, [location.pathname]);

  const navigateToView = (nextView: AdminView) => {
    const routes: Record<AdminView, string> = {
      dashboard: '/admin',
      categories: '/admin/categories',
      products: '/admin/products',
      sliders: '/admin/sliders',
      orders: '/admin/orders',
      users: '/admin/users',
      terms: '/admin/terms',
    };
    navigate(routes[nextView]);
  };

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  if (user.role !== 'admin') {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-ink">Access Denied</h2>
        <p className="mt-2 text-sm text-ink-muted">You are not authorized to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-[200] transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar currentView={view} onViewChange={navigateToView} user={user} onLogout={onLogout} />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-border bg-white px-4 shadow-sm md:px-7">
          <button
            className="mr-2 flex items-center justify-center rounded-md p-2 text-ink hover:bg-black/5 md:hidden"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm text-ink-muted">
            <span className="font-semibold text-brand-purple">Admin</span> / {view}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">{user.email}</span>
            <span className="flex items-center gap-1 rounded-full bg-brand-purple/10 px-2.5 py-1 text-xs font-bold text-brand-purple">
              <Crown size={12} /> ADMIN
            </span>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-7">
          {view === 'dashboard' && <DashboardView />}
          {view === 'categories' && <CategoriesView />}
          {view === 'products' && <ProductsView />}
          {view === 'sliders' && <SlidersView />}
          {view === 'orders' && <div className="adm-section"><h2>Orders - Coming Soon</h2></div>}
          {view === 'users' && <UsersView />}
          {view === 'terms' && <TermsView />}
        </div>
      </div>
    </div>
  );
};
