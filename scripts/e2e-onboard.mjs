import { chromium } from "playwright";
const BASE = "http://localhost:3600";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const log = (...a) => console.log(...a);
await p.goto(`${BASE}/registreren`);
await p.click('label:has-text("Kapper / salon")');
await p.fill('input[name=name]', "Kapsalon Test Nevele");
await p.fill('input[name=city]', "Nevele");
await p.fill('input[name=phone]', "+32 9 123 45 67");
await p.fill('input[name=ownerName]', "Giannis");
await p.fill('input[name=email]', "giannis+test@marleo.tech");
await p.fill('input[name=password]', "testtest1");
await p.check('input[name=terms]');
await Promise.all([p.waitForURL(/\/start\?welkom=1/), p.click('button:has-text("Start gratis")')]);
log("registered →", p.url());
const slug = p.url().match(/\/app\/([^/]+)\/start/)[1];
await p.screenshot({ path: "/tmp/ob1.png", fullPage: true });
log("checklist:", await p.locator("ol li p.font-bold").allInnerTexts());
log("nav:", await p.locator("aside a").allInnerTexts());
// fill settings: address + email
await p.goto(`${BASE}/app/${slug}/instellingen`);
await p.fill('input[name=address]', "Dorpsstraat 1");
await p.fill('input[name=email]', "giannis+test@marleo.tech");
await p.fill('input[name=brandColor]', "#c02c5c");
await p.click('button:has-text("Opslaan")');
await p.waitForTimeout(800);
// add service
await p.goto(`${BASE}/app/${slug}/aanbod`);
await p.click('summary:has-text("+ Toevoegen")');
const form = p.locator('form').filter({ has: p.locator('button:has-text("Toevoegen")') }).first();
await form.locator('input[name=name]').fill("Knippen heren");
await form.locator('input[name=category]').fill("Knippen");
await form.locator('input[name=durationMin]').fill("30");
await form.locator('input[name=price]').fill("25");
await form.locator('button:has-text("Toevoegen")').click();
await p.waitForTimeout(800);
// rename staff
await p.click('summary:has-text("Giannis")').catch(()=>{});
await p.goto(`${BASE}/app/${slug}/start`);
log("done steps:", await p.locator("ol li span:has-text('✓')").count(), "/", await p.locator("ol li").count());
log("progress text:", await p.locator("text=/van \\d+ klaar/").innerText());
// public booking
await p.goto(`${BASE}/z/${slug}`);
await p.click('text=Knippen heren');
await p.waitForTimeout(1500);
let slots = p.locator("form section").nth(1).locator("button.tabular");
for (let i = 0; i < 6 && (await slots.count()) === 0; i++) { await p.locator("form section").nth(1).locator("button").nth(i).click(); await p.waitForTimeout(1200); }
log("slots:", await slots.count());
await slots.first().click();
await p.fill("#name", "Test Klant"); await p.fill("#phone", "+32470000000"); await p.fill("#email", "klant@test.be");
await Promise.all([p.waitForURL(/bevestigd/), p.click('button:has-text("Afspraak bevestigen")')]);
log("booked →", p.url());
await p.goto(`${BASE}/app/${slug}/start`);
log("done after booking:", await p.locator("ol li span:has-text('✓')").count());
await p.screenshot({ path: "/tmp/ob2.png", fullPage: true });
// login page
await p.goto(`${BASE}/login`); log("login page has register link:", await p.locator('a[href="/registreren"]').count());
await b.close();
