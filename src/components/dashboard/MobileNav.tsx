"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavIcon, type IconName } from "./NavIcon";

export type NavItem = { href: string; label: string; short: string; icon: IconName; highlight?: boolean };

/**
 * Onderbalk op telefoon en tablet: vier hoofdknoppen + "Meer".
 * Op desktop verborgen; daar staat de zijbalk.
 */
export function MobileNav({ slug, items, extra }: { slug: string; items: NavItem[]; extra: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/app/${slug}`;
  const main = items.slice(0, 4);
  const rest = items.slice(4);
  const isActive = (href: string) => (href === "" ? path === base : path.startsWith(base + href));

  return (
    <>
      {open && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-ink/40" />
          <nav className="absolute bottom-[4.25rem] left-3 right-3 card p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {rest.map((it) => (
              <Link key={it.href} href={base + it.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-semibold ${isActive(it.href) ? "bg-bg" : ""}`}>
                <span className="text-muted"><NavIcon name={it.icon} size={20} /></span>{it.label}
              </Link>
            ))}
            <div className="border-t border-line mt-2 pt-2 px-3 pb-1 flex flex-col gap-2 text-sm">{extra}</div>
          </nav>
        </div>
      )}
      <div className="md:hidden h-[4.25rem]" aria-hidden />
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-line bg-surface flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {main.map((it) => {
          const active = isActive(it.href);
          return (
            <Link key={it.href} href={base + it.href} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold" style={{ color: active ? "var(--brand)" : undefined }}>
              <NavIcon name={it.icon} />
              <span className={active ? "" : "text-muted"}>{it.short}</span>
              {it.highlight && <span className="absolute mt-0.5 -ml-8 h-2 w-2 rounded-full" style={{ background: "var(--orange, #FF6B1A)" }} />}
            </Link>
          );
        })}
        <button onClick={() => setOpen((v) => !v)} aria-label="Meer" aria-expanded={open} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold">
          <NavIcon name="menu" />
          <span className="text-muted">Meer</span>
        </button>
      </nav>
    </>
  );
}
