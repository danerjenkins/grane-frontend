import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// Storage Constants
// ============================================================================
const CART_STORAGE_KEY = 'grane_cart_v1';
const CART_VERSION = 2;
const CART_EXPIRY_DAYS = 7; // Cart items expire after 7 days

export interface CartItem {
  product_id: string;
  name: string;
  price: number; // price in cents
  quantity: number;
  addedAt?: string; // ISO timestamp when item was added
}

export interface SelectedBakeDay {
  id: string;
  date: string;
}

// ============================================================================
// Persisted Cart Shape
// ============================================================================
interface PersistedCart {
  version: number;
  updatedAt: string;
  cart: CartItem[];
  selectedBakeDay: SelectedBakeDay | null;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (product_id: string) => void;
  updateQuantity: (product_id: string, qty: number) => void;
  clearCart: () => void;
  clearExpiredItems: () => void;
  validateBakeDay: (availableBakeDays: { id: string; date: string }[]) => void;
  removeUnavailableProducts: (availableProductIds: string[]) => void;

  selectedBakeDay: SelectedBakeDay | null;
  setSelectedBakeDay: (day: SelectedBakeDay | null) => void;

  cartQuantity: number;
}

// ============================================================================
// Helper Functions for Persistence
// ============================================================================

/**
 * Validates and parses persisted cart from localStorage.
 * Ensures all items have positive integer quantities and valid structure.
 * Returns defaults if anything is invalid.
 *
 * Note: Persistence does NOT reserve inventory. Carts are first-come-first-serve
 * at checkout/server time, ensuring accurate availability for all users.
 */
function loadPersistedCart(): { cart: CartItem[]; selectedBakeDay: SelectedBakeDay | null } {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { cart: [], selectedBakeDay: null };
    }

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      return { cart: [], selectedBakeDay: null };
    }

    const persisted = parsed as PersistedCart;

    // Check version
    if (persisted.version < 1 || persisted.version > CART_VERSION) {
      return { cart: [], selectedBakeDay: null };
    }

    // Check for expired cart
    const now = new Date();
    const updatedAt = new Date(persisted.updatedAt);
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > CART_EXPIRY_DAYS) {
      return { cart: [], selectedBakeDay: null };
    }

    // Validate and filter cart items
    const validCart: CartItem[] = [];
    if (Array.isArray(persisted.cart)) {
      for (const item of persisted.cart) {
        // Validate required fields exist and have correct types
        if (
          typeof item.product_id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.price === 'number' &&
          typeof item.quantity === 'number'
        ) {
          // Ensure quantity is a positive integer
          const qty = Math.floor(item.quantity);
          if (qty > 0) {
            validCart.push({
              product_id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: qty,
              addedAt: item.addedAt || new Date().toISOString(),
            });
          }
        }
      }
    }

    // Validate selectedBakeDay
    let validBakeDay: SelectedBakeDay | null = null;
    if (persisted.selectedBakeDay !== null && persisted.selectedBakeDay !== undefined) {
      const bakeDay = persisted.selectedBakeDay as SelectedBakeDay;
      if (typeof bakeDay.id === 'string' && typeof bakeDay.date === 'string') {
        validBakeDay = bakeDay;
      }
    }

    return { cart: validCart, selectedBakeDay: validBakeDay };
  } catch (err) {
    // Silent fail: return defaults on any parse/validation error
    return { cart: [], selectedBakeDay: null };
  }
}

/**
 * Persists cart state to localStorage with current timestamp.
 */
