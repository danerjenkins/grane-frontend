import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
  product_id: string;
  name: string;
  price: number; // price in cents
  quantity: number;
}

export interface SelectedBakeDay {
  id: string;
  date: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (product_id: string) => void;
  updateQuantity: (product_id: string, qty: number) => void;
  clearCart: () => void;

  selectedBakeDay: SelectedBakeDay | null;
  setSelectedBakeDay: (day: SelectedBakeDay | null) => void;

  cartQuantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBakeDay, setSelectedBakeDay] = useState<SelectedBakeDay | null>(null);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.product_id === item.product_id);

      if (existing) {
        return prev.map((p) =>
          p.product_id === item.product_id ? { ...p, quantity: p.quantity + item.quantity } : p
        );
      }

      return [...prev, item];
    });
  };

  const removeFromCart = (product_id: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== product_id));
  };

  const updateQuantity = (product_id: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) => (item.product_id === product_id ? { ...item, quantity: qty } : item))
    );
  };

  const clearCart = () => setCart([]);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
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
