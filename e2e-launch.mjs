// Rooktest van de launch-features: admin → nieuwe zaak → eigenaar → menu → klant bestelt (FR) → annuleert → rapport/export/QR.
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3600";
const log = (m) => console.log("•", m);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

// 1. admin login → nieuwe zaak
await page.goto(BASE + "/login");
await page.fill("#password", "plekk1234");
await page.getByRole("button", { name: "Inloggen" }).click();
await page.waitForURL(/\/app/);
await page.goto(BASE + "/admin");
const nf = page.locator("aside form");
await nf.locator('input[name="name"]').fill("Pita Palace");
await nf.locator('select[name="mode"]').selectOption("takeaway");
await nf.locator('input[name="city"]').fill("9800 Deinze");
await nf.locator('select[name="locale"]').selectOption("fr");
await nf.locator('input[name="ownerName"]').fill("Ali");
await nf.locator('input[name="ownerEmail"]').fill("ali@pitapalace.be");
await nf.locator('input[name="ownerPassword"]').fill("pita12345");
await nf.getByRole("button", { name: "Zaak aanmaken" }).click();
await page.waitForURL(/created=/);
const slug = new URL(page.url()).searchParams.get("created");
log(`admin: zaak aangemaakt → ${slug}`);
await page.screenshot({ path: "/tmp/l1-admin.png", fullPage: true });

// 2. eigenaar logt in, voegt menu toe met opties
await ctx.clearCookies();
await page.goto(BASE + "/login");
await page.fill("#email", "ali@pitapalace.be");
await page.fill("#password", "pita12345");
await page.getByRole("button", { name: "Inloggen" }).click();
await page.waitForURL(new RegExp(`/app/${slug}`));
log("eigenaar: ingelogd, dashboard geopend");
await page.goto(`${BASE}/app/${slug}/aanbod`);
await page.getByText("+ Toevoegen").click();
const addForm = page.locator("details:has(summary:has-text('+ Toevoegen')) form");
await addForm.locator('input[name="name"]').fill("Pita kip");
await addForm.locator('input[name="category"]').fill("Pita's");
await addForm.locator('input[name="price"]').fill("6,50");
await addForm.locator('textarea[name="options"]').fill("Saus: Samurai=0, Andalouse=0, Looksaus=0\nExtra*: Feta=1.00, Dubbel vlees=2.50");
await addForm.getByRole("button", { name: "Toevoegen" }).click();
await page.waitForTimeout(800);
log("eigenaar: menu-item met 2 optiegroepen toegevoegd → " + (await page.locator("summary:has-text('Pita kip')").textContent()).trim().replace(/\s+/g, " "));

// 3. klant bestelt in het Frans
const cust = await ctx.newPage();
await cust.goto(`${BASE}/z/${slug}`);
const h2 = await cust.locator("main h2").first().textContent();
log("klant: pagina in het Frans → " + h2);
await cust.getByRole("button", { name: /Pita kip ajouter/i }).click();
await cust.getByRole("button", { name: /Feta/ }).click();
await cust.getByRole("button", { name: /^Ajouter · / }).click();
const slots = cust.locator("form section").nth(1).locator("button.tabular");
await cust.waitForTimeout(1500);
if ((await slots.count()) === 0) { await cust.locator("form section").nth(1).locator("button").nth(1).click(); await cust.waitForTimeout(1500); } // vandaag al gesloten → morgen
await slots.first().waitFor({ timeout: 15000 });
await slots.first().click();
await cust.fill("#name", "Claire Dupont"); await cust.fill("#phone", "+32 470 99 88 77"); await cust.fill("#email", "claire@example.be");
await cust.getByRole("button", { name: "Passer la commande" }).click();
await cust.waitForURL(/bevestigd/);
log("klant: " + (await cust.locator("h1").textContent()) + " · " + (await cust.locator("li.font-bold").textContent()).replace(/\s+/g, " "));
await cust.screenshot({ path: "/tmp/l2-confirm-fr.png", fullPage: true });

// 4. eigenaar ziet bestelling op keukenscherm, klant annuleert
await page.goto(`${BASE}/app/${slug}/keuken`);
log("keuken: " + (await page.locator("article").count()) + " bestelling(en) op het scherm");
await cust.locator("summary:has-text('Annuler')").click();
await cust.getByRole("button", { name: /annuler ma/i }).click();
await cust.waitForURL(/cancel=ok/);
log("klant: " + (await cust.locator("h1").textContent()));

// 5. manuele boeking, rapport, export, qr
await page.goto(`${BASE}/app/${slug}/agenda`);
await page.getByRole("button", { name: /Nieuwe bestelling/ }).click();
await page.fill('input[name="time"]', "18:30");
await page.fill('input[name="name"]', "Telefoonklant");
await page.fill('input[name="items"]', "2× pita kip");
await page.fill('input[name="total"]', "13");
await page.getByRole("button", { name: "Opslaan" }).click();
await page.waitForTimeout(1200);
log("agenda: manuele bestelling → " + (await page.locator("li:has-text('Telefoonklant')").count()) + " gevonden");
await page.goto(`${BASE}/app/${slug}/rapporten`);
await page.screenshot({ path: "/tmp/l3-rapport.png", fullPage: true });
log("rapport: " + (await page.locator("main p.text-3xl").first().textContent()) + " bestellingen deze maand");
const csv = await page.request.get(`${BASE}/api/export?slug=${slug}&what=bookings`);
log("export: " + csv.status() + " · " + (await csv.text()).split("\n").length + " regels");
const qr = await page.request.get(`${BASE}/api/qr?slug=${slug}`);
log("qr: " + qr.status() + " · " + (await qr.text()).length + " bytes svg");
await page.goto(`${BASE}/app/${slug}/instellingen`);
await page.screenshot({ path: "/tmp/l4-instellingen.png", fullPage: true });
const rem = await page.request.get(`${BASE}/api/cron/reminders`);
log("cron reminders: " + JSON.stringify(await rem.json()));
await browser.close();
