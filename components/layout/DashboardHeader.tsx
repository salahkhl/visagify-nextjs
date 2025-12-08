'use client';

import { useCartContext } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardHeader() {
  const { getCartCount } = useCartContext();
  const cartCount = getCartCount();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="bg-black border-b border-bright-lavender-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-semibold text-bright-lavender-400">
              Visagify
            </a>
            <span className="ml-2 text-sm text-bright-lavender-300">Dashboard</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <a href="/tags" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors">
              Gallery
            </a>
            <a href="/dashboard/faces" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors">
              Faces
            </a>
            <a href="/dashboard/cart" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors relative">
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-bright-lavender-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </a>
            <a href="/dashboard/swaps" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors">
              Swaps
            </a>
            <a href="/dashboard/credits" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors">
              Credits
            </a>
            
            <button
              onClick={handleSignOut}
              className="text-bright-lavender-300 hover:text-bright-lavender-200 text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}


