import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgAccess } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { site, modeLabels } from "@/config/site";
import { logout } from "@/app/login/actions";
import { DemoBanner } from "@/components/DemoBanner";
import { orgsForUser } from "@/lib/auth";
import { InstallApp } from "@/components/dashboard/InstallApp";
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
  const nav = [
    ...(steps.length && todo ? [["/start", `Aan de slag (${todo})`]] : []),
    ["", "Vandaag"],
    ["/agenda", org.mode === "takeaway" ? "Bestellingen" : "Agenda"],
    ...(org.mode === "takeaway" ? [["/keuken", "Keukenscherm"]] : []),
    ["/klanten", "Klanten"],
    ["/rapporten", "Rapporten"],
    ["/aanbod", org.mode === "salon" ? "Diensten & team" : org.mode === "restaurant" ? "Tafels & shifts" : "Menu"],
    ["/instellingen", "Instellingen"],
    ...(steps.length && !todo ? [["/start", "Stappenplan"]] : []),
  ];
  return (
    <div className="flex-1 flex flex-col" style={{ ["--brand" as string]: org.brandColor }}>
      {demoOrgs && <DemoBanner variant="dashboard" switcher={demoOrgs} />}
    <div className="flex-1 grid md:grid-cols-[230px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r border-line bg-surface p-4 flex flex-wrap md:flex-col gap-2 md:gap-1 items-center md:items-stretch">
        <Link href={user.isPlatformAdmin ? "/admin" : "/app"} className="mr-3 md:mr-0 md:mb-2" aria-label={site.name}><Logo size={22} /></Link>
        <div className="hidden md:block mb-3">
          <p className="text-xs font-mono uppercase tracking-wider text-muted">{modeLabels[org.mode].verb}</p>
          <p className="font-bold leading-tight">{org.name}</p>
        </div>
        {nav.map(([href, label]) => (
          <Link key={href} href={`/app/${slug}${href}`} className={`text-sm font-semibold rounded-lg px-3 py-2 hover:bg-bg whitespace-nowrap ${href === "/start" && todo ? "text-white" : ""}`} style={href === "/start" && todo ? { background: "var(--brand)" } : undefined}>{label}</Link>
        ))}
        <div className="md:mt-auto md:pt-4 md:border-t md:border-line flex md:flex-col gap-3 text-sm ml-auto md:ml-0">
          <Link href={`/z/${slug}`} target="_blank" className="underline whitespace-nowrap">Publieke pagina ↗</Link>
          <InstallApp />
          <form action={logout}><button className="text-muted hover:underline whitespace-nowrap">Uitloggen ({user.name.split(" ")[0]})</button></form>
        </div>
      </aside>
      <main className="p-5 md:p-8 min-w-0">{children}</main>
    </div>
    </div>
  );
}
