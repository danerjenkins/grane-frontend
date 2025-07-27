import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; // optional: for icons

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md px-6 py-6">
      <div className="flex justify-between items-center">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/granelogo3draft.png"
            alt="Grane Bakery Logo"
            className="h-24 w-24 object-contain"
          />
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-800 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex space-x-6">
          <Link to="/menu" className="nav-link">
            Menu
          </Link>
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
          <Link to="/bake-days" className="nav-link">
            Bake Days
          </Link>
          <Link to="/account" className="nav-link">
            Account
          </Link>
        </div>
      </div>

      {/* Mobile menu items */}
      {isOpen && (
        <div className="mt-4 flex flex-col space-y-2 md:hidden">
          <Link to="/menu" className="nav-link">
            Menu
          </Link>
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
          <Link to="/bake-days" className="nav-link">
            Bake Days
          </Link>
          <Link to="/account" className="nav-link">
            Account
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
