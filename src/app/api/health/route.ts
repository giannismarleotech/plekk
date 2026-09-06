import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { count } from "drizzle-orm";

export async function GET() {
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.organisations);
  return NextResponse.json({ ok: true, organisations: n, driver: process.env.DATABASE_URL ? "postgres" : "pglite" });
}
