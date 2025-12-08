"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

const CREDITS_PER_IMAGE = 8;

// Pricing tiers - price per credit decreases with volume
const PRICING_TIERS = [
  {
    credits: 40,
    price: 4.99,
    perCredit: 0.125,
    label: "5 Swaps",
    popular: false,
  },
  {
    credits: 80,
    price: 7.99,
    perCredit: 0.1,
    label: "10 Swaps",
    popular: true,
  },
  {
    credits: 200,
    price: 14.99,
    perCredit: 0.075,
    label: "25 Swaps",
    popular: false,
  },
  {
    credits: 400,
    price: 24.99,
    perCredit: 0.0625,
    label: "50 Swaps",
    popular: false,
  },
];

function PaymentContent() {
  const searchParams = useSearchParams();
  const neededCredits = parseInt(searchParams.get("needed") || "0", 10);
  const returnUrl =
    searchParams.get("return") || "https://onlyfaceswap.com/basket";

  const [selectedTier, setSelectedTier] = useState<number | null>(() => {
    // Auto-select the best tier based on needed credits
    if (neededCredits > 0) {
      for (let i = PRICING_TIERS.length - 1; i >= 0; i--) {
        if (PRICING_TIERS[i].credits >= neededCredits) {
          // Find the smallest package that covers the need
          let bestIndex = i;
          for (let j = 0; j <= i; j++) {
            if (PRICING_TIERS[j].credits >= neededCredits) {
              bestIndex = j;
              break;
            }
          }
          return bestIndex;
        }
      }
      return PRICING_TIERS.length - 1; // Largest if none covers
    }
    return 1; // Default to popular tier
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const neededSwaps = Math.ceil(neededCredits / CREDITS_PER_IMAGE);

  const handlePurchase = async () => {
    if (selectedTier === null) return;

    setIsLoading(true);
    setError(null);

    try {
      const tier = PRICING_TIERS[selectedTier];
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits: tier.credits,
          price: tier.price,
          returnUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Visagify
          </span>
        </h1>
        <p className="text-gray-400 text-sm">AI Face Swapping Credits</p>
      </div>

      {/* Info Banner */}
      {neededCredits > 0 && (
        <div className="w-full max-w-2xl mb-6 p-4 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <p className="text-center text-white">
            You need{" "}
            <span className="font-bold text-purple-300">
              {neededCredits} credits
            </span>{" "}
            ({neededSwaps} swap{neededSwaps !== 1 ? "s" : ""}) to complete your
            basket
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRICING_TIERS.map((tier, index) => {
          const isSelected = selectedTier === index;
          const swaps = tier.credits / CREDITS_PER_IMAGE;
          const coversNeed = tier.credits >= neededCredits;

          return (
            <button
              key={tier.credits}
              onClick={() => setSelectedTier(index)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200
                ${
                  isSelected
                    ? "border-purple-500 bg-purple-500/20 scale-105"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }
                ${!coversNeed && neededCredits > 0 ? "opacity-50" : ""}
              `}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold text-white">
                  POPULAR
                </div>
              )}

              {neededCredits > 0 && coversNeed && (
                <div className="absolute -top-3 right-2 px-2 py-1 bg-green-500/80 rounded-full text-xs font-bold text-white">
                  ✓ Covers
                </div>
              )}

              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  ${tier.price}
                </div>
                <div className="text-gray-400 text-sm mb-4">{tier.label}</div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Credits:</span>
                    <span className="font-medium">{tier.credits}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Swaps:</span>
                    <span className="font-medium">{swaps}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Per swap:</span>
                    <span className="font-medium">
                      ${(tier.price / swaps).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-500 rotate-45" />
              )}
            </button>
          );
        })}
      </div>

      {/* Purchase Button */}
      <div className="mt-8 w-full max-w-md">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={selectedTier === null || isLoading}
          className={`
            w-full py-4 px-6 rounded-xl font-bold text-lg transition-all
            ${
              selectedTier !== null && !isLoading
                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : selectedTier !== null ? (
            `Buy ${PRICING_TIERS[selectedTier].credits} Credits for $${PRICING_TIERS[selectedTier].price}`
          ) : (
            "Select a package"
          )}
        </button>

        <p className="mt-4 text-center text-gray-500 text-xs">
          Secure payment powered by Stripe. Credits never expire.
        </p>
      </div>

      {/* Security badges */}
      <div className="mt-8 flex items-center gap-6 text-gray-500">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-xs">SSL Secured</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span className="text-xs">Safe & Private</span>
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}

