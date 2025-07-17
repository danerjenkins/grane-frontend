import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md px-6 py-6 flex justify-between items-center">
      {/* Logo / Brand Name */}
      <Link
        to="/"
        className="flex items-center space-x-2 tracking-wide"
      >
        <img
          src="/granelogo3draft.png"
          alt="Grane Bakery Logo"
          className="h-12 w-12 object-contain"
        />
        <span className='text-4xl font-bold text-gray-900 font-serif'>Grane</span>
      </Link>

      {/* Navigation Links */}
      <div className="space-x-6">
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
    </nav>
  );
};

export default Navbar;
