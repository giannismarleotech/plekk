"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { href, locales, localeNames, type Dictionary, type Locale, type PageKey } from "@/i18n";
import { appUrl, appAvailable } from "@/config/app-url";

export function Header({ lang, d, page }: { lang: Locale; d: Dictionary; page: PageKey }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const items: [PageKey, string][] = [["how", d.nav.how], ["salons", d.nav.salons], ["restaurants", d.nav.restaurants], ["takeaway", d.nav.takeaway], ["pricing", d.nav.pricing], ["examples", d.nav.examples]];
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] border-b border-line">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center gap-6">
        <Link href={href(lang, "home")} aria-label="Plekk" className="shrink-0"><Logo size={26} /></Link>
        <nav className="hidden xl:flex items-center gap-0.5 text-[15px] font-semibold ml-2 whitespace-nowrap">
          {items.map(([k, label]) => (
            <Link key={k} href={href(lang, k)} className={`px-3 py-1.5 rounded-lg hover:bg-surface transition ${page === k ? "text-ink bg-surface" : "text-muted"}`}>{label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setLangOpen((v) => !v)} className="h-9 px-3 rounded-lg border border-line bg-surface text-sm font-semibold uppercase tracking-wide" aria-haspopup="menu" aria-expanded={langOpen} aria-label={d.nav.language}>{lang}</button>
            {langOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-40 card p-1 shadow-lg" onMouseLeave={() => setLangOpen(false)}>
                {locales.map((l) => (
                  <Link key={l} role="menuitem" href={href(l, page)} className={`block px-3 py-2 rounded-md text-sm hover:bg-bg ${l === lang ? "font-bold" : ""}`} onClick={() => setLangOpen(false)}>{localeNames[l]}</Link>
                ))}
              </div>
            )}
          </div>
          {appAvailable && <a href={appUrl("/login")} className="hidden sm:inline-flex h-9 items-center px-3 rounded-lg text-sm font-semibold text-muted hover:text-ink">{d.nav.login}</a>}
          <Link href={href(lang, "contact")} className="h-9 inline-flex items-center px-4 rounded-lg text-sm font-bold text-ink" style={{ background: "var(--green)" }}>{d.nav.cta}</Link>
          <button onClick={() => setOpen((v) => !v)} className="xl:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-line bg-surface" aria-label="Menu" aria-expanded={open}>
            <span className="block w-4 h-0.5 bg-ink relative before:absolute before:w-4 before:h-0.5 before:bg-ink before:-top-1.5 after:absolute after:w-4 after:h-0.5 after:bg-ink after:top-1.5" />
          </button>
        </div>
      </div>
      {open && (
        <nav className="xl:hidden border-t border-line bg-bg px-5 py-3 grid gap-1 text-base font-semibold">
          {items.map(([k, label]) => <Link key={k} href={href(lang, k)} className="px-3 py-2 rounded-lg hover:bg-surface" onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href={href(lang, "about")} className="px-3 py-2 rounded-lg hover:bg-surface" onClick={() => setOpen(false)}>{d.nav.about}</Link>
          {appAvailable && <a href={appUrl("/login")} className="px-3 py-2 rounded-lg text-muted">{d.nav.login}</a>}
        </nav>
      )}
    </header>
  );
}
