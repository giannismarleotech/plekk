/**
 * Server-side services rond organisaties en boekingen.
 * Alles wat een pagina of server action nodig heeft, zonder UI.
 */
import "server-only";
import { and, eq, gte, lt, desc, asc } from "drizzle-orm";
import { addMinutes } from "date-fns";
import { getDb, schema } from "@/db";
import type { Organisation, Resource, Offering, OpeningHours } from "@/db/schema";
import { localToDate, salonSlots, restaurantSlots, pickupSlots, seatMinutes, pickResource, type Slot } from "./availability";
import { id, reference } from "./ids";
import { site } from "@/config/site";
import { headers } from "next/headers";
import { createPayment } from "./payments/mollie";

export async function getOrgBySlug(slug: string) {
  const db = await getDb();
  return db.query.organisations.findFirst({ where: eq(schema.organisations.slug, slug) });
}

export async function getOrgPublicData(slug: string) {
  const db = await getDb();
  const org = await getOrgBySlug(slug);
  if (!org) return null;
  const [res, off] = await Promise.all([
    db.query.resources.findMany({ where: and(eq(schema.resources.orgId, org.id), eq(schema.resources.active, true)), orderBy: asc(schema.resources.sortOrder) }),
    db.query.offerings.findMany({ where: and(eq(schema.offerings.orgId, org.id), eq(schema.offerings.active, true)), orderBy: asc(schema.offerings.sortOrder) }),
  ]);
  return { org, resources: res, offerings: off };
}

/** Boekingen die op een gegeven dag (lokale tijd) starten. */
export async function bookingsOnDay(orgId: string, day: string) {
  const db = await getDb();
  const from = localToDate(day, "00:00");
  const to = addMinutes(from, 24 * 60);
  return db.query.bookings.findMany({
    where: and(eq(schema.bookings.orgId, orgId), gte(schema.bookings.startsAt, from), lt(schema.bookings.startsAt, to)),
    with: { customer: true, resource: true, items: true },
    orderBy: asc(schema.bookings.startsAt),
  });
}

export type SlotQuery =
  | { mode: "salon"; day: string; offeringId: string; staffId?: string | null }
  | { mode: "restaurant"; day: string; partySize: number }
  | { mode: "takeaway"; day: string };

export async function slotsFor(org: Organisation, resources: Resource[], offerings: Offering[], q: SlotQuery): Promise<Slot[]> {
  const busy = await bookingsOnDay(org.id, q.day);
  const hours = org.openingHours as OpeningHours;
  if (q.mode === "salon") {
    const svc = offerings.find((o) => o.id === q.offeringId);
    if (!svc?.durationMin) return [];
    return salonSlots({ hours, settings: org.settings, day: q.day, durationMin: svc.durationMin, staff: resources, busy, preferredStaffId: q.staffId });
  }
  if (q.mode === "restaurant") return restaurantSlots({ hours, settings: org.settings, day: q.day, partySize: q.partySize, tables: resources, busy });
  return pickupSlots({ hours, settings: org.settings, day: q.day, kitchen: resources, busy });
}

async function upsertCustomer(orgId: string, c: { name: string; email?: string | null; phone?: string | null }) {
  const db = await getDb();
  const email = c.email?.trim().toLowerCase() || null;
  if (email) {
    const existing = await db.query.customers.findFirst({ where: and(eq(schema.customers.orgId, orgId), eq(schema.customers.email, email)) });
    if (existing) {
      await db.update(schema.customers).set({ name: c.name, phone: c.phone ?? existing.phone }).where(eq(schema.customers.id, existing.id));
      return existing.id;
    }
  }
  const cid = id();
  await db.insert(schema.customers).values({ id: cid, orgId, name: c.name, email, phone: c.phone ?? null });
  return cid;
}

export type CartLine = { offeringId: string; quantity: number; options: { name: string; choice: string; priceCents: number }[] };

