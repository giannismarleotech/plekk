import { NextResponse } from "next/server";
import { site } from "@/config/site";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  if (b.website) return NextResponse.json({ ok: true }); // honeypot
  if (!b.name || !b.email) return NextResponse.json({ ok: false }, { status: 400 });
  const text = `Naam: ${b.name}\nE-mail: ${b.email}\nZaak: ${b.business ?? ""}\nType: ${b.type ?? ""}\n\n${b.message ?? ""}`;
  if (!process.env.RESEND_API_KEY) { console.log(`[contact]\n${text}`); return NextResponse.json({ ok: true }); }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM ?? `${site.name} <no-reply@${site.domain}>`, to: process.env.CONTACT_TO ?? site.supportEmail, reply_to: b.email, subject: `Contact via plekk.be: ${b.business || b.name}`, text }),
  });
  return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
