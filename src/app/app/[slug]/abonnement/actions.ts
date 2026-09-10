"use server";

import { redirect } from "next/navigation";
import { requireOrgAccess } from "@/lib/auth";
import { createSubscriptionCheckout, createBillingPortal, stripeConfigured } from "@/lib/payments/stripe";
import { planOrder, type PlanId, type Interval } from "@/lib/plans";
import { getBaseUrl } from "@/lib/bookings";

/** Naar de betaalpagina van Stripe om een formule te starten of te wisselen. */
export async function startCheckout(slug: string, formData: FormData) {
  const access = await requireOrgAccess(slug);
  if (!access) redirect("/login");
  if (!stripeConfigured()) redirect(`/app/${slug}/abonnement?fout=stripe`);
  const { org } = access;

  const plan = String(formData.get("plan") ?? "") as PlanId;
  const interval = (String(formData.get("interval") ?? "month") === "year" ? "year" : "month") as Interval;
  if (!planOrder.includes(plan)) redirect(`/app/${slug}/abonnement?fout=formule`);

  const base = await getBaseUrl();
  const session = await createSubscriptionCheckout({
    orgId: org.id, orgName: org.name, email: org.email ?? access.user.email, customerId: org.stripeCustomerId,
    plan, interval,
    successUrl: `${base}/app/${slug}/abonnement?klaar=1`,
    cancelUrl: `${base}/app/${slug}/abonnement?geannuleerd=1`,
    // Proefperiode enkel bij de allereerste keer: anders kan je eindeloos gratis blijven wisselen.
    withTrial: !org.stripeSubscriptionId,
  });
  redirect(session.url);
}

/** Facturen, kaart wijzigen of opzeggen: dat regelt Stripe zelf, wij sturen enkel door. */
export async function openPortal(slug: string) {
  const access = await requireOrgAccess(slug);
  if (!access) redirect("/login");
  const { org } = access;
  if (!org.stripeCustomerId) redirect(`/app/${slug}/abonnement?fout=geen-klant`);
  const base = await getBaseUrl();
  redirect(await createBillingPortal(org.stripeCustomerId, `${base}/app/${slug}/abonnement`));
}
