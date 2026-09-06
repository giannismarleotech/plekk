// Zet drizzle/*.sql om in src/db/migrations.ts zodat migraties in de bundel zitten (geen bestandssysteem nodig op Netlify/Vercel).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
const files = readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort();
const entries = files.map((f) => ({ name: f.replace(/\.sql$/, ""), sql: readFileSync(`drizzle/${f}`, "utf8") }));
const out = `// Gegenereerd door scripts/embed-migrations.mjs — niet handmatig bewerken. Draai \`npm run db:generate\`.
export const migrations: { name: string; statements: string[] }[] = ${JSON.stringify(entries.map((e) => ({ name: e.name, statements: e.sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean) })), null, 2)};
`;
writeFileSync("src/db/migrations.ts", out);
console.log(`migrations.ts: ${entries.length} migratie(s)`);
