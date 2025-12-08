'use client';

import { useCartContext } from '@/contexts/CartContext';
import ImageCard from '@/components/publicGallery/ImageCard';

export default function CartPage() {
  const { cartItems, clearCart, getCartCount, isLoading } = useCartContext();

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading cart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        <p className="text-gray-600 mt-2">
          {getCartCount()} image{getCartCount() !== 1 ? 's' : ''} selected for face swapping
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            Browse the gallery and add images to get started with face swapping.
          </p>
          <div className="mt-6">
            <a
              href="/tags"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Browse Gallery
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart Actions */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Ready to swap?</h2>
                <p className="text-sm text-gray-500">
                  Each face swap costs 1 credit. You&apos;ll need {getCartCount()} credit{getCartCount() !== 1 ? 's' : ''} total.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={clearCart}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Cart
                </button>
                <button className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  Start Face Swap ({getCartCount()} credit{getCartCount() !== 1 ? 's' : ''})
                </button>
              </div>
            </div>
          </div>

          {/* Cart Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cartItems.map((item) => (
              <div key={item.id} className="relative">
                <ImageCard image={item} showAddToCart={true} />
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
