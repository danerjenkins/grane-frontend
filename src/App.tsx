import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.tsx';
import About from './pages/About.tsx';
import Navbar from './components/Navbar';
import ErrorPage from './components/ErrorPage';
import BakeDaysPage from './pages/BakeDays';
import CheckoutPage from './pages/CheckoutPage';
import AdminOrders from './pages/admin/AdminOrders.tsx';
import Success from './pages/Success';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import MyOrders from './pages/MyOrders';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminProducts from './pages/admin/AdminProducts';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminBakeDays from './pages/admin/AdminBakeDays';
import AdminBakeDayDetail from './pages/admin/AdminBakeDayDetail.tsx';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminFeedbackDetail from './pages/admin/AdminFeedbackDetail';
import Feedback from './pages/Feedback';
import FeedbackWidget from './components/feedback/FeedbackWidget';
import { getSession, ensureUserProfile } from './api/auth';

export default function App() {
  useEffect(() => {
    void fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`).catch(() => {});

    const initializeUserProfile = async () => {
      try {
        const session = await getSession();
        if (session) {
          await ensureUserProfile(session.user.id, session.user.email);
        }
      } catch (err) {
        console.error('Failed to initialize user profile:', err);
      }
    };

    initializeUserProfile();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-muted text-text">
      <Navbar />

      <div className="flex-1 min-h-0">
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
            path="/my-orders"
            element={
              <ProtectedRoute redirectMessage="Please log in to view your orders.">
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute redirectMessage="Please log in to see your feedback.">
                <Feedback />
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
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="feedback/:feedbackId" element={<AdminFeedbackDetail />} />
          </Route>
          <Route path="/success" element={<Success />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="*" element={<ErrorPage statusCode={404} />} />
        </Routes>
      </div>

      <FeedbackWidget />
    </div>
  );
}
