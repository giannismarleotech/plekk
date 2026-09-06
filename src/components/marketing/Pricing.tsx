"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n";

export function PricingTable({ d, contactHref, compact = false }: { d: Dictionary; contactHref: string; compact?: boolean }) {
  const [yearly, setYearly] = useState(false);
  const p = d.pricing;
  return (
    <div>
      <div className="flex items-center gap-3 justify-center mb-8">
        <button onClick={() => setYearly(false)} className={`px-4 py-2 rounded-lg text-sm font-bold ${!yearly ? "bg-ink text-white" : "text-muted"}`}>{d.common.monthly}</button>
        <button onClick={() => setYearly(true)} className={`px-4 py-2 rounded-lg text-sm font-bold ${yearly ? "bg-ink text-white" : "text-muted"}`}>{d.common.yearly} <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "var(--green)", color: "#101814" }}>{d.common.yearlyNote}</span></button>
      </div>
      <div className="grid gap-5 md:grid-cols-3 items-stretch">
        {p.tiers.map((t) => (
          <div key={t.key} className={`card p-7 flex flex-col relative ${t.popular ? "ring-2 ring-[#1ED760] shadow-xl md:-my-3" : ""}`}>
            {t.popular && <span className="absolute -top-3 left-6 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--orange)", color: "#fff" }}>★</span>}
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted">{t.name}</p>
            <p className="mt-2 flex items-baseline gap-1"><span className="text-5xl font-bold font-display tabular">€{yearly ? Math.round(t.yearly / 12) : t.monthly}</span><span className="text-muted">{d.common.perMonth}</span></p>
            <p className="text-xs text-muted">{yearly ? `€${t.yearly} / ${d.common.yearly.toLowerCase()} · ` : ""}{d.common.exclVat}</p>
            <p className="mt-3 text-muted">{t.tagline}</p>
            {!compact && <ul className="mt-5 space-y-2 text-sm flex-1">{t.features.map((f) => <li key={f} className="flex gap-2"><span className="mt-1.5 w-2 h-2 rounded-[2px] shrink-0" style={{ background: "var(--green)" }} />{f}</li>)}</ul>}
            <Link href={contactHref} className={`mt-6 btn font-bold ${t.popular ? "text-ink" : "border border-line bg-surface hover:bg-bg"}`} style={t.popular ? { background: "var(--green)" } : undefined}>{d.common.getStarted}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
