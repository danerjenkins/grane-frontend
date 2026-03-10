import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User } from 'lucide-react';
import { useCart, type CartItem } from '../context/CartContext';
import { getSession } from '../api/auth';
import { isAdmin } from '../api/admin';
import { supabase } from '../api/supabaseClient';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const { cart, removeFromCart } = useCart();
  const { clearCart } = useCart();
  const { cartQuantity } = useCart();
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const desktopNavLinkClass = (path: string, isAdminLink = false) =>
    [
      isAdminLink ? 'text-brand-strong hover:text-brand font-semibold' : 'text-text hover:text-secondary',
      'font-medium text-base tracking-wide transition-colors relative group pb-1',
    ]
      .filter(Boolean)
      .join(' ');

  const mobileNavLinkClass = (path: string, isAdminLink = false) =>
    [
      isAdminLink ? 'text-brand-strong hover:text-brand font-semibold' : 'text-text hover:text-secondary',
      'text-base transition-colors hover:translate-x-1 transform',
    ]
      .filter(Boolean)
      .join(' ');

  // Check session on mount and when location changes
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        const loggedIn = session !== null;
        setIsLoggedIn(loggedIn);
        setSessionLoading(false);

        // Defer admin check to not block UI rendering
        if (loggedIn) {
          // Run admin check after a small delay to ensure session is fully established
          setTimeout(async () => {
            try {
              const adminStatus = await isAdmin();
              setIsUserAdmin(adminStatus);
            } catch (err) {
              console.error('Failed to check admin status:', err);
              setIsUserAdmin(false);
            }
          }, 100);
        } else {
          setIsUserAdmin(false);
        }
      } catch {
        setIsLoggedIn(false);
        setIsUserAdmin(false);
        setSessionLoading(false);
      }
    };

    checkSession();
  }, [location.pathname]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const loggedIn = session !== null;
      setIsLoggedIn(loggedIn);
      setSessionLoading(false);

      // Defer admin check to not block the auth state change
      if (loggedIn) {
        // Run admin check after a small delay
        setTimeout(async () => {
          try {
            const adminStatus = await isAdmin();
            setIsUserAdmin(adminStatus);
          } catch (err) {
            console.error('Failed to check admin status:', err);
            setIsUserAdmin(false);
          }
        }, 100);
      } else {
        setIsUserAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="bg-surface border-b border-neutral-200 px-3 md:px-8 py-4 relative">
      <div className="w-full">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="/granelogo3draft.png"
              alt="Grane Bakery Logo"
              className="h-20 w-20 object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* MOBILE ICONS */}
          <div className="flex items-center space-x-5 md:hidden">
            {/* Mobile Cart Button */}
            <button
              className="relative group"
              onClick={() => {
                setCartOpen(!cartOpen);
                setIsOpen(false);
              }}
            >
              <ShoppingCart className="w-6 h-6 text-text transition-colors group-hover:text-secondary" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-text text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                  {cartQuantity}
                </span>
              )}
            </button>

            {isLoggedIn && !sessionLoading && (
              <Link
                to="/account"
                aria-label="Account"
                className="relative group"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-6 h-6 text-text transition-colors group-hover:text-secondary" />
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="text-text hover:text-secondary focus:outline-none transition-colors"
              onClick={() => {
                setIsOpen(!isOpen);
                setCartOpen(false);
              }}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* DESKTOP MENU + DESKTOP CART */}
          <div className="hidden md:flex items-center space-x-8">
            {/* <Link to="/menu" className="nav-link">Menu</Link>*/}
            <Link
              to="/"
              className={desktopNavLinkClass('/')}
            >
              Home
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                  isActiveRoute('/') ? 'w-full bg-text' : 'w-0 bg-text group-hover:w-full'
                }`}
              ></span>
            </Link>
            <Link
              to="/about"
              className={desktopNavLinkClass('/about')}
            >
              About Grane
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                  isActiveRoute('/about')
                    ? 'w-full bg-text'
                    : 'w-0 bg-text group-hover:w-full'
                }`}
              ></span>
            </Link>
            <Link
              to="/bake-days"
              className={desktopNavLinkClass('/bake-days')}
            >
              Order
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                  isActiveRoute('/bake-days')
                    ? 'w-full bg-text'
                    : 'w-0 bg-text group-hover:w-full'
                }`}
              ></span>
            </Link>

            {isLoggedIn && !sessionLoading && (
              <Link
                to="/my-orders"
                className={desktopNavLinkClass('/my-orders')}
              >
                My Orders
                <span
                  className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                    isActiveRoute('/my-orders')
                      ? 'w-full bg-text'
                      : 'w-0 bg-text group-hover:w-full'
                  }`}
                ></span>
              </Link>
            )}

            {/* Admin Link */}
            {isUserAdmin && !sessionLoading && (
              <Link
                to="/admin"
                className={desktopNavLinkClass('/admin', true)}
              >
                Admin
                <span
                  className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                    isActiveRoute('/admin')
                      ? 'w-full bg-brand-strong'
                      : 'w-0 bg-brand-strong group-hover:w-full'
                  }`}
                ></span>
              </Link>
            )}

            {/* Auth Links */}
            {!sessionLoading && (
              <>
                {isLoggedIn ? (
                  <></>
                ) : (
                  <Link
                    to="/login"
                    className="bg-brand-strong text-white px-5 py-2 rounded-full font-medium text-base tracking-wide hover:bg-brand transition-all shadow-sm hover:shadow-md"
                  >
                    Log In
                  </Link>
                )}
              </>
            )}

            {/* Desktop Cart */}
            <div className="relative ml-2 flex items-center gap-3">
              {isLoggedIn && !sessionLoading && (
                <Link to="/account" aria-label="Account" className="relative group">
                  <User className="w-6 h-6 text-text transition-colors group-hover:text-secondary" />
                </Link>
              )}
              <button className="relative group" onClick={() => setCartOpen(!cartOpen)}>
                <ShoppingCart className="w-6 h-6 text-text transition-colors group-hover:text-secondary" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-text text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                    {cartQuantity}
                  </span>
                )}
              </button>

              {/* Desktop Dropdown */}
              {cartOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-surface shadow-2xl border border-neutral-200 rounded-xl p-5 z-50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-2">
                    <h3 className="text-lg font-bold text-text">Your Cart</h3>
                    {cart.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Clear your entire cart?')) {
                            clearCart();
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {cart.length === 0 ? (
                    <p className="text-sm text-secondary italic">Your cart is empty.</p>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                      {cart.map((item: CartItem) => (
                        <div
                          key={item.product_id}
                          className="flex justify-between items-start gap-3 pb-3 border-b border-neutral-100 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-text">{item.name}</p>
                            <p className="text-sm text-secondary mt-1">
                              ${item.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <button
                            className="text-red-600 text-xs font-medium hover:text-red-700 transition-colors"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-neutral-200">
                    {cart.length === 0 ? (
                      <Link
                        to="/bake-days"
                        onClick={() => setCartOpen(false)}
                        className="block bg-text text-white text-center py-2.5 rounded-lg font-medium hover:bg-text/90 transition-all shadow-sm hover:shadow-md"
                      >
                        Order Now
                      </Link>
                    ) : (
                      <Link
                        to="/checkout"
                        onClick={() => setCartOpen(false)}
                        className="block bg-text text-white text-center py-2.5 rounded-lg font-medium hover:bg-text/90 transition-all shadow-sm hover:shadow-md"
                      >
                        Proceed to Checkout
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE MENU ITEMS */}
      {isOpen && (
        <div className="mt-6 flex flex-col space-y-4 md:hidden pb-4 border-t border-neutral-200 pt-4">
          <Link
            to="/"
            className={mobileNavLinkClass('/')}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={mobileNavLinkClass('/about')}
            onClick={() => setIsOpen(false)}
          >
            About Grane
          </Link>
          <Link
            to="/bake-days"
            className={mobileNavLinkClass('/bake-days')}
            onClick={() => setIsOpen(false)}
          >
            Order
          </Link>

          {isLoggedIn && !sessionLoading && (
            <Link
              to="/my-orders"
              className={mobileNavLinkClass('/my-orders')}
              onClick={() => setIsOpen(false)}
            >
              My Orders
            </Link>
          )}

          {/* Admin Link */}
          {isUserAdmin && !sessionLoading && (
            <Link
              to="/admin"
              className={mobileNavLinkClass('/admin', true)}
              onClick={() => setIsOpen(false)}
            >
              Admin
            </Link>
          )}

          {!sessionLoading && (
            <>
              {isLoggedIn ? (
                <></>
              ) : (
                <Link
                  to="/login"
                  className="bg-brand-strong text-white px-5 py-2.5 rounded-full font-medium text-base text-center hover:bg-brand transition-all shadow-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Log In
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {cartOpen && (
        <div className="md:hidden mt-6 w-full bg-surface shadow-xl border border-neutral-200 rounded-xl p-5 z-50">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-2">
            <h3 className="text-lg font-bold text-text">Your Cart</h3>
            {cart.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear your entire cart?')) {
                    clearCart();
                  }
                }}
                className="text-xs text-red-600 hover:text-red-800 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-secondary italic">Your cart is empty.</p>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {cart.map((item: CartItem) => (
                <div
                  key={item.product_id}
                  className="flex justify-between items-start gap-3 pb-3 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-text">{item.name}</p>
                    <p className="text-sm text-secondary mt-1">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <button
                    className="text-red-600 text-xs font-medium hover:text-red-700 transition-colors"
                    onClick={() => removeFromCart(item.product_id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-neutral-200">
            {cart.length === 0 ? (
              <Link
                to="/bake-days"
                onClick={() => setCartOpen(false)}
                className="block bg-text text-white text-center py-2.5 rounded-lg font-medium hover:bg-muted transition-all shadow-sm"
              >
                Order Now
              </Link>
            ) : (
              <Link
                to="/checkout"
                onClick={() => setCartOpen(false)}
                className="block bg-text text-white text-center py-2.5 rounded-lg font-medium hover:bg-muted transition-all shadow-sm"
              >
                Proceed to Checkout
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
