"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n";

type M = Dictionary["mock"];
const GREEN = "#1ED760", ORANGE = "#FF6B1A", INK = "#101814";

/** Telefoonframe met daarin een boekingsflow die zichzelf afspeelt: salon → restaurant → frituur. */
export function HeroMock({ m }: { m: M }) {
  const [t, setT] = useState(0); // 0..11, 4 stappen per mode
  useEffect(() => {
    const id = setInterval(() => setT((x) => (x + 1) % 12), 1400);
    return () => clearInterval(id);
  }, []);
  const mode = Math.floor(t / 4) as 0 | 1 | 2;
  const step = t % 4;
  const brand = [ "#B23A5A", "#1F5F4A", "#D97706" ][mode];
  const name = [m.salonName, m.restaurantName, m.takeawayName][mode];
  return (
    <div className="relative mx-auto w-[300px] h-[600px] rounded-[40px] bg-[#101814] p-3 shadow-2xl ring-1 ring-white/10" aria-hidden="true">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-10" />
      <div className="w-full h-full rounded-[30px] overflow-hidden bg-[#F4F5F2] text-[#101814] flex flex-col">
        <div className="px-4 pt-9 pb-4 text-white" style={{ background: brand }}>
          <p className="text-[9px] font-mono uppercase tracking-widest opacity-80">plekk.be</p>
          <p className="font-display font-bold text-lg leading-tight">{name}</p>
        </div>
        <div className="p-3 space-y-2.5 text-[12px] flex-1 relative">
          {mode === 0 && (
            <>
              <Card active={step === 0}><Row label={m.service} checked /><p className="mt-2 text-[10px] text-[#5C645E]">{m.staff}</p><div className="flex gap-1 mt-1">{[m.anyone, "Lien", "Noor"].map((s, i) => <Chip key={s} on={i === 0} brand={brand}>{s}</Chip>)}</div></Card>
              <Card active={step === 1}><p className="font-bold">{m.pickTime}</p><Days brand={brand} /><Slots brand={brand} pick={step >= 1 ? 3 : -1} times={["09:30", "10:15", "11:00", "13:30", "14:15", "15:00"]} /></Card>
              <Card active={step === 2}><Field v="An Vermeulen" /><Field v="+32 470 11 22 33" /></Card>
              <Btn brand={brand} done={step === 3} label={m.confirm} doneLabel={m.confirmed} />
            </>
          )}
          {mode === 1 && (
            <>
              <Card active={step === 0}><p className="font-bold">{m.guests}</p><div className="flex gap-1 mt-1.5 flex-wrap">{[1, 2, 3, 4, 5, 6].map((n) => <Chip key={n} on={n === 6} brand={brand}>{n}</Chip>)}</div><p className="mt-2 text-[10px] text-[#5C645E]">{m.deposit}</p></Card>
              <Card active={step === 1}><p className="font-bold">{m.pickTime}</p><Days brand={brand} /><Slots brand={brand} pick={step >= 1 ? 2 : -1} times={["18:00", "18:30", "19:00", "19:30", "20:00", "20:30"]} /></Card>
              <Card active={step === 2}><Field v="Familie Peeters" /><Field v="+32 473 44 55 66" /></Card>
              <Btn brand={brand} done={step === 3} label={m.confirm} doneLabel={m.confirmed} />
            </>
          )}
          {mode === 2 && (
            <>
              <Card active={step === 0}>{m.items.map((it) => <Row key={it} label={it} checked />)}<div className="flex justify-between font-bold mt-1 pt-1 border-t border-[#E1E4DE]"><span>{m.total}</span><span className="font-mono">€ 15,90</span></div></Card>
              <Card active={step === 1}><p className="font-bold">{m.pickup}</p><Slots brand={brand} pick={step >= 1 ? 1 : -1} times={["17:45", "18:00", "18:15", "18:30", "18:45", "19:00"]} /></Card>
              <Card active={step === 2}><Field v="Jonas Verhelst" /><Field v="+32 476 77 88 99" /></Card>
              <Btn brand={brand} done={step === 3} label={m.confirm} doneLabel={m.confirmed} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const Card = ({ children, active }: { children: React.ReactNode; active: boolean }) => (
  <div className={`rounded-xl bg-white border p-2.5 transition-all duration-500 ${active ? "border-[#101814] shadow-md" : "border-[#E1E4DE] opacity-80"}`}>{children}</div>
);
const Row = ({ label, checked }: { label: string; checked?: boolean }) => (
  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-[3px]" style={{ borderColor: checked ? GREEN : "#E1E4DE" }} /><span className="truncate">{label}</span></div>
);
const Chip = ({ children, on, brand }: { children: React.ReactNode; on: boolean; brand: string }) => (
  <span className="px-2 py-0.5 rounded-md border text-[11px] font-semibold" style={on ? { background: brand, color: "#fff", borderColor: brand } : { borderColor: "#E1E4DE" }}>{children}</span>
);
const Days = ({ brand }: { brand: string }) => (
  <div className="flex gap-1 mt-1.5">{["ma 7", "di 8", "wo 9", "do 10"].map((d, i) => <span key={d} className="px-2 py-1 rounded-md border text-[10px] font-semibold" style={i === 1 ? { background: brand, color: "#fff", borderColor: brand } : { borderColor: "#E1E4DE" }}>{d}</span>)}</div>
);
const Slots = ({ times, pick, brand }: { times: string[]; pick: number; brand: string }) => (
  <div className="grid grid-cols-3 gap-1 mt-1.5">{times.map((t, i) => <span key={t} className="text-center py-1 rounded-md border text-[11px] font-mono font-semibold transition-all duration-500" style={i === pick ? { background: brand, color: "#fff", borderColor: brand } : { borderColor: "#E1E4DE", background: "#fff" }}>{t}</span>)}</div>
);
const Field = ({ v }: { v: string }) => <div className="rounded-md border border-[#E1E4DE] bg-white px-2 py-1.5 text-[11px] mb-1.5 last:mb-0">{v}</div>;
const Btn = ({ brand, done, label, doneLabel }: { brand: string; done: boolean; label: string; doneLabel: string }) => (
  <div className="rounded-xl py-2.5 text-center font-bold text-white transition-all duration-500" style={{ background: done ? GREEN : brand, color: done ? INK : "#fff" }}>{done ? `✓ ${doneLabel}` : label}</div>
);

/** Statische dashboard-mocks: agenda, reservaties, keuken, vandaag. */
export function AgendaMock({ m }: { m: M }) {
  const staff = ["Lien", "Noor", "Jef"];
  const blocks = [[0, 1, 2, "An V."], [0, 5, 6, "Sofie C."], [1, 2, 2, "Tom D."], [1, 7, 3, "Marie D."], [2, 3, 2, "Jonas V."], [2, 9, 2, "Karel V."]] as const;
  return (
    <Frame title={m.agenda}>
      <div className="grid text-[10px]" style={{ gridTemplateColumns: "28px repeat(3,1fr)" }}>
        <div />{staff.map((s) => <div key={s} className="font-bold px-1 pb-1">{s}</div>)}
        <div className="relative" style={{ height: 12 * 14 }}>{[0, 4, 8].map((r) => <span key={r} className="absolute right-1 font-mono text-[#5C645E]" style={{ top: r * 14 - 5 }}>{9 + r / 4 * 2}h</span>)}</div>
        {staff.map((_, col) => (
          <div key={col} className="relative border-l border-[#E1E4DE]" style={{ height: 12 * 14, backgroundImage: "repeating-linear-gradient(to bottom,#E1E4DE 0 1px,transparent 1px 56px)" }}>
            {blocks.filter((b) => b[0] === col).map((b) => <div key={b[3]} className="absolute left-0.5 right-0.5 rounded-md bg-white border border-l-4 px-1 py-0.5 truncate font-semibold" style={{ top: b[1] * 14, height: b[2] * 14 - 2, borderColor: "#B23A5A" }}>{b[3]}</div>)}
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function ReservationsMock({ m }: { m: M }) {
  const rows = [["12:30", 3, "Karel V.", "T3"], ["19:00", 6, "Fam. Peeters", "T6"], ["19:30", 2, "Els M.", "T1"], ["20:15", 4, "Wim D.", "T4"]] as const;
  return (
    <Frame title={m.restaurantName}>
      <div className="divide-y divide-[#E1E4DE] text-[10px]">
        {rows.map((r) => (
          <div key={r[0]} className="flex items-center gap-2 py-1.5">
            <span className="font-mono font-bold w-8">{r[0]}</span><span className="font-bold w-5">{r[1]}p</span><span className="flex-1 truncate">{r[2]} <span className="text-[#5C645E]">· {r[3]}</span></span>
            {r[1] >= 6 && <span className="px-1 rounded bg-[#FBEAD9] text-[#9A3412] text-[9px]">€60</span>}
            <span className="px-1.5 rounded-full text-[9px] font-semibold" style={{ background: "#E1F3EA", color: "#1E7F5C" }}>✓</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function KitchenMock({ m }: { m: M }) {
  const cols = [[m.kitchenNew, "#FBF0D6", "#B8760A", ["18:15 · 2× Grote friet", "18:30 · 1× Pizza"]], [m.kitchenPrep, "#DBEAFE", "#1D4ED8", ["18:00 · 3× Frikandel"]], [m.kitchenReady, "#E1F3EA", "#1E7F5C", ["17:45 · Bicky, Cola"]]] as const;
  return (
    <Frame title={m.takeawayName} dark>
      <div className="grid grid-cols-3 gap-1.5 text-[9px]">
        {cols.map(([t, bg, fg, items]) => (
          <div key={t}><p className="font-bold text-white/80 mb-1">{t}</p>{items.map((i) => <div key={i} className="rounded-md p-1.5 mb-1 font-semibold" style={{ background: bg, color: fg }}>{i}</div>)}</div>
        ))}
      </div>
    </Frame>
  );
}

export function TodayMock({ m }: { m: M }) {
  return (
    <Frame title={m.today}>
      <div className="grid grid-cols-3 gap-1.5 text-[9px]">
        {[["12", m.agenda], ["4", m.customers], ["€ 486", "€"]].map(([v, l]) => <div key={l} className="rounded-md bg-white border border-[#E1E4DE] p-1.5"><p className="text-[8px] font-mono uppercase text-[#5C645E]">{l}</p><p className="font-display font-bold text-base">{v}</p></div>)}
      </div>
      <div className="mt-2 space-y-1 text-[10px]">{[["14:00", "Tom De Smet"], ["14:30", "An Vermeulen"], ["15:15", "Sofie Claeys"]].map(([t, n]) => <div key={t} className="flex gap-2 bg-white border border-[#E1E4DE] rounded-md px-2 py-1"><span className="font-mono font-bold">{t}</span><span>{n}</span><span className="ml-auto w-2 h-2 rounded-full self-center" style={{ background: GREEN }} /></div>)}</div>
    </Frame>
  );
}

function Frame({ title, children, dark }: { title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-xl border overflow-hidden ${dark ? "bg-[#101814] border-white/10" : "bg-[#F4F5F2] border-[#E1E4DE]"}`} aria-hidden="true">
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 border-b ${dark ? "border-white/10" : "border-[#E1E4DE] bg-white"}`}>
        <span className="w-2 h-2 rounded-full bg-[#E1E4DE]" /><span className="w-2 h-2 rounded-full bg-[#E1E4DE]" /><span className="w-2 h-2 rounded-full" style={{ background: ORANGE }} />
        <span className={`ml-2 text-[10px] font-bold ${dark ? "text-white" : ""}`}>{title}</span>
      </div>
      <div className="p-2.5">{children}</div>
    </div>
  );
}
