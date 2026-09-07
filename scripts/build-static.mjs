// Statische export van enkel de marketingsite: zet de server-routes tijdelijk opzij, bouwt met output=export, zet ze terug.
import { renameSync, existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
const serverDirs = ["src/app/z", "src/app/app", "src/app/admin", "src/app/login", "src/app/registreren", "src/app/api", "src/proxy.ts"];
mkdirSync(".static-tmp", { recursive: true });
const moved = [];
for (const d of serverDirs) if (existsSync(d)) { const t = `.static-tmp/${d.replace(/\//g, "__")}`; renameSync(d, t); moved.push([d, t]); }
try {
  rmSync("out", { recursive: true, force: true });
  execSync("npx next build", { stdio: "inherit", env: { ...process.env, STATIC_SITE: "1" } });
  writeFileSync("out/.nojekyll", "");
  // 404 → taalkeuze i.p.v. GitHub's standaardpagina
  if (existsSync("out/index.html")) writeFileSync("out/404.html", require_fs("out/index.html"));
  console.log("Statische site staat in ./out");
} finally {
  for (const [d, t] of moved) renameSync(t, d);
  rmSync(".static-tmp", { recursive: true, force: true });
}
function require_fs(p) { return readFileSync(p, "utf8"); }
