import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createSession } from "@/lib/auth";

/** Eén-klik-demo: logt in als de demo-eigenaar en stuurt door naar het dashboard van een demozaak. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/app";
  const safeNext = next.startsWith("/app") ? next : "/app";
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, "demo@plekk.be") });
  if (!user) return NextResponse.redirect(new URL("/login", url));
  await createSession(user.id);
  return NextResponse.redirect(new URL(safeNext, url));
}
