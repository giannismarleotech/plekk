"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { requireOrgAccess } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { setBookingStatus } from "@/lib/bookings";
import { id } from "@/lib/ids";
import type { BookingStatus, OpeningHours } from "@/db/schema";
import { parseOptions } from "@/lib/options-text";
import { localToDate } from "@/lib/availability";
import { addMinutes } from "date-fns";
import { reference } from "@/lib/ids";
import { seatMinutes } from "@/lib/availability";
import { hashPassword, verifyPassword } from "@/lib/password";

async function guard(slug: string) {
  const a = await requireOrgAccess(slug);
  if (!a) throw new Error("Geen toegang");
  return a;
}

export async function updateStatus(slug: string, bookingId: string, status: BookingStatus) {
  const { org } = await guard(slug);
  await setBookingStatus(org.id, bookingId, status);
  revalidatePath(`/app/${slug}`, "layout");
}

export async function addResource(slug: string, form: FormData) {
  const { org } = await guard(slug);
  const db = await getDb();
  const kind = org.mode === "salon" ? "staff" : org.mode === "restaurant" ? "table" : "kitchen";
  await db.insert(schema.resources).values({
    id: id(), orgId: org.id, kind, name: String(form.get("name") ?? "").trim() || "Naamloos",
    capacity: Number(form.get("capacity") ?? 1) || 1, minParty: Number(form.get("minParty") ?? 1) || 1, sortOrder: 99,
  });
  revalidatePath(`/app/${slug}/aanbod`);
}

export async function toggleResource(slug: string, resourceId: string, active: boolean) {
  const { org } = await guard(slug);
  const db = await getDb();
  await db.update(schema.resources).set({ active }).where(and(eq(schema.resources.id, resourceId), eq(schema.resources.orgId, org.id)));
  revalidatePath(`/app/${slug}/aanbod`);
}

export async function addOffering(slug: string, form: FormData) {
  const { org } = await guard(slug);
  const db = await getDb();
  const kind = org.mode === "salon" ? "service" : org.mode === "restaurant" ? "shift" : "menu_item";
  const price = Math.round(Number(String(form.get("price") ?? "0").replace(",", ".")) * 100) || 0;
  await db.insert(schema.offerings).values({
    id: id(), orgId: org.id, kind, name: String(form.get("name") ?? "").trim() || "Naamloos", category: String(form.get("category") ?? "").trim() || null,
    description: String(form.get("description") ?? "").trim() || null, durationMin: kind === "service" ? Number(form.get("durationMin") ?? 30) || 30 : null,
    priceCents: price, startTime: kind === "shift" ? String(form.get("startTime") ?? "") || null : null, endTime: kind === "shift" ? String(form.get("endTime") ?? "") || null : null,
    options: kind === "menu_item" ? parseOptions(String(form.get("options") ?? "")) : null, sortOrder: Number(form.get("sortOrder")) || 99,
  });
  revalidatePath(`/z/${slug}`);
  revalidatePath(`/app/${slug}/aanbod`);
}

export async function toggleOffering(slug: string, offeringId: string, active: boolean) {
  const { org } = await guard(slug);
  const db = await getDb();
  await db.update(schema.offerings).set({ active }).where(and(eq(schema.offerings.id, offeringId), eq(schema.offerings.orgId, org.id)));
  revalidatePath(`/app/${slug}/aanbod`);
}

