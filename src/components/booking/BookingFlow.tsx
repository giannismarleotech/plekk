"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fetchDays, fetchSlots, submitBooking, type SlotDto } from "@/app/z/[slug]/actions";
import type { OrgSettings, OfferingOption } from "@/db/schema";
import type { Mode } from "@/config/site";
import { euro, minutesLabel } from "@/lib/format";
import type { PublicStrings } from "@/i18n/public";

export type FlowStrings = Omit<PublicStrings, "depositNote" | "cancelBody"> & { depositNoteText: string; localeTag: string };

type Org = { slug: string; name: string; mode: Mode; brandColor: string; settings: OrgSettings };
type Res = { id: string; name: string; kind: string; capacity: number; minParty: number };
type Off = { id: string; kind: string; name: string; category: string | null; description: string | null; durationMin: number | null; priceCents: number; options: OfferingOption[] };
type CartLine = { key: string; offeringId: string; name: string; quantity: number; unitPriceCents: number; options: { name: string; choice: string; priceCents: number }[] };

const dayLabel = (iso: string, tag = "nl-BE") => {
  const d = new Date(`${iso}T12:00:00`);
  return { wd: d.toLocaleDateString(tag, { weekday: "short" }), dm: d.toLocaleDateString(tag, { day: "numeric", month: "short" }) };
};

export function BookingFlow({ org, resources, offerings, t }: { org: Org; resources: Res[]; offerings: Off[]; t: FlowStrings }) {
  const router = useRouter();
  const [days, setDays] = useState<string[]>([]);
  const [day, setDay] = useState<string>("");
  const [slots, setSlots] = useState<SlotDto[] | null>(null);
  const [time, setTime] = useState<string>("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // salon
  const [serviceId, setServiceId] = useState<string>("");
  const [staffId, setStaffId] = useState<string | null>(null);
  // restaurant
  const [party, setParty] = useState<number>(2);
  // takeaway
  const [cart, setCart] = useState<CartLine[]>([]);
  // customer
  const [cust, setCust] = useState({ name: "", email: "", phone: "" });
  const [notes, setNotes] = useState("");

  useEffect(() => { fetchDays(org.slug).then((d) => { setDays(d); if (d[0]) setDay(d[0]); }); }, [org.slug]);

  const readyForSlots = org.mode === "salon" ? !!serviceId : org.mode === "restaurant" ? party > 0 : cart.length > 0;

  useEffect(() => {
    if (!day || !readyForSlots) { setSlots(null); return; }
    setTime("");
    start(async () => {
      const q = org.mode === "salon" ? { mode: "salon" as const, day, offeringId: serviceId, staffId }
        : org.mode === "restaurant" ? { mode: "restaurant" as const, day, partySize: party }
        : { mode: "takeaway" as const, day };
      setSlots(await fetchSlots(org.slug, q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, serviceId, staffId, party, readyForSlots, org.slug, org.mode]);

  const service = offerings.find((o) => o.id === serviceId);
  const cartTotal = cart.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);
  const deposit = org.mode === "restaurant" && org.settings.depositFromPartySize && party >= org.settings.depositFromPartySize ? (org.settings.depositCentsPerPerson ?? 0) * party : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await submitBooking({
        slug: org.slug, day, time, notes, customer: cust,
        salon: org.mode === "salon" ? { offeringId: serviceId, staffId } : undefined,
        restaurant: org.mode === "restaurant" ? { partySize: party } : undefined,
        takeaway: org.mode === "takeaway" ? { cart: cart.map((l) => ({ offeringId: l.offeringId, quantity: l.quantity, options: l.options })) } : undefined,
      });
      if (res.ok) { if (res.checkoutUrl) window.location.href = res.checkoutUrl; else router.push(`/z/${org.slug}/bevestigd/${res.reference}`); }
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {org.mode === "salon" && (
        <Step n={1} title={t.chooseService}>
          <ServiceList offerings={offerings} value={serviceId} onChange={setServiceId} />
          {resources.length > 1 && (
            <div className="mt-4">
              <p className="label">{t.whoWith}</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={staffId === null} onClick={() => setStaffId(null)}>{t.anyone}</Chip>
                {resources.map((r) => <Chip key={r.id} active={staffId === r.id} onClick={() => setStaffId(r.id)}>{r.name}</Chip>)}
              </div>
            </div>
          )}
        </Step>
      )}

      {org.mode === "restaurant" && (
        <Step n={1} title={t.howMany}>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <Chip key={n} active={party === n} onClick={() => setParty(n)}>{n}</Chip>)}
            <Chip active={party > 8} onClick={() => setParty(10)}>9+</Chip>
          </div>
          {party > 8 && <p className="mt-2 text-sm text-muted">{t.largeGroup} <input type="number" min={9} max={20} value={party} onChange={(e) => setParty(Number(e.target.value))} className="input inline-block w-20 ml-2 py-1" /></p>}
          {deposit > 0 && <p className="mt-3 text-sm rounded-lg bg-bg border border-line p-3">{t.depositNoteText.replace("{total}", euro(deposit))}</p>}
        </Step>
      )}

      {org.mode === "takeaway" && (
        <Step n={1} title={t.composeOrder}>
          <Menu offerings={offerings} cart={cart} setCart={setCart} t={t} />
        </Step>
      )}

      <Step n={2} title={org.mode === "takeaway" ? t.whenPickup : t.chooseMoment} muted={!readyForSlots}>
        {!readyForSlots ? (
          <p className="text-sm text-muted">{org.mode === "salon" ? t.chooseServiceFirst : org.mode === "takeaway" ? t.addItemFirst : ""}</p>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {days.map((d) => { const l = dayLabel(d, t.localeTag); return (
                <button type="button" key={d} onClick={() => setDay(d)} className={`shrink-0 rounded-lg border px-3 py-2 text-center min-w-[72px] ${day === d ? "text-white border-transparent" : "border-line bg-surface hover:bg-bg"}`} style={day === d ? { background: org.brandColor } : undefined}>
                  <div className="text-xs uppercase tracking-wide opacity-80">{l.wd}</div><div className="font-semibold">{l.dm}</div>
                </button>
              ); })}
            </div>
            <div className="mt-3 min-h-[3rem]">
              {pending && slots === null ? <p className="text-sm text-muted">{t.loadingSlots}</p>
                : slots && slots.length === 0 ? <p className="text-sm text-muted">{t.noSlots}</p>
                : <div className="flex flex-wrap gap-2">
                    {slots?.map((s) => <Chip key={s.iso} active={time === s.time} onClick={() => setTime(s.time)} brand={org.brandColor}>{s.time}</Chip>)}
                  </div>}
            </div>
            {service && <p className="mt-2 text-sm text-muted">{service.name} · {minutesLabel(service.durationMin ?? 0)} · {euro(service.priceCents)}</p>}
          </>
        )}
      </Step>

      <Step n={3} title={t.yourDetails} muted={!time}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label" htmlFor="name">{t.name}</label><input id="name" className="input" required value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} autoComplete="name" /></div>
          <div><label className="label" htmlFor="phone">{t.phone}</label><input id="phone" className="input" required type="tel" value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} autoComplete="tel" placeholder="+32 4.." /></div>
          <div><label className="label" htmlFor="email">{t.email} <span className="font-normal text-muted">{t.emailHint}</span></label><input id="email" className="input" type="email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} autoComplete="email" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="notes">{t.note} <span className="font-normal text-muted">{t.optional}</span></label><textarea id="notes" className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={org.mode === "restaurant" ? t.notePlaceholder[1] : org.mode === "takeaway" ? t.notePlaceholder[2] : t.notePlaceholder[0]} /></div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 justify-between">
          <div className="text-sm">
            {time && day && <span>{dayLabel(day, t.localeTag).wd} {dayLabel(day, t.localeTag).dm} {t.at} <strong>{time}</strong></span>}
            {org.mode === "takeaway" && cart.length > 0 && <span> · {t.total} <strong>{euro(cartTotal)}</strong>{org.settings.prepayRequired ? "" : ` ${t.payAtPickup}`}</span>}
          </div>
          <button className="btn-brand" disabled={!time || pending}>{pending ? t.wait : org.mode === "takeaway" ? t.placeOrder : org.mode === "restaurant" ? (deposit ? t.reserveAndPay : t.reserve) : t.confirmAppointment}</button>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">{error}</p>}
      </Step>
    </form>
  );
}

