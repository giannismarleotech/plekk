// End-to-end rooktest: drie boekingsflows + dashboard. Draait tegen een lopende server (BASE).
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3200";
const shots = process.env.SHOTS ?? "/tmp/shots";
import { mkdirSync } from "node:fs";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const log = (m) => console.log("•", m);

// 1. Landing
await page.goto(BASE + "/");
await page.screenshot({ path: `${shots}/01-landing.png`, fullPage: true });

// 2. Salon
await page.goto(BASE + "/z/kapsalon-lien");
await page.getByLabel("Knippen heren").check();
await page.getByRole("button", { name: "Noor" }).click();
await page.waitForTimeout(800);
const slotBtns = page.locator("form section").nth(1).locator("button.tabular");
await page.waitForTimeout(1200); if ((await slotBtns.count()) === 0) { await page.locator("form section").nth(1).locator("button").nth(1).click(); }
await slotBtns.first().waitFor();
log(`salon: ${await slotBtns.count()} vrije slots op eerste dag`);
await slotBtns.nth(2).click();
await page.fill("#name", "Test Klant");
await page.fill("#phone", "+32 470 00 00 00");
await page.fill("#email", "test@example.be");
await page.screenshot({ path: `${shots}/02-salon-flow.png`, fullPage: true });
await page.getByRole("button", { name: "Afspraak bevestigen" }).click();
await page.waitForURL(/bevestigd/);
log("salon: " + (await page.locator("h1").textContent()));
await page.screenshot({ path: `${shots}/03-salon-confirmed.png`, fullPage: true });

// 3. Restaurant, 6 personen → waarborg
await page.goto(BASE + "/z/bistro-de-leie");
await page.getByRole("button", { name: "6", exact: true }).click();
const rslots = page.locator("form section").nth(1).locator("button.tabular");
await page.waitForTimeout(1200); if ((await rslots.count()) === 0) { await page.locator("form section").nth(1).locator("button").nth(1).click(); }
await rslots.first().waitFor();
log(`restaurant: ${await rslots.count()} slots voor 6p`);
await rslots.first().click();
await page.fill("#name", "Groep Test");
await page.fill("#phone", "+32 471 00 00 00");
await page.screenshot({ path: `${shots}/04-restaurant-flow.png`, fullPage: true });
await page.getByRole("button", { name: /Reserveren/ }).click();
await page.waitForURL(/bevestigd/);
log("restaurant: " + (await page.locator("h1").textContent()));

// 4. Frituur: 2 grote friet met andalouse + bicky
await page.goto(BASE + "/z/frituur-t-hoekske");
await page.getByRole("button", { name: "Grote friet toevoegen" }).click();
await page.getByRole("button", { name: /Andalouse/ }).click();
await page.getByRole("button", { name: /^Toevoegen · / }).click();
await page.getByRole("button", { name: "Grote friet toevoegen" }).click();
await page.getByRole("button", { name: /Andalouse/ }).click();
await page.getByRole("button", { name: /^Toevoegen · / }).click();
await page.getByRole("button", { name: "Frikandel toevoegen" }).click();
const pslots = page.locator("form section").nth(1).locator("button.tabular");
await page.waitForTimeout(1200); if ((await pslots.count()) === 0) { await page.locator("form section").nth(1).locator("button").nth(1).click(); }
await pslots.first().waitFor();
log(`frituur: ${await pslots.count()} afhaalslots`);
await pslots.first().click();
await page.fill("#name", "Jan Friet");
await page.fill("#phone", "+32 472 00 00 00");
await page.screenshot({ path: `${shots}/05-takeaway-flow.png`, fullPage: true });
await page.getByRole("button", { name: "Bestelling plaatsen" }).click();
await page.waitForURL(/bevestigd/);
log("frituur: " + (await page.locator("h1").textContent()) + " — " + (await page.locator("li.font-bold").textContent()));
await page.screenshot({ path: `${shots}/06-takeaway-confirmed.png`, fullPage: true });

// 5. Dashboard
await page.goto(BASE + "/login");
await page.fill("#password", "plekk1234");
await page.getByRole("button", { name: "Inloggen" }).click();
await page.waitForURL(/\/app/);
await page.goto(BASE + "/app/kapsalon-lien/agenda");
await page.screenshot({ path: `${shots}/07-salon-agenda.png`, fullPage: true });
await page.goto(BASE + "/app/bistro-de-leie/agenda");
await page.screenshot({ path: `${shots}/08-bistro-agenda.png`, fullPage: true });
await page.goto(BASE + "/app/frituur-t-hoekske/keuken");
await page.getByRole("button", { name: "In bereiding" }).first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${shots}/09-keuken.png`, fullPage: true });
await page.goto(BASE + "/app/frituur-t-hoekske");
await page.screenshot({ path: `${shots}/10-vandaag.png`, fullPage: true });
await page.goto(BASE + "/app/bistro-de-leie/instellingen");
await page.screenshot({ path: `${shots}/11-instellingen.png`, fullPage: true });
log("dashboard ok");
await browser.close();
