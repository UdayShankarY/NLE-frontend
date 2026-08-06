import { useState, useEffect } from 'react';
import { Users, Gift, FolderTree, Images, type LucideIcon } from 'lucide-react';
import { LoadingState } from '../EmptyState';
import { getApiUrl } from '../../lib/api';

const API = getApiUrl('/api/dashboard/stats');

interface DashboardData {
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalSliders: number;
}

const StatCard = ({ icon: Icon, label, value, sub, colorClass }: { icon: LucideIcon; label: string; value: string | number; sub?: string; colorClass: string }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-purple-300 dark:hover:border-purple-800">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${colorClass}`}>
      <Icon size={22} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</div>
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">{sub}</div>}
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

  if (loading) return <div className="py-12"><LoadingState label="Loading dashboard..." /></div>;

  if (error || !data) return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs font-bold text-rose-600 dark:text-rose-400">
      ⚠️ {error || 'No dashboard data available'}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Live real-time statistics of your event booking platform</p>
        </div>
        <div className="w-fit rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          Updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={data.totalUsers} sub="Registered customers" colorClass="bg-gradient-to-br from-brand-purple to-purple-800" />
        <StatCard icon={Gift} label="Total Products" value={data.totalProducts} sub={`${data.activeProducts} active packages`} colorClass="bg-gradient-to-br from-sky-600 to-sky-800" />
        <StatCard icon={FolderTree} label="Categories" value={data.totalCategories} sub="Active categories" colorClass="bg-gradient-to-br from-emerald-600 to-emerald-800" />
        <StatCard icon={Images} label="Hero Sliders" value={data.totalSliders} sub="Live on homepage" colorClass="bg-gradient-to-br from-amber-600 to-amber-800" />
      </div>
    </div>
  );
};
