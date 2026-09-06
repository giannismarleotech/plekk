import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary, href, isLocale, alternates, locales, type Locale } from "@/i18n";
import { Shell, Section, Eyebrow, H2, Lede, Grid, Feature, Cta } from "@/components/marketing/Shell";
import { HeroMock, AgendaMock, ReservationsMock, KitchenMock, TodayMock } from "@/components/marketing/Mocks";
import { PricingTable } from "@/components/marketing/Pricing";
import { Mark } from "@/components/Logo";

export function generateStaticParams() { return locales.map((lang) => ({ lang })); }

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = getDictionary(lang);
  return { title: { absolute: d.meta.home.title }, description: d.meta.home.description, alternates: { languages: alternates("home") } };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const l = lang as Locale;
  const d = getDictionary(l);
  const h = d.home;
  const modeHref = { salons: href(l, "salons"), restaurants: href(l, "restaurants"), takeaway: href(l, "takeaway") };
  const brand = { salons: "#B23A5A", restaurants: "#1F5F4A", takeaway: "#D97706" };

  return (
    <Shell lang={l} d={d} page="home">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#101814] text-white">
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] rounded-full blur-3xl opacity-30" style={{ background: "var(--green)" }} />
        <div className="absolute bottom-0 -right-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-25" style={{ background: "var(--orange)" }} />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-24 md:pb-28 grid gap-12 lg:grid-cols-[1.15fr_1fr] items-center">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.16em]" style={{ color: "var(--green)" }}>{h.eyebrow}</p>
            <h1 className="mt-4 text-[2.6rem] leading-[1.02] sm:text-6xl md:text-[4.4rem] font-bold" style={{ textWrap: "balance" }}>
              {h.title} <span className="relative inline-block"><span style={{ color: "var(--green)" }}>{h.titleAccent}</span><span className="absolute -right-4 -top-1 w-3.5 h-3.5 rounded-full" style={{ background: "var(--orange)" }} /></span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-[#C9D1CB] max-w-xl">{h.lede}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={href(l, "contact")} className="btn font-bold text-ink text-base px-6 py-3" style={{ background: "var(--green)" }}>{d.common.getStarted}</Link>
              <Link href={href(l, "examples")} className="btn border border-white/25 text-white hover:bg-white/10 text-base px-6 py-3">{d.common.seeDemo}</Link>
            </div>
            <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {h.stats.map((s) => <div key={s.label}><dt className="text-3xl font-bold font-display tabular">{s.value}</dt><dd className="text-sm text-[#9AA69E]">{s.label}</dd></div>)}
            </dl>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-0 m-auto w-72 h-72 rounded-[40%] blur-2xl opacity-40" style={{ background: "var(--green)" }} />
            <HeroMock m={d.mock} />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <Section>
        <Eyebrow tone="orange">01</Eyebrow>
        <H2>{h.problemTitle}</H2>
        <Grid>{h.problem.map((p) => <Feature key={p.title} title={p.title} body={p.body} />)}</Grid>
      </Section>

      {/* MODES */}
      <Section className="bg-surface border-y border-line">
        <Eyebrow>02</Eyebrow>
        <H2>{h.modesTitle}</H2>
        <Lede>{h.modesLede}</Lede>
        <div className="grid gap-5 md:grid-cols-3 mt-10">
          {h.modes.map((m) => (
            <Link key={m.key} href={modeHref[m.key]} className="group rounded-2xl border border-line bg-bg p-7 hover:shadow-xl transition relative overflow-hidden">
              <span className="absolute top-0 left-0 right-0 h-1.5" style={{ background: brand[m.key] }} />
              <div className="flex items-center gap-3"><Mark size={30} tile={brand[m.key]} id={`mode-${m.key}`} /><h3 className="text-2xl font-bold">{m.title}</h3></div>
              <p className="mt-2 text-muted">{m.body}</p>
              <ul className="mt-5 space-y-1.5 text-sm">{m.bullets.map((b) => <li key={b} className="flex gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: brand[m.key] }} />{b}</li>)}</ul>
              <p className="mt-6 font-bold group-hover:translate-x-1 transition" style={{ color: brand[m.key] }}>{d.common.learnMore} →</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* DASHBOARD PREVIEW */}
      <Section>
        <Eyebrow>03</Eyebrow>
        <H2>{h.demoTitle}</H2>
        <Lede>{h.demoLede}</Lede>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AgendaMock m={d.mock} /><ReservationsMock m={d.mock} /><KitchenMock m={d.mock} /><TodayMock m={d.mock} />
        </div>
        <p className="mt-6"><Link href={href(l, "examples")} className="font-bold underline underline-offset-4">{d.common.seeDemo} →</Link></p>
      </Section>

      {/* WHY */}
      <Section dark>
        <Eyebrow>04</Eyebrow>
        <H2>{h.whyTitle}</H2>
        <div className="grid gap-5 md:grid-cols-2 mt-10">
          {h.why.map((w, i) => (
            <div key={w.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <span className="font-mono text-xs" style={{ color: "var(--green)" }}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-xl font-bold">{w.title}</h3>
              <p className="mt-2 text-[#C9D1CB]">{w.body}</p>
            </div>
          ))}
        </div>
        <figure className="mt-14 max-w-3xl">
          <blockquote className="text-2xl md:text-3xl font-display font-medium leading-snug" style={{ textWrap: "balance" }}>“{h.quoteText}”</blockquote>
          <figcaption className="mt-4 text-sm text-[#9AA69E]">— {h.quoteName}</figcaption>
        </figure>
      </Section>

      {/* PRICING */}
      <Section id="prijs">
        <Eyebrow>05</Eyebrow>
        <H2>{d.pricing.title}</H2>
        <Lede>{d.pricing.lede}</Lede>
        <div className="mt-10"><PricingTable d={d} contactHref={href(l, "contact")} compact /></div>
        <p className="mt-6 text-sm text-muted"><strong>{d.common.founders}:</strong> {d.common.foundersDesc} <Link href={href(l, "pricing")} className="underline">{d.common.readMore}</Link></p>
      </Section>

      <Cta title={h.ctaTitle} body={h.ctaBody} primary={{ label: d.common.getStarted, href: href(l, "contact") }} secondary={{ label: d.common.seeDemo, href: href(l, "examples") }} />
    </Shell>
  );
}
