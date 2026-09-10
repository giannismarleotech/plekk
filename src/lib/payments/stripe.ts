/**
 * Stripe-koppeling voor Plekk.
 *
 * Twee dingen lopen hierlangs:
 *  1. Abonnementen (Solo / Zaak / Zaak+) — de zaak betaalt Plekk.
 *  2. Waarborgen en vooraf betalen bij een boeking — de klant betaalt de zaak.
 *
 * Bewust zonder de stripe-npm-package: één klein fetch-laagje is lichter in een
 * serverless functie en heeft geen aparte versie-afhankelijkheid. Stripe verwacht
 * form-encoded bodies, ook voor geneste velden (line_items[0][price]).
 */
import "server-only";


const API = "https://api.stripe.com/v1";

export function stripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Stripe wil application/x-www-form-urlencoded met haakjesnotatie voor geneste waarden. */
function encode(obj: unknown, prefix = "", out: string[] = []): string {
  if (obj === undefined || obj === null) return out.join("&");
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => encode(v, `${prefix}[${i}]`, out));
  } else if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      encode(v, prefix ? `${prefix}[${k}]` : k, out);
    }
  } else {
    out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(obj))}`);
  }
  return out.join("&");
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY ontbreekt");
  const qs = method === "GET" && body ? `?${encode(body)}` : "";
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const res = await fetch(`${API}${path}${qs}`, { method, headers, body: method === "POST" ? encode(body ?? {}) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`Stripe ${res.status} ${path}: ${text.slice(0, 400)}`);
  return JSON.parse(text) as T;
}

/* ---------------------------------------------------------------- abonnementen */

// De pakketten zelf staan in ../plans.ts — die lijst is niet geheim en wordt ook
// op de publieke prijzenpagina gebruikt.
import { priceIdFor, trialDays, type PlanId, type Interval } from "../plans";
export { plans, planOrder, priceIdFor, planFromPriceId, trialDays, type PlanId, type Interval } from "../plans";

/**
 * Betaalpagina voor een abonnement. Stripe int zelf, wij krijgen het resultaat
 * via de webhook binnen — nooit vertrouwen op de terugkeer-URL alleen.
 */
export async function createSubscriptionCheckout(args: {
  orgId: string; orgName: string; email?: string | null; customerId?: string | null;
  plan: PlanId; interval: Interval; successUrl: string; cancelUrl: string; withTrial?: boolean;
}) {
  const body: Record<string, unknown> = {
    mode: "subscription",
    line_items: [{ price: priceIdFor(args.plan, args.interval), quantity: 1 }],
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    client_reference_id: args.orgId,
    locale: "nl",
    allow_promotion_codes: true,
    billing_address_collection: "required",
    // BTW-nummer van de zaak: verlegging binnen de EU regelt Stripe Tax verder.
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: true },
    subscription_data: {
      metadata: { orgId: args.orgId, plan: args.plan, app: "plekk" },
      ...(args.withTrial && trialDays > 0 ? { trial_period_days: trialDays } : {}),
    },
    metadata: { orgId: args.orgId, plan: args.plan, app: "plekk" },
  };
  if (args.customerId) body.customer = args.customerId;
  else if (args.email) { body.customer_email = args.email; body.customer_creation = "always"; }
  const s = await call<{ id: string; url: string }>("POST", "/checkout/sessions", body);
  return { id: s.id, url: s.url };
}

/** Zelfbediening: factuur, kaart wijzigen, opzeggen. Alles bij Stripe, niets bij ons. */
export async function createBillingPortal(customerId: string, returnUrl: string) {
  const s = await call<{ url: string }>("POST", "/billing_portal/sessions", { customer: customerId, return_url: returnUrl, locale: "nl" });
  return s.url;
}

export type StripeSubscription = {
  id: string; status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" | "paused";
  customer: string; cancel_at_period_end: boolean; current_period_end: number;
  items: { data: { price: { id: string } }[] };
  metadata?: Record<string, string>;
};

export function getSubscription(id: string) {
  return call<StripeSubscription>("GET", `/subscriptions/${id}`);
}

/* ------------------------------------------------- waarborg / vooraf betalen */

/**
 * Eenmalige betaling bij een boeking. Bancontact staat vooraan: dat is wat
 * Belgische klanten verwachten.
 */
export async function createBookingCheckout(args: {
  bookingId: string; orgName: string; amountCents: number; description: string;
  successUrl: string; cancelUrl: string; email?: string | null;
}) {
  const s = await call<{ id: string; url: string }>("POST", "/checkout/sessions", {
    mode: "payment",
    payment_method_types: ["bancontact", "card", "ideal"],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: args.amountCents,
        product_data: { name: `${args.orgName} — ${args.description}` },
      },
    }],
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    locale: "nl",
    client_reference_id: args.bookingId,
    ...(args.email ? { customer_email: args.email } : {}),
    payment_intent_data: { metadata: { bookingId: args.bookingId, app: "plekk" } },
    metadata: { bookingId: args.bookingId, app: "plekk" },
  }, `booking-${args.bookingId}`);
  return { id: s.id, checkoutUrl: s.url };
}

/* ------------------------------------------------------------------- webhook */

// De handtekeningcontrole staat in stripe-signature.ts, zodat ze los te testen is.
export { verifyWebhook, type StripeEvent } from "./stripe-signature";
