import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getPayment } from "@/lib/payments/mollie";

/** Mollie roept dit aan bij elke statuswijziging; wij halen de status zelf op (nooit vertrouwen op de body). */
export async function POST(req: Request) {
  const form = await req.formData();
  const paymentId = String(form.get("id") ?? "");
  if (!paymentId) return NextResponse.json({ ok: false }, { status: 400 });
  const p = await getPayment(paymentId);
  const bookingId = p?.metadata?.bookingId;
  if (!p || !bookingId) return NextResponse.json({ ok: true });
  const db = await getDb();
  const paid = p.status === "paid";
  await db.update(schema.bookings).set({
    paymentStatus: paid ? "paid" : p.status === "open" ? "pending" : "failed", paymentRef: p.id,
    ...(paid ? { status: "confirmed" as const } : {}),
  }).where(eq(schema.bookings.id, bookingId));
  return NextResponse.json({ ok: true });
}
