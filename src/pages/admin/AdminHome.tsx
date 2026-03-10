import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSession } from '../../api/auth';
import { getUserById } from '../../api/admin/usersAdmin';
import type { UserRow } from '../../api/admin/types';

export default function AdminHome() {
  const [currentUser, setCurrentUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadCurrentUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const session = await getSession();
        if (!active) return;

        if (!session) {
          setError('Not logged in');
          setLoading(false);
          return;
        }

        const user = await getUserById(session.user.id);
        if (!active) return;
        setCurrentUser(user);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load user info');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCurrentUser();
    return () => {
      active = false;
    };
  }, []);

  const cards = [
    {
      title: 'Products',
      description: 'Manage your product catalog',
      path: '/admin/products',
      icon: 'ðŸ“¦',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Orders',
      description: 'View and manage customer orders',
      path: '/admin/orders',
      icon: 'ðŸ“‹',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Accounts',
      description: 'Manage user accounts and permissions',
      path: '/admin/accounts',
      icon: 'ðŸ‘¥',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Bake Days',
      description: 'Manage bake day schedules',
      path: '/admin/bake-days',
      icon: 'ðŸ—“ï¸',
      color: 'bg-orange-100 text-orange-800',
    },
  ];

  return (
    <main className="bg-muted px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text mb-2">Admin Dashboard</h1>
          <p className="text-secondary">Welcome back! Here's an overview of your operations.</p>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text mb-4">Logged In As</h2>
          {loading ? (
            <div className="text-secondary">Loading account information...</div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          ) : currentUser ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary">User ID</p>
                  <p className="text-lg font-semibold text">{currentUser.id}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Name</p>
                  <p className="text-lg font-semibold text">{currentUser.name || 'â€”'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Email</p>
                  <p className="text-lg font-semibold text">{currentUser.email || 'â€”'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Phone</p>
                  <p className="text-lg font-semibold text">{currentUser.phone || 'â€”'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-secondary">No user data available.</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="bg-surface rounded-lg shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all p-6 flex flex-col items-start"
            >
              <div className={`text-4xl mb-4 ${card.color} p-3 rounded-lg`}>{card.icon}</div>
              <h2 className="text-xl font-semibold text mb-2">{card.title}</h2>
              <p className="text-secondary text-sm flex-1">{card.description}</p>
              <div className="text-blue-600 font-semibold mt-4 flex items-center gap-2">
                View <span>â†’</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
