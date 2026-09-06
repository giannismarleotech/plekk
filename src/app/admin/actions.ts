"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { createOrganisation, setUserPassword, randomPassword, type Mode } from "@/lib/orgs";
import { getDb, schema } from "@/db";
import { id } from "@/lib/ids";

async function admin() {
  const u = await currentUser();
  if (!u?.isPlatformAdmin) throw new Error("Alleen voor platformbeheerders");
  return u;
}

export async function createOrgAction(form: FormData) {
  await admin();
  const g = (k: string) => String(form.get(k) ?? "").trim();
  const res = await createOrganisation({
    name: g("name"), slug: g("slug"), mode: g("mode") as Mode, city: g("city"), address: g("address"), phone: g("phone"), email: g("email"),
    brandColor: g("brandColor"), locale: (g("locale") || "nl") as "nl" | "fr" | "en" | "de", plan: g("plan") || "founders",
    owner: g("ownerEmail") ? { name: g("ownerName"), email: g("ownerEmail"), password: g("ownerPassword") || undefined } : undefined,
  });
  revalidatePath("/admin");
  redirect(`/admin?created=${res.slug}${res.password ? `&pw=${encodeURIComponent(res.password)}` : ""}`);
}

export async function resetOwnerPassword(orgId: string) {
  await admin();
  const db = await getDb();
  const m = await db.query.memberships.findFirst({ where: and(eq(schema.memberships.orgId, orgId), eq(schema.memberships.role, "owner")), with: { user: true } });
  if (!m) return { ok: false as const, error: "Geen eigenaar gekoppeld" };
  if (m.user.isPlatformAdmin) return { ok: false as const, error: "Eigenaar is platformbeheerder; wijzig via je eigen instellingen" };
  const pw = randomPassword();
  await setUserPassword(m.userId, pw);
  return { ok: true as const, email: m.user.email, password: pw };
}

export async function addOwner(orgId: string, form: FormData) {
  await admin();
  const db = await getDb();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim() || email;
  if (!email) return;
  let user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  let pw: string | undefined;
  if (!user) {
    pw = randomPassword();
    const { hashPassword } = await import("@/lib/password");
    const uid = id();
    await db.insert(schema.users).values({ id: uid, email, name, passwordHash: hashPassword(pw) });
    user = (await db.query.users.findFirst({ where: eq(schema.users.id, uid) }))!;
  }
  const existing = await db.query.memberships.findFirst({ where: and(eq(schema.memberships.userId, user.id), eq(schema.memberships.orgId, orgId)) });
  if (!existing) await db.insert(schema.memberships).values({ id: id(), userId: user.id, orgId, role: "owner" });
  revalidatePath("/admin");
  redirect(`/admin?owner=${encodeURIComponent(email)}${pw ? `&pw=${encodeURIComponent(pw)}` : ""}`);
}

export async function setPlan(orgId: string, plan: string) {
  await admin();
  const db = await getDb();
  await db.update(schema.organisations).set({ plan }).where(eq(schema.organisations.id, orgId));
  revalidatePath("/admin");
}
