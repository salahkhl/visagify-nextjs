import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service role for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to add credits to a user
async function addCreditsToUser(
  userId: string,
  credits: number,
  source: string
) {
  const { data: existingCredits } = await supabaseAdmin
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (existingCredits) {
    const newBalance = (existingCredits.balance || 0) + credits;
    await supabaseAdmin
      .from("user_credits")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    console.log(
      `[${source}] Credits updated: ${credits} added to user ${userId}. New balance: ${newBalance}`
    );
  } else {
    await supabaseAdmin.from("user_credits").insert({
      user_id: userId,
      balance: credits,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log(
      `[${source}] Credits created: ${credits} credits for new user ${userId}`
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

// Handle new subscription creation
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const planId = subscription.metadata?.plan_id;
  const billingPeriod = subscription.metadata?.billing_period;
  const creditsPerMonth = parseInt(
    subscription.metadata?.credits_per_month || "0",
    10
  );
  const customerId = subscription.customer as string;

  try {
    // Get customer email
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = (customer as Stripe.Customer).email;

    // Store subscription record
    await supabaseAdmin.from("subscriptions").upsert(
      {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        user_id: userId || null,
        email: customerEmail,
        plan_id: planId,
        billing_period: billingPeriod,
        credits_per_month: creditsPerMonth,
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

    // Add credits to user if subscription is active (not in trial)
    // For trial, credits will be added when the subscription becomes active
    if (userId && subscription.status === "active" && creditsPerMonth > 0) {
      await addCreditsToUser(userId, creditsPerMonth, "subscription_created");
    }

    console.log(
      `Subscription created: ${planId} (${billingPeriod}) for ${customerEmail} (user: ${userId || "unknown"})`
    );
  } catch (dbError) {
    console.error("Error processing subscription creation:", dbError);
  }
}

// Handle subscription updates (renewal, plan changes, etc.)
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const planId = subscription.metadata?.plan_id;
  const billingPeriod = subscription.metadata?.billing_period;
  const creditsPerMonth = parseInt(
    subscription.metadata?.credits_per_month || "0",
    10
  );
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
        credits_per_month: creditsPerMonth,
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
    const creditsPerMonth = parseInt(
      subscription.metadata?.credits_per_month || "0",
      10
    );

    // Don't add credits for trial period invoices (amount = 0)
    if (invoice.amount_paid === 0) {
      console.log(
        `Trial invoice paid for subscription ${subscriptionId} - no credits added`
      );
      return;
    }

    // Add monthly credits to user
    if (userId && creditsPerMonth > 0) {
      await addCreditsToUser(userId, creditsPerMonth, "invoice_paid");
    }

    console.log(
      `Invoice paid: ${creditsPerMonth} credits added for subscription ${subscriptionId}`
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

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Check if this is a subscription or one-time payment
      if (session.mode === "subscription") {
        // Subscription is handled by customer.subscription.created event
        console.log(`Subscription checkout completed: ${session.id}`);
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
