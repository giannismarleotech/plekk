"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { href, locales, localeNames, type Dictionary, type Locale, type PageKey } from "@/i18n";
import { appUrl, appAvailable } from "@/config/app-url";

/**
 * Kop van de marketingsite: aankondigingsbalk, logo, hoofdmenu met uitklapbare
 * "Voor jouw zaak", taalkeuze en de donkere knop naar het dashboard.
 */
export function Header({ lang, d, page }: { lang: Locale; d: Dictionary; page: PageKey }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [solOpen, setSolOpen] = useState(false);
  const sectors: [PageKey, string][] = [["salons", d.nav.salons], ["restaurants", d.nav.restaurants], ["takeaway", d.nav.takeaway]];
  const main: [PageKey, string][] = [["how", d.nav.how], ["pricing", d.nav.pricing], ["about", d.nav.about], ["contact", d.nav.contact]];
  const isSector = sectors.some(([k]) => k === page);

  return (
    <>
      <div className="bg-ink text-white text-[13px]">
        <div className="wrap flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2.5 text-center">
          <span className="text-white/75">{d.landing.heroLede.split(".")[0]}.</span>
          <Link href={href(lang, "examples")} className="font-semibold underline underline-offset-2">{d.common.seeDemo} ↗</Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-md">
        <div className="wrap flex h-[72px] items-center gap-6">
          <Link href={href(lang, "home")} aria-label="Plekk" className="shrink-0"><Logo size={28} /></Link>

          <nav className="ml-4 hidden items-center gap-1 text-[15px] font-semibold lg:flex">
            <div className="relative" onMouseEnter={() => setSolOpen(true)} onMouseLeave={() => setSolOpen(false)}>
              <button onClick={() => setSolOpen((v) => !v)} aria-expanded={solOpen} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition hover:bg-surface ${isSector ? "text-ink" : "text-muted"}`}>
                {d.nav.solutions} <span aria-hidden className="text-[10px]">▾</span>
              </button>
              {solOpen && (
                <div className="absolute left-0 top-full w-64 pt-2">
                  <div className="card p-1.5 shadow-xl">
                    {sectors.map(([k, label]) => (
                      <Link key={k} href={href(lang, k)} onClick={() => setSolOpen(false)} className={`block rounded-xl px-3 py-2.5 hover:bg-bg ${page === k ? "bg-bg" : ""}`}>{label}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {main.map(([k, label]) => (
              <Link key={k} href={href(lang, k)} className={`rounded-xl px-3 py-2 transition hover:bg-surface ${page === k ? "text-ink" : "text-muted"}`}>{label}</Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setLangOpen((v) => !v)} className="h-10 rounded-xl border border-line bg-surface px-3 text-sm font-semibold uppercase tracking-wide" aria-haspopup="menu" aria-expanded={langOpen} aria-label={d.nav.language}>{lang} <span aria-hidden className="text-[10px]">▾</span></button>
              {langOpen && (
                <div role="menu" className="card absolute right-0 mt-2 w-40 p-1.5 shadow-xl" onMouseLeave={() => setLangOpen(false)}>
                  {locales.map((l) => (
                    <Link key={l} role="menuitem" href={href(l, page)} className={`block rounded-xl px-3 py-2 text-sm hover:bg-bg ${l === lang ? "font-bold" : ""}`} onClick={() => setLangOpen(false)}>{localeNames[l]}</Link>
                  ))}
                </div>
              )}
            </div>
            {appAvailable && <a href={appUrl("/login")} className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-muted hover:text-ink sm:inline-flex">{d.nav.login}</a>}
            <a href={appUrl("/registreren", href(lang, "contact"))} className="btn-dark btn-arrow hidden h-11 text-sm md:inline-flex">{d.nav.cta}</a>
            <button onClick={() => setOpen((v) => !v)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface lg:hidden" aria-label="Menu" aria-expanded={open}>
              <span className="relative block h-0.5 w-4 bg-ink before:absolute before:-top-1.5 before:h-0.5 before:w-4 before:bg-ink after:absolute after:top-1.5 after:h-0.5 after:w-4 after:bg-ink" />
            </button>
          </div>
        </div>

        {open && (
          <nav className="grid gap-1 border-t border-line bg-bg px-5 py-3 text-base font-semibold lg:hidden">
            {[...sectors, ...main].map(([k, label]) => (
              <Link key={k} href={href(lang, k)} className="rounded-xl px-3 py-2.5 hover:bg-surface" onClick={() => setOpen(false)}>{label}</Link>
            ))}
            <Link href={href(lang, "examples")} className="rounded-xl px-3 py-2.5 hover:bg-surface" onClick={() => setOpen(false)}>{d.nav.examples}</Link>
            {appAvailable && <a href={appUrl("/login")} className="rounded-xl px-3 py-2.5 text-muted">{d.nav.login}</a>}
            <a href={appUrl("/registreren", href(lang, "contact"))} className="btn-dark btn-arrow mt-2">{d.nav.cta}</a>
          </nav>
        )}
      </header>
    </>
  );
}
