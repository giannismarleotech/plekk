# Plekk live zetten — stap voor stap

Alles in dit project draait op één deploy. Na deze stappen zijn bereikbaar:

| Wat | URL |
|---|---|
| Website (4 talen) | https://plekk.be → /nl, /fr, /en, /de |
| Demo-overzicht | https://plekk.be/nl/demo |
| Demozaken (klantkant) | https://kapsalon-lien.plekk.be · https://bistro-de-leie.plekk.be · https://frituur-t-hoekske.plekk.be |
| Demo-dashboard (één klik) | https://plekk.be/api/demo/login?next=/app/kapsalon-lien |
| Login voor echte zaken | https://plekk.be/login |

Reken op een uur, waarvan het meeste wachten is op DNS.

## 1. Code op GitHub (5 min)

1. Maak op github.com een nieuwe **private** repository `plekk` (geen README aanvinken).
2. Op je Mac, in de uitgepakte map:
   ```bash
   git init && git add -A && git commit -m "Plekk"
   git branch -M main
   git remote add origin https://github.com/giannismarleotech/plekk.git
   git push -u origin main
   ```

## 2. Database op Supabase (10 min)

1. supabase.com → New project → naam `plekk`, regio **Frankfurt (eu-central-1)**, sterk wachtwoord bewaren.
2. Project Settings → Database → Connection string → tab **Transaction** (poort 6543). Kopieer; vul het wachtwoord in. Dit wordt `DATABASE_URL`.
3. Meer is niet nodig: de migraties draaien automatisch bij de eerste request.

> Zonder Supabase werkt de site ook (PGlite in `/tmp`), maar dan wordt de demo-data bij elke koude start opnieuw aangemaakt en gaan echte boekingen verloren. Prima om te tonen, niet om te verkopen.

## 3. Hosting op Vercel (10 min)

1. vercel.com → Add New → Project → importeer `plekk` van GitHub. Framework: Next.js (wordt herkend). Build command en output laten staan.
2. Environment Variables (Production én Preview):

   | Naam | Waarde |
   |---|---|
   | `DATABASE_URL` | de Supabase-string uit stap 2 |
   | `AUTH_SECRET` | een lange willekeurige string (bv. `openssl rand -base64 48`) |
   | `NEXT_PUBLIC_ROOT_DOMAIN` | `plekk.be` |
   | `RESEND_API_KEY` | (later) voor bevestigingsmails en het contactformulier |
   | `CONTACT_TO` | `hallo@plekk.be` of je eigen adres |
   | `MOLLIE_API_KEY` | (later) voor waarborgen en vooraf betalen |
   | `PUBLIC_BASE_URL` | `https://plekk.be` — voor links in mails en Mollie-redirects |
   | `CRON_SECRET` | willekeurige string; beveiligt `/api/cron/reminders` (Vercel cron staat in `vercel.json`, Netlify in `netlify/functions/reminders-cron.mjs`) |

3. Deploy. Je krijgt meteen `plekk-xxx.vercel.app`; daarop werkt alles behalve de subdomeinen (die hebben stap 4 nodig — de demozaken zijn tot dan bereikbaar via `/z/kapsalon-lien`).
4. Eerste data: lokaal `DATABASE_URL=... npm run db:seed`, of gewoon de site openen — bij een lege database wordt de demodata automatisch aangemaakt.

## 3b. Alternatief: Netlify

Werkt ook. `netlify.toml` staat in het project (Next.js-plugin, migraties en PGlite in de functie-bundel).

1. netlify.com → Add new site → Import from Git → `plekk`. Build command `npm run build`, publish `.next` (staan al in `netlify.toml`).
2. Site configuration → Environment variables: dezelfde als bij Vercel hierboven (`DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_ROOT_DOMAIN`, …). Zonder `DATABASE_URL` draait de demo op een tijdelijke database in `/tmp` van de functie: prima om te tonen, data verdwijnt bij een koude start.
3. Deploy. Demo's: `https://jouwsite.netlify.app/nl/demo` en `/z/kapsalon-lien`.
4. Subdomeinen (`kapsalon-lien.plekk.be`): Domain management → voeg `plekk.be` én `*.plekk.be` toe; Netlify DNS gebruiken is het eenvoudigst voor de wildcard-SSL.

