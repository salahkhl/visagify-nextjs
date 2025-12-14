import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  calculateCreditsToAdd,
  getPlanConfig,
  type PlanId,
} from "@/lib/subscription";

// Use service role for webhook operations
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
 * Set user's credit balance to a specific value
 */
async function setUserCredits(
  userId: string,
  newBalance: number,
  source: string
) {
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

    console.log(
      `[${source}] Credits set to ${newBalance} for user ${userId} (was ${existing.balance})`
    );
  } else {
    await supabaseAdmin.from("user_credits").insert({
      user_id: userId,
      balance: newBalance,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log(
      `[${source}] Credits created: ${newBalance} for user ${userId}`
    );
  }
}

/**
 * Add credits to user (for one-time purchases)
 */
async function addCreditsToUser(
  userId: string,
  credits: number,
  source: string
) {
  const currentBalance = await getUserCreditBalance(userId);
  const newBalance = currentBalance + credits;
  await setUserCredits(userId, newBalance, source);
}

/**
 * Apply top-up credits logic for subscriptions
 * Credits are topped up to the plan's maximum, not added on top
 */
async function topUpCreditsForSubscription(
  userId: string,
  planId: PlanId,
  source: string
) {
  const plan = getPlanConfig(planId);
  const currentBalance = await getUserCreditBalance(userId);
  const creditsToAdd = calculateCreditsToAdd(
    currentBalance,
    plan.creditsPerMonth
  );

  if (creditsToAdd > 0) {
    const newBalance = currentBalance + creditsToAdd;
    await setUserCredits(userId, newBalance, source);
    console.log(
      `[${source}] Top-up applied: ${creditsToAdd} credits added (${currentBalance} → ${newBalance}, max: ${plan.creditsPerMonth})`
    );
  } else {
    console.log(
      `[${source}] No top-up needed: user has ${currentBalance} credits (max: ${plan.creditsPerMonth})`
    );
  }
}

// Handle one-time credit purchase
async function handleCreditPurchase(session: Stripe.Checkout.Session) {
  const credits = parseInt(session.metadata?.credits || "0", 10);
  const userId = session.metadata?.user_id;
  const customerEmail = session.customer_details?.email;

  if (credits <= 0) return;

  try {
    // Store the purchase record
    await supabaseAdmin.from("credit_purchases").insert({
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      email: customerEmail,
      user_id: userId || null,
      credits_purchased: credits,
      amount_paid: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      status: "completed",
      metadata: {
        return_url: session.metadata?.return_url,
      },
    });

    if (userId) {
      // One-time purchases ADD credits (don't use top-up logic)
      await addCreditsToUser(userId, credits, "credit_purchase");
    } else {
      console.warn(
        `Payment completed but no user_id provided. Email: ${customerEmail}, Credits: ${credits}`
      );
    }

    console.log(
      `Payment successful: ${credits} credits purchased by ${customerEmail} (user: ${userId || "unknown"})`
    );
  } catch (dbError) {
    console.error("Error processing credit purchase:", dbError);
  }
}

// Handle subscription checkout completed - this is when we credit the user
async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const planId = (session.metadata?.plan_id || "basic") as PlanId;
  const billingPeriod = session.metadata?.billing_period;
  const customerEmail = session.customer_details?.email;

  console.log(
    `Subscription checkout completed: ${planId} (${billingPeriod}) for ${customerEmail}`
  );

  // Credit the user immediately upon successful checkout
  // Note: Trial users also get credits immediately to use during trial
  if (userId) {
    await topUpCreditsForSubscription(
      userId,
      planId,
      "subscription_checkout_completed"
    );
  }
}

// Handle new subscription creation (stores the record)
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const planId = (subscription.metadata?.plan_id || "basic") as PlanId;
  const billingPeriod = subscription.metadata?.billing_period;
  const plan = getPlanConfig(planId);
  const customerId = subscription.customer as string;

  try {
    // Get customer email
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = (customer as Stripe.Customer).email;

    // Store subscription record with storage quota
    await supabaseAdmin.from("subscriptions").upsert(
      {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        user_id: userId || null,
        email: customerEmail,
        plan_id: planId,
        billing_period: billingPeriod,
        credits_per_month: plan.creditsPerMonth,
        storage_included_mb: plan.storageIncludedMB,
        status: subscription.status,
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stripe_subscription_id",
      }
    );

    console.log(
      `Subscription record created: ${planId} (${billingPeriod}) for ${customerEmail} (user: ${userId || "unknown"})`
    );
  } catch (dbError) {
    console.error("Error processing subscription creation:", dbError);
  }
}

// Handle subscription updates (renewal, plan changes, etc.)
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const planId = (subscription.metadata?.plan_id || "basic") as PlanId;
  const billingPeriod = subscription.metadata?.billing_period;
  const plan = getPlanConfig(planId);
  const customerId = subscription.customer as string;

  try {
    // Get customer email
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = (customer as Stripe.Customer).email;

    // Update subscription record
    await supabaseAdmin.from("subscriptions").upsert(
      {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        user_id: userId || null,
        email: customerEmail,
        plan_id: planId,
        billing_period: billingPeriod,
        credits_per_month: plan.creditsPerMonth,
        storage_included_mb: plan.storageIncludedMB,
        status: subscription.status,
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stripe_subscription_id",
      }
    );

    console.log(
      `Subscription updated: ${subscription.id} - Status: ${subscription.status}`
    );
  } catch (dbError) {
    console.error("Error processing subscription update:", dbError);
  }
}

// Handle successful invoice payment (for subscription renewals)
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Only process subscription invoices (not one-time payments)
  if (!invoice.subscription) return;

  const subscriptionId = invoice.subscription as string;

  try {
    // Get the subscription to access metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.user_id;
    const planId = (subscription.metadata?.plan_id || "basic") as PlanId;

    // Check if this is the first invoice (initial subscription) or a renewal
    // billing_reason: 'subscription_create' for first invoice, 'subscription_cycle' for renewals
    const isRenewal = invoice.billing_reason === "subscription_cycle";

    // For trial invoices (amount = 0), don't add credits
    // Credits were already added at checkout
    if (invoice.amount_paid === 0) {
      console.log(
        `Trial/free invoice for subscription ${subscriptionId} - no credits added (amount_paid = 0)`
      );
      return;
    }

    // For the first invoice, credits were already added at checkout.session.completed
    // Only add credits on renewals
    if (!isRenewal) {
      console.log(
        `Initial subscription invoice ${invoice.id} - credits already added at checkout`
      );
      return;
    }

    // Apply top-up credits for renewal
    if (userId) {
      await topUpCreditsForSubscription(userId, planId, "subscription_renewal");
    }

    console.log(
      `Subscription renewal processed: ${planId} for subscription ${subscriptionId}`
    );
  } catch (dbError) {
    console.error("Error processing invoice payment:", dbError);
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    console.log(`Subscription canceled: ${subscription.id}`);
  } catch (dbError) {
    console.error("Error processing subscription deletion:", dbError);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  console.log(`Stripe webhook received: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription") {
        // Subscription checkout - credit user immediately
        await handleSubscriptionCheckout(session);
      } else {
        // One-time credit purchase
        await handleCreditPurchase(session);
      }
      break;
    }

    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCreated(subscription);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(
        `Invoice payment failed: ${invoice.id} for subscription ${invoice.subscription}`
      );
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
