/**
 * Demo-data: een kapsalon, een bistro en een frituur in Deinze, plus één login.
 * Draait automatisch bij een lege database (PGlite) of via `npm run db:seed`.
 */
import type { Db } from "./index";
import * as s from "./schema";
import { id, reference } from "@/lib/ids";
import { hashPassword } from "@/lib/password";
import { localToDate } from "@/lib/availability";
import { isoDay } from "@/lib/format";
import { addMinutes } from "date-fns";
import crypto from "node:crypto";

/** Het account achter de één-klik-demo. Heeft enkel toegang tot de drie demozaken. */
export const DEMO_EMAIL = "demo@plekk.be";

const randomSecret = () => crypto.randomBytes(24).toString("base64url");

const weekdays = (open: string, close: string, days = [1, 2, 3, 4, 5, 6]) =>
  Object.fromEntries(days.map((d) => [String(d), [{ open, close }]])) as s.OpeningHours;

export async function seedIfEmpty(db: Db) {
  const existing = await db.query.organisations.findFirst();
  if (existing) return;
  await seed(db);
}

export async function seed(db: Db) {
  const today = isoDay(new Date());

  // ---- Logins ----
  // Twee aparte accounts, bewust. De demo-login is via /api/demo/login zonder wachtwoord
  // te gebruiken; die mag dus nooit platformbeheerder zijn, anders is iedereen dat.
  const userId = id();
  await db.insert(s.users).values({
    id: userId, email: DEMO_EMAIL, name: "Demo", passwordHash: hashPassword(randomSecret()), isPlatformAdmin: false,
  });

  // De echte beheerder komt uit de omgeving. Zonder ADMIN_PASSWORD krijgt hij een
  // willekeurig wachtwoord: dan bestaat het account wel, maar kan niemand erin.
  const adminEmail = (process.env.ADMIN_EMAIL ?? "giannis@marleo.tech").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  await db.insert(s.users).values({
    id: id(), email: adminEmail, name: "Beheerder", passwordHash: hashPassword(adminPassword || randomSecret()), isPlatformAdmin: true,
  });
  if (!adminPassword) console.warn(`[seed] ADMIN_PASSWORD niet gezet — beheerder ${adminEmail} heeft een willekeurig wachtwoord. Zet ADMIN_PASSWORD en draai opnieuw, of gebruik "wachtwoord vergeten".`);

  // ---- 1. Kapsalon ----
  const salonId = id();
  await db.insert(s.organisations).values({
    id: salonId, slug: "kapsalon-lien", name: "Kapsalon Lien", mode: "salon", plan: "demo",
    tagline: "Knippen, kleuren en verzorgen in hartje Deinze",
    description: "Sinds 2011 in de Tolpoortstraat. Boek online, wij zorgen voor de rest.",
    phone: "+32 9 380 00 00", email: "hallo@kapsalonlien.be", address: "Tolpoortstraat 12", city: "9800 Deinze",
    brandColor: "#B23A5A",
    openingHours: { ...weekdays("09:00", "18:00", [2, 3, 4, 5]), "6": [{ open: "08:30", close: "16:00" }] },
    settings: { slotIntervalMin: 15, leadTimeMin: 60, horizonDays: 42, cancelHoursBefore: 24 },
  });
  const [lien, noor, jef] = ["Lien", "Noor", "Jef"].map((name, i) => ({ id: id(), orgId: salonId, name, kind: "staff" as const, capacity: 1, minParty: 1, active: true, sortOrder: i }));
  await db.insert(s.resources).values([lien, noor, jef]);
  const services = [
    ["Knippen dames", "Knippen", 45, 3800], ["Knippen heren", "Knippen", 30, 2600], ["Knippen kind (-12)", "Knippen", 30, 1900],
    ["Kleuren + knippen", "Kleuren", 120, 9500], ["Balayage", "Kleuren", 150, 14500], ["Brushing", "Styling", 30, 2400], ["Baard trimmen", "Barbier", 20, 1500],
  ].map(([name, category, durationMin, priceCents], i) => ({ id: id(), orgId: salonId, kind: "service" as const, name: String(name), category: String(category), durationMin: Number(durationMin), priceCents: Number(priceCents), active: true, sortOrder: i }));
  await db.insert(s.offerings).values(services);
  const salonCustomers = [["An Vermeulen", "an@example.be", "+32 470 11 22 33"], ["Tom De Smet", "tom@example.be", "+32 471 22 33 44"], ["Sofie Claeys", "sofie@example.be", "+32 472 33 44 55"]]
    .map(([name, email, phone]) => ({ id: id(), orgId: salonId, name, email, phone }));
  await db.insert(s.customers).values(salonCustomers);
  const salonBookings = [
    { staff: lien, cust: salonCustomers[0], svc: services[0], time: "09:30" },
    { staff: lien, cust: salonCustomers[2], svc: services[3], time: "11:00" },
    { staff: noor, cust: salonCustomers[1], svc: services[1], time: "10:00" },
    { staff: jef, cust: salonCustomers[1], svc: services[6], time: "14:00" },
  ];
  for (const b of salonBookings) {
    const startsAt = localToDate(today, b.time);
    const bid = id();
    await db.insert(s.bookings).values({ id: bid, orgId: salonId, kind: "appointment", resourceId: b.staff.id, customerId: b.cust.id, startsAt, endsAt: addMinutes(startsAt, b.svc.durationMin), partySize: 1, status: "confirmed", totalCents: b.svc.priceCents, reference: reference(), source: "online" });
    await db.insert(s.bookingItems).values({ id: id(), bookingId: bid, offeringId: b.svc.id, name: b.svc.name, quantity: 1, unitPriceCents: b.svc.priceCents });
  }

  // ---- 2. Bistro ----
  const bistroId = id();
  await db.insert(s.organisations).values({
    id: bistroId, slug: "bistro-de-leie", name: "Bistro De Leie", mode: "restaurant", plan: "demo",
    tagline: "Seizoenskeuken aan het water", description: "Lunch en diner, woensdag tot zondag. Groepen vanaf 7 personen: bel ons even.",
    phone: "+32 9 386 00 00", email: "info@bistrodeleie.be", address: "Leiedam 3", city: "9800 Deinze", brandColor: "#1F5F4A",
    openingHours: Object.fromEntries([3, 4, 5, 6, 0].map((d) => [String(d), [{ open: "12:00", close: "14:30" }, { open: "18:00", close: "22:00" }]])),
    settings: { slotIntervalMin: 15, leadTimeMin: 30, horizonDays: 60, cancelHoursBefore: 4, maxCoversPerSlot: 12, depositCentsPerPerson: 1000, depositFromPartySize: 6, seatMinutesByParty: [{ upTo: 2, minutes: 90 }, { upTo: 4, minutes: 120 }, { upTo: 99, minutes: 150 }] },
  });
  const tables = [["Tafel 1", 2], ["Tafel 2", 2], ["Tafel 3", 4], ["Tafel 4", 4], ["Tafel 5", 4], ["Tafel 6", 6], ["Tafel 7 (terras)", 4], ["Tafel 8 (terras)", 8]]
    .map(([name, cap], i) => ({ id: id(), orgId: bistroId, name: String(name), kind: "table" as const, capacity: Number(cap), minParty: Number(cap) >= 6 ? 4 : 1, active: true, sortOrder: i }));
  await db.insert(s.resources).values(tables);
  await db.insert(s.offerings).values([
    { id: id(), orgId: bistroId, kind: "shift", name: "Lunch", startTime: "12:00", endTime: "14:30", priceCents: 0, active: true, sortOrder: 0 },
    { id: id(), orgId: bistroId, kind: "shift", name: "Diner", startTime: "18:00", endTime: "22:00", priceCents: 0, active: true, sortOrder: 1 },
  ]);
  const bistroCustomers = [["Familie Peeters", "peeters@example.be", "+32 473 44 55 66"], ["Karel Van Damme", "karel@example.be", "+32 474 55 66 77"], ["Els Maes", "els@example.be", "+32 475 66 77 88"]]
    .map(([name, email, phone]) => ({ id: id(), orgId: bistroId, name, email, phone }));
  await db.insert(s.customers).values(bistroCustomers);
  const bistroBookings = [
    { table: tables[2], cust: bistroCustomers[1], time: "12:30", party: 3, minutes: 120 },
    { table: tables[5], cust: bistroCustomers[0], time: "19:00", party: 6, minutes: 150, notes: "Verjaardag — kaarsje op het dessert graag" },
    { table: tables[0], cust: bistroCustomers[2], time: "19:30", party: 2, minutes: 90 },
  ];
  for (const b of bistroBookings) {
    const startsAt = localToDate(today, b.time);
    await db.insert(s.bookings).values({ id: id(), orgId: bistroId, kind: "reservation", resourceId: b.table.id, customerId: b.cust.id, startsAt, endsAt: addMinutes(startsAt, b.minutes), partySize: b.party, status: "confirmed", notes: b.notes, reference: reference(), source: b.party === 6 ? "phone" : "online", depositCents: b.party >= 6 ? b.party * 1000 : 0, paymentStatus: b.party >= 6 ? "paid" : "none" });
  }

  // ---- 3. Frituur ----
  const frituurId = id();
  await db.insert(s.organisations).values({
    id: frituurId, slug: "frituur-t-hoekske", name: "Frituur 't Hoekske", mode: "takeaway", plan: "demo",
    tagline: "Bestel online, sta niet in de rij", description: "Vers gebakken in ossenvet. Bestel vooraf en kies je afhaalmoment.",
    phone: "+32 9 380 11 11", email: "bestel@thoekske.be", address: "Gentpoortstraat 88", city: "9800 Deinze", brandColor: "#D97706",
    openingHours: Object.fromEntries([2, 3, 4, 5, 6, 0].map((d) => [String(d), [{ open: "11:30", close: "13:30" }, { open: "17:00", close: "21:30" }]])),
    settings: { slotIntervalMin: 15, leadTimeMin: 0, horizonDays: 3, cancelHoursBefore: 1, prepMinutes: 20, maxOrdersPerSlot: 6, prepayRequired: false },
  });
  const kitchen = { id: id(), orgId: frituurId, name: "Keuken", kind: "kitchen" as const, capacity: 6, minParty: 1, active: true, sortOrder: 0 };
  await db.insert(s.resources).values(kitchen);
  const saus: s.OfferingOption = { name: "Saus", multi: false, choices: [{ name: "Zonder", priceCents: 0 }, { name: "Mayonaise", priceCents: 80 }, { name: "Ketchup", priceCents: 80 }, { name: "Andalouse", priceCents: 90 }, { name: "Samurai", priceCents: 90 }, { name: "Stoofvleessaus", priceCents: 250 }] };
  const menu = [
    ["Kleine friet", "Frieten", 320, [saus]], ["Grote friet", "Frieten", 400, [saus]], ["Familiefriet", "Frieten", 750, [saus]],
    ["Frikandel", "Snacks", 260, []], ["Bicky Burger", "Snacks", 450, [{ name: "Extra", multi: true, choices: [{ name: "Kaas", priceCents: 50 }, { name: "Bacon", priceCents: 80 }] }]], ["Boulet", "Snacks", 300, []], ["Kipcorn", "Snacks", 280, []], ["Viandel", "Snacks", 280, []],
    ["Stoofvlees", "Schotels", 850, []], ["Vol-au-vent", "Schotels", 850, []],
    ["Cola 33cl", "Dranken", 220, []], ["Water 50cl", "Dranken", 200, []], ["Jupiler 25cl", "Dranken", 250, []],
  ].map(([name, category, priceCents, options], i) => ({ id: id(), orgId: frituurId, kind: "menu_item" as const, name: String(name), category: String(category), priceCents: Number(priceCents), options: options as s.OfferingOption[], active: true, sortOrder: i }));
  await db.insert(s.offerings).values(menu);
  const frituurCustomers = [["Jonas Verhelst", "jonas@example.be", "+32 476 77 88 99"], ["Marie Dhont", "marie@example.be", "+32 477 88 99 00"]]
    .map(([name, email, phone]) => ({ id: id(), orgId: frituurId, name, email, phone }));
  await db.insert(s.customers).values(frituurCustomers);
  const orders = [
    { cust: frituurCustomers[0], time: "18:15", status: "new" as const, items: [[menu[1], 2, [{ name: "Saus", choice: "Mayonaise", priceCents: 80 }]], [menu[3], 2, []], [menu[10], 2, []]] },
    { cust: frituurCustomers[1], time: "18:30", status: "preparing" as const, items: [[menu[2], 1, [{ name: "Saus", choice: "Stoofvleessaus", priceCents: 250 }]], [menu[4], 2, [{ name: "Extra", choice: "Kaas", priceCents: 50 }]]] },
  ];
  for (const o of orders) {
    const startsAt = localToDate(today, o.time);
    const bid = id();
    const items = o.items.map(([item, qty, opts]) => {
      const it = item as (typeof menu)[number]; const options = opts as { name: string; choice: string; priceCents: number }[];
      const unit = it.priceCents + options.reduce((n, x) => n + x.priceCents, 0);
      return { id: id(), bookingId: bid, offeringId: it.id, name: it.name, quantity: Number(qty), unitPriceCents: unit, options };
    });
    const total = items.reduce((n, i) => n + i.unitPriceCents * i.quantity, 0);
    await db.insert(s.bookings).values({ id: bid, orgId: frituurId, kind: "order", resourceId: kitchen.id, customerId: o.cust.id, startsAt, endsAt: addMinutes(startsAt, 15), partySize: 1, status: o.status, totalCents: total, reference: reference(), source: "online", paymentStatus: "none" });
    await db.insert(s.bookingItems).values(items);
  }

  // Lidmaatschappen (admin ziet alles, maar expliciet koppelen kan ook)
  await db.insert(s.memberships).values([salonId, bistroId, frituurId].map((orgId) => ({ id: id(), userId, orgId, role: "owner" as const })));
}
