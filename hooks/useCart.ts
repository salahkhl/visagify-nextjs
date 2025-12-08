'use client';

import { useState, useEffect } from 'react';
import { GalleryImage } from '@/lib/mockData';

export interface CartItem extends GalleryImage {
  addedAt: string;
}

const CART_STORAGE_KEY = 'visagify_cart';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cartItems, isLoading]);

  const addToCart = (image: GalleryImage) => {
    const cartItem: CartItem = {
      ...image,
      addedAt: new Date().toISOString(),
    };

    setCartItems(prev => {
      // Check if item already exists
      const exists = prev.some(item => item.id === image.id);
      if (exists) {
        return prev; // Don't add duplicates
      }
      return [...prev, cartItem];
    });
  };

  const removeFromCart = (imageId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== imageId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (imageId: string) => {
    return cartItems.some(item => item.id === imageId);
  };

  const getCartCount = () => {
    return cartItems.length;
  };

  const toggleCartItem = (image: GalleryImage) => {
    if (isInCart(image.id)) {
      removeFromCart(image.id);
    } else {
      addToCart(image);
    }
  };

  return {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    getCartCount,
    toggleCartItem,
  };
}


