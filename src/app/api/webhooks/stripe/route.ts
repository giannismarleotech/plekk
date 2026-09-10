import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { verifyWebhook, getSubscription, type StripeSubscription } from "@/lib/payments/stripe";
import { applySubscription } from "@/lib/billing";

// Stripe ondertekent de ruwe body: die mag niet door een parser gaan.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Alles wat Stripe ons meldt komt hier binnen: abonnementen die starten, verlengen,
 * mislukken of stoppen, en betaalde waarborgen bij een boeking.
 *
 * Twee vaste regels:
 *  - eerst de handtekening controleren, anders kan iedereen die de URL kent hier schrijven;
 *  - altijd 200 teruggeven na een geldige handtekening, ook bij een gebeurtenis die we
 *    niet gebruiken — anders blijft Stripe eindeloos opnieuw proberen.
 */
export async function POST(req: Request) {
  const payload = await req.text();
  let event;
  try {
    event = verifyWebhook(payload, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("[stripe] webhook geweigerd:", (e as Error).message);
    return NextResponse.json({ error: "signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as { mode?: string; subscription?: string; client_reference_id?: string; metadata?: Record<string, string>; customer?: string; payment_status?: string };
        if (s.mode === "subscription" && s.subscription) {
          const sub = await getSubscription(s.subscription);
          await applySubscription(sub, s.metadata?.orgId ?? s.client_reference_id ?? undefined);
        }
        if (s.mode === "payment") {
          const bookingId = s.metadata?.bookingId ?? s.client_reference_id;
          if (bookingId && s.payment_status === "paid") await markBookingPaid(bookingId, s.subscription ?? null);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        const sub = event.data.object as unknown as StripeSubscription;
        // Bij "deleted" stuurt Stripe status "canceled" mee; applySubscription vertaalt dat al.
        await applySubscription(sub);
        break;
      }
      case "invoice.payment_failed":
      case "invoice.payment_succeeded": {
        const inv = event.data.object as { subscription?: string };
        if (inv.subscription) await applySubscription(await getSubscription(inv.subscription));
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as { metadata?: Record<string, string>; id: string };
        if (pi.metadata?.bookingId) await markBookingPaid(pi.metadata.bookingId, pi.id);
        break;
      }
      case "charge.refunded": {
        const ch = event.data.object as { metadata?: Record<string, string> };
        if (ch.metadata?.bookingId) {
          const db = await getDb();
          await db.update(schema.bookings).set({ paymentStatus: "refunded" }).where(eq(schema.bookings.id, ch.metadata.bookingId));
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // Fout aan onze kant: 500 zodat Stripe het opnieuw probeert.
    console.error(`[stripe] ${event.type} mislukt:`, (e as Error).message);
    return NextResponse.json({ error: "handler" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function markBookingPaid(bookingId: string, ref: string | null) {
  const db = await getDb();
  await db.update(schema.bookings).set({
    paymentStatus: "paid", paymentProvider: "stripe", ...(ref ? { paymentRef: ref } : {}), status: "confirmed",
  }).where(eq(schema.bookings.id, bookingId));
}