export async function updateSettings(slug: string, form: FormData) {
  const { org } = await guard(slug);
  const db = await getDb();
  const hours: OpeningHours = {};
  for (let d = 0; d < 7; d++) {
    const blocks = [1, 2].map((i) => ({ open: String(form.get(`d${d}_open${i}`) ?? ""), close: String(form.get(`d${d}_close${i}`) ?? "") })).filter((b) => /^\d{2}:\d{2}$/.test(b.open) && /^\d{2}:\d{2}$/.test(b.close) && b.open < b.close);
    if (blocks.length) hours[String(d)] = blocks;
  }
  const num = (k: string, fallback: number) => { const v = Number(form.get(k)); return Number.isFinite(v) && v > 0 ? v : fallback; };
  const s = org.settings;
  await db.update(schema.organisations).set({
    name: String(form.get("name") ?? org.name).trim() || org.name, tagline: String(form.get("tagline") ?? "").trim() || null, description: String(form.get("description") ?? "").trim() || null,
    phone: String(form.get("phone") ?? "").trim() || null, email: String(form.get("email") ?? "").trim() || null, address: String(form.get("address") ?? "").trim() || null, city: String(form.get("city") ?? "").trim() || null,
    brandColor: /^#[0-9a-fA-F]{6}$/.test(String(form.get("brandColor"))) ? String(form.get("brandColor")) : org.brandColor,
    openingHours: hours,
    locale: (["nl", "fr", "en", "de"].includes(String(form.get("locale"))) ? String(form.get("locale")) : org.locale) as "nl" | "fr" | "en" | "de",
    settings: {
      ...s, slotIntervalMin: num("slotIntervalMin", s.slotIntervalMin), leadTimeMin: Number(form.get("leadTimeMin") ?? s.leadTimeMin) || 0, horizonDays: num("horizonDays", s.horizonDays), cancelHoursBefore: Number(form.get("cancelHoursBefore") ?? s.cancelHoursBefore) || 0,
      maxCoversPerSlot: org.mode === "restaurant" ? num("maxCoversPerSlot", s.maxCoversPerSlot ?? 12) : s.maxCoversPerSlot,
      depositFromPartySize: org.mode === "restaurant" ? Number(form.get("depositFromPartySize")) || undefined : s.depositFromPartySize,
      depositCentsPerPerson: org.mode === "restaurant" ? Math.round(Number(String(form.get("depositPerPerson") ?? "0").replace(",", ".")) * 100) || undefined : s.depositCentsPerPerson,
      prepMinutes: org.mode === "takeaway" ? num("prepMinutes", s.prepMinutes ?? 20) : s.prepMinutes,
      maxOrdersPerSlot: org.mode === "takeaway" ? num("maxOrdersPerSlot", s.maxOrdersPerSlot ?? 6) : s.maxOrdersPerSlot,
      prepayRequired: org.mode === "takeaway" ? form.get("prepayRequired") === "on" : s.prepayRequired,
    },
  }).where(eq(schema.organisations.id, org.id));
  revalidatePath(`/app/${slug}`, "layout");
  revalidatePath(`/z/${slug}`);
}

export async function updateOffering(slug: string, offeringId: string, form: FormData) {
  const { org } = await guard(slug);
  const db = await getDb();
  const price = Math.round(Number(String(form.get("price") ?? "0").replace(",", ".")) * 100) || 0;
  await db.update(schema.offerings).set({
    name: String(form.get("name") ?? "").trim() || "Naamloos", category: String(form.get("category") ?? "").trim() || null,
    description: String(form.get("description") ?? "").trim() || null, priceCents: price,
    durationMin: org.mode === "salon" ? Number(form.get("durationMin")) || 30 : null,
    startTime: org.mode === "restaurant" ? String(form.get("startTime") ?? "") || null : null, endTime: org.mode === "restaurant" ? String(form.get("endTime") ?? "") || null : null,
    options: org.mode === "takeaway" ? parseOptions(String(form.get("options") ?? "")) : null,
    sortOrder: Number(form.get("sortOrder")) || 0,
  }).where(and(eq(schema.offerings.id, offeringId), eq(schema.offerings.orgId, org.id)));
  revalidatePath(`/app/${slug}/aanbod`); revalidatePath(`/z/${slug}`);
}

export async function deleteOffering(slug: string, offeringId: string) {
  const { org } = await guard(slug);
  const db = await getDb();
  await db.delete(schema.offerings).where(and(eq(schema.offerings.id, offeringId), eq(schema.offerings.orgId, org.id)));
  revalidatePath(`/app/${slug}/aanbod`); revalidatePath(`/z/${slug}`);
}

export async function updateResource(slug: string, resourceId: string, form: FormData) {
  const { org } = await guard(slug);
  const db = await getDb();
  await db.update(schema.resources).set({
    name: String(form.get("name") ?? "").trim() || "Naamloos", capacity: Number(form.get("capacity")) || 1, minParty: Number(form.get("minParty")) || 1, sortOrder: Number(form.get("sortOrder")) || 0,
  }).where(and(eq(schema.resources.id, resourceId), eq(schema.resources.orgId, org.id)));
  revalidatePath(`/app/${slug}/aanbod`); revalidatePath(`/z/${slug}`);
}

