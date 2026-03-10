import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ClipboardList, Package, Users } from 'lucide-react';
import { getSession } from '../../api/auth';
import { getUserById } from '../../api/admin/usersAdmin';
import type { UserRow } from '../../api/admin/types';

const cards = [
  {
    title: 'Products',
    description: 'Manage your product catalog',
    path: '/admin/products',
    icon: Package,
    color: 'banner-info',
  },
  {
    title: 'Orders',
    description: 'View and manage customer orders',
    path: '/admin/orders',
    icon: ClipboardList,
    color: 'banner-success',
  },
  {
    title: 'Accounts',
    description: 'Manage user accounts and permissions',
    path: '/admin/accounts',
    icon: Users,
    color: 'bg-accent-soft text-accent',
  },
  {
    title: 'Bake Days',
    description: 'Manage bake day schedules',
    path: '/admin/bake-days',
    icon: CalendarDays,
    color: 'banner-warning',
  },
];

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

  return (
    <main className="bg-muted px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text mb-2">Admin Dashboard</h1>
          <p className="text-secondary">Welcome back! Here's an overview of your operations.</p>
        </div>

        <div className="admin-card p-6 mb-8">
          <h2 className="text-lg font-semibold text mb-4">Logged In As</h2>
          {loading ? (
            <div className="text-secondary">Loading account information...</div>
          ) : error ? (
            <div className="banner banner-error text-sm">{error}</div>
          ) : currentUser ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary">User ID</p>
                  <p className="text-lg font-semibold text">{currentUser.id}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Name</p>
                  <p className="text-lg font-semibold text">{currentUser.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Email</p>
                  <p className="text-lg font-semibold text">{currentUser.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Phone</p>
                  <p className="text-lg font-semibold text">{currentUser.phone || '-'}</p>
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
              className="admin-card flex flex-col items-start p-6 transition-all hover:border-neutral-300 hover:shadow-md"
            >
              <div className={`mb-4 rounded-lg p-3 ${card.color}`}>
                <card.icon className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold text mb-2">{card.title}</h2>
              <p className="text-secondary text-sm flex-1">{card.description}</p>
              <div className="mt-4 flex items-center gap-2 font-semibold text-info">
                View <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
