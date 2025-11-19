import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.tsx';
import About from './pages/About.tsx';
import Navbar from './components/Navbar';
import Menu from './pages/Menu.tsx';
import Contact from './pages/Contact.tsx';
import BakeDaysPage from './pages/BakeDays';
import CheckoutPage from './pages/CheckoutPage';
import AdminOrders from './pages/AdminOrders';
import Success from "./pages/Success";


export default function App() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/bake-days" element={<BakeDaysPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/success" element={<Success />} />

      </Routes>
    </div>
  );
}
