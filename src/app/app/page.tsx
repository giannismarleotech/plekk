import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, orgsForUser } from "@/lib/auth";
import { modeLabels } from "@/config/site";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const orgs = await orgsForUser(user.id, user.isPlatformAdmin);
  if (orgs.length === 1 && !user.isPlatformAdmin) redirect(`/app/${orgs[0].slug}`);
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 flex-1">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jouw zaken</h1>
        <div className="flex gap-4 text-sm">{user.isPlatformAdmin && <Link href="/admin" className="underline font-semibold">Platformbeheer</Link>}<form action={logout}><button className="underline">Uitloggen</button></form></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {orgs.map((o) => (
          <Link key={o.id} href={`/app/${o.slug}`} className="card p-4 hover:shadow-md transition" style={{ borderLeft: `4px solid ${o.brandColor}` }}>
            <p className="text-xs font-mono uppercase tracking-wider text-muted">{modeLabels[o.mode].verb}</p>
            <p className="font-bold text-lg">{o.name}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
