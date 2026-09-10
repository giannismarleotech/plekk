# Plekk live zetten

Twee stukken, twee plekken. De **website** is statische HTML en kan overal staan.
De **app** (boeken, dashboard, betalingen) is Next.js en heeft Node.js nodig.

| Stuk | Wat het is | Waar het kan |
|---|---|---|
| Website (96 pagina's, nl/fr/en/de) | statische HTML | GitHub Pages, Strato via FTP, Cloudflare Pages |
| App (`/z/…`, `/app/…`, `/api/…`) | Next.js 16 | Cloudflare Workers, Vercel, een VPS — **niet** Strato webhosting |

---

## 1. Website

**Via GitHub Pages** — `.github/workflows/pages.yml` doet het bij elke push naar `main`:
het pakt `vendor/marketing-site.tar.gz` uit, zet `CNAME` op `plekk.marleo.tech` en
publiceert. Eenmalig in de repo: **Settings → Pages → Source: "GitHub Actions"**.
Daarna in Cloudflare een CNAME `plekk` → `giannismarleotech.github.io`.

**Via Strato (FTP)** — pak het archief lokaal uit en zet de inhoud in de map van
het subdomein. De `.htaccess` regelt de 404-pagina en compressie.

De site aanpassen doe je nooit rechtstreeks in `public/` — die map wordt bij elke
build overschreven. Pas `scripts/patch-site.py` aan, draai `npm run site:patch`,
en pak `public/` opnieuw in als `vendor/marketing-site.tar.gz`.

---

## 2. App: omgevingsvariabelen

Alles staat met uitleg in `.env.example`. Deze zijn niet optioneel:

| Variabele | Waar haal je ze | Zonder deze |
|---|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (Transaction pooler) | draait op een tijdelijke database die bij elke herstart leegloopt |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` | iedereen kan een login-cookie namaken |
| `ADMIN_EMAIL` + `ADMIN_PASSWORD` | zelf kiezen, minstens 10 tekens | geen beheerderstoegang |
| `RESEND_API_KEY` | Resend → API Keys | bevestigingsmails worden alleen gelogd, niet verstuurd |
| `MAIL_FROM` | een geverifieerd domein in Resend | Resend weigert de mail |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (`sk_live_…`) | geen abonnementen, geen waarborgen |
| `STRIPE_WEBHOOK_SECRET` | zie hieronder | elk abonnement blijft op "proefperiode" staan |
| `PUBLIC_BASE_URL` | het adres van je deploy | links in mails wijzen naar het verkeerde domein |

Het wachtwoord van de beheerder wijzig je door `ADMIN_PASSWORD` aan te passen en
opnieuw te starten — de app zet het bij elke start goed.

---

## 3. Stripe

De producten en prijzen staan al klaar op het Plekk-account:

| Formule | Per maand | Per jaar |
|---|---|---|
| Solo | € 19 | € 190 |
| Zaak | € 39 | € 390 |
| Zaak+ | € 69 | € 690 |

De prijs-id's zitten als terugval in `src/lib/plans.ts`; met `STRIPE_PRICE_*` in de
omgeving overschrijf je ze (handig om in testmodus te draaien).

**De webhook is het enige wat je nog met de hand moet doen:**

1. Stripe → Developers → Webhooks → **Add endpoint**
2. URL: `https://<jouw-app-domein>/api/webhooks/stripe`
3. Gebeurtenissen: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_succeeded`, `invoice.payment_failed`, `payment_intent.succeeded`,
   `charge.refunded`
4. Kopieer de **Signing secret** (`whsec_…`) naar `STRIPE_WEBHOOK_SECRET`

Zonder die stap gebeurt er niets zichtbaars: klanten kunnen betalen, maar Plekk
hoort het nooit en blijft denken dat de proefperiode loopt.

Zet in Stripe ook **Customer portal** aan (Settings → Billing → Customer portal),
anders werkt de knop "Facturen en betaalgegevens" niet.

---

## 4. Wat er gebeurt zonder betaling

- Nieuwe zaak → 14 dagen proefperiode, alles werkt.
- Nog 3 dagen of minder → rustige balk in het dashboard.
- Proef voorbij of abonnement gestopt → de boekingspagina toont "Online boeken staat
  even op pauze" met het telefoonnummer van de zaak. Niets wordt verwijderd; zodra er
  betaald is, staat alles meteen terug.
- Betaling mislukt → tien dagen respijt, met een waarschuwing in het dashboard.

Deze regels staan op één plek (`src/lib/plan-access.ts`) en worden getest met
`npm test`.

---

## 5. Controleren

```bash
npm run typecheck    # TypeScript
npm test             # abonnementsregels + webhookhandtekening
npm run build        # productiebuild
npm start            # server op :3000
npm run check:site   # alle 96 sitepagina's: status en oude teksten
npm run e2e          # boeken bij salon, restaurant en frituur + dashboard
```