function Step({ n, title, children, muted }: { n: number; title: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <section className={`card p-5 min-w-0 ${muted ? "opacity-60" : ""}`}>
      <h3 className="font-bold text-lg mb-3"><span className="font-mono text-xs text-muted mr-2">{n}</span>{title}</h3>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children, brand }: { active: boolean; onClick: () => void; children: React.ReactNode; brand?: string }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold tabular ${active ? "text-white border-transparent" : "border-line bg-surface hover:bg-bg"}`} style={active ? { background: brand ?? "var(--brand)" } : undefined}>
      {children}
    </button>
  );
}

function ServiceList({ offerings, value, onChange }: { offerings: Off[]; value: string; onChange: (id: string) => void }) {
  const groups = useMemo(() => {
    const m = new Map<string, Off[]>();
    for (const o of offerings.filter((o) => o.kind === "service")) m.set(o.category ?? "Overig", [...(m.get(o.category ?? "Overig") ?? []), o]);
    return [...m.entries()];
  }, [offerings]);
  return (
    <div className="space-y-4">
      {groups.map(([cat, items]) => (
        <div key={cat}>
          <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">{cat}</p>
          <div className="divide-y divide-line border border-line rounded-lg overflow-hidden">
            {items.map((o) => (
              <label key={o.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer ${value === o.id ? "bg-bg" : "bg-surface hover:bg-bg"}`}>
                <input type="radio" name="service" value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="accent-[var(--brand)]" />
                <span className="flex-1"><span className="font-semibold">{o.name}</span>{o.description && <span className="block text-sm text-muted">{o.description}</span>}</span>
                <span className="text-sm text-muted tabular">{minutesLabel(o.durationMin ?? 0)}</span>
                <span className="font-semibold tabular w-16 text-right">{euro(o.priceCents)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Menu({ offerings, cart, setCart, t }: { offerings: Off[]; cart: CartLine[]; setCart: (c: CartLine[]) => void; t: FlowStrings }) {
  const [open, setOpen] = useState<Off | null>(null);
  const groups = useMemo(() => {
    const m = new Map<string, Off[]>();
    for (const o of offerings.filter((o) => o.kind === "menu_item")) m.set(o.category ?? "Overig", [...(m.get(o.category ?? "Overig") ?? []), o]);
    return [...m.entries()];
  }, [offerings]);

  function add(o: Off, options: CartLine["options"]) {
    const key = o.id + "|" + options.map((x) => x.choice).join(",");
    const unit = o.priceCents + options.reduce((n, x) => n + x.priceCents, 0);
    const existing = cart.find((l) => l.key === key);
    setCart(existing ? cart.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l)) : [...cart, { key, offeringId: o.id, name: o.name, quantity: 1, unitPriceCents: unit, options }]);
    setOpen(null);
  }
  const change = (key: string, d: number) => setCart(cart.map((l) => (l.key === key ? { ...l, quantity: l.quantity + d } : l)).filter((l) => l.quantity > 0));
  const total = cart.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        {groups.map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">{cat}</p>
            <div className="divide-y divide-line border border-line rounded-lg overflow-hidden">
              {items.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-3 py-2 bg-surface">
                  <span className="flex-1"><span className="font-semibold">{o.name}</span>{o.description && <span className="block text-sm text-muted">{o.description}</span>}</span>
                  <span className="tabular text-sm">{euro(o.priceCents)}</span>
                  <button type="button" onClick={() => (o.options.length ? setOpen(o) : add(o, []))} className="btn-ghost px-3 py-1 text-sm" aria-label={`${o.name} ${t.add.toLowerCase()}`}>+</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <aside className="card p-3 text-sm self-start md:sticky md:top-6">
        <p className="font-bold mb-2">{t.yourOrder}</p>
        {cart.length === 0 ? <p className="text-muted">{t.nothingYet}</p> : (
          <ul className="space-y-2">
            {cart.map((l) => (
              <li key={l.key} className="flex items-start gap-2">
                <span className="flex-1"><span className="font-semibold">{l.name}</span>{l.options.length > 0 && <span className="block text-xs text-muted">{l.options.map((o) => o.choice).join(", ")}</span>}</span>
                <span className="flex items-center gap-1 tabular">
                  <button type="button" onClick={() => change(l.key, -1)} className="w-6 h-6 rounded border border-line" aria-label={t.less}>−</button>
                  <span className="w-5 text-center">{l.quantity}</span>
                  <button type="button" onClick={() => change(l.key, +1)} className="w-6 h-6 rounded border border-line" aria-label={t.more}>+</button>
                </span>
                <span className="w-14 text-right tabular">{euro(l.unitPriceCents * l.quantity)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 pt-2 border-t border-line flex justify-between font-bold"><span>{t.total[0].toUpperCase() + t.total.slice(1)}</span><span className="tabular">{euro(total)}</span></p>
      </aside>

      {open && <OptionsDialog item={open} onCancel={() => setOpen(null)} onAdd={(opts) => add(open, opts)} t={t} />}
    </div>
  );
}

function OptionsDialog({ item, onCancel, onAdd, t }: { item: Off; onCancel: () => void; onAdd: (o: CartLine["options"]) => void; t: FlowStrings }) {
  const [sel, setSel] = useState<Record<string, string[]>>(() => Object.fromEntries(item.options.map((g) => [g.name, g.multi ? [] : [g.choices[0]?.name].filter(Boolean) as string[]])));
  const toggle = (g: OfferingOption, c: string) => setSel((s) => ({ ...s, [g.name]: g.multi ? (s[g.name].includes(c) ? s[g.name].filter((x) => x !== c) : [...s[g.name], c]) : [c] }));
  const chosen = item.options.flatMap((g) => (sel[g.name] ?? []).map((c) => ({ name: g.name, choice: c, priceCents: g.choices.find((x) => x.name === c)?.priceCents ?? 0 })));
  const price = item.priceCents + chosen.reduce((n, c) => n + c.priceCents, 0);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="card p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h4 className="font-bold text-lg">{item.name}</h4>
        {item.options.map((g) => (
          <div key={g.name} className="mt-3">
            <p className="label">{g.name}{g.multi && <span className="font-normal text-muted"> {t.multiple}</span>}</p>
            <div className="flex flex-wrap gap-2">
              {g.choices.map((c) => <Chip key={c.name} active={sel[g.name]?.includes(c.name)} onClick={() => toggle(g, c.name)}>{c.name}{c.priceCents ? ` +${euro(c.priceCents)}` : ""}</Chip>)}
            </div>
          </div>
        ))}
        <div className="mt-5 flex justify-between items-center">
          <button type="button" className="btn-ghost" onClick={onCancel}>{t.cancel}</button>
          <button type="button" className="btn-brand" onClick={() => onAdd(chosen)}>{t.add} · {euro(price)}</button>
        </div>
      </div>
    </div>
  );
}
