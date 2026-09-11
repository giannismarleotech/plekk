import * as schema from "./schema";
import { migrations } from "./migrations";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { cache } from "react";

export type Db = PostgresJsDatabase<typeof schema>;

/**
 * Eén database-toegang voor het hele platform.
 * - DATABASE_URL gezet  → PostgreSQL (Supabase) via postgres-js
 * - DATABASE_URL leeg   → PGlite: Postgres in-process, bestand in ./.data/ — zero setup voor lokale ontwikkeling
 * Beide draaien exact hetzelfde schema en dezelfde migraties.
 */
const g = globalThis as unknown as { __plekkDb?: Promise<Db>; __plekkBooted?: boolean };

/**
 * Migraties, demozaken en de beheerder: één keer per opgestarte instantie, niet per bezoek.
 * De vlag staat op globalThis — een simpele boolean, geen verbinding, dus die mag van Workers
 * wél over verzoeken heen blijven staan. Elke koude start doet het opnieuw; de stappen zijn
 * allemaal idempotent. Zet AUTO_MIGRATE=false zodra je database ingericht is: dan slaat hij
 * ook die paar controlequeries over.
 */
async function bootstrap(db: Db) {
  if (g.__plekkBooted) return;
  g.__plekkBooted = true;
  try {
    if (process.env.AUTO_MIGRATE !== "false") await runMigrations(db);
    if (process.env.SEED_DEMO !== "false") { const { seedIfEmpty } = await import("./seed"); await seedIfEmpty(db); }
    const { ensureAdmin } = await import("./admin");
    await ensureAdmin(db);
  } catch (e) {
    g.__plekkBooted = false; // mislukt? volgende verzoek mag het opnieuw proberen
    throw e;
  }
}

async function create(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    // max: hoeveel verbindingen één instantie tegelijk openhoudt. Op Supabase' pooler is 5
    // ruim; zet DB_POOL_MAX lager als je database-provider weinig verbindingen toelaat.
    const client = postgres(process.env.DATABASE_URL, { prepare: false, max: Number(process.env.DB_POOL_MAX ?? 5) });
    const db = drizzle(client, { schema });
    await bootstrap(db);
    return db;
  }
  // Vanaf hier: lokale ontwikkeling zonder database-URL. Alles wordt dynamisch geladen —
  // node:fs en PGlite bestaan niet op Cloudflare Workers, en een gewone import bovenaan
  // zou ze mee in de bundel trekken en de deploy laten falen.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { mkdirSync } = await import("node:fs");
  const path = (await import("node:path")).default;
  // Serverless (Netlify, Vercel, Lambda): enkel /tmp is beschrijfbaar. Lokaal: ./.data. Lukt geen van beide: in-memory.
  const serverless = !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const candidates = [process.env.PGLITE_DIR, serverless ? "/tmp/plekk-pglite" : path.join(process.cwd(), ".data", "pglite"), "/tmp/plekk-pglite"].filter(Boolean) as string[];
  let client: InstanceType<typeof PGlite> | null = null;
  for (const dir of candidates) {
    try { mkdirSync(dir, { recursive: true }); client = new PGlite(dir); await client.waitReady; console.log(`[db] PGlite in ${dir}`); break; }
    catch (e) { console.warn(`[db] PGlite kan ${dir} niet gebruiken:`, (e as Error).message); client = null; }
  }
  if (!client) { client = new PGlite(); await client.waitReady; console.warn("[db] PGlite in-memory (data gaat verloren bij herstart)"); }
  const pg = drizzle(client, { schema });
  const db = pg as unknown as Db;
  await bootstrap(db);
  return db;
}

/** Eigen mini-migrator: migraties zitten in de bundel (src/db/migrations.ts), dus geen bestandssysteem nodig. */
async function runMigrations(db: Db) {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "__plekk_migrations" ("name" text PRIMARY KEY, "applied_at" timestamptz DEFAULT now())`);
  const res: unknown = await db.execute(sql`SELECT name FROM "__plekk_migrations"`);
  const rows = (Array.isArray(res) ? res : (res as { rows: unknown[] }).rows) as { name: string }[]; // postgres-js geeft een array, PGlite { rows }
  const done = new Set(rows.map((r) => String(r.name)));
  for (const m of migrations) {
    if (done.has(m.name)) continue;
    for (const st of m.statements) await db.execute(sql.raw(st));
    await db.execute(sql`INSERT INTO "__plekk_migrations" ("name") VALUES (${m.name})`);
  }
}

/**
 * Draaien we op Cloudflare Workers? Daar geldt een harde regel: een netwerkverbinding
 * die tijdens het ene bezoek geopend is, mag bij het volgende bezoek niet hergebruikt
 * worden ("Cannot perform I/O on behalf of a different request"). Eén verbinding voor
 * de hele server — wat op een gewone Node-server juist de bedoeling is — breekt daar dus.
 */
const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

/**
 * Per bezoek één plek om de verbinding in te bewaren. React's cache() geeft binnen
 * hetzelfde verzoek altijd hetzelfde object terug, en bij een volgend verzoek een nieuw —
 * precies wat Workers nodig heeft. De vijf, tien queries van één pagina delen zo toch
 * één verbinding, in plaats van er elk een te openen.
 */
const requestSlot = cache((): { db?: Promise<Db> } => ({}));

export function getDb(): Promise<Db> {
  if (!onWorkers) {
    // Node (lokaal, VPS, Netlify): één verbindingspool voor het hele proces — sneller.
    if (!g.__plekkDb) g.__plekkDb = create();
    return g.__plekkDb;
  }
  const slot = requestSlot();
  if (!slot.db) slot.db = create();
  return slot.db;
}

export { schema };
