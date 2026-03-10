import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ClipboardList, Package, Users } from 'lucide-react';
import { getSession } from '../../api/auth';
import { getUserById } from '../../api/admin/usersAdmin';
import { getAppSettings, updateStripeMode } from '../../api/admin/appSettingsAdmin';
import type { AppSettings, UserRow } from '../../api/admin/types';

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
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [switchingMode, setSwitchingMode] = useState(false);

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

  useEffect(() => {
    let active = true;

    const loadAppSettings = async () => {
      try {
        setSettingsLoading(true);
        setSettingsError(null);
        const settings = await getAppSettings();
        if (!active) return;
        setAppSettings(settings);
      } catch (err) {
        if (!active) return;
        setSettingsError(err instanceof Error ? err.message : 'Failed to load app settings');
      } finally {
        if (active) setSettingsLoading(false);
      }
    };

    loadAppSettings();
    return () => {
      active = false;
    };
  }, []);

  const currentStripeMode = appSettings?.stripe_mode ?? 'test';

  const handleStripeModeChange = async (nextMode: AppSettings['stripe_mode']) => {
    if (nextMode === currentStripeMode) return;

    try {
      setSwitchingMode(true);
      setSettingsError(null);
      setSettingsSuccess(null);
      const updatedSettings = await updateStripeMode(nextMode);
      setAppSettings(updatedSettings);
      setSettingsSuccess(
        `Stripe mode switched to ${updatedSettings.stripe_mode === 'live' ? 'Live' : 'Sandbox'}.`
      );
      window.setTimeout(() => setSettingsSuccess(null), 2500);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to switch Stripe mode');
    } finally {
      setSwitchingMode(false);
    }
  };

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

        <div className="admin-card p-6 mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text mb-2">Stripe Mode</h2>
              <p className="text-sm text-secondary">
                New checkout sessions will use the selected Stripe environment.
              </p>
            </div>
            {appSettings && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  appSettings.stripe_mode === 'live'
                    ? 'bg-danger-soft text-danger border border-danger/30'
                    : 'bg-brand-soft text-brand-strong border border-brand'
                }`}
              >
                {appSettings.stripe_mode === 'live' ? 'Live' : 'Sandbox'}
              </span>
            )}
          </div>

          <div className="mt-4">
            {settingsLoading ? (
              <div className="text-secondary">Loading Stripe settings...</div>
            ) : settingsError ? (
              <div className="banner banner-error text-sm">{settingsError}</div>
            ) : appSettings ? (
              <div className="space-y-4">
                {settingsSuccess && (
                  <div className="banner banner-success text-sm">{settingsSuccess}</div>
                )}
                <div className="flex flex-col gap-3 md:flex-row">
                  <button
                    type="button"
                    onClick={() => handleStripeModeChange('test')}
                    disabled={switchingMode || currentStripeMode === 'test'}
                    className={`btn-secondary ${
                      switchingMode || currentStripeMode === 'test'
                        ? 'cursor-not-allowed opacity-60'
                        : ''
                    }`}
                  >
                    Use Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStripeModeChange('live')}
                    disabled={switchingMode || currentStripeMode === 'live'}
                    className={`btn-primary ${
                      switchingMode || currentStripeMode === 'live'
                        ? 'cursor-not-allowed opacity-60'
                        : ''
                    }`}
                  >
                    Use Live
                  </button>
                </div>
                <p className="text-xs text-secondary">
                  This changes checkout mode for new sessions only. Existing Stripe sessions stay in
                  the mode they were created with.
                </p>
              </div>
            ) : (
              <div className="text-secondary">No Stripe settings found.</div>
            )}
          </div>
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
