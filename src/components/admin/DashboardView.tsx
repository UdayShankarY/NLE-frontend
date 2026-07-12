import { useState, useEffect } from 'react';
import { Users, Gift, FolderTree, Images, type LucideIcon } from 'lucide-react';
import { LoadingState } from '../EmptyState';
const API = '/api/dashboard/stats';

interface DashboardData {
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalSliders: number;
}

const StatCard = ({ icon: Icon, label, value, sub, colorClass }: { icon: LucideIcon; label: string; value: string | number; sub?: string; colorClass: string }) => (
  <div className="flex items-center gap-4 rounded-card border border-border bg-white p-5 shadow-card">
    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-white ${colorClass}`}>
      <Icon size={22} />
    </div>
    <div>
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-sm text-ink-muted">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-muted">{sub}</div>}
    </div>
  </div>
);

export const DashboardView = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load dashboard data'); setLoading(false); });
  }, []);

  if (loading) return <div className="adm-section"><LoadingState label="Loading dashboard..." /></div>;

  if (error || !data) return (
    <div className="adm-section">
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">⚠️ {error || 'No data available'}</div>
    </div>
  );

  return (
    <div className="adm-section">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Dashboard</h2>
          <p className="text-sm text-ink-muted">Live overview of your store</p>
        </div>
        <div className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-ink-muted">
          Last updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={data.totalUsers} sub="Registered customers" colorClass="bg-gradient-to-br from-brand-purple to-brand-purple-light" />
        <StatCard icon={Gift} label="Total Products" value={data.totalProducts} sub={`${data.activeProducts} active`} colorClass="bg-gradient-to-br from-sky-700 to-sky-500" />
        <StatCard icon={FolderTree} label="Categories" value={data.totalCategories} sub="Active categories" colorClass="bg-gradient-to-br from-emerald-800 to-emerald-500" />
        <StatCard icon={Images} label="Hero Sliders" value={data.totalSliders} sub="Live on homepage" colorClass="bg-gradient-to-br from-amber-800 to-amber-500" />
      </div>
    </div>
  );
};
