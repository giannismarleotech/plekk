import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { requireOrgAccess } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { fmtDateTime } from "@/lib/format";

/** CSV-export van boekingen of klanten van de eigen zaak: /api/export?slug=...&what=bookings|customers */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const slug = u.searchParams.get("slug") ?? ""; const what = u.searchParams.get("what") ?? "bookings";
  const access = await requireOrgAccess(slug);
  if (!access) return NextResponse.json({ ok: false }, { status: 403 });
  const db = await getDb();
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  let rows: string[][];
  if (what === "customers") {
    const cs = await db.query.customers.findMany({ where: eq(schema.customers.orgId, access.org.id), orderBy: asc(schema.customers.createdAt) });
    rows = [["naam", "email", "gsm", "notities", "sinds"], ...cs.map((c) => [c.name, c.email ?? "", c.phone ?? "", c.notes ?? "", c.createdAt.toISOString().slice(0, 10)])];
  } else {
    const bs = await db.query.bookings.findMany({ where: eq(schema.bookings.orgId, access.org.id), orderBy: asc(schema.bookings.startsAt), with: { customer: true, resource: true, items: true } });
    rows = [["referentie", "wanneer", "soort", "status", "klant", "gsm", "email", "personen", "resource", "items", "totaal", "waarborg", "betaling", "bron", "opmerking"],
      ...bs.map((b) => [b.reference, fmtDateTime(b.startsAt), b.kind, b.status, b.customer?.name ?? "", b.customer?.phone ?? "", b.customer?.email ?? "", String(b.partySize), b.resource?.name ?? "", b.items.map((i) => `${i.quantity}× ${i.name}`).join("; "), (b.totalCents / 100).toFixed(2), (b.depositCents / 100).toFixed(2), b.paymentStatus, b.source, b.notes ?? ""])];
  }
  const csv = "﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="plekk-${slug}-${what}.csv"` } });
}
