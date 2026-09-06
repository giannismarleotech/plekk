import { requireOrgAccess } from "@/lib/auth";
import { recentCustomers } from "@/lib/bookings";
import { fmtDateShort, euro } from "@/lib/format";
import { StatusPill } from "@/components/dashboard/StatusButtons";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ params }: PageProps<"/app/[slug]/klanten">) {
  const { slug } = await params;
  const { org } = (await requireOrgAccess(slug))!;
  const customers = await recentCustomers(org.id);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Klanten <span className="text-muted font-normal text-lg">({customers.length})</span></h1>
      {customers.length === 0 ? <p className="text-muted">Nog geen klanten. Ze verschijnen hier automatisch bij hun eerste boeking.</p> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs font-mono uppercase tracking-wider text-muted border-b border-line"><th className="px-4 py-2">Naam</th><th className="px-4 py-2">Contact</th><th className="px-4 py-2">Laatste boekingen</th><th className="px-4 py-2 text-right">Besteed</th></tr></thead>
            <tbody className="divide-y divide-line">
              {customers.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="px-4 py-3 font-semibold">{c.name}{c.notes && <span className="block text-xs text-muted font-normal">{c.notes}</span>}</td>
                  <td className="px-4 py-3 text-muted">{c.phone}<br />{c.email}</td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1">{c.bookings.map((b) => <li key={b.id} className="flex gap-2 items-center"><span className="tabular text-muted w-20">{fmtDateShort(b.startsAt)}</span><StatusPill status={b.status} /></li>)}</ul>
                  </td>
                  <td className="px-4 py-3 text-right tabular">{euro(c.bookings.filter((b) => ["completed", "picked_up", "confirmed", "arrived"].includes(b.status)).reduce((n, b) => n + b.totalCents, 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
