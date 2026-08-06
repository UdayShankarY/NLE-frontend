import { useState, useEffect } from 'react';
import { Crown, User as UserIcon, Trash2 } from 'lucide-react';
import { LoadingState, EmptyState } from '../EmptyState';
import { ConfirmModal } from './ConfirmModal';
import { cn } from '../../lib/utils';
import { getApiUrl } from '../../lib/api';
import { trackAdminAction } from '../../lib/analytics';
import { toast } from 'react-toastify';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export const UsersView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, 'user' | 'admin'>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch(getApiUrl('/api/dashboard/users'));
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load registered users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    setSavingUserId(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/dashboard/users/${userId}/role`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to update user role');
      }

      const updated = await response.json();
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, role: updated.role } : u)));
      setSelectedRoles((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      trackAdminAction('change_user_role', 'user', userId);
      toast.success(`User role updated to ${updated.role.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Unable to update user role');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/dashboard/users/${userId}`), {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u._id !== userId));
      trackAdminAction('delete_user', 'user', userId);
      toast.success('User deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Unable to delete user');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Registered Users &amp; Permissions</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{userCount} customers &middot; {adminCount} administrators</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {(['all', 'user', 'admin'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            className={cn(
              'border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer',
              filter === tab 
                ? 'border-brand-purple text-brand-purple dark:text-purple-400' 
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )}
            onClick={() => setFilter(tab)}
          >
            {tab === 'all' ? `All Users (${users.length})` : tab === 'user' ? `Customers (${userCount})` : `Admins (${adminCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12"><LoadingState label="Loading users..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(u => {
                  const targetRole = selectedRoles[u._id] || u.role;
                  const hasChanged = targetRole !== u.role;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/60 text-xs font-black text-brand-purple dark:text-purple-300">
                            {u.firstName?.[0]?.toUpperCase() || 'U'}{u.lastName?.[0]?.toUpperCase() || ''}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">{u.firstName || 'User'} {u.lastName || ''}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border',
                          u.role === 'admin' 
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-brand-purple dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        )}>
                          {u.role === 'admin' ? <><Crown size={12} /> Admin</> : <><UserIcon size={12} /> Customer</>}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={targetRole}
                            onChange={(e) => setSelectedRoles((prev) => ({ ...prev, [u._id]: e.target.value as 'user' | 'admin' }))}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                          >
                            <option value="user">Customer (User)</option>
                            <option value="admin">Administrator (Admin)</option>
                          </select>
                          <button
                            type="button"
                            disabled={!hasChanged || savingUserId === u._id}
                            onClick={() => void handleRoleChange(u._id, targetRole)}
                            className="rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-all disabled:opacity-40 cursor-pointer"
                          >
                            {savingUserId === u._id ? 'Saving...' : 'Update'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ id: u._id, name: `${u.firstName || 'User'} ${u.lastName || ''}`.trim() })}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {filtered.map(u => {
              const targetRole = selectedRoles[u._id] || u.role;
              const hasChanged = targetRole !== u.role;
              return (
                <div key={u._id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/60 text-xs font-black text-brand-purple dark:text-purple-300">
                        {u.firstName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{u.email}</div>
                      </div>
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase border',
                      u.role === 'admin' 
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-brand-purple dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    )}>
                      {u.role === 'admin' ? 'Admin' : 'Customer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-200/80 dark:border-slate-700/60 pt-2.5">
                    <select
                      value={targetRole}
                      onChange={(e) => setSelectedRoles((prev) => ({ ...prev, [u._id]: e.target.value as 'user' | 'admin' }))}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="user">Customer Role</option>
                      <option value="admin">Admin Role</option>
                    </select>
                    <button
                      type="button"
                      disabled={!hasChanged || savingUserId === u._id}
                      onClick={() => void handleRoleChange(u._id, targetRole)}
                      className="rounded-xl bg-brand-purple text-white px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                    >
                      {savingUserId === u._id ? 'Saving...' : 'Update'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ id: u._id, name: `${u.firstName || 'User'} ${u.lastName || ''}`.trim() })}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete User Account"
          message={`Are you sure you want to permanently delete user "${deleteConfirm.name}"? This action cannot be undone.`}
          confirmText="Delete User"
          onConfirm={() => void handleDeleteUser(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
