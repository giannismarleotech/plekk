import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgAccess } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { site, modeLabels } from "@/config/site";
import { logout } from "@/app/login/actions";
import { DemoBanner } from "@/components/DemoBanner";
import { orgsForUser } from "@/lib/auth";
import { InstallApp } from "@/components/dashboard/InstallApp";
import { MobileNav, type NavItem } from "@/components/dashboard/MobileNav";
import { NavIcon } from "@/components/dashboard/NavIcon";
import { onboardingSteps } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function OrgLayout({ children, params }: LayoutProps<"/app/[slug]">) {
  const { slug } = await params;
  const access = await requireOrgAccess(slug);
  if (!access) redirect("/login");
  const { org, user } = access;
  const demoOrgs = org.plan === "demo" ? (await orgsForUser(user.id, user.isPlatformAdmin)).filter((o) => o.plan === "demo").map((o) => ({ slug: o.slug, name: o.name })) : null;
  const steps = org.plan === "demo" ? [] : await onboardingSteps(org);
  const todo = steps.filter((x) => !x.done).length;
  const takeaway = org.mode === "takeaway";

  const nav: NavItem[] = [
    ...(steps.length && todo ? [{ href: "/start", label: `Aan de slag (${todo})`, short: "Start", icon: "rocket" as const, highlight: true }] : []),
    { href: "", label: "Vandaag", short: "Vandaag", icon: "home" as const },
    { href: "/agenda", label: takeaway ? "Bestellingen" : "Agenda", short: takeaway ? "Bestel" : "Agenda", icon: "calendar" as const },
    ...(takeaway ? [{ href: "/keuken", label: "Keukenscherm", short: "Keuken", icon: "kitchen" as const }] : []),
    { href: "/aanbod", label: org.mode === "salon" ? "Diensten & team" : org.mode === "restaurant" ? "Tafels & shifts" : "Menu", short: org.mode === "salon" ? "Diensten" : org.mode === "restaurant" ? "Tafels" : "Menu", icon: "list" as const },
    { href: "/klanten", label: "Klanten", short: "Klanten", icon: "people" as const },
    { href: "/rapporten", label: "Rapporten", short: "Cijfers", icon: "chart" as const },
    { href: "/instellingen", label: "Instellingen", short: "Instel", icon: "settings" as const },
    ...(steps.length && !todo ? [{ href: "/start", label: "Stappenplan", short: "Start", icon: "rocket" as const }] : []),
  ];

  const extra = (
    <>
      <Link href={`/z/${slug}`} target="_blank" className="underline whitespace-nowrap">Publieke pagina ↗</Link>
      <InstallApp />
      <form action={logout}><button className="text-muted hover:underline whitespace-nowrap">Uitloggen ({user.name.split(" ")[0]})</button></form>
    </>
  );

  return (
    <div className="flex-1 flex flex-col" style={{ ["--brand" as string]: org.brandColor }}>
      {demoOrgs && <DemoBanner variant="dashboard" switcher={demoOrgs} />}
      <div className="flex-1 grid md:grid-cols-[230px_1fr]">
        {/* Telefoon: compacte kop. Desktop: volledige zijbalk. */}
        <header className="md:hidden flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
          <Link href={user.isPlatformAdmin ? "/admin" : "/app"} aria-label={site.name}><Logo size={20} /></Link>
          <span className="min-w-0">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-muted leading-none">{modeLabels[org.mode].verb}</span>
            <span className="block font-bold leading-tight truncate">{org.name}</span>
          </span>
        </header>

        <aside className="hidden md:flex border-r border-line bg-surface p-4 flex-col gap-1">
          <Link href={user.isPlatformAdmin ? "/admin" : "/app"} className="mb-2" aria-label={site.name}><Logo size={22} /></Link>
          <div className="mb-3">
            <p className="text-xs font-mono uppercase tracking-wider text-muted">{modeLabels[org.mode].verb}</p>
            <p className="font-bold leading-tight">{org.name}</p>
          </div>
          {nav.map((it) => (
            <Link key={it.href + it.label} href={`/app/${slug}${it.href}`} className={`flex items-center gap-2.5 text-sm font-semibold rounded-lg px-3 py-2 hover:bg-bg whitespace-nowrap ${it.highlight ? "text-white" : ""}`} style={it.highlight ? { background: "var(--brand)" } : undefined}><span className={it.highlight ? "" : "text-muted"}><NavIcon name={it.icon} size={18} /></span>{it.label}</Link>
          ))}
          <div className="mt-auto pt-4 border-t border-line flex flex-col gap-3 text-sm">{extra}</div>
        </aside>

        <main className="p-4 md:p-8 min-w-0">{children}</main>
      </div>
      <MobileNav slug={slug} items={nav} extra={extra} />
    </div>
  );
}
