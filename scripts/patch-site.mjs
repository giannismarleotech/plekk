/**
 * Kuist de statische marketingsite op, meteen na het uitpakken.
 *
 * De site komt zoals ze is uit vendor/marketing-site.tar.gz. Dat archief blijft
 * onaangeroerd — alle correcties staan hier, als leesbare code:
 *
 *   1. canonical- en hreflang-links wezen naar het oude ChatGPT-adres;
 *   2. teksten noemden Plekk nog een prototype waar niets echt werkt (boekingen,
 *      betalingen en abonnementen lopen intussen wel);
 *   3. er waren geen juridische pagina's — zonder algemene voorwaarden en
 *      privacyverklaring mag je in België geen abonnementen verkopen, en Stripe
 *      vraagt er expliciet naar;
 *   4. er was geen sitemap of robots.txt.
 *
 * De teksten zelf staan in scripts/site-content.json, zodat dit bestand over de
 * bewerking gaat en niet over de inhoud.
 *
 * Draait automatisch na scripts/unpack-site.mjs (npm "predev" en "prebuild").
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(root, "public");
const content = JSON.parse(readFileSync(path.join(root, "scripts", "site-content.json"), "utf8"));
const { domain: DOMAIN, langs: LANGS, swaps: SWAPS, legal: LEGAL, footerLabel: FOOTER_LABEL, updated: UPDATED, date: DATE } = content;

/** Alle bestanden onder een map die aan het filter voldoen. */
function walk(dir, keep, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, keep, out);
    else if (keep(p)) out.push(p);
  }
  return out;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Bouwt een juridische pagina met exact dezelfde kop, navigatie en voettekst als de rest. */
