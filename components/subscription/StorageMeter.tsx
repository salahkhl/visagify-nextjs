"use client";

import {
  formatStorage,
  getStorageWarningLevel,
  calculateStorageOverage,
} from "@/lib/subscription";

interface StorageMeterProps {
  usedMB: number;
  includedMB: number;
  planName: string;
  showUpgradePrompt?: boolean;
  onUpgrade?: () => void;
}

export function StorageMeter({
  usedMB,
  includedMB,
  planName,
  showUpgradePrompt = true,
  onUpgrade,
}: StorageMeterProps) {
  const warningLevel = getStorageWarningLevel(usedMB, includedMB);
  const overage = calculateStorageOverage(usedMB, includedMB);
  const usagePercent = Math.min((usedMB / includedMB) * 100, 100);
  const displayPercent = Math.min((usedMB / includedMB) * 100, 150); // Allow overflow visual

  const getBarColor = () => {
    switch (warningLevel) {
      case "over":
        return "bg-red-500";
      case "critical":
        return "bg-orange-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-gradient-to-r from-purple-500 to-pink-500";
    }
  };

  const getBorderColor = () => {
    switch (warningLevel) {
      case "over":
        return "border-red-500/30";
      case "critical":
        return "border-orange-500/30";
      case "warning":
        return "border-yellow-500/30";
      default:
        return "border-purple-500/20";
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Storage Usage</span>
        <span className="text-sm font-medium text-white">
          {formatStorage(usedMB)} / {formatStorage(includedMB)}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className={`relative h-3 rounded-full overflow-hidden bg-gray-800 border ${getBorderColor()}`}
      >
        <div
          className={`absolute h-full rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${Math.min(displayPercent, 100)}%` }}
        />
        {/* Overflow indicator */}
        {displayPercent > 100 && (
          <div
            className="absolute h-full bg-red-600/50 animate-pulse"
            style={{
              left: "100%",
              width: `${Math.min(displayPercent - 100, 50)}%`,
            }}
          />
        )}
      </div>

      {/* Plan info */}
      <div className="text-xs text-gray-500">
        {usagePercent.toFixed(0)}% of {planName} storage used
      </div>

      {/* Warning Banner */}
      {warningLevel === "over" && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-red-400"
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
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">
                You&apos;re using {formatStorage(usedMB)} — that&apos;s +$
                {overage.overageCharge} this month
              </p>
              {showUpgradePrompt && (
                <p className="text-xs text-red-400/70 mt-1">
                  Upgrade to Pro for 10 GB and save!
                </p>
              )}
            </div>
            {showUpgradePrompt && onUpgrade && (
              <button
                onClick={onUpgrade}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      )}

      {/* Warning - Almost full */}
      {warningLevel === "critical" && (
        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-orange-400 shrink-0"
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
            <p className="text-sm text-orange-400">
              Storage almost full ({formatStorage(usedMB)} /{" "}
              {formatStorage(includedMB)}). Upgrade for more space!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
