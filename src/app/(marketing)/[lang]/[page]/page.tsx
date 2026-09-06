import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary, href, isLocale, resolvePage, allPageParams, alternates, type Locale, type Dictionary } from "@/i18n";
import { Shell, Section, Eyebrow, H2, Lede, Grid, Feature, Faq, Cta } from "@/components/marketing/Shell";
import { AgendaMock, ReservationsMock, KitchenMock, TodayMock, HeroMock } from "@/components/marketing/Mocks";
import { PricingTable } from "@/components/marketing/Pricing";
import { ContactForm } from "@/components/marketing/ContactForm";
import { Mark } from "@/components/Logo";
import { appUrl, appAvailable } from "@/config/app-url";

export function generateStaticParams() { return allPageParams(); }

export async function generateMetadata({ params }: PageProps<"/[lang]/[page]">): Promise<Metadata> {
  const { lang, page } = await params;
  if (!isLocale(lang)) return {};
  const key = resolvePage(lang, page);
  if (!key) return {};
  const d = getDictionary(lang);
  return { title: { absolute: d.meta[key].title }, description: d.meta[key].description, alternates: { languages: alternates(key) } };
}

export default async function MarketingPage({ params }: PageProps<"/[lang]/[page]">) {
  const { lang, page } = await params;
  if (!isLocale(lang)) notFound();
  const key = resolvePage(lang, page);
  if (!key) notFound();
  const d = getDictionary(lang);
  const views = { how: How, salons: Segment, restaurants: Segment, takeaway: Segment, pricing: Pricing, examples: Examples, about: About, contact: Contact, terms: Legal, privacy: Legal } as const;
  const View = views[key];
  return <Shell lang={lang} d={d} page={key}><View lang={lang} d={d} page={key} /></Shell>;
}

type P = { lang: Locale; d: Dictionary; page: string };

