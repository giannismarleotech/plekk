import "server-only";
import { eq, and, count } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { publicUrl } from "./bookings";

type Org = typeof schema.organisations.$inferSelect;
export type Step = { key: string; title: string; why: string; todo: string[]; href: string; cta: string; done: boolean };

/** Berekent per zaak welke onboarding-stappen al in orde zijn. Puur afgeleid van de data, niets extra op te slaan. */
export async function onboardingSteps(org: Org): Promise<Step[]> {
  const db = await getDb();
  const [resources, offerings, [{ n: bookings }]] = await Promise.all([
    db.query.resources.findMany({ where: and(eq(schema.resources.orgId, org.id), eq(schema.resources.active, true)) }),
    db.query.offerings.findMany({ where: and(eq(schema.offerings.orgId, org.id), eq(schema.offerings.active, true)) }),
    db.select({ n: count() }).from(schema.bookings).where(eq(schema.bookings.orgId, org.id)),
  ]);
  const m = org.mode;
  const link = publicUrl(org.slug);
  const infoDone = !!(org.address && org.phone && org.email);
  const hoursDone = Object.keys(org.openingHours ?? {}).length > 0;
  const items = offerings.filter((o) => o.kind !== "shift");
  const staff = resources.filter((r) => r.kind === "staff");
  const tables = resources.filter((r) => r.kind === "table");
  const kitchen = resources.find((r) => r.kind === "kitchen");
  const brandDone = org.brandColor.toLowerCase() !== "#0f7a38";

  const steps: Step[] = [
    { key: "info", title: "Gegevens van je zaak", why: "Deze staan op je boekingspagina en in elke bevestigingsmail naar je klanten.", todo: ["Adres, telefoon en e-mail invullen", "Een korte omschrijving en slogan (optioneel)", "De taal van je klanten kiezen"], href: "/instellingen", cta: "Gegevens invullen", done: infoDone },
    { key: "hours", title: "Openingsuren", why: "Klanten kunnen enkel boeken binnen je openingsuren. Wij hebben standaarduren ingevuld; controleer ze.", todo: ["Per dag begin- en einduur (tweede blok = na de middagpauze)", "Gesloten dag: velden leeg laten", ...(m === "restaurant" ? ["De shifts (lunch/diner) staan onder Tafels & shifts"] : [])], href: "/instellingen", cta: "Uren nakijken", done: hoursDone },
  ];
  if (m === "salon") {
    steps.push(
      { key: "team", title: "Je team", why: "Klanten kiezen bij wie ze boeken. Elke medewerker heeft een eigen agenda.", todo: ["Elke medewerker toevoegen met naam", "Wie niet meer werkt: deactiveren, niet verwijderen (oude afspraken blijven)"], href: "/aanbod", cta: "Team beheren", done: staff.length > 0 && !staff.some((s) => /^Medewerker \d+$/.test(s.name)) },
      { key: "services", title: "Diensten en prijzen", why: "Elke behandeling met duur en prijs. De duur bepaalt hoeveel tijd er in de agenda wordt geblokkeerd.", todo: ["Behandelingen toevoegen (naam, duur, prijs)", "Categorieën gebruiken: Knippen, Kleuren, Styling…", "Volgorde bepalen met het cijfer 'Volgorde'"], href: "/aanbod", cta: "Diensten toevoegen", done: items.length >= 1 },
    );
  } else if (m === "restaurant") {
    steps.push(
      { key: "tables", title: "Tafels en shifts", why: "Plekk wijst reservaties automatisch toe aan een tafel die groot genoeg is. Klopt je tafelplan, dan klopt je bezetting.", todo: ["Elke tafel met aantal zitplaatsen (5 voorbeeldtafels staan al klaar; pas aan)", "Shifts nakijken: lunch en diner met begin- en einduur", "Pacing (max. nieuwe couverts per kwartier) en waarborg staan onder Instellingen"], href: "/aanbod", cta: "Tafels nakijken", done: tables.length > 0 },
    );
  } else {
    steps.push(
      { key: "menu", title: "Je menu", why: "Alles wat klanten kunnen bestellen, met prijs en opties (sauzen, extra's, formaat).", todo: ["Producten toevoegen per categorie: Frieten, Snacks, Burgers, Dranken…", "Opties per product: bv. 'Saus: Mayonaise=0.80, Andalouse=0.90'", "Verplichte keuze: uitroepteken achter de naam (Formaat!)"], href: "/aanbod", cta: "Menu opbouwen", done: items.length >= 3 },
      { key: "kitchen", title: "Keukencapaciteit", why: "Bepaalt hoeveel bestellingen je per tijdslot aanneemt, zodat je niet overspoeld wordt.", todo: [`Nu: ${kitchen?.capacity ?? 6} bestellingen per slot van ${org.settings.slotIntervalMin} min — pas aan naar wat je keuken aankan`, `Bereidingstijd (nu ${org.settings.prepMinutes ?? 20} min) onder Instellingen`], href: "/aanbod", cta: "Capaciteit instellen", done: !!kitchen },
    );
  }
  steps.push(
    { key: "brand", title: "Huisstijl", why: "Je boekingspagina in je eigen kleur voelt voor klanten als jouw site, niet als een externe app.", todo: ["Kies je huisstijlkleur onder Instellingen → Zaak", "Logo en foto's: stuur ze naar hallo@plekk.be, wij zetten ze erop"], href: "/instellingen", cta: "Kleur kiezen", done: brandDone },
    { key: "test", title: "Doe zelf een testboeking", why: "Zo zie je exact wat je klant ziet, en of de bevestigingsmail goed aankomt.", todo: ["Open je boekingspagina op je gsm", `Boek een ${m === "takeaway" ? "bestelling" : m === "restaurant" ? "tafel" : "afspraak"} op je eigen naam`, "Kijk in Agenda en annuleer ze daar"], href: link, cta: "Open je boekingspagina", done: bookings > 0 },
    { key: "share", title: "Deel je link", why: "Zonder link geen boekingen. Zet hem overal waar klanten je vinden.", todo: ["Google Bedrijfsprofiel: knop 'Reserveren' of 'Bestellen'", "Instagram en Facebook: link in bio en knop 'Boeken'", "QR-code op de toog, de deur en je kaart (download onder Instellingen → Je links)", "Eigen website: knop of widget plakken (code staat klaar onder Instellingen)"], href: "/instellingen", cta: "Links en QR ophalen", done: bookings > 1 },
  );
  return steps;
}
