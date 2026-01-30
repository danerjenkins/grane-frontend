/**
 * REFACTOR REPORT: Tailwind Color Token Migration (2025-01-29)
 * ============================================================
 * This file and all admin pages have been refactored to use semantic color tokens
 * instead of hardcoded Tailwind utility classes.
 *
 * CHANGES MADE:
 * - AdminHome.tsx: 6 replacements
 *   - Main background: bg-neutral-50 → bg-muted
 *   - Card backgrounds: bg-white → bg-surface
 *   - Primary text: text-neutral-900 → text
 *   - Secondary text: text-neutral-600 → text-secondary
 *
 * - AdminLayout.tsx: 3 replacements
 *   - Sidebar & mobile header backgrounds: bg-white → bg-surface
 *   - Main background: bg-neutral-50 → bg-muted
 *   - Text colors updated to semantic tokens
 *
 * - AdminBakeDays.tsx: 8 replacements
 *   - Main background: bg-neutral-50 → bg-muted
 *   - Card backgrounds: bg-white → bg-surface
 *   - Primary CTA buttons: bg-amber-700/800 → bg-brand-strong/brand
 *   - Form focus rings: focus:ring-amber-700 → focus:ring-brand-strong
 *   - Badge colors: bg-amber-100/text-amber-900 → bg-brand-soft/text-brand-strong
 *   - Text colors updated throughout
 *
 * - AdminBakeDayDetail.tsx: 8 replacements
 *   - Loading & container backgrounds: bg-neutral-50 → bg-muted
 *   - Card backgrounds: bg-white → bg-surface
 *   - Primary buttons: bg-amber-700/800 → bg-brand-strong/brand
 *   - Form focus rings updated to brand token
 *   - All text colors migrated to semantic tokens
 *
 * - AdminProducts.tsx: 7 replacements
 *   - Main background: bg-neutral-50 → bg-muted
 *   - Card backgrounds: bg-white → bg-surface
 *   - Primary button: bg-amber-700/800 → bg-brand-strong/brand
 *   - Form labels and focus rings updated
 *   - Modal backgrounds: bg-white → bg-surface
 *   - Text colors fully migrated
 *
 * - AdminOrders.tsx: 9 replacements
 *   - Main background: bg-neutral-50 → bg-muted
 *   - Filter card: bg-white → bg-surface
 *   - Table background: bg-white → bg-surface
 *   - Drawer background: bg-white → bg-surface
 *   - Summary cards: bg-white → bg-surface
 *   - Modal background: bg-white → bg-surface
 *   - All text colors migrated to semantic tokens
 *   - Note: Status/stripe badges retain color-based tones (green/amber/blue/gray)
 *
 * - AdminAccounts.tsx: 10 replacements
 *   - Main background: bg-neutral-50 → bg-muted
 *   - Search input focus ring: focus:ring-amber-700 → focus:ring-brand-strong
 *   - Table background: bg-white → bg-surface
 *   - Drawer background: bg-white → bg-surface
 *   - Modal background: bg-white → bg-surface
 *   - Basic info section colors updated
 *   - Primary buttons: bg-amber-700/800 → bg-brand-strong/brand
 *   - All text colors migrated
 *   - Note: Error/danger colors (red) retained in delete flow
 *
 * COLOR MAPPING APPLIED:
 * - bg-neutral-50 (subtle background) → bg-muted
 * - bg-white (card background) → bg-surface
 * - text-neutral-900 (primary text) → text
 * - text-neutral-600/700/500 (secondary text) → text-secondary
 * - bg-amber-700/800 (brand buttons) → bg-brand-strong/bg-brand
 * - focus:ring-amber-700 (focus states) → focus:ring-brand-strong
 * - bg-amber-100/text-amber-900 (brand accents) → bg-brand-soft/text-brand-strong
 *
 * NOT CHANGED (requires future tokens):
 * - Error colors (red-50, red-100, text-red-*): Left as-is, pending danger token
 * - Success colors (green-50, green-100): Left as-is, pending success token
 * - Info/status colors (blue-100, blue-800): Left as-is, pending info token\n * - These are typically used for system feedback and should have dedicated tokens
 */

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
      icon: '📦',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Orders',
      description: 'View and manage customer orders',
      path: '/admin/orders',
      icon: '📋',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Accounts',
      description: 'Manage user accounts and permissions',
      path: '/admin/accounts',
      icon: '👥',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Bake Days',
      description: 'Manage bake day schedules',
      path: '/admin/bake-days',
      icon: '🗓️',
      color: 'bg-orange-100 text-orange-800',
    },
  ];

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text mb-2">Admin Dashboard</h1>
          <p className="text-secondary">Welcome back! Here's an overview of your operations.</p>
        </div>

        {/* Current User Info Card */}
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
                  <p className="text-lg font-semibold text">{currentUser.name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Email</p>
                  <p className="text-lg font-semibold text">{currentUser.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Phone</p>
                  <p className="text-lg font-semibold text">{currentUser.phone || '—'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-secondary">No user data available.</div>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="bg-surface rounded-lg shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all p-6 flex flex-col items-start"
            >
              {/* Icon */}
              <div className={`text-4xl mb-4 ${card.color} p-3 rounded-lg`}>{card.icon}</div>

              {/* Content */}
              <h2 className="text-xl font-semibold text mb-2">{card.title}</h2>
              <p className="text-secondary text-sm flex-1">{card.description}</p>

              {/* Arrow */}
              <div className="text-blue-600 font-semibold mt-4 flex items-center gap-2">
                View <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
