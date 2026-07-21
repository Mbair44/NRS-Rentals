import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabase = getSupabaseAdmin();
  if (!stripeKey || !webhookSecret || !supabase) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  const stripe = new Stripe(stripeKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.error("Invalid Stripe webhook signature:", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (bookingId && session.payment_status === "paid") {
      const depositCents = Number(session.metadata?.deposit_cents || session.amount_total || 0);
      await supabase.from("bookings").update({
        status: "confirmed",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
        deposit_cents: depositCents,
        paid_at: new Date().toISOString(),
      }).eq("id", bookingId);

      await supabase.from("booking_items").update({ status: "confirmed" }).eq("booking_id", bookingId);
    }
  }

  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      await supabase.from("bookings").update({ status: "expired" }).eq("id", bookingId).eq("status", "pending_payment");
      await supabase.from("booking_items").update({ status: "expired" }).eq("booking_id", bookingId).eq("status", "pending_payment");
    }
  }

  return NextResponse.json({ received: true });
}