/**
 * Maakt een boeking aan nadat de beschikbaarheid opnieuw gecontroleerd is (race-veilig genoeg voor een kleine zaak;
 * voor hoge volumes: unieke constraint op (resource, starts_at) of een advisory lock).
 */
export async function createBooking(args: {
  slug: string; day: string; time: string; customer: { name: string; email?: string; phone?: string }; notes?: string;
  salon?: { offeringId: string; staffId?: string | null };
  restaurant?: { partySize: number };
  takeaway?: { cart: CartLine[] };
}) {
  const data = await getOrgPublicData(args.slug);
  if (!data) throw new Error("Zaak niet gevonden");
  const { org, resources, offerings } = data;
  const startsAt = localToDate(args.day, args.time);
  const db = await getDb();

  let q: SlotQuery;
  if (org.mode === "salon" && args.salon) q = { mode: "salon", day: args.day, offeringId: args.salon.offeringId, staffId: args.salon.staffId };
  else if (org.mode === "restaurant" && args.restaurant) q = { mode: "restaurant", day: args.day, partySize: args.restaurant.partySize };
  else if (org.mode === "takeaway" && args.takeaway) q = { mode: "takeaway", day: args.day };
  else throw new Error("Ongeldige aanvraag");

  const slots = await slotsFor(org, resources, offerings, q);
  const slot = slots.find((s) => s.startsAt.getTime() === startsAt.getTime());
  if (!slot) throw new Error("Dit tijdstip is net volzet. Kies een ander moment.");

  const customerId = await upsertCustomer(org.id, args.customer);
  const bid = id();
  const ref = reference();

  if (q.mode === "salon" && args.salon) {
    const svc = offerings.find((o) => o.id === args.salon!.offeringId)!;
    await db.insert(schema.bookings).values({
      id: bid, orgId: org.id, kind: "appointment", resourceId: pickResource(slot), customerId, startsAt, endsAt: slot.endsAt,
      partySize: 1, status: "confirmed", notes: args.notes, totalCents: svc.priceCents, reference: ref, source: "online",
    });
    await db.insert(schema.bookingItems).values({ id: id(), bookingId: bid, offeringId: svc.id, name: svc.name, quantity: 1, unitPriceCents: svc.priceCents });
  } else if (q.mode === "restaurant" && args.restaurant) {
    const p = args.restaurant.partySize;
    const deposit = org.settings.depositFromPartySize && p >= org.settings.depositFromPartySize ? (org.settings.depositCentsPerPerson ?? 0) * p : 0;
    await db.insert(schema.bookings).values({
      id: bid, orgId: org.id, kind: "reservation", resourceId: pickResource(slot), customerId, startsAt, endsAt: addMinutes(startsAt, seatMinutes(org.settings, p)),
      partySize: p, status: deposit ? "requested" : "confirmed", notes: args.notes, depositCents: deposit, paymentStatus: deposit ? "pending" : "none", reference: ref, source: "online",
    });
  } else if (q.mode === "takeaway" && args.takeaway) {
    const lines = args.takeaway.cart.map((l) => {
      const item = offerings.find((o) => o.id === l.offeringId);
      if (!item) throw new Error("Onbekend product in bestelling");
      // prijzen van opties server-side herberekenen, nooit vertrouwen op de client
      const options = l.options.map((o) => {
        const grp = item.options?.find((g) => g.name === o.name);
        const ch = grp?.choices.find((c) => c.name === o.choice);
        if (!ch) throw new Error(`Onbekende optie ${o.name}: ${o.choice}`);
        return { name: o.name, choice: o.choice, priceCents: ch.priceCents };
      });
      const unit = item.priceCents + options.reduce((n, o) => n + o.priceCents, 0);
      return { id: id(), bookingId: bid, offeringId: item.id, name: item.name, quantity: Math.max(1, Math.floor(l.quantity)), unitPriceCents: unit, options };
    });
    if (!lines.length) throw new Error("Je winkelmandje is leeg");
    const total = lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);
    await db.insert(schema.bookings).values({
      id: bid, orgId: org.id, kind: "order", resourceId: pickResource(slot), customerId, startsAt, endsAt: slot.endsAt, partySize: 1,
      status: "new", notes: args.notes, totalCents: total, paymentStatus: org.settings.prepayRequired ? "pending" : "none", reference: ref, source: "online",
    });
    await db.insert(schema.bookingItems).values(lines);
  }

  const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, bid), with: { customer: true, resource: true, items: true, org: true } });
  // Betaling nodig? (waarborg of vooraf betalen) → Mollie-checkout, als die geconfigureerd is
  let checkoutUrl: string | null = null;
  if (booking && booking.paymentStatus === "pending") {
    const amount = booking.kind === "order" ? booking.totalCents : booking.depositCents;
    const base = await getBaseUrl();
    try {
      const pay = await createPayment({ bookingId: bid, amountCents: amount, description: `${org.name} ${ref}`, redirectUrl: `${base}/z/${org.slug}/bevestigd/${ref}`, webhookUrl: `${base}/api/webhooks/mollie` });
      if (pay) { checkoutUrl = pay.checkoutUrl; await db.update(schema.bookings).set({ paymentRef: pay.id }).where(eq(schema.bookings.id, bid)); }
    } catch (e) { console.error("[mollie]", e); }
  }
  const { sendBookingConfirmation } = await import("./notify");
  if (booking) void sendBookingConfirmation(booking).catch((e) => console.error("[notify]", e));
  return { id: bid, reference: ref, checkoutUrl };
}

