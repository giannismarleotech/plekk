"use client";

import { useTransition } from "react";
import { updateStatus } from "@/app/app/[slug]/actions";
import type { BookingStatus } from "@/db/schema";

const FLOWS: Record<"appointment" | "reservation" | "order", { status: BookingStatus; label: string; from: BookingStatus[] }[]> = {
  appointment: [
    { status: "confirmed", label: "Bevestig", from: ["requested"] },
    { status: "arrived", label: "Aangekomen", from: ["confirmed"] },
    { status: "completed", label: "Afgerond", from: ["arrived", "confirmed"] },
    { status: "no_show", label: "No-show", from: ["confirmed"] },
    { status: "cancelled", label: "Annuleer", from: ["requested", "confirmed"] },
  ],
  reservation: [
    { status: "confirmed", label: "Bevestig", from: ["requested"] },
    { status: "arrived", label: "Aan tafel", from: ["confirmed"] },
    { status: "completed", label: "Vertrokken", from: ["arrived"] },
    { status: "no_show", label: "No-show", from: ["confirmed"] },
    { status: "cancelled", label: "Annuleer", from: ["requested", "confirmed"] },
  ],
  order: [
    { status: "preparing", label: "In bereiding", from: ["new"] },
    { status: "ready", label: "Klaar", from: ["preparing", "new"] },
    { status: "picked_up", label: "Afgehaald", from: ["ready"] },
    { status: "cancelled", label: "Annuleer", from: ["new", "preparing"] },
  ],
};

export const statusLabel: Record<BookingStatus, string> = {
  requested: "Aangevraagd", confirmed: "Bevestigd", arrived: "Aanwezig", completed: "Afgerond", no_show: "No-show", cancelled: "Geannuleerd",
  new: "Nieuw", preparing: "In bereiding", ready: "Klaar", picked_up: "Afgehaald",
};

export const statusTone: Record<BookingStatus, string> = {
  requested: "bg-amber-100 text-amber-900", confirmed: "bg-emerald-100 text-emerald-900", arrived: "bg-sky-100 text-sky-900", completed: "bg-neutral-200 text-neutral-700",
  no_show: "bg-red-100 text-red-900", cancelled: "bg-neutral-200 text-neutral-500 line-through", new: "bg-amber-100 text-amber-900", preparing: "bg-sky-100 text-sky-900", ready: "bg-emerald-100 text-emerald-900", picked_up: "bg-neutral-200 text-neutral-700",
};

export function StatusPill({ status }: { status: BookingStatus }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone[status]}`}>{statusLabel[status]}</span>;
}

export function StatusButtons({ slug, bookingId, kind, status, size = "sm" }: { slug: string; bookingId: string; kind: "appointment" | "reservation" | "order"; status: BookingStatus; size?: "sm" | "lg" }) {
  const [pending, start] = useTransition();
  const next = FLOWS[kind].filter((f) => f.from.includes(status));
  if (!next.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {next.map((f) => (
        <button key={f.status} disabled={pending} onClick={() => start(() => updateStatus(slug, bookingId, f.status))}
          className={`rounded-md border font-semibold disabled:opacity-50 ${size === "lg" ? "px-4 py-2 text-base" : "px-2 py-1 text-xs"} ${f.status === "cancelled" || f.status === "no_show" ? "border-line text-muted hover:bg-bg" : "border-transparent text-white"}`}
          style={f.status === "cancelled" || f.status === "no_show" ? undefined : { background: "var(--brand)" }}>
          {f.label}
        </button>
      ))}
    </div>
  );
}
