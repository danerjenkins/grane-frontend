import { Link } from 'react-router-dom';

export default function AdminHome() {
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
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Admin Dashboard</h1>
          <p className="text-neutral-600">Welcome back! Here's an overview of your operations.</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all p-6 flex flex-col items-start"
            >
              {/* Icon */}
              <div className={`text-4xl mb-4 ${card.color} p-3 rounded-lg`}>{card.icon}</div>

              {/* Content */}
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">{card.title}</h2>
              <p className="text-neutral-600 text-sm flex-1">{card.description}</p>

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
