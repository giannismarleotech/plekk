export type Locale = "nl" | "fr" | "en" | "de";
export const locales: Locale[] = ["nl", "fr", "en", "de"];
export const defaultLocale: Locale = "nl";
export const localeNames: Record<Locale, string> = { nl: "Nederlands", fr: "Français", en: "English", de: "Deutsch" };

export type PageKey = "home" | "how" | "salons" | "restaurants" | "takeaway" | "pricing" | "examples" | "about" | "contact" | "terms" | "privacy";

export type LegalSection = { title: string; body: string[] };

export type Dictionary = {
  slugs: Record<Exclude<PageKey, "home">, string>;
  meta: Record<PageKey, { title: string; description: string }>;
  nav: { how: string; solutions: string; salons: string; restaurants: string; takeaway: string; pricing: string; examples: string; about: string; contact: string; login: string; cta: string; language: string };
  footer: { tagline: string; product: string; company: string; legal: string; terms: string; privacy: string; madeBy: string; noCommission: string };
  common: { perMonth: string; exclVat: string; monthly: string; yearly: string; yearlyNote: string; getStarted: string; seeDemo: string; learnMore: string; bookNow: string; reserve: string; order: string; contactUs: string; readMore: string; founders: string; foundersDesc: string };
  home: {
    eyebrow: string; title: string; titleAccent: string; lede: string;
    stats: { value: string; label: string }[];
    problemTitle: string; problem: { title: string; body: string }[];
    modesTitle: string; modesLede: string;
    modes: { key: "salons" | "restaurants" | "takeaway"; title: string; body: string; bullets: string[] }[];
    demoTitle: string; demoLede: string;
    whyTitle: string; why: { title: string; body: string }[];
    quoteText: string; quoteName: string;
    ctaTitle: string; ctaBody: string;
  };
  mock: {
    salonName: string; service: string; staff: string; anyone: string; pickTime: string; confirm: string; confirmed: string;
    restaurantName: string; guests: string; deposit: string;
    takeawayName: string; items: string[]; total: string; pickup: string; kitchenNew: string; kitchenPrep: string; kitchenReady: string;
    agenda: string; today: string; customers: string; settings: string;
  };
  how: {
    title: string; lede: string;
    steps: { title: string; body: string }[];
    engineTitle: string; engineLede: string; engine: { title: string; body: string }[];
    dashTitle: string; dashLede: string; dash: { title: string; body: string }[];
    techTitle: string; techLede: string; tech: { title: string; body: string }[];
    faqTitle: string; faq: { q: string; a: string }[];
  };
  segments: Record<"salons" | "restaurants" | "takeaway", {
    eyebrow: string; title: string; lede: string;
    pains: { title: string; body: string }[];
    featuresTitle: string; features: { title: string; body: string }[];
    flowTitle: string; flow: string[];
    compareTitle: string; compare: { name: string; price: string; note: string }[];
    ctaTitle: string; ctaBody: string;
  }>;
  pricing: {
    title: string; lede: string;
    tiers: { key: "solo" | "zaak" | "plus"; name: string; monthly: number; yearly: number; tagline: string; features: string[]; popular?: boolean }[];
    allIncluded: string; included: string[];
    addonsTitle: string; addons: { name: string; price: string }[];
    compareTitle: string; compareLede: string; compare: { name: string; segment: string; price: string; note: string }[];
    faqTitle: string; faq: { q: string; a: string }[];
  };
  examples: {
    title: string; lede: string;
    demos: { key: "salons" | "restaurants" | "takeaway"; name: string; slug: string; body: string; cta: string }[];
    screensTitle: string; screens: { title: string; body: string }[];
    embedTitle: string; embedBody: string;
  };
  about: { title: string; lede: string; body: string[]; valuesTitle: string; values: { title: string; body: string }[]; founderTitle: string; founderBody: string };
  contact: { title: string; lede: string; email: string; phone: string; address: string; formName: string; formEmail: string; formBusiness: string; formType: string; formMessage: string; formSend: string; formNote: string; types: string[] };
  demo: { badge: string; banner: string; backToSite: string; dashboardTitle: string; dashboardBody: string; openDashboard: string; tryTitle: string; switchOrg: string; tries: string[] };
  terms: { title: string; updated: string; intro: string; sections: LegalSection[] };
  privacy: { title: string; updated: string; intro: string; sections: LegalSection[] };
};
