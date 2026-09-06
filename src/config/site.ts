/**
 * Eén plek voor de merknaam. Omdopen = deze regels aanpassen.
 */
export const site = {
  name: "Plekk",
  tagline: "Boek je plek.",
  domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "plekk.be",
  company: "Marleo",
  companyUrl: "https://marleo.tech",
  supportEmail: "hallo@plekk.be",
  timezone: "Europe/Brussels",
  locale: "nl-BE",
  currency: "EUR",
} as const;

export type Mode = "salon" | "restaurant" | "takeaway";

export const modeLabels: Record<Mode, { noun: string; verb: string; cta: string; description: string }> = {
  salon: { noun: "Afspraak", verb: "Boeken", cta: "Boek een afspraak", description: "Kappers, barbiers, schoonheids- en nagelsalons" },
  restaurant: { noun: "Reservatie", verb: "Reserveren", cta: "Reserveer een tafel", description: "Restaurants, bistro's, brasseries" },
  takeaway: { noun: "Bestelling", verb: "Bestellen", cta: "Bestel om af te halen", description: "Frituren, pizzeria's, pita, takeaway" },
};
