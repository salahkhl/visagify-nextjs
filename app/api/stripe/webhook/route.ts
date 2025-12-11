import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service role for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Get credits and user_id from metadata
    const credits = parseInt(session.metadata?.credits || "0", 10);
    const userId = session.metadata?.user_id;
    const customerEmail = session.customer_details?.email;

    if (credits > 0) {
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

        // IMPORTANT: Add credits to user's balance in user_credits table
        if (userId) {
          // Check if user has existing credit record
          const { data: existingCredits } = await supabaseAdmin
            .from("user_credits")
            .select("balance")
            .eq("user_id", userId)
            .single();

          if (existingCredits) {
            // Update existing balance
            const newBalance = (existingCredits.balance || 0) + credits;
            await supabaseAdmin
              .from("user_credits")
              .update({
                balance: newBalance,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);

            console.log(
              `Credits updated: ${credits} added to user ${userId}. New balance: ${newBalance}`
            );
          } else {
            // Create new credit record for user
            await supabaseAdmin.from("user_credits").insert({
              user_id: userId,
              balance: credits,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            console.log(
              `Credits created: ${credits} credits for new user ${userId}`
            );
          }
        } else {
          console.warn(
            `Payment completed but no user_id provided. Email: ${customerEmail}, Credits: ${credits}`
          );
        }

        console.log(
          `Payment successful: ${credits} credits purchased by ${customerEmail} (user: ${userId || "unknown"})`
        );
      } catch (dbError) {
        console.error("Error processing payment:", dbError);
        // Don't fail the webhook, but log the error
      }
    }
  }

  return NextResponse.json({ received: true });
}
