"use client";

import { getPlanConfig, formatStorage, type PlanId } from "@/lib/subscription";

interface SubscriptionCardProps {
  planId: PlanId;
  billingPeriod: "monthly" | "yearly";
  status: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  creditsRemaining: number;
  onManage?: () => void;
  onUpgrade?: () => void;
}

export function SubscriptionCard({
  planId,
  billingPeriod,
  status,
  currentPeriodEnd,
  trialEnd,
  creditsRemaining,
  onManage,
  onUpgrade,
}: SubscriptionCardProps) {
  const plan = getPlanConfig(planId);
  const isPopular = planId === "pro";
  const isTrial = status === "trialing";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className={`relative rounded-2xl p-[1px] ${
        isPopular
          ? "bg-gradient-to-b from-purple-500/50 to-pink-500/50"
          : "bg-gradient-to-b from-white/10 to-white/5"
      }`}
    >
      <div
        className={`rounded-2xl p-6 ${
          isPopular
            ? "bg-gradient-to-b from-purple-900/40 to-gray-900/90"
            : "bg-gray-900/90"
        }`}
      >
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
            Most Popular
          </div>
        )}

        {/* Trial Badge */}
        {isTrial && (
          <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white bg-emerald-500 shadow-lg">
            Trial Active
          </div>
        )}

        {/* Header */}
        <div className="mb-4 pt-2">
          <h3 className="text-lg font-semibold text-white">
            {plan.displayName}
          </h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-white">
              $
              {billingPeriod === "monthly"
                ? plan.monthlyPrice
                : plan.yearlyPrice}
            </span>
            <span className="text-gray-400">
              /{billingPeriod === "monthly" ? "month" : "year"}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-2 h-2 rounded-full ${
              status === "active" || status === "trialing"
                ? "bg-emerald-500"
                : status === "past_due"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-400 capitalize">
            {status === "trialing" ? "Trial Period" : status}
          </span>
        </div>

        {/* Plan Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Credits remaining</span>
            <span className="text-white font-medium">
              {plan.isUnlimited
                ? "Unlimited"
                : creditsRemaining.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Credits per month</span>
            <span className="text-white font-medium">
              {plan.isUnlimited
                ? "Unlimited"
                : plan.creditsPerMonth.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Storage included</span>
            <span className="text-white font-medium">
              {formatStorage(plan.storageIncludedMB)}
            </span>
          </div>
          {isTrial && trialEnd && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Trial ends</span>
              <span className="text-emerald-400 font-medium">
                {formatDate(trialEnd)}
              </span>
            </div>
          )}
          {!isTrial && currentPeriodEnd && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Next billing</span>
              <span className="text-white font-medium">
                {formatDate(currentPeriodEnd)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onManage && (
            <button
              onClick={onManage}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              Manage
            </button>
          )}
          {onUpgrade && planId !== "ultra" && (
            <button
              onClick={onUpgrade}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