function savePersistedCart(cart: CartItem[], selectedBakeDay: SelectedBakeDay | null): void {
  try {
    const payload: PersistedCart = {
      version: CART_VERSION,
      updatedAt: new Date().toISOString(),
      cart,
      selectedBakeDay,
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Silent fail: if localStorage is full or unavailable, continue gracefully
    console.warn('Failed to persist cart:', err);
  }
}

/**
 * Clears cart from localStorage.
 */
function clearPersistedCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear cart:', err);
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  // Load persisted state once on mount
  const initialData = loadPersistedCart();

  const [cart, setCart] = useState<CartItem[]>(() => initialData.cart);
  const [selectedBakeDay, setSelectedBakeDay] = useState<SelectedBakeDay | null>(
    () => initialData.selectedBakeDay
  );

  // Track if component is mounted to avoid state updates after unmount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // ========================================================================
  // Persist cart changes to localStorage (with debounce)
  // ========================================================================
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => {
      savePersistedCart(cart, selectedBakeDay);
    }, 200); // Debounce 200ms to avoid hammering storage on rapid changes

    return () => clearTimeout(timer);
  }, [cart, selectedBakeDay, isMounted]);

  // ========================================================================
  // Cross-tab / Cross-window Sync
  // ========================================================================
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && isMounted) {
        const { cart: newCart, selectedBakeDay: newBakeDay } = loadPersistedCart();

        // Only update if meaningfully different (avoid redundant setState)
        const cartChanged = JSON.stringify(cart) !== JSON.stringify(newCart);
        const bakeDayChanged = JSON.stringify(selectedBakeDay) !== JSON.stringify(newBakeDay);

        if (cartChanged) {
          setCart(newCart);
        }
        if (bakeDayChanged) {
          setSelectedBakeDay(newBakeDay);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [cart, selectedBakeDay, isMounted]);

  // ========================================================================
  // Back/Forward Cache Support (important for "back from Stripe checkout")
  // ========================================================================
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && isMounted) {
        // Browser restored from back/forward cache
        const { cart: newCart, selectedBakeDay: newBakeDay } = loadPersistedCart();
        setCart(newCart);
        setSelectedBakeDay(newBakeDay);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [isMounted]);

  // ========================================================================
  // Cart Operations
  // ========================================================================

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.product_id === item.product_id);

      if (existing) {
        return prev.map((p) =>
          p.product_id === item.product_id
            ? {
                ...p,
                quantity: p.quantity + item.quantity,
                addedAt: p.addedAt || new Date().toISOString(),
              }
            : p
        );
      }

      return [...prev, { ...item, addedAt: item.addedAt || new Date().toISOString() }];
    });
  };

  const removeFromCart = (product_id: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== product_id));
  };

  /**
   * Updates quantity for a product.
   * If qty <= 0, removes the item (instead of storing invalid quantity).
   * Clamps to positive integers only.
   */
  const updateQuantity = (product_id: string, qty: number) => {
    setCart((prev) => {
      const validQty = Math.max(0, Math.floor(qty));

      if (validQty <= 0) {
        // Remove item if quantity becomes zero or invalid
        return prev.filter((item) => item.product_id !== product_id);
      }

      return prev.map((item) =>
        item.product_id === product_id ? { ...item, quantity: validQty } : item
      );
    });
  };

  /**
   * Clears cart and selected bake day, and removes persisted data.
   */
  const clearCart = () => {
    setCart([]);
    setSelectedBakeDay(null);
    clearPersistedCart();
  };

  /**
   * Clears items that were added more than CART_EXPIRY_DAYS ago
   */
  const clearExpiredItems = () => {
    const now = new Date();
    setCart((prev) => {
      const filtered = prev.filter((item) => {
        if (!item.addedAt) return true; // Keep items without timestamp
        const addedDate = new Date(item.addedAt);
        const daysSinceAdded = (now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceAdded <= CART_EXPIRY_DAYS;
      });

      if (filtered.length < prev.length) {
        console.log('Cleared expired cart items');
      }

      return filtered;
    });
  };

  /**
   * Validates that the selected bake day still exists in available bake days
   * Clears cart if the selected bake day is no longer available
   */
  const validateBakeDay = (availableBakeDays: { id: string; date: string }[]) => {
    if (!selectedBakeDay) return;

    const isStillAvailable = availableBakeDays.some((bd) => bd.id === selectedBakeDay.id);

    if (!isStillAvailable) {
      console.log('Selected bake day is no longer available, clearing cart');
      clearCart();
    }
  };

  /**
   * Removes items from cart if their products are no longer available
   */
  const removeUnavailableProducts = (availableProductIds: string[]) => {
    setCart((prev) => {
      const filtered = prev.filter((item) => availableProductIds.includes(item.product_id));

      if (filtered.length < prev.length) {
        console.log('Removed unavailable products from cart');
      }

      return filtered;
    });
  };

  // Clear expired items on mount and periodically
  useEffect(() => {
    clearExpiredItems();

    // Check for expired items every hour
    const interval = setInterval(
      () => {
        clearExpiredItems();
      },
      1000 * 60 * 60
    );

    return () => clearInterval(interval);
  }, []);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearExpiredItems,
        validateBakeDay,
        removeUnavailableProducts,
        selectedBakeDay,
        setSelectedBakeDay,
        cartQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return ctx;
};
