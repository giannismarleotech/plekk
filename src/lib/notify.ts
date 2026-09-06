/**
 * Bevestigingen per e-mail. Met RESEND_API_KEY gaat het via Resend; zonder wordt de mail in de console gelogd.
 * SMS/WhatsApp (Bird/Twilio) komt hier later bij op dezelfde manier.
 */
import "server-only";
import type { Booking, BookingItem, Customer, Organisation, Resource } from "@/db/schema";
import { fmtDateTime, euro } from "./format";
import { site } from "@/config/site";
import { publicStrings } from "@/i18n/public";

type Full = Booking & { customer: Customer | null; resource: Resource | null; items: BookingItem[]; org: Organisation };

export function confirmationText(b: Full) {
  const lines: string[] = [];
  const when = fmtDateTime(b.startsAt, b.org.locale);
  if (b.kind === "appointment") lines.push(`Je afspraak bij ${b.org.name} is bevestigd: ${when}${b.resource ? ` bij ${b.resource.name}` : ""}.`, ...b.items.map((i) => `• ${i.name} — ${euro(i.unitPriceCents)}`));
  if (b.kind === "reservation") lines.push(`Je tafel voor ${b.partySize} bij ${b.org.name} is ${b.status === "requested" ? "aangevraagd" : "bevestigd"}: ${when}.`, b.depositCents ? `Waarborg: ${euro(b.depositCents)} (wordt verrekend op de rekening).` : "");
  if (b.kind === "order") lines.push(`Je bestelling bij ${b.org.name} is ontvangen. Afhalen: ${when}.`, ...b.items.map((i) => `• ${i.quantity}× ${i.name}${i.options?.length ? ` (${i.options.map((o) => o.choice).join(", ")})` : ""} — ${euro(i.unitPriceCents * i.quantity)}`), `Totaal: ${euro(b.totalCents)}${b.paymentStatus === "none" ? " — te betalen bij afhaling" : ""}`);
  const t = publicStrings(b.org.locale);
  const base = process.env.PUBLIC_BASE_URL ?? `https://${site.domain}`;
  lines.push("", `${t.reference}: ${b.reference}`, `${t.manageBooking}: ${base}/z/${b.org.slug}/bevestigd/${b.reference}`, `${b.org.address ?? ""} ${b.org.city ?? ""}`.trim(), b.org.phone ? `${t.changeOrCancel} ${t.call} ${b.org.phone}` : "", "", `${t.poweredBy} ${site.name}`);
  return lines.filter((l) => l !== undefined).join("\n");
}

export async function sendBookingConfirmation(b: Full) {
  const to = b.customer?.email;
  if (!to) return;
  const subject = b.kind === "order" ? `Bestelling ${b.reference} bij ${b.org.name}` : `${b.kind === "appointment" ? "Afspraak" : "Reservatie"} ${b.reference} bij ${b.org.name}`;
  const text = confirmationText(b);
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[mail → ${to}] ${subject}\n${text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM ?? `${site.name} <no-reply@${site.domain}>`, to, subject, text, reply_to: b.org.email ?? undefined }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function sendReminder(b: Full) {
  const to = b.customer?.email;
  if (!to) return;
  const t = publicStrings(b.org.locale);
  const when = fmtDateTime(b.startsAt, b.org.locale);
  const base = process.env.PUBLIC_BASE_URL ?? `https://${site.domain}`;
  const intro = { nl: "Herinnering: morgen", fr: "Rappel : demain", en: "Reminder: tomorrow", de: "Erinnerung: morgen" }[b.org.locale] ?? "Herinnering: morgen";
  const subject = `${intro} · ${b.org.name} · ${when}`;
  const text = [`${intro} — ${b.org.name}`, when, b.kind === "reservation" ? `${b.partySize} ${b.partySize === 1 ? t.person : t.people}` : "", "", `${t.manageBooking}: ${base}/z/${b.org.slug}/bevestigd/${b.reference}`, b.org.phone ? `${t.changeOrCancel} ${t.call} ${b.org.phone}` : "", "", `${t.poweredBy} ${site.name}`].join("\n");
  await deliver(to, subject, text, b.org.email ?? undefined);
}

async function deliver(to: string, subject: string, text: string, replyTo?: string) {
  if (!process.env.RESEND_API_KEY) { console.log(`\n[mail → ${to}] ${subject}\n${text}\n`); return; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM ?? `${site.name} <no-reply@${site.domain}>`, to, subject, text, reply_to: replyTo }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
