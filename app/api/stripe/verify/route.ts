import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";
import { createClient } from "@supabase/supabase-js";

// Use service role for credit operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    if (session.payment_status === "paid") {
      const credits = parseInt(session.metadata?.credits || "0", 10);
      const userId = session.metadata?.user_id;
      const customerEmail = session.customer_details?.email;

      // Check if this session was already processed (idempotency)
      const { data: existingPurchase } = await supabaseAdmin
        .from("credit_purchases")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .single();

      // If not already processed, add credits now (fallback for webhook)
      if (!existingPurchase && credits > 0) {
        console.log(`Verify route: Processing credits for session ${sessionId}`);
        
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
              
              console.log(`Verify route: Updated credits for user ${userId}. New balance: ${newBalance}`);
            } else {
              await supabaseAdmin.from("user_credits").insert({
                user_id: userId,
                balance: credits,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              
              console.log(`Verify route: Created credits for user ${userId}. Balance: ${credits}`);
            }
          } else {
            console.warn(`Verify route: No user_id for session ${sessionId}`);
          }
        } catch (dbError) {
          console.error("Verify route: DB error:", dbError);
          // Continue anyway - credits might have been added by webhook
        }
      } else if (existingPurchase) {
        console.log(`Verify route: Session ${sessionId} already processed`);
      }

      return NextResponse.json({
        success: true,
        credits,
        email: customerEmail,
        userId,
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




