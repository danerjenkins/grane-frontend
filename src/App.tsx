import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.tsx';
import About from './pages/About.tsx';
import Navbar from './components/Navbar';
import Menu from './pages/Menu.tsx';
import Contact from './pages/Contact.tsx';
import WhyBakeDays from './pages/WhyBakeDays.tsx';
import BakeDaysPage from './pages/BakeDays';
import CheckoutPage from './pages/CheckoutPage';
import AdminOrders from './pages/admin/AdminOrders.tsx';
import Success from './pages/Success';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import AdminRoute from './routes/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminProducts from './pages/admin/AdminProducts';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminBakeDays from './pages/admin/AdminBakeDays';
import AdminBakeDayDetail from './pages/admin/AdminBakeDayDetail.tsx';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`)
      .then(() => console.log('Backend warmed'))
      .catch(() => console.log('Backend ping failed'));
  }, []);
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/why-bake-days" element={<WhyBakeDays />} />
        <Route path="/bake-days" element={<BakeDaysPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<Login />} />
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
