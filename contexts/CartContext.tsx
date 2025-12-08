'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCart } from '@/hooks/useCart';
import { GalleryImage } from '@/lib/mockData';

interface CartContextType {
  cartItems: Array<GalleryImage & { addedAt: string }>;
  isLoading: boolean;
  addToCart: (image: GalleryImage) => void;
  removeFromCart: (imageId: string) => void;
  clearCart: () => void;
  isInCart: (imageId: string) => boolean;
  getCartCount: () => number;
  toggleCartItem: (image: GalleryImage) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const cartState = useCart();

  return (
    <CartContext.Provider value={cartState}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}


