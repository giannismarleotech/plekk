import Link from "next/link";
import { Logo } from "@/components/Logo";
import { href, locales, localeNames, type Dictionary, type Locale, type PageKey } from "@/i18n";
import { site } from "@/config/site";

export function Footer({ lang, d, page }: { lang: Locale; d: Dictionary; page: PageKey }) {
  const col = (title: string, links: [PageKey, string][]) => (
    <div>
      <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#9AA69E] mb-3">{title}</p>
      <ul className="space-y-2 text-sm">{links.map(([k, l]) => <li key={k}><Link href={href(lang, k)} className="text-[#D8DED9] hover:text-white">{l}</Link></li>)}</ul>
    </div>
  );
  return (
    <footer className="bg-[#101814] text-white mt-24">
      <div className="mx-auto max-w-6xl px-5 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo size={26} tone="light" />
          <p className="mt-3 text-[#9AA69E] max-w-xs">{d.footer.tagline} {d.footer.noCommission}</p>
          <p className="mt-6 text-sm text-[#9AA69E]">{d.footer.madeBy} · <a href={site.companyUrl} className="underline hover:text-white">marleo.tech</a></p>
          <p className="mt-1 text-sm text-[#9AA69E]"><a href={`mailto:${d.contact.email}`} className="hover:text-white">{d.contact.email}</a></p>
        </div>
        {col(d.footer.product, [["how", d.nav.how], ["salons", d.nav.salons], ["restaurants", d.nav.restaurants], ["takeaway", d.nav.takeaway], ["pricing", d.nav.pricing], ["examples", d.nav.examples]])}
        {col(d.footer.company, [["about", d.nav.about], ["contact", d.nav.contact]])}
        <div>
          {col(d.footer.legal, [["terms", d.footer.terms], ["privacy", d.footer.privacy]])}
          <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#9AA69E] mb-3 mt-6">{d.nav.language}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">{locales.map((l) => <li key={l}><Link href={href(l, page)} className={l === lang ? "text-white font-bold" : "text-[#D8DED9] hover:text-white"}>{localeNames[l]}</Link></li>)}</ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-[#9AA69E] flex flex-wrap gap-4 justify-between">
          <span>© {new Date().getFullYear()} Marleo · Plekk</span>
          <span className="inline-flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--green)" }} /><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "var(--orange)" }} />{d.footer.noCommission}</span>
        </div>
      </div>
    </footer>
  );
}
