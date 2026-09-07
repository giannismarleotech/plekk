"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createSession } from "@/lib/auth";
import { createOrganisation, type Mode } from "@/lib/orgs";

/** Zelf een zaak aanmaken: eigenaar + zaak in één keer, daarna ingelogd naar het stappenplan. */
export async function register(form: FormData) {
  const g = (k: string) => String(form.get(k) ?? "").trim();
  const back = (msg: string) => redirect(`/registreren?error=${encodeURIComponent(msg)}&name=${encodeURIComponent(g("name"))}&mode=${g("mode")}&city=${encodeURIComponent(g("city"))}&ownerName=${encodeURIComponent(g("ownerName"))}&email=${encodeURIComponent(g("email"))}`);
  if (g("website")) redirect("/registreren"); // honeypot
  const mode = g("mode") as Mode;
  if (!["salon", "restaurant", "takeaway"].includes(mode)) back("Kies het type zaak.");
  if (g("name").length < 2) back("Vul de naam van je zaak in.");
  const email = g("email").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back("Vul een geldig e-mailadres in.");
  const password = String(form.get("password") ?? "");
  if (password.length < 8) back("Kies een wachtwoord van minstens 8 tekens.");
  if (form.get("terms") !== "on") back("Je moet akkoord gaan met de voorwaarden.");
  const db = await getDb();
  if (await db.query.users.findFirst({ where: eq(schema.users.email, email) })) back("Er bestaat al een account met dit e-mailadres. Log in.");
  const res = await createOrganisation({
    name: g("name"), mode, city: g("city"), email, phone: g("phone"), plan: "trial",
    locale: (["nl", "fr", "en", "de"].includes(g("locale")) ? g("locale") : "nl") as "nl" | "fr" | "en" | "de",
    owner: { name: g("ownerName") || g("name"), email, password },
  });
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (user) await createSession(user.id);
  redirect(`/app/${res.slug}/start?welkom=1`);
}
