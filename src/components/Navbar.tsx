import { useEffect, useRef, useState } from 'react';
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
  const [isVisible, setIsVisible] = useState(true);
  const { cart, removeFromCart } = useCart();
  const { clearCart } = useCart();
  const { cartQuantity } = useCart();
  const location = useLocation();
  const lastScrollY = useRef(0);
  const previousCartQuantity = useRef(cartQuantity);

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const desktopNavLinkClass = (isAdminLink = false) =>
    [
      isAdminLink
        ? 'text-brand-strong hover:text-brand font-semibold'
        : 'text-text hover:text-secondary',
      'font-medium text-base tracking-wide transition-colors relative group pb-1',
    ]
      .filter(Boolean)
      .join(' ');

  const mobileNavLinkClass = (isAdminLink = false) =>
    [
      isAdminLink
        ? 'text-brand-strong hover:text-brand font-semibold'
        : 'text-text hover:text-secondary',
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDelta) < 8) {
        return;
      }

      if (currentScrollY <= 16) {
        setIsVisible(true);
      } else {
        setIsVisible(scrollDelta < 0);
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen || cartOpen) {
      setIsVisible(true);
    }
  }, [cartOpen, isOpen]);

  useEffect(() => {
    if (previousCartQuantity.current === 0 && cartQuantity > 0) {
      setIsVisible(true);
    }

    previousCartQuantity.current = cartQuantity;
  }, [cartQuantity]);

  return (
    <nav
      className={`sticky top-0 z-40 border-b border-neutral-200 bg-surface px-3 py-4 transition-transform duration-300 ease-out md:px-8 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
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
                <span className="btn-neutral absolute -right-2 -top-2 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm">
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
            <Link to="/" className={desktopNavLinkClass()}>
              Home
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                  isActiveRoute('/') ? 'w-full bg-text' : 'w-0 bg-text group-hover:w-full'
                }`}
              ></span>
            </Link>
            <Link to="/about" className={desktopNavLinkClass()}>
              About Grane
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                  isActiveRoute('/about') ? 'w-full bg-text' : 'w-0 bg-text group-hover:w-full'
                }`}
              ></span>
            </Link>
            <Link to="/bake-days" className={desktopNavLinkClass()}>
              Order
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                  isActiveRoute('/bake-days') ? 'w-full bg-text' : 'w-0 bg-text group-hover:w-full'
                }`}
              ></span>
            </Link>

            {isLoggedIn && !sessionLoading && (
              <Link to="/my-orders" className={desktopNavLinkClass()}>
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
              <Link to="/admin" className={desktopNavLinkClass(true)}>
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
                    className="btn-primary rounded-full px-5 py-2 text-base tracking-wide shadow-sm transition-all hover:shadow-md"
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
                  <span className="btn-neutral absolute -right-2 -top-2 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm">
                    {cartQuantity}
                  </span>
                )}
              </button>

              {/* Desktop Dropdown */}
              {cartOpen && (
                <div className="surface-card absolute right-0 top-full z-50 mt-2 w-72 rounded-xl p-5 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-2">
                    <h3 className="text-lg font-bold text-text">Your Cart</h3>
                    {cart.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Clear your entire cart?')) {
                            clearCart();
                          }
                        }}
                        className="link-danger text-xs"
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
                            className="link-danger text-xs"
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
                        className="btn-neutral block text-center py-2.5 shadow-sm hover:shadow-md"
                      >
                        Order Now
                      </Link>
                    ) : (
                      <Link
                        to="/checkout"
                        onClick={() => setCartOpen(false)}
                        className="btn-neutral block text-center py-2.5 shadow-sm hover:shadow-md"
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
          <Link to="/" className={mobileNavLinkClass()} onClick={() => setIsOpen(false)}>
            Home
          </Link>
          <Link to="/about" className={mobileNavLinkClass()} onClick={() => setIsOpen(false)}>
            About Grane
          </Link>
          <Link to="/bake-days" className={mobileNavLinkClass()} onClick={() => setIsOpen(false)}>
            Order
          </Link>

          {isLoggedIn && !sessionLoading && (
            <Link to="/my-orders" className={mobileNavLinkClass()} onClick={() => setIsOpen(false)}>
              My Orders
            </Link>
          )}

          {/* Admin Link */}
          {isUserAdmin && !sessionLoading && (
            <Link to="/admin" className={mobileNavLinkClass(true)} onClick={() => setIsOpen(false)}>
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
                  className="btn-primary rounded-full px-5 py-2.5 text-center text-base shadow-sm transition-all"
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
        <div className="surface-card z-50 mt-6 w-full rounded-xl p-5 shadow-xl md:hidden">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-2">
            <h3 className="text-lg font-bold text-text">Your Cart</h3>
            {cart.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear your entire cart?')) {
                    clearCart();
                  }
                }}
                className="link-danger text-xs"
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
                    className="link-danger text-xs"
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
                className="btn-neutral block text-center py-2.5 shadow-sm"
              >
                Order Now
              </Link>
            ) : (
              <Link
                to="/checkout"
                onClick={() => setCartOpen(false)}
                className="btn-neutral block text-center py-2.5 shadow-sm"
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
