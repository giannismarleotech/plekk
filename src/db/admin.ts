import "server-only";
import { eq } from "drizzle-orm";
import type { Db } from "./index";
import * as s from "./schema";
import { id } from "@/lib/ids";
import { hashPassword } from "@/lib/password";

/**
 * Zorgt dat er een platformbeheerder bestaat met het wachtwoord uit de omgeving.
 *
 * Waarom niet gewoon in de seed: die draait enkel bij een lege database. Op een
 * database die al draait wil je ook een wachtwoord kunnen wijzigen — dat doe je
 * hiermee door ADMIN_PASSWORD aan te passen en opnieuw te starten.
 */
export async function ensureAdmin(db: Db) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (password.length < 10) { console.warn("[admin] ADMIN_PASSWORD is korter dan 10 tekens — genegeerd."); return; }

  const hash = hashPassword(password);
  const existing = await db.query.users.findFirst({ where: eq(s.users.email, email) });
  if (existing) {
    await db.update(s.users).set({ passwordHash: hash, isPlatformAdmin: true }).where(eq(s.users.id, existing.id));
    console.log(`[admin] wachtwoord van ${email} bijgewerkt`);
  } else {
    await db.insert(s.users).values({ id: id(), email, name: "Beheerder", passwordHash: hash, isPlatformAdmin: true });
    console.log(`[admin] beheerder ${email} aangemaakt`);
  }
}
