'use client';

import { supabase } from '@/lib/supabaseClient';

export default function AdminHeader() {
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
            <span className="ml-2 text-sm text-red-400">Admin</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <a href="/tags" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors">
              Gallery
            </a>
            <a href="/dashboard/faces" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors">
              Dashboard
            </a>
            <a href="/admin/payments" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors">
              Payments
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


