import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";

// Updated pricing tiers - 8 credits/swap
const VALID_TIERS = [
  { credits: 80, price: 4.99 },
  { credits: 400, price: 19.99 },
  { credits: 1600, price: 49.99 },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credits, price, returnUrl, userId } = body;

    // Validate the request
    if (!credits || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that the tier exists
    const validTier = VALID_TIERS.find(
      (t) => t.credits === credits && t.price === price
    );

    if (!validTier) {
      return NextResponse.json(
        { error: "Invalid pricing tier" },
        { status: 400 }
      );
    }

    // Base URL for success/cancel redirects
    const baseUrl =
      process.env.NEXT_PUBLIC_VISAGIFY_URL || "https://visagify.com";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${credits} Face Swap Credits`,
              description: `${credits / 8} face swaps - Credits never expire`,
              images: [],
            },
            unit_amount: Math.round(price * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&return=${encodeURIComponent(returnUrl || "")}`,
      cancel_url: `${baseUrl}/payment/cancelled?return=${encodeURIComponent(returnUrl || "")}`,
      metadata: {
        credits: credits.toString(),
        return_url: returnUrl || "",
        user_id: userId || "",
      },
      // Don't collect any billing details to minimize data
      billing_address_collection: "auto",
      // Allow promotion codes if you set them up
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
