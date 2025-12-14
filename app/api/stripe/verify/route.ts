import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  calculateCreditsToAdd,
  getPlanConfig,
  type PlanId,
} from "@/lib/subscription";

// Result types for verification functions
interface CreditPurchaseResult {
  credits: number;
  userId: string | undefined;
  email: string | null | undefined;
}

interface SubscriptionResult extends CreditPurchaseResult {
  planId: PlanId;
  isSubscription: true;
}

// Use service role for credit operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get user's current credit balance
 */
async function getUserCreditBalance(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  return data?.balance || 0;
}

/**
 * Set user's credit balance
 */
async function setUserCredits(userId: string, newBalance: number) {
  const { data: existing } = await supabaseAdmin
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("user_credits")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } else {
    await supabaseAdmin.from("user_credits").insert({
      user_id: userId,
      balance: newBalance,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

/**
 * Handle one-time credit purchase verification
 */
async function handleCreditPurchaseVerification(
  session: Stripe.Checkout.Session,
  sessionId: string
): Promise<CreditPurchaseResult> {
  const credits = parseInt(session.metadata?.credits || "0", 10);
  const userId = session.metadata?.user_id;
  const customerEmail = session.customer_details?.email;

  if (credits <= 0) {
    return { credits: 0, userId, email: customerEmail };
  }

  // Check if already processed (idempotency)
  const { data: existingPurchase } = await supabaseAdmin
    .from("credit_purchases")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .single();

  if (!existingPurchase) {
    console.log(`Verify: Processing credit purchase for session ${sessionId}`);

    try {
      // Store the purchase record
      await supabaseAdmin.from("credit_purchases").insert({
        stripe_session_id: sessionId,
        stripe_payment_intent: session.payment_intent as string,
        email: customerEmail,
        user_id: userId || null,
        credits_purchased: credits,
        amount_paid: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        status: "completed",
        metadata: {
          return_url: session.metadata?.return_url,
          processed_by: "verify_route",
        },
      });

      // Add credits to user's balance
      if (userId) {
        const currentBalance = await getUserCreditBalance(userId);
        const newBalance = currentBalance + credits;
        await setUserCredits(userId, newBalance);
        console.log(
          `Verify: Added ${credits} credits to user ${userId}. New balance: ${newBalance}`
        );
      }
    } catch (dbError) {
      console.error("Verify: DB error for credit purchase:", dbError);
    }
  } else {
    console.log(`Verify: Session ${sessionId} already processed`);
  }

  return { credits, userId, email: customerEmail };
}

/**
 * Handle subscription verification - apply top-up credits
 */
async function handleSubscriptionVerification(
  session: Stripe.Checkout.Session,
  sessionId: string
): Promise<SubscriptionResult> {
  const planId = (session.metadata?.plan_id || "basic") as PlanId;
  const userId = session.metadata?.user_id;
  const customerEmail = session.customer_details?.email;

  // Get plan configuration
  const plan = getPlanConfig(planId);

  // Calculate credits to add
  let creditsAdded = 0;

  if (userId) {
    const currentBalance = await getUserCreditBalance(userId);
    creditsAdded = calculateCreditsToAdd(currentBalance, plan.creditsPerMonth);

    if (creditsAdded > 0) {
      // Check if we already added credits for this session
      const { data: creditLog } = await supabaseAdmin
        .from("credit_purchases")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .single();

      if (!creditLog) {
        const newBalance = currentBalance + creditsAdded;
        await setUserCredits(userId, newBalance);

        // Log the credit addition
        try {
          await supabaseAdmin.from("credit_purchases").insert({
            stripe_session_id: sessionId,
            stripe_payment_intent: session.subscription as string,
            email: customerEmail,
            user_id: userId,
            credits_purchased: creditsAdded,
            amount_paid: 0, // Trial or first payment
            currency: session.currency || "usd",
            status: "completed",
            metadata: {
              type: "subscription",
              plan_id: planId,
              processed_by: "verify_route",
            },
          });
        } catch {
          // Ignore duplicate key errors
        }

        console.log(
          `Verify: Subscription top-up for user ${userId}. Added ${creditsAdded} credits (${currentBalance} → ${newBalance}). Plan: ${planId}`
        );
      } else {
        console.log(`Verify: Credits already added for session ${sessionId}`);
      }
    } else {
      console.log(
        `Verify: No top-up needed. User ${userId} has ${await getUserCreditBalance(userId)} credits, plan max: ${plan.creditsPerMonth}`
      );
    }
  }

  return {
    credits: creditsAdded,
    userId,
    email: customerEmail,
    planId,
    isSubscription: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid" || session.status === "complete") {
      // Determine if this is a subscription or one-time purchase
      const isSubscription = session.mode === "subscription";

      let result;

      if (isSubscription) {
        result = await handleSubscriptionVerification(session, sessionId);
      } else {
        result = await handleCreditPurchaseVerification(session, sessionId);
      }

      return NextResponse.json({
        success: true,
        credits: result.credits,
        email: result.email,
        userId: result.userId,
        isSubscription,
        planId: isSubscription
          ? (result as SubscriptionResult).planId
          : undefined,
      });
    }

    return NextResponse.json(
      { success: false, error: "Payment not completed" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
