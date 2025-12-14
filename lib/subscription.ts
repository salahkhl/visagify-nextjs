/**
 * Subscription & Storage Logic - OnlyFaceSwap (2025 Final Model)
 *
 * Core Model: Credits Top-Up to Monthly Max
 * - Credits do NOT accumulate indefinitely
 * - On subscription renewal: credits are topped up to plan's maximum
 * - Storage overage charged in 250 MB blocks at $1/block
 */

// Plan IDs used in the system
export type PlanId = "free" | "basic" | "pro" | "ultra";
export type BillingPeriod = "monthly" | "yearly";

// Plan configuration
export interface PlanConfig {
  id: PlanId;
  name: string;
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  creditsPerMonth: number; // -1 for unlimited
  storageIncludedMB: number;
  isUnlimited: boolean;
}

// All plan configurations
export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    displayName: "Free Tier",
    monthlyPrice: 0,
    yearlyPrice: 0,
    creditsPerMonth: 16, // One-time only
    storageIncludedMB: 50,
    isUnlimited: false,
  },
  basic: {
    id: "basic",
    name: "Basic",
    displayName: "Basic Plan",
    monthlyPrice: 7.99,
    yearlyPrice: 79.99,
    creditsPerMonth: 320,
    storageIncludedMB: 250,
    isUnlimited: false,
  },
  pro: {
    id: "pro",
    name: "Popular",
    displayName: "Popular Plan",
    monthlyPrice: 13.99,
    yearlyPrice: 139.99,
    creditsPerMonth: 1800,
    storageIncludedMB: 1024, // 1 GB
    isUnlimited: false,
  },
  ultra: {
    id: "ultra",
    name: "Pro",
    displayName: "Pro Plan",
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    creditsPerMonth: -1, // Unlimited
    storageIncludedMB: 10240, // 10 GB
    isUnlimited: true,
  },
};

// Storage overage pricing
export const STORAGE_BLOCK_SIZE_MB = 250;
export const STORAGE_BLOCK_PRICE_USD = 1;

/**
 * Calculate how many credits to add using the "top-up to max" logic
 *
 * @param currentBalance - User's current credit balance
 * @param planMaxCredits - Maximum credits for the plan (-1 for unlimited)
 * @returns Number of credits to add
 */
export function calculateCreditsToAdd(
  currentBalance: number,
  planMaxCredits: number
): number {
  // Unlimited plan - add a large number of credits (effectively unlimited)
  if (planMaxCredits === -1) {
    // For unlimited plans, we add 10,000 credits each month as a "virtual unlimited"
    // This makes tracking easier while still being effectively unlimited
    return 10000;
  }

  // If user is at or above max, no credits added
  if (currentBalance >= planMaxCredits) {
    return 0;
  }

  // Top up to the maximum
  return planMaxCredits - currentBalance;
}

/**
 * Calculate storage overage charges
 *
 * @param usedStorageMB - Total storage used in MB
 * @param includedStorageMB - Storage included in plan in MB
 * @returns Object with overage details
 */
export function calculateStorageOverage(
  usedStorageMB: number,
  includedStorageMB: number
): {
  extraMB: number;
  blocksCharged: number;
  overageCharge: number;
  isOverQuota: boolean;
} {
  const extraMB = Math.max(0, usedStorageMB - includedStorageMB);

  if (extraMB === 0) {
    return {
      extraMB: 0,
      blocksCharged: 0,
      overageCharge: 0,
      isOverQuota: false,
    };
  }

  // Round up to nearest block
  const blocksCharged = Math.ceil(extraMB / STORAGE_BLOCK_SIZE_MB);
  const overageCharge = blocksCharged * STORAGE_BLOCK_PRICE_USD;

  return {
    extraMB,
    blocksCharged,
    overageCharge,
    isOverQuota: true,
  };
}

/**
 * Get plan configuration by ID
 */
export function getPlanConfig(planId: PlanId): PlanConfig {
  return PLANS[planId] || PLANS.free;
}

/**
 * Format storage size for display
 */
export function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

/**
 * Calculate the next billing estimate
 */
export function calculateNextBillingEstimate(
  planId: PlanId,
  billingPeriod: BillingPeriod,
  usedStorageMB: number
): {
  baseCost: number;
  storageOverage: number;
  total: number;
  breakdown: string;
} {
  const plan = getPlanConfig(planId);
  const baseCost =
    billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const storageCalc = calculateStorageOverage(
    usedStorageMB,
    plan.storageIncludedMB
  );

  const total = baseCost + storageCalc.overageCharge;

  let breakdown = `$${baseCost.toFixed(2)} (${plan.displayName})`;
  if (storageCalc.overageCharge > 0) {
    breakdown += ` + $${storageCalc.overageCharge.toFixed(2)} (storage overage)`;
  }

  return {
    baseCost,
    storageOverage: storageCalc.overageCharge,
    total,
    breakdown,
  };
}

/**
 * Check if user should be prompted to upgrade based on storage usage
 */
export function shouldPromptUpgrade(
  planId: PlanId,
  usedStorageMB: number,
  currentCredits: number
): {
  shouldPrompt: boolean;
  reason: "storage" | "credits" | null;
  message: string | null;
} {
  const plan = getPlanConfig(planId);

  // Check storage
  const storageUsagePercent = (usedStorageMB / plan.storageIncludedMB) * 100;
  if (storageUsagePercent >= 90) {
    return {
      shouldPrompt: true,
      reason: "storage",
      message: `Storage almost full (${formatStorage(usedStorageMB)} / ${formatStorage(plan.storageIncludedMB)}). Upgrade for more space!`,
    };
  }

  // Check credits (only for non-unlimited plans)
  if (!plan.isUnlimited && currentCredits <= 20) {
    return {
      shouldPrompt: true,
      reason: "credits",
      message: `Only ${currentCredits} credits left. Upgrade for more monthly credits!`,
    };
  }

  return {
    shouldPrompt: false,
    reason: null,
    message: null,
  };
}

/**
 * Get storage warning level
 */
export function getStorageWarningLevel(
  usedStorageMB: number,
  includedStorageMB: number
): "ok" | "warning" | "critical" | "over" {
  const usage = usedStorageMB / includedStorageMB;

  if (usage > 1) return "over";
  if (usage >= 0.9) return "critical";
  if (usage >= 0.75) return "warning";
  return "ok";
}
