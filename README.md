# Plekk

Boeken, reserveren en bestellen voor lokale zaken. Eén platform, drie modes:

| Mode | Voor | Klant doet | Zaak krijgt |
|---|---|---|---|
| `salon` | kappers, barbiers, beauty, nagels | kiest behandeling → medewerker → tijdslot | agenda per medewerker |
| `restaurant` | restaurants, bistro's | kiest aantal personen → tijdslot | reservatielijst, tafeltoewijzing, pacing, waarborg |
| `takeaway` | frituren, pizzeria's, takeaway | stelt bestelling samen → afhaalslot | bestellijst + keukenscherm (KDS) |

Een product van [Marleo](https://marleo.tech). Geen commissie, ooit.

## Starten

```bash
npm install
npm run dev
```

Meer is niet nodig: zonder `DATABASE_URL` draait Postgres in-process (PGlite) in `./.data`, de migraties lopen automatisch en drie demozaken worden aangemaakt.

- Landingspagina: http://localhost:3000
- Demozaken: `/z/kapsalon-lien`, `/z/bistro-de-leie`, `/z/frituur-t-hoekske` (of `kapsalon-lien.localhost:3000`)
- Dashboard: http://localhost:3000/login → `demo@plekk.be` / `plekk1234`

## Productie (Vercel + Supabase)

1. Supabase-project in EU (Frankfurt). Kopieer de *Transaction pooler* connection string naar `DATABASE_URL`.
2. `AUTH_SECRET` = lange willekeurige string. `NEXT_PUBLIC_ROOT_DOMAIN=plekk.be`.
3. Migraties draaien automatisch bij de eerste request (`AUTO_MIGRATE=false` om dat uit te zetten en `npm run db:migrate` handmatig te draaien). Eerste data: `npm run db:seed`.
4. Wildcard-domein `*.plekk.be` op Vercel koppelen; `src/proxy.ts` mapt `kapsalon-lien.plekk.be` → `/z/kapsalon-lien`.
5. Optioneel: `RESEND_API_KEY` (bevestigingsmails), `MOLLIE_API_KEY` (waarborgen / vooraf betalen, webhook op `/api/webhooks/mollie`).

## Structuur

```
src/config/site.ts          merknaam, domein, labels per mode  ← omdopen = hier
src/db/schema.ts            Drizzle-schema: organisations, resources, offerings, customers, bookings, booking_items, users, memberships
src/db/index.ts             db-client: postgres-js (prod) of PGlite (lokaal), auto-migrate
src/db/seed.ts              demodata (3 zaken, 1 login)
src/lib/availability.ts     de beschikbaarheidsmotor (pure functies, per mode)
src/lib/bookings.ts         services: slots, boeking aanmaken (herberekent prijzen en beschikbaarheid server-side)
src/lib/auth.ts             sessies (HMAC-cookie) + toegang per organisatie
src/lib/notify.ts           bevestigingsmail (Resend of console)
src/lib/payments/mollie.ts  Mollie-koppeling
src/proxy.ts                subdomein → tenant
src/app/page.tsx            marketingsite
src/app/z/[slug]/           publieke boekingspagina + bevestiging
src/app/app/[slug]/         dashboard: vandaag, agenda (+ manuele boeking), keuken, klanten, rapporten, aanbod (editor incl. opties), instellingen (taal, links, QR, wachtwoord)
src/app/admin/              platformbeheer: zaken aanmaken, eigenaars koppelen, wachtwoord resetten, plan
src/app/api/cron/reminders  herinneringen 24 u vooraf (elk uur aanroepen)
src/app/api/qr, /api/export QR-code per zaak, CSV-export
public/widget.js            zwevende "Boek nu"-knop voor op de site van de zaak
src/i18n/public.ts          teksten van de boekingspagina in nl/fr/en/de (per zaak instelbaar)
scripts/e2e.mjs             Playwright-rooktest door de drie flows en het dashboard
```

## Datamodel in één zin

Een **resource** (medewerker / tafel / keuken) wordt op een **tijdstip** geboekt voor een **aanbod** (dienst / shift / menu-items); een **boeking** is de combinatie met een klant, een status en eventueel een betaling. Een bestelling is een boeking van een afhaalslot met items.

## Scripts

`dev` · `build` · `start` · `typecheck` · `db:generate` (nieuwe migratie na schemawijziging) · `db:migrate` · `db:seed` · `node scripts/e2e.mjs` (server moet draaien op BASE, standaard :3200)

## Roadmap (zie het productplan)

Fase 2: Mollie live, sms-herinneringen, wachtlijst, optie-editor voor menu's, tafelcombinaties, Google "Boek nu". Fase 3: QR-tafelbestellen, loyalty, menuschermen, kiosk-modus. Fase 4: bezorging, handhelds, white-label. GKS2-kassa: koppelen, niet bouwen.
