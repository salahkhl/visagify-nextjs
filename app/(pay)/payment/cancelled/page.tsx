"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CancelledContent() {
  const searchParams = useSearchParams();
  const returnUrl =
    searchParams.get("return") || "https://onlyfaceswap.com/basket";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
      <p className="text-gray-400 mb-6 text-center max-w-md">
        Your payment was cancelled. No charges were made. You can try again
        whenever you&apos;re ready.
      </p>

      <div className="flex gap-4">
        <a
          href={returnUrl}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
        >
          Return to site
        </a>
        <a
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-bold transition-all"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}

export default function CancelledPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <CancelledContent />
    </Suspense>
  );
}




