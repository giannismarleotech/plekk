import * as schema from "./schema";
import { migrations } from "./migrations";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import path from "node:path";
import { mkdirSync } from "node:fs";

export type Db = PostgresJsDatabase<typeof schema>;

/**
 * Eén database-toegang voor het hele platform.
 * - DATABASE_URL gezet  → PostgreSQL (Supabase) via postgres-js
 * - DATABASE_URL leeg   → PGlite: Postgres in-process, bestand in ./.data/ — zero setup voor lokale ontwikkeling
 * Beide draaien exact hetzelfde schema en dezelfde migraties.
 */
const g = globalThis as unknown as { __plekkDb?: Promise<Db> };

async function create(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 });
    const db = drizzle(client, { schema });
    if (process.env.AUTO_MIGRATE !== "false") await runMigrations(db);
    // Lege database → demozaken + platformlogin aanmaken (SEED_DEMO=false om dat uit te zetten).
    if (process.env.SEED_DEMO !== "false") { const { seedIfEmpty } = await import("./seed"); await seedIfEmpty(db); }
    const { ensureAdmin } = await import("./admin");
    await ensureAdmin(db).catch((e) => console.error("[admin]", e));
    return db;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
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
  await runMigrations(db);
  const { seedIfEmpty } = await import("./seed");
  await seedIfEmpty(db);
  const { ensureAdmin } = await import("./admin");
  await ensureAdmin(db).catch((e) => console.error("[admin]", e));
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

export function getDb(): Promise<Db> {
  if (!g.__plekkDb) g.__plekkDb = create();
  return g.__plekkDb;
}

export { schema };
