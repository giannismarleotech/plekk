import { NextResponse } from "next/server";
import { and, eq, gte, lte, isNull, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { sendReminder } from "@/lib/notify";

/**
 * Herinneringen: boekingen die binnen 20–28 uur starten en nog geen herinnering kregen.
 * Roep elk uur aan (Vercel cron / Netlify scheduled function / externe cron) met header `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const db = await getDb();
  const now = Date.now();
  const rows = await db.query.bookings.findMany({
    where: and(gte(schema.bookings.startsAt, new Date(now + 20 * 3600000)), lte(schema.bookings.startsAt, new Date(now + 28 * 3600000)), isNull(schema.bookings.reminderSentAt), inArray(schema.bookings.status, ["confirmed", "requested"])),
    with: { customer: true, resource: true, items: true, org: true }, limit: 200,
  });
  let sent = 0;
  for (const b of rows) {
    try { await sendReminder(b); sent++; } catch (e) { console.error("[reminder]", b.reference, e); }
    await db.update(schema.bookings).set({ reminderSentAt: new Date() }).where(eq(schema.bookings.id, b.id));
  }
  return NextResponse.json({ ok: true, checked: rows.length, sent });
}
