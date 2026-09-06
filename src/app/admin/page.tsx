import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, sql, eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { Logo } from "@/components/Logo";
import { modeLabels } from "@/config/site";
import { createOrgAction, addOwner, setPlan } from "./actions";
import { ResetPasswordButton } from "./ResetPasswordButton";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.isPlatformAdmin) redirect("/app");
  const sp = await searchParams;
  const db = await getDb();
  const orgs = await db.query.organisations.findMany({ orderBy: asc(schema.organisations.createdAt) });
  const counts = Object.fromEntries((await db.select({ orgId: schema.bookings.orgId, n: sql<number>`count(*)` }).from(schema.bookings).groupBy(schema.bookings.orgId)).map((r) => [r.orgId, Number(r.n)]));
  const owners = await db.query.memberships.findMany({ with: { user: true } });

  return (
    <div className="flex-1" style={{ ["--brand" as string]: "#1ED760" }}>
      <header className="border-b border-line bg-surface"><div className="mx-auto max-w-6xl px-5 h-14 flex items-center gap-4"><Link href="/app" aria-label="Plekk"><Logo size={22} /></Link><span className="font-mono text-xs uppercase tracking-wider text-muted">Platformbeheer</span><form action={logout} className="ml-auto"><button className="text-sm text-muted hover:underline">Uitloggen</button></form></div></header>
      <main className="mx-auto max-w-6xl px-5 py-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          {(sp.created || sp.owner) && (
            <div className="mb-6 rounded-xl border-2 p-4 text-sm" style={{ borderColor: "#1ED760", background: "#E9FBF0", color: "#101814" }}>
              <p className="font-bold">{sp.created ? `Zaak aangemaakt: ${sp.created}` : `Eigenaar gekoppeld: ${sp.owner}`}</p>
              {sp.pw && <p className="mt-1">Wachtwoord (eenmalig getoond, geef door aan de eigenaar): <code className="font-mono font-bold text-base">{String(sp.pw)}</code></p>}
              {sp.created && <p className="mt-1">Publieke pagina: <Link className="underline" href={`/z/${sp.created}`}>/z/{sp.created}</Link> · Dashboard: <Link className="underline" href={`/app/${sp.created}`}>/app/{sp.created}</Link></p>}
            </div>
          )}
          <h1 className="text-2xl font-bold mb-4">Zaken <span className="text-muted font-normal text-lg">({orgs.length})</span></h1>
          <div className="card divide-y divide-line">
            {orgs.map((o) => {
              const os = owners.filter((m) => m.orgId === o.id);
              return (
                <div key={o.id} className="p-4 flex flex-wrap gap-4 items-start">
                  <span className="w-3 h-10 rounded" style={{ background: o.brandColor }} />
                  <div className="flex-1 min-w-[16rem]">
                    <p className="font-bold text-lg">{o.name} <span className="text-xs font-mono text-muted">{o.slug}</span></p>
                    <p className="text-sm text-muted">{modeLabels[o.mode].verb} · {o.city ?? "—"} · {counts[o.id] ?? 0} boekingen · taal {o.locale}</p>
                    <p className="text-sm mt-1">{os.length ? os.map((m) => <span key={m.id} className="mr-3">{m.user.email}{m.user.isPlatformAdmin ? " (admin)" : ""}</span>) : <span className="text-muted">Geen eigenaar gekoppeld</span>}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                      <Link href={`/app/${o.slug}`} className="underline">Dashboard</Link><Link href={`/z/${o.slug}`} className="underline">Publieke pagina</Link>
                      <ResetPasswordButton orgId={o.id} />
                    </div>
                    <form action={addOwner.bind(null, o.id)} className="mt-2 flex flex-wrap gap-2 text-sm"><input name="name" placeholder="Naam eigenaar" className="input py-1 max-w-[12rem]" /><input name="email" type="email" placeholder="E-mail eigenaar" required className="input py-1 max-w-[16rem]" /><button className="btn-ghost py-1 text-sm">Eigenaar koppelen</button></form>
                  </div>
                  <form className="text-sm">
                    <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">Plan</p>
                    <div className="flex flex-wrap gap-1 max-w-[14rem]">{["demo", "founders", "solo", "zaak", "plus", "paused"].map((p) => <button key={p} formAction={setPlan.bind(null, o.id, p)} className={`text-xs px-2 py-1 rounded border ${o.plan === p ? "border-ink font-bold bg-bg" : "border-line"}`}>{p}</button>)}</div>
                  </form>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="card p-5 self-start">
          <h2 className="text-xl font-bold">Nieuwe zaak</h2>
          <p className="text-sm text-muted mb-4">Met standaard openingsuren en instellingen per soort; de rest pas je aan in het dashboard van de zaak.</p>
          <form action={createOrgAction} className="grid gap-3 text-sm">
            <label className="block"><span className="label">Naam zaak</span><input name="name" required className="input" placeholder="Kapsalon Lien" /></label>
            <label className="block"><span className="label">Soort</span><select name="mode" className="input"><option value="salon">Salon — boeken (kapper, beauty, nagels)</option><option value="restaurant">Restaurant — reserveren</option><option value="takeaway">Frituur / takeaway — bestellen</option></select></label>
            <div className="grid grid-cols-2 gap-3"><label className="block"><span className="label">Gemeente</span><input name="city" className="input" placeholder="9800 Deinze" /></label><label className="block"><span className="label">Taal klanten</span><select name="locale" className="input"><option value="nl">Nederlands</option><option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option></select></label></div>
            <label className="block"><span className="label">Adres</span><input name="address" className="input" /></label>
            <div className="grid grid-cols-2 gap-3"><label className="block"><span className="label">Telefoon</span><input name="phone" className="input" /></label><label className="block"><span className="label">E-mail zaak</span><input name="email" type="email" className="input" /></label></div>
            <div className="grid grid-cols-2 gap-3"><label className="block"><span className="label">Huisstijlkleur</span><input name="brandColor" type="color" defaultValue="#0F7A38" className="h-10 w-full rounded border border-line" /></label><label className="block"><span className="label">Plan</span><select name="plan" className="input" defaultValue="founders">{["founders", "solo", "zaak", "plus", "demo"].map((p) => <option key={p}>{p}</option>)}</select></label></div>
            <label className="block"><span className="label">Slug (URL) <span className="font-normal text-muted">optioneel</span></span><input name="slug" className="input font-mono" placeholder="kapsalon-lien" /></label>
            <p className="font-bold mt-2">Eigenaar-login</p>
            <div className="grid grid-cols-2 gap-3"><label className="block"><span className="label">Naam</span><input name="ownerName" className="input" /></label><label className="block"><span className="label">E-mail</span><input name="ownerEmail" type="email" className="input" /></label></div>
            <label className="block"><span className="label">Wachtwoord <span className="font-normal text-muted">(leeg = automatisch)</span></span><input name="ownerPassword" className="input" /></label>
            <button className="btn-brand text-ink mt-2">Zaak aanmaken</button>
          </form>
        </aside>
      </main>
    </div>
  );
}
