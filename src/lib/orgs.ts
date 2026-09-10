/** Zaken aanmaken: defaults per mode, eigenaar-login, koppeling. Gebruikt door /admin. */
import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { id } from "./ids";
import { hashPassword } from "./password";
import type { OpeningHours, OrgSettings } from "@/db/schema";
import { trialDays } from "./plans";

export type Mode = "salon" | "restaurant" | "takeaway";

export const defaultHours: Record<Mode, OpeningHours> = {
  salon: Object.fromEntries([2, 3, 4, 5].map((d) => [String(d), [{ open: "09:00", close: "18:00" }]]).concat([["6", [{ open: "09:00", close: "16:00" }]]])),
  restaurant: Object.fromEntries([3, 4, 5, 6, 0].map((d) => [String(d), [{ open: "12:00", close: "14:30" }, { open: "18:00", close: "22:00" }]])),
  takeaway: Object.fromEntries([2, 3, 4, 5, 6, 0].map((d) => [String(d), [{ open: "11:30", close: "13:30" }, { open: "17:00", close: "21:30" }]])),
};

export const defaultSettings: Record<Mode, OrgSettings> = {
  salon: { slotIntervalMin: 15, leadTimeMin: 60, horizonDays: 42, cancelHoursBefore: 24 },
  restaurant: { slotIntervalMin: 15, leadTimeMin: 30, horizonDays: 60, cancelHoursBefore: 4, maxCoversPerSlot: 12, depositCentsPerPerson: 1000, depositFromPartySize: 6, seatMinutesByParty: [{ upTo: 2, minutes: 90 }, { upTo: 4, minutes: 120 }, { upTo: 99, minutes: 150 }] },
  takeaway: { slotIntervalMin: 15, leadTimeMin: 0, horizonDays: 3, cancelHoursBefore: 1, prepMinutes: 20, maxOrdersPerSlot: 6, prepayRequired: false },
};

export const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function randomPassword() {
  const a = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => a[Math.floor(Math.random() * a.length)]).join("");
}

export async function createOrganisation(input: {
  name: string; slug?: string; mode: Mode; city?: string; address?: string; phone?: string; email?: string; brandColor?: string; locale?: "nl" | "fr" | "en" | "de"; plan?: string;
  owner?: { name: string; email: string; password?: string };
}) {
  const db = await getDb();
  let slug = slugify(input.slug || input.name) || `zaak-${id().slice(0, 6)}`;
  if (await db.query.organisations.findFirst({ where: eq(schema.organisations.slug, slug) })) slug = `${slug}-${id().slice(0, 4)}`;
  const orgId = id();
  await db.insert(schema.organisations).values({
    id: orgId, slug, name: input.name.trim(), mode: input.mode, city: input.city || null, address: input.address || null, phone: input.phone || null, email: input.email || null,
    brandColor: input.brandColor && /^#[0-9a-fA-F]{6}$/.test(input.brandColor) ? input.brandColor : "#0F7A38",
    openingHours: defaultHours[input.mode], settings: defaultSettings[input.mode], plan: input.plan ?? "solo", locale: input.locale ?? "nl",
    // Iedereen start in de proefperiode; de webhook van Stripe zet dit later op "active".
    planStatus: "trialing", trialEndsAt: new Date(Date.now() + trialDays * 86_400_000),
  });
  // standaard-resources zodat de zaak meteen boekbaar is
  if (input.mode === "takeaway") await db.insert(schema.resources).values({ id: id(), orgId, name: "Keuken", kind: "kitchen", capacity: 6, sortOrder: 0 });
  if (input.mode === "salon") await db.insert(schema.resources).values({ id: id(), orgId, name: input.owner?.name?.split(" ")[0] || "Medewerker 1", kind: "staff", capacity: 1, sortOrder: 0 });
  if (input.mode === "restaurant") await db.insert(schema.resources).values([2, 2, 4, 4, 6].map((cap, i) => ({ id: id(), orgId, name: `Tafel ${i + 1}`, kind: "table" as const, capacity: cap, minParty: cap >= 6 ? 4 : 1, sortOrder: i })));
  if (input.mode === "restaurant") await db.insert(schema.offerings).values([
    { id: id(), orgId, kind: "shift", name: "Lunch", startTime: "12:00", endTime: "14:30", priceCents: 0, sortOrder: 0 },
    { id: id(), orgId, kind: "shift", name: "Diner", startTime: "18:00", endTime: "22:00", priceCents: 0, sortOrder: 1 },
  ]);

  let password: string | undefined;
  if (input.owner?.email) {
    const email = input.owner.email.trim().toLowerCase();
    let user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
    if (!user) {
      password = input.owner.password || randomPassword();
      const uid = id();
      await db.insert(schema.users).values({ id: uid, email, name: input.owner.name || input.name, passwordHash: hashPassword(password) });
      user = (await db.query.users.findFirst({ where: eq(schema.users.id, uid) }))!;
    }
    await db.insert(schema.memberships).values({ id: id(), userId: user.id, orgId, role: "owner" });
  }
  return { orgId, slug, password };
}

export async function setUserPassword(userId: string, password: string) {
  const db = await getDb();
  await db.update(schema.users).set({ passwordHash: hashPassword(password) }).where(eq(schema.users.id, userId));
}
