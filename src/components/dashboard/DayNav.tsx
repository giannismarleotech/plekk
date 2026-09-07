import Link from "next/link";
import { fmtDate, fmtDateShort } from "@/lib/format";

const shift = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Dagnavigatie: vorige/volgende, naar vandaag, en een weekstrook rond de gekozen dag. */
export function DayNav({ base, day, today }: { base: string; day: string; today: string }) {
  const week = Array.from({ length: 7 }, (_, i) => shift(day, i - 3));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`${base}?dag=${shift(day, -1)}`} className="btn-ghost px-3 py-1.5" aria-label="Vorige dag">‹</Link>
        <span className="font-bold text-lg min-w-[14ch]">{cap(fmtDate(new Date(`${day}T12:00:00`)))}{day === today ? <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "#1ED760", color: "#101814" }}>vandaag</span> : null}</span>
        <Link href={`${base}?dag=${shift(day, 1)}`} className="btn-ghost px-3 py-1.5" aria-label="Volgende dag">›</Link>
        {day !== today && <Link href={`${base}?dag=${today}`} className="text-sm underline">Naar vandaag</Link>}
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {week.map((d) => (
          <Link key={d} href={`${base}?dag=${d}`} className={`shrink-0 rounded-md border px-2 py-1 text-xs ${d === day ? "text-white border-transparent" : "border-line bg-surface hover:bg-bg"} ${d === today && d !== day ? "font-bold" : ""}`} style={d === day ? { background: "var(--brand)" } : undefined}>{cap(fmtDateShort(new Date(`${d}T12:00:00`)))}</Link>
        ))}
      </div>
    </div>
  );
}
