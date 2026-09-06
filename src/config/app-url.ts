/**
 * Links naar het app-gedeelte (boekingspagina's, login, demo-dashboard).
 * Op een statische host (GitHub Pages) draait de app niet; zet dan NEXT_PUBLIC_APP_BASE op de URL waar de app wél draait
 * (bv. https://plekk.netlify.app). Zonder die waarde in statische modus verwijzen de knoppen naar de contactpagina.
 */
export const APP_BASE = (process.env.NEXT_PUBLIC_APP_BASE ?? "").replace(/\/$/, "");
export const STATIC_SITE = process.env.STATIC_SITE === "1";
export const appAvailable = !STATIC_SITE || APP_BASE !== "";
export const appUrl = (path: string, fallback = "#demo-offline") => (appAvailable ? `${APP_BASE}${path}` : fallback);
