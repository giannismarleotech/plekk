import Link from "next/link";
import { requireOrgAccess } from "@/lib/auth";
import { bookingsOnDay, publicUrl } from "@/lib/bookings";
import { euro, fmtTime, isoDay } from "@/lib/format";
import { StatusPill, StatusButtons } from "@/components/dashboard/StatusButtons";

export const dynamic = "force-dynamic";

export default async function TodayPage({ params }: PageProps<"/app/[slug]">) {
  const { slug } = await params;
  const { org } = (await requireOrgAccess(slug))!;
  const today = isoDay(new Date());
  const items = await bookingsOnDay(org.id, today);
  const active = items.filter((b) => !["cancelled", "no_show"].includes(b.status));
  const covers = active.reduce((n, b) => n + b.partySize, 0);
  const revenue = active.reduce((n, b) => n + b.totalCents + b.depositCents, 0);
  const open = active.filter((b) => ["requested", "confirmed", "new", "preparing", "ready"].includes(b.status));
  const now = new Date();
  const next = open.filter((b) => b.startsAt >= now).slice(0, 5);
  const link = publicUrl(slug);

  const stat = org.mode === "salon" ? ["Afspraken vandaag", String(active.length)] : org.mode === "restaurant" ? ["Couverts vandaag", String(covers)] : ["Bestellingen vandaag", String(active.length)];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-muted">Vandaag</p>
        <h1 className="text-3xl font-bold">{org.name}</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={stat[0]} value={stat[1]} />
        <Stat label={org.mode === "takeaway" ? "Nog te bereiden" : "Nog te komen"} value={String(open.filter((b) => b.startsAt >= now || org.mode === "takeaway").length)} />
        <Stat label={org.mode === "restaurant" ? "Waarborgen ontvangen" : "Omzet (geboekt)"} value={euro(org.mode === "restaurant" ? active.reduce((n, b) => n + (b.paymentStatus === "paid" ? b.depositCents : 0), 0) : revenue)} />
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-xl font-bold">Eerstvolgende</h2>
          <Link href={`/app/${slug}/agenda`} className="text-sm underline">Volledige {org.mode === "takeaway" ? "lijst" : "agenda"} →</Link>
        </div>
        {next.length === 0 ? <p className="text-muted">Niets meer gepland voor vandaag.</p> : (
          <ul className="card divide-y divide-line">
            {next.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-mono font-semibold tabular w-14">{fmtTime(b.startsAt)}</span>
                <span className="flex-1 min-w-[10rem]">
                  <span className="font-semibold">{b.customer?.name ?? "Onbekend"}</span>
                  <span className="block text-sm text-muted">{b.kind === "reservation" ? `${b.partySize} pers. · ${b.resource?.name ?? "geen tafel"}` : b.kind === "appointment" ? `${b.items.map((i) => i.name).join(", ")} · ${b.resource?.name ?? ""}` : `${b.items.reduce((n, i) => n + i.quantity, 0)} items · ${euro(b.totalCents)}`}</span>
                </span>
                <StatusPill status={b.status} />
                <StatusButtons slug={slug} bookingId={b.id} kind={b.kind} status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 text-sm">
        <h2 className="font-bold mb-1">Jouw publieke pagina</h2>
        <p className="text-muted">Zet deze link op je Google Bedrijfsprofiel, Instagram en je website. Wij drukken ook de QR- of NFC-kaart voor op de toog.</p>
        <p className="mt-2 font-mono break-all"><a href={link} target="_blank" className="underline">{link}</a></p>
        <p className="mt-2 text-xs text-muted">Nog niet alles ingesteld? <Link href={`/app/${slug}/start`} className="underline">Open het stappenplan</Link>.</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-muted">{label}</p>
      <p className="text-3xl font-bold tabular mt-1">{value}</p>
    </div>
  );
}
