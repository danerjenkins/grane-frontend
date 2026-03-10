import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { signOut } from '../../api/auth';
import { useCart } from '../../context/CartContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const handleSignOut = async () => {
    try {
      await signOut();
      clearCart();
      navigate('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const navLinks = [
    { name: 'Overview', path: '/admin' },
    { name: 'Products', path: '/admin/products' },
    { name: 'Orders', path: '/admin/orders' },
    { name: 'Accounts', path: '/admin/accounts' },
    { name: 'Bake Days', path: '/admin/bake-days' },
  ];

  return (
    <div className="flex h-full min-h-0 bg-muted">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-neutral-200 text transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <Link
            to="/admin"
            className="block p-6 border-b border-neutral-200 hover:bg-neutral-50 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <h1 className="text-xl font-bold text">Admin Panel</h1>
            <p className="text-xs text-secondary tracking-widest uppercase mt-1">Grane Bakery</p>
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-neutral-200">
            <button
              onClick={handleSignOut}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top Header - Mobile */}
        <header className="lg:hidden bg-surface border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <Link
            to="/admin"
            className="hover:opacity-80 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          >
            <h1 className="text-lg font-semibold text">Admin</h1>
            <p className="text-xs text-secondary">Grane Bakery</p>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
