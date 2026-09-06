import type { MetadataRoute } from "next";
import { locales, getDictionary, href, type PageKey } from "@/i18n";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${site.domain}`;
  const keys: PageKey[] = ["home", "how", "salons", "restaurants", "takeaway", "pricing", "examples", "about", "contact", "terms", "privacy"];
  return keys.flatMap((k) => locales.map((l) => ({
    url: base + href(l, k), lastModified: new Date(), changeFrequency: "monthly" as const, priority: k === "home" ? 1 : k === "pricing" ? 0.9 : 0.7,
    alternates: { languages: Object.fromEntries(locales.map((x) => [x, base + href(x, k)])) },
  })));
}

