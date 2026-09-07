import { asc, eq, and } from "drizzle-orm";
import { requireOrgAccess } from "@/lib/auth";
import { bookingsOnDay } from "@/lib/bookings";
import { getDb, schema } from "@/db";
import { euro, fmtTime, isoDay } from "@/lib/format";
import { openingBlocks, localToDate } from "@/lib/availability";
import { DayNav } from "@/components/dashboard/DayNav";
import { StatusPill, StatusButtons } from "@/components/dashboard/StatusButtons";
import { ManualBooking } from "@/components/dashboard/ManualBooking";
import { minutesLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgendaPage({ params, searchParams }: PageProps<"/app/[slug]/agenda">) {
  const { slug } = await params;
  const sp = await searchParams;
  const { org } = (await requireOrgAccess(slug))!;
  const today = isoDay(new Date());
  const day = typeof sp.dag === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.dag) ? sp.dag : today;
  const items = await bookingsOnDay(org.id, day);
  const db = await getDb();
  const resources = await db.query.resources.findMany({ where: and(eq(schema.resources.orgId, org.id), eq(schema.resources.active, true)), orderBy: asc(schema.resources.sortOrder) });
  const offerings = await db.query.offerings.findMany({ where: and(eq(schema.offerings.orgId, org.id), eq(schema.offerings.active, true)), orderBy: asc(schema.offerings.sortOrder) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{org.mode === "takeaway" ? "Bestellingen" : "Agenda"}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <DayNav base={`/app/${slug}/agenda`} day={day} today={today} />
          <ManualBooking slug={slug} mode={org.mode} day={day} resources={resources.filter((r) => r.kind !== "kitchen").map((r) => ({ id: r.id, name: r.name, extra: r.kind === "table" ? `${r.capacity} pl.` : undefined }))} offerings={offerings.filter((o) => o.kind === "service").map((o) => ({ id: o.id, name: o.name, extra: minutesLabel(o.durationMin ?? 0) }))} />
        </div>
      </div>
      {org.mode === "salon" && (<>
        <SalonTimeline slug={slug} day={day} staff={resources} items={items} hours={org.openingHours} />
        <AppointmentList slug={slug} items={items} />
      </>)}
      {org.mode === "restaurant" && <ReservationList slug={slug} items={items} />}
      {org.mode === "takeaway" && <OrderList slug={slug} items={items} />}
    </div>
  );
}

type Item = Awaited<ReturnType<typeof bookingsOnDay>>[number];

function SalonTimeline({ slug, day, staff, items, hours }: { slug: string; day: string; staff: schema.Resource[]; items: Item[]; hours: schema.OpeningHours }) {
  const blocks = openingBlocks(hours, day);
  if (!blocks.length) return <p className="text-muted">Gesloten op deze dag{items.length ? ` — toch ${items.length} ${items.length === 1 ? "afspraak" : "afspraken"} ingepland (zie hieronder)` : ""}.</p>;
  const open = localToDate(day, blocks[0].open);
  const close = localToDate(day, blocks[blocks.length - 1].close);
  const totalMin = (close.getTime() - open.getTime()) / 60000;
  const rows = totalMin / 15;
  const ROW = 22; // px per kwartier
  const hourMarks = Array.from({ length: Math.floor(totalMin / 60) + 1 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `56px repeat(${staff.length}, minmax(160px, 1fr))` }}>
        <div />
        {staff.map((s) => <div key={s.id} className="px-2 pb-2 font-bold sticky top-0 bg-bg">{s.name}</div>)}
        <div className="relative" style={{ height: rows * ROW }}>
          {hourMarks.map((h) => <div key={h} className="absolute right-2 text-xs font-mono text-muted -translate-y-1/2" style={{ top: h * 4 * ROW }}>{fmtTime(new Date(open.getTime() + h * 3600000))}</div>)}
        </div>
        {staff.map((s) => (
          <div key={s.id} className="relative border-l border-line" style={{ height: rows * ROW, backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px ${4 * ROW}px)` }}>
            {items.filter((b) => b.resourceId === s.id && b.status !== "cancelled").map((b) => {
              const top = ((b.startsAt.getTime() - open.getTime()) / 60000 / 15) * ROW;
              const h = Math.max(ROW, ((b.endsAt.getTime() - b.startsAt.getTime()) / 60000 / 15) * ROW);
              return (
                <div key={b.id} className={`absolute left-1 right-1 rounded-md border px-2 py-1 text-xs overflow-hidden ${b.status === "no_show" ? "opacity-50 border-dashed" : ""}`} style={{ top, height: h - 2, background: "var(--surface)", borderColor: "var(--brand)", borderLeftWidth: 4 }}>
                  <div className="font-semibold truncate">{fmtTime(b.startsAt)} {b.customer?.name}</div>
                  <div className="truncate text-muted">{b.items.map((i) => i.name).join(", ")}</div>
                  {h > 3 * ROW && <div className="mt-1"><StatusButtons slug={slug} bookingId={b.id} kind={b.kind} status={b.status} /></div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentList({ slug, items }: { slug: string; items: Item[] }) {
  if (!items.length) return <p className="text-sm text-muted">Geen afspraken op deze dag. Klik op “+ Nieuwe afspraak” om er zelf één in te plannen (bv. een telefonische boeking).</p>;
  return (
    <div>
      <h2 className="font-bold mb-2">Afspraken ({items.filter((b) => b.status !== "cancelled").length})</h2>
      <ul className="card divide-y divide-line">
        {items.map((b) => (
          <li key={b.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${b.status === "cancelled" ? "opacity-50" : ""}`}>
            <span className="font-mono font-semibold tabular w-14">{fmtTime(b.startsAt)}</span>
            <span className="flex-1 min-w-[12rem]">
              <span className="font-semibold">{b.customer?.name}</span>
              <span className="block text-sm text-muted">{b.items.map((i) => i.name).join(", ")}{b.resource ? ` · bij ${b.resource.name}` : ""}{b.customer?.phone ? ` · ${b.customer.phone}` : ""}{b.notes ? ` · “${b.notes}”` : ""}</span>
            </span>
            <span className="tabular text-sm">{euro(b.totalCents)}</span>
            <StatusPill status={b.status} />
            <StatusButtons slug={slug} bookingId={b.id} kind={b.kind} status={b.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReservationList({ slug, items }: { slug: string; items: Item[] }) {
  if (!items.length) return <p className="text-muted">Geen reservaties op deze dag. Telefonische reservatie? Klik op “+ Nieuwe reservatie”.</p>;
  const covers = items.filter((b) => !["cancelled", "no_show"].includes(b.status)).reduce((n, b) => n + b.partySize, 0);
  return (
    <div>
      <p className="text-sm text-muted mb-2">{items.length} reservaties · {covers} couverts</p>
      <ul className="card divide-y divide-line">
        {items.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="font-mono font-semibold tabular w-14">{fmtTime(b.startsAt)}</span>
            <span className="w-10 text-center font-bold tabular">{b.partySize}p</span>
            <span className="flex-1 min-w-[12rem]">
              <span className="font-semibold">{b.customer?.name}</span>
              <span className="block text-sm text-muted">{b.resource?.name ?? "Geen tafel"}{b.customer?.phone ? ` · ${b.customer.phone}` : ""}{b.notes ? ` · “${b.notes}”` : ""}</span>
            </span>
            {b.depositCents > 0 && <span className="text-xs text-muted">Waarborg {euro(b.depositCents)} · {b.paymentStatus === "paid" ? "betaald" : "open"}</span>}
            <StatusPill status={b.status} />
            <StatusButtons slug={slug} bookingId={b.id} kind={b.kind} status={b.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderList({ slug, items }: { slug: string; items: Item[] }) {
  if (!items.length) return <p className="text-muted">Geen bestellingen op deze dag. Nieuwe bestellingen verschijnen hier én op het keukenscherm.</p>;
  return (
    <ul className="card divide-y divide-line">
      {items.map((b) => (
        <li key={b.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
          <span className="font-mono font-semibold tabular w-14">{fmtTime(b.startsAt)}</span>
          <span className="flex-1 min-w-[12rem]">
            <span className="font-semibold">{b.customer?.name} <span className="font-mono text-xs text-muted">{b.reference}</span></span>
            <ul className="text-sm text-muted">{b.items.map((i) => <li key={i.id}>{i.quantity}× {i.name}{i.options?.length ? ` (${i.options.map((o) => o.choice).join(", ")})` : ""}</li>)}</ul>
            {b.notes && <span className="block text-sm">“{b.notes}”</span>}
          </span>
          <span className="tabular font-semibold">{euro(b.totalCents)}</span>
          <StatusPill status={b.status} />
          <StatusButtons slug={slug} bookingId={b.id} kind={b.kind} status={b.status} />
        </li>
      ))}
    </ul>
  );
}
