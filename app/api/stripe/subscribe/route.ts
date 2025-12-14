import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";

// Stripe Price IDs for subscription plans
// These should match the Price IDs from your Stripe Dashboard
const SUBSCRIPTION_PRICE_IDS = {
  monthly: {
    basic: process.env.STRIPE_PRICE_BASIC_MONTHLY || "",
    pro: process.env.STRIPE_PRICE_PRO_MONTHLY || "", // Popular Plan in Stripe
    ultra: process.env.STRIPE_PRICE_ULTRA_MONTHLY || "", // Pro Plan in Stripe
  },
  yearly: {
    basic: process.env.STRIPE_PRICE_BASIC_YEARLY || "",
    pro: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    ultra: process.env.STRIPE_PRICE_ULTRA_YEARLY || "",
  },
};

// Types
type BillingPeriod = "monthly" | "yearly";
type PlanId = "basic" | "pro" | "ultra";

// Credits per plan per month
const PLAN_CREDITS: Record<PlanId, number> = {
  basic: 320,
  pro: 1800,
  ultra: -1, // Unlimited
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { returnUrl, userId } = body;
    const planId = body.planId as string;
    const billingPeriod = body.billingPeriod as string;

    // Validate the request
    if (!planId || !billingPeriod) {
      return NextResponse.json(
        { error: "Missing required fields: planId and billingPeriod" },
        { status: 400 }
      );
    }

    // Validate billing period
    if (billingPeriod !== "monthly" && billingPeriod !== "yearly") {
      return NextResponse.json(
        { error: "Invalid billing period. Must be 'monthly' or 'yearly'" },
        { status: 400 }
      );
    }

    // Validate plan ID
    if (!["basic", "pro", "ultra"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid plan ID. Must be 'basic', 'pro', or 'ultra'" },
        { status: 400 }
      );
    }

    // Type-safe access after validation
    const validBillingPeriod = billingPeriod as BillingPeriod;
    const validPlanId = planId as PlanId;

    // Get the Stripe Price ID
    const priceId = SUBSCRIPTION_PRICE_IDS[validBillingPeriod][validPlanId];

    if (!priceId) {
      console.error(
        `Missing Stripe Price ID for ${validPlanId} ${validBillingPeriod}`
      );
      return NextResponse.json(
        { error: "Subscription plan not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Base URL for success/cancel redirects
    const baseUrl =
      process.env.NEXT_PUBLIC_VISAGIFY_URL || "https://visagify.com";

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription&return=${encodeURIComponent(returnUrl || "")}`,
      cancel_url: `${baseUrl}/payment/cancelled?return=${encodeURIComponent(returnUrl || "")}`,
      metadata: {
        plan_id: validPlanId,
        billing_period: validBillingPeriod,
        credits_per_month: PLAN_CREDITS[validPlanId].toString(),
        return_url: returnUrl || "",
        user_id: userId || "",
      },
      subscription_data: {
        metadata: {
          plan_id: validPlanId,
          billing_period: validBillingPeriod,
          credits_per_month: PLAN_CREDITS[validPlanId].toString(),
          user_id: userId || "",
        },
        // 7-day free trial
        trial_period_days: 7,
      },
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe subscription checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription checkout session" },
      { status: 500 }
    );
  }
}
