import { and, eq, gte, lt } from "drizzle-orm";
import { requireOrgAccess } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { euro, isoDay } from "@/lib/format";
import { localToDate } from "@/lib/availability";
import { addMinutes } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

/** Maandrapport: boekingen, no-shows, omzet, drukste dagen/uren, bron. Bewust simpel — cijfers die een zaak echt gebruikt. */
export default async function ReportsPage({ params, searchParams }: PageProps<"/app/[slug]/rapporten">) {
  const { slug } = await params;
  const sp = await searchParams;
  const { org } = (await requireOrgAccess(slug))!;
  const today = isoDay(new Date());
  const month = typeof sp.maand === "string" && /^\d{4}-\d{2}$/.test(sp.maand) ? sp.maand : today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const from = localToDate(`${month}-01`, "00:00");
  const nextMonth = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
  const to = localToDate(`${nextMonth}-01`, "00:00");
  const prev = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
  const db = await getDb();
  const rows = await db.query.bookings.findMany({ where: and(eq(schema.bookings.orgId, org.id), gte(schema.bookings.startsAt, from), lt(schema.bookings.startsAt, to)), with: { items: true } });

  const active = rows.filter((b) => b.status !== "cancelled");
  const done = rows.filter((b) => ["completed", "picked_up", "arrived", "confirmed"].includes(b.status));
  const noShows = rows.filter((b) => b.status === "no_show").length;
  const cancelled = rows.filter((b) => b.status === "cancelled").length;
  const revenue = done.reduce((n, b) => n + b.totalCents, 0);
  const deposits = rows.filter((b) => b.paymentStatus === "paid").reduce((n, b) => n + b.depositCents, 0);
  const covers = active.reduce((n, b) => n + b.partySize, 0);
  const bySource = count(active.map((b) => b.source));
  const byWeekday = count(active.map((b) => new Date(b.startsAt).toLocaleDateString("nl-BE", { weekday: "long", timeZone: "Europe/Brussels" })));
  const byHour = count(active.map((b) => new Date(b.startsAt).toLocaleTimeString("nl-BE", { hour: "2-digit", timeZone: "Europe/Brussels" }) + "u"));
  const byItem = count(active.flatMap((b) => b.items.flatMap((i) => Array(i.quantity).fill(i.name))));
  const newCustomers = new Set(active.map((b) => b.customerId)).size;
  void addMinutes;

  const label = new Date(`${month}-01T12:00:00`).toLocaleDateString("nl-BE", { month: "long", year: "numeric" });
  const unit = org.mode === "salon" ? "afspraken" : org.mode === "restaurant" ? "reservaties" : "bestellingen";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Rapporten</h1>
        <div className="flex items-center gap-2"><Link href={`?maand=${prev}`} className="btn-ghost px-3 py-1.5">‹</Link><span className="font-bold capitalize min-w-[11ch] text-center">{label}</span><Link href={`?maand=${nextMonth}`} className="btn-ghost px-3 py-1.5">›</Link></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={unit} value={String(active.length)} sub={org.mode === "restaurant" ? `${covers} couverts` : `${newCustomers} klanten`} />
        <Stat label={org.mode === "takeaway" ? "Omzet bestellingen" : "Omzet (geboekt)"} value={euro(revenue)} sub={deposits ? `+ ${euro(deposits)} waarborgen` : ""} />
        <Stat label="No-shows" value={String(noShows)} sub={active.length ? `${Math.round((noShows / (active.length + noShows)) * 100)}% van het totaal` : ""} tone={noShows ? "warn" : "ok"} />
        <Stat label="Geannuleerd" value={String(cancelled)} sub={`${bySource.online ?? 0} online · ${bySource.phone ?? 0} telefoon · ${bySource.walkin ?? 0} toog`} />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Bars title="Drukste dagen" data={byWeekday} />
        <Bars title="Drukste uren" data={byHour} sortKeys />
        <Bars title={org.mode === "takeaway" ? "Meest besteld" : "Populairste behandelingen"} data={byItem} top={8} />
      </div>
      <p className="text-sm text-muted">Export van alle boekingen en klanten als CSV: <a className="underline" href={`/api/export?slug=${slug}&what=bookings`}>boekingen</a> · <a className="underline" href={`/api/export?slug=${slug}&what=customers`}>klanten</a></p>
    </div>
  );
}

function count(xs: string[]) { const m: Record<string, number> = {}; for (const x of xs) m[x] = (m[x] ?? 0) + 1; return m; }

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "ok" | "warn" }) {
  return <div className="card p-4"><p className="text-xs font-mono uppercase tracking-wider text-muted">{label}</p><p className="text-3xl font-bold tabular mt-1" style={tone === "warn" ? { color: "#B23A3A" } : undefined}>{value}</p>{sub && <p className="text-xs text-muted mt-1">{sub}</p>}</div>;
}

function Bars({ title, data, top = 7, sortKeys }: { title: string; data: Record<string, number>; top?: number; sortKeys?: boolean }) {
  const entries = Object.entries(data).sort((a, b) => (sortKeys ? a[0].localeCompare(b[0]) : b[1] - a[1])).slice(0, top);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  return (
    <div className="card p-4">
      <p className="font-bold mb-3">{title}</p>
      {entries.length === 0 ? <p className="text-sm text-muted">Nog geen gegevens.</p> : (
        <ul className="space-y-2 text-sm">{entries.map(([k, v]) => <li key={k} className="grid grid-cols-[7rem_1fr_2rem] gap-2 items-center"><span className="truncate capitalize">{k}</span><span className="h-2.5 rounded-full bg-bg overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: "var(--brand)" }} /></span><span className="tabular text-right text-muted">{v}</span></li>)}</ul>
      )}
    </div>
  );
}