function buildLegalPage(lang, kind, shell) {
  const spec = LEGAL[lang][kind];
  const headEnd = shell.indexOf("</head>");
  const bodyStart = shell.indexOf('<main id="main">');
  const footerStart = shell.indexOf("<footer");

  let head = shell.slice(0, headEnd);
  const chrome = shell.slice(headEnd + "</head>".length, bodyStart);
  const footer = shell.slice(footerStart);

  const url = `https://${DOMAIN}/${lang}/${spec.slug}/`;
  head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(spec.title)} | Plekk</title>`);
  head = head.replace(/<meta name="description" content="[\s\S]*?">/, `<meta name="description" content="${esc(spec.lede)}">`);
  head = head.replace(/<link rel="canonical" href="[\s\S]*?">/, `<link rel="canonical" href="${url}">`);
  // Elke taalversie wijst naar de juiste vertaling van dezelfde juridische pagina.
  head = head.replace(/<link rel="alternate" hreflang="([\w-]+)" href="[\s\S]*?">/g, (_m, hl) => {
    const l = hl === "x-default" ? "nl" : hl;
    return `<link rel="alternate" hreflang="${hl}" href="https://${DOMAIN}/${l}/${LEGAL[l][kind].slug}/">`;
  });

  const body = [
    '<main id="main"><article class="wrap legal">',
    `<p class="eyebrow">Plekk</p><h1>${esc(spec.title)}</h1>`,
    `<p class="legal-lede">${esc(spec.lede)}</p>`,
    `<p class="legal-date">${UPDATED[lang]}: ${DATE[lang]}</p>`,
  ];
  for (const [title, paras] of spec.sections) {
    body.push(`<h2>${esc(title)}</h2>`);
    for (const p of paras) body.push(`<p>${esc(p)}</p>`);
  }
  body.push("</article></main>\n");

  // Kleuren expliciet: de site kleurt paragrafen in sommige secties mee met het blok
  // eromheen, en op een juridische pagina moet de tekst gewoon leesbaar zwart zijn.
  const style =
    "<style>.legal{max-width:44rem;padding-block:clamp(3rem,7vw,5.5rem);color:#101814}" +
    ".legal h1{margin:.35rem 0 0;color:#101814}" +
    ".legal-lede{font-size:1.15rem;margin:.9rem 0 0;color:#101814}" +
    ".legal-date{color:#5c645e;font-size:.85rem;margin:.4rem 0 2.5rem}" +
    ".legal h2{font-size:1.25rem;margin:2.4rem 0 .7rem;color:#101814}" +
    ".legal p{margin:0 0 .85rem;line-height:1.65;color:#2a332d}" +
    ".legal a{color:inherit}</style>";

  return head + style + "</head>" + chrome + body.join("") + footer;
}

/** Zet de juridische links in de onderste balk van de voettekst — verplicht op elke pagina. */
function addFooterLinks(html, lang) {
  const terms = LEGAL[lang].terms.slug;
  const privacy = LEGAL[lang].privacy.slug;
  if (html.includes(`/${lang}/${terms}/`)) return html;
  const [tLabel, pLabel] = FOOTER_LABEL[lang];
  const links = `<a href="/${lang}/${terms}/">${tLabel}</a><a href="/${lang}/${privacy}/">${pLabel}</a>`;
  return html.replace('<div class="wrap footer-bottom">', `<div class="wrap footer-bottom">${links}`);
}

function main() {
  let pages = walk(SITE, (p) => p.endsWith("index.html"));

  // 1 + 2: adres en teksten in de pagina's
  for (const p of pages) {
    const lang = path.relative(SITE, p).split(path.sep)[0];
    if (!LANGS.includes(lang)) continue;
    const original = readFileSync(p, "utf8");
    let s = original.replaceAll("plekk-studio.giannis111020.chatgpt.site", DOMAIN).replaceAll("custom-domains.chatgpt.site", DOMAIN);
    for (const [oldText, newText] of SWAPS[lang]) s = s.replaceAll(oldText, newText);
    s = addFooterLinks(s, lang);
    if (s !== original) writeFileSync(p, s);
  }

  // Dezelfde teksten zitten ook in de JS-bestanden: die voeden het navigeren zonder
  // herladen en het wisselen van taal. Sla je die over, dan springt de oude tekst
  // terug zodra de bezoeker doorklikt.
  for (const name of ["pages.js", "pages-data.js", "i18n-data.js", "app.js", "growth.js"]) {
    const f = path.join(SITE, name);
    let original;
    try { original = readFileSync(f, "utf8"); } catch { continue; }
    let s = original.replaceAll("plekk-studio.giannis111020.chatgpt.site", DOMAIN);
    for (const lang of LANGS) {
      for (const [oldText, newText] of SWAPS[lang]) {
        s = s.replaceAll(oldText, newText);
        // In JS-strings staan aanhalingstekens ontsnapt.
        s = s.replaceAll(oldText.replaceAll('"', '\\"'), newText.replaceAll('"', '\\"'));
      }
    }
    if (s !== original) writeFileSync(f, s);
  }

  // 3: juridische pagina's
  let made = 0;
  for (const lang of LANGS) {
    const shell = readFileSync(path.join(SITE, lang, "over-plekk", "index.html"), "utf8");
    for (const kind of ["terms", "privacy"]) {
      const dir = path.join(SITE, lang, LEGAL[lang][kind].slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, "index.html"), buildLegalPage(lang, kind, shell));
      made++;
    }
  }

  // 4: sitemap en robots
  pages = walk(SITE, (p) => p.endsWith("index.html"));
  const urls = pages
    .map((p) => path.relative(SITE, path.dirname(p)).split(path.sep).join("/"))
    .filter((rel) => rel && rel !== ".")
    .sort()
    .map((rel) => `https://${DOMAIN}/${rel}/`);
  writeFileSync(
    path.join(SITE, "sitemap.xml"),
    ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((u) => `<url><loc>${u}</loc><changefreq>weekly</changefreq></url>`), "</urlset>", ""].join("\n"),
  );
  writeFileSync(
    path.join(SITE, "robots.txt"),
    `User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /beheer\n\nSitemap: https://${DOMAIN}/sitemap.xml\n`,
  );

  const leftovers = walk(SITE, (p) => p.endsWith(".html") || p.endsWith(".js"))
    .filter((p) => readFileSync(p, "utf8").includes("chatgpt.site")).length;
  console.log(`[site] ${pages.length} pagina's, ${made} juridische pagina's, sitemap met ${urls.length} adressen` +
    (leftovers ? `, LET OP: ${leftovers} bestand(en) verwijzen nog naar chatgpt.site` : ""));
}

main();
