"use client";

import {
  calculateNextBillingEstimate,
  formatStorage,
  type PlanId,
  type BillingPeriod,
} from "@/lib/subscription";

interface BillingPreviewProps {
  planId: PlanId;
  billingPeriod: BillingPeriod;
  storageUsedMB: number;
  storageIncludedMB: number;
  nextBillingDate?: string;
}

export function BillingPreview({
  planId,
  billingPeriod,
  storageUsedMB,
  storageIncludedMB,
  nextBillingDate,
}: BillingPreviewProps) {
  const estimate = calculateNextBillingEstimate(
    planId,
    billingPeriod,
    storageUsedMB
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasOverage = estimate.storageOverage > 0;

  return (
    <div
      className={`rounded-2xl p-5 ${
        hasOverage
          ? "bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20"
          : "bg-gray-900/50 border border-white/5"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-400">Next Billing</h4>
        <span className="text-sm text-gray-500">
          {formatDate(nextBillingDate)}
        </span>
      </div>

      {/* Total */}
      <div className="mb-4">
        <span
          className={`text-3xl font-bold ${hasOverage ? "text-orange-400" : "text-white"}`}
        >
          ${estimate.total.toFixed(2)}
        </span>
        <span className="text-gray-400 text-sm ml-2">
          {billingPeriod === "monthly" ? "/month" : "/year"}
        </span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Base subscription</span>
          <span className="text-white">${estimate.baseCost.toFixed(2)}</span>
        </div>

        {hasOverage && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-400 flex items-center gap-1">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Storage overage
              </span>
              <span className="text-orange-400">
                +${estimate.storageOverage.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Using {formatStorage(storageUsedMB)} of{" "}
              {formatStorage(storageIncludedMB)} included
            </div>
          </>
        )}
      </div>

      {/* Upgrade suggestion if overage */}
      {hasOverage && (
        <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <p className="text-xs text-purple-300">
            💡 Upgrade to a higher plan to avoid storage charges and get more
            credits!
          </p>
        </div>
      )}
    </div>
  );
}