## 4. Domein en subdomeinen (15 min + DNS-wachttijd)

1. Registreer **plekk.be** (dnsbelgium.be → kies een registrar, bv. Combell, of via Strato zoals trusttap.be).
2. Vercel → Project → Settings → Domains → voeg toe: `plekk.be`, `www.plekk.be` **en `*.plekk.be`** (de wildcard is wat `kapsalon-lien.plekk.be` mogelijk maakt).
3. Bij je registrar de DNS zetten die Vercel toont: een A-record voor `@` (76.76.21.21), een CNAME voor `www` en een CNAME voor `*` naar `cname.vercel-dns.com`.
   - Wildcard-SSL vereist dat de nameservers van het domein bij Vercel staan **of** dat je de DNS-verificatie doet die Vercel vraagt. Het eenvoudigst: zet de nameservers van plekk.be op `ns1.vercel-dns.com` en `ns2.vercel-dns.com`.
4. Na propagatie (meestal < 1 uur): `https://kapsalon-lien.plekk.be` toont de demo-kapper.

## 5. E-mail (5 min, kan later)

1. resend.com → Domains → `plekk.be` → de drie DNS-records toevoegen (SPF/DKIM).
2. API key aanmaken → `RESEND_API_KEY` op Vercel → Redeploy.
3. Vanaf dan: bevestigingsmails naar klanten, contactformulier in je mailbox.

## 6. Betalingen (later, voor de eerste betalende zaak)

1. mollie.com → account voor Marleo (KYC duurt enkele dagen: start vroeg).
2. Live API key → `MOLLIE_API_KEY`. Webhook staat al op `/api/webhooks/mollie`.
3. Voor geld dat rechtstreeks naar de zaak moet: Mollie Connect (één profiel per zaak) — staat op de roadmap in `src/lib/payments/mollie.ts`.

## 7. Eerste echte zaak aanmaken (2 min, ter plaatse)

1. Log in als platformbeheerder (`demo@plekk.be` — **verander dat wachtwoord meteen** via Instellingen → Wachtwoord wijzigen, of maak in `/admin` een eigen admin) en ga naar **`/admin`**.
2. "Nieuwe zaak": naam, soort (salon / restaurant / takeaway), gemeente, taal van de klanten, kleur, en de e-mail van de eigenaar. Je krijgt meteen het wachtwoord van de eigenaar te zien (eenmalig) en de twee links: `/z/<slug>` en `/app/<slug>`.
3. De zaak heeft dan al standaard openingsuren, instellingen en (voor een restaurant) tafels + shifts, (voor een frituur) een keuken. In het dashboard van de zaak: **Aanbod** invullen (behandelingen / tafels / menu met opties), **Instellingen** nakijken (uren, waarborg, bereidingstijd), en onder Instellingen → "Je links" de QR-code downloaden en de knop/widget-code kopiëren.
4. Testboeking op de gsm van de eigenaar. Klaar.

Wat er verder automatisch loopt: bevestigingsmail met beheer-/annuleerlink, herinnering 24 u vooraf (cron), Mollie-checkout zodra `MOLLIE_API_KEY` staat, CSV-export en maandrapport onder **Rapporten**.

Plan van een zaak (demo / founders / solo / zaak / plus / paused) zet je in `/admin`; `paused` blokkeert niets nog — dat is een label voor jou tot facturatie via Mollie Subscriptions gebouwd is.

## Checklist na livegang

- [ ] `https://plekk.be` laadt in de vier talen, taalwissel werkt
- [ ] `https://kapsalon-lien.plekk.be` toont de demobalk bovenaan
- [ ] Testboeking maken → verschijnt in het dashboard via `/api/demo/login?next=/app/kapsalon-lien`
- [ ] Contactformulier komt aan in je mailbox
- [ ] Ondernemingsnummer ingevuld in `src/i18n/dictionaries/*.ts` (zoek op `[in te vullen]`)
- [ ] Telefoonnummer op de contactpagina vervangen (`contact.phone` in de vier dictionaries)
- [ ] Google Search Console: sitemap `https://plekk.be/sitemap.xml` indienen