export async function getBookingByRef(slug: string, ref: string) {
  const db = await getDb();
  const org = await getOrgBySlug(slug);
  if (!org) return null;
  return db.query.bookings.findFirst({ where: and(eq(schema.bookings.orgId, org.id), eq(schema.bookings.reference, ref)), with: { customer: true, resource: true, items: true, org: true } });
}

export async function setBookingStatus(orgId: string, bookingId: string, status: schema.BookingStatus) {
  const db = await getDb();
  await db.update(schema.bookings).set({ status }).where(and(eq(schema.bookings.id, bookingId), eq(schema.bookings.orgId, orgId)));
}

export async function recentCustomers(orgId: string) {
  const db = await getDb();
  return db.query.customers.findMany({ where: eq(schema.customers.orgId, orgId), orderBy: desc(schema.customers.createdAt), with: { bookings: { orderBy: desc(schema.bookings.startsAt), limit: 5 } } });
}

export const publicUrl = (slug: string) => process.env.NODE_ENV === "production" ? `https://${slug}.${site.domain}` : `/z/${slug}`;

/** Basis-URL van deze deploy: env PUBLIC_BASE_URL, anders afgeleid van de request. */
export async function getBaseUrl() {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? site.domain;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Klant annuleert zelf, als dat nog mag volgens cancelHoursBefore. */
export async function cancelByRef(slug: string, ref: string): Promise<"ok" | "too_late" | "not_found" | "already"> {
  const b = await getBookingByRef(slug, ref);
  if (!b) return "not_found";
  if (["cancelled", "completed", "picked_up", "no_show"].includes(b.status)) return "already";
  const limit = new Date(b.startsAt.getTime() - (b.org.settings.cancelHoursBefore ?? 0) * 3600000);
  if (new Date() > limit) return "too_late";
  const db = await getDb();
  await db.update(schema.bookings).set({ status: "cancelled" }).where(eq(schema.bookings.id, b.id));
  return "ok";
}

export function canSelfCancel(b: { startsAt: Date; status: string; org: { settings: { cancelHoursBefore: number } } }) {
  if (["cancelled", "completed", "picked_up", "no_show"].includes(b.status)) return false;
  return new Date() <= new Date(b.startsAt.getTime() - (b.org.settings.cancelHoursBefore ?? 0) * 3600000);
}