function Hero({ eyebrow, title, lede, tone = "green", children }: { eyebrow?: string; title: string; lede?: string; tone?: "green" | "orange" | "muted"; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 pt-14 pb-12 md:pt-20 md:pb-16">
        {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
        <h1 className="text-4xl md:text-6xl font-bold leading-[1.02] max-w-4xl" style={{ textWrap: "balance" }}>{title}</h1>
        {lede && <Lede className="text-xl">{lede}</Lede>}
        {children}
      </div>
    </section>
  );
}

/* ---------- Hoe het werkt ---------- */
function How({ lang, d }: P) {
  const h = d.how;
  return (
    <>
      <Hero eyebrow={d.nav.how} title={h.title} lede={h.lede} />
      <Section>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {h.steps.map((s, i) => (
            <li key={s.title} className="card p-6 relative">
              <span className="w-9 h-9 rounded-lg inline-flex items-center justify-center font-display font-bold text-ink" style={{ background: "var(--green)" }}>{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3><p className="mt-2 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>
      <Section dark>
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] items-center">
          <div>
            <Eyebrow>engine</Eyebrow>
            <H2>{h.engineTitle}</H2>
            <p className="mt-4 text-lg text-[#C9D1CB] max-w-2xl">{h.engineLede}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {h.engine.map((e) => <div key={e.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h3 className="font-bold">{e.title}</h3><p className="mt-1.5 text-sm text-[#C9D1CB]">{e.body}</p></div>)}
            </div>
          </div>
          <div className="hidden lg:block"><HeroMock m={d.mock} /></div>
        </div>
      </Section>
      <Section>
        <Eyebrow>dashboard</Eyebrow>
        <H2>{h.dashTitle}</H2>
        <Lede>{h.dashLede}</Lede>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><TodayMock m={d.mock} /><AgendaMock m={d.mock} /><ReservationsMock m={d.mock} /><KitchenMock m={d.mock} /></div>
        <Grid>{h.dash.map((x) => <Feature key={x.title} title={x.title} body={x.body} />)}</Grid>
      </Section>
      <Section className="bg-surface border-y border-line">
        <Eyebrow tone="muted">tech</Eyebrow>
        <H2>{h.techTitle}</H2>
        <Lede>{h.techLede}</Lede>
        <Grid cols={2}>{h.tech.map((x) => <Feature key={x.title} title={x.title} body={x.body} />)}</Grid>
      </Section>
      <Section><Faq title={h.faqTitle} items={h.faq} /></Section>
      <Cta title={d.home.ctaTitle} body={d.home.ctaBody} primary={{ label: d.common.getStarted, href: href(lang, "contact") }} secondary={{ label: d.common.seeDemo, href: href(lang, "examples") }} />
    </>
  );
}

/* ---------- Segmentpagina's ---------- */
function Segment({ lang, d, page }: P) {
  const key = page as "salons" | "restaurants" | "takeaway";
  const s = d.segments[key];
  const brand = { salons: "#B23A5A", restaurants: "#1F5F4A", takeaway: "#D97706" }[key];
  const demo = d.examples.demos.find((x) => x.key === key)!;
  return (
    <>
      <section className="border-b border-line bg-surface relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: brand }} />
        <div className="relative mx-auto max-w-6xl px-5 pt-14 pb-12 md:pt-20 md:pb-16 grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.16em] mb-3" style={{ color: brand }}>{s.eyebrow}</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.02]" style={{ textWrap: "balance" }}>{s.title}</h1>
            <Lede className="text-xl">{s.lede}</Lede>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={href(lang, "contact")} className="btn font-bold text-ink px-6 py-3" style={{ background: "var(--green)" }}>{d.common.getStarted}</Link>
              <a href={appUrl(`/z/${demo.slug}`, href(lang, "examples"))} className="btn border border-line bg-surface hover:bg-bg px-6 py-3">{demo.cta} →</a>
            </div>
          </div>
          <div className="hidden lg:block">{key === "salons" ? <AgendaMock m={d.mock} /> : key === "restaurants" ? <ReservationsMock m={d.mock} /> : <KitchenMock m={d.mock} />}</div>
        </div>
      </section>
      <Section>
        <Grid>{s.pains.map((p) => <div key={p.title} className="rounded-2xl p-6 border border-line" style={{ background: "var(--surface)" }}><span className="inline-block w-3 h-3 rounded-full mb-4" style={{ background: "var(--orange)" }} /><h3 className="text-lg font-bold">{p.title}</h3><p className="mt-2 text-muted">{p.body}</p></div>)}</Grid>
      </Section>
      <Section className="bg-surface border-y border-line">
        <H2>{s.featuresTitle}</H2>
        <Grid>{s.features.map((f, i) => <Feature key={f.title} title={f.title} body={f.body} n={i + 1} />)}</Grid>
      </Section>
      <Section dark>
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <H2>{s.flowTitle}</H2>
            <ol className="mt-8 space-y-4">
              {s.flow.map((f, i) => <li key={f} className="flex gap-4 items-start"><span className="w-8 h-8 rounded-full shrink-0 inline-flex items-center justify-center font-bold text-ink" style={{ background: "var(--green)" }}>{i + 1}</span><span className="text-lg pt-0.5">{f}</span></li>)}
            </ol>
          </div>
          <div className="flex justify-center"><HeroMock m={d.mock} /></div>
        </div>
      </Section>
      <Section>
        <H2>{s.compareTitle}</H2>
        <div className="mt-8 card overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {s.compare.map((c, i) => (
                <tr key={c.name} className={i === 0 ? "bg-[#E9FBF0] font-semibold" : ""}>
                  <td className="px-5 py-3 flex items-center gap-2">{i === 0 && <Mark size={16} id={`cmp-${key}`} />}{c.name}</td>
                  <td className="px-5 py-3 font-mono tabular whitespace-nowrap">{c.price}</td>
                  <td className="px-5 py-3 text-muted">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Cta title={s.ctaTitle} body={s.ctaBody} primary={{ label: d.common.getStarted, href: href(lang, "contact") }} secondary={{ label: demo.cta, href: appUrl(`/z/${demo.slug}`, href(lang, "examples")) }} />
    </>
  );
}

/* ---------- Prijzen ---------- */
function Pricing({ lang, d }: P) {
  const p = d.pricing;
  return (
    <>
      <Hero eyebrow={d.nav.pricing} title={p.title} lede={p.lede} />
      <Section>
        <PricingTable d={d} contactHref={href(lang, "contact")} />
        <div className="mt-8 rounded-2xl border border-dashed p-5 flex flex-wrap items-center gap-4" style={{ borderColor: "var(--orange)" }}>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "var(--orange)" }}>{d.common.founders}</span>
          <p className="text-sm flex-1">{d.common.foundersDesc}</p>
          <Link href={href(lang, "contact")} className="btn border border-line bg-surface text-sm">{d.common.contactUs}</Link>
        </div>
      </Section>
      <Section className="bg-surface border-y border-line">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <H2>{p.allIncluded}</H2>
            <ul className="mt-6 space-y-2.5">{p.included.map((i) => <li key={i} className="flex gap-3"><span className="mt-2 w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: "var(--green)" }} />{i}</li>)}</ul>
          </div>
          <div>
            <H2>{p.addonsTitle}</H2>
            <dl className="mt-6 divide-y divide-line border-y border-line">{p.addons.map((a) => <div key={a.name} className="py-3 flex justify-between gap-4"><dt>{a.name}</dt><dd className="font-mono text-sm text-right sm:max-w-[45%]">{a.price}</dd></div>)}</dl>
          </div>
        </div>
      </Section>
      <Section>
        <H2>{p.compareTitle}</H2>
        <Lede>{p.compareLede}</Lede>
        <div className="mt-8 card overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {p.compare.map((c, i) => (
                <tr key={c.name} className={i === 0 ? "bg-[#E9FBF0] font-semibold" : ""}>
                  <td className="px-5 py-3 whitespace-nowrap flex items-center gap-2">{i === 0 && <Mark size={16} id="cmp-p" />}{c.name}</td>
                  <td className="px-5 py-3 text-muted">{c.segment}</td>
                  <td className="px-5 py-3 font-mono tabular whitespace-nowrap">{c.price}</td>
                  <td className="px-5 py-3 text-muted">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section className="bg-surface border-y border-line"><Faq title={p.faqTitle} items={p.faq} /></Section>
      <Cta title={d.home.ctaTitle} body={d.home.ctaBody} primary={{ label: d.common.getStarted, href: href(lang, "contact") }} />
    </>
  );
}

/* ---------- Voorbeelden ---------- */
function Examples({ lang, d }: P) {
  const e = d.examples;
  const brand = { salons: "#B23A5A", restaurants: "#1F5F4A", takeaway: "#D97706" };
  return (
    <>
      <Hero eyebrow={d.nav.examples} title={e.title} lede={e.lede} />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {e.demos.map((x) => (
            <div key={x.key} className="card overflow-hidden flex flex-col">
              <div className="p-6 text-white" style={{ background: brand[x.key] }}><p className="text-[10px] font-mono uppercase tracking-widest opacity-80">{x.slug}.plekk.be</p><p className="text-2xl font-bold font-display">{x.name}</p></div>
              <div className="p-6 flex-1 flex flex-col"><p className="text-muted flex-1">{x.body}</p><a href={appUrl(`/z/${x.slug}`, href(lang, "contact"))} className="mt-5 btn font-bold text-white" style={{ background: brand[x.key] }}>{x.cta} →</a></div>
            </div>
          ))}
        </div>
      </Section>
      <Section className="bg-surface border-y border-line">
        <H2>{e.screensTitle}</H2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {[<AgendaMock key="a" m={d.mock} />, <ReservationsMock key="r" m={d.mock} />, <KitchenMock key="k" m={d.mock} />, <TodayMock key="t" m={d.mock} />].map((mock, i) => (
            <div key={i}><div className="max-w-md">{mock}</div><h3 className="mt-4 font-bold text-lg">{e.screens[i].title}</h3><p className="text-muted">{e.screens[i].body}</p></div>
          ))}
        </div>
      </Section>
      <Section dark>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <H2>{d.demo.dashboardTitle}</H2>
            <p className="mt-4 text-lg text-[#C9D1CB] max-w-xl">{d.demo.dashboardBody}</p>
            <div className="mt-8 grid gap-3">
              {e.demos.map((x) => (
                <a key={x.key} href={appUrl(`/api/demo/login?next=/app/${x.slug}`, href(lang, "contact"))} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.08] transition">
                  <Mark size={32} tile={brand[x.key]} id={`dash-${x.key}`} />
                  <span className="flex-1"><span className="font-bold block">{x.name}</span><span className="text-sm text-[#9AA69E] font-mono">/app/{x.slug}</span></span>
                  <span className="font-bold whitespace-nowrap" style={{ color: "var(--green)" }}>{d.demo.openDashboard} →</span>
                </a>
              ))}
            </div>
            {appAvailable ? <p className="mt-4 text-xs text-[#9AA69E]">demo@plekk.be · plekk1234 · <a href={appUrl("/login")} className="underline">/login</a></p> : <p className="mt-4 text-sm rounded-lg border border-white/15 p-3 text-[#C9D1CB]" id="demo-offline">De live demo komt binnenkort online. Wil je hem nu al zien? <Link href={href(lang, "contact")} className="underline text-white">Vraag een demo aan</Link> en we tonen hem ter plaatse of via video.</p>}
          </div>
          <div>
            <h3 className="text-2xl font-bold">{d.demo.tryTitle}</h3>
            <ol className="mt-6 space-y-4">
              {d.demo.tries.map((t, i) => <li key={t} className="flex gap-4"><span className="w-8 h-8 rounded-full shrink-0 inline-flex items-center justify-center font-bold text-ink" style={{ background: "var(--green)" }}>{i + 1}</span><span className="text-[#E6EBE7] pt-1">{t}</span></li>)}
            </ol>
          </div>
        </div>
      </Section>
      <Section>
        <H2>{e.embedTitle}</H2>
        <Lede>{e.embedBody}</Lede>
        <pre className="mt-6 rounded-2xl bg-[#101814] text-[#C9F7DA] p-5 text-sm overflow-x-auto font-mono"><code>{`<a href="https://kapsalon-lien.plekk.be" class="plekk-button">${d.common.bookNow}</a>\n<script src="https://plekk.be/widget.js" data-org="kapsalon-lien"></script>`}</code></pre>
      </Section>
      <Cta title={d.home.ctaTitle} body={d.home.ctaBody} primary={{ label: d.common.getStarted, href: href(lang, "contact") }} />
    </>
  );
}

/* ---------- Over ---------- */
function About({ lang, d }: P) {
  const a = d.about;
  return (
    <>
      <Hero eyebrow={d.nav.about} title={a.title} lede={a.lede} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5 text-lg max-w-2xl">{a.body.map((p) => <p key={p}>{p}</p>)}</div>
          <aside className="card p-7 self-start"><Mark size={48} id="about-mark" /><h3 className="mt-4 text-xl font-bold">{a.founderTitle}</h3><p className="mt-2 text-muted">{a.founderBody}</p><a href="https://marleo.tech" className="mt-4 inline-block underline font-semibold">marleo.tech →</a></aside>
        </div>
      </Section>
      <Section dark>
        <H2>{a.valuesTitle}</H2>
        <div className="grid gap-5 md:grid-cols-3 mt-10">{a.values.map((v, i) => <div key={v.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><span className="font-mono text-xs" style={{ color: "var(--green)" }}>{String(i + 1).padStart(2, "0")}</span><h3 className="mt-2 text-xl font-bold">{v.title}</h3><p className="mt-2 text-[#C9D1CB]">{v.body}</p></div>)}</div>
      </Section>
      <Cta title={d.home.ctaTitle} body={d.home.ctaBody} primary={{ label: d.common.contactUs, href: href(lang, "contact") }} />
    </>
  );
}

/* ---------- Contact ---------- */
function Contact({ d }: P) {
  const c = d.contact;
  return (
    <>
      <Hero eyebrow={d.nav.contact} title={c.title} lede={c.lede} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <ContactForm d={d} />
          <aside className="space-y-4 text-lg">
            <p><a href={`mailto:${c.email}`} className="font-bold underline underline-offset-4">{c.email}</a></p>
            <p><a href={`tel:${c.phone.replace(/\s/g, "")}`} className="font-bold">{c.phone}</a></p>
            <p className="text-muted">{c.address}</p>
            <div className="pt-4"><Mark size={40} id="contact-mark" /></div>
          </aside>
        </div>
      </Section>
    </>
  );
}

/* ---------- Voorwaarden / Privacy ---------- */
function Legal({ d, page }: P) {
  const t = page === "terms" ? d.terms : d.privacy;
  return (
    <>
      <Hero eyebrow={t.updated} title={t.title} tone="muted" />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          <nav className="lg:sticky lg:top-24 self-start text-sm space-y-1.5 hidden lg:block">{t.sections.map((s, i) => <a key={s.title} href={`#s${i + 1}`} className="block text-muted hover:text-ink">{s.title}</a>)}</nav>
          <article className="max-w-3xl">
            <p className="text-lg text-muted">{t.intro}</p>
            {t.sections.map((s, i) => (
              <section key={s.title} id={`s${i + 1}`} className="mt-10">
                <h2 className="text-2xl font-bold">{s.title}</h2>
                {s.body.map((p) => <p key={p} className="mt-3 leading-relaxed">{p}</p>)}
              </section>
            ))}
          </article>
        </div>
      </Section>
    </>
  );
}
