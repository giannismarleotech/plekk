import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { site } from "@/config/site";
import { currentUser } from "@/lib/auth";
import { register } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gratis starten" };

export default async function RegisterPage({ searchParams }: PageProps<"/registreren">) {
  if (await currentUser()) redirect("/app");
  const sp = await searchParams;
  const v = (k: string) => (typeof sp[k] === "string" ? String(sp[k]) : "");
  const error = v("error") || null;
  const mode = v("mode") || "salon";
  const modes = [
    { value: "salon", label: "Kapper / salon", sub: "afspraken per medewerker" },
    { value: "restaurant", label: "Restaurant / bistro", sub: "tafelreservaties" },
    { value: "takeaway", label: "Frituur / takeaway", sub: "bestellen om af te halen" },
  ];
  return (
    <main className="flex-1 flex items-center justify-center px-5 py-12">
      <form action={register} className="card p-6 w-full max-w-lg space-y-5">
        <Link href="/" aria-label={site.name}><Logo size={26} /></Link>
        <div>
          <h1 className="text-2xl font-bold">Maak je zaak boekbaar</h1>
          <p className="text-sm text-muted mt-1">Gratis proberen, geen kaart nodig. In 2 minuten heb je een eigen boekingspagina; daarna leidt een stappenplan je door de rest.</p>
        </div>
        <fieldset className="grid gap-2 sm:grid-cols-3">
          <legend className="label">Wat voor zaak?</legend>
          {modes.map((m) => (
            <label key={m.value} className="has-[:checked]:border-ink has-[:checked]:bg-bg border border-line rounded-xl p-3 cursor-pointer">
              <input type="radio" name="mode" value={m.value} defaultChecked={mode === m.value} className="sr-only" />
              <span className="block font-bold text-sm">{m.label}</span><span className="block text-xs text-muted">{m.sub}</span>
            </label>
          ))}
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="label">Naam van je zaak</span><input name="name" required minLength={2} defaultValue={v("name")} className="input" placeholder="Kapsalon Lien" /></label>
          <label className="block"><span className="label">Gemeente</span><input name="city" defaultValue={v("city")} className="input" placeholder="Deinze" autoComplete="address-level2" /></label>
          <label className="block"><span className="label">Telefoon zaak</span><input name="phone" className="input" placeholder="+32 9 …" autoComplete="tel" /></label>
          <label className="block"><span className="label">Jouw naam</span><input name="ownerName" defaultValue={v("ownerName")} className="input" autoComplete="name" /></label>
          <label className="block"><span className="label">Taal van je klanten</span><select name="locale" className="input" defaultValue="nl"><option value="nl">Nederlands</option><option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option></select></label>
          <label className="block"><span className="label">E-mail (= je login)</span><input name="email" type="email" required defaultValue={v("email")} className="input" autoComplete="email" /></label>
          <label className="block"><span className="label">Wachtwoord (min. 8 tekens)</span><input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /></label>
        </div>
        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="terms" required className="mt-1" /><span>Ik ga akkoord met de <a href="/nl/algemene-voorwaarden/" target="_blank" className="underline">algemene voorwaarden</a> en de <a href="/nl/privacyverklaring/" target="_blank" className="underline">privacyverklaring</a>.</span></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="btn-brand w-full">Start gratis</button>
        <p className="text-xs text-muted text-center">Al een account? <Link href="/login" className="underline">Inloggen</Link></p>
      </form>
    </main>
  );
}
