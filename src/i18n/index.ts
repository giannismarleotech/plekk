import type { Dictionary, Locale, PageKey } from "./types";
import { locales, defaultLocale } from "./types";
import nl from "./dictionaries/nl";
import fr from "./dictionaries/fr";
import en from "./dictionaries/en";
import de from "./dictionaries/de";

export * from "./types";

const dictionaries: Record<Locale, Dictionary> = { nl, fr, en, de };

export const isLocale = (x: string): x is Locale => (locales as string[]).includes(x);
export const getDictionary = (locale: Locale) => dictionaries[locale] ?? dictionaries[defaultLocale];

/** URL voor een pagina in een taal: href("fr","pricing") → /fr/tarifs */
export function href(locale: Locale, page: PageKey) {
  if (page === "home") return `/${locale}`;
  return `/${locale}/${getDictionary(locale).slugs[page]}`;
}

/** Slug → paginasleutel, of null. */
export function resolvePage(locale: Locale, slug: string): Exclude<PageKey, "home"> | null {
  const s = getDictionary(locale).slugs;
  const hit = (Object.keys(s) as Exclude<PageKey, "home">[]).find((k) => s[k] === slug);
  return hit ?? null;
}

/** Alle (locale, slug)-combinaties voor statische generatie. */
export function allPageParams() {
  return locales.flatMap((lang) => Object.values(getDictionary(lang).slugs).map((page) => ({ lang, page })));
}

/** hreflang-alternates voor dezelfde pagina in elke taal. */
export function alternates(page: PageKey) {
  return Object.fromEntries(locales.map((l) => [l, href(l, page)]));
}
