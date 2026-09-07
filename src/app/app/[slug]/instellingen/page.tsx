import { requireOrgAccess } from "@/lib/auth";
import { weekdayNames } from "@/lib/format";
import { updateSettings } from "../actions";
import { PasswordForm } from "@/components/dashboard/PasswordForm";
import { site } from "@/config/site";
import { publicUrl } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: PageProps<"/app/[slug]/instellingen">) {
  const { slug } = await params;
  const { org } = (await requireOrgAccess(slug))!;
  const s = org.settings;
  const action = updateSettings.bind(null, slug);
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (<>
    <form action={action} className="space-y-8 max-w-3xl">
      <div><h1 className="text-2xl font-bold">Instellingen</h1><p className="text-sm text-muted mt-1">Alles wat je hier wijzigt, staat meteen op je boekingspagina. Klik onderaan op Opslaan.</p></div>

      <section className="card p-5 grid gap-3 sm:grid-cols-2 text-sm">
        <p className="sm:col-span-2 font-bold text-base">Zaak</p>
        <F label="Naam"><input name="name" defaultValue={org.name} className="input" /></F>
        <F label="Slogan"><input name="tagline" defaultValue={org.tagline ?? ""} className="input" /></F>
        <F label="Omschrijving" wide><textarea name="description" defaultValue={org.description ?? ""} rows={2} className="input" /></F>
        <F label="Telefoon"><input name="phone" defaultValue={org.phone ?? ""} className="input" /></F>
        <F label="E-mail"><input name="email" type="email" defaultValue={org.email ?? ""} className="input" /></F>
        <F label="Adres"><input name="address" defaultValue={org.address ?? ""} className="input" /></F>
        <F label="Gemeente"><input name="city" defaultValue={org.city ?? ""} className="input" /></F>
        <F label="Huisstijlkleur"><input name="brandColor" type="color" defaultValue={org.brandColor} className="h-10 w-20 rounded border border-line" /></F>
        <F label="Taal van je klanten"><select name="locale" defaultValue={org.locale} className="input"><option value="nl">Nederlands</option><option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option></select></F>
      </section>

      <section className="card p-5 text-sm">
        <p className="font-bold text-base mb-3">Openingsuren <span className="font-normal text-muted">(leeg = gesloten; tweede blok voor middagpauze)</span></p>
        <div className="grid gap-2">
          {order.map((d) => {
            const b = org.openingHours[String(d)] ?? [];
            return (
              <div key={d} className="grid grid-cols-[6rem_repeat(4,1fr)] gap-2 items-center">
                <span className="font-semibold">{weekdayNames[d]}</span>
                <input name={`d${d}_open1`} defaultValue={b[0]?.open ?? ""} placeholder="09:00" className="input py-1.5 font-mono" />
                <input name={`d${d}_close1`} defaultValue={b[0]?.close ?? ""} placeholder="12:00" className="input py-1.5 font-mono" />
                <input name={`d${d}_open2`} defaultValue={b[1]?.open ?? ""} placeholder="13:00" className="input py-1.5 font-mono" />
                <input name={`d${d}_close2`} defaultValue={b[1]?.close ?? ""} placeholder="18:00" className="input py-1.5 font-mono" />
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5 grid gap-3 sm:grid-cols-2 text-sm">
        <p className="sm:col-span-2 font-bold text-base">Boekingsregels</p>
        <F label="Tijdraster (min)"><input name="slotIntervalMin" type="number" min={5} step={5} defaultValue={s.slotIntervalMin} className="input" /></F>
        <F label="Minimum vooraf (min)"><input name="leadTimeMin" type="number" min={0} defaultValue={s.leadTimeMin} className="input" /></F>
        <F label="Hoe ver vooruit (dagen)"><input name="horizonDays" type="number" min={1} defaultValue={s.horizonDays} className="input" /></F>
        <F label="Zelf annuleren tot (uur vooraf)"><input name="cancelHoursBefore" type="number" min={0} defaultValue={s.cancelHoursBefore} className="input" /></F>
        <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="ownerNotifications" defaultChecked={s.ownerNotifications !== false} /> Mail naar {org.email || "het e-mailadres van de zaak"} bij elke nieuwe boeking</label>
        {org.mode === "restaurant" && (<>
          <F label="Max. nieuwe couverts per slot (pacing)"><input name="maxCoversPerSlot" type="number" min={1} defaultValue={s.maxCoversPerSlot ?? 12} className="input" /></F>
          <F label="Waarborg vanaf (personen)"><input name="depositFromPartySize" type="number" min={1} defaultValue={s.depositFromPartySize ?? ""} className="input" /></F>
          <F label="Waarborg per persoon (€)"><input name="depositPerPerson" inputMode="decimal" defaultValue={s.depositCentsPerPerson ? (s.depositCentsPerPerson / 100).toFixed(2) : ""} className="input" /></F>
        </>)}
        {org.mode === "takeaway" && (<>
          <F label="Bereidingstijd (min)"><input name="prepMinutes" type="number" min={5} defaultValue={s.prepMinutes ?? 20} className="input" /></F>
          <F label="Max. bestellingen per slot"><input name="maxOrdersPerSlot" type="number" min={1} defaultValue={s.maxOrdersPerSlot ?? 6} className="input" /></F>
          <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="prepayRequired" defaultChecked={!!s.prepayRequired} /> Vooraf betalen verplicht (Mollie)</label>
        </>)}
      </section>

      <button className="btn-brand">Opslaan</button>
    </form>
    <section className="card p-5 text-sm max-w-3xl mt-8">
      <p className="font-bold text-base mb-2">Je links</p>
      <p className="text-muted">Zet deze op je Google Bedrijfsprofiel, Instagram, Facebook en je website.</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-[10rem_1fr]">
        <dt className="text-muted">Boekingspagina</dt><dd className="font-mono break-all"><a href={publicUrl(slug)} target="_blank" className="underline">{publicUrl(slug)}</a></dd>
        <dt className="text-muted">Knop op je site</dt><dd><code className="font-mono text-xs block bg-bg border border-line rounded p-2 overflow-x-auto">{`<a href="${publicUrl(slug)}" style="background:${org.brandColor};color:#fff;padding:12px 20px;border-radius:10px;font-weight:700;text-decoration:none">${org.mode === "salon" ? "Boek nu" : org.mode === "restaurant" ? "Reserveer" : "Bestel online"}</a>`}</code></dd>
        <dt className="text-muted">Widget (pop-up)</dt><dd><code className="font-mono text-xs block bg-bg border border-line rounded p-2 overflow-x-auto">{`<script src="https://${site.domain}/widget.js" data-org="${slug}" data-color="${org.brandColor}"></script>`}</code></dd>
        <dt className="text-muted">QR-code</dt><dd><a className="underline" href={`/api/qr?slug=${slug}`} target="_blank">Download QR (SVG)</a> — voor op de toog, de deur of je kaart.</dd>
      </dl>
    </section>
    <section className="card p-5 text-sm max-w-3xl mt-8">
      <p className="font-bold text-base mb-2">Wachtwoord wijzigen</p>
      <PasswordForm />
    </section>
  </>
  );
}

function F({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="label">{label}</span>{children}</label>;
}
