import type { OfferingOption } from "@/db/schema";

/**
 * Opties als tekst, zodat een frituur ze zonder editor kan intikken. Eén groep per regel:
 *   Saus: Zonder=0, Mayonaise=0.80, Andalouse=0.90
 *   Extra*: Kaas=0.50, Bacon=0.80          ← * = meerdere keuzes mogelijk
 *   Formaat!: Klein=0, Groot=1.50          ← ! = verplicht
 */
export function parseOptions(text: string): OfferingOption[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).flatMap((line) => {
    const m = line.match(/^([^:]+):(.*)$/);
    if (!m) return [];
    let name = m[1].trim(); let multi = false; let required = false;
    if (name.endsWith("*")) { multi = true; name = name.slice(0, -1).trim(); }
    if (name.endsWith("!")) { required = true; name = name.slice(0, -1).trim(); }
    const choices = m[2].split(",").map((c) => c.trim()).filter(Boolean).map((c) => {
      const [cn, price] = c.split("=").map((x) => x.trim());
      return { name: cn, priceCents: Math.round(Number((price ?? "0").replace(",", ".")) * 100) || 0 };
    });
    return choices.length ? [{ name, multi, required, choices }] : [];
  });
}

export function formatOptions(options: OfferingOption[] | null | undefined): string {
  return (options ?? []).map((g) => `${g.name}${g.multi ? "*" : ""}${g.required ? "!" : ""}: ${g.choices.map((c) => `${c.name}=${(c.priceCents / 100).toFixed(2)}`).join(", ")}`).join("\n");
}
