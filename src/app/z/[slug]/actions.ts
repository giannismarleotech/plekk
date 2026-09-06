"use server";

import { z } from "zod";
import { getOrgPublicData, slotsFor, createBooking, type SlotQuery, type CartLine } from "@/lib/bookings";
import { dayList } from "@/lib/availability";

export type SlotDto = { time: string; iso: string; remaining?: number };

export async function fetchDays(slug: string): Promise<string[]> {
  const data = await getOrgPublicData(slug);
  if (!data) return [];
  return dayList(data.org.settings, data.org.openingHours);
}

export async function fetchSlots(slug: string, q: SlotQuery): Promise<SlotDto[]> {
  const data = await getOrgPublicData(slug);
  if (!data) return [];
  const slots = await slotsFor(data.org, data.resources, data.offerings, q);
  const { fmtTime } = await import("@/lib/format");
  return slots.map((s) => ({ time: fmtTime(s.startsAt), iso: s.startsAt.toISOString(), remaining: s.remaining }));
}

const customerSchema = z.object({
  name: z.string().trim().min(2, "Vul je naam in"),
  email: z.string().trim().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Vul je gsm-nummer in"),
});

const submitSchema = z.object({
  slug: z.string(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(500).optional(),
  customer: customerSchema,
  salon: z.object({ offeringId: z.string(), staffId: z.string().nullable().optional() }).optional(),
  restaurant: z.object({ partySize: z.number().int().min(1).max(20) }).optional(),
  takeaway: z.object({ cart: z.array(z.object({ offeringId: z.string(), quantity: z.number().int().min(1).max(50), options: z.array(z.object({ name: z.string(), choice: z.string(), priceCents: z.number() })) })).min(1) }).optional(),
});

export type SubmitInput = z.infer<typeof submitSchema>;

export async function submitBooking(input: SubmitInput): Promise<{ ok: true; reference: string; checkoutUrl: string | null } | { ok: false; error: string }> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" };
  try {
    const d = parsed.data;
    const res = await createBooking({
      slug: d.slug, day: d.day, time: d.time, notes: d.notes,
      customer: { name: d.customer.name, email: d.customer.email || undefined, phone: d.customer.phone },
      salon: d.salon, restaurant: d.restaurant, takeaway: d.takeaway as { cart: CartLine[] } | undefined,
    });
    return { ok: true, reference: res.reference, checkoutUrl: res.checkoutUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Er liep iets mis. Probeer opnieuw." };
  }
}

export async function cancelBooking(slug: string, ref: string) {
  const { cancelByRef } = await import("@/lib/bookings");
  const r = await cancelByRef(slug, ref);
  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/z/${slug}/bevestigd/${ref}`);
  return r;
}
