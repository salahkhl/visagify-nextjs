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

    // Get credits from metadata
    const credits = parseInt(session.metadata?.credits || "0", 10);
    const customerEmail = session.customer_details?.email;

    if (credits > 0) {
      try {
        // Store the purchase record
        await supabaseAdmin.from("credit_purchases").insert({
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          email: customerEmail,
          credits_purchased: credits,
          amount_paid: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          status: "completed",
          metadata: {
            return_url: session.metadata?.return_url,
          },
        });

        console.log(
          `Payment successful: ${credits} credits purchased by ${customerEmail}`
        );
      } catch (dbError) {
        console.error("Error storing purchase record:", dbError);
        // Don't fail the webhook, but log the error
      }
    }
  }

  return NextResponse.json({ received: true });
}

// Disable body parsing for webhook (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

