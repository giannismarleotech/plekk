import { Header } from "./Header";
import { Footer } from "./Footer";
import type { Dictionary, Locale, PageKey } from "@/i18n";

/** Header + footer rond elke marketingpagina. */
export function Shell({ lang, d, page, children }: { lang: Locale; d: Dictionary; page: PageKey; children: React.ReactNode }) {
  return (
    <>
      <Header lang={lang} d={d} page={page} />
      <main className="flex-1">{children}</main>
      <Footer lang={lang} d={d} page={page} />
    </>
  );
}

export function Section({ children, className = "", dark = false, id }: { children: React.ReactNode; className?: string; dark?: boolean; id?: string }) {
  return (
    <section id={id} className={`${dark ? "bg-[#101814] text-white" : ""} ${className}`}>
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "orange" | "muted" }) {
  const color = tone === "green" ? "var(--accent)" : tone === "orange" ? "#C2410C" : "var(--muted)";
  return <p className="text-xs font-mono uppercase tracking-[0.16em] mb-3" style={{ color }}>{children}</p>;
}

export function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-3xl md:text-[2.6rem] leading-[1.05] font-bold ${className}`} style={{ textWrap: "balance" }}>{children}</h2>;
}

export function Lede({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mt-4 text-lg md:text-xl text-muted max-w-2xl ${className}`}>{children}</p>;
}

export function Grid({ children, cols = 3 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const c = cols === 2 ? "md:grid-cols-2" : cols === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3";
  return <div className={`grid gap-5 ${c} mt-10`}>{children}</div>;
}

export function Feature({ title, body, n }: { title: string; body: string; n?: number }) {
  return (
    <div className="card p-6 relative overflow-hidden">
      {n !== undefined && <span className="absolute top-4 right-5 font-mono text-xs text-muted">{String(n).padStart(2, "0")}</span>}
      <span className="inline-block w-3 h-3 rounded-[3px] mb-4" style={{ background: "var(--green)" }} />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-muted">{body}</p>
    </div>
  );
}

export function Faq({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  return (
    <div>
      <H2>{title}</H2>
      <div className="mt-8 divide-y divide-line border-y border-line max-w-3xl">
        {items.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="cursor-pointer list-none flex justify-between items-center gap-4 font-bold text-lg">{f.q}<span className="text-muted transition group-open:rotate-45 text-2xl leading-none">+</span></summary>
            <p className="mt-2 text-muted max-w-2xl">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function Cta({ title, body, primary, secondary }: { title: string; body: string; primary: { label: string; href: string }; secondary?: { label: string; href: string } }) {
  return (
    <Section>
      <div className="rounded-3xl p-10 md:p-14 relative overflow-hidden text-white" style={{ background: "#101814" }}>
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-40 blur-3xl" style={{ background: "var(--green)" }} />
        <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{ background: "var(--orange)" }} />
        <div className="relative max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ textWrap: "balance" }}>{title}</h2>
          <p className="mt-3 text-lg text-[#C9D1CB]">{body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={primary.href} className="btn text-ink font-bold" style={{ background: "var(--green)" }}>{primary.label}</a>
            {secondary && <a href={secondary.href} className="btn border border-white/25 text-white hover:bg-white/10">{secondary.label}</a>}
          </div>
        </div>
      </div>
    </Section>
  );
}
