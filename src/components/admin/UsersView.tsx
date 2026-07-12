import { useState, useEffect } from 'react';
import { Crown, User as UserIcon } from 'lucide-react';
import { LoadingState, EmptyState } from '../EmptyState';
import { cn } from '../../lib/utils';
import { getApiUrl } from '../../lib/api';

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

  useEffect(() => {
    fetch(getApiUrl('/api/dashboard/users'))
      .then(r => r.json())
      .then(d => { setUsers(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="adm-section">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Users</h2>
          <p className="text-sm text-ink-muted">{userCount} customers &middot; {adminCount} admins</p>
        </div>
      </div>

      <div className="mb-5 flex gap-2 border-b border-border">
        {(['all', 'user', 'admin'] as const).map(tab => (
          <button
            key={tab}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              filter === tab ? 'border-brand-purple text-brand-purple' : 'border-transparent text-ink-muted hover:text-ink'
            )}
            onClick={() => setFilter(tab)}
          >
            {tab === 'all' ? `All (${users.length})` : tab === 'user' ? `Customers (${userCount})` : `Admins (${adminCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading users..." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-xs font-bold text-brand-purple">
                        {u.firstName?.[0]?.toUpperCase()}{u.lastName?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-ink">{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                      u.role === 'admin' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-gray-100 text-ink-muted'
                    )}>
                      {u.role === 'admin' ? <><Crown size={12} /> Admin</> : <><UserIcon size={12} /> Customer</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
