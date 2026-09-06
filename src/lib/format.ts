import { site } from "@/config/site";
import { formatInTimeZone } from "date-fns-tz";
import { nl, fr, enGB, de } from "date-fns/locale";
const locales = { nl, fr, en: enGB, de } as const;
const loc = (l?: string) => locales[(l as keyof typeof locales) ?? "nl"] ?? nl;
const atWord = (l?: string) => ({ nl: "om", fr: "à", en: "at", de: "um" }[(l as string) ?? "nl"] ?? "om");

export const euro = (cents: number) =>
  new Intl.NumberFormat(site.locale, { style: "currency", currency: site.currency }).format(cents / 100);

export const fmtTime = (d: Date) => formatInTimeZone(d, site.timezone, "HH:mm");
export const fmtDate = (d: Date, l?: string) => formatInTimeZone(d, site.timezone, "EEEE d MMMM", { locale: loc(l) });
export const fmtDateShort = (d: Date, l?: string) => formatInTimeZone(d, site.timezone, "EEE d MMM", { locale: loc(l) });
export const fmtDateTime = (d: Date, l?: string) => formatInTimeZone(d, site.timezone, `EEEE d MMMM '${atWord(l)}' HH:mm`, { locale: loc(l) });
export const isoDay = (d: Date) => formatInTimeZone(d, site.timezone, "yyyy-MM-dd");

export const weekdayNames = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

export const minutesLabel = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}u${min % 60 ? String(min % 60).padStart(2, "0") : ""}` : `${min} min`);
