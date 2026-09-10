/**
 * De drie Plekk-pakketten: namen, prijzen, grenzen en wat erin zit.
 *
 * Geen "server-only": deze lijst staat ook gewoon op de publieke prijzenpagina.
 * De koppeling met Stripe (prijs-id's, betaalpagina's) zit in payments/stripe.ts.
 */

export type PlanId = "solo" | "zaak" | "zaak_plus";
export type Interval = "month" | "year";

export type Plan = {
  id: PlanId;
  name: string;
  /** Bedragen in cent, exclusief btw. Jaarlijks = tien maanden voor twaalf. */
  monthCents: number;
  yearCents: number;
  /** Namen van de omgevingsvariabelen met de Stripe-prijs-id's. */
  priceEnv: Record<Interval, string>;
  limits: { staff: number | null };
  features: string[];
};

export const plans: Record<PlanId, Plan> = {
  solo: {
    id: "solo", name: "Solo", monthCents: 1900, yearCents: 19000,
    priceEnv: { month: "STRIPE_PRICE_SOLO_MONTH", year: "STRIPE_PRICE_SOLO_YEAR" },
    limits: { staff: 1 },
    features: ["Eén agenda", "Online boekingspagina", "Bevestigingen per e-mail", "Herinnering de dag ervoor"],
  },
  zaak: {
    id: "zaak", name: "Zaak", monthCents: 3900, yearCents: 39000,
    priceEnv: { month: "STRIPE_PRICE_ZAAK_MONTH", year: "STRIPE_PRICE_ZAAK_YEAR" },
    limits: { staff: 8 },
    features: ["Tot 8 medewerkers of tafels", "Klantenbestand", "Rapporten", "Waarborg en vooraf betalen", "Eigen kleuren en logo"],
  },
  zaak_plus: {
    id: "zaak_plus", name: "Zaak+", monthCents: 6900, yearCents: 69000,
    priceEnv: { month: "STRIPE_PRICE_ZAAK_PLUS_MONTH", year: "STRIPE_PRICE_ZAAK_PLUS_YEAR" },
    limits: { staff: null },
    features: ["Onbeperkt medewerkers, tafels of keukens", "Meerdere vestigingen", "Eigen domeinnaam", "Voorrang bij ondersteuning"],
  },
};

export const planOrder: PlanId[] = ["solo", "zaak", "zaak_plus"];

/** Vaste prijs-id's van het Plekk-account, als terugval zonder omgevingsvariabelen. */
export const fallbackPrices: Record<PlanId, Record<Interval, string>> = {
  solo: { month: "price_1UDpHcV0597wqSG3MtIJ6GYu", year: "price_1UDpIQV0597wqSG370REFsnr" },
  zaak: { month: "price_1UDpHvV0597wqSG3m1a7NoTo", year: "price_1UDpIaV0597wqSG3Hh8SBKjd" },
  zaak_plus: { month: "price_1UDpI5V0597wqSG3SwcPQ0f7", year: "price_1UDpIkV0597wqSG3qXQXu0nw" },
};

export function priceIdFor(plan: PlanId, interval: Interval): string {
  return process.env[plans[plan].priceEnv[interval]] || fallbackPrices[plan][interval];
}

export function planFromPriceId(priceId: string): PlanId | null {
  for (const p of planOrder) {
    for (const i of ["month", "year"] as Interval[]) if (priceIdFor(p, i) === priceId) return p;
  }
  return null;
}

/** Aantal gratis proefdagen voor een nieuwe zaak. */
export const trialDays = Number(process.env.STRIPE_TRIAL_DAYS ?? 14);
