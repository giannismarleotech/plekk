import Link from "next/link";
import { fmtDate } from "@/lib/format";

const shift = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function DayNav({ base, day, today }: { base: string; day: string; today: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Link href={`${base}?dag=${shift(day, -1)}`} className="btn-ghost px-3 py-1.5" aria-label="Vorige dag">‹</Link>
      <span className="font-bold text-lg capitalize min-w-[14ch]">{fmtDate(new Date(`${day}T12:00:00`))}</span>
      <Link href={`${base}?dag=${shift(day, 1)}`} className="btn-ghost px-3 py-1.5" aria-label="Volgende dag">›</Link>
      {day !== today && <Link href={`${base}?dag=${today}`} className="text-sm underline">Vandaag</Link>}
    </div>
  );
}
