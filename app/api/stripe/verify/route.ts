import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";

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

      return NextResponse.json({
        success: true,
        credits,
        email: session.customer_details?.email,
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