export async function deleteResource(slug: string, resourceId: string) {
  const { org } = await guard(slug);
  const db = await getDb();
  await db.delete(schema.resources).where(and(eq(schema.resources.id, resourceId), eq(schema.resources.orgId, org.id)));
  revalidatePath(`/app/${slug}/aanbod`);
}

/** Manuele boeking vanuit het dashboard (telefoon, walk-in). Geen beschikbaarheidscheck: de zaak beslist zelf. */
export async function createManualBooking(slug: string, form: FormData): Promise<{ ok: boolean; error?: string }> {
  const { org } = await guard(slug);
  const db = await getDb();
  const g = (k: string) => String(form.get(k) ?? "").trim();
  const day = g("day"), time = g("time");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: "Datum of uur ontbreekt" };
  const startsAt = localToDate(day, time);
  const name = g("name") || "Klant"; const phone = g("phone") || null;
  const cid = id();
  await db.insert(schema.customers).values({ id: cid, orgId: org.id, name, phone });
  const bid = id();
  if (org.mode === "salon") {
    const svc = await db.query.offerings.findFirst({ where: and(eq(schema.offerings.id, g("offeringId")), eq(schema.offerings.orgId, org.id)) });
    const dur = svc?.durationMin ?? Number(g("durationMin")) ?? 30;
    await db.insert(schema.bookings).values({ id: bid, orgId: org.id, kind: "appointment", resourceId: g("resourceId") || null, customerId: cid, startsAt, endsAt: addMinutes(startsAt, dur || 30), partySize: 1, status: "confirmed", notes: g("notes") || null, totalCents: svc?.priceCents ?? 0, reference: reference(), source: g("source") || "phone" });
    if (svc) await db.insert(schema.bookingItems).values({ id: id(), bookingId: bid, offeringId: svc.id, name: svc.name, quantity: 1, unitPriceCents: svc.priceCents });
  } else if (org.mode === "restaurant") {
    const p = Number(g("partySize")) || 2;
    await db.insert(schema.bookings).values({ id: bid, orgId: org.id, kind: "reservation", resourceId: g("resourceId") || null, customerId: cid, startsAt, endsAt: addMinutes(startsAt, seatMinutes(org.settings, p)), partySize: p, status: "confirmed", notes: g("notes") || null, reference: reference(), source: g("source") || "phone" });
  } else {
    const kitchen = await db.query.resources.findFirst({ where: and(eq(schema.resources.orgId, org.id), eq(schema.resources.kind, "kitchen")) });
    const total = Math.round(Number(g("total").replace(",", ".")) * 100) || 0;
    await db.insert(schema.bookings).values({ id: bid, orgId: org.id, kind: "order", resourceId: kitchen?.id ?? null, customerId: cid, startsAt, endsAt: addMinutes(startsAt, org.settings.slotIntervalMin), partySize: 1, status: "new", notes: g("notes") || null, totalCents: total, reference: reference(), source: g("source") || "phone" });
    if (g("items")) await db.insert(schema.bookingItems).values({ id: id(), bookingId: bid, name: g("items"), quantity: 1, unitPriceCents: total });
  }
  revalidatePath(`/app/${slug}`, "layout");
  return { ok: true };
}

export async function changePassword(form: FormData): Promise<{ ok: boolean; error?: string }> {
  const { currentUser } = await import("@/lib/auth");
  const user = await currentUser();
  if (!user) return { ok: false, error: "Niet ingelogd" };
  const cur = String(form.get("current") ?? ""), next = String(form.get("next") ?? "");
  if (!verifyPassword(cur, user.passwordHash)) return { ok: false, error: "Huidig wachtwoord klopt niet" };
  if (next.length < 8) return { ok: false, error: "Minstens 8 tekens" };
  const db = await getDb();
  await db.update(schema.users).set({ passwordHash: hashPassword(next) }).where(eq(schema.users.id, user.id));
  return { ok: true };
}
