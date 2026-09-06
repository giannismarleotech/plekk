/**
 * De beschikbaarheidsmotor — de kern van Plekk.
 * Pure functies, geen database: openingsuren × resources × bestaande boekingen → vrije slots.
 * Werkt voor de drie modes:
 *  - salon:      een medewerker is `durationMin` lang bezet
 *  - restaurant: een tafel met capaciteit ≥ groepsgrootte is `seatMinutes` bezet, met pacing per slot
 *  - takeaway:   de keuken heeft `maxOrdersPerSlot` per raster-slot, met een bereidingstijd als lead time
 */
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { addMinutes, isBefore, getDay } from "date-fns";
import { site } from "@/config/site";
import type { OpeningHours, OrgSettings, Resource, Booking } from "@/db/schema";

export type Slot = { startsAt: Date; endsAt: Date; resourceIds: string[]; remaining?: number };

export type Busy = Pick<Booking, "resourceId" | "startsAt" | "endsAt" | "partySize" | "status">;

const BLOCKING: ReadonlySet<string> = new Set(["requested", "confirmed", "arrived", "new", "preparing", "ready"]);

/** "2026-09-05" + "09:30" in Europe/Brussels → Date (UTC). */
export function localToDate(day: string, time: string): Date {
  return fromZonedTime(`${day}T${time}:00`, site.timezone);
}

export function weekdayOf(day: string): number {
  return getDay(toZonedTime(localToDate(day, "12:00"), site.timezone));
}

export function openingBlocks(hours: OpeningHours, day: string) {
  return hours[String(weekdayOf(day))] ?? [];
}

export function isOpenOn(hours: OpeningHours, day: string) {
  return openingBlocks(hours, day).length > 0;
}

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => isBefore(aStart, bEnd) && isBefore(bStart, aEnd);

function* rasterSlots(hours: OpeningHours, day: string, intervalMin: number, durationMin: number) {
  for (const block of openingBlocks(hours, day)) {
    const open = localToDate(day, block.open);
    const close = localToDate(day, block.close);
    for (let t = open; !isBefore(close, addMinutes(t, durationMin)); t = addMinutes(t, intervalMin)) {
      yield { startsAt: t, endsAt: addMinutes(t, durationMin) };
    }
  }
}

function earliestAllowed(settings: OrgSettings, now: Date) {
  return addMinutes(now, settings.leadTimeMin ?? 0);
}

/** Salon: slots waarop minstens één (of de gekozen) medewerker vrij is. */
export function salonSlots(args: {
  hours: OpeningHours; settings: OrgSettings; day: string; durationMin: number;
  staff: Resource[]; busy: Busy[]; preferredStaffId?: string | null; now?: Date;
}): Slot[] {
  const now = args.now ?? new Date();
  const min = earliestAllowed(args.settings, now);
  const staff = args.staff.filter((s) => s.active && s.kind === "staff" && (!args.preferredStaffId || s.id === args.preferredStaffId));
  const busy = args.busy.filter((b) => BLOCKING.has(b.status));
  const out: Slot[] = [];
  for (const s of rasterSlots(args.hours, args.day, args.settings.slotIntervalMin, args.durationMin)) {
    if (isBefore(s.startsAt, min)) continue;
    const free = staff.filter((m) => !busy.some((b) => b.resourceId === m.id && overlaps(s.startsAt, s.endsAt, b.startsAt, b.endsAt)));
    if (free.length) out.push({ ...s, resourceIds: free.map((m) => m.id) });
  }
  return out;
}

export function seatMinutes(settings: OrgSettings, partySize: number) {
  const table = settings.seatMinutesByParty ?? [{ upTo: 2, minutes: 90 }, { upTo: 4, minutes: 120 }, { upTo: 99, minutes: 150 }];
  return (table.find((r) => partySize <= r.upTo) ?? table[table.length - 1]).minutes;
}

/** Restaurant: slots waarop een tafel past én de pacing (nieuwe couverts per slot) niet overschreden wordt. */
export function restaurantSlots(args: {
  hours: OpeningHours; settings: OrgSettings; day: string; partySize: number;
  tables: Resource[]; busy: Busy[]; now?: Date;
}): Slot[] {
  const now = args.now ?? new Date();
  const min = earliestAllowed(args.settings, now);
  const minutes = seatMinutes(args.settings, args.partySize);
  const tables = args.tables.filter((t) => t.active && t.kind === "table" && t.capacity >= args.partySize && t.minParty <= args.partySize)
    .sort((a, b) => a.capacity - b.capacity); // kleinste passende tafel eerst
  const busy = args.busy.filter((b) => BLOCKING.has(b.status));
  const pacing = args.settings.maxCoversPerSlot ?? Infinity;
  const out: Slot[] = [];
  for (const s of rasterSlots(args.hours, args.day, args.settings.slotIntervalMin, minutes)) {
    if (isBefore(s.startsAt, min)) continue;
    const coversStartingHere = busy.filter((b) => b.startsAt.getTime() === s.startsAt.getTime()).reduce((n, b) => n + b.partySize, 0);
    if (coversStartingHere + args.partySize > pacing) continue;
    const free = tables.filter((t) => !busy.some((b) => b.resourceId === t.id && overlaps(s.startsAt, s.endsAt, b.startsAt, b.endsAt)));
    if (free.length) out.push({ ...s, resourceIds: free.map((t) => t.id) });
  }
  return out;
}

/** Takeaway: afhaalslots waarop de keuken nog capaciteit heeft. */
export function pickupSlots(args: {
  hours: OpeningHours; settings: OrgSettings; day: string; kitchen: Resource[]; busy: Busy[]; now?: Date;
}): Slot[] {
  const now = args.now ?? new Date();
  const prep = args.settings.prepMinutes ?? 20;
  const min = addMinutes(now, Math.max(prep, args.settings.leadTimeMin ?? 0));
  const kitchen = args.kitchen.find((k) => k.kind === "kitchen" && k.active);
  const cap = args.settings.maxOrdersPerSlot ?? kitchen?.capacity ?? 6;
  const busy = args.busy.filter((b) => BLOCKING.has(b.status));
  const out: Slot[] = [];
  for (const s of rasterSlots(args.hours, args.day, args.settings.slotIntervalMin, args.settings.slotIntervalMin)) {
    if (isBefore(s.startsAt, min)) continue;
    const used = busy.filter((b) => b.startsAt.getTime() === s.startsAt.getTime()).length;
    if (used < cap) out.push({ ...s, resourceIds: kitchen ? [kitchen.id] : [], remaining: cap - used });
  }
  return out;
}

/** Kies de "beste" resource uit een slot: eerste vrije (salon: minst geboekte kan later), tafel: kleinste passende. */
export function pickResource(slot: Slot): string | null {
  return slot.resourceIds[0] ?? null;
}

export function dayList(settings: OrgSettings, hours: OpeningHours, from = new Date()) {
  const days: string[] = [];
  const start = toZonedTime(from, site.timezone);
  for (let i = 0; i < (settings.horizonDays ?? 30); i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (isOpenOn(hours, iso)) days.push(iso);
  }
  return days;
}
