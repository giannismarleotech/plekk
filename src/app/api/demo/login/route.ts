import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createSession } from "@/lib/auth";
import { DEMO_EMAIL } from "@/db/seed";

/** Eén-klik-demo: logt in als de demo-eigenaar en stuurt door naar het dashboard van een demozaak. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/app";
  const safeNext = next.startsWith("/app") ? next : "/app";
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, DEMO_EMAIL) });
  // Extra slot op de deur: dit account mag nooit beheerder zijn, want hier komt men zonder wachtwoord binnen.
  if (!user || user.isPlatformAdmin) return NextResponse.redirect(new URL("/login", url));
  await createSession(user.id);
  return NextResponse.redirect(new URL(safeNext, url));
}
