/**
 * Controle van de Stripe-webhookhandtekening.
 *
 * Staat apart van stripe.ts, en zonder "server-only", om één reden: dit is het slot
 * op de deur van /api/webhooks/stripe, en een slot wil je kunnen testen. Het geheim
 * komt hier altijd als argument binnen — deze module leest zelf geen omgeving uit,
 * dus er valt niets uit te lekken.
 */
import crypto from "node:crypto";

export type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } };

/** Gebeurtenissen ouder dan dit aantal seconden weigeren we: dat zijn herhaalde verzoeken. */
export const maxAgeSeconds = 300;

export function verifyWebhook(payload: string, header: string | null, secret: string | undefined): StripeEvent {
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET ontbreekt");
  if (!header) throw new Error("Stripe-Signature ontbreekt");

  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=", 2) as [string, string]));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error("Ongeldige Stripe-Signature");
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > maxAgeSeconds) throw new Error("Stripe-gebeurtenis te oud");

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // Lengte eerst: timingSafeEqual werpt bij ongelijke lengte, en dat verraadt informatie.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("Handtekening klopt niet");

  return JSON.parse(payload) as StripeEvent;
}
