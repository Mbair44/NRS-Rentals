import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = ["rentalDate","firstName","lastName","email","phone","address","city","zipCode","startTime","endTime"];
    for (const key of required) {
      if (!body[key]) return NextResponse.json({ error: `Missing ${key}.` }, { status: 400 });
    }
    if (body.agreementAccepted !== "true") {
      return NextResponse.json({ error: "Rental agreement must be accepted." }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const supabase = getSupabaseAdmin();

    if (!stripeKey || !priceId || !supabase) {
      return NextResponse.json({
        error: "Stripe or Supabase is not configured yet. Add the environment variables from .env.example."
      }, { status: 503 });
    }

    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("rental_date", body.rentalDate)
      .in("status", ["pending_payment", "paid", "confirmed"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "That date was just booked. Please choose another date." }, { status: 409 });
    }

    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        rental_date: body.rentalDate,
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        zip_code: body.zipCode,
        event_start_time: body.startTime,
        event_end_time: body.endTime,
        notes: body.notes || "",
        amount_cents: 35000,
        status: "pending_payment",
        agreement_accepted_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (insertError || !booking) {
      return NextResponse.json({ error: insertError?.message || "Could not create reservation." }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/book?cancelled=1`,
      metadata: {
        booking_id: booking.id,
        rental_date: body.rentalDate
      }
    });

    await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected checkout error." }, { status: 500 });
  }
}
