"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const returnUrl =
    searchParams.get("return") || "https://onlyfaceswap.com/basket";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [credits, setCredits] = useState<number>(0);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setCredits(data.credits);
          setStatus("success");

          // Start countdown
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                // Redirect through Visagify which then redirects to OnlyFaceSwap
                // This adds an extra hop to avoid Stripe seeing OnlyFaceSwap as referrer
                window.location.href = `/payment/redirect?to=${encodeURIComponent(returnUrl)}&credits=${data.credits}`;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(timer);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
      }
    };

    verifyPayment();
  }, [sessionId, returnUrl]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4" />
        <p className="text-white text-lg">Verifying your payment...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-400 mb-6">
          We couldn&apos;t verify your payment. Please contact support.
        </p>
        <a
          href={returnUrl}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
        >
          Return to site
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Success animation */}
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-pulse">
        <svg
          className="w-10 h-10 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">
        Payment Successful!
      </h1>

      <p className="text-gray-400 mb-6 text-center">
        <span className="text-purple-400 font-bold">{credits} credits</span>{" "}
        have been added to your account
      </p>

      {/* Countdown */}
      <div className="flex items-center gap-2 text-gray-400 mb-8">
        <svg
          className="w-5 h-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Redirecting in {countdown} seconds...</span>
      </div>

      <a
        href={`/payment/redirect?to=${encodeURIComponent(returnUrl)}&credits=${credits}`}
        className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-bold transition-all shadow-lg shadow-purple-500/25"
      >
        Continue Now
      </a>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}




