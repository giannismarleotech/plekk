import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/db";
export { hashPassword, verifyPassword } from "./password";

const COOKIE = "plekk_session";
const secret = () => process.env.AUTH_SECRET ?? "dev-secret-verander-mij-in-productie";

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createSession(userId: string) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const payload = `${userId}.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [userId, exp, sig] = token.split(".");
  if (!userId || !exp || !sig) return null;
  if (sign(`${userId}.${exp}`) !== sig || Number(exp) < Date.now()) return null;
  const db = await getDb();
  return (await db.query.users.findFirst({ where: eq(schema.users.id, userId) })) ?? null;
}

/** Geeft de organisatie terug als de ingelogde gebruiker er toegang toe heeft, anders null. */
export async function requireOrgAccess(slug: string) {
  const user = await currentUser();
  if (!user) return null;
  const db = await getDb();
  const org = await db.query.organisations.findFirst({ where: eq(schema.organisations.slug, slug) });
  if (!org) return null;
  if (user.isPlatformAdmin) return { user, org };
  const m = await db.query.memberships.findFirst({ where: and(eq(schema.memberships.userId, user.id), eq(schema.memberships.orgId, org.id)) });
  return m ? { user, org } : null;
}

export async function orgsForUser(userId: string, isAdmin: boolean) {
  const db = await getDb();
  if (isAdmin) return db.query.organisations.findMany({ orderBy: (o, { asc }) => asc(o.name) });
  const ms = await db.query.memberships.findMany({ where: eq(schema.memberships.userId, userId), with: { org: true } });
  return ms.map((m) => m.org);
}
