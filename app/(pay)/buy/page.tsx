"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

const CREDITS_PER_IMAGE = 8;

// Standalone credit packages
const CREDIT_PACKAGES = [
  { credits: 80, price: 4.99, swaps: 10 },
  { credits: 400, price: 19.99, swaps: 50 },
  { credits: 1600, price: 49.99, swaps: 200 },
];

// Subscription plans - matching SUBSCRIPTION_AND_STORAGE_LOGIC.md
const SUBSCRIPTION_PLANS = {
  monthly: [
    {
      id: "basic",
      name: "Basic Plan",
      price: 7.99,
      description: "Perfect for casual users",
      features: [
        { text: "320 credits/month", bold: false },
        { text: "40", bold: true, suffix: " swaps" },
        { text: "250 MB", bold: true, suffix: " storage" },
        { text: "HD quality exports", bold: false },
        { text: "Email support first 30 days", bold: false },
      ],
      popular: false,
    },
    {
      id: "pro",
      name: "Popular Plan",
      price: 13.99,
      description: "Perfect for creators & professionals",
      features: [
        { text: "1,800 credits/month", bold: false },
        { text: "225", bold: true, suffix: " swaps" },
        { text: "1 GB", bold: true, suffix: " storage" },
        { text: "HD quality exports", bold: false },
        { text: "Priority support 24/7", bold: true },
      ],
      popular: true,
    },
    {
      id: "ultra",
      name: "Pro Plan",
      price: 29.99,
      description: "Perfect for power users",
      features: [
        { text: "Unlimited credits", bold: true },
        { text: "Unlimited", bold: true, suffix: " swaps" },
        { text: "10 GB", bold: true, suffix: " storage" },
        { text: "HD quality exports", bold: false },
        { text: "Priority support 24/7", bold: true },
      ],
      popular: false,
    },
  ],
  yearly: [
    {
      id: "basic",
      name: "Basic Plan",
      price: 79.99,
      monthlyEquivalent: 6.67,
      description: "Perfect for casual users",
      features: [
        { text: "320 credits/month", bold: false },
        { text: "40", bold: true, suffix: " swaps" },
        { text: "250 MB", bold: true, suffix: " storage" },
        { text: "HD quality exports", bold: false },
        { text: "Email support first 30 days", bold: false },
      ],
      popular: false,
    },
    {
      id: "pro",
      name: "Popular Plan",
      price: 139.99,
      monthlyEquivalent: 11.67,
      description: "Perfect for creators & professionals",
      features: [
        { text: "1,800 credits/month", bold: false },
        { text: "225", bold: true, suffix: " swaps" },
        { text: "1 GB", bold: true, suffix: " storage" },
        { text: "HD quality exports", bold: false },
        { text: "Priority support 24/7", bold: true },
      ],
      popular: true,
    },
    {
      id: "ultra",
      name: "Pro Plan",
      price: 299.99,
      monthlyEquivalent: 25.0,
      description: "Perfect for power users",
      features: [
        { text: "Unlimited credits", bold: true },
        { text: "Unlimited", bold: true, suffix: " swaps" },
        { text: "10 GB", bold: true, suffix: " storage" },
        { text: "HD quality exports", bold: false },
        { text: "Priority support 24/7", bold: true },
      ],
      popular: false,
    },
  ],
};

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const neededCredits = parseInt(searchParams.get("needed") || "0", 10);
  const returnUrl =
    searchParams.get("return") || "https://onlyfaceswap.com/basket";
  const userId = searchParams.get("user_id") || "";

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const neededSwaps = Math.ceil(neededCredits / CREDITS_PER_IMAGE);
  const plans = SUBSCRIPTION_PLANS[billingPeriod];

  const handlePurchaseCredits = async (packageIndex: number) => {
    setIsLoading(packageIndex);
    setError(null);

    try {
      const pkg = CREDIT_PACKAGES[packageIndex];
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits: pkg.credits,
          price: pkg.price,
          returnUrl,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(null);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setIsSubscriptionLoading(planId);
    setError(null);

    try {
      const response = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingPeriod,
          returnUrl,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Subscription checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubscriptionLoading(null);
    }
  };

  return (
    <div
      className="min-h-screen py-16 px-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0c0118 0%, #130824 50%, #0a0a14 100%)",
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #a855f7 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ec4899 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-4xl md:text-6xl font-light text-white mb-4"
            style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
          >
            Simple, straightforward pricing
          </h1>
          <p className="text-gray-400 text-lg">
            Join professionals who use Visagify to transform their content
          </p>
        </div>

        {/* Info Banner */}
        {neededCredits > 0 && (
          <div
            className="max-w-2xl mx-auto mb-12 p-5 rounded-2xl backdrop-blur-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              boxShadow: "0 8px 32px rgba(168, 85, 247, 0.1)",
            }}
          >
            <p className="text-center text-white text-lg">
              You need{" "}
              <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {neededCredits} credits
              </span>{" "}
              ({neededSwaps} swap{neededSwaps !== 1 ? "s" : ""}) to complete
              your basket
            </p>
          </div>
        )}

        {/* ==================== CREDIT PACKAGES ==================== */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
              Buy Credits
            </h2>
            <p className="text-gray-400">One-time purchase, never expires</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {CREDIT_PACKAGES.map((pkg, index) => {
              const coversNeed = pkg.credits >= neededCredits;
              const isPopular = index === 1;

              return (
                <div
                  key={pkg.credits}
                  className={`relative rounded-3xl p-[1px] transition-all duration-300 hover:scale-[1.02] ${
                    !coversNeed && neededCredits > 0 ? "opacity-50" : ""
                  }`}
                  style={{
                    background: isPopular
                      ? "linear-gradient(180deg, rgba(168, 85, 247, 0.5) 0%, rgba(236, 72, 153, 0.5) 100%)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  }}
                >
                  {/* Card Inner */}
                  <div
                    className="rounded-3xl p-6 h-full"
                    style={{
                      background: isPopular
                        ? "linear-gradient(180deg, rgba(30, 15, 50, 0.95) 0%, rgba(20, 10, 35, 0.98) 100%)"
                        : "linear-gradient(180deg, rgba(25, 20, 40, 0.9) 0%, rgba(15, 12, 25, 0.95) 100%)",
                      boxShadow: isPopular
                        ? "0 20px 60px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
                        : "0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
                        style={{
                          background:
                            "linear-gradient(90deg, #a855f7 0%, #ec4899 100%)",
                          boxShadow: "0 4px 15px rgba(168, 85, 247, 0.4)",
                        }}
                      >
                        Popular
                      </div>
                    )}

                    {/* Covers Need Badge */}
                    {neededCredits > 0 && coversNeed && (
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 rounded-full text-xs font-bold text-white shadow-lg">
                        ✓ Covers
                      </div>
                    )}

                    <div className="text-center mb-6 pt-2">
                      <div
                        className="text-5xl font-bold mb-2"
                        style={{
                          background: isPopular
                            ? "linear-gradient(180deg, #fff 0%, #e879f9 100%)"
                            : "linear-gradient(180deg, #fff 0%, #a1a1aa 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        ${pkg.price}
                      </div>
                      <div className="text-gray-500 text-sm">
                        one-time payment
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3">
                        <CheckIcon
                          className={
                            isPopular ? "text-pink-400" : "text-gray-500"
                          }
                        />
                        <span className="text-gray-300">
                          {pkg.credits} credits
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckIcon
                          className={
                            isPopular ? "text-pink-400" : "text-gray-500"
                          }
                        />
                        <span className="text-gray-300">
                          {pkg.swaps} face swaps
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckIcon
                          className={
                            isPopular ? "text-pink-400" : "text-gray-500"
                          }
                        />
                        <span className="text-gray-300">Never expires</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckIcon
                          className={
                            isPopular ? "text-pink-400" : "text-gray-500"
                          }
                        />
                        <span className="text-gray-300">HD quality</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchaseCredits(index)}
                      disabled={isLoading !== null}
                      className="w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 disabled:opacity-50"
                      style={{
                        background: isPopular
                          ? "linear-gradient(90deg, #a855f7 0%, #ec4899 100%)"
                          : "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                        border: isPopular
                          ? "none"
                          : "1px solid rgba(255,255,255,0.1)",
                        boxShadow: isPopular
                          ? "0 8px 30px rgba(168, 85, 247, 0.4)"
                          : "none",
                      }}
                    >
                      {isLoading === index ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                          >
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
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        "Buy Now"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================== SUBSCRIPTION PLANS ==================== */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              Subscription Plans
            </h2>

            {/* Billing Toggle */}
            <div
              className="inline-flex items-center gap-3 p-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingPeriod === "monthly"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                style={
                  billingPeriod === "monthly"
                    ? {
                        background:
                          "linear-gradient(90deg, #a855f7 0%, #ec4899 100%)",
                        boxShadow: "0 4px 15px rgba(168, 85, 247, 0.3)",
                      }
                    : {}
                }
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingPeriod === "yearly"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                style={
                  billingPeriod === "yearly"
                    ? {
                        background:
                          "linear-gradient(90deg, #a855f7 0%, #ec4899 100%)",
                        boxShadow: "0 4px 15px rgba(168, 85, 247, 0.3)",
                      }
                    : {}
                }
              >
                Yearly
              </button>
              <span className="text-sm text-gray-400 ml-2">
                Save up to 20% by paying yearly
              </span>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-[1px] transition-all duration-300 hover:scale-[1.02] ${
                  plan.popular ? "md:-mt-4 md:mb-4" : ""
                }`}
                style={{
                  background: plan.popular
                    ? "linear-gradient(180deg, rgba(168, 85, 247, 0.6) 0%, rgba(236, 72, 153, 0.4) 100%)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                }}
              >
                <div
                  className="rounded-3xl p-6 h-full relative overflow-hidden"
                  style={{
                    background: plan.popular
                      ? "linear-gradient(180deg, rgba(35, 20, 60, 0.95) 0%, rgba(20, 12, 35, 0.98) 100%)"
                      : "linear-gradient(180deg, rgba(20, 18, 35, 0.9) 0%, rgba(12, 10, 20, 0.95) 100%)",
                    boxShadow: plan.popular
                      ? "0 25px 80px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
                      : "0 10px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
                  }}
                >
                  {/* Glow effect for popular */}
                  {plan.popular && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-[80px] opacity-30 pointer-events-none"
                      style={{ background: "#a855f7" }}
                    />
                  )}

                  {/* Popular Badge */}
                  {plan.popular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-semibold text-white z-10"
                      style={{
                        background:
                          "linear-gradient(90deg, #a855f7 0%, #ec4899 100%)",
                        boxShadow: "0 4px 20px rgba(168, 85, 247, 0.5)",
                      }}
                    >
                      Popular Plan
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="text-sm text-gray-400 mb-3">
                      {plan.name}
                    </div>

                    <div className="mb-2">
                      <span
                        className="text-5xl font-bold"
                        style={{
                          background: plan.popular
                            ? "linear-gradient(180deg, #fff 0%, #f0abfc 100%)"
                            : "linear-gradient(180deg, #fff 0%, #a1a1aa 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        ${plan.price}
                      </span>
                      <span className="text-gray-500">
                        /{billingPeriod === "monthly" ? "month" : "year"}
                      </span>
                    </div>

                    {"monthlyEquivalent" in plan &&
                      billingPeriod === "yearly" && (
                        <div className="text-sm text-gray-500 mb-4">
                          ${plan.monthlyEquivalent}/month
                        </div>
                      )}

                    <p className="text-gray-400 text-sm mb-6">
                      {plan.description}
                    </p>

                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <CheckIcon
                            className={
                              plan.popular ? "text-pink-400" : "text-gray-500"
                            }
                          />
                          <span className="text-gray-300 text-sm">
                            {feature.bold ? (
                              <>
                                <strong className="text-white">
                                  {feature.text}
                                </strong>
                                {feature.suffix}
                              </>
                            ) : (
                              feature.text
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isSubscriptionLoading !== null}
                      className="w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 disabled:opacity-50"
                      style={{
                        background: plan.popular
                          ? "linear-gradient(90deg, #a855f7 0%, #ec4899 100%)"
                          : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                        border: plan.popular
                          ? "none"
                          : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: plan.popular
                          ? "0 8px 30px rgba(168, 85, 247, 0.4)"
                          : "none",
                      }}
                    >
                      {isSubscriptionLoading === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                          >
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
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Processing...
                        </span>
                      ) : plan.popular ? (
                        "Start 7-days Free Trial"
                      ) : (
                        "Start Free Trial"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View Full Plan Comparison Link */}
          <div className="text-center mt-8">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              View Full Plan Comparison
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="max-w-md mx-auto mb-8 p-4 rounded-2xl text-center"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Free Tier Warning */}
        <div
          className="max-w-3xl mx-auto p-5 rounded-2xl mb-12"
          style={{
            background:
              "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(245, 158, 11, 0.2)" }}
            >
              <svg
                className="w-5 h-5 text-amber-500"
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
            <div>
              <p className="font-semibold text-amber-400 mb-1">
                Free Tier: 16 credits (2 swaps) + 30 days storage
              </p>
              <p className="text-amber-400/70 text-sm">
                Free tier results include watermarks. Purchase credits or
                subscribe to remove watermarks and store your swaps forever.
              </p>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500">
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
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-sm">SSL Secured</span>
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
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-sm">Safe & Private</span>
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
                strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span className="text-sm">Powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            background:
              "linear-gradient(180deg, #0c0118 0%, #130824 50%, #0a0a14 100%)",
          }}
        >
          <div
            className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full"
            style={{ borderColor: "#a855f7", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
