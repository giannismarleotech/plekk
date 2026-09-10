/**
 * Loopt elke pagina van de site af en meldt wat er stuk is.
 * Draaien met: node scripts/check-site.mjs   (BASE= om een ander adres te testen)
 */
import { readFileSync } from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3600";
const urls = [...readFileSync("public/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname);
let bad = 0;
const stale = ["chatgpt.site", "prototypefase", "in ontwikkeling", "Ontdek het prototype", "Demo beschikbaar"];
for (const u of urls) {
  const r = await fetch(BASE + u, { redirect: "follow" });
  const html = await r.text();
  const problems = [];
  if (r.status !== 200) problems.push(`status ${r.status}`);
  for (const s of stale) if (html.includes(s)) problems.push(`oude tekst: ${s}`);
  if (!html.includes("algemene-voorwaarden") && !html.includes("conditions-generales") && !html.includes("/en/terms/") && !html.includes("/de/agb/")) problems.push("geen link naar voorwaarden");
  if (problems.length) { bad++; console.log(`✗ ${u} — ${problems.join(", ")}`); }
}
console.log(bad ? `\n${bad} van ${urls.length} pagina's met een probleem` : `\nAlle ${urls.length} pagina's in orde.`);
process.exit(bad ? 1 : 0);
