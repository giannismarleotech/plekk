"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManualBooking } from "@/app/app/[slug]/actions";

type Opt = { id: string; name: string; extra?: string };

/** "Nieuwe boeking"-knop in de agenda: telefoon of walk-in snel ingeven. */
export function ManualBooking({ slug, mode, day, resources, offerings }: { slug: string; mode: "salon" | "restaurant" | "takeaway"; day: string; resources: Opt[]; offerings: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const label = mode === "salon" ? "Nieuwe afspraak" : mode === "restaurant" ? "Nieuwe reservatie" : "Nieuwe bestelling";
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await createManualBooking(slug, fd);
      if (r.ok) { setOpen(false); setErr(null); router.refresh(); } else setErr(r.error ?? "Mislukt");
    });
  }
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-brand text-white text-sm">+ {label}</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="card p-5 w-full max-w-lg grid gap-3 text-sm">
            <h3 className="text-lg font-bold">{label} <span className="text-muted font-normal">(telefoon / walk-in)</span></h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="label">Dag</span><input name="day" type="date" defaultValue={day} required className="input" /></label>
              <label className="block"><span className="label">Uur</span><input name="time" type="time" step={900} required className="input" /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="label">Naam</span><input name="name" required className="input" /></label>
              <label className="block"><span className="label">Gsm</span><input name="phone" className="input" /></label>
            </div>
            {mode === "salon" && (<div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="label">Behandeling</span><select name="offeringId" className="input">{offerings.map((o) => <option key={o.id} value={o.id}>{o.name}{o.extra ? ` · ${o.extra}` : ""}</option>)}</select></label>
              <label className="block"><span className="label">Bij wie</span><select name="resourceId" className="input"><option value="">—</option>{resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
            </div>)}
            {mode === "restaurant" && (<div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="label">Personen</span><input name="partySize" type="number" min={1} defaultValue={2} className="input" /></label>
              <label className="block"><span className="label">Tafel</span><select name="resourceId" className="input"><option value="">automatisch later</option>{resources.map((r) => <option key={r.id} value={r.id}>{r.name}{r.extra ? ` · ${r.extra}` : ""}</option>)}</select></label>
            </div>)}
            {mode === "takeaway" && (<div className="grid grid-cols-[1fr_120px] gap-3">
              <label className="block"><span className="label">Bestelling</span><input name="items" placeholder="2× grote friet, 1× bicky" className="input" /></label>
              <label className="block"><span className="label">Totaal (€)</span><input name="total" inputMode="decimal" className="input" /></label>
            </div>)}
            <label className="block"><span className="label">Opmerking</span><input name="notes" className="input" /></label>
            <label className="block"><span className="label">Bron</span><select name="source" className="input"><option value="phone">Telefoon</option><option value="walkin">Aan de toog</option></select></label>
            {err && <p className="text-red-700">{err}</p>}
            <div className="flex justify-between"><button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm">Annuleren</button><button disabled={pending} className="btn-brand text-white text-sm">Opslaan</button></div>
          </form>
        </div>
      )}
    </>
  );
}
