import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary, isLocale, href, type Locale } from "@/i18n";
import { Mark } from "@/components/Logo";

/** Smalle balk boven demozaken (publieke pagina én dashboard). Taal volgt de cookie van de marketingsite. */
export async function DemoBanner({ variant = "public", switcher, locale }: { variant?: "public" | "dashboard"; switcher?: { slug: string; name: string }[]; locale?: string }) {
  const c = locale ?? (await cookies()).get("plekk_lang")?.value ?? "nl";
  const lang: Locale = isLocale(c) ? c : "nl";
  const d = getDictionary(lang);
  return (
    <div className="bg-[#101814] text-white text-sm">
      <div className="mx-auto max-w-6xl px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-2"><Mark size={16} id={`demo-banner-${variant}`} /><span className="font-bold px-1.5 py-0.5 rounded text-[11px] uppercase tracking-wide" style={{ background: "var(--orange, #FF6B1A)" }}>{d.demo.badge}</span></span>
        <span className="text-[#C9D1CB]">{d.demo.banner}</span>
        {variant === "dashboard" && switcher && (
          <span className="inline-flex items-center gap-2 text-[#C9D1CB]">{d.demo.switchOrg}: {switcher.map((o) => <Link key={o.slug} href={`/app/${o.slug}`} className="underline hover:text-white">{o.name}</Link>)}</span>
        )}
        <Link href={href(lang, "examples")} className="ml-auto underline hover:text-[#1ED760] whitespace-nowrap">{d.demo.backToSite}</Link>
      </div>
    </div>
  );
}
