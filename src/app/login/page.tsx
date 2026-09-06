import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { site } from "@/config/site";
import { currentUser } from "@/lib/auth";
import { login } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await currentUser()) redirect("/app");
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  return (
    <main className="flex-1 flex items-center justify-center px-5 py-12">
      <form action={login} className="card p-6 w-full max-w-sm space-y-4">
        <Link href="/" aria-label={site.name}><Logo size={26} /></Link>
        <h1 className="text-xl font-bold">Inloggen op je dashboard</h1>
        <div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" className="input" required autoComplete="email" defaultValue="demo@plekk.be" /></div>
        <div><label className="label" htmlFor="password">Wachtwoord</label><input id="password" name="password" type="password" className="input" required autoComplete="current-password" /></div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="btn-brand w-full">Inloggen</button>
        <p className="text-xs text-muted">Demo: demo@plekk.be / plekk1234</p>
      </form>
    </main>
  );
}
