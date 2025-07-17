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
            className="h-12 w-12 object-contain"
          />
          <span className="text-4xl font-bold text-gray-900 font-serif">Grane</span>
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
          <Link to="/menu" className="text-gray-700 hover:text-brown-600">
            Menu
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-brown-600">
            About
          </Link>
          <Link to="/contact" className="text-gray-700 hover:text-brown-600">
            Contact
          </Link>
          <Link to="/account" className="text-gray-700 hover:text-brown-600">
            Account
          </Link>
        </div>
      </div>

      {/* Mobile menu items */}
      {isOpen && (
        <div className="mt-4 flex flex-col space-y-2 md:hidden">
          <Link to="/menu" className="text-gray-700 hover:text-brown-600">
            Menu
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-brown-600">
            About
          </Link>
          <Link to="/contact" className="text-gray-700 hover:text-brown-600">
            Contact
          </Link>
          <Link to="/account" className="text-gray-700 hover:text-brown-600">
            Account
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
