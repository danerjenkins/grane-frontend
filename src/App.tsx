import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.tsx';
import About from './pages/About.tsx';
import Navbar from './components/Navbar';
import BakeDaysPage from './pages/BakeDays';
import CheckoutPage from './pages/CheckoutPage';
import AdminOrders from './pages/admin/AdminOrders.tsx';
import Success from './pages/Success';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminProducts from './pages/admin/AdminProducts';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminBakeDays from './pages/admin/AdminBakeDays';
import AdminBakeDayDetail from './pages/admin/AdminBakeDayDetail.tsx';
import { getSession, ensureUserProfile } from './api/auth';

export default function App() {
  useEffect(() => {
    // Warm up backend
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`)
      .then(() => console.log('Backend warmed'))
      .catch(() => console.log('Backend ping failed'));

    // On app initialization, ensure user profile exists if user is logged in
    const initializeUserProfile = async () => {
      try {
        const session = await getSession();
        if (session) {
          // User is logged in, ensure their profile exists in public.users
          await ensureUserProfile(session.user.id, session.user.email);
        }
      } catch (err) {
        // Non-blocking error - log but don't prevent app from loading
        console.error('Failed to initialize user profile:', err);
      }
    };

    initializeUserProfile();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/why-bake-days" element={<About />} />
        <Route path="/bake-days" element={<BakeDaysPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="bake-days" element={<AdminBakeDays />} />
          <Route path="bake-days/:bakeDayId" element={<AdminBakeDayDetail />} />
        </Route>
        <Route path="/success" element={<Success />} />
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </div>
  );
}
