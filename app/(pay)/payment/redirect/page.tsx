"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function RedirectContent() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("to") || "https://onlyfaceswap.com/basket";
  const credits = searchParams.get("credits") || "0";

  useEffect(() => {
    // Build the final redirect URL with credits info
    const url = new URL(targetUrl);
    url.searchParams.set("credits_added", credits);
    url.searchParams.set("payment", "success");

    // Use a short timeout to ensure any tracking/analytics have time to load
    const timer = setTimeout(() => {
      window.location.href = url.toString();
    }, 500);

    return () => clearTimeout(timer);
  }, [targetUrl, credits]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4" />
      <p className="text-white text-lg">Redirecting you back...</p>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  );
}

