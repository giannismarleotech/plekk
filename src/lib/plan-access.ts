/**
 * Wat mag een zaak, gegeven haar abonnement?
 *
 * Bewust een pure functie zonder database of "server-only": zo kan dezelfde regel
 * gebruikt worden op de publieke pagina, in het dashboard, in de boekingslogica én
 * in een test, zonder ergens een kopie van de voorwaarden te maken.
 */
import { plans, planOrder, type PlanId } from "./plans";

/** Alles wat accessFor nodig heeft. Zo hoeft er geen volledige database-rij door. */
export type PlanState = {
  plan: string;
  planStatus: "trialing" | "active" | "past_due" | "canceled" | "none";
  planRenewsAt: Date | null;
  planCancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
};

export type Access = {
  /** Mag de zaak boekingen ontvangen? */
  active: boolean;
  /** Proefperiode loopt nog. */
  trialing: boolean;
  daysLeft: number | null;
  /** Betaling mislukt of proef bijna om: wel doorwerken, maar waarschuwen. */
  warning: string | null;
  plan: PlanId;
  limits: { staff: number | null };
};

/** Hoe lang een zaak na een mislukte betaling nog mag doorwerken. */
export const graceDays = 10;

const days = (d: Date | null) => (d ? Math.ceil((d.getTime() - Date.now()) / 86_400_000) : null);

export function accessFor(org: PlanState): Access {
  const plan = (planOrder.includes(org.plan as PlanId) ? org.plan : "zaak") as PlanId;
  const limits = plans[plan].limits;

  if (org.planStatus === "trialing") {
    const left = days(org.trialEndsAt) ?? 0;
    return {
      active: left > 0, trialing: true, daysLeft: left, plan, limits,
      warning: left <= 0 ? "Je proefperiode is voorbij. Kies een formule om boekingen te blijven ontvangen."
        : left <= 3 ? `Nog ${left} ${left === 1 ? "dag" : "dagen"} proefperiode.` : null,
    };
  }
  if (org.planStatus === "active") {
    return {
      active: true, trialing: false, daysLeft: days(org.planRenewsAt), plan, limits,
      warning: org.planCancelAtPeriodEnd ? "Je abonnement stopt op het einde van deze periode." : null,
    };
  }
  if (org.planStatus === "past_due") {
    // Vanaf de mislukte verlenging krijgt de zaak nog tien dagen om het recht te zetten.
    const left = (days(org.planRenewsAt) ?? 0) + graceDays;
    return { active: left > 0, trialing: false, daysLeft: left, plan, limits, warning: "De laatste betaling is niet gelukt. Werk je betaalgegevens bij." };
  }
  return { active: false, trialing: false, daysLeft: null, plan, limits, warning: "Er loopt geen abonnement. Kies een formule om verder te gaan." };
}
