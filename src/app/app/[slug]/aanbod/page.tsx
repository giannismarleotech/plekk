import { asc, eq } from "drizzle-orm";
import { requireOrgAccess } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { euro, minutesLabel } from "@/lib/format";
import { formatOptions } from "@/lib/options-text";
import { addResource, addOffering, toggleResource, toggleOffering, updateOffering, deleteOffering, updateResource, deleteResource } from "../actions";

export const dynamic = "force-dynamic";

export default async function OfferPage({ params }: PageProps<"/app/[slug]/aanbod">) {
  const { slug } = await params;
  const { org } = (await requireOrgAccess(slug))!;
  const db = await getDb();
  const [resources, offerings] = await Promise.all([
    db.query.resources.findMany({ where: eq(schema.resources.orgId, org.id), orderBy: asc(schema.resources.sortOrder) }),
    db.query.offerings.findMany({ where: eq(schema.offerings.orgId, org.id), orderBy: asc(schema.offerings.sortOrder) }),
  ]);
  const resLabel = org.mode === "salon" ? "Team" : org.mode === "restaurant" ? "Tafels" : "Keuken";
  const offLabel = org.mode === "salon" ? "Diensten" : org.mode === "restaurant" ? "Shifts" : "Menu";
  const m = org.mode;

  const OfferingFields = ({ o }: { o?: typeof offerings[number] }) => (
    <>
      <label className="block"><span className="label">Naam</span><input name="name" defaultValue={o?.name} required className="input" /></label>
      <label className="block"><span className="label">Categorie</span><input name="category" defaultValue={o?.category ?? ""} className="input" placeholder={m === "takeaway" ? "Frieten, Snacks, Dranken…" : m === "salon" ? "Knippen, Kleuren…" : ""} /></label>
      {m === "salon" && <label className="block"><span className="label">Duur (min)</span><input name="durationMin" type="number" min={5} step={5} defaultValue={o?.durationMin ?? 30} className="input" /></label>}
      {m === "restaurant" ? (<><label className="block"><span className="label">Start</span><input name="startTime" defaultValue={o?.startTime ?? ""} placeholder="18:00" className="input font-mono" /></label><label className="block"><span className="label">Einde</span><input name="endTime" defaultValue={o?.endTime ?? ""} placeholder="22:00" className="input font-mono" /></label></>)
        : <label className="block"><span className="label">Prijs (€)</span><input name="price" inputMode="decimal" defaultValue={o ? (o.priceCents / 100).toFixed(2) : ""} className="input" /></label>}
      <label className="block"><span className="label">Volgorde</span><input name="sortOrder" type="number" defaultValue={o?.sortOrder ?? 99} className="input" /></label>
      <label className="block sm:col-span-2"><span className="label">Omschrijving</span><input name="description" defaultValue={o?.description ?? ""} className="input" /></label>
      {m === "takeaway" && (
        <label className="block sm:col-span-2"><span className="label">Opties <span className="font-normal text-muted">— één groep per regel · <code className="font-mono">Naam*</code> = meerdere keuzes · <code className="font-mono">Naam!</code> = verplicht</span></span>
          <textarea name="options" rows={3} defaultValue={o ? formatOptions(o.options) : ""} className="input font-mono text-xs" placeholder={"Saus: Zonder=0, Mayonaise=0.80, Andalouse=0.90\nExtra*: Kaas=0.50, Bacon=0.80"} /></label>
      )}
    </>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        <div><h1 className="text-2xl font-bold">{offLabel}</h1><p className="text-sm text-muted mt-1">{m === "salon" ? "Elke behandeling met duur en prijs. Klik op een dienst om ze aan te passen; 'Verberg' haalt ze tijdelijk van je pagina." : m === "restaurant" ? "Shifts zijn de blokken waarin klanten kunnen reserveren (bv. lunch en diner). Tafels staan rechts." : "Alles wat klanten kunnen bestellen, met prijs en opties. Klik op een product om het aan te passen."}</p></div>
        <div className="card divide-y divide-line">
          {offerings.map((o) => (
            <details key={o.id} className={`group ${o.active ? "" : "opacity-50"}`}>
              <summary className="flex items-center gap-3 px-4 py-2.5 cursor-pointer list-none">
                <span className="flex-1"><span className="font-semibold">{o.name}</span><span className="block text-xs text-muted">{o.category}{o.kind === "shift" ? ` · ${o.startTime}–${o.endTime}` : ""}{o.kind === "service" ? ` · ${minutesLabel(o.durationMin ?? 0)}` : ""}{o.options?.length ? ` · ${o.options.length} optiegroep(en)` : ""}</span></span>
                {o.kind !== "shift" && <span className="tabular text-sm">{euro(o.priceCents)}</span>}
                <span className="text-xs text-muted group-open:rotate-90 transition">▶</span>
              </summary>
              <div className="px-4 pb-4 bg-bg border-t border-line">
                <form action={updateOffering.bind(null, slug, o.id)} className="grid gap-2 sm:grid-cols-2 text-sm pt-3"><OfferingFields o={o} /><div className="sm:col-span-2 flex gap-3 items-center"><button className="btn-brand text-white text-sm">Opslaan</button></div></form>
                <div className="flex gap-3 mt-2 text-xs">
                  <form action={toggleOffering.bind(null, slug, o.id, !o.active)}><button className="underline text-muted">{o.active ? "Verberg voor klanten" : "Terug zichtbaar maken"}</button></form>
                  <form action={deleteOffering.bind(null, slug, o.id)}><button className="underline text-red-700">Verwijder</button></form>
                </div>
              </div>
            </details>
          ))}
        </div>
        <details className="card"><summary className="px-4 py-3 font-bold cursor-pointer list-none">+ Toevoegen</summary>
          <form action={addOffering.bind(null, slug)} className="grid gap-2 sm:grid-cols-2 text-sm px-4 pb-4"><OfferingFields /><div className="sm:col-span-2"><button className="btn-brand text-white text-sm">Toevoegen</button></div></form>
        </details>
      </section>

      <section className="space-y-3">
        <div><h2 className="text-2xl font-bold">{resLabel}</h2><p className="text-sm text-muted mt-1">{m === "salon" ? "Elke medewerker heeft een eigen agenda; klanten kiezen bij wie ze boeken." : m === "restaurant" ? "Plekk wijst elke reservatie automatisch toe aan een vrije tafel die groot genoeg is." : "Hoeveel bestellingen je keuken per tijdslot aankan. Te veel? Verlaag het cijfer."}</p></div>
        <div className="card divide-y divide-line">
          {resources.map((r) => (
            <details key={r.id} className={`group ${r.active ? "" : "opacity-50"}`}>
              <summary className="flex items-center gap-3 px-4 py-2.5 cursor-pointer list-none">
                <span className="flex-1 font-semibold">{r.name}</span>
                <span className="text-sm text-muted tabular">{r.kind === "table" ? `${r.capacity} pl.${r.minParty > 1 ? ` (min. ${r.minParty})` : ""}` : r.kind === "kitchen" ? `${r.capacity} bestellingen / slot` : ""}</span>
                <span className="text-xs text-muted group-open:rotate-90 transition">▶</span>
              </summary>
              <div className="px-4 pb-4 bg-bg border-t border-line">
                <form action={updateResource.bind(null, slug, r.id)} className="grid gap-2 sm:grid-cols-3 text-sm pt-3">
                  <label className="block"><span className="label">Naam</span><input name="name" defaultValue={r.name} className="input" /></label>
                  {r.kind !== "staff" && <label className="block"><span className="label">{r.kind === "table" ? "Zitplaatsen" : "Bestellingen per slot"}</span><input name="capacity" type="number" min={1} defaultValue={r.capacity} className="input" /></label>}
                  {r.kind === "table" && <label className="block"><span className="label">Min. personen</span><input name="minParty" type="number" min={1} defaultValue={r.minParty} className="input" /></label>}
                  <label className="block"><span className="label">Volgorde</span><input name="sortOrder" type="number" defaultValue={r.sortOrder} className="input" /></label>
                  <div className="sm:col-span-3"><button className="btn-brand text-white text-sm">Opslaan</button></div>
                </form>
                <div className="flex gap-3 mt-2 text-xs">
                  <form action={toggleResource.bind(null, slug, r.id, !r.active)}><button className="underline text-muted">{r.active ? "Deactiveer" : "Activeer"}</button></form>
                  {r.kind !== "kitchen" && <form action={deleteResource.bind(null, slug, r.id)}><button className="underline text-red-700">Verwijder</button></form>}
                </div>
              </div>
            </details>
          ))}
        </div>
        {org.mode !== "takeaway" && (
          <details className="card"><summary className="px-4 py-3 font-bold cursor-pointer list-none">+ {org.mode === "salon" ? "Medewerker" : "Tafel"} toevoegen</summary>
            <form action={addResource.bind(null, slug)} className="grid gap-2 sm:grid-cols-3 text-sm px-4 pb-4">
              <input name="name" placeholder="Naam" required className="input" />
              {org.mode === "restaurant" && (<><input name="capacity" type="number" min={1} placeholder="Zitplaatsen" className="input" /><input name="minParty" type="number" min={1} placeholder="Min. personen" className="input" /></>)}
              <div className="sm:col-span-3"><button className="btn-brand text-white text-sm">Toevoegen</button></div>
            </form>
          </details>
        )}
      </section>
    </div>
  );
}
