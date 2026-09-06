/**
 * Mollie-koppeling (Bancontact, Payconiq, kaart) voor waarborgen en vooraf betalen.
 * Zonder MOLLIE_API_KEY doet dit niets; met key maakt het een betaling aan en stuurt het de klant door.
 * Voor geld dat rechtstreeks naar de zaak moet (niet via Plekk): gebruik Mollie Connect met een profile per organisatie.
 */
import "server-only";
import { site } from "@/config/site";

export async function createPayment(args: { bookingId: string; amountCents: number; description: string; redirectUrl: string; webhookUrl: string }) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: { currency: site.currency, value: (args.amountCents / 100).toFixed(2) },
      description: args.description, redirectUrl: args.redirectUrl, webhookUrl: args.webhookUrl,
      locale: "nl_BE", metadata: { bookingId: args.bookingId },
    }),
  });
  if (!res.ok) throw new Error(`Mollie ${res.status}: ${await res.text()}`);
  const p = (await res.json()) as { id: string; _links: { checkout: { href: string } } };
  return { id: p.id, checkoutUrl: p._links.checkout.href };
}

export async function getPayment(paymentId: string) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) return null;
  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Mollie ${res.status}`);
  return (await res.json()) as { id: string; status: "open" | "paid" | "failed" | "canceled" | "expired"; metadata?: { bookingId?: string } };
}
