import { requireOrgAccess } from "@/lib/auth";
import { bookingsOnDay } from "@/lib/bookings";
import { fmtTime, isoDay } from "@/lib/format";
import { StatusButtons } from "@/components/dashboard/StatusButtons";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";

export const dynamic = "force-dynamic";

/** Keukenscherm (KDS): grote kaarten, drie kolommen, ververst zichzelf. Zet op een tablet in de keuken. */
export default async function KitchenPage({ params }: PageProps<"/app/[slug]/keuken">) {
  const { slug } = await params;
  const { org } = (await requireOrgAccess(slug))!;
  const items = (await bookingsOnDay(org.id, isoDay(new Date()))).filter((b) => b.kind === "order");
  const cols = [["new", "Nieuw"], ["preparing", "In bereiding"], ["ready", "Klaar voor afhaling"]] as const;
  return (
    <div className="space-y-4">
      <AutoRefresh seconds={15} />
      <div className="flex items-baseline justify-between"><h1 className="text-2xl font-bold">Keukenscherm</h1><p className="text-sm text-muted">Ververst elke 15 s</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        {cols.map(([status, label]) => {
          const list = items.filter((b) => b.status === status);
          return (
            <section key={status}>
              <h2 className="font-bold text-lg mb-2">{label} <span className="text-muted font-normal">({list.length})</span></h2>
              <div className="space-y-3">
                {list.length === 0 && <p className="text-sm text-muted">—</p>}
                {list.map((b) => (
                  <article key={b.id} className="card p-4" style={{ borderTop: "4px solid var(--brand)" }}>
                    <div className="flex justify-between items-baseline"><span className="text-2xl font-bold tabular">{fmtTime(b.startsAt)}</span><span className="font-mono text-sm text-muted">{b.reference}</span></div>
                    <p className="font-semibold">{b.customer?.name}</p>
                    <ul className="mt-2 text-lg leading-snug">
                      {b.items.map((i) => <li key={i.id}><span className="font-bold tabular">{i.quantity}×</span> {i.name}{i.options?.length ? <span className="text-muted"> · {i.options.map((o) => o.choice).join(", ")}</span> : null}</li>)}
                    </ul>
                    {b.notes && <p className="mt-2 text-sm rounded bg-amber-50 border border-amber-200 px-2 py-1">“{b.notes}”</p>}
                    <div className="mt-3"><StatusButtons slug={slug} bookingId={b.id} kind="order" status={b.status} size="lg" /></div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
