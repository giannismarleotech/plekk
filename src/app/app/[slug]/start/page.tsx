import Link from "next/link";
import { eq, and, count } from "drizzle-orm";
import { requireOrgAccess } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { publicUrl } from "@/lib/bookings";
import { onboardingSteps } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

/** Stappenplan voor een nieuwe zaak: wat is al in orde, wat moet nog, en waar doe je het. */
export default async function StartPage({ params, searchParams }: PageProps<"/app/[slug]/start">) {
  const { slug } = await params;
  const sp = await searchParams;
  const { org } = (await requireOrgAccess(slug))!;
  const steps = await onboardingSteps(org);
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  const link = publicUrl(slug);
  const db = await getDb();
  const [{ n: bookings }] = await db.select({ n: count() }).from(schema.bookings).where(eq(schema.bookings.orgId, org.id));
  const verb = org.mode === "salon" ? "boekbaar" : org.mode === "restaurant" ? "reserveerbaar" : "bestelbaar";
  return (
    <div className="max-w-3xl space-y-8">
      {sp.welkom && (
        <div className="rounded-2xl p-5 text-white" style={{ background: "#101814" }}>
          <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "#1ED760" }}>Welkom bij Plekk</p>
          <h1 className="text-2xl font-bold mt-1">{org.name} bestaat. Nu nog {verb} maken.</h1>
          <p className="mt-2 text-[#C9D1CB]">Je boekingspagina staat al online op <a href={link} target="_blank" className="underline text-white">{link.replace(/^https?:\/\//, "")}</a>. Werk de stappen hieronder af — meestal een half uur — en je kunt de link delen met je klanten.</p>
        </div>
      )}
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">Stappenplan</h2>
          <span className="text-sm text-muted">{done} van {steps.length} klaar</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-line overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "#1ED760" : "var(--brand)" }} /></div>
        {pct === 100 && <p className="mt-3 text-sm font-semibold" style={{ color: "#0F7A38" }}>Alles staat klaar. Deel je link en ontvang je eerste {org.mode === "takeaway" ? "bestelling" : org.mode === "restaurant" ? "reservatie" : "afspraak"}.</p>}
      </div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.key} className={`card p-5 flex gap-4 ${s.done ? "opacity-80" : ""}`}>
            <span className={`shrink-0 h-8 w-8 rounded-full grid place-items-center font-bold text-sm ${s.done ? "text-white" : "bg-bg border border-line"}`} style={s.done ? { background: "#1ED760", color: "#101814" } : undefined}>{s.done ? "✓" : i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold">{s.title}</p>
              <p className="text-sm text-muted mt-0.5">{s.why}</p>
              <ul className="mt-2 text-sm list-disc pl-5 space-y-0.5">{s.todo.map((t) => <li key={t}>{t}</li>)}</ul>
              <div className="mt-3 flex flex-wrap gap-3 items-center text-sm">
                {s.href.startsWith("http") ? <a href={s.href} target="_blank" className="btn-brand text-white text-sm">{s.cta} ↗</a> : <Link href={`/app/${slug}${s.href}`} className="btn-brand text-white text-sm">{s.cta} →</Link>}
                {s.done && <span className="text-muted">In orde</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <section className="card p-5 text-sm">
        <p className="font-bold text-base">Daarna</p>
        <p className="text-muted mt-1">Je hebt {bookings} {bookings === 1 ? "boeking" : "boekingen"} ontvangen. Alles wat binnenkomt zie je onder <Link href={`/app/${slug}`} className="underline">Vandaag</Link> en <Link href={`/app/${slug}/agenda`} className="underline">Agenda</Link>. Klanten krijgen automatisch een bevestiging en een herinnering; jij krijgt een mail per nieuwe boeking op {org.email ?? "het e-mailadres van je zaak"}.</p>
        <p className="text-muted mt-2">Vragen? Mail <a href="mailto:hallo@plekk.be" className="underline">hallo@plekk.be</a> of bel ons — we komen ook gewoon langs.</p>
      </section>
    </div>
  );
}
