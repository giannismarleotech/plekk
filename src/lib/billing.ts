/**
 * De brug tussen Stripe en een zaak in onze database.
 *
 * Regel: Stripe is de waarheid over betalen, wij houden enkel een kopie bij zodat
 * het dashboard snel blijft. Alles wat de status wijzigt komt binnen via de webhook.
 *
 * De vraag "wat mag deze zaak nu" staat in plan-access.ts — die is puur en testbaar.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Organisation } from "@/db/schema";
import { planFromPriceId, type PlanId, type Interval } from "./plans";
import type { StripeSubscription } from "./payments/stripe";

export { accessFor, type Access } from "./plan-access";

/** Zet wat Stripe zegt over in onze kolommen. Idempotent: dezelfde gebeurtenis twee keer is geen probleem. */
export async function applySubscription(sub: StripeSubscription, orgIdHint?: string) {
  const db = await getDb();
  const orgId = sub.metadata?.orgId ?? orgIdHint;
  const org = orgId
    ? await db.query.organisations.findFirst({ where: eq(schema.organisations.id, orgId) })
    : await db.query.organisations.findFirst({ where: eq(schema.organisations.stripeSubscriptionId, sub.id) });
  if (!org) { console.warn(`[billing] geen zaak gevonden voor abonnement ${sub.id}`); return null; }

  const priceId = sub.items?.data?.[0]?.price?.id;
  const plan = (priceId && planFromPriceId(priceId)) || (org.plan as PlanId);
  const map: Partial<Record<StripeSubscription["status"], Organisation["planStatus"]>> = { trialing: "trialing", active: "active", past_due: "past_due", unpaid: "past_due" };
  const status = map[sub.status] ?? "canceled";

  await db.update(schema.organisations).set({
    plan,
    planStatus: status,
    planRenewsAt: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
    planCancelAtPeriodEnd: !!sub.cancel_at_period_end,
    stripeCustomerId: sub.customer,
    stripeSubscriptionId: sub.id,
  }).where(eq(schema.organisations.id, org.id));
  return org.id;
}

export function intervalLabel(i: Interval | null) {
  return i === "year" ? "per jaar" : "per maand";
}
