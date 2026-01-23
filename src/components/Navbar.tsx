import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, removeFromCart } = useCart();
  const { cartQuantity } = useCart();

  return (
    <nav className="bg-white shadow-md px-6 py-6 relative">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/granelogo3draft.png"
            alt="Grane Bakery Logo"
            className="h-24 w-24 object-contain"
          />
        </Link>

        {/* MOBILE ICONS */}
        <div className="flex items-center space-x-4 md:hidden">
          {/* Mobile Cart Button */}
          <button
            className="relative"
            onClick={() => {
              setCartOpen(!cartOpen);
              setIsOpen(false);
            }}
          >
            <ShoppingCart className="w-6 h-6 text-gray-800" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {cartQuantity}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="text-gray-800 focus:outline-none"
            onClick={() => {
              setIsOpen(!isOpen);
              setCartOpen(false);
            }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* DESKTOP MENU + DESKTOP CART */}
        <div className="hidden md:flex items-center space-x-6">
          {/* <Link to="/menu" className="nav-link">Menu</Link>*/}
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/why-bake-days" className="nav-link">
            Why Bake Days
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
          <Link to="/bake-days" className="nav-link">
            Order
          </Link>
          <Link to="/login" className="nav-link">
            Admin
          </Link>
          {/* <Link to="/account" className="nav-link">Account</Link> */}

          {/* Desktop Cart */}
          <div className="relative ml-4">
            <button className="relative" onClick={() => setCartOpen(!cartOpen)}>
              <ShoppingCart className="w-6 h-6 text-gray-800" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {cartQuantity}
                </span>
              )}
            </button>

            {/* Desktop Dropdown */}
            {cartOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white shadow-lg border rounded-lg p-4 z-50">
                <h3 className="text-lg font-semibold mb-3">Cart</h3>
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-600">Your cart is empty.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product_id} className="flex justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            ${(item.price / 100).toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <button
                          className="text-red-500 text-sm"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 border-t pt-3">
                  {cart.length === 0 ? (
                    <Link
                      to="/bake-days"
                      onClick={() => setCartOpen(false)}
                      className="block bg-black text-white text-center py-2 rounded-md hover:bg-gray-800"
                    >
                      Order
                    </Link>
                  ) : (
                    <Link
                      to="/checkout"
                      onClick={() => setCartOpen(false)}
                      className="block bg-black text-white text-center py-2 rounded-md hover:bg-gray-800"
                    >
                      Checkout
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU ITEMS */}
      {isOpen && (
        <div className="mt-4 flex flex-col space-y-2 md:hidden">
          {/* <Link to="/menu" className="nav-link">Menu</Link> */}
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/why-bake-days" className="nav-link">
            Why Bake Days
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
          <Link to="/bake-days" className="nav-link">
            Order
          </Link>
          <Link to="/login" className="nav-link">
            Admin
          </Link>
          {/* <Link to="/account" className="nav-link">Account</Link> */}
        </div>
      )}

      {/* MOBILE CART DROPDOWN */}
      {cartOpen && (
        <div className="md:hidden mt-4 w-full bg-white shadow-lg border rounded-lg p-4 z-50">
          <h3 className="text-lg font-semibold mb-3">Cart</h3>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-600">Your cart is empty.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product_id} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      ${(item.price / 100).toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <button
                    className="text-red-500 text-sm"
                    onClick={() => removeFromCart(item.product_id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 border-t pt-3">
            {cart.length === 0 ? (
              <Link
                to="/bake-days"
                onClick={() => setCartOpen(false)}
                className="block bg-black text-white text-center py-2 rounded-md hover:bg-gray-800"
              >
                Order
              </Link>
            ) : (
              <Link
                to="/checkout"
                onClick={() => setCartOpen(false)}
                className="block bg-black text-white text-center py-2 rounded-md hover:bg-gray-800"
              >
                Checkout
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
