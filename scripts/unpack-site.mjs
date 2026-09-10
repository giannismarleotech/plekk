/**
 * Pakt de marketingsite uit vendor/marketing-site.tar.gz uit in public/.
 *
 * De site is een kant-en-klaar pakket statische bestanden (88 pagina's in nl/fr/en/de,
 * stylesheets, scripts, lettertypes en afbeeldingen). Die staan als één archief in de
 * repo in plaats van als losse bestanden, zodat de geschiedenis overzichtelijk blijft.
 * Draait automatisch vóór elke build (npm "prebuild") en vóór npm run dev.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archive = path.join(root, "vendor", "marketing-site.tar.gz");
const target = path.join(root, "public");

if (!existsSync(archive)) {
  console.warn("[site] vendor/marketing-site.tar.gz ontbreekt — marketingpagina's worden overgeslagen.");
  process.exit(0);
}

mkdirSync(target, { recursive: true });
execFileSync("tar", ["xzf", archive, "-C", target], { stdio: "inherit" });
console.log("[site] marketingsite uitgepakt in public/");
